# config/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/',          admin.site.urls),
    path('api/auth/',       include('usuarios.urls')),
    path('api/clientes/',   include('clientes.urls')),
    path('api/tecnicos/',   include('tecnicos.urls')),
    path('api/equipos/',    include('equipos.urls')),
    path('api/ordenes/',    include('ordenes.urls')),
    path('api/notificaciones/', include('notificaciones.urls')),
    path('api/chat/',         include('chat.urls')),
    path('api/auth/reset/',   include('usuarios.reset_urls')),
    path('api/presupuestos/', include('presupuestos.urls')),
    path('api/publico/', include('usuarios.ingreso_publico_urls')),
    
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)