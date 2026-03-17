# usuarios/password_reset_views.py
import secrets
from datetime import timedelta

from django.utils import timezone
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from .models import Usuario, PasswordResetToken


class SolicitarResetView(APIView):
    """POST /api/auth/reset/solicitar/  { email }"""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'error': 'El email es requerido.'}, status=400)

        # Respuesta genérica (no revelar si el email existe)
        try:
            user = Usuario.objects.get(email__iexact=email, activo=True)
        except Usuario.DoesNotExist:
            return Response({'mensaje': 'Si el email existe, recibirás un correo con instrucciones.'})

        # Invalida tokens anteriores
        PasswordResetToken.objects.filter(usuario=user, usado=False).update(usado=True)

        # Crea token nuevo (expira en 1 hora)
        token_str = secrets.token_urlsafe(48)
        PasswordResetToken.objects.create(
            usuario=user,
            token=token_str,
            expira=timezone.now() + timedelta(hours=1),
        )

        # URL del frontend
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        reset_url    = f'{frontend_url}/#/reset-password/{token_str}'

        # Email
        self._enviar_email(user, reset_url)

        return Response({'mensaje': 'Si el email existe, recibirás un correo con instrucciones.'})

    def _enviar_email(self, user, reset_url):
        taller = getattr(settings, 'TALLER_NOMBRE', 'TallerTech')
        nombre = user.get_full_name() or user.username
        asunto = f'[{taller}] Restablecer contraseña'
        html   = f"""
        <!DOCTYPE html>
        <html lang="es">
        <body style="margin:0;padding:0;background:#080c14;font-family:'Segoe UI',sans-serif;">
          <div style="max-width:500px;margin:40px auto;background:#111827;border:1px solid #1e2d40;border-radius:14px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#0891b2,#0d1421);padding:28px 32px;">
              <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700;">{taller}</h1>
              <p style="color:rgba(255,255,255,0.65);margin:6px 0 0;font-size:13px;">Sistema de Gestión</p>
            </div>
            <div style="padding:32px;">
              <h2 style="color:#f0f6fc;font-size:17px;margin:0 0 12px;">Hola, {nombre}</h2>
              <p style="color:#8b9ab0;font-size:14px;line-height:1.6;margin:0 0 24px;">
                Recibimos una solicitud para restablecer tu contraseña.
                Hacé clic en el botón para crear una nueva:
              </p>
              <a href="{reset_url}" style="display:inline-block;background:#06b6d4;color:#080c14;font-weight:700;padding:13px 28px;border-radius:8px;text-decoration:none;font-size:14px;">
                Restablecer contraseña
              </a>
              <p style="color:#4a5568;font-size:12px;margin:24px 0 0;line-height:1.6;">
                Este enlace expira en <strong style="color:#8b9ab0;">1 hora</strong>.<br>
                Si no solicitaste este cambio, podés ignorar este email.
              </p>
            </div>
            <div style="padding:16px 32px;border-top:1px solid #1e2d40;">
              <p style="color:#4a5568;font-size:11px;margin:0;">© {taller} · Soporte técnico</p>
            </div>
          </div>
        </body>
        </html>
        """
        try:
            send_mail(
                subject=asunto,
                message=f'Restablecé tu contraseña: {reset_url}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html,
                fail_silently=True,
            )
        except Exception:
            pass


class ConfirmarResetView(APIView):
    """POST /api/auth/reset/confirmar/  { token, password }"""
    permission_classes = [AllowAny]

    def post(self, request):
        token_str   = request.data.get('token', '').strip()
        password    = request.data.get('password', '')
        password2   = request.data.get('password2', '')

        if not token_str or not password:
            return Response({'error': 'Token y contraseña son requeridos.'}, status=400)

        if password != password2:
            return Response({'error': 'Las contraseñas no coinciden.'}, status=400)

        if len(password) < 8:
            return Response({'error': 'La contraseña debe tener al menos 8 caracteres.'}, status=400)

        try:
            token_obj = PasswordResetToken.objects.get(token=token_str, usado=False)
        except PasswordResetToken.DoesNotExist:
            return Response({'error': 'El enlace no es válido o ya fue utilizado.'}, status=400)

        if token_obj.expira < timezone.now():
            token_obj.usado = True
            token_obj.save()
            return Response({'error': 'El enlace expiró. Solicitá uno nuevo.'}, status=400)

        # Cambiar contraseña
        user = token_obj.usuario
        user.set_password(password)
        user.save()

        # Marcar token como usado
        token_obj.usado = True
        token_obj.save()

        return Response({'mensaje': 'Contraseña restablecida exitosamente. Ya podés iniciar sesión.'})


class ValidarTokenView(APIView):
    """GET /api/auth/reset/validar/?token=xxx"""
    permission_classes = [AllowAny]

    def get(self, request):
        token_str = request.query_params.get('token', '').strip()
        try:
            token_obj = PasswordResetToken.objects.get(token=token_str, usado=False)
            if token_obj.expira < timezone.now():
                return Response({'valido': False, 'error': 'El enlace expiró.'})
            return Response({'valido': True, 'email': token_obj.usuario.email})
        except PasswordResetToken.DoesNotExist:
            return Response({'valido': False, 'error': 'Enlace inválido o ya utilizado.'})