# tecnicos/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from .models import Tecnico, Especialidad
from .serializers import TecnicoSerializer, TecnicoCreateSerializer, EspecialidadSerializer
from usuarios.permissions import IsAdmin, IsAdminOrTecnico

class TecnicoViewSet(viewsets.ModelViewSet):
    queryset = Tecnico.objects.select_related('usuario').prefetch_related('especialidades').all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return TecnicoCreateSerializer
        return TecnicoSerializer

    def get_queryset(self):
        user = self.request.user
        if user.rol == 'admin':
            return Tecnico.objects.select_related('usuario').prefetch_related('especialidades').all()
        if user.rol == 'tecnico':
            return Tecnico.objects.filter(usuario=user)
        return Tecnico.objects.none()

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [IsAdmin()]
        if self.action in ['update', 'partial_update']:
            return [IsAdminOrTecnico()]
        return [IsAuthenticated()]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tecnico = serializer.save()
        return Response(TecnicoSerializer(tecnico).data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        tecnico = self.get_object()
        usuario = tecnico.usuario
        tecnico.delete()
        usuario.delete()
        return Response({'mensaje': 'Técnico eliminado correctamente.'}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin])
    def toggle_disponible(self, request, pk=None):
        tecnico = self.get_object()
        tecnico.disponible = not tecnico.disponible
        tecnico.save()
        return Response({'disponible': tecnico.disponible})

class EspecialidadViewSet(viewsets.ModelViewSet):
    queryset = Especialidad.objects.all()
    serializer_class = EspecialidadSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdmin()]