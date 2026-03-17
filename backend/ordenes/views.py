# ordenes/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.http import HttpResponse
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER
import io
from .models import OrdenTrabajo, HistorialOrden
from .serializers import OrdenTrabajoSerializer, ResumenTecnicoSerializer, HistorialOrdenSerializer
from usuarios.permissions import IsAdmin, IsAdminOrTecnico


class OrdenTrabajoViewSet(viewsets.ModelViewSet):
    serializer_class   = OrdenTrabajoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends    = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields   = ['estado', 'pagado', 'tecnico', 'equipo__tipo']
    search_fields      = ['problema_reportado', 'equipo__marca', 'equipo__modelo',
                          'equipo__cliente__usuario__first_name']
    ordering_fields    = ['fecha_ingreso', 'fecha_egreso', 'estado', 'importe_mano_obra']

    def get_queryset(self):
        user = self.request.user
        if user.rol == 'admin':
            return OrdenTrabajo.objects.select_related(
                'equipo__cliente__usuario', 'tecnico__usuario'
            ).all().order_by('-fecha_creacion')
        if user.rol == 'tecnico':
            return OrdenTrabajo.objects.filter(
                tecnico__usuario=user
            ).select_related('equipo__cliente__usuario', 'tecnico__usuario')
        if user.rol == 'cliente':
            return OrdenTrabajo.objects.filter(
                equipo__cliente__usuario=user
            ).select_related('equipo__cliente__usuario', 'tecnico__usuario')
        return OrdenTrabajo.objects.none()

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [IsAdmin()]
        if self.action in ['update', 'partial_update']:
            return [IsAdminOrTecnico()]
        return [IsAuthenticated()]

    # ── Guardar usuario modificador ──────────────────────────────────────────
    def perform_update(self, serializer):
        serializer.instance._usuario_modificador = self.request.user
        serializer.save()

    def perform_create(self, serializer):
        instance = serializer.save()
        instance._usuario_modificador = self.request.user

    # ── Historial ────────────────────────────────────────────────────────────
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def historial(self, request, pk=None):
        orden    = self.get_object()
        entradas = HistorialOrden.objects.filter(orden=orden).select_related('usuario')
        return Response(HistorialOrdenSerializer(entradas, many=True).data)

    # ── Estadísticas ─────────────────────────────────────────────────────────
    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def estadisticas(self, request):
        from django.db.models import Sum, Count
        from django.utils import timezone

        hoy        = timezone.now().date()
        inicio_mes = hoy.replace(day=1)
        qs         = OrdenTrabajo.objects.all()

        stats = {
            'total_ordenes':   qs.count(),
            'en_proceso':      qs.filter(estado__in=[
                                   'ingresado', 'diagnostico',
                                   'en_reparacion', 'esperando_repuesto',
                               ]).count(),
            'listas':          qs.filter(estado='listo').count(),
            'entregadas_mes':  qs.filter(estado='entregado', fecha_egreso__gte=inicio_mes).count(),
            'pendientes_pago': qs.filter(pagado=False, estado='entregado').count(),
            'total_cobrado':   float(
                qs.filter(pagado=True).aggregate(
                    t=Sum('importe_mano_obra') + Sum('importe_repuestos')
                )['t'] or 0
            ),
            'cobrado_mes':     float(
                qs.filter(pagado=True, fecha_pago__gte=inicio_mes).aggregate(
                    t=Sum('importe_mano_obra') + Sum('importe_repuestos')
                )['t'] or 0
            ),
            'por_estado': {
                e['estado']: e['total']
                for e in qs.values('estado').annotate(total=Count('id'))
            },
        }
        return Response(stats)

    # ── Generar PDF ───────────────────────────────────────────────────────────
    @action(detail=True, methods=['get'])
    def generar_pdf(self, request, pk=None):
        orden  = self.get_object()
        buffer = io.BytesIO()
        doc    = SimpleDocTemplate(
            buffer, pagesize=A4,
            rightMargin=2*cm, leftMargin=2*cm,
            topMargin=2*cm,   bottomMargin=2*cm,
        )
        styles = getSampleStyleSheet()
        story  = []

        titulo_style = ParagraphStyle(
            'titulo', parent=styles['Title'],
            fontSize=20, textColor=colors.HexColor('#1e293b'),
            spaceAfter=6, alignment=TA_CENTER,
        )
        subtitulo_style = ParagraphStyle(
            'subtitulo', parent=styles['Normal'],
            fontSize=11, textColor=colors.HexColor('#64748b'),
            spaceAfter=20, alignment=TA_CENTER,
        )
        seccion_style = ParagraphStyle(
            'seccion', parent=styles['Normal'],
            fontSize=12, textColor=colors.HexColor('#0f172a'),
            spaceBefore=14, spaceAfter=6, fontName='Helvetica-Bold',
        )
        normal_style = ParagraphStyle(
            'normal_custom', parent=styles['Normal'],
            fontSize=10, textColor=colors.HexColor('#334155'),
        )

        story.append(Paragraph("TALLER TÉCNICO", titulo_style))
        story.append(Paragraph(f"Orden de Trabajo N° {orden.id:04d}", subtitulo_style))
        story.append(Spacer(1, 0.3*cm))

        cliente = orden.equipo.cliente
        equipo  = orden.equipo
        tecnico = orden.tecnico

        datos_tabla = [
            ['DATOS DEL CLIENTE', '', 'DATOS DEL EQUIPO', ''],
            ['Nombre:',   cliente.usuario.get_full_name(),  'Tipo:',        equipo.get_tipo_display()],
            ['Email:',    cliente.usuario.email,            'Marca/Modelo:', f"{equipo.marca} {equipo.modelo}"],
            ['Teléfono:', cliente.usuario.telefono or '-',  'N° Serie:',    equipo.numero_serie or '-'],
            ['DNI:',      cliente.dni or '-',               'S.O.:',        equipo.sistema_operativo or '-'],
        ]
        t = Table(datos_tabla, colWidths=[3.5*cm, 5.5*cm, 3.5*cm, 5.5*cm])
        t.setStyle(TableStyle([
            ('BACKGROUND',     (0, 0), (1, 0),   colors.HexColor('#0f172a')),
            ('BACKGROUND',     (2, 0), (3, 0),   colors.HexColor('#0f172a')),
            ('TEXTCOLOR',      (0, 0), (-1, 0),  colors.white),
            ('FONTNAME',       (0, 0), (-1, 0),  'Helvetica-Bold'),
            ('FONTSIZE',       (0, 0), (-1, -1), 9),
            ('FONTNAME',       (0, 1), (0, -1),  'Helvetica-Bold'),
            ('FONTNAME',       (2, 1), (2, -1),  'Helvetica-Bold'),
            ('GRID',           (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('VALIGN',         (0, 0), (-1, -1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1),
             [colors.HexColor('#f8fafc'), colors.HexColor('#f1f5f9')]),
            ('PADDING',        (0, 0), (-1, -1), 6),
        ]))
        story.append(t)
        story.append(Spacer(1, 0.5*cm))

        story.append(Paragraph("DETALLES DE LA ORDEN", seccion_style))
        detalles = [
            ['Fecha Ingreso:', str(orden.fecha_ingreso),
             'Fecha Egreso:', str(orden.fecha_egreso) if orden.fecha_egreso else 'Pendiente'],
            ['Estado:', orden.get_estado_display(),
             'Técnico:', tecnico.usuario.get_full_name() if tecnico else '-'],
            ['Problema Reportado:', Paragraph(orden.problema_reportado, normal_style), '', ''],
            ['Diagnóstico:', Paragraph(orden.diagnostico or '-', normal_style), '', ''],
            ['Solución Aplicada:', Paragraph(orden.solucion_aplicada or '-', normal_style), '', ''],
        ]
        t2 = Table(detalles, colWidths=[4*cm, 6.5*cm, 3.5*cm, 4*cm])
        t2.setStyle(TableStyle([
            ('FONTNAME',       (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME',       (2, 0), (2, 1),  'Helvetica-Bold'),
            ('FONTSIZE',       (0, 0), (-1, -1), 9),
            ('SPAN',           (1, 2), (3, 2)),
            ('SPAN',           (1, 3), (3, 3)),
            ('SPAN',           (1, 4), (3, 4)),
            ('GRID',           (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('ROWBACKGROUNDS', (0, 0), (-1, -1),
             [colors.HexColor('#f8fafc'), colors.HexColor('#f1f5f9')]),
            ('VALIGN',         (0, 0), (-1, -1), 'TOP'),
            ('PADDING',        (0, 0), (-1, -1), 6),
        ]))
        story.append(t2)
        story.append(Spacer(1, 0.5*cm))

        story.append(Paragraph("COSTOS", seccion_style))
        costos = [
            ['Concepto',       'Importe'],
            ['Mano de Obra',   f"$ {orden.importe_mano_obra:.2f}"],
            ['Repuestos',      f"$ {orden.importe_repuestos:.2f}"],
            ['TOTAL',          f"$ {orden.total:.2f}"],
            ['Estado de Pago', '✓ PAGADO' if orden.pagado else '✗ PENDIENTE'],
        ]
        t3 = Table(costos, colWidths=[10*cm, 8*cm])
        t3.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0),  colors.HexColor('#0f172a')),
            ('TEXTCOLOR',  (0, 0), (-1, 0),  colors.white),
            ('FONTNAME',   (0, 0), (-1, 0),  'Helvetica-Bold'),
            ('FONTNAME',   (0, 3), (-1, 3),  'Helvetica-Bold'),
            ('FONTSIZE',   (0, 3), (-1, 3),  11),
            ('BACKGROUND', (0, 3), (-1, 3),  colors.HexColor('#e2e8f0')),
            ('BACKGROUND', (0, 4), (-1, 4),
             colors.HexColor('#dcfce7') if orden.pagado else colors.HexColor('#fee2e2')),
            ('TEXTCOLOR',  (0, 4), (-1, 4),
             colors.HexColor('#166534') if orden.pagado else colors.HexColor('#991b1b')),
            ('FONTNAME',   (0, 4), (-1, 4),  'Helvetica-Bold'),
            ('GRID',       (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('ALIGN',      (1, 0), (1, -1),  'RIGHT'),
            ('ROWBACKGROUNDS', (0, 1), (-1, 2),
             [colors.HexColor('#f8fafc'), colors.HexColor('#f1f5f9')]),
            ('PADDING',    (0, 0), (-1, -1), 8),
        ]))
        story.append(t3)
        story.append(Spacer(1, 0.7*cm))

        if orden.fecha_egreso and orden.meses_garantia > 0:
            from dateutil.relativedelta import relativedelta
            fecha_venc     = orden.fecha_egreso + relativedelta(months=orden.meses_garantia)
            garantia_style = ParagraphStyle(
                'garantia', parent=styles['Normal'],
                fontSize=10, textColor=colors.HexColor('#1e40af'),
                backColor=colors.HexColor('#dbeafe'),
                borderPad=10, leading=16,
                borderColor=colors.HexColor('#93c5fd'),
                borderWidth=1, borderRadius=4,
            )
            story.append(Paragraph(
                f"GARANTÍA: Este equipo cuenta con {orden.meses_garantia} "
                f"mes(es) de garantía sobre la reparación realizada. "
                f"Válida hasta el {fecha_venc.strftime('%d/%m/%Y')}.",
                garantia_style,
            ))
        story.append(Spacer(1, 1*cm))

        firma_data = [
            ['', ''],
            ['_________________________', '_________________________'],
            ['Firma del Técnico', 'Firma del Cliente'],
        ]
        t4 = Table(firma_data, colWidths=[9*cm, 9*cm])
        t4.setStyle(TableStyle([
            ('ALIGN',      (0, 0), (-1, -1), 'CENTER'),
            ('FONTSIZE',   (0, 0), (-1, -1), 9),
            ('TOPPADDING', (0, 1), (-1, 1),  20),
        ]))
        story.append(t4)

        doc.build(story)
        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="orden_{orden.id:04d}.pdf"'
        return response

    # ── Resumen técnico ───────────────────────────────────────────────────────
    @action(detail=True, methods=['get'])
    def resumen_tecnico(self, request, pk=None):
        orden = self.get_object()
        user  = request.user
        if user.rol == 'tecnico' and (not orden.tecnico or orden.tecnico.usuario != user):
            return Response({'error': 'No tenés acceso a esta orden.'}, status=403)
        return Response(ResumenTecnicoSerializer(orden).data)