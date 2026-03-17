# clientes/serializers.py
from rest_framework import serializers
from .models import Cliente
from usuarios.serializers import UsuarioSerializer

class ClienteSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer(read_only=True)
    nombre_completo = serializers.SerializerMethodField()

    class Meta:
        model = Cliente
        fields = ['id', 'usuario', 'nombre_completo', 'dni',
                  'direccion', 'ciudad', 'notas', 'fecha_alta']

    def get_nombre_completo(self, obj):
        return obj.usuario.get_full_name()

class ClienteCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = ['dni', 'direccion', 'ciudad', 'notas']

    def validate_dni(self, value):
        if Cliente.objects.filter(dni=value).exists():
            raise serializers.ValidationError("Ya existe un cliente con ese DNI.")
        return value