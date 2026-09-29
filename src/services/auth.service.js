import axiosClient from '../api/axiosClient'
export async function login(username, password) {
  const response = await axiosClient.post('/auth/login', { username, password })
  return response.data.data
}
export const googleLogin = async credential => (await axiosClient.post('/auth/google', { credential })).data.data
export const linkGoogle = async (credential, current_password) => (await axiosClient.post('/auth/google/link', { credential, current_password })).data.data
export const googleReset = async (credential, new_password) => (await axiosClient.post('/auth/google/reset', { credential, new_password })).data.data
export const changePassword = async (current_password, new_password) => (await axiosClient.post('/auth/change-password', { current_password, new_password })).data.data
export async function getMe() {
  const response = await axiosClient.get('/auth/me')
  return response.data.data
}
