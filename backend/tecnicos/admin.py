from django.contrib import admin
from .models import Tecnico, Especialidad

@admin.register(Especialidad)
class EspecialidadAdmin(admin.ModelAdmin):
    list_display  = ['nombre', 'descripcion']
    search_fields = ['nombre']
    ordering      = ['nombre']

class OrdenInline(admin.TabularInline):
    from ordenes.models import OrdenTrabajo
    model        = OrdenTrabajo
    extra        = 0
    fields       = ['equipo', 'estado', 'fecha_ingreso', 'fecha_egreso', 'pagado']
    readonly_fields = ['fecha_ingreso']
    show_change_link = True

@admin.register(Tecnico)
class TecnicoAdmin(admin.ModelAdmin):
    list_display   = ['get_nombre', 'legajo', 'get_especialidades', 'disponible']
    list_filter    = ['disponible', 'especialidades']
    search_fields  = ['usuario__first_name', 'usuario__last_name', 'legajo']
    filter_horizontal = ['especialidades']
    list_editable  = ['disponible']
    ordering       = ['legajo']
    list_per_page  = 25
    inlines        = [OrdenInline]

    def get_nombre(self, obj):
        return obj.usuario.get_full_name()
    get_nombre.short_description = 'Técnico'
    get_nombre.admin_order_field = 'usuario__first_name'

    def get_especialidades(self, obj):
        return ', '.join(e.nombre for e in obj.especialidades.all())
    get_especialidades.short_description = 'Especialidades'