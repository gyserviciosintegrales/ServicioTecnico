# clientes/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Cliente
from .serializers import ClienteSerializer, ClienteCreateSerializer
from usuarios.permissions import IsAdmin

class ClienteViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ClienteCreateSerializer
        return ClienteSerializer

    def get_queryset(self):
        user = self.request.user
        if user.rol == 'admin':
            return Cliente.objects.select_related('usuario').all().order_by('-fecha_alta')
        if user.rol == 'cliente':
            return Cliente.objects.filter(usuario=user).select_related('usuario')
        return Cliente.objects.none()

    def get_permissions(self):
        if self.action == 'destroy':
            return [IsAdmin()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        existing = Cliente.objects.filter(usuario=request.user).first()
        if existing:
            return Response(ClienteSerializer(existing).data, status=status.HTTP_200_OK)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(usuario=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if request.user.rol == 'cliente' and instance.usuario != request.user:
            return Response({'error': 'Sin permiso.'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    # ✅ url_path explícito — resuelve el 404
    @action(
        detail=False,
        methods=['get'],
        url_path='mi_perfil',
        url_name='mi-perfil',
        permission_classes=[IsAuthenticated]
    )
    def mi_perfil(self, request):
        try:
            cliente = Cliente.objects.select_related('usuario').get(usuario=request.user)
            return Response(ClienteSerializer(cliente).data)
        except Cliente.DoesNotExist:
            return Response({'existe': False}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'], url_path='equipos', permission_classes=[IsAdmin])
    def equipos(self, request, pk=None):
        from equipos.serializers import EquipoSerializer
        return Response(EquipoSerializer(self.get_object().equipos.all(), many=True).data)

    @action(detail=True, methods=['get'], url_path='ordenes', permission_classes=[IsAdmin])
    def ordenes(self, request, pk=None):
        from ordenes.serializers import OrdenTrabajoSerializer
        from ordenes.models import OrdenTrabajo
        ots = OrdenTrabajo.objects.filter(
            equipo__cliente=self.get_object()
        ).select_related('equipo', 'tecnico__usuario')
        return Response(OrdenTrabajoSerializer(ots, many=True).data)