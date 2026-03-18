# ordenes/pdf_generator.py
# PDF profesional — Blanco/negro clásico empresarial
# con logo, QR, firma, garantía y costos

from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm, cm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle,
    Paragraph, Spacer, HRFlowable, Image,
)
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from django.conf import settings
import os


# ── Paleta B&N profesional ─────────────────────────────
NEGRO       = colors.HexColor('#0f172a')
GRIS_OSCURO = colors.HexColor('#374151')
GRIS_MEDIO  = colors.HexColor('#6b7280')
GRIS_CLARO  = colors.HexColor('#e5e7eb')
GRIS_FONDO  = colors.HexColor('#f9fafb')
BLANCO      = colors.white
ACENTO      = colors.HexColor('#1e3a5f')   # azul marino oscuro


def _estilo(nombre, **kw):
    defaults = dict(fontName='Helvetica', fontSize=9, textColor=GRIS_OSCURO, leading=13)
    defaults.update(kw)
    return ParagraphStyle(nombre, **defaults)


def _qr_image(texto, size=28*mm):
    """Genera imagen QR en memoria. Requiere: pip install qrcode[pil]"""
    try:
        import qrcode
        from PIL import Image as PILImage
        qr = qrcode.QRCode(version=1, box_size=4, border=2)
        qr.add_data(texto)
        qr.make(fit=True)
        img_pil = qr.make_image(fill_color='black', back_color='white')
        buf = BytesIO()
        img_pil.save(buf, format='PNG')
        buf.seek(0)
        return Image(buf, width=size, height=size)
    except ImportError:
        # Fallback: cuadro con texto si no hay qrcode instalado
        return None


def _logo_image(height=14*mm):
    """Carga el logo del taller si existe."""
    posibles = [
        os.path.join(settings.BASE_DIR, 'static', 'logo_GY.png'),
        os.path.join(settings.BASE_DIR, 'media', 'logo_GY.png'),
    ]
    for path in posibles:
        if os.path.exists(path):
            try:
                return Image(path, height=height, width=height * 3)
            except Exception:
                pass
    return None


# ══════════════════════════════════════════════════════════
#  PDF ORDEN DE TRABAJO
# ══════════════════════════════════════════════════════════

def generar_pdf_orden(orden):
    """Retorna bytes del PDF de la orden de trabajo."""
    buffer = BytesIO()
    W, H   = A4
    M      = 18 * mm   # margen

    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=M, rightMargin=M,
        topMargin=M, bottomMargin=M,
    )

    taller    = getattr(settings, 'TALLER_NOMBRE', 'Taller Técnico')
    tel_t     = getattr(settings, 'TALLER_TELEFONO', '')
    email_t   = getattr(settings, 'TALLER_EMAIL', '')
    cliente   = orden.equipo.cliente
    equipo    = orden.equipo
    tecnico   = orden.tecnico
    ancho     = W - 2 * M

    S = {
        'titulo':   _estilo('t', fontSize=22, fontName='Helvetica-Bold', textColor=NEGRO),
        'sub':      _estilo('s', fontSize=9,  textColor=GRIS_MEDIO),
        'seccion':  _estilo('sc', fontSize=8, fontName='Helvetica-Bold', textColor=BLANCO,
                            leading=10),
        'label':    _estilo('l', fontSize=8, fontName='Helvetica-Bold', textColor=GRIS_OSCURO),
        'valor':    _estilo('v', fontSize=9, textColor=GRIS_OSCURO),
        'normal':   _estilo('n'),
        'small':    _estilo('sm', fontSize=7.5, textColor=GRIS_MEDIO),
        'center':   _estilo('c', alignment=TA_CENTER),
        'right':    _estilo('r', alignment=TA_RIGHT),
        'total_l':  _estilo('tl', fontSize=11, fontName='Helvetica-Bold', textColor=NEGRO),
        'total_v':  _estilo('tv', fontSize=13, fontName='Helvetica-Bold', textColor=NEGRO,
                            alignment=TA_RIGHT),
        'garantia': _estilo('g', fontSize=8, fontName='Helvetica-Bold', textColor=ACENTO,
                            alignment=TA_CENTER),
    }

    story = []

    # ── ENCABEZADO ──────────────────────────────────────
    logo = _logo_image()
    qr   = _qr_image(f'ORDEN-{str(orden.id).zfill(4)}')

    # Fila header: logo | info taller | QR
    header_izq = [
        [logo or Paragraph(f'<b>{taller}</b>', _estilo('tn', fontSize=16, fontName='Helvetica-Bold', textColor=NEGRO))],
        [Paragraph(taller if logo else '', S['sub'])],
        [Paragraph(tel_t, S['small'])],
        [Paragraph(email_t, S['small'])],
    ]

    header_der_content = []
    if qr:
        header_der_content.append([qr])
        header_der_content.append([Paragraph(f'ORDEN #{str(orden.id).zfill(4)}', _estilo('qrl', fontSize=7, alignment=TA_CENTER, textColor=GRIS_MEDIO))])

    t_header = Table(
        [[
            Table(header_izq, colWidths=[ancho * 0.55]),
            Paragraph(
                f'<b>ORDEN DE TRABAJO</b><br/>'
                f'<font size="22" color="#0f172a">#{str(orden.id).zfill(4)}</font>',
                _estilo('ot', fontSize=10, fontName='Helvetica-Bold', alignment=TA_RIGHT, textColor=GRIS_MEDIO, leading=28)
            ) if not qr else Table(header_der_content, colWidths=[ancho * 0.45]),
        ]],
        colWidths=[ancho * 0.55, ancho * 0.45],
    )
    t_header.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN',  (1,0), (1,0),  'RIGHT'),
    ]))
    story.append(t_header)
    story.append(Spacer(1, 4*mm))
    story.append(HRFlowable(width=ancho, thickness=2, color=NEGRO, spaceAfter=4*mm))

    # ── DATOS ORDEN ──────────────────────────────────────
    fecha_ing = orden.fecha_ingreso.strftime('%d/%m/%Y') if orden.fecha_ingreso else '—'
    fecha_eg  = orden.fecha_egreso.strftime('%d/%m/%Y') if orden.fecha_egreso else 'Pendiente'

    def seccion_header(texto):
        t = Table([[Paragraph(texto, S['seccion'])]], colWidths=[ancho])
        t.setStyle(TableStyle([
            ('BACKGROUND',    (0,0), (-1,-1), NEGRO),
            ('TOPPADDING',    (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('LEFTPADDING',   (0,0), (-1,-1), 8),
        ]))
        return t

    def fila(label, valor):
        return [Paragraph(label, S['label']), Paragraph(str(valor) if valor else '—', S['valor'])]

    # Sección cliente + equipo
    story.append(seccion_header('DATOS DEL CLIENTE Y EQUIPO'))
    story.append(Spacer(1, 1*mm))

    datos = Table([
        [
            Table([
                fila('Nombre completo:', cliente.usuario.get_full_name()),
                fila('DNI:',             cliente.dni or '—'),
                fila('Email:',           cliente.usuario.email),
                fila('Teléfono:',        cliente.usuario.telefono or '—'),
                fila('Dirección:',       cliente.direccion or '—'),
            ], colWidths=[ancho*0.25, ancho*0.25]),
            Table([
                fila('Tipo de equipo:', equipo.get_tipo_display() if hasattr(equipo, 'get_tipo_display') else equipo.tipo),
                fila('Marca / Modelo:', f'{equipo.marca} {equipo.modelo}'),
                fila('N° de serie:',    equipo.numero_serie or '—'),
                fila('Sistema Op.:',    equipo.sistema_operativo or '—'),
                fila('Técnico asig.:',  tecnico.usuario.get_full_name() if tecnico else 'Sin asignar'),
            ], colWidths=[ancho*0.25, ancho*0.25]),
        ]
    ], colWidths=[ancho*0.5, ancho*0.5])
    datos.setStyle(TableStyle([
        ('VALIGN',        (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING',    (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(datos)
    story.append(Spacer(1, 3*mm))

    # Sección tiempos + estado
    info_orden = Table([
        fila('Fecha de ingreso:', fecha_ing),
        fila('Fecha de egreso:',  fecha_eg),
        fila('Estado actual:',    orden.get_estado_display()),
        fila('Garantía:',         f'{orden.meses_garantia} mes(es)' if orden.meses_garantia else 'Sin garantía'),
    ], colWidths=[ancho*0.25, ancho*0.75])
    info_orden.setStyle(TableStyle([
        ('TOPPADDING',    (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('ROWBACKGROUNDS',(0,0), (-1,-1), [GRIS_FONDO, BLANCO]),
        ('GRID',          (0,0), (-1,-1), 0.3, GRIS_CLARO),
        ('LEFTPADDING',   (0,0), (-1,-1), 6),
    ]))
    story.append(info_orden)
    story.append(Spacer(1, 3*mm))

    # ── DIAGNÓSTICO Y SOLUCIÓN ───────────────────────────
    story.append(seccion_header('DIAGNÓSTICO Y SOLUCIÓN'))
    story.append(Spacer(1, 1*mm))

    def campo_texto(label, texto):
        t = Table([
            [Paragraph(label, S['label'])],
            [Paragraph(texto or 'Sin información registrada.', S['normal'])],
        ], colWidths=[ancho])
        t.setStyle(TableStyle([
            ('BACKGROUND',    (0,0), (0,0), GRIS_FONDO),
            ('BACKGROUND',    (0,1), (0,1), BLANCO),
            ('LEFTPADDING',   (0,0), (-1,-1), 8),
            ('TOPPADDING',    (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('BOX',           (0,0), (-1,-1), 0.5, GRIS_CLARO),
        ]))
        return t

    story.append(campo_texto('Problema reportado por el cliente:', orden.problema_reportado))
    story.append(Spacer(1, 2*mm))
    story.append(campo_texto('Diagnóstico técnico:', orden.diagnostico))
    story.append(Spacer(1, 2*mm))
    story.append(campo_texto('Solución aplicada:', orden.solucion_aplicada))
    story.append(Spacer(1, 3*mm))

    # ── COSTOS ───────────────────────────────────────────
    story.append(seccion_header('DETALLE DE COSTOS'))
    story.append(Spacer(1, 1*mm))

    costos_data = [
        [Paragraph('CONCEPTO', S['seccion']), Paragraph('IMPORTE', _estilo('si', fontSize=8, fontName='Helvetica-Bold', textColor=BLANCO, alignment=TA_RIGHT))],
        [Paragraph('Mano de obra', S['normal']),    Paragraph(f'$ {float(orden.importe_mano_obra):,.2f}', _estilo('cv', alignment=TA_RIGHT, fontSize=9))],
        [Paragraph('Repuestos y materiales', S['normal']), Paragraph(f'$ {float(orden.importe_repuestos):,.2f}', _estilo('cv', alignment=TA_RIGHT, fontSize=9))],
        ['', ''],  # separador
        [Paragraph('<b>TOTAL</b>', S['total_l']),   Paragraph(f'$ {float(orden.total):,.2f}', S['total_v'])],
        [Paragraph(
            '✔  PAGADO' if orden.pagado else '⚠  PAGO PENDIENTE',
            _estilo('pago', fontSize=9, fontName='Helvetica-Bold',
                    textColor=colors.HexColor('#166534') if orden.pagado else colors.HexColor('#9a3412'),
                    alignment=TA_RIGHT)
        ), ''],
    ]
    t_costos = Table(costos_data, colWidths=[ancho*0.65, ancho*0.35])
    t_costos.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,0),  NEGRO),
        ('TEXTCOLOR',     (0,0), (-1,0),  BLANCO),
        ('ROWBACKGROUNDS',(0,1), (-1,2), [GRIS_FONDO, BLANCO]),
        ('LINEABOVE',     (0,4), (-1,4),  1.5, NEGRO),
        ('BACKGROUND',    (0,4), (-1,4),  GRIS_FONDO),
        ('TOPPADDING',    (0,0), (-1,-1), 7),
        ('BOTTOMPADDING', (0,0), (-1,-1), 7),
        ('LEFTPADDING',   (0,0), (-1,-1), 10),
        ('RIGHTPADDING',  (0,0), (-1,-1), 10),
        ('GRID',          (0,0), (-1,3),  0.3, GRIS_CLARO),
        ('SPAN',          (0,5), (-1,5)),
        ('ALIGN',         (1,0), (1,-1), 'RIGHT'),
        ('BACKGROUND',    (0,5), (-1,5),
         colors.HexColor('#f0fdf4') if orden.pagado else colors.HexColor('#fff7ed')),
    ]))
    story.append(t_costos)
    story.append(Spacer(1, 3*mm))

    # ── SELLO DE GARANTÍA ────────────────────────────────
    if orden.fecha_egreso and orden.meses_garantia and orden.meses_garantia > 0:
        from dateutil.relativedelta import relativedelta
        fecha_venc = orden.fecha_egreso + relativedelta(months=orden.meses_garantia)
        garantia_t = Table([[
            Paragraph(
                f'★  GARANTÍA DE REPARACIÓN  ★\n'
                f'{orden.meses_garantia} mes(es) — Válida hasta el {fecha_venc.strftime("%d/%m/%Y")}',
                _estilo('gt', fontSize=9, fontName='Helvetica-Bold', textColor=ACENTO, alignment=TA_CENTER, leading=14)
            )
        ]], colWidths=[ancho])
        garantia_t.setStyle(TableStyle([
            ('BOX',           (0,0), (-1,-1), 1.5, ACENTO),
            ('BACKGROUND',    (0,0), (-1,-1), colors.HexColor('#eff6ff')),
            ('TOPPADDING',    (0,0), (-1,-1), 10),
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ]))
        story.append(garantia_t)
        story.append(Spacer(1, 3*mm))

    # ── OBSERVACIONES ────────────────────────────────────
    if orden.observaciones:
        story.append(seccion_header('OBSERVACIONES'))
        story.append(Spacer(1, 1*mm))
        story.append(campo_texto('', orden.observaciones))
        story.append(Spacer(1, 3*mm))

    # ── FIRMAS ───────────────────────────────────────────
    story.append(Spacer(1, 8*mm))
    story.append(HRFlowable(width=ancho, thickness=0.5, color=GRIS_CLARO, spaceAfter=4*mm))

    firmas = Table([
        [
            Table([
                [Paragraph('', S['normal'])],
                [HRFlowable(width=60*mm, thickness=1, color=GRIS_OSCURO)],
                [Paragraph('Firma del Técnico', _estilo('ft', fontSize=8, alignment=TA_CENTER, textColor=GRIS_MEDIO))],
                [Paragraph(tecnico.usuario.get_full_name() if tecnico else '_______________',
                           _estilo('fn', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER))],
            ], colWidths=[ancho*0.33]),
            Table([
                [Paragraph('', S['normal'])],
                [HRFlowable(width=60*mm, thickness=1, color=GRIS_OSCURO)],
                [Paragraph('Firma del Cliente', _estilo('fc', fontSize=8, alignment=TA_CENTER, textColor=GRIS_MEDIO))],
                [Paragraph(cliente.usuario.get_full_name(),
                           _estilo('fcn', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER))],
            ], colWidths=[ancho*0.33]),
            Table([
                [Paragraph('', S['normal'])],
                [HRFlowable(width=60*mm, thickness=1, color=GRIS_OSCURO)],
                [Paragraph('Aclaración', _estilo('fa', fontSize=8, alignment=TA_CENTER, textColor=GRIS_MEDIO))],
                [Paragraph('DNI: ' + (cliente.dni or '_______________'),
                           _estilo('fan', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER))],
            ], colWidths=[ancho*0.33]),
        ]
    ], colWidths=[ancho*0.33, ancho*0.33, ancho*0.34])
    firmas.setStyle(TableStyle([
        ('VALIGN',     (0,0), (-1,-1), 'BOTTOM'),
        ('ALIGN',      (0,0), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(firmas)

    # ── PIE ──────────────────────────────────────────────
    story.append(Spacer(1, 4*mm))
    story.append(HRFlowable(width=ancho, thickness=0.5, color=GRIS_CLARO, spaceAfter=2*mm))
    pie_data = [
        Paragraph(
            f'{taller}   |   {tel_t}   |   {email_t}   |   '
            f'Orden #{str(orden.id).zfill(4)}   —   Emitido el {__import__("datetime").date.today().strftime("%d/%m/%Y")}',
            _estilo('pie', fontSize=7, textColor=GRIS_MEDIO, alignment=TA_CENTER)
        )
    ]
    story.extend(pie_data)

    doc.build(story)
    return buffer.getvalue()


# ══════════════════════════════════════════════════════════
#  PDF PRESUPUESTO
# ══════════════════════════════════════════════════════════

def generar_pdf_presupuesto(pres):
    """Retorna bytes del PDF del presupuesto."""
    buffer = BytesIO()
    W, H   = A4
    M      = 18 * mm

    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=M, rightMargin=M,
        topMargin=M, bottomMargin=M,
    )

    taller  = getattr(settings, 'TALLER_NOMBRE', 'Taller Técnico')
    tel_t   = getattr(settings, 'TALLER_TELEFONO', '')
    email_t = getattr(settings, 'TALLER_EMAIL', '')
    ancho   = W - 2 * M

    S = {
        'titulo':  _estilo('t', fontSize=22, fontName='Helvetica-Bold', textColor=NEGRO),
        'sub':     _estilo('s', fontSize=9,  textColor=GRIS_MEDIO),
        'seccion': _estilo('sc', fontSize=8, fontName='Helvetica-Bold', textColor=BLANCO, leading=10),
        'label':   _estilo('l', fontSize=8,  fontName='Helvetica-Bold', textColor=GRIS_OSCURO),
        'valor':   _estilo('v', fontSize=9,  textColor=GRIS_OSCURO),
        'normal':  _estilo('n'),
        'small':   _estilo('sm', fontSize=7.5, textColor=GRIS_MEDIO),
        'right':   _estilo('r', alignment=TA_RIGHT),
        'center':  _estilo('c', alignment=TA_CENTER),
        'total_l': _estilo('tl', fontSize=11, fontName='Helvetica-Bold', textColor=NEGRO),
        'total_v': _estilo('tv', fontSize=13, fontName='Helvetica-Bold', textColor=NEGRO, alignment=TA_RIGHT),
    }

    story = []

    nombre_c   = pres.cliente.get_full_name() or pres.cliente.username
    email_c    = pres.cliente.email or '—'
    fecha_em   = pres.fecha_envio.strftime('%d/%m/%Y') if pres.fecha_envio else __import__('datetime').date.today().strftime('%d/%m/%Y')
    fecha_venc = pres.fecha_vencimiento.strftime('%d/%m/%Y') if pres.fecha_vencimiento else '—'

    logo = _logo_image()
    qr   = _qr_image(f'PRES-{str(pres.numero).zfill(4)}')

    def seccion_header(texto):
        t = Table([[Paragraph(texto, S['seccion'])]], colWidths=[ancho])
        t.setStyle(TableStyle([
            ('BACKGROUND',    (0,0), (-1,-1), NEGRO),
            ('TOPPADDING',    (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('LEFTPADDING',   (0,0), (-1,-1), 8),
        ]))
        return t

    def fila(label, valor):
        return [Paragraph(label, S['label']), Paragraph(str(valor) if valor else '—', S['valor'])]

    # ── ENCABEZADO ──────────────────────────────────────
    header_izq_rows = []
    if logo:
        header_izq_rows.append([logo])
    header_izq_rows += [
        [Paragraph(f'<b>{taller}</b>' if not logo else '', _estilo('tn', fontSize=14, fontName='Helvetica-Bold', textColor=NEGRO))],
        [Paragraph(tel_t, S['small'])],
        [Paragraph(email_t, S['small'])],
    ]

    header_der_rows = []
    if qr:
        header_der_rows.append([qr])
        header_der_rows.append([Paragraph(f'PRES. #{str(pres.numero).zfill(4)}', _estilo('qrl', fontSize=7, alignment=TA_CENTER, textColor=GRIS_MEDIO))])

    t_header = Table([[
        Table(header_izq_rows, colWidths=[ancho*0.55]),
        Paragraph(
            f'<b>PRESUPUESTO</b><br/><font size="22" color="#0f172a">#{str(pres.numero).zfill(4)}</font>',
            _estilo('ph', fontSize=10, fontName='Helvetica-Bold', alignment=TA_RIGHT, textColor=GRIS_MEDIO, leading=28)
        ) if not qr else Table(header_der_rows, colWidths=[ancho*0.45]),
    ]], colWidths=[ancho*0.55, ancho*0.45])
    t_header.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN',  (1,0), (1,0),  'RIGHT'),
    ]))
    story.append(t_header)
    story.append(Spacer(1, 4*mm))
    story.append(HRFlowable(width=ancho, thickness=2, color=NEGRO, spaceAfter=4*mm))

    # ── DATOS CLIENTE + INFO PRESUPUESTO ─────────────────
    story.append(seccion_header('DATOS DEL CLIENTE'))
    story.append(Spacer(1, 1*mm))

    datos_cols = Table([
        [
            Table([
                fila('Cliente:',   nombre_c),
                fila('Email:',     email_c),
                fila('Teléfono:',  pres.cliente.telefono or '—'),
            ], colWidths=[ancho*0.25, ancho*0.25]),
            Table([
                fila('Fecha emisión:', fecha_em),
                fila('Válido hasta:',  fecha_venc),
                fila('Equipo:',        pres.equipo_nombre if hasattr(pres, 'equipo_nombre') else (
                    f'{pres.equipo.marca} {pres.equipo.modelo}' if pres.equipo else '—'
                )),
            ], colWidths=[ancho*0.25, ancho*0.25]),
        ]
    ], colWidths=[ancho*0.5, ancho*0.5])
    datos_cols.setStyle(TableStyle([
        ('VALIGN',        (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING',    (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(datos_cols)
    story.append(Spacer(1, 3*mm))

    # ── DESCRIPCIÓN ──────────────────────────────────────
    if pres.descripcion:
        story.append(seccion_header('DESCRIPCIÓN DEL TRABAJO'))
        story.append(Spacer(1, 1*mm))
        desc_t = Table([[Paragraph(pres.descripcion, S['normal'])]], colWidths=[ancho])
        desc_t.setStyle(TableStyle([
            ('BOX',           (0,0), (-1,-1), 0.5, GRIS_CLARO),
            ('BACKGROUND',    (0,0), (-1,-1), GRIS_FONDO),
            ('LEFTPADDING',   (0,0), (-1,-1), 10),
            ('TOPPADDING',    (0,0), (-1,-1), 7),
            ('BOTTOMPADDING', (0,0), (-1,-1), 7),
        ]))
        story.append(desc_t)
        story.append(Spacer(1, 3*mm))

    # ── ÍTEMS ────────────────────────────────────────────
    story.append(seccion_header('DETALLE DE ÍTEMS'))
    story.append(Spacer(1, 1*mm))

    items_data = [[
        Paragraph('DESCRIPCIÓN', S['seccion']),
        Paragraph('CANT.', _estilo('ih', fontSize=8, fontName='Helvetica-Bold', textColor=BLANCO, alignment=TA_CENTER)),
        Paragraph('PRECIO UNIT.', _estilo('ih2', fontSize=8, fontName='Helvetica-Bold', textColor=BLANCO, alignment=TA_RIGHT)),
        Paragraph('SUBTOTAL', _estilo('ih3', fontSize=8, fontName='Helvetica-Bold', textColor=BLANCO, alignment=TA_RIGHT)),
    ]]
    for item in pres.items.all():
        items_data.append([
            Paragraph(item.descripcion, S['normal']),
            Paragraph(str(item.cantidad), _estilo('ic', alignment=TA_CENTER, fontSize=9)),
            Paragraph(f'$ {float(item.precio_unit):,.2f}', _estilo('ip', alignment=TA_RIGHT, fontSize=9)),
            Paragraph(f'$ {float(item.subtotal):,.2f}', _estilo('is', alignment=TA_RIGHT, fontSize=9)),
        ])

    t_items = Table(items_data, colWidths=[ancho*0.50, ancho*0.12, ancho*0.19, ancho*0.19])
    t_items.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,0),  NEGRO),
        ('ROWBACKGROUNDS',(0,1), (-1,-1), [GRIS_FONDO, BLANCO]),
        ('GRID',          (0,0), (-1,-1), 0.3, GRIS_CLARO),
        ('TOPPADDING',    (0,0), (-1,-1), 7),
        ('BOTTOMPADDING', (0,0), (-1,-1), 7),
        ('LEFTPADDING',   (0,0), (-1,-1), 8),
        ('RIGHTPADDING',  (0,0), (-1,-1), 8),
        ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_items)
    story.append(Spacer(1, 2*mm))

    # ── TOTAL ────────────────────────────────────────────
    total_data = [
        [Paragraph('<b>TOTAL</b>', S['total_l']),
         Paragraph(f'$ {float(pres.total):,.2f}', S['total_v'])],
    ]
    t_total = Table(total_data, colWidths=[ancho*0.70, ancho*0.30])
    t_total.setStyle(TableStyle([
        ('LINEABOVE',     (0,0), (-1,0), 2, NEGRO),
        ('TOPPADDING',    (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING',   (0,0), (-1,-1), 10),
        ('BACKGROUND',    (0,0), (-1,-1), GRIS_FONDO),
    ]))
    story.append(t_total)
    story.append(Spacer(1, 3*mm))

    # ── CONDICIONES ──────────────────────────────────────
    if pres.condiciones:
        story.append(seccion_header('CONDICIONES Y GARANTÍA'))
        story.append(Spacer(1, 1*mm))
        cond_t = Table([[Paragraph(pres.condiciones, S['normal'])]], colWidths=[ancho])
        cond_t.setStyle(TableStyle([
            ('BOX',           (0,0), (-1,-1), 0.5, GRIS_CLARO),
            ('LEFTPADDING',   (0,0), (-1,-1), 10),
            ('TOPPADDING',    (0,0), (-1,-1), 7),
            ('BOTTOMPADDING', (0,0), (-1,-1), 7),
        ]))
        story.append(cond_t)
        story.append(Spacer(1, 3*mm))

    # ── VALIDEZ ──────────────────────────────────────────
    validez_t = Table([[
        Paragraph(
            f'Este presupuesto tiene una validez de <b>{pres.validez_dias} días</b> '
            f'a partir de la fecha de emisión ({fecha_em}).',
            _estilo('val', fontSize=8, textColor=ACENTO, alignment=TA_CENTER)
        )
    ]], colWidths=[ancho])
    validez_t.setStyle(TableStyle([
        ('BOX',           (0,0), (-1,-1), 1, ACENTO),
        ('BACKGROUND',    (0,0), (-1,-1), colors.HexColor('#eff6ff')),
        ('TOPPADDING',    (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(validez_t)
    story.append(Spacer(1, 8*mm))

    # ── FIRMA CLIENTE ────────────────────────────────────
    story.append(HRFlowable(width=ancho, thickness=0.5, color=GRIS_CLARO, spaceAfter=4*mm))
    firma_t = Table([
        [
            Table([
                [Paragraph('', S['normal'])],
                [HRFlowable(width=70*mm, thickness=1, color=GRIS_OSCURO)],
                [Paragraph('Firma de conformidad del cliente', _estilo('ff', fontSize=8, alignment=TA_CENTER, textColor=GRIS_MEDIO))],
                [Paragraph(nombre_c, _estilo('ffn', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER))],
            ], colWidths=[ancho*0.45]),
            Table([
                [Paragraph('', S['normal'])],
                [HRFlowable(width=70*mm, thickness=1, color=GRIS_OSCURO)],
                [Paragraph('Firma y sello del taller', _estilo('ft2', fontSize=8, alignment=TA_CENTER, textColor=GRIS_MEDIO))],
                [Paragraph(taller, _estilo('ft2n', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER))],
            ], colWidths=[ancho*0.45]),
        ]
    ], colWidths=[ancho*0.5, ancho*0.5])
    firma_t.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
        ('ALIGN',  (0,0), (-1,-1), 'CENTER'),
    ]))
    story.append(firma_t)

    # ── PIE ──────────────────────────────────────────────
    story.append(Spacer(1, 4*mm))
    story.append(HRFlowable(width=ancho, thickness=0.5, color=GRIS_CLARO, spaceAfter=2*mm))
    story.append(Paragraph(
        f'{taller}   |   {tel_t}   |   {email_t}   |   '
        f'Presupuesto #{str(pres.numero).zfill(4)}',
        _estilo('pie', fontSize=7, textColor=GRIS_MEDIO, alignment=TA_CENTER)
    ))

    doc.build(story)
    return buffer.getvalue()