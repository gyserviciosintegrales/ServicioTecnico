# equipos/views.py
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from .models import Equipo
from .serializers import EquipoSerializer, EquipoCreateSerializer
from usuarios.permissions import IsAdmin

class EquipoViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends    = [DjangoFilterBackend, SearchFilter]
    filterset_fields   = ['tipo', 'marca', 'cliente']
    search_fields      = ['marca', 'modelo', 'numero_serie']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return EquipoCreateSerializer
        return EquipoSerializer

    def get_queryset(self):
        user = self.request.user
        if user.rol == 'admin':
            qs = Equipo.objects.select_related('cliente__usuario').all().order_by('-fecha_registro')
            # Filtro por Cliente ID (usado por el modal de presupuestos)
            cliente_id = self.request.query_params.get('cliente_id')
            if cliente_id:
                qs = qs.filter(cliente_id=cliente_id)
            return qs
        if user.rol == 'tecnico':
            # Técnico ve equipos de sus órdenes asignadas
            from ordenes.models import OrdenTrabajo
            equipos_ids = OrdenTrabajo.objects.filter(
                tecnico__usuario=user
            ).values_list('equipo_id', flat=True)
            return Equipo.objects.filter(id__in=equipos_ids).select_related('cliente__usuario')
        if user.rol == 'cliente':
            # Cliente ve solo sus propios equipos
            try:
                return Equipo.objects.filter(
                    cliente__usuario=user
                ).select_related('cliente__usuario').order_by('-fecha_registro')
            except Exception:
                return Equipo.objects.none()
        return Equipo.objects.none()

    def get_permissions(self):
        if self.action == 'destroy':
            return [IsAdmin()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        user = request.user

        # Admin debe especificar cliente
        if user.rol == 'admin':
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        # Cliente crea equipo para sí mismo
        if user.rol == 'cliente':
            from clientes.models import Cliente
            try:
                cliente = Cliente.objects.get(usuario=user)
            except Cliente.DoesNotExist:
                return Response(
                    {'error': 'Primero completá tu perfil de cliente antes de registrar equipos.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(cliente=cliente)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response({'error': 'Sin permiso para crear equipos.'}, status=status.HTTP_403_FORBIDDEN)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        # Cliente solo puede editar sus propios equipos
        if request.user.rol == 'cliente' and instance.cliente.usuario != request.user:
            return Response({'error': 'Sin permiso.'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)