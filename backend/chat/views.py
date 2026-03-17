# chat/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from .models import Conversacion, Mensaje
from .serializers import (
    ConversacionListSerializer,
    ConversacionDetailSerializer,
    MensajeSerializer,
)


class ConversacionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ConversacionDetailSerializer
        return ConversacionListSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def get_queryset(self):
        user = self.request.user
        if user.rol == 'cliente':
            return Conversacion.objects.filter(cliente=user).prefetch_related('mensajes')
        # Admin y técnico ven todas
        return Conversacion.objects.all().prefetch_related('mensajes')

    def create(self, request, *args, **kwargs):
        """Cliente crea una nueva conversación."""
        user = request.user
        if user.rol != 'cliente':
            return Response({'error': 'Solo los clientes pueden abrir chats.'},
                            status=status.HTTP_403_FORBIDDEN)

        asunto   = request.data.get('asunto', 'Consulta general')
        orden_id = request.data.get('orden')
        texto    = request.data.get('mensaje', '').strip()

        conv = Conversacion.objects.create(
            cliente=user,
            asunto=asunto,
            orden_id=orden_id if orden_id else None,
        )
        # Primer mensaje opcional
        if texto:
            Mensaje.objects.create(conversacion=conv, autor=user, texto=texto)

        serializer = ConversacionDetailSerializer(conv, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    # ── POST /chat/{id}/mensaje/ ────────────────────────
    @action(detail=True, methods=['post'])
    def mensaje(self, request, pk=None):
        conv  = self.get_object()
        texto = request.data.get('texto', '').strip()

        if not texto:
            return Response({'error': 'El mensaje no puede estar vacío.'},
                            status=status.HTTP_400_BAD_REQUEST)

        if conv.estado == 'cerrada':
            return Response({'error': 'Esta conversación está cerrada.'},
                            status=status.HTTP_400_BAD_REQUEST)

        # Si el agente es admin/técnico y la conv estaba abierta → en curso
        user = request.user
        if user.rol in ('admin', 'tecnico') and conv.estado == 'abierta':
            conv.agente  = user
            conv.estado  = 'en_curso'
            conv.save(update_fields=['agente', 'estado'])

        msg = Mensaje.objects.create(conversacion=conv, autor=user, texto=texto)
        serializer = MensajeSerializer(msg, context={'request': request})

        # Notificar al destinatario
        self._notificar(conv, user, texto)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    # ── POST /chat/{id}/leer/ ───────────────────────────
    @action(detail=True, methods=['post'])
    def leer(self, request, pk=None):
        """Marca como leídos los mensajes no propios."""
        conv = self.get_object()
        user = request.user
        conv.mensajes.exclude(autor=user).update(leido=True)
        return Response({'ok': True})

    # ── POST /chat/{id}/cerrar/ ─────────────────────────
    @action(detail=True, methods=['post'])
    def cerrar(self, request, pk=None):
        conv = self.get_object()
        if conv.estado == 'cerrada':
            return Response({'error': 'Ya está cerrada.'}, status=400)
        conv.estado  = 'cerrada'
        conv.cerrada = timezone.now()
        conv.save(update_fields=['estado', 'cerrada'])
        return Response({'estado': 'cerrada'})

    # ── GET /chat/{id}/mensajes/?desde={id} ────────────
    @action(detail=True, methods=['get'])
    def mensajes(self, request, pk=None):
        """Polling: devuelve mensajes nuevos desde cierto id."""
        conv   = self.get_object()
        desde  = request.query_params.get('desde')
        qs     = conv.mensajes.all()
        if desde:
            qs = qs.filter(id__gt=desde)
        # Marcar como leídos los mensajes recibidos
        qs.exclude(autor=request.user).update(leido=True)
        serializer = MensajeSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    # ── GET /chat/conteo/ ───────────────────────────────
    @action(detail=False, methods=['get'])
    def conteo(self, request):
        """Conteo de mensajes sin leer para el topbar."""
        user = request.user
        if user.rol == 'cliente':
            no_leidos = Mensaje.objects.filter(
                conversacion__cliente=user,
                leido=False,
            ).exclude(autor=user).count()
        else:
            no_leidos = Mensaje.objects.filter(
                leido=False,
            ).exclude(autor=user).filter(
                conversacion__estado__in=['abierta', 'en_curso']
            ).count()
        return Response({'no_leidos': no_leidos})

    def _notificar(self, conv, remitente, texto):
        """Crea notificación interna al destinatario."""
        try:
            from notificaciones.utils import crear_notificacion
            nombre = remitente.get_full_name() or remitente.username

            if remitente.rol == 'cliente':
                # Notificar al agente o a todos los admins
                from usuarios.models import Usuario
                destinatarios = []
                if conv.agente:
                    destinatarios = [conv.agente]
                else:
                    destinatarios = list(Usuario.objects.filter(rol='admin', activo=True))
                for dest in destinatarios:
                    crear_notificacion(
                        dest, 'sistema',
                        f'💬 Nuevo mensaje de {nombre}',
                        f'{texto[:80]}{"..." if len(texto) > 80 else ""}',
                    )
            else:
                # Notificar al cliente
                crear_notificacion(
                    conv.cliente, 'sistema',
                    f'💬 Respuesta de soporte',
                    f'{nombre}: {texto[:80]}{"..." if len(texto) > 80 else ""}',
                )
        except Exception:
            pass