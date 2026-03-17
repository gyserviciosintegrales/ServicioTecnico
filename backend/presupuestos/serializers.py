# presupuestos/serializers.py
from rest_framework import serializers
from .models import Presupuesto, ItemPresupuesto


class ItemPresupuestoSerializer(serializers.ModelSerializer):
    subtotal = serializers.ReadOnlyField()

    class Meta:
        model  = ItemPresupuesto
        fields = ['id', 'descripcion', 'cantidad', 'precio_unit', 'subtotal', 'orden_item']


class PresupuestoListSerializer(serializers.ModelSerializer):
    cliente_nombre    = serializers.SerializerMethodField()
    equipo_nombre     = serializers.SerializerMethodField()
    total             = serializers.ReadOnlyField()
    subtotal          = serializers.ReadOnlyField()
    numero_display    = serializers.SerializerMethodField()
    fecha_vencimiento = serializers.ReadOnlyField()
    vencido           = serializers.ReadOnlyField()
    estado_display    = serializers.SerializerMethodField()

    class Meta:
        model  = Presupuesto
        fields = [
            'id', 'numero', 'numero_display', 'titulo', 'estado', 'estado_display',
            'cliente', 'cliente_nombre', 'equipo', 'equipo_nombre',
            'validez_dias',
            'subtotal', 'total',
            'fecha_creacion', 'fecha_envio', 'fecha_respuesta', 'fecha_vencimiento',
            'vencido', 'orden', 'solicitud_cliente',
        ]

    def get_cliente_nombre(self, obj):
        return obj.cliente.get_full_name() or obj.cliente.username

    def get_equipo_nombre(self, obj):
        if obj.equipo:
            return f'{obj.equipo.marca} {obj.equipo.modelo} — {obj.equipo.tipo}'
        return None

    def get_numero_display(self, obj):
        return str(obj.numero).zfill(4)

    def get_estado_display(self, obj):
        return obj.get_estado_display()


class PresupuestoDetailSerializer(PresupuestoListSerializer):
    items = ItemPresupuestoSerializer(many=True, read_only=True)

    class Meta(PresupuestoListSerializer.Meta):
        fields = PresupuestoListSerializer.Meta.fields + [
            'items', 'descripcion', 'condiciones', 'motivo_rechazo', 'creado_por',
            'nota_solicitud',
        ]


class PresupuestoCreateSerializer(serializers.ModelSerializer):
    items = ItemPresupuestoSerializer(many=True)

    class Meta:
        model  = Presupuesto
        fields = [
            'titulo', 'descripcion', 'cliente', 'equipo',
            'validez_dias', 'condiciones', 'items',
        ]

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        presupuesto = Presupuesto.objects.create(**validated_data)
        for i, item in enumerate(items_data):
            item.pop('orden_item', None)  # evita duplicado si el frontend lo manda
            ItemPresupuesto.objects.create(presupuesto=presupuesto, orden_item=i, **item)
        return presupuesto

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        if items_data is not None:
            instance.items.all().delete()
            for i, item in enumerate(items_data):
                item.pop('orden_item', None)  # evita duplicado si el frontend lo manda
                ItemPresupuesto.objects.create(presupuesto=instance, orden_item=i, **item)
        return instance