# chat/models.py
from django.db import models


class Conversacion(models.Model):
    ESTADOS = [
        ('abierta',   'Abierta'),
        ('en_curso',  'En curso'),
        ('cerrada',   'Cerrada'),
    ]

    cliente  = models.ForeignKey(
        'usuarios.Usuario', on_delete=models.CASCADE,
        related_name='conversaciones_como_cliente',
        limit_choices_to={'rol': 'cliente'},
    )
    agente   = models.ForeignKey(
        'usuarios.Usuario', on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='conversaciones_como_agente',
    )
    asunto   = models.CharField(max_length=200, default='Consulta general')
    estado   = models.CharField(max_length=20, choices=ESTADOS, default='abierta')
    creada   = models.DateTimeField(auto_now_add=True)
    cerrada  = models.DateTimeField(null=True, blank=True)

    # Orden relacionada (opcional)
    orden    = models.ForeignKey(
        'ordenes.OrdenTrabajo', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='chats',
    )

    class Meta:
        ordering = ['-creada']
        verbose_name = 'Conversación'
        verbose_name_plural = 'Conversaciones'

    def __str__(self):
        return f'Chat #{self.pk} — {self.cliente} [{self.estado}]'

    @property
    def no_leidos_para_agente(self):
        return self.mensajes.filter(leido=False, autor=self.cliente).count()

    @property
    def no_leidos_para_cliente(self):
        return self.mensajes.filter(leido=False).exclude(autor=self.cliente).count()


class Mensaje(models.Model):
    conversacion = models.ForeignKey(
        Conversacion, on_delete=models.CASCADE, related_name='mensajes',
    )
    autor  = models.ForeignKey(
        'usuarios.Usuario', on_delete=models.CASCADE, related_name='mensajes_chat',
    )
    texto  = models.TextField()
    fecha  = models.DateTimeField(auto_now_add=True)
    leido  = models.BooleanField(default=False)

    class Meta:
        ordering = ['fecha']

    def __str__(self):
        return f'[{self.conversacion_id}] {self.autor}: {self.texto[:40]}'