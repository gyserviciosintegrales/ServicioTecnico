# notificaciones/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notificacion
from .serializers import NotificacionSerializer


class NotificacionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class   = NotificacionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notificacion.objects.filter(usuario=self.request.user)

    # GET /notificaciones/?no_leidas=true
    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        if request.query_params.get('no_leidas') == 'true':
            qs = qs.filter(leida=False)
        serializer = self.get_serializer(qs[:50], many=True)   # últimas 50
        return Response({
            'results':    serializer.data,
            'no_leidas':  qs.filter(leida=False).count(),
            'total':      qs.count(),
        })

    # POST /notificaciones/{id}/leer/
    @action(detail=True, methods=['post'])
    def leer(self, request, pk=None):
        notif = self.get_object()
        notif.leida = True
        notif.save(update_fields=['leida'])
        return Response({'leida': True})

    # POST /notificaciones/leer_todas/
    @action(detail=False, methods=['post'])
    def leer_todas(self, request):
        count = Notificacion.objects.filter(
            usuario=request.user, leida=False
        ).update(leida=True)
        return Response({'marcadas': count})

    # GET /notificaciones/conteo/
    @action(detail=False, methods=['get'])
    def conteo(self, request):
        no_leidas = Notificacion.objects.filter(
            usuario=request.user, leida=False
        ).count()
        return Response({'no_leidas': no_leidas})