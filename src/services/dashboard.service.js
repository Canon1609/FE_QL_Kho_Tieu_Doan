import api from '../api/axiosClient'
export const dashboardUnits = async params => (await api.get('/dashboard/units', { params })).data.data
export const dashboardFilters = async params => (await api.get('/dashboard/filters', { params })).data.data
export const dashboardSummary = async params => (await api.get('/dashboard', { params })).data.data
