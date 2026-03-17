# usuarios/views.py
from rest_framework import generics, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
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
            # Devolver el primer error como string legible
            errors = serializer.errors
            first_key   = next(iter(errors))
            first_msg   = errors[first_key]
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
    queryset         = Usuario.objects.all().order_by('-fecha_registro')
    serializer_class = UsuarioSerializer
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

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        return Response(UsuarioSerializer(request.user).data)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def cambiar_password(self, request):
        serializer = CambiarPasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data['password_actual']):
                return Response({'error': 'Contraseña actual incorrecta.'}, status=400)
            user.set_password(serializer.validated_data['password_nuevo'])
            user.save()
            return Response({'mensaje': 'Contraseña actualizada correctamente.'})
        return Response(serializer.errors, status=400)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def cambiar_perfil(self, request, pk=None):
        usuario    = self.get_object()
        serializer = self.get_serializer(usuario)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def cambiar_password(self, request):
        user = request.user
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