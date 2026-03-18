# presupuestos/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.http import HttpResponse

from .models import Presupuesto, ItemPresupuesto
from .serializers import (
    PresupuestoListSerializer,
    PresupuestoDetailSerializer,
    PresupuestoCreateSerializer,
)


class PresupuestoViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return PresupuestoCreateSerializer
        if self.action == 'retrieve':
            return PresupuestoDetailSerializer
        return PresupuestoListSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Presupuesto.objects.prefetch_related('items').select_related('cliente', 'equipo')
        if user.rol == 'cliente':
            return qs.filter(cliente=user).exclude(estado='borrador')
        return qs

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)

    # ── POST /presupuestos/{id}/enviar/ ─────────────────
    @action(detail=True, methods=['post'])
    def enviar(self, request, pk=None):
        pres = self.get_object()
        if pres.estado != 'borrador':
            return Response({'error': 'Solo se pueden enviar presupuestos en borrador.'}, status=400)
        if not pres.items.exists():
            return Response({'error': 'Agregá al menos un ítem antes de enviar.'}, status=400)

        pres.estado      = 'enviado'
        pres.fecha_envio = timezone.now()
        pres.save(update_fields=['estado', 'fecha_envio'])

        self._notificar_cliente(pres)
        self._enviar_email(pres)

        return Response(PresupuestoDetailSerializer(pres, context={'request': request}).data)

    # ── POST /presupuestos/{id}/aprobar/ ────────────────
    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        pres = self.get_object()
        user = request.user

        # Cliente o admin pueden aprobar
        if user.rol == 'cliente' and pres.cliente != user:
            return Response({'error': 'No autorizado.'}, status=403)
        if pres.estado != 'enviado':
            return Response({'error': 'Solo se pueden aprobar presupuestos enviados.'}, status=400)
        if pres.vencido:
            return Response({'error': 'Este presupuesto ya venció.'}, status=400)

        pres.estado          = 'aprobado'
        pres.fecha_respuesta = timezone.now()
        pres.save(update_fields=['estado', 'fecha_respuesta'])

        self._notificar_admins(pres, 'aprobado')
        return Response(PresupuestoDetailSerializer(pres, context={'request': request}).data)

    # ── POST /presupuestos/{id}/rechazar/ ───────────────
    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        pres = self.get_object()
        user = request.user

        if user.rol == 'cliente' and pres.cliente != user:
            return Response({'error': 'No autorizado.'}, status=403)
        if pres.estado != 'enviado':
            return Response({'error': 'Solo se pueden rechazar presupuestos enviados.'}, status=400)

        pres.estado          = 'rechazado'
        pres.fecha_respuesta = timezone.now()
        pres.motivo_rechazo  = request.data.get('motivo', '')
        pres.save(update_fields=['estado', 'fecha_respuesta', 'motivo_rechazo'])

        self._notificar_admins(pres, 'rechazado')
        return Response(PresupuestoDetailSerializer(pres, context={'request': request}).data)

    # ── POST /presupuestos/{id}/convertir/ ──────────────
    @action(detail=True, methods=['post'])
    def convertir(self, request, pk=None):
        """Convierte el presupuesto aprobado en una OrdenTrabajo."""
        pres = self.get_object()
        if pres.estado != 'aprobado':
            return Response({'error': 'Solo se pueden convertir presupuestos aprobados.'}, status=400)
        if pres.orden_id:
            return Response({'error': 'Ya fue convertido a la orden #' + str(pres.orden_id).zfill(4)}, status=400)

        from ordenes.models import OrdenTrabajo
        orden = OrdenTrabajo.objects.create(
            equipo              = pres.equipo,
            problema_reportado  = pres.titulo,
            observaciones       = f'Generado desde presupuesto #{str(pres.numero).zfill(4)}.\n{pres.descripcion}',
            importe_mano_obra   = pres.total,
            estado              = 'ingresado',
        )
        pres.orden  = orden
        pres.estado = 'convertido'
        pres.save(update_fields=['orden', 'estado'])

        return Response({
            'mensaje': f'Orden #{str(orden.id).zfill(4)} creada correctamente.',
            'orden_id': orden.id,
        })

    # ── GET /presupuestos/{id}/pdf/ ──────────────────────
    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        from ordenes.pdf_generator import generar_pdf_presupuesto
        pres      = self.get_object()
        pdf_bytes = generar_pdf_presupuesto(pres)
        response  = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="presupuesto_{str(pres.numero).zfill(4)}.pdf"'
        return response


    # ── POST /presupuestos/solicitar/ ───────────────────
    @action(detail=False, methods=['post'], url_path='solicitar')
    def solicitar(self, request):
        """El cliente solicita un presupuesto describiendo su problema."""
        user = request.user
        if user.rol != 'cliente':
            return Response({'error': 'Solo los clientes pueden solicitar presupuestos.'}, status=403)

        equipo_id      = request.data.get('equipo')
        nota_solicitud = request.data.get('nota_solicitud', '')
        titulo         = request.data.get('titulo', 'Solicitud de presupuesto')

        if not nota_solicitud:
            return Response({'error': 'Describí el problema para solicitar un presupuesto.'}, status=400)

        pres = Presupuesto.objects.create(
            cliente          = user,
            equipo_id        = equipo_id or None,
            titulo           = titulo,
            nota_solicitud   = nota_solicitud,
            solicitud_cliente = True,
            estado           = 'borrador',
        )

        # Notificar a los admins
        self._notificar_admins_solicitud(pres)
        return Response(PresupuestoListSerializer(pres, context={'request': request}).data, status=201)

    def _notificar_admins_solicitud(self, pres):
        try:
            from notificaciones.utils import crear_notificacion
            from usuarios.models import Usuario
            nombre = pres.cliente.get_full_name() or pres.cliente.username
            admins = Usuario.objects.filter(rol='admin', activo=True)
            for admin in admins:
                crear_notificacion(
                    admin, 'sistema',
                    f'📋 Nueva solicitud de presupuesto',
                    f'{nombre} solicitó un presupuesto: "{pres.nota_solicitud[:80]}"',
                )
        except Exception:
            pass

    # ── helpers ─────────────────────────────────────────
    def _notificar_cliente(self, pres):
        try:
            from notificaciones.utils import crear_notificacion
            crear_notificacion(
                pres.cliente, 'sistema',
                f'📋 Nuevo presupuesto #{str(pres.numero).zfill(4)}',
                f'Tenés un presupuesto pendiente de revisión: {pres.titulo}. '
                f'Total: ${pres.total:,.2f}. Válido por {pres.validez_dias} días.',
            )
        except Exception:
            pass

    def _notificar_admins(self, pres, accion):
        try:
            from notificaciones.utils import crear_notificacion
            from usuarios.models import Usuario
            nombre   = pres.cliente.get_full_name() or pres.cliente.username
            emoji    = '✅' if accion == 'aprobado' else '❌'
            admins   = Usuario.objects.filter(rol='admin', activo=True)
            for admin in admins:
                crear_notificacion(
                    admin, 'sistema',
                    f'{emoji} Presupuesto #{str(pres.numero).zfill(4)} {accion}',
                    f'{nombre} {accion} el presupuesto "{pres.titulo}".',
                )
        except Exception:
            pass

    def _enviar_email(self, pres):
        try:
            from django.core.mail import send_mail
            from django.conf import settings
            taller = getattr(settings, 'TALLER_NOMBRE', 'TallerTech')
            nombre = pres.cliente.get_full_name() or pres.cliente.username
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            link = f'{frontend_url}/#/cliente/presupuestos'

            html = f"""
            <!DOCTYPE html>
            <html lang="es">
            <body style="margin:0;padding:0;background:#080c14;font-family:'Segoe UI',sans-serif;">
              <div style="max-width:560px;margin:40px auto;background:#111827;border:1px solid #1e2d40;border-radius:14px;overflow:hidden;">
                <div style="background:linear-gradient(135deg,#0891b2,#0d1421);padding:28px 32px;">
                  <h1 style="color:#fff;margin:0;font-size:20px;">{taller}</h1>
                  <p style="color:rgba(255,255,255,0.65);margin:6px 0 0;font-size:13px;">Nuevo presupuesto para revisar</p>
                </div>
                <div style="padding:32px;">
                  <h2 style="color:#f0f6fc;font-size:17px;margin:0 0 12px;">Hola, {nombre}</h2>
                  <p style="color:#8b9ab0;font-size:14px;line-height:1.6;margin:0 0 20px;">
                    Preparamos un presupuesto para vos. Podés revisarlo y aprobarlo o rechazarlo desde tu panel.
                  </p>
                  <div style="background:#0d1421;border:1px solid #1e2d40;border-radius:10px;padding:16px;margin-bottom:24px;">
                    <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;">PRESUPUESTO #{str(pres.numero).zfill(4)}</p>
                    <p style="margin:0 0 6px;color:#f0f6fc;font-weight:700;font-size:16px;">{pres.titulo}</p>
                    <p style="margin:0 0 12px;color:#8b9ab0;font-size:13px;">{pres.descripcion[:100] if pres.descripcion else ''}</p>
                    <div style="border-top:1px solid #1e2d40;padding-top:12px;display:flex;justify-content:space-between;">
                      <span style="color:#8b9ab0;font-size:13px;">Total</span>
                      <span style="color:#06b6d4;font-weight:700;font-size:18px;">${pres.total:,.2f}</span>
                    </div>
                    <p style="margin:8px 0 0;color:#4a5568;font-size:11px;">Válido por {pres.validez_dias} días</p>
                  </div>
                  <a href="{link}" style="display:inline-block;background:#06b6d4;color:#080c14;font-weight:700;padding:13px 28px;border-radius:8px;text-decoration:none;font-size:14px;">
                    Ver presupuesto
                  </a>
                </div>
                <div style="padding:16px 32px;border-top:1px solid #1e2d40;">
                  <p style="color:#4a5568;font-size:11px;margin:0;">© {taller}</p>
                </div>
              </div>
            </body>
            </html>
            """
            send_mail(
                subject=f'[{taller}] Nuevo presupuesto #{str(pres.numero).zfill(4)}',
                message=f'Tenés un presupuesto pendiente: {pres.titulo}. Total: ${pres.total:,.2f}. Ingresá a {link}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[pres.cliente.email],
                html_message=html,
                fail_silently=True,
            )
        except Exception:
            pass

    def _generar_pdf(self, pres):
        from io import BytesIO
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.units import mm
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
        from reportlab.lib.styles import ParagraphStyle
        from reportlab.lib.enums import TA_RIGHT, TA_CENTER, TA_LEFT
        from django.conf import settings

        buffer = BytesIO()
        doc    = SimpleDocTemplate(buffer, pagesize=A4,
                                   leftMargin=20*mm, rightMargin=20*mm,
                                   topMargin=20*mm, bottomMargin=20*mm)

        taller   = getattr(settings, 'TALLER_NOMBRE', 'TallerTech')
        tel      = getattr(settings, 'TALLER_TELEFONO', '')
        email_t  = getattr(settings, 'TALLER_EMAIL', '')

        # ── Estilos ─────────────────────────────────────
        CYAN  = colors.HexColor('#06b6d4')
        DARK  = colors.HexColor('#0d1421')
        GRAY  = colors.HexColor('#64748b')
        LIGHT = colors.HexColor('#f0f6fc')
        WHITE = colors.white

        def style(name, **kw):
            defaults = dict(fontName='Helvetica', fontSize=10, textColor=colors.HexColor('#1e293b'))
            defaults.update(kw)
            return ParagraphStyle(name, **defaults)

        S = {
            'titulo_doc': style('td', fontSize=22, fontName='Helvetica-Bold', textColor=DARK),
            'sub':        style('sub', fontSize=10, textColor=GRAY),
            'bold':       style('b', fontName='Helvetica-Bold'),
            'normal':     style('n'),
            'muted':      style('m', fontSize=9, textColor=GRAY),
            'right':      style('r', alignment=TA_RIGHT),
            'right_bold': style('rb', alignment=TA_RIGHT, fontName='Helvetica-Bold'),
            'center':     style('c', alignment=TA_CENTER),
            'total':      style('t', fontSize=14, fontName='Helvetica-Bold', textColor=CYAN, alignment=TA_RIGHT),
            'estado':     style('e', fontSize=11, fontName='Helvetica-Bold',
                               textColor=colors.HexColor('#10b981') if pres.estado == 'aprobado'
                               else colors.HexColor('#ef4444') if pres.estado == 'rechazado'
                               else CYAN),
        }

        story = []
        W = A4[0] - 40*mm  # ancho útil

        # ── Encabezado ──────────────────────────────────
        header_data = [[
            Paragraph(taller, S['titulo_doc']),
            Paragraph(f'PRESUPUESTO<br/><font size="22" color="#06b6d4">#{str(pres.numero).zfill(4)}</font>', S['right_bold']),
        ]]
        t = Table(header_data, colWidths=[W*0.55, W*0.45])
        t.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ]))
        story.append(t)

        # Info taller
        info_taller = f'{tel}  ·  {email_t}' if tel or email_t else ''
        if info_taller:
            story.append(Paragraph(info_taller, S['muted']))

        story.append(HRFlowable(width=W, thickness=1, color=CYAN, spaceAfter=10))

        # ── Datos cliente / fechas ───────────────────────
        nombre_c = pres.cliente.get_full_name() or pres.cliente.username
        email_c  = pres.cliente.email or ''
        tel_c    = getattr(pres.cliente, 'telefono', '') or ''
        equipo_s = ''
        if pres.equipo:
            eq = pres.equipo
            equipo_s = f'{eq.tipo} {eq.marca} {eq.modelo}'

        fecha_e = pres.fecha_envio.strftime('%d/%m/%Y') if pres.fecha_envio else '—'
        fecha_v = pres.fecha_vencimiento.strftime('%d/%m/%Y') if pres.fecha_vencimiento else '—'

        info_data = [
            [
                Paragraph('<b>CLIENTE</b>', S['muted']),
                Paragraph('<b>DETALLES</b>', S['muted']),
            ],
            [
                Paragraph(f'{nombre_c}<br/>{email_c}<br/>{tel_c}', S['normal']),
                Paragraph(
                    f'Fecha emisión: {fecha_e}<br/>'
                    f'Válido hasta: {fecha_v}<br/>'
                    f'Estado: <b>{pres.get_estado_display()}</b>'
                    + (f'<br/>Equipo: {equipo_s}' if equipo_s else ''),
                    S['normal'],
                ),
            ],
        ]
        t2 = Table(info_data, colWidths=[W*0.5, W*0.5])
        t2.setStyle(TableStyle([
            ('TOPPADDING',    (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('VALIGN',        (0,0), (-1,-1), 'TOP'),
            ('BACKGROUND',    (0,1), (-1,1), colors.HexColor('#f8fafc')),
            ('ROUNDEDCORNERS',(0,0), (-1,-1), 6),
        ]))
        story.append(t2)
        story.append(Spacer(1, 12))

        # ── Descripción ─────────────────────────────────
        if pres.descripcion:
            story.append(Paragraph('<b>Descripción del trabajo</b>', S['bold']))
            story.append(Spacer(1, 4))
            story.append(Paragraph(pres.descripcion, S['normal']))
            story.append(Spacer(1, 10))

        # ── Tabla de ítems ───────────────────────────────
        story.append(Paragraph('<b>Detalle de ítems</b>', S['bold']))
        story.append(Spacer(1, 6))

        items_header = [
            Paragraph('<b>Descripción</b>', S['bold']),
            Paragraph('<b>Cant.</b>', S['center']),
            Paragraph('<b>P. Unit.</b>', S['right_bold']),
            Paragraph('<b>Subtotal</b>', S['right_bold']),
        ]
        items_rows = [items_header]
        for item in pres.items.all():
            items_rows.append([
                Paragraph(item.descripcion, S['normal']),
                Paragraph(str(item.cantidad), S['center']),
                Paragraph(f'${item.precio_unit:,.2f}', S['right']),
                Paragraph(f'${item.subtotal:,.2f}', S['right']),
            ])

        col_w = [W*0.50, W*0.12, W*0.18, W*0.20]
        t3 = Table(items_rows, colWidths=col_w, repeatRows=1)
        t3.setStyle(TableStyle([
            ('BACKGROUND',    (0,0), (-1,0),  DARK),
            ('TEXTCOLOR',     (0,0), (-1,0),  WHITE),
            ('FONTNAME',      (0,0), (-1,0),  'Helvetica-Bold'),
            ('FONTSIZE',      (0,0), (-1,0),  9),
            ('TOPPADDING',    (0,0), (-1,-1), 7),
            ('BOTTOMPADDING', (0,0), (-1,-1), 7),
            ('LEFTPADDING',   (0,0), (-1,-1), 8),
            ('RIGHTPADDING',  (0,0), (-1,-1), 8),
            ('ROWBACKGROUNDS',(0,1), (-1,-1), [WHITE, colors.HexColor('#f8fafc')]),
            ('GRID',          (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(t3)
        story.append(Spacer(1, 10))

        # ── Total ────────────────────────────────────────
        totales = []
        totales.append(['TOTAL:', f'${pres.total:,.2f}'])

        totales_styled = []
        for i, row in enumerate(totales):
            is_total = i == len(totales) - 1
            totales_styled.append([
                Paragraph(row[0], S['right_bold'] if is_total else S['right']),
                Paragraph(row[1], S['total'] if is_total else S['right_bold']),
            ])

        t4 = Table(totales_styled, colWidths=[W*0.75, W*0.25])
        t4.setStyle(TableStyle([
            ('TOPPADDING',    (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('LINEABOVE',     (0,-1),(-1,-1), 1.5, CYAN),
        ]))
        story.append(t4)
        story.append(Spacer(1, 14))

        # ── Condiciones ──────────────────────────────────
        if pres.condiciones:
            story.append(HRFlowable(width=W, thickness=0.5, color=colors.HexColor('#e2e8f0'), spaceAfter=8))
            story.append(Paragraph('<b>Condiciones y garantía</b>', S['bold']))
            story.append(Spacer(1, 4))
            story.append(Paragraph(pres.condiciones, S['muted']))

        # ── Pie de página ────────────────────────────────
        story.append(Spacer(1, 20))
        story.append(HRFlowable(width=W, thickness=0.5, color=colors.HexColor('#e2e8f0'), spaceAfter=6))
        story.append(Paragraph(
            f'Este presupuesto es válido por {pres.validez_dias} días desde su emisión. '
            f'{taller} — {email_t}',
            S['muted'],
        ))

        doc.build(story)
        return buffer.getvalue()