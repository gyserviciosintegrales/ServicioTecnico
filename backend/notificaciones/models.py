# notificaciones/models.py
from django.db import models


class Notificacion(models.Model):
    TIPOS = [
        ('orden_nueva',      '🆕 Orden nueva'),
        ('estado_cambio',    '🔄 Cambio de estado'),
        ('orden_asignada',   '👨‍💻 Orden asignada'),
        ('pago_registrado',  '💳 Pago registrado'),
        ('orden_lista',      '✅ Lista para retirar'),
        ('sistema',          '⚙️ Sistema'),
    ]

    usuario    = models.ForeignKey(
        'usuarios.Usuario',
        on_delete=models.CASCADE,
        related_name='notificaciones',
    )
    tipo       = models.CharField(max_length=30, choices=TIPOS)
    titulo     = models.CharField(max_length=200)
    mensaje    = models.TextField()
    leida      = models.BooleanField(default=False)
    fecha      = models.DateTimeField(auto_now_add=True)
    orden      = models.ForeignKey(
        'ordenes.OrdenTrabajo',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='notificaciones',
    )

    class Meta:
        ordering = ['-fecha']
        verbose_name = 'Notificación'
        verbose_name_plural = 'Notificaciones'

    def __str__(self):
        return f'[{self.tipo}] {self.titulo} → {self.usuario}'