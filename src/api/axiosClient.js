import axios from 'axios'

const axiosClient = axios.create({
  // Never bundle a development localhost API address into the LAN production build.
  baseURL: import.meta.env.PROD ? '/api/v1' : (import.meta.env.VITE_API_BASE_URL || '/api/v1'),
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
  // Axios's default forced-JSON parser throws on empty/malformed error bodies.
  // Preserve non-JSON payloads as text so pages can present a safe fallback.
  transformResponse: [data => {
    if (typeof data !== 'string' || !data.length) return data
    try { return JSON.parse(data) } catch { return data }
  }],
})

const storageKey = 'access_token'
const storage = typeof window === 'undefined' ? null : window
let token = storage?.sessionStorage?.getItem(storageKey) || storage?.localStorage?.getItem(storageKey)
// Local persistence is opt-in; session storage remains the default.
let unauthorizedHandler = () => {}

export function setAccessToken(value, persist = false) {
  token = value
  const remember = Boolean(value && persist)
  storage?.sessionStorage?.removeItem(storageKey)
  storage?.localStorage?.removeItem(storageKey)
  if (value) (remember ? storage?.localStorage : storage?.sessionStorage)?.setItem(storageKey, value)
}
export function getAccessToken() { return token }
export function onUnauthorized(handler) { unauthorizedHandler = handler; return () => { unauthorizedHandler = () => {} } }

axiosClient.interceptors.request.use((config) => {
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
axiosClient.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401 && !['/auth/login', '/auth/google', '/auth/google/reset', '/auth/google/link', '/auth/change-password'].some(path => error.config?.url?.endsWith(path))) unauthorizedHandler()
  // Read-only search has an inline error/retry state; redirecting loses filters and prevents retry.
  // Keep the global forbidden route for all other workflows.
  if (error.response?.status === 403 && !error.config?.url?.startsWith('/search/materials') && !error.config?.url?.startsWith('/damage-loss') && typeof window !== 'undefined' && window.location.pathname !== '/forbidden') window.location.assign('/forbidden')
  return Promise.reject(error)
})

export default axiosClient
