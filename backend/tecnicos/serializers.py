# tecnicos/serializers.py
from rest_framework import serializers
from django.db import transaction
from django.contrib.auth.password_validation import validate_password
from .models import Tecnico, Especialidad
from usuarios.models import Usuario
from usuarios.serializers import UsuarioSerializer

class EspecialidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Especialidad
        fields = ['id', 'nombre', 'descripcion']

class TecnicoSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer(read_only=True)
    especialidades = EspecialidadSerializer(many=True, read_only=True)
    especialidades_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Especialidad.objects.all(),
        write_only=True, source='especialidades', required=False
    )
    nombre_completo = serializers.SerializerMethodField()

    class Meta:
        model = Tecnico
        fields = ['id', 'usuario', 'nombre_completo', 'legajo',
                  'especialidades', 'especialidades_ids', 'disponible']

    def get_nombre_completo(self, obj):
        return obj.usuario.get_full_name()

    def update(self, instance, validated_data):
        especialidades = validated_data.pop('especialidades', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if especialidades is not None:
            instance.especialidades.set(especialidades)
        return instance

class TecnicoCreateSerializer(serializers.Serializer):
    # Datos del usuario
    username    = serializers.CharField()
    email       = serializers.EmailField()
    first_name  = serializers.CharField()
    last_name   = serializers.CharField()
    telefono    = serializers.CharField(required=False, allow_blank=True)
    password    = serializers.CharField(write_only=True, validators=[validate_password])
    password2   = serializers.CharField(write_only=True)
    # Datos del técnico
    legajo      = serializers.CharField()
    disponible  = serializers.BooleanField(default=True)
    especialidades_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Especialidad.objects.all(), required=False
    )

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Las contraseñas no coinciden.'})
        if Usuario.objects.filter(username=attrs['username']).exists():
            raise serializers.ValidationError({'username': 'Ya existe un usuario con ese nombre.'})
        if Usuario.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({'email': 'Ya existe un usuario con ese email.'})
        if Tecnico.objects.filter(legajo=attrs['legajo']).exists():
            raise serializers.ValidationError({'legajo': 'Ya existe un técnico con ese legajo.'})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        especialidades = validated_data.pop('especialidades_ids', [])
        validated_data.pop('password2')
        password = validated_data.pop('password')

        user = Usuario.objects.create_user(
            username=validated_data.pop('username'),
            email=validated_data.pop('email'),
            first_name=validated_data.pop('first_name'),
            last_name=validated_data.pop('last_name'),
            telefono=validated_data.pop('telefono', ''),
            password=password,
            rol='tecnico'
        )
        tecnico = Tecnico.objects.create(
            usuario=user,
            legajo=validated_data.pop('legajo'),
            disponible=validated_data.pop('disponible', True)
        )
        if especialidades:
            tecnico.especialidades.set(especialidades)
        return tecnico