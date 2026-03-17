import api from './axios';

export const getClientes   = ()       => api.get('/clientes/');
export const getCliente    = (id)     => api.get(`/clientes/${id}/`);
export const createCliente = (data)   => api.post('/clientes/', data);
export const updateCliente = (id, d)  => api.patch(`/clientes/${id}/`, d);
export const deleteCliente = (id)     => api.delete(`/clientes/${id}/`);