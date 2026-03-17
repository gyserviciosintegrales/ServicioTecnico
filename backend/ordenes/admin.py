from django.contrib import admin
from django.utils.html import format_html
from .models import OrdenTrabajo

@admin.register(OrdenTrabajo)
class OrdenTrabajoAdmin(admin.ModelAdmin):
    list_display  = [
        'id_formateado', 'get_cliente', 'get_equipo', 'tecnico',
        'estado_badge', 'total_display', 'pago_badge',
        'fecha_ingreso', 'fecha_egreso'
    ]
    list_filter   = ['estado', 'pagado', 'fecha_ingreso', 'tecnico']
    search_fields = [
        'equipo__cliente__usuario__first_name',
        'equipo__cliente__usuario__last_name',
        'equipo__marca', 'equipo__modelo',
        'problema_reportado'
    ]
    readonly_fields  = ['fecha_creacion', 'fecha_actualizacion', 'total_display']
    ordering         = ['-fecha_creacion']
    list_per_page    = 25
    date_hierarchy   = 'fecha_ingreso'

    fieldsets = (
        ('Datos principales', {
            'fields': ('equipo', 'tecnico', 'estado')
        }),
        ('Fechas', {
            'fields': ('fecha_ingreso', 'fecha_egreso')
        }),
        ('Descripción técnica', {
            'fields': ('problema_reportado', 'diagnostico', 'solucion_aplicada', 'observaciones')
        }),
        ('Costos y pago', {
            'fields': ('importe_mano_obra', 'importe_repuestos', 'total_display', 'pagado', 'fecha_pago')
        }),
        ('Garantía', {
            'fields': ('meses_garantia',)
        }),
        ('Auditoría', {
            'fields': ('fecha_creacion', 'fecha_actualizacion'),
            'classes': ('collapse',)
        }),
    )

    def id_formateado(self, obj):
        return format_html('<b style="color:#06b6d4">#{:04d}</b>', obj.id)
    id_formateado.short_description = '#'
    id_formateado.admin_order_field = 'id'

    def get_cliente(self, obj):
        return obj.equipo.cliente.usuario.get_full_name()
    get_cliente.short_description = 'Cliente'

    def get_equipo(self, obj):
        return f'{obj.equipo.get_tipo_display()} — {obj.equipo.marca} {obj.equipo.modelo}'
    get_equipo.short_description = 'Equipo'

    def total_display(self, obj):
        return f'$ {obj.total:.2f}'
    total_display.short_description = 'Total'

    ESTADO_COLORS = {
        'ingresado':          '#06b6d4',
        'diagnostico':        '#8b5cf6',
        'en_reparacion':      '#f59e0b',
        'esperando_repuesto': '#f97316',
        'listo':              '#10b981',
        'entregado':          '#94a3b8',
        'sin_reparacion':     '#ef4444',
    }

    def estado_badge(self, obj):
        color = self.ESTADO_COLORS.get(obj.estado, '#94a3b8')
        return format_html(
            '<span style="background:{0}22;color:{0};border:1px solid {0}44;'
            'padding:2px 10px;border-radius:999px;font-size:11px;font-weight:600">'
            '{1}</span>',
            color, obj.get_estado_display()
        )
    estado_badge.short_description = 'Estado'

    def pago_badge(self, obj):
        if obj.pagado:
            return format_html(
                '<span style="background:#10b98122;color:#10b981;border:1px solid #10b98144;'
                'padding:2px 10px;border-radius:999px;font-size:11px;font-weight:600">'
                '✓ Pagado</span>'
            )
        return format_html(
            '<span style="background:#ef444422;color:#ef4444;border:1px solid #ef444444;'
            'padding:2px 10px;border-radius:999px;font-size:11px;font-weight:600">'
            '✗ Pendiente</span>'
        )
    pago_badge.short_description = 'Pago'