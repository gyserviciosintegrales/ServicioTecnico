import api from './axios';

export const getTecnicos        = ()     => api.get('/tecnicos/');
export const getTecnico         = (id)   => api.get(`/tecnicos/${id}/`);
export const createTecnico      = (d)    => api.post('/tecnicos/', d);
export const updateTecnico      = (id,d) => api.patch(`/tecnicos/${id}/`, d);
export const deleteTecnico      = (id)   => api.delete(`/tecnicos/${id}/`);
export const getEspecialidades  = ()     => api.get('/tecnicos/especialidades/');
export const createEspecialidad = (d)    => api.post('/tecnicos/especialidades/', d);