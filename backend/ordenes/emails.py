# ordenes/emails.py

import logging
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from .email_templates import get_html_email, ESTADOS_INFO

logger = logging.getLogger(__name__)


def enviar_email_cambio_estado(orden, estado_anterior=None):
    """
    Envía email al cliente cuando cambia el estado de su orden.
    Falla silenciosamente para no interrumpir el flujo de la app.
    """
    try:
        # Obtener email del cliente
        email_cliente = orden.equipo.cliente.usuario.email
        if not email_cliente:
            logger.warning(f'Orden #{orden.id}: cliente sin email, no se envió notificación')
            return False

        info        = ESTADOS_INFO.get(orden.estado, {})
        titulo      = info.get('titulo', 'Actualización de tu Orden')
        taller      = getattr(settings, 'TALLER_NOMBRE', 'TallerTech')
        orden_num   = str(orden.id).zfill(4)
        subject     = f'[{taller}] {titulo} — Orden #{orden_num}'

        # Texto plano como fallback
        texto_plano = (
            f'{taller} - {titulo}\n\n'
            f'Hola {orden.equipo.cliente.usuario.get_full_name()},\n\n'
            f'{info.get("msg", "Tu orden fue actualizada.")}\n\n'
            f'Orden: #{orden_num}\n'
            f'Equipo: {orden.equipo.get_tipo_display()} {orden.equipo.marca} {orden.equipo.modelo}\n'
        )

        # HTML
        html_content = get_html_email(orden, estado_anterior)

        msg = EmailMultiAlternatives(
            subject=subject,
            body=texto_plano,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[email_cliente],
        )
        msg.attach_alternative(html_content, 'text/html')
        msg.send(fail_silently=False)

        logger.info(f'Email enviado a {email_cliente} — Orden #{orden.id} — Estado: {orden.estado}')
        return True

    except Exception as e:
        logger.error(f'Error enviando email para Orden #{orden.id}: {e}')
        return False