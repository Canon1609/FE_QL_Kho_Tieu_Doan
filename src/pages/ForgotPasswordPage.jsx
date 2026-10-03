import Alert from '../components/Alert'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import GoogleCredentialButton from '../components/GoogleCredentialButton'
import { googleReset } from '../services/auth.service'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [credential, setCredential] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event) {
    event.preventDefault(); setError('')
    if (password.length < 12 || password.length > 72 || password !== confirm) return setError('Mật khẩu mới cần 12–72 ký tự và xác nhận phải khớp.')
    setBusy(true)
    try { await googleReset(credential, password); setCredential(''); navigate('/login', { replace: true }) }
    catch { setError('Không thể đặt lại mật khẩu. Vui lòng liên hệ quản trị viên Tiểu đoàn nếu chưa liên kết Google.') }
    finally { setBusy(false) }
  }
  return <main className="login-screen"><section className="login-panel"><h1>Quên mật khẩu</h1>
    <p>Nếu chưa liên kết Google, vui lòng liên hệ quản trị viên Tiểu đoàn để đặt lại mật khẩu.</p>
    <p>Xác minh bằng Google đã liên kết:</p><GoogleCredentialButton onCredential={setCredential} />
    {credential && <form onSubmit={submit}><label>Mật khẩu mới (12–72 ký tự)<input type="password" required minLength={12} maxLength={72} value={password} onChange={e => setPassword(e.target.value)} /></label>
      <label>Xác nhận mật khẩu mới<input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} /></label>
      <button disabled={busy} type="submit">Đặt lại mật khẩu</button></form>}
    {error && <Alert>{error}</Alert>}<p><Link to="/login">Về đăng nhập</Link></p>
  </section></main>
}
