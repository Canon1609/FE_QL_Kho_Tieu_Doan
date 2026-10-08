import api from '../api/axiosClient'
export const companyUnits = async () => (await api.get('/transfers/company-units')).data.data
export const listTransfers = async params => (await api.get('/transfers', { params })).data.data
export const getTransfer = async id => (await api.get(`/transfers/${id}`)).data.data
export const saveTransfer = async (id, data) => (await api[id ? 'patch' : 'post'](id ? `/transfers/${id}` : '/transfers', data)).data.data
export const deleteTransfer = async id => (await api.delete(`/transfers/${id}`)).data.data
export const postTransfer = async id => (await api.post(`/transfers/${id}/post`, {})).data.data
export const companyAssets = async (id, params) => (await api.get(`/transfers/company-assets/${id}`, { params })).data.data
export const companyHistory = async (id, params) => (await api.get(`/transfers/company-assets/${id}/history`, { params })).data.data
