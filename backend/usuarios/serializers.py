# usuarios/serializers.py
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import Usuario

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Usuario
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'rol', 'telefono', 'avatar', 'activo', 'fecha_registro']
        read_only_fields = ['fecha_registro']

class RegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model  = Usuario
        fields = ['username', 'email', 'first_name', 'last_name',
                  'password', 'password2', 'telefono', 'rol']
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name':  {'required': True},
            'email':      {'required': True},
        }

    def validate_username(self, value):
        if Usuario.objects.filter(username=value).exists():
            raise serializers.ValidationError('Ese nombre de usuario ya está en uso.')
        return value

    def validate_email(self, value):
        if Usuario.objects.filter(email=value).exists():
            raise serializers.ValidationError('Ya existe una cuenta con ese email.')
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Las contraseñas no coinciden.'})
        # Solo admin puede crear técnicos
        if attrs.get('rol') == 'tecnico':
            request = self.context.get('request')
            if not request or not request.user.is_authenticated or request.user.rol != 'admin':
                raise serializers.ValidationError({'rol': 'Solo el administrador puede registrar técnicos.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = Usuario.objects.create_user(password=password, **validated_data)
        return user

class CambiarPasswordSerializer(serializers.Serializer):
    password_actual  = serializers.CharField(write_only=True)
    password_nuevo   = serializers.CharField(write_only=True, validators=[validate_password])
    password_nuevo2  = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['password_nuevo'] != attrs['password_nuevo2']:
            raise serializers.ValidationError({'password_nuevo': 'Las contraseñas no coinciden.'})
        return attrs

class CustomTokenSerializer(serializers.Serializer):
    pass