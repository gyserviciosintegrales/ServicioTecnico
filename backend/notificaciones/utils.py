# notificaciones/utils.py
"""
Helper para crear notificaciones desde signals u otras partes del código.
Uso:
    from notificaciones.utils import crear_notificacion
    crear_notificacion(usuario, 'estado_cambio', 'Título', 'Mensaje', orden=orden)
"""
import logging
logger = logging.getLogger(__name__)


def crear_notificacion(usuario, tipo, titulo, mensaje, orden=None):
    """Crea una notificación silenciosamente (no interrumpe el flujo si falla)."""
    try:
        from .models import Notificacion
        Notificacion.objects.create(
            usuario=usuario,
            tipo=tipo,
            titulo=titulo,
            mensaje=mensaje,
            orden=orden,
        )
    except Exception as e:
        logger.warning(f'No se pudo crear notificación: {e}')


def notificar_cambio_estado(orden, estado_anterior, estado_nuevo, usuario_modificador=None):
    """
    Crea notificaciones cuando cambia el estado de una orden.
    - Al cliente: siempre.
    - Al técnico asignado: si el estado indica acción requerida.
    - A todos los admins: si la orden queda lista o tiene problema.
    """
    from usuarios.models import Usuario

    ESTADOS_LABELS = {
        'ingresado':          'Ingresado',
        'diagnostico':        'En Diagnóstico',
        'en_reparacion':      'En Reparación',
        'esperando_repuesto': 'Esperando Repuesto',
        'listo':              'Listo para Retirar',
        'entregado':          'Entregado',
        'sin_reparacion':     'Sin Reparación',
    }

    label_nuevo    = ESTADOS_LABELS.get(estado_nuevo, estado_nuevo)
    label_anterior = ESTADOS_LABELS.get(estado_anterior, estado_anterior) if estado_anterior else None
    equipo_str = f'{orden.equipo.marca} {orden.equipo.modelo}' if orden.equipo_id else 'Equipo'
    orden_str  = f'Orden #{str(orden.id).zfill(4)}'

    # ── Notificación al cliente ──────────────────────────
    try:
        cliente_usuario = orden.equipo.cliente.usuario
        if estado_nuevo == 'listo':
            titulo  = f'✅ {orden_str} — ¡Listo para retirar!'
            mensaje = f'Tu {equipo_str} ya está reparado y podés pasar a retirarlo por el taller.'
        elif estado_nuevo == 'sin_reparacion':
            titulo  = f'❌ {orden_str} — Sin reparación'
            mensaje = f'Lamentablemente tu {equipo_str} no pudo ser reparado. Contactate con el taller para más información.'
        elif estado_nuevo == 'entregado':
            titulo  = f'📦 {orden_str} — Entregado'
            mensaje = f'Tu {equipo_str} fue marcado como entregado. ¡Gracias por confiar en nosotros!'
        else:
            titulo  = f'🔄 {orden_str} — Estado actualizado'
            mensaje = f'Tu {equipo_str} cambió a: {label_nuevo}.'
            if label_anterior:
                mensaje += f' (antes: {label_anterior})'

        crear_notificacion(cliente_usuario, 'estado_cambio', titulo, mensaje, orden=orden)
    except Exception:
        pass

    # ── Notificación al técnico asignado ─────────────────
    if orden.tecnico_id and estado_nuevo in ('diagnostico', 'en_reparacion', 'esperando_repuesto'):
        try:
            tecnico_usuario = orden.tecnico.usuario
            crear_notificacion(
                tecnico_usuario,
                'estado_cambio',
                f'🔧 {orden_str} — {label_nuevo}',
                f'La orden de {equipo_str} cambió de estado. Nueva etapa: {label_nuevo}.',
                orden=orden,
            )
        except Exception:
            pass

    # ── Notificación a admins si queda lista o sin reparación ──
    if estado_nuevo in ('listo', 'sin_reparacion'):
        try:
            admins = Usuario.objects.filter(rol='admin', activo=True)
            for admin in admins:
                if usuario_modificador and admin == usuario_modificador:
                    continue  # No notificar al que hizo el cambio
                crear_notificacion(
                    admin,
                    'orden_lista' if estado_nuevo == 'listo' else 'sistema',
                    f'{"✅" if estado_nuevo == "listo" else "❌"} {orden_str} — {label_nuevo}',
                    f'{equipo_str} fue marcado como "{label_nuevo}".',
                    orden=orden,
                )
        except Exception:
            pass


def notificar_orden_asignada(orden, tecnico):
    """Notifica al técnico cuando se le asigna una orden."""
    try:
        equipo_str = f'{orden.equipo.marca} {orden.equipo.modelo}' if orden.equipo_id else 'Equipo'
        orden_str  = f'Orden #{str(orden.id).zfill(4)}'
        crear_notificacion(
            tecnico.usuario,
            'orden_asignada',
            f'👨‍💻 Nueva orden asignada — {orden_str}',
            f'Se te asignó la {orden_str}: {equipo_str}. '
            f'Problema: {orden.problema_reportado[:80]}{"..." if len(orden.problema_reportado) > 80 else ""}',
            orden=orden,
        )
    except Exception:
        pass


def notificar_pago(orden):
    """Notifica al cliente cuando se registra el pago."""
    try:
        cliente_usuario = orden.equipo.cliente.usuario
        equipo_str = f'{orden.equipo.marca} {orden.equipo.modelo}' if orden.equipo_id else 'Equipo'
        orden_str  = f'Orden #{str(orden.id).zfill(4)}'
        crear_notificacion(
            cliente_usuario,
            'pago_registrado',
            f'💳 {orden_str} — Pago registrado',
            f'Se registró el pago de ${orden.total:,.0f} por la reparación de tu {equipo_str}. ¡Gracias!',
            orden=orden,
        )
    except Exception:
        pass