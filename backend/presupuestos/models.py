# presupuestos/models.py
from django.db import models
from django.utils import timezone


class Presupuesto(models.Model):
    ESTADOS = [
        ('borrador',  'Borrador'),
        ('enviado',   'Enviado al cliente'),
        ('aprobado',  'Aprobado'),
        ('rechazado', 'Rechazado'),
        ('vencido',   'Vencido'),
        ('convertido','Convertido a orden'),
    ]

    cliente         = models.ForeignKey(
        'usuarios.Usuario', on_delete=models.CASCADE,
        related_name='presupuestos', limit_choices_to={'rol': 'cliente'},
    )
    equipo          = models.ForeignKey(
        'equipos.Equipo', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='presupuestos',
    )
    orden           = models.OneToOneField(
        'ordenes.OrdenTrabajo', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='presupuesto_origen',
    )

    numero          = models.PositiveIntegerField(unique=True, editable=False)
    titulo          = models.CharField(max_length=200)
    descripcion     = models.TextField(blank=True)
    estado          = models.CharField(max_length=20, choices=ESTADOS, default='borrador')

    validez_dias    = models.PositiveIntegerField(default=15)
    condiciones     = models.TextField(blank=True)

    fecha_creacion  = models.DateTimeField(auto_now_add=True)
    fecha_envio     = models.DateTimeField(null=True, blank=True)
    fecha_respuesta = models.DateTimeField(null=True, blank=True)
    motivo_rechazo  = models.TextField(blank=True)

    solicitud_cliente = models.BooleanField(default=False)  # True si lo solicitó el cliente
    nota_solicitud   = models.TextField(blank=True)  # Descripción del problema que envía el cliente

    creado_por      = models.ForeignKey(
        'usuarios.Usuario', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='presupuestos_creados',
    )

    class Meta:
        ordering = ['-fecha_creacion']
        verbose_name = 'Presupuesto'
        verbose_name_plural = 'Presupuestos'

    def save(self, *args, **kwargs):
        if not self.numero:
            ultimo = Presupuesto.objects.order_by('-numero').first()
            self.numero = (ultimo.numero + 1) if ultimo else 1
        super().save(*args, **kwargs)

    def __str__(self):
        return f'Pres. #{str(self.numero).zfill(4)} — {self.cliente}'

    @property
    def subtotal(self):
        return sum(item.subtotal for item in self.items.all())

    @property
    def total(self):
        return self.subtotal

    @property
    def vencido(self):
        if self.estado not in ('enviado',):
            return False
        if not self.fecha_envio:
            return False
        from datetime import timedelta
        return timezone.now() > self.fecha_envio + timedelta(days=self.validez_dias)

    @property
    def fecha_vencimiento(self):
        if self.fecha_envio:
            from datetime import timedelta
            return self.fecha_envio + timedelta(days=self.validez_dias)
        return None


class ItemPresupuesto(models.Model):
    presupuesto = models.ForeignKey(
        Presupuesto, on_delete=models.CASCADE, related_name='items',
    )
    descripcion = models.CharField(max_length=300)
    cantidad    = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    precio_unit = models.DecimalField(max_digits=12, decimal_places=2)
    orden_item  = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['orden_item', 'id']

    @property
    def subtotal(self):
        return self.cantidad * self.precio_unit

    def __str__(self):
        return f'{self.descripcion} x{self.cantidad}'