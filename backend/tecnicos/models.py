# tecnicos/models.py
from django.db import models
from usuarios.models import Usuario

class Especialidad(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)

    def __str__(self):
        return self.nombre

class Tecnico(models.Model):
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name='perfil_tecnico')
    especialidades = models.ManyToManyField(Especialidad, related_name='tecnicos')
    legajo = models.CharField(max_length=20, unique=True)
    disponible = models.BooleanField(default=True)

    def __str__(self):
        return f"Tec. {self.usuario.get_full_name()} - {self.legajo}"