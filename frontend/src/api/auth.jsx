import api from './axios';

export const getUsuarios    = ()       => api.get('/auth/usuarios/');
export const getUsuario     = (id)     => api.get(`/auth/usuarios/${id}/`);
export const updateUsuario  = (id, d)  => api.patch(`/auth/usuarios/${id}/`, d);
export const deleteUsuario  = (id)     => api.delete(`/auth/usuarios/${id}/`);
export const getMe          = ()       => api.get('/auth/usuarios/me/');
export const getEstadisticas= ()       => api.get('/ordenes/estadisticas/');