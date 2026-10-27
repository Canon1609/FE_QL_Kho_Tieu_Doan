import api from '../api/axiosClient'
export const searchMaterials = async params => (await api.get('/search/materials', { params })).data.data
export const searchUnits = async () => (await api.get('/search/materials/units')).data.data
export const materialDetail = async (id, params) => (await api.get(`/search/materials/${id}`, { params })).data.data
export const materialHistory = async (id, params) => (await api.get(`/search/materials/${id}/history`, { params })).data.data
