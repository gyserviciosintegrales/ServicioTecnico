# tecnicos/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TecnicoViewSet, EspecialidadViewSet

router = DefaultRouter()
# Registra primero la ruta más específica (especialidades)
router.register(r'especialidades', EspecialidadViewSet, basename='especialidades')
# Registra al final la ruta general
router.register(r'', TecnicoViewSet, basename='tecnicos')

urlpatterns = [path('', include(router.urls))]