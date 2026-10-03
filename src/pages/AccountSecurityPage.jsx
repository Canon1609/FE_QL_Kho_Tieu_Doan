import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GoogleCredentialButton from '../components/GoogleCredentialButton'
import Alert from '../components/Alert'
import { changePassword, linkGoogle } from '../services/auth.service'
import { useAuth } from '../context/useAuth'

export default function AccountSecurityPage() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  const [linkPassword, setLinkPassword] = useState('')
  async function submit(event) {
    event.preventDefault(); setError(''); setSuccess('')
    if (form.next.length < 12 || form.next.length > 72 || form.next !== form.confirm) return setError('Mật khẩu mới cần 12–72 ký tự và xác nhận phải khớp.')
    setBusy(true)
    try {
      await changePassword(form.current, form.next)
      signOut(); navigate('/login', { replace: true })
    } catch (err) { setError(err.response?.data?.message || 'Không thể đổi mật khẩu.') }
    finally { setBusy(false) }
  }
  async function link(credential) {
    setError(''); setSuccess(''); setBusy(true)
    try { await linkGoogle(credential, linkPassword); setLinkPassword(''); setSuccess('Đã liên kết Google. Danh tính Google chỉ dùng để xác minh, không thay đổi quyền nội bộ.') }
    catch (err) { setError(err.response?.data?.message || 'Không thể liên kết Google.') }
    finally { setBusy(false) }
  }
  return <section><h2>Tài khoản cá nhân</h2>
    {error && <Alert>{error}</Alert>}{success && <Alert variant="success">{success}</Alert>}
    <h3>Đổi mật khẩu</h3><form className="account-form" onSubmit={submit}>
      <label>Mật khẩu hiện tại<input type="password" autoComplete="current-password" required value={form.current} onChange={e => setForm({ ...form, current: e.target.value })} /></label>
      <label>Mật khẩu mới (12–72 ký tự)<input type="password" autoComplete="new-password" required minLength={12} maxLength={72} value={form.next} onChange={e => setForm({ ...form, next: e.target.value })} /></label>
      <label>Xác nhận mật khẩu mới<input type="password" autoComplete="new-password" required value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} /></label>
      <button disabled={busy} type="submit">Đổi mật khẩu và đăng xuất</button>
    </form>
    <h3>Liên kết Google</h3><p>Chỉ liên kết tài khoản Google của bạn sau khi đăng nhập nội bộ. Không tự cấp vai trò/đơn vị.</p>
    <label>Xác nhận mật khẩu hiện tại để liên kết Google <input type="password" autoComplete="current-password" value={linkPassword} onChange={e => setLinkPassword(e.target.value)} /></label>
    {linkPassword && <GoogleCredentialButton onCredential={link} />}
  </section>
}
