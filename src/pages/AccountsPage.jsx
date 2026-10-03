import { useCallback, useEffect, useMemo, useState } from 'react'
import Alert from '../components/Alert'
import { createCompany, deleteCompany, getUser, listCompanies, listUsers, setUserActive, updateCompany, resetCompanyPassword } from '../services/users.service'

const blank = { username: '', full_name: '', password: '', confirm: '', unit_id: '' }
const message = err => err.response?.data?.message || 'Không thể kết nối máy chủ. Vui lòng thử lại.'

export default function AccountsPage() {
  const [users, setUsers] = useState([])
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [resetUser, setResetUser] = useState(null)
  const [resetFields, setResetFields] = useState({ password: '', confirm: '' })
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [unit, setUnit] = useState('')
  const [status, setStatus] = useState('')
  const reload = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [people, companies] = await Promise.all([listUsers(), listCompanies()])
      setUsers(people); setUnits(companies)
    } catch (err) { setError(message(err)) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => {
    let live = true
    Promise.all([listUsers(), listCompanies()])
      .then(([people, companies]) => { if (live) { setUsers(people); setUnits(companies) } })
      .catch(err => { if (live) setError(message(err)) })
      .finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [])
  const filtered = useMemo(() => users.filter(user =>
    `${user.username} ${user.full_name}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()) &&
    (!role || user.role.code === role) && (!unit || user.unit.id === unit) &&
    (!status || String(user.is_active) === status)
  ), [users, search, role, unit, status])
  function change(event) { setForm(previous => ({ ...previous, [event.target.name]: event.target.value })) }
  function startEdit(user) {
    setDetail(null); setEditing(user.id); setError(''); setFeedback('')
    setForm({ username: user.username, full_name: user.full_name, unit_id: user.unit.id, password: '', confirm: '' })
    document.getElementById('account-editor')?.scrollIntoView({ behavior: 'smooth' })
  }
  function resetForm() { setForm(blank); setEditing(null) }
  async function showDetail(user) {
    setDetail(null); setDetailLoading(true); setError('')
    try { setDetail(await getUser(user.id)) } catch (err) { setError(message(err)) }
    finally { setDetailLoading(false) }
  }
  async function submit(event) {
    event.preventDefault(); setError(''); setFeedback('')
    if (!/^[a-zA-Z0-9_]{3,100}$/.test(form.username)) return setError('Tên đăng nhập cần 3–100 ký tự chữ, số hoặc dấu gạch dưới.')
    if (!form.full_name.trim() || form.full_name.trim().length > 150) return setError('Họ tên bắt buộc (tối đa 150 ký tự).')
    if (!editing && (form.password.length < 12 || form.password.length > 72)) return setError('Mật khẩu cần 12–72 ký tự.')
    if (!editing && form.password !== form.confirm) return setError('Xác nhận mật khẩu không khớp.')
    if (!units.some(item => item.id === form.unit_id)) return setError('Vui lòng chọn Đại đội hợp lệ.')
    setSaving(true)
    try {
      const profile = { username: form.username, full_name: form.full_name.trim(), unit_id: form.unit_id }
      if (editing) await updateCompany(editing, profile)
      else await createCompany({ ...profile, password: form.password })
      setFeedback(editing ? 'Đã cập nhật tài khoản.' : 'Đã tạo tài khoản Đại đội.')
      resetForm(); await reload()
    } catch (err) { setError(message(err)) }
    finally { setSaving(false) }
  }
  async function toggle(user) {
    if (!window.confirm(`Bạn có chắc muốn ${user.is_active ? 'tắt' : 'bật'} tài khoản ${user.username}?`)) return
    setBusyId(user.id); setError(''); setFeedback('')
    try {
      const updated = await setUserActive(user.id, !user.is_active)
      setUsers(previous => previous.map(item => item.id === updated.id ? updated : item))
      if (detail?.id === updated.id) setDetail(updated)
      setFeedback(`Đã ${updated.is_active ? 'bật' : 'tắt'} tài khoản ${updated.username}.`)
    } catch (err) { setError(message(err)) }
    finally { setBusyId(null) }
  }
  async function submitReset(event) {
    event.preventDefault(); setError(''); setFeedback('')
    if (resetFields.password.length < 12 || resetFields.password.length > 72 || resetFields.password !== resetFields.confirm) return setError('Mật khẩu cần 12–72 ký tự và xác nhận phải khớp.')
    if (!window.confirm(`Đặt lại mật khẩu cho ${resetUser.username}? Các phiên hiện tại của tài khoản này sẽ hết hiệu lực.`)) return
    setBusyId(resetUser.id)
    try { await resetCompanyPassword(resetUser.id, resetFields.password); setFeedback('Đã đặt lại mật khẩu.'); setResetUser(null); setResetFields({ password: '', confirm: '' }) }
    catch (err) { setError(message(err)) }
    finally { setBusyId(null) }
  }
  async function remove(user) {
    if (!window.confirm(`Xóa tài khoản ${user.username}? Không thể hoàn tác. Nếu tài khoản có dữ liệu phụ thuộc, hãy tắt thay vì xóa.`)) return
    setBusyId(user.id); setError(''); setFeedback('')
    try {
      await deleteCompany(user.id)
      if (detail?.id === user.id) setDetail(null)
      if (editing === user.id) resetForm()
      setFeedback(`Đã xóa tài khoản ${user.username}.`); await reload()
    } catch (err) { setError(message(err)) }
    finally { setBusyId(null) }
  }
  return <section className="accounts-page">
    <h2>Quản trị · Tài khoản</h2><p>Quản lý tài khoản cán bộ Đại đội trong phạm vi Tiểu đoàn 5.</p>
    {feedback && <Alert variant="success">{feedback}</Alert>}
    {error && <Alert action={<button type="button" onClick={reload}>Tải lại</button>}>{error}</Alert>}
    <section className="account-card"><h3>Danh sách tài khoản</h3>
      <button type="button" onClick={reload} disabled={loading}>Làm mới</button>
      <div className="account-filters">
        <label>Tìm username/họ tên<input value={search} onChange={event => setSearch(event.target.value)} /></label>
        <label>Vai trò<select value={role} onChange={event => setRole(event.target.value)}><option value="">Tất cả</option>{[...new Map(users.map(item => [item.role.code, item.role])).values()].map(item => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
        <label>Đơn vị<select value={unit} onChange={event => setUnit(event.target.value)}><option value="">Tất cả</option>{[...new Map(users.map(item => [item.unit.id, item.unit])).values()].map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Trạng thái<select value={status} onChange={event => setStatus(event.target.value)}><option value="">Tất cả</option><option value="true">Đang hoạt động</option><option value="false">Đã tắt</option></select></label>
      </div>
      {loading ? <p role="status">Đang tải tài khoản…</p> : filtered.length === 0 ? <p>{users.length ? 'Không có tài khoản phù hợp bộ lọc.' : 'Chưa có tài khoản nào.'}</p> :
        <div className="table-scroll" tabIndex="0" aria-label="Danh sách tài khoản, cuộn ngang khi cần"><table><thead><tr><th>Tên đăng nhập</th><th>Họ tên</th><th>Vai trò</th><th>Đơn vị</th><th>Trạng thái</th><th>Google đã liên kết</th><th>Thao tác</th></tr></thead><tbody>
          {filtered.map(user => <tr key={user.id}><td>{user.username}</td><td>{user.full_name}</td><td>{user.role.name}</td><td>{user.unit.name}</td><td>{user.is_active ? 'Đang hoạt động' : 'Đã tắt'}</td><td>{user.google_linked ? 'Đã liên kết' : 'Chưa liên kết'}</td><td><div className="row-actions"><button type="button" onClick={() => showDetail(user)}>Xem</button>{user.role.code === 'COMPANY_ADMIN' && <><button type="button" onClick={() => startEdit(user)}>Sửa</button><button disabled={busyId === user.id} type="button" onClick={() => toggle(user)}>{user.is_active ? 'Tắt' : 'Bật'}</button><button type="button" onClick={() => { setResetUser(user); setResetFields({ password: '', confirm: '' }) }}>Đặt lại mật khẩu</button><button disabled={busyId === user.id} type="button" onClick={() => remove(user)}>Xóa</button></>}</div></td></tr>)}
        </tbody></table></div>}
    </section>
    {detailLoading && <p role="status">Đang tải chi tiết…</p>}
    {detail && <section className="account-card" aria-label="Chi tiết tài khoản"><h3>Chi tiết tài khoản</h3>
      <dl className="account-detail"><dt>Tên đăng nhập</dt><dd>{detail.username}</dd><dt>Họ tên</dt><dd>{detail.full_name}</dd><dt>Vai trò</dt><dd>{detail.role.name}</dd><dt>Đơn vị</dt><dd>{detail.unit.name}</dd><dt>Trạng thái</dt><dd>{detail.is_active ? 'Đang hoạt động' : 'Đã tắt'}</dd><dt>Google đã liên kết</dt><dd>{detail.google_linked ? 'Đã liên kết' : 'Chưa liên kết'}</dd><dt>Ngày tạo</dt><dd>{detail.created_at ? new Date(detail.created_at).toLocaleString('vi-VN') : '—'}</dd><dt>Cập nhật</dt><dd>{detail.updated_at ? new Date(detail.updated_at).toLocaleString('vi-VN') : '—'}</dd></dl>
      <button type="button" onClick={() => setDetail(null)}>Đóng chi tiết</button></section>}
    {resetUser && <section className="account-card"><h3>Đặt lại mật khẩu · {resetUser.username}</h3><form className="account-form" onSubmit={submitReset}>
      <label>Mật khẩu mới (12–72 ký tự)<input type="password" autoComplete="new-password" minLength={12} maxLength={72} required value={resetFields.password} onChange={e => setResetFields(previous => ({ ...previous, password: e.target.value }))} /></label>
      <label>Xác nhận mật khẩu<input type="password" autoComplete="new-password" required value={resetFields.confirm} onChange={e => setResetFields(previous => ({ ...previous, confirm: e.target.value }))} /></label>
      <div className="row-actions"><button type="submit" disabled={busyId === resetUser.id}>Xác nhận đặt lại</button><button type="button" onClick={() => { setResetUser(null); setResetFields({ password: '', confirm: '' }) }}>Hủy</button></div></form></section>}
    <section id="account-editor" className="account-card"><h3>{editing ? 'Chỉnh sửa tài khoản Đại đội' : 'Thêm tài khoản Đại đội'}</h3>
      <form className="account-form" onSubmit={submit}>
        <label>Tên đăng nhập<input name="username" value={form.username} onChange={change} required minLength={3} maxLength={100} autoComplete="off" /></label>
        <label>Họ tên<input name="full_name" value={form.full_name} onChange={change} required maxLength={150} /></label>
        <label>Đại đội<select name="unit_id" value={form.unit_id} onChange={change} required><option value="">Chọn Đại đội</option>{units.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        {!loading && units.length === 0 && <p>Chưa có Đại đội hợp lệ. Kiểm tra dữ liệu đơn vị.</p>}
        {!editing && <><label>Mật khẩu (12–72 ký tự)<input type="password" name="password" value={form.password} onChange={change} required minLength={12} maxLength={72} autoComplete="new-password" /></label>
        <label>Xác nhận mật khẩu<input type="password" name="confirm" value={form.confirm} onChange={change} required autoComplete="new-password" /></label></>}
        <div className="row-actions"><button disabled={loading || saving || units.length === 0} type="submit">{saving ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Tạo tài khoản'}</button>{editing && <button type="button" onClick={resetForm}>Hủy sửa</button>}</div>
      </form>
    </section>
  </section>
}
