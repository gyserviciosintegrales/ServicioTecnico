# ordenes/whatsapp.py
import urllib.request
import urllib.parse
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


def limpiar_telefono(telefono: str) -> str:
    """
    Convierte el teléfono al formato internacional sin + ni espacios.
    Ej: +54 9 387 123-4567 → 5493871234567
    """
    import re
    numero = re.sub(r'[^\d]', '', telefono)
    # Si empieza con 0, quitarlo y agregar 54 (Argentina)
    if numero.startswith('0'):
        numero = '54' + numero[1:]
    # Si no tiene código de país, asumir Argentina
    if len(numero) <= 10:
        numero = '54' + numero
    return numero


def enviar_whatsapp(telefono: str, mensaje: str) -> bool:
    """
    Envía un mensaje de WhatsApp via CallMeBot.
    Retorna True si fue exitoso.

    Requisito previo: el cliente debe haber enviado
    "I allow callmebot to send me messages" al número +34 644 69 76 17
    y guardar la apikey que le responden en settings.CALLMEBOT_API_KEY.
    """
    api_key = getattr(settings, 'CALLMEBOT_API_KEY', '')
    if not api_key:
        logger.warning('CALLMEBOT_API_KEY no configurada en settings.')
        return False

    try:
        numero  = limpiar_telefono(telefono)
        texto   = urllib.parse.quote(mensaje)
        url     = f'https://api.callmebot.com/whatsapp.php?phone={numero}&text={texto}&apikey={api_key}'

        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = resp.read().decode('utf-8', errors='ignore')
            if resp.status == 200:
                logger.info(f'WhatsApp enviado a {numero}: {body[:80]}')
                return True
            else:
                logger.error(f'CallMeBot error {resp.status}: {body[:80]}')
                return False
    except Exception as e:
        logger.error(f'Error enviando WhatsApp a {telefono}: {e}')
        return False


def notificar_listo_para_retirar(orden) -> bool:
    """
    Envía WhatsApp al cliente cuando la orden pasa a estado 'listo'.
    """
    try:
        taller   = getattr(settings, 'TALLER_NOMBRE', 'TallerTech')
        telefono_taller = getattr(settings, 'TALLER_TELEFONO', '')

        cliente  = orden.equipo.cliente
        usuario  = cliente.usuario
        telefono = usuario.telefono or getattr(cliente, 'telefono', '')

        if not telefono:
            logger.warning(f'Orden #{orden.id}: cliente sin teléfono, no se envió WhatsApp.')
            return False

        nombre   = usuario.get_full_name() or usuario.username
        equipo   = f'{orden.equipo.marca} {orden.equipo.modelo}'.strip()
        numero   = str(orden.id).zfill(4)

        mensaje = (
            f'🔧 *{taller}*\n\n'
            f'¡Hola {nombre}! Tu equipo *{equipo}* '
            f'(Orden #{numero}) ya está listo para retirar. 🎉\n\n'
            f'Podés pasar a buscarlo en nuestro local.'
        )
        if telefono_taller:
            mensaje += f'\n\n📞 Cualquier consulta: {telefono_taller}'

        return enviar_whatsapp(telefono, mensaje)

    except Exception as e:
        logger.error(f'Error en notificar_listo_para_retirar: {e}')
        return False