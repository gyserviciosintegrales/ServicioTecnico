# usuarios/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class Usuario(AbstractUser):
    ROLES = (
        ('admin', 'Administrador'),
        ('tecnico', 'Técnico'),
        ('cliente', 'Cliente'),
    )
    rol = models.CharField(max_length=10, choices=ROLES, default='cliente')
    telefono = models.CharField(max_length=20, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    activo = models.BooleanField(default=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.username} ({self.rol})"

# Agregar al FINAL de usuarios/models.py (después de la clase Usuario)

class PasswordResetToken(models.Model):
    usuario = models.ForeignKey(
        'Usuario', on_delete=models.CASCADE, related_name='reset_tokens'
    )
    token   = models.CharField(max_length=128, unique=True)
    creado  = models.DateTimeField(auto_now_add=True)
    expira  = models.DateTimeField()
    usado   = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Token de reseteo'
        ordering = ['-creado']

    def __str__(self):
        return f'Reset token para {self.usuario} (usado={self.usado})'