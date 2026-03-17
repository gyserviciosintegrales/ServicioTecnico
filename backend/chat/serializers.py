# chat/serializers.py
from rest_framework import serializers
from .models import Conversacion, Mensaje


class MensajeSerializer(serializers.ModelSerializer):
    autor_nombre = serializers.SerializerMethodField()
    autor_rol    = serializers.SerializerMethodField()
    fecha_display = serializers.SerializerMethodField()
    es_propio    = serializers.SerializerMethodField()

    class Meta:
        model  = Mensaje
        fields = ['id', 'texto', 'fecha', 'fecha_display',
                  'autor', 'autor_nombre', 'autor_rol', 'leido', 'es_propio']
        read_only_fields = ['id', 'fecha', 'autor']

    def get_autor_nombre(self, obj):
        return obj.autor.get_full_name() or obj.autor.username

    def get_autor_rol(self, obj):
        return obj.autor.rol

    def get_fecha_display(self, obj):
        from django.utils import timezone
        from datetime import timedelta
        ahora = timezone.now()
        diff  = ahora - obj.fecha
        if diff.total_seconds() < 60:
            return 'Ahora'
        if diff.total_seconds() < 3600:
            m = int(diff.total_seconds() // 60)
            return f'Hace {m} min'
        if diff < timedelta(hours=24):
            return obj.fecha.strftime('%H:%M')
        return obj.fecha.strftime('%d/%m %H:%M')

    def get_es_propio(self, obj):
        request = self.context.get('request')
        if request:
            return obj.autor_id == request.user.id
        return False


class ConversacionListSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.SerializerMethodField()
    agente_nombre  = serializers.SerializerMethodField()
    ultimo_mensaje = serializers.SerializerMethodField()
    no_leidos      = serializers.SerializerMethodField()
    orden_numero   = serializers.SerializerMethodField()

    class Meta:
        model  = Conversacion
        fields = ['id', 'asunto', 'estado', 'creada',
                  'cliente_nombre', 'agente_nombre',
                  'ultimo_mensaje', 'no_leidos', 'orden', 'orden_numero']

    def get_cliente_nombre(self, obj):
        return obj.cliente.get_full_name() or obj.cliente.username

    def get_agente_nombre(self, obj):
        if obj.agente:
            return obj.agente.get_full_name() or obj.agente.username
        return None

    def get_ultimo_mensaje(self, obj):
        m = obj.mensajes.last()
        if m:
            return {'texto': m.texto[:60], 'fecha': m.fecha_display if hasattr(m, 'fecha_display') else str(m.fecha)}
        return None

    def get_no_leidos(self, obj):
        request = self.context.get('request')
        if request and request.user.rol == 'cliente':
            return obj.no_leidos_para_cliente
        return obj.no_leidos_para_agente

    def get_orden_numero(self, obj):
        if obj.orden_id:
            return str(obj.orden_id).zfill(4)
        return None


class ConversacionDetailSerializer(ConversacionListSerializer):
    mensajes = MensajeSerializer(many=True, read_only=True)

    class Meta(ConversacionListSerializer.Meta):
        fields = ConversacionListSerializer.Meta.fields + ['mensajes']