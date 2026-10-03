import Alert from '../components/Alert'
import { useCallback, useEffect, useState } from 'react'
import { listCatalog } from '../services/catalog.service'
import { receipts, receipt, saveReceipt, deleteReceipt, postReceipt, references } from '../services/stock.service'
const today = () => new Date().toLocaleDateString('en-CA')
const blankItem = () => ({ material_id: '', source_id: '', condition_id: '', quantity: '', note: '' })
const blank = () => ({ code: '', receipt_type: 'NORMAL_RECEIPT', receipt_date: today(), source_id: '', document_no: '', note: '', items: [blankItem()] })
const message = err => err.response?.data?.message || 'Không thể kết nối máy chủ. Vui lòng thử lại.'
async function all(kind) {
  const first = await listCatalog(kind, { limit: 100 })
  const rest = await Promise.all(Array.from({ length: Math.ceil(first.total / 100) - 1 }, (_, i) => listCatalog(kind, { page: i + 2, limit: 100 })))
  return first.items.concat(...rest.map(r => r.items))
}
export default function ReceiptsPage() {
  const [rows, setRows] = useState([]), [total, setTotal] = useState(0), [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ search: '', status: '', receipt_type: '', from: '', to: '' })
  const [form, setForm] = useState(blank), [editing, setEditing] = useState(null), [detail, setDetail] = useState(null)
  const [materials, setMaterials] = useState([]), [sources, setSources] = useState([]), [conditions, setConditions] = useState([])
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(''), [success, setSuccess] = useState('')
  const refresh = useCallback(async () => {
    setLoading(true); setError('')
    try { const data = await receipts({ ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)), page }); setRows(data.items); setTotal(data.total) }
    catch (err) { setRows([]); setError(message(err)) } finally { setLoading(false) }
  }, [filters, page])
  useEffect(() => { const t = setTimeout(() => { refresh() }, 250); return () => clearTimeout(t) }, [refresh])
  useEffect(() => { let active = true; all('materials').then(m => { if (active) setMaterials(m) }).catch(() => { if (active) setError('Không tải được danh mục vật chất. Thử tải lại trang.') }); return () => { active = false } }, [])
  // Reference tables are read-only in Phase 4; expose only active seed records through stock API.
  useEffect(() => { let active = true; references().then(data => { if (active) { setSources(data.sources); setConditions(data.conditions) } }).catch(err => { if (active) setError(message(err)) }); return () => { active = false } }, [])
  const changeFilter = (key, value) => { setPage(1); setFilters(f => ({ ...f, [key]: value })) }
  const changeItem = (index, key, value) => setForm(f => ({ ...f, items: f.items.map((item, i) => i === index ? { ...item, [key]: value } : item) }))
  const reset = () => { setEditing(null); setForm(blank()) }
  async function view(id) { setError(''); setDetail(null); try { setDetail(await receipt(id)) } catch (err) { setError(message(err)) } }
  async function edit(id) { try { const data = await receipt(id); setEditing(id); setForm({ code: data.code, receipt_type: data.receipt_type, receipt_date: data.receipt_date, source_id: data.source_id || '', document_no: data.document_no || '', note: data.note || '', items: data.items.map(i => ({ material_id: i.material_id, source_id: i.source_id, condition_id: i.condition_id || '', quantity: i.quantity, note: i.note || '' })) }); document.getElementById('receipt-editor')?.scrollIntoView() } catch (err) { setError(message(err)) } }
  async function submit(e) {
    e.preventDefault(); setError(''); setSuccess('')
    if (!form.items.length || form.items.some(i => !i.material_id || !i.source_id || !Number.isSafeInteger(Number(i.quantity)) || Number(i.quantity) <= 0)) return setError('Mỗi dòng cần vật chất, nguồn và số lượng nguyên dương.')
    setBusy(true)
    try { const data = { ...form, source_id: form.source_id || null, items: form.items.map(i => ({ ...i, condition_id: i.condition_id || null, quantity: Number(i.quantity) })) }; await saveReceipt(editing, data); setSuccess(editing ? 'Đã sửa phiếu nháp.' : 'Đã tạo phiếu nháp.'); reset(); await refresh() }
    catch (err) { setError(message(err)) } finally { setBusy(false) }
  }
  async function action(id, type) {
    if (!window.confirm(type === 'post' ? (rows.find(r => r.id === id)?.receipt_type === 'OPENING_BALANCE' ? 'Xác nhận đây là số dư chốt tại thời điểm bắt đầu số hóa? Sau khi ghi sổ không thể sửa, xóa hoặc ghi thêm tồn đầu kỳ cho vật chất đã phát sinh.' : 'Xác nhận ghi sổ? Phiếu sẽ bị khóa, không thể sửa hoặc xóa.') : 'Xóa phiếu nháp?')) return
    setBusy(true); setError(''); setSuccess('')
    try { if (type === 'post') await postReceipt(id); else await deleteReceipt(id); setSuccess(type === 'post' ? 'Đã ghi sổ phiếu.' : 'Đã xóa phiếu nháp.'); if (detail?.id === id) setDetail(null); if (editing === id) reset(); await refresh() }
    catch (err) { setError(message(err)) } finally { setBusy(false) }
  }
  return <section className="accounts-page stock-page"><h2>Nhập kho · Tồn đầu kỳ</h2><p>Chỉ ghi nhận kho Tiểu đoàn. Phiếu nháp không ảnh hưởng tồn; phiếu đã ghi sổ chỉ đọc. Không nhập phân bổ Đại đội tại đây.</p>
    {error && <Alert action={<button type="button" onClick={refresh}>Tải lại</button>}>{error}</Alert>}{success && <Alert variant="success">{success}</Alert>}
    <section className="account-card"><h3>Danh sách phiếu · lịch sử nhập</h3><div className="account-filters">
      <label>Tìm mã / chứng từ<input value={filters.search} onChange={e => changeFilter('search', e.target.value)} /></label>
      <label>Trạng thái<select value={filters.status} onChange={e => changeFilter('status', e.target.value)}><option value="">Tất cả</option><option value="DRAFT">NHÁP</option><option value="POSTED">ĐÃ GHI SỔ</option></select></label>
      <label>Loại<select value={filters.receipt_type} onChange={e => changeFilter('receipt_type', e.target.value)}><option value="">Tất cả</option><option value="OPENING_BALANCE">Tồn đầu kỳ</option><option value="NORMAL_RECEIPT">Nhập kho</option></select></label>
      <label>Từ ngày<input type="date" value={filters.from} onChange={e => changeFilter('from', e.target.value)} /></label><label>Đến ngày<input type="date" value={filters.to} onChange={e => changeFilter('to', e.target.value)} /></label>
    </div>{loading ? <p role="status">Đang tải…</p> : !rows.length ? <p>Không có phiếu phù hợp.</p> : <div className="table-scroll" tabIndex="0"><table><thead><tr><th>Mã</th><th>Ngày</th><th>Loại</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{rows.map(r => <tr key={r.id}><td>{r.code}</td><td>{r.receipt_date}</td><td>{r.receipt_type === 'OPENING_BALANCE' ? 'Tồn đầu kỳ' : 'Nhập kho'}</td><td><strong className="stock-badge">{r.status === 'DRAFT' ? 'NHÁP' : 'ĐÃ GHI SỔ'}</strong></td><td><div className="row-actions"><button onClick={() => view(r.id)}>Xem</button>{r.status === 'DRAFT' && <><button disabled={busy} onClick={() => edit(r.id)}>Sửa</button><button disabled={busy} onClick={() => action(r.id, 'post')}>Ghi sổ</button><button disabled={busy} onClick={() => action(r.id, 'delete')}>Xóa</button></>}</div></td></tr>)}</tbody></table></div>}
    <div className="row-actions"><span>Trang {page} · {total} phiếu</span><button disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)}>Trước</button><button disabled={page * 20 >= total || loading} onClick={() => setPage(p => p + 1)}>Sau</button></div></section>
    {detail && <section className="account-card"><h3>Chi tiết {detail.code} · {detail.status === 'POSTED' ? 'ĐÃ GHI SỔ' : 'NHÁP'}</h3><p>{detail.receipt_type === 'OPENING_BALANCE' ? 'Tồn đầu kỳ' : 'Nhập kho'} · {detail.receipt_date} · {detail.document_no || 'Không có chứng từ'}</p><p>{detail.note}</p><div className="table-scroll"><table><thead><tr><th>Vật chất</th><th>Nguồn</th><th>Tình trạng</th><th>Số lượng</th><th>Ghi chú</th></tr></thead><tbody>{detail.items.map(i => <tr key={i.id}><td>{i.material?.code} · {i.material?.name}</td><td>{i.source?.name}</td><td>{i.condition?.name || '—'}</td><td>{i.quantity}</td><td>{i.note || '—'}</td></tr>)}</tbody></table></div><button onClick={() => setDetail(null)}>Đóng</button></section>}
    <section id="receipt-editor" className="account-card"><h3>{editing ? 'Sửa phiếu nháp' : 'Tạo phiếu nháp'}</h3><form onSubmit={submit} className="receipt-form"><div className="account-form"><label>Mã phiếu<input required maxLength={64} pattern="[A-Z0-9](?:[A-Z0-9_]|-)*" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} /></label><label>Loại<select value={form.receipt_type} onChange={e => setForm(f => ({ ...f, receipt_type: e.target.value }))}><option value="NORMAL_RECEIPT">Nhập kho</option><option value="OPENING_BALANCE">Tồn đầu kỳ</option></select></label><label>Ngày<input required type="date" value={form.receipt_date} onChange={e => setForm(f => ({ ...f, receipt_date: e.target.value }))} /></label><label>Nguồn chứng từ (tùy chọn)<select value={form.source_id} onChange={e => setForm(f => ({ ...f, source_id: e.target.value }))}><option value="">Không chọn</option>{sources.filter(s => s.is_active || s.id === form.source_id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label>Số chứng từ<input maxLength={120} value={form.document_no} onChange={e => setForm(f => ({ ...f, document_no: e.target.value }))} /></label><label>Ghi chú<textarea maxLength={5000} value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} /></label></div>
    {form.receipt_type === 'OPENING_BALANCE' && <Alert variant="info">Tồn đầu kỳ chỉ dùng để khởi tạo số dư khi bắt đầu quản lý trên hệ thống. Sau khi vật chất đã phát sinh giao dịch, không thể ghi thêm tồn đầu kỳ.</Alert>}
    <h4>Chi tiết vật chất</h4>{form.items.map((item, index) => <div className="receipt-item" key={index}><strong>Dòng {index + 1}</strong><div className="account-form"><label>Vật chất<select required value={item.material_id} onChange={e => changeItem(index, 'material_id', e.target.value)}><option value="">Chọn vật chất</option>{materials.filter(m => m.is_active || m.id === item.material_id).map(m => <option key={m.id} value={m.id}>{m.code} · {m.name}</option>)}</select></label><label>Số lượng<input required type="number" min="1" step="1" value={item.quantity} onChange={e => changeItem(index, 'quantity', e.target.value)} /></label><label>Nguồn<select required value={item.source_id} onChange={e => changeItem(index, 'source_id', e.target.value)}><option value="">Chọn nguồn</option>{sources.filter(s => s.is_active || s.id === item.source_id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label>Tình trạng (nếu có)<select value={item.condition_id} onChange={e => changeItem(index, 'condition_id', e.target.value)}><option value="">Không phân loại</option>{conditions.filter(c => c.is_active || c.id === item.condition_id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Ghi chú dòng<input maxLength={5000} value={item.note} onChange={e => changeItem(index, 'note', e.target.value)} /></label></div><button type="button" disabled={form.items.length === 1 || busy} onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== index) }))}>Bỏ dòng</button></div>)}
    <div className="row-actions"><button type="button" disabled={busy || form.items.length >= 100} onClick={() => setForm(f => ({ ...f, items: [...f.items, blankItem()] }))}>Thêm dòng</button><button type="submit" disabled={busy || loading || !materials.length || !sources.length}>{busy ? 'Đang lưu…' : 'Lưu nháp'}</button>{editing && <button type="button" onClick={reset}>Hủy sửa</button>}</div></form></section>
  </section>
}
