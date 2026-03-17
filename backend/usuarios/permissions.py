# usuarios/permissions.py
from rest_framework.permissions import BasePermission

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.rol == 'admin'

class IsTecnico(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.rol == 'tecnico'

class IsCliente(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.rol == 'cliente'

class IsAdminOrTecnico(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.rol in ['admin', 'tecnico']

class IsAdminOrSelf(BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.user.rol == 'admin' or obj == request.user