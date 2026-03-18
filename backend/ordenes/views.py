# ordenes/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.http import HttpResponse
import io
from .models import OrdenTrabajo, HistorialOrden
from .serializers import OrdenTrabajoSerializer, ResumenTecnicoSerializer, HistorialOrdenSerializer
from usuarios.permissions import IsAdmin, IsAdminOrTecnico


class OrdenTrabajoViewSet(viewsets.ModelViewSet):
    serializer_class   = OrdenTrabajoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends    = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields   = ['estado', 'pagado', 'tecnico', 'equipo__tipo']
    search_fields      = ['problema_reportado', 'equipo__marca', 'equipo__modelo',
                          'equipo__cliente__usuario__first_name']
    ordering_fields    = ['fecha_ingreso', 'fecha_egreso', 'estado', 'importe_mano_obra']

    def get_queryset(self):
        user = self.request.user
        if user.rol == 'admin':
            return OrdenTrabajo.objects.select_related(
                'equipo__cliente__usuario', 'tecnico__usuario'
            ).all().order_by('-fecha_creacion')
        if user.rol == 'tecnico':
            return OrdenTrabajo.objects.filter(
                tecnico__usuario=user
            ).select_related('equipo__cliente__usuario', 'tecnico__usuario')
        if user.rol == 'cliente':
            return OrdenTrabajo.objects.filter(
                equipo__cliente__usuario=user
            ).select_related('equipo__cliente__usuario', 'tecnico__usuario')
        return OrdenTrabajo.objects.none()

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [IsAdmin()]
        if self.action in ['update', 'partial_update']:
            return [IsAdminOrTecnico()]
        return [IsAuthenticated()]

    # ── Guardar usuario modificador ──────────────────────────────────────────
    def perform_update(self, serializer):
        serializer.instance._usuario_modificador = self.request.user
        serializer.save()

    def perform_create(self, serializer):
        instance = serializer.save()
        instance._usuario_modificador = self.request.user

    # ── Historial ────────────────────────────────────────────────────────────
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def historial(self, request, pk=None):
        orden    = self.get_object()
        entradas = HistorialOrden.objects.filter(orden=orden).select_related('usuario')
        return Response(HistorialOrdenSerializer(entradas, many=True).data)

    # ── Estadísticas ─────────────────────────────────────────────────────────
    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def estadisticas(self, request):
        from django.db.models import Sum, Count
        from django.utils import timezone

        hoy        = timezone.now().date()
        inicio_mes = hoy.replace(day=1)
        qs         = OrdenTrabajo.objects.all()

        stats = {
            'total_ordenes':   qs.count(),
            'en_proceso':      qs.filter(estado__in=[
                                   'ingresado', 'diagnostico',
                                   'en_reparacion', 'esperando_repuesto',
                               ]).count(),
            'listas':          qs.filter(estado='listo').count(),
            'entregadas_mes':  qs.filter(estado='entregado', fecha_egreso__gte=inicio_mes).count(),
            'pendientes_pago': qs.filter(pagado=False, estado='entregado').count(),
            'total_cobrado':   float(
                qs.filter(pagado=True).aggregate(
                    t=Sum('importe_mano_obra') + Sum('importe_repuestos')
                )['t'] or 0
            ),
            'cobrado_mes':     float(
                qs.filter(pagado=True, fecha_pago__gte=inicio_mes).aggregate(
                    t=Sum('importe_mano_obra') + Sum('importe_repuestos')
                )['t'] or 0
            ),
            'por_estado': {
                e['estado']: e['total']
                for e in qs.values('estado').annotate(total=Count('id'))
            },
        }
        return Response(stats)

    # ── Generar PDF (nuevo diseño profesional) ───────────────────────────────
    @action(detail=True, methods=['get'])
    def generar_pdf(self, request, pk=None):
        from .pdf_generator import generar_pdf_orden
        orden     = self.get_object()
        pdf_bytes = generar_pdf_orden(orden)
        response  = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="orden_{orden.id:04d}.pdf"'
        return response

    # ── Resumen técnico ───────────────────────────────────────────────────────
    @action(detail=True, methods=['get'])
    def resumen_tecnico(self, request, pk=None):
        orden = self.get_object()
        user  = request.user
        if user.rol == 'tecnico' and (not orden.tecnico or orden.tecnico.usuario != user):
            return Response({'error': 'No tenés acceso a esta orden.'}, status=403)
        return Response(ResumenTecnicoSerializer(orden).data)