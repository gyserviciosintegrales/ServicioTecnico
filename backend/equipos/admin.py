from django.contrib import admin
from .models import Equipo

class OrdenInline(admin.TabularInline):
    from ordenes.models import OrdenTrabajo
    model        = OrdenTrabajo
    extra        = 0
    fields       = ['tecnico', 'estado', 'problema_reportado', 'fecha_ingreso', 'fecha_egreso', 'total_display']
    readonly_fields = ['fecha_ingreso', 'total_display']
    show_change_link = True

    def total_display(self, obj):
        return f'$ {obj.total:.2f}'
    total_display.short_description = 'Total'

@admin.register(Equipo)
class EquipoAdmin(admin.ModelAdmin):
    list_display   = ['get_cliente', 'tipo', 'marca', 'modelo', 'numero_serie', 'sistema_operativo', 'fecha_registro']
    list_filter    = ['tipo', 'marca', 'fecha_registro']
    search_fields  = ['marca', 'modelo', 'numero_serie', 'cliente__usuario__first_name', 'cliente__usuario__last_name']
    readonly_fields = ['fecha_registro']
    ordering        = ['-fecha_registro']
    list_per_page   = 25
    inlines         = [OrdenInline]

    fieldsets = (
        ('Cliente', {
            'fields': ('cliente',)
        }),
        ('Identificación', {
            'fields': ('tipo', 'marca', 'modelo', 'numero_serie')
        }),
        ('Especificaciones técnicas', {
            'fields': ('sistema_operativo', 'procesador', 'ram', 'almacenamiento'),
            'classes': ('collapse',)
        }),
        ('Observaciones', {
            'fields': ('descripcion_adicional', 'fecha_registro')
        }),
    )

    def get_cliente(self, obj):
        return obj.cliente.usuario.get_full_name()
    get_cliente.short_description = 'Cliente'
    get_cliente.admin_order_field = 'cliente__usuario__first_name'