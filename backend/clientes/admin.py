from django.contrib import admin
from .models import Cliente

class EquipoInline(admin.TabularInline):
    from equipos.models import Equipo
    model        = Equipo
    extra        = 0
    fields       = ['tipo', 'marca', 'modelo', 'numero_serie', 'fecha_registro']
    readonly_fields = ['fecha_registro']
    show_change_link = True

@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display   = ['get_nombre', 'get_email', 'dni', 'ciudad', 'fecha_alta']
    search_fields  = ['usuario__first_name', 'usuario__last_name', 'usuario__email', 'dni']
    list_filter    = ['ciudad', 'fecha_alta']
    readonly_fields = ['fecha_alta']
    ordering        = ['-fecha_alta']
    list_per_page   = 25
    inlines         = [EquipoInline]

    def get_nombre(self, obj):
        return obj.usuario.get_full_name()
    get_nombre.short_description = 'Nombre completo'
    get_nombre.admin_order_field = 'usuario__first_name'

    def get_email(self, obj):
        return obj.usuario.email
    get_email.short_description = 'Email'