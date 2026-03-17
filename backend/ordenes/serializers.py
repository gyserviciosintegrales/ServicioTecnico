# ordenes/serializers.py
from rest_framework import serializers
from .models import OrdenTrabajo, HistorialOrden
from equipos.serializers import EquipoSerializer
from tecnicos.serializers import TecnicoSerializer


class OrdenTrabajoSerializer(serializers.ModelSerializer):
    equipo_detalle  = EquipoSerializer(source='equipo', read_only=True)
    tecnico_detalle = TecnicoSerializer(source='tecnico', read_only=True)
    estado_display  = serializers.CharField(source='get_estado_display', read_only=True)
    total           = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    cliente_nombre  = serializers.SerializerMethodField()

    class Meta:
        model  = OrdenTrabajo
        fields = [
            'id', 'equipo', 'equipo_detalle', 'tecnico', 'tecnico_detalle',
            'fecha_ingreso', 'fecha_egreso', 'problema_reportado',
            'diagnostico', 'solucion_aplicada', 'estado', 'estado_display',
            'importe_mano_obra', 'importe_repuestos', 'total',
            'pagado', 'fecha_pago', 'meses_garantia', 'observaciones',
            'fecha_creacion', 'fecha_actualizacion', 'cliente_nombre',
        ]
        extra_kwargs = {
            'equipo':  {'write_only': True},
            'tecnico': {'write_only': True},
        }

    def get_cliente_nombre(self, obj):
        return obj.equipo.cliente.usuario.get_full_name()


class ResumenTecnicoSerializer(serializers.ModelSerializer):
    equipo_detalle = EquipoSerializer(source='equipo', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    cliente_nombre = serializers.SerializerMethodField()
    total          = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model  = OrdenTrabajo
        fields = [
            'id', 'equipo_detalle', 'cliente_nombre', 'fecha_ingreso',
            'fecha_egreso', 'problema_reportado', 'diagnostico',
            'solucion_aplicada', 'estado_display', 'total',
            'meses_garantia', 'observaciones',
        ]

    def get_cliente_nombre(self, obj):
        return obj.equipo.cliente.usuario.get_full_name()


class HistorialOrdenSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.SerializerMethodField()
    campo_display  = serializers.CharField(read_only=True)
    fecha          = serializers.DateTimeField(format='%d/%m/%Y %H:%M', read_only=True)

    class Meta:
        model  = HistorialOrden
        fields = [
            'id', 'campo', 'campo_display', 'valor_anterior', 'valor_nuevo',
            'descripcion', 'fecha', 'usuario_nombre',
        ]

    def get_usuario_nombre(self, obj):
        if obj.usuario:
            return obj.usuario.get_full_name() or obj.usuario.username
        return 'Sistema'