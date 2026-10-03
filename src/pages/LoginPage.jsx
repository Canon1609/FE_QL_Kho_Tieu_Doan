import Alert from '../components/Alert'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import GoogleCredentialButton from '../components/GoogleCredentialButton' 
import { useAuth } from '../context/useAuth'

export default function LoginPage() {
  const { user, loading, signIn, signInGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  if (loading) return <p role="status" className="page-status">Đang xác thực…</p>
  if (user) return <Navigate to="/" replace />
  async function submit(event) {
    event.preventDefault()
    setError(''); setPending(true)
    try {
      await signIn(username, password, remember)
      navigate(location.state?.from || '/', { replace: true })
    } catch (err) {
      setError(err.response?.status === 401 ? 'Tên đăng nhập hoặc mật khẩu không đúng.' : 'Không thể đăng nhập. Vui lòng thử lại.')
    } finally { setPending(false) }
  }
  async function google(credential) {
    setError(''); setPending(true)
    try { await signInGoogle(credential, remember); navigate('/', { replace: true }) }
    catch (err) { setError(err.response?.data?.message || 'Không thể đăng nhập bằng Google.') }
    finally { setPending(false) }
  }
  return <main className="login-screen"><section className="login-panel">
    <img className="system-logo" src="/Logo_QSQK7.png" alt="Biểu trưng Quân sự Quân khu 7" /><p className="eyebrow">TIỂU ĐOÀN 5 · QUẢN LÝ KHO</p><h1>Đăng nhập hệ thống</h1>
    <p>Truy cập dành cho cán bộ được phân quyền.</p>
    <form onSubmit={submit}>
      <label htmlFor="username">Tên đăng nhập</label><input id="username" autoComplete="username" value={username} maxLength={100} required onChange={(e) => setUsername(e.target.value)} />
      <label htmlFor="password">Mật khẩu</label><input id="password" type="password" autoComplete="current-password" value={password} required onChange={(e) => setPassword(e.target.value)} />
      <label className="remember-option"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Ghi nhớ đăng nhập</label>
      {error && <Alert>{error}</Alert>}
      <button disabled={pending} type="submit">{pending ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
    </form>
    <p className="auth-divider">Hoặc</p><GoogleCredentialButton onCredential={google} />
    <p><Link to="/forgot-password">Quên mật khẩu?</Link></p>
  </section></main>
}
