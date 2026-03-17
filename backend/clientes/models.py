# clientes/models.py
from django.db import models
from usuarios.models import Usuario

class Cliente(models.Model):
    usuario    = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name='perfil_cliente')
    dni        = models.CharField(max_length=15, unique=True, blank=True, null=True)
    direccion  = models.CharField(max_length=255, blank=True)
    ciudad     = models.CharField(max_length=100, blank=True)
    notas      = models.TextField(blank=True)
    fecha_alta = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.usuario.get_full_name()} - DNI: {self.dni or 'Sin DNI'}"