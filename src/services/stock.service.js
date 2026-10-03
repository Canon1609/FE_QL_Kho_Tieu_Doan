import api from '../api/axiosClient'
export const references = async () => (await api.get('/stock/references')).data.data
export const receipts = async params => (await api.get('/stock/receipts', { params })).data.data
export const receipt = async id => (await api.get(`/stock/receipts/${id}`)).data.data
export const saveReceipt = async (id, data) => (await (id ? api.patch(`/stock/receipts/${id}`, data) : api.post('/stock/receipts', data))).data.data
export const deleteReceipt = async id => (await api.delete(`/stock/receipts/${id}`)).data.data
export const postReceipt = async id => (await api.post(`/stock/receipts/${id}/post`, {})).data.data
export const balances = async params => (await api.get('/stock/balance', { params })).data.data
export const ledger = async params => (await api.get('/stock/ledger', { params })).data.data
