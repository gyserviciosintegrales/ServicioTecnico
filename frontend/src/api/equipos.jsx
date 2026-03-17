import api from './axios';

export const getEquipos   = (params) => api.get('/equipos/', { params });
export const getEquipo    = (id)     => api.get(`/equipos/${id}/`);
export const createEquipo = (data)   => api.post('/equipos/', data);
export const updateEquipo = (id, d)  => api.patch(`/equipos/${id}/`, d);
export const deleteEquipo = (id)     => api.delete(`/equipos/${id}/`);