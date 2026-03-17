# notificaciones/serializers.py
from rest_framework import serializers
from .models import Notificacion


class NotificacionSerializer(serializers.ModelSerializer):
    tipo_display  = serializers.CharField(source='get_tipo_display', read_only=True)
    fecha_display = serializers.SerializerMethodField()

    class Meta:
        model  = Notificacion
        fields = [
            'id', 'tipo', 'tipo_display', 'titulo', 'mensaje',
            'leida', 'fecha', 'fecha_display', 'orden',
        ]
        read_only_fields = ['id', 'tipo', 'titulo', 'mensaje', 'fecha', 'orden']

    def get_fecha_display(self, obj):
        from django.utils import timezone
        from datetime import timedelta
        ahora   = timezone.now()
        diff    = ahora - obj.fecha
        segundos = int(diff.total_seconds())
        if segundos < 60:
            return 'Hace un momento'
        if segundos < 3600:
            m = segundos // 60
            return f'Hace {m} min{"uto" if m == 1 else "utos"}'
        if segundos < 86400:
            h = segundos // 3600
            return f'Hace {h} hora{"" if h == 1 else "s"}'
        if diff < timedelta(days=7):
            d = diff.days
            return f'Hace {d} día{"" if d == 1 else "s"}'
        return obj.fecha.strftime('%d/%m/%Y %H:%M')