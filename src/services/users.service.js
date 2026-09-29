import api from '../api/axiosClient'
export const listUsers = async () => (await api.get('/users')).data.data
export const getUser = async (id) => (await api.get(`/users/${id}`)).data.data
export const listCompanies = async () => (await api.get('/users/company-units')).data.data
export const createCompany = async (form) => (await api.post('/users', form)).data.data
export const updateCompany = async (id, form) => (await api.patch(`/users/${id}`, form)).data.data
export const resetCompanyPassword = async (id, new_password) => (await api.post(`/users/${id}/reset-password`, { new_password })).data.data
export const deleteCompany = async (id) => (await api.delete(`/users/${id}`)).data.data
export const setUserActive = async (id, is_active) => (await api.patch(`/users/${id}/status`, { is_active })).data.data
