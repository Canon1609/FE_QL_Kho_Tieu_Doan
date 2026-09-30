import api from '../api/axiosClient'
export const listCatalog = async (kind, params) => (await api.get(`/catalog/${kind}`, { params })).data.data
export const getCatalog = async (kind, id) => (await api.get(`/catalog/${kind}/${id}`)).data.data
export const createCatalog = async (kind, data) => (await api.post(`/catalog/${kind}`, data)).data.data
export const updateCatalog = async (kind, id, data) => (await api.patch(`/catalog/${kind}/${id}`, data)).data.data
export const statusCatalog = async (kind, id, is_active) => (await api.patch(`/catalog/${kind}/${id}/status`, { is_active })).data.data
export const deleteCatalog = async (kind, id) => (await api.delete(`/catalog/${kind}/${id}`)).data.data
