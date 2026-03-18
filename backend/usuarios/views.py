# usuarios/views.py
from rest_framework import generics, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Usuario
from .serializers import UsuarioSerializer, RegisterSerializer, CambiarPasswordSerializer
from .permissions import IsAdmin, IsAdminOrSelf


class CustomTokenSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['rol']    = user.rol
        token['nombre'] = user.get_full_name()
        token['email']  = user.email
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['rol']    = self.user.rol
        data['nombre'] = self.user.get_full_name()
        return data


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenSerializer


class RegisterView(generics.CreateAPIView):
    queryset           = Usuario.objects.all()
    serializer_class   = RegisterSerializer
    permission_classes = [AllowAny]

    def get_permissions(self):
        if self.request.data.get('rol') == 'tecnico':
            return [IsAuthenticated(), IsAdmin()]
        return [AllowAny()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            data=request.data,
            context={'request': request}
        )
        if not serializer.is_valid():
            errors    = serializer.errors
            first_key = next(iter(errors))
            first_msg = errors[first_key]
            msg = first_msg[0] if isinstance(first_msg, list) else str(first_msg)
            return Response({'error': msg, 'detail': errors}, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        return Response({
            'id':       user.id,
            'username': user.username,
            'email':    user.email,
            'rol':      user.rol,
            'mensaje':  '¡Cuenta creada correctamente!'
        }, status=status.HTTP_201_CREATED)


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset           = Usuario.objects.all().order_by('-fecha_registro')
    serializer_class   = UsuarioSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['list', 'destroy']:
            return [IsAdmin()]
        return [IsAuthenticated()]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance == request.user:
            return Response(
                {'error': 'No podés eliminar tu propia cuenta.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)

    # ── GET /auth/usuarios/me/ ────────────────────────
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        return Response(UsuarioSerializer(request.user).data)

    # ── POST /auth/usuarios/cambiar_password/ ─────────
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def cambiar_password(self, request):
        user             = request.user
        password_actual  = request.data.get('password_actual')
        password_nuevo   = request.data.get('password_nuevo')
        password_nuevo2  = request.data.get('password_nuevo2')

        if not user.check_password(password_actual):
            return Response(
                {'error': 'La contraseña actual es incorrecta.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if password_nuevo != password_nuevo2:
            return Response(
                {'error': 'Las contraseñas nuevas no coinciden.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if len(password_nuevo) < 8:
            return Response(
                {'error': 'La contraseña debe tener al menos 8 caracteres.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        user.set_password(password_nuevo)
        user.save()
        return Response({'mensaje': 'Contraseña actualizada correctamente.'})

    # ── PATCH /auth/usuarios/{id}/cambiar_rol/ ────────
    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def cambiar_rol(self, request, pk=None):
        """
        Admin puede cambiar el rol de cualquier usuario EXCEPTO el suyo propio.
        No se puede dejar el sistema sin administradores.
        """
        solicitante = request.user

        if solicitante.rol != 'admin':
            return Response(
                {'error': 'Solo los administradores pueden cambiar roles.'},
                status=status.HTTP_403_FORBIDDEN
            )

        usuario = self.get_object()

        # No puede cambiar su propio rol
        if usuario.pk == solicitante.pk:
            return Response(
                {'error': 'No podés cambiar tu propio rol.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        nuevo_rol    = request.data.get('rol', '').strip()
        roles_validos = ['admin', 'tecnico', 'cliente']

        if nuevo_rol not in roles_validos:
            return Response(
                {'error': f'Rol inválido. Opciones: {", ".join(roles_validos)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Si se quita el rol admin, verificar que queden otros admins
        if usuario.rol == 'admin' and nuevo_rol != 'admin':
            otros_admins = Usuario.objects.filter(
                rol='admin', activo=True
            ).exclude(pk=usuario.pk).count()
            if otros_admins == 0:
                return Response(
                    {'error': 'No podés quitar el último administrador del sistema.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        usuario.rol = nuevo_rol
        usuario.save(update_fields=['rol'])

        nombre = usuario.get_full_name() or usuario.username
        return Response({
            'mensaje': f'Rol de {nombre} cambiado a {nuevo_rol}.',
            'rol':     nuevo_rol,
        })

    # ── POST /auth/usuarios/{id}/cambiar_perfil/ ──────
    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def cambiar_perfil(self, request, pk=None):
        usuario    = self.get_object()
        serializer = self.get_serializer(usuario)
        return Response(serializer.data)