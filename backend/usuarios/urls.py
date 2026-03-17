# usuarios/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LoginView, RegisterView, UsuarioViewSet

router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet, basename='usuarios')

urlpatterns = [
    path('login/',           LoginView.as_view(),    name='login'),
    path('register/',        RegisterView.as_view(), name='register'),
    path('token/refresh/',   TokenRefreshView.as_view(), name='token_refresh'),
    path('',                 include(router.urls)),

]