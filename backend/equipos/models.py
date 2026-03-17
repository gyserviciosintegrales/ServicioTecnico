# equipos/models.py
from django.db import models
from clientes.models import Cliente

class Equipo(models.Model):
    TIPOS = (
        ('netbook', 'Netbook'),
        ('cpu', 'CPU / PC de Escritorio'),
        ('monitor', 'Monitor'),
        ('impresora', 'Impresora'),
        ('laptop', 'Laptop'),
        ('otro', 'Otro'),
    )
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='equipos')
    tipo = models.CharField(max_length=20, choices=TIPOS)
    marca = models.CharField(max_length=100)
    modelo = models.CharField(max_length=100)
    numero_serie = models.CharField(max_length=100, blank=True)
    sistema_operativo = models.CharField(max_length=100, blank=True)
    procesador = models.CharField(max_length=100, blank=True)
    ram = models.CharField(max_length=50, blank=True)
    almacenamiento = models.CharField(max_length=50, blank=True)
    descripcion_adicional = models.TextField(blank=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_tipo_display()} - {self.marca} {self.modelo}"