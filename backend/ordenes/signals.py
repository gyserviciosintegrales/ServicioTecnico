# ordenes/signals.py
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from .models import OrdenTrabajo

CAMPOS_TRACKED = [
    'estado', 'diagnostico', 'solucion_aplicada', 'tecnico_id',
    'importe_mano_obra', 'importe_repuestos', 'pagado',
    'fecha_egreso', 'meses_garantia', 'observaciones',
]

ESTADOS_LABELS = {
    'ingresado':          'Ingresado',
    'diagnostico':        'En Diagnóstico',
    'en_reparacion':      'En Reparación',
    'esperando_repuesto': 'Esperando Repuesto',
    'listo':              'Listo para Retirar',
    'entregado':          'Entregado',
    'sin_reparacion':     'Sin Reparación',
}


def _label(campo, valor):
    """Convierte valores internos a texto legible."""
    if valor is None:
        return '—'
    if campo == 'estado':
        return ESTADOS_LABELS.get(str(valor), str(valor))
    if campo == 'pagado':
        return 'Pagado' if valor else 'Pendiente'
    if campo == 'tecnico_id':
        if valor:
            try:
                from tecnicos.models import Tecnico
                t = Tecnico.objects.select_related('usuario').get(pk=valor)
                return t.usuario.get_full_name() or t.usuario.username
            except Exception:
                return str(valor)
        return '—'
    return str(valor) if valor else '—'


@receiver(pre_save, sender=OrdenTrabajo)
def capturar_estado_anterior(sender, instance, **kwargs):
    """Guarda snapshot del estado anterior antes de guardar."""
    if not instance.pk:
        instance._snapshot_anterior = {}
        instance._es_nueva = True
        return

    instance._es_nueva = False
    try:
        anterior = OrdenTrabajo.objects.get(pk=instance.pk)
        instance._snapshot_anterior = {
            campo: getattr(anterior, campo)
            for campo in CAMPOS_TRACKED
        }
    except OrdenTrabajo.DoesNotExist:
        instance._snapshot_anterior = {}


@receiver(post_save, sender=OrdenTrabajo)
def registrar_cambios(sender, instance, created, **kwargs):
    from .models import HistorialOrden
    from .emails import enviar_email_cambio_estado
    from notificaciones.utils import (
        notificar_cambio_estado,
        notificar_orden_asignada,
        notificar_pago,
    )

    usuario   = getattr(instance, '_usuario_modificador', None)
    snapshot  = getattr(instance, '_snapshot_anterior', {})
    es_nueva  = getattr(instance, '_es_nueva', created)

    # ── Orden nueva ──────────────────────────────────────
    if es_nueva:
        HistorialOrden.objects.create(
            orden=instance,
            usuario=usuario,
            campo='estado',
            valor_anterior=None,
            valor_nuevo=instance.estado,
            descripcion=f'Orden creada con estado: {ESTADOS_LABELS.get(instance.estado, instance.estado)}',
        )
        # Notificación + email de bienvenida
        notificar_cambio_estado(instance, None, instance.estado, usuario)
        enviar_email_cambio_estado(instance)

        # Si ya viene con técnico asignado al crear
        if instance.tecnico_id:
            try:
                notificar_orden_asignada(instance, instance.tecnico)
            except Exception:
                pass
        return

    # ── Detectar cambios campo por campo ─────────────────
    cambios = []
    for campo in CAMPOS_TRACKED:
        valor_ant   = snapshot.get(campo)
        valor_nuevo = getattr(instance, campo)
        if valor_ant != valor_nuevo:
            cambios.append((campo, valor_ant, valor_nuevo))

    for campo, anterior, nuevo in cambios:
        HistorialOrden.objects.create(
            orden=instance,
            usuario=usuario,
            campo=campo if campo != 'tecnico_id' else 'tecnico',
            valor_anterior=_label(campo, anterior),
            valor_nuevo=_label(campo, nuevo),
            descripcion=(
                f'{HistorialOrden.CAMPOS_DISPLAY.get(campo, campo)} '
                f'cambió de "{_label(campo, anterior)}" a "{_label(campo, nuevo)}"'
            ),
        )

    # ── Notificaciones según qué cambió ──────────────────
    estado_ant  = snapshot.get('estado')
    tecnico_ant = snapshot.get('tecnico_id')

    # Estado cambió
    if estado_ant is not None and estado_ant != instance.estado:
        notificar_cambio_estado(instance, estado_ant, instance.estado, usuario)
        enviar_email_cambio_estado(instance, estado_ant)

    # Técnico asignado por primera vez (o reasignado)
    if tecnico_ant != instance.tecnico_id and instance.tecnico_id:
        try:
            notificar_orden_asignada(instance, instance.tecnico)
        except Exception:
            pass

    # Pago registrado
    pagado_ant = snapshot.get('pagado')
    if pagado_ant is False and instance.pagado is True:
        notificar_pago(instance)

    # ── WhatsApp: avisar cuando pasa a "listo" ───────────
    if estado_ant and estado_ant != 'listo' and instance.estado == 'listo':
        try:
            from .whatsapp import notificar_listo_para_retirar
            notificar_listo_para_retirar(instance)
        except Exception:
            pass  # nunca romper el flujo principal por WhatsApp