# ordenes/email_templates.py

from django.conf import settings

TALLER_NOMBRE   = getattr(settings, 'TALLER_NOMBRE', 'TallerTech')
TALLER_TEL      = getattr(settings, 'TALLER_TELEFONO', '')
TALLER_EMAIL    = getattr(settings, 'TALLER_EMAIL', '')

ESTADOS_INFO = {
    'ingresado':          {'emoji': '📥', 'color': '#06b6d4', 'titulo': 'Equipo Ingresado',           'msg': 'Hemos recibido tu equipo correctamente. Pronto comenzaremos con el diagnóstico.'},
    'diagnostico':        {'emoji': '🔍', 'color': '#8b5cf6', 'titulo': 'En Diagnóstico',              'msg': 'Nuestro técnico está analizando tu equipo para identificar el problema.'},
    'en_reparacion':      {'emoji': '🔧', 'color': '#f59e0b', 'titulo': 'En Reparación',               'msg': 'Ya sabemos qué tiene tu equipo y estamos trabajando en la reparación.'},
    'esperando_repuesto': {'emoji': '📦', 'color': '#f97316', 'titulo': 'Esperando Repuesto',          'msg': 'Necesitamos un repuesto para completar la reparación. Te avisaremos cuando llegue.'},
    'listo':              {'emoji': '✅', 'color': '#10b981', 'titulo': '¡Listo para Retirar!',        'msg': 'Tu equipo está reparado y listo para ser retirado. ¡Podés pasar por el taller!'},
    'entregado':          {'emoji': '🎉', 'color': '#10b981', 'titulo': 'Equipo Entregado',            'msg': 'Tu equipo fue entregado. ¡Gracias por confiar en nosotros!'},
    'sin_reparacion':     {'emoji': '❌', 'color': '#ef4444', 'titulo': 'Sin Reparación Posible',      'msg': 'Lamentablemente no pudimos reparar tu equipo. Podés pasar a retirarlo cuando quieras.'},
}


def get_html_email(orden, estado_anterior=None):
    info    = ESTADOS_INFO.get(orden.estado, {})
    emoji   = info.get('emoji', '📋')
    color   = info.get('color', '#06b6d4')
    titulo  = info.get('titulo', 'Actualización de tu Orden')
    mensaje = info.get('msg', 'Tu orden ha sido actualizada.')

    cliente_nombre = orden.equipo.cliente.usuario.get_full_name() or orden.equipo.cliente.usuario.username
    equipo_desc    = f"{orden.equipo.get_tipo_display()} {orden.equipo.marca} {orden.equipo.modelo}"
    orden_num      = str(orden.id).zfill(4)

    tecnico_nombre = ''
    if orden.tecnico:
        tecnico_nombre = orden.tecnico.usuario.get_full_name()

    mostrar_total  = orden.estado in ('listo', 'entregado') and float(orden.total) > 0
    mostrar_garantia = orden.estado in ('listo', 'entregado') and orden.meses_garantia > 0

    return f"""
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{titulo} - {TALLER_NOMBRE}</title>
</head>
<body style="margin:0;padding:0;background:#0d1421;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1421;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- HEADER -->
        <tr><td style="background:linear-gradient(135deg,#0d1421,#111827);border:1px solid #1e2d40;border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
          <div style="display:inline-block;width:60px;height:60px;background:rgba(6,182,212,0.15);border:1px solid rgba(6,182,212,0.3);border-radius:16px;line-height:60px;font-size:28px;margin-bottom:16px;">
            🔧
          </div>
          <h1 style="margin:0;color:#f0f6fc;font-size:22px;font-weight:700;">{TALLER_NOMBRE}</h1>
          <p style="margin:6px 0 0;color:#64748b;font-size:13px;font-family:monospace;">Sistema de Gestión de Reparaciones</p>
        </td></tr>

        <!-- ESTADO BADGE -->
        <tr><td style="background:#111827;border-left:1px solid #1e2d40;border-right:1px solid #1e2d40;padding:32px 40px 24px;text-align:center;">
          <div style="display:inline-block;background:{color}20;border:1px solid {color}50;border-radius:999px;padding:10px 28px;margin-bottom:20px;">
            <span style="font-size:20px;">{emoji}</span>
            <span style="color:{color};font-weight:700;font-size:16px;margin-left:10px;">{titulo}</span>
          </div>
          <h2 style="margin:0 0 8px;color:#f0f6fc;font-size:20px;">Hola, {cliente_nombre} 👋</h2>
          <p style="margin:0;color:#94a3b8;font-size:15px;line-height:1.6;">{mensaje}</p>
        </td></tr>

        <!-- DETALLES DE LA ORDEN -->
        <tr><td style="background:#111827;border-left:1px solid #1e2d40;border-right:1px solid #1e2d40;padding:0 40px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1421;border:1px solid #1e2d40;border-radius:12px;overflow:hidden;">
            <tr><td style="padding:16px 20px;border-bottom:1px solid #1e2d40;">
              <p style="margin:0;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Número de Orden</p>
              <p style="margin:0;color:{color};font-size:22px;font-weight:800;font-family:monospace;">#{orden_num}</p>
            </td></tr>
            <tr><td style="padding:16px 20px;border-bottom:1px solid #1e2d40;">
              <p style="margin:0;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Equipo</p>
              <p style="margin:0;color:#f0f6fc;font-size:15px;font-weight:600;">{equipo_desc}</p>
              {'<p style="margin:4px 0 0;color:#64748b;font-size:12px;font-family:monospace;">N° Serie: ' + (orden.equipo.numero_serie or 'S/N') + '</p>' if orden.equipo.numero_serie else ''}
            </td></tr>
            <tr><td style="padding:16px 20px;{'border-bottom:1px solid #1e2d40;' if orden.diagnostico or mostrar_total else ''}">
              <p style="margin:0;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Problema Reportado</p>
              <p style="margin:0;color:#cbd5e1;font-size:14px;line-height:1.5;">{orden.problema_reportado}</p>
            </td></tr>
            {f'''<tr><td style="padding:16px 20px;{'border-bottom:1px solid #1e2d40;' if mostrar_total else ''}">
              <p style="margin:0;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Diagnóstico</p>
              <p style="margin:0;color:#cbd5e1;font-size:14px;line-height:1.5;">{orden.diagnostico}</p>
            </td></tr>''' if orden.diagnostico else ''}
            {f'''<tr><td style="padding:16px 20px;">
              <p style="margin:0;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Total a Pagar</p>
              <p style="margin:0;color:#10b981;font-size:22px;font-weight:800;font-family:monospace;">${float(orden.total):,.2f}</p>
              {'<p style="margin:6px 0 0;color:#06b6d4;font-size:13px;">🛡️ Garantía: ' + str(orden.meses_garantia) + ' mes' + ('es' if orden.meses_garantia != 1 else '') + '</p>' if mostrar_garantia else ''}
            </td></tr>''' if mostrar_total else ''}
            {f'''<tr><td style="padding:16px 20px;border-top:1px solid #1e2d40;">
              <p style="margin:0;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Técnico Asignado</p>
              <p style="margin:0;color:#f0f6fc;font-size:14px;">{tecnico_nombre}</p>
            </td></tr>''' if tecnico_nombre else ''}
          </table>
        </td></tr>

        <!-- ALERTA LISTO PARA RETIRAR -->
        {f'''<tr><td style="background:#111827;border-left:1px solid #1e2d40;border-right:1px solid #1e2d40;padding:0 40px 24px;">
          <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);border-radius:12px;padding:20px;text-align:center;">
            <p style="margin:0;color:#10b981;font-size:16px;font-weight:700;">🎉 ¡Tu equipo está listo!</p>
            <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">Podés pasar a retirarlo en nuestro horario de atención.</p>
            {('<p style="margin:6px 0 0;color:#64748b;font-size:13px;font-family:monospace;">📞 ' + TALLER_TEL + '</p>') if TALLER_TEL else ''}
          </div>
        </td></tr>''' if orden.estado == 'listo' else ''}

        <!-- FOOTER -->
        <tr><td style="background:#0d1421;border:1px solid #1e2d40;border-top:none;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
          <p style="margin:0 0 8px;color:#64748b;font-size:13px;">{TALLER_NOMBRE}</p>
          {'<p style="margin:0;color:#475569;font-size:12px;font-family:monospace;">📞 ' + TALLER_TEL + '</p>' if TALLER_TEL else ''}
          {'<p style="margin:4px 0 0;color:#475569;font-size:12px;">✉️ ' + TALLER_EMAIL + '</p>' if TALLER_EMAIL else ''}
          <p style="margin:16px 0 0;color:#334155;font-size:11px;">Este es un email automático, por favor no respondas a este mensaje.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>

</body>
</html>
"""