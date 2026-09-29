import { useEffect, useState } from 'react'
import { AuthContext } from './useAuth' 
import { getAccessToken, onUnauthorized, setAccessToken } from '../api/axiosClient'
import { getMe, googleLogin, login as loginRequest } from '../services/auth.service'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(getAccessToken()))
  useEffect(() => {
    let active = true
    const unsubscribe = onUnauthorized(() => { setAccessToken(null); setUser(null); setLoading(false) })
    if (getAccessToken()) getMe().then((result) => { if (active) setUser(result) })
      .catch(() => { if (active) { setAccessToken(null); setUser(null) } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false; unsubscribe() }
  }, [])
  async function signIn(username, password, remember = false) {
    const result = await loginRequest(username, password)
    setAccessToken(result.token, remember)
    try {
      const freshUser = await getMe()
      setUser(freshUser)
    } catch (error) { setAccessToken(null); setUser(null); throw error }
  }
  async function signInGoogle(credential, remember = false) {
    const result = await googleLogin(credential)
    setAccessToken(result.token, remember)
    try { setUser(await getMe()) }
    catch (error) { setAccessToken(null); setUser(null); throw error }
  }
  function signOut() { setAccessToken(null); setUser(null) }
  return <AuthContext.Provider value={{ user, loading, signIn, signInGoogle, signOut }}>{children}</AuthContext.Provider>
}
