import api from '../api/axiosClient'
export const borrowReferences = async () => (await api.get('/borrow/references')).data.data
export const borrowedAt = async params => (await api.get('/borrow/borrowed-at', { params })).data.data
export const listBorrow = async params => (await api.get('/borrow', { params })).data.data
export const getBorrow = async id => (await api.get(`/borrow/${id}`)).data.data
export const saveBorrow = async (id, body) => (await api[id ? 'patch' : 'post'](id ? `/borrow/${id}` : '/borrow', body)).data.data
export const borrowAction = async (id, action, body = {}) => (await api.post(`/borrow/${id}/${action}`, body)).data.data
export const saveBorrowReturn = async (id, returnId, body) => (await api[returnId ? 'patch' : 'post'](returnId ? `/borrow/${id}/returns/${returnId}` : `/borrow/${id}/returns`, body)).data.data
export const postBorrowReturn = async (id, returnId) => (await api.post(`/borrow/${id}/returns/${returnId}/post`, {})).data.data
export const deleteBorrowReturn = async (id, returnId) => (await api.delete(`/borrow/${id}/returns/${returnId}`)).data.data
