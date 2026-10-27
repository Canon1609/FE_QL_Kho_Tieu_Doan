import api from '../api/axiosClient'
export const locations = async () => (await api.get('/locations')).data.data
export const locationUnits = async () => (await api.get('/locations/units')).data.data
export const locationBalance = async params => (await api.get('/locations/balance', { params })).data.data
export const saveLocation = async (id, body) => (await api[id ? 'put' : 'post'](id ? `/locations/${id}` : '/locations', body)).data.data
export const deleteLocation = async id => (await api.delete(`/locations/${id}`)).data.data
