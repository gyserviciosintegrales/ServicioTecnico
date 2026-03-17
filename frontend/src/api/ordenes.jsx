import api from './axios';

export const getOrdenes    = (params) => api.get('/ordenes/', { params });
export const getOrden      = (id)     => api.get(`/ordenes/${id}/`);
export const createOrden   = (data)   => api.post('/ordenes/', data);
export const updateOrden   = (id, d)  => api.patch(`/ordenes/${id}/`, d);
export const deleteOrden   = (id)     => api.delete(`/ordenes/${id}/`);
export const getPdfOrden   = (id)     => api.get(`/ordenes/${id}/generar_pdf/`, { responseType: 'blob' });
export const getResumen    = (id)     => api.get(`/ordenes/${id}/resumen_tecnico/`);