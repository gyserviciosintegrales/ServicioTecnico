from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario

@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    list_display  = ['username', 'email', 'first_name', 'last_name', 'rol', 'activo', 'fecha_registro']
    list_filter   = ['rol', 'activo', 'is_staff']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering      = ['-fecha_registro']

    fieldsets = UserAdmin.fieldsets + (
        ('Datos del Taller', {
            'fields': ('rol', 'telefono', 'avatar', 'activo')
        }),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Datos del Taller', {
            'fields': ('email', 'first_name', 'last_name', 'rol', 'telefono')
        }),
    )

    list_editable    = ['activo']
    list_per_page    = 25
    readonly_fields  = ['fecha_registro']