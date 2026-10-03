import Alert from '../components/Alert'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { listCatalog, getCatalog, createCatalog, updateCatalog, statusCatalog, deleteCatalog } from '../services/catalog.service'

const titles = { materials: 'Vật chất', categories: 'Loại vật chất', units: 'Đơn vị tính' }
const emptyForm = { code: '', name: '', description: '', category_id: '', unit_id: '' }
const errorText = err => err.response?.data?.message || 'Không thể kết nối máy chủ. Vui lòng thử lại.'
async function allOptions(kind) {
  const first = await listCatalog(kind, { page: 1, limit: 100 })
  const pages = Math.ceil(first.total / 100)
  if (pages <= 1) return first.items
  const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, i) => listCatalog(kind, { page: i + 2, limit: 100 })))
  return first.items.concat(...rest.map(result => result.items))
}

export default function CatalogPage() {
  const { kind } = useParams()
  return <CatalogContent key={kind} kind={kind} />
}

function CatalogContent({ kind }) {
  const { user } = useAuth()
  const admin = user.role.code === 'BATTALION_ADMIN'
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [status, setStatus] = useState('')
  const [categories, setCategories] = useState([])
  const [units, setUnits] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const refresh = useCallback(async () => {
    if (!titles[kind]) return
    setLoading(true); setError('')
    try {
      const result = await listCatalog(kind, { page, limit: 20, ...(search.trim() ? { search: search.trim() } : {}), ...(status ? { is_active: status } : {}), ...(kind === 'materials' && categoryFilter ? { category_id: categoryFilter } : {}) })
      setItems(result.items); setTotal(result.total)
      if (kind === 'materials') {
        const [cats, measures] = await Promise.all([allOptions('categories'), allOptions('units')])
        setCategories(cats); setUnits(measures)
      }
    } catch (err) { setItems([]); setTotal(0); setError(errorText(err)) }
    finally { setLoading(false) }
  }, [kind, page, search, status, categoryFilter])
  useEffect(() => { const timer = setTimeout(() => { refresh() }, 250); return () => clearTimeout(timer) }, [refresh])
  function reset() { setEditing(null); setForm(emptyForm) }
  function edit(item) { setEditing(item.id); setForm({ code: item.code, name: item.name, description: item.description || '', category_id: item.category_id || '', unit_id: item.unit_id || '' }); document.getElementById('catalog-editor')?.scrollIntoView({ behavior: 'smooth' }) }
  async function view(item) { setError(''); setDetail(null); try { setDetail(await getCatalog(kind, item.id)) } catch (err) { setError(errorText(err)) } }
  async function submit(event) {
    event.preventDefault(); setFeedback(''); setError('')
    if (!/^[A-Z0-9][A-Z0-9_-]{0,63}$/.test(form.code) || !form.name.trim() || form.name.trim().length > 150) return setError('Mã chỉ dùng chữ in hoa, số, _ hoặc - (tối đa 64); tên bắt buộc (tối đa 150).')
    if (kind === 'materials' && (!categories.some(c => c.id === form.category_id && c.is_active) || !units.some(u => u.id === form.unit_id && u.is_active))) return setError('Chọn loại và đơn vị tính đang hoạt động.')
    setSaving(true)
    try {
      const data = { code: form.code, name: form.name.trim(), description: form.description.trim(), ...(kind === 'materials' ? { category_id: form.category_id, unit_id: form.unit_id } : {}) }
      if (editing) await updateCatalog(kind, editing, data); else await createCatalog(kind, data)
      setFeedback(editing ? 'Đã cập nhật.' : 'Đã tạo mới.'); reset(); await refresh()
    } catch (err) { setError(errorText(err)) } finally { setSaving(false) }
  }
  async function changeStatus(item) {
    if (!window.confirm(`${item.is_active ? 'Tắt' : 'Bật'} ${item.name}?`)) return
    setSaving(true); setError(''); setFeedback('')
    try { await statusCatalog(kind, item.id, !item.is_active); setFeedback('Đã đổi trạng thái.'); await refresh() }
    catch (err) { setError(errorText(err)) } finally { setSaving(false) }
  }
  async function remove(item) {
    if (!window.confirm(`Xóa ${item.name}? Không thể hoàn tác. Bản ghi có tham chiếu phải tắt thay vì xóa.`)) return
    setSaving(true); setError(''); setFeedback('')
    try { await deleteCatalog(kind, item.id); if (detail?.id === item.id) setDetail(null); if (editing === item.id) reset(); setFeedback('Đã xóa.'); await refresh() }
    catch (err) { setError(errorText(err)) } finally { setSaving(false) }
  }
  if (!titles[kind]) return <p>Danh mục không tồn tại.</p>
  return <section className="accounts-page catalog-page"><h2>Danh mục · {titles[kind]}</h2><p>{kind === 'materials' ? 'Danh mục nhận diện vật chất; không sửa tồn kho trực tiếp trong Material CRUD.' : 'Dữ liệu dùng chung cho danh mục vật chất.'}</p>
    {feedback && <Alert variant="success">{feedback}</Alert>}
    {error && <Alert action={<button type="button" onClick={refresh}>Tải lại</button>}>{error}</Alert>}
    <section className="account-card"><h3>Danh sách {titles[kind].toLowerCase()}</h3><div className="account-filters">
      <label>Tìm mã / tên<input value={search} onChange={e => { setPage(1); setSearch(e.target.value) }} /></label>
      {kind === 'materials' && <label>Loại vật chất<select value={categoryFilter} onChange={e => { setPage(1); setCategoryFilter(e.target.value) }}><option value="">Tất cả</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}
      <label>Trạng thái<select value={status} onChange={e => { setPage(1); setStatus(e.target.value) }}><option value="">Tất cả</option><option value="true">Hoạt động</option><option value="false">Đã tắt</option></select></label>
    </div>
    {loading ? <p role="status">Đang tải…</p> : !items.length ? <p>{error ? 'Không tải được danh sách.' : 'Không có dữ liệu phù hợp.'}</p> : <div className="table-scroll" tabIndex="0" aria-label="Danh sách, cuộn ngang khi cần"><table><thead><tr><th>Mã</th><th>Tên</th>{kind === 'materials' && <><th>Loại</th><th>ĐVT</th></>}<th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{items.map(item => <tr key={item.id}><td>{item.code}</td><td>{item.name}</td>{kind === 'materials' && <><td>{item.category?.name}</td><td>{item.unit?.name}</td></>}<td>{item.is_active ? 'Hoạt động' : 'Đã tắt'}</td><td><div className="row-actions"><button type="button" onClick={() => view(item)}>Xem</button>{admin && <><button type="button" onClick={() => edit(item)}>Sửa</button><button type="button" disabled={saving} onClick={() => changeStatus(item)}>{item.is_active ? 'Tắt' : 'Bật'}</button><button type="button" disabled={saving} onClick={() => remove(item)}>Xóa</button></>}</div></td></tr>)}</tbody></table></div>}
    <div className="row-actions catalog-pages"><span>Trang {page} / {Math.max(1, Math.ceil(total / 20))} · {total} bản ghi</span><button type="button" disabled={loading || page <= 1} onClick={() => setPage(p => p - 1)}>Trước</button><button type="button" disabled={loading || page * 20 >= total} onClick={() => setPage(p => p + 1)}>Sau</button></div></section>
    {detail && <section className="account-card"><h3>Chi tiết {titles[kind].toLowerCase()}</h3><dl className="account-detail"><dt>Mã</dt><dd>{detail.code}</dd><dt>Tên</dt><dd>{detail.name}</dd>{kind === 'materials' && <><dt>Loại</dt><dd>{detail.category?.name}</dd><dt>ĐVT</dt><dd>{detail.unit?.name}</dd></>}<dt>Mô tả</dt><dd>{detail.description || '—'}</dd><dt>Trạng thái</dt><dd>{detail.is_active ? 'Hoạt động' : 'Đã tắt'}</dd></dl><button type="button" onClick={() => setDetail(null)}>Đóng</button></section>}
    {admin && <section id="catalog-editor" className="account-card"><h3>{editing ? `Sửa ${titles[kind].toLowerCase()}` : `Thêm ${titles[kind].toLowerCase()}`}</h3><form className="account-form" onSubmit={submit}>
      <label>Mã<input required maxLength={64} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} /></label><label>Tên<input required maxLength={150} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></label>
      {kind === 'materials' && <><label>Loại vật chất<select required value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}><option value="">Chọn loại</option>{categories.filter(c => c.is_active || c.id === form.category_id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Đơn vị tính<select required value={form.unit_id} onChange={e => setForm(f => ({ ...f, unit_id: e.target.value }))}><option value="">Chọn ĐVT</option>{units.filter(u => u.is_active || u.id === form.unit_id).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label></>}
      <label>Mô tả<textarea maxLength={5000} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></label><div className="row-actions"><button type="submit" disabled={saving || loading}>{saving ? 'Đang lưu…' : editing ? 'Lưu' : 'Thêm'}</button>{editing && <button type="button" onClick={reset}>Hủy sửa</button>}</div></form></section>}
  </section>
}
