# usuarios/signals.py
# El Cliente NO se crea automáticamente — el usuario lo completa después del login
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Usuario

@receiver(post_save, sender=Usuario)
def crear_perfil_tecnico(sender, instance, created, **kwargs):
    """Solo auto-crea perfil para técnicos (los crea el admin, no el usuario)"""
    if created and instance.rol == 'tecnico':
        from tecnicos.models import Tecnico
        Tecnico.objects.get_or_create(
            usuario=instance,
            defaults={'legajo': f'TEC-{instance.id:04d}'}
        )