from django.urls import path
from .ingreso_publico_views import IngresoClientePublicoView

urlpatterns = [
    path('ingreso-cliente/', IngresoClientePublicoView.as_view()),
]