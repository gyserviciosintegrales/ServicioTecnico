# usuarios/reset_urls.py
from django.urls import path
from .password_reset_views import SolicitarResetView, ConfirmarResetView, ValidarTokenView

urlpatterns = [
    path('solicitar/', SolicitarResetView.as_view()),
    path('confirmar/', ConfirmarResetView.as_view()),
    path('validar/',   ValidarTokenView.as_view()),
]