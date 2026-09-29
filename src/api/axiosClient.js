import axios from 'axios'

const axiosClient = axios.create({
  // Never bundle a development localhost API address into the LAN production build.
  baseURL: import.meta.env.PROD ? '/api/v1' : (import.meta.env.VITE_API_BASE_URL || '/api/v1'),
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

const storageKey = 'access_token'
let token = sessionStorage.getItem(storageKey) || localStorage.getItem(storageKey)
// Local persistence is opt-in; session storage remains the default.
let unauthorizedHandler = () => {}

export function setAccessToken(value, persist = false) {
  token = value
  const remember = Boolean(value && persist)
  sessionStorage.removeItem(storageKey)
  localStorage.removeItem(storageKey)
  if (value) (remember ? localStorage : sessionStorage).setItem(storageKey, value)
}
export function getAccessToken() { return token }
export function onUnauthorized(handler) { unauthorizedHandler = handler; return () => { unauthorizedHandler = () => {} } }

axiosClient.interceptors.request.use((config) => {
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
axiosClient.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401 && !['/auth/login', '/auth/google', '/auth/google/reset', '/auth/google/link', '/auth/change-password'].some(path => error.config?.url?.endsWith(path))) unauthorizedHandler()
  if (error.response?.status === 403 && window.location.pathname !== '/forbidden') window.location.assign('/forbidden')
  return Promise.reject(error)
})

export default axiosClient
