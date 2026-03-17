# ordenes/models.py
from django.db import models
from equipos.models import Equipo
from tecnicos.models import Tecnico


class OrdenTrabajo(models.Model):
    ESTADOS = (
        ('ingresado',          'Ingresado'),
        ('diagnostico',        'En Diagnóstico'),
        ('en_reparacion',      'En Reparación'),
        ('esperando_repuesto', 'Esperando Repuesto'),
        ('listo',              'Listo para Retirar'),
        ('entregado',          'Entregado'),
        ('sin_reparacion',     'Sin Reparación Posible'),
    )

    equipo             = models.ForeignKey(Equipo, on_delete=models.CASCADE, related_name='ordenes')
    tecnico            = models.ForeignKey(Tecnico, on_delete=models.SET_NULL, null=True, blank=True, related_name='ordenes')
    fecha_ingreso      = models.DateField(auto_now_add=True)
    fecha_egreso       = models.DateField(null=True, blank=True)
    problema_reportado = models.TextField()
    diagnostico        = models.TextField(blank=True)
    solucion_aplicada  = models.TextField(blank=True)
    estado             = models.CharField(max_length=20, choices=ESTADOS, default='ingresado')
    importe_mano_obra  = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    importe_repuestos  = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    pagado             = models.BooleanField(default=False)
    fecha_pago         = models.DateField(null=True, blank=True)
    meses_garantia     = models.PositiveIntegerField(default=3)
    observaciones      = models.TextField(blank=True)
    fecha_creacion     = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    @property
    def total(self):
        return self.importe_mano_obra + self.importe_repuestos

    def __str__(self):
        return f"OT #{self.id} - {self.equipo} [{self.estado}]"


class HistorialOrden(models.Model):
    CAMPOS_DISPLAY = {
        'estado':            'Estado',
        'diagnostico':       'Diagnóstico',
        'solucion_aplicada': 'Solución aplicada',
        'tecnico':           'Técnico asignado',
        'importe_mano_obra': 'Mano de obra',
        'importe_repuestos': 'Repuestos',
        'pagado':            'Estado de pago',
        'fecha_egreso':      'Fecha de egreso',
        'meses_garantia':    'Meses de garantía',
        'observaciones':     'Observaciones',
    }

    orden           = models.ForeignKey(OrdenTrabajo, on_delete=models.CASCADE, related_name='historial')
    usuario         = models.ForeignKey('usuarios.Usuario', on_delete=models.SET_NULL, null=True, blank=True)
    campo           = models.CharField(max_length=50)
    valor_anterior  = models.TextField(blank=True, null=True)
    valor_nuevo     = models.TextField(blank=True, null=True)
    fecha           = models.DateTimeField(auto_now_add=True)
    descripcion     = models.TextField(blank=True)

    class Meta:
        ordering            = ['-fecha']
        verbose_name        = 'Historial de Orden'
        verbose_name_plural = 'Historial de Órdenes'

    def __str__(self):
        return f'Orden #{self.orden.id} — {self.campo} — {self.fecha}'

    @property
    def campo_display(self):
        return self.CAMPOS_DISPLAY.get(self.campo, self.campo)