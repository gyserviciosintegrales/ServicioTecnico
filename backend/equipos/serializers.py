# equipos/serializers.py
from rest_framework import serializers
from .models import Equipo

class EquipoSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.SerializerMethodField()
    tipo_display   = serializers.CharField(source='get_tipo_display', read_only=True)

    class Meta:
        model  = Equipo
        fields = '__all__'

    def get_cliente_nombre(self, obj):
        return obj.cliente.usuario.get_full_name() or obj.cliente.usuario.username

class EquipoCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Equipo
        fields = [
            'cliente', 'tipo', 'marca', 'modelo', 'numero_serie',
            'sistema_operativo', 'procesador', 'ram', 'almacenamiento',
            'descripcion_adicional',
        ]
        extra_kwargs = {
            # cliente es opcional — se asigna automáticamente para clientes
            'cliente': {'required': False},
        }

    def validate(self, attrs):
        # Si no viene cliente, se asignará en la view
        return attrs