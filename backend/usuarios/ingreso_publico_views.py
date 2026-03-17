# usuarios/ingreso_publico_views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.db import transaction
from django.utils.crypto import get_random_string
import re


class IngresoClientePublicoView(APIView):
    """
    POST público — crea Usuario + Cliente + Equipo + OrdenTrabajo de una sola vez.
    No requiere autenticación.
    """
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        data = request.data

        # ── Validaciones básicas ─────────────────────────
        errores = {}

        nombre    = data.get('nombre', '').strip()
        apellido  = data.get('apellido', '').strip()
        email     = data.get('email', '').strip().lower()
        telefono  = data.get('telefono', '').strip()
        dni       = data.get('dni', '').strip()
        direccion = data.get('direccion', '').strip()

        tipo_equipo  = data.get('tipo_equipo', '').strip()
        marca        = data.get('marca', '').strip()
        modelo       = data.get('modelo', '').strip()
        numero_serie = data.get('numero_serie', '').strip()
        problema     = data.get('problema', '').strip()

        if not nombre:      errores['nombre']     = 'El nombre es obligatorio.'
        if not apellido:    errores['apellido']   = 'El apellido es obligatorio.'
        if not email:       errores['email']      = 'El email es obligatorio.'
        if not telefono:    errores['telefono']   = 'El teléfono es obligatorio.'
        if not tipo_equipo: errores['tipo_equipo']= 'El tipo de equipo es obligatorio.'
        if not marca:       errores['marca']      = 'La marca es obligatoria.'
        if not problema:    errores['problema']   = 'La descripción del problema es obligatoria.'

        # Validar email
        if email and not re.match(r'^[^@]+@[^@]+\.[^@]+$', email):
            errores['email'] = 'Email inválido.'

        if errores:
            return Response({'errores': errores}, status=status.HTTP_400_BAD_REQUEST)

        # ── Verificar email duplicado ────────────────────
        from usuarios.models import Usuario
        if Usuario.objects.filter(email=email).exists():
            return Response({
                'errores': {'email': 'Ya existe una cuenta con este email. Podés iniciar sesión.'},
                'ya_registrado': True,
            }, status=status.HTTP_400_BAD_REQUEST)

        # ── Generar contraseña automática ────────────────
        password = get_random_string(10, 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789')

        # ── Crear Usuario (username = email para que el login funcione) ──
        usuario = Usuario.objects.create_user(
            username   = email,   # el email ES el username
            email      = email,
            password   = password,
            first_name = nombre,
            last_name  = apellido,
            rol        = 'cliente',
            telefono   = telefono,
            activo     = True,
        )

        # ── Crear Cliente ────────────────────────────────
        from clientes.models import Cliente
        cliente = Cliente.objects.create(
            usuario   = usuario,
            dni       = dni,
            direccion = direccion,
            notas     = 'Registrado vía formulario público.',
        )

        # ── Crear Equipo ─────────────────────────────────
        from equipos.models import Equipo
        equipo = Equipo.objects.create(
            cliente      = cliente,
            tipo         = tipo_equipo,
            marca        = marca,
            modelo       = modelo or 'Sin especificar',
            numero_serie = numero_serie,
        )

        # ── Crear Orden de Trabajo ───────────────────────
        from ordenes.models import OrdenTrabajo
        orden = OrdenTrabajo.objects.create(
            equipo             = equipo,
            problema_reportado = problema,
            estado             = 'ingresado',
            observaciones      = 'Ingresado por el cliente vía formulario público.',
        )

        # ── Notificar admins ─────────────────────────────
        try:
            from notificaciones.utils import crear_notificacion
            admins = Usuario.objects.filter(rol='admin', activo=True)
            for admin in admins:
                crear_notificacion(
                    admin, 'orden_nueva',
                    f'📋 Nuevo ingreso: {nombre} {apellido}',
                    f'Ingresó un equipo {marca} {modelo} con el problema: {problema[:80]}',
                )
        except Exception:
            pass

        # ── Enviar email con credenciales ────────────────
        try:
            _enviar_email_bienvenida(usuario, password, orden.id)
        except Exception:
            pass

        return Response({
            'mensaje':      '¡Registro exitoso! Te enviamos un email con tus credenciales de acceso.',
            'orden_id':     orden.id,
            'numero_orden': str(orden.id).zfill(4),
            'email':        email,
        }, status=status.HTTP_201_CREATED)


def _enviar_email_bienvenida(usuario, password, orden_id):
    from django.core.mail import send_mail
    from django.conf import settings

    taller       = getattr(settings, 'TALLER_NOMBRE', 'TallerTech')
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    nombre       = usuario.get_full_name()

    html = f"""
    <!DOCTYPE html>
    <html lang="es">
    <body style="margin:0;padding:0;background:#080c14;font-family:'Segoe UI',sans-serif;">
      <div style="max-width:560px;margin:40px auto;background:#111827;border:1px solid #1e2d40;border-radius:14px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#0891b2,#0d1421);padding:28px 32px;">
          <h1 style="color:#fff;margin:0;font-size:20px;">{taller}</h1>
          <p style="color:rgba(255,255,255,0.65);margin:6px 0 0;font-size:13px;">Bienvenido al sistema</p>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#f0f6fc;font-size:17px;margin:0 0 14px;">¡Hola, {nombre}!</h2>
          <p style="color:#8b9ab0;font-size:14px;line-height:1.6;margin:0 0 24px;">
            Tu equipo fue registrado correctamente. Podés hacer seguimiento del estado de tu reparación desde tu cuenta.
          </p>

          <div style="background:#0d1421;border:1px solid #1e2d40;border-radius:10px;padding:18px;margin-bottom:24px;">
            <p style="color:#94a3b8;font-size:11px;font-weight:700;text-transform:uppercase;margin:0 0 12px;letter-spacing:0.05em;">Tus credenciales de acceso</p>
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
              <span style="color:#64748b;font-size:13px;">Email</span>
              <span style="color:#f0f6fc;font-size:13px;font-weight:600;">{usuario.email}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#64748b;font-size:13px;">Contraseña</span>
              <span style="color:#06b6d4;font-size:15px;font-weight:700;font-family:monospace;">{password}</span>
            </div>
          </div>

          <div style="background:#0d1421;border:1px solid #1e2d40;border-radius:10px;padding:14px;margin-bottom:24px;">
            <p style="color:#94a3b8;font-size:11px;font-weight:700;text-transform:uppercase;margin:0 0 8px;">Tu orden de trabajo</p>
            <p style="color:#06b6d4;font-size:22px;font-weight:800;margin:0;">#{str(orden_id).zfill(4)}</p>
            <p style="color:#64748b;font-size:12px;margin:4px 0 0;">Guardá este número para hacer seguimiento</p>
          </div>

          <a href="{frontend_url}/#/login" style="display:inline-block;background:#06b6d4;color:#080c14;font-weight:700;padding:13px 28px;border-radius:8px;text-decoration:none;font-size:14px;">
            Ingresar al sistema →
          </a>

          <p style="color:#4a5568;font-size:12px;margin:20px 0 0;line-height:1.6;">
            Te recomendamos cambiar tu contraseña después de iniciar sesión por primera vez.
          </p>
        </div>
        <div style="padding:16px 32px;border-top:1px solid #1e2d40;">
          <p style="color:#4a5568;font-size:11px;margin:0;">© {taller}</p>
        </div>
      </div>
    </body>
    </html>
    """

    send_mail(
        subject=f'[{taller}] Tu cuenta y orden #{str(orden_id).zfill(4)}',
        message=f'Bienvenido {nombre}. Tu contraseña es: {password}. Orden: #{str(orden_id).zfill(4)}',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[usuario.email],
        html_message=html,
        fail_silently=False,
    )