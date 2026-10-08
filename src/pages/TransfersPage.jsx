import { useCallback, useEffect, useState } from 'react'
import Alert from '../components/Alert'
import { listCatalog } from '../services/catalog.service'
import { references, balances } from '../services/stock.service'
import { companyUnits, listTransfers, getTransfer, saveTransfer, deleteTransfer, postTransfer } from '../services/transfer.service'
import { companyAssets } from '../services/transfer.service'
const blankItem = () => ({ material_id: '', source_id: '', condition_id: '', quantity: '', note: '' })
const blank = type => ({ code: '', transfer_type: type, transfer_date: new Date().toISOString().slice(0, 10), company_unit_id: '', document_no: '', note: '', items: [blankItem()] })
const msg = err => err.response?.data?.message || 'Không thể kết nối máy chủ. Vui lòng thử lại.'
async function allMaterials() {
  const first = await listCatalog('materials', { limit: 100 })
  const rest = await Promise.all(Array.from({ length: Math.ceil(first.total / 100) - 1 }, (_, i) => listCatalog('materials', { page: i + 2, limit: 100 })))
  return first.items.concat(...rest.flatMap(r => r.items))
}
export default function TransfersPage({ type }) {
  const [rows, setRows] = useState([]), [units, setUnits] = useState([]), [materials, setMaterials] = useState([])
  const [sources, setSources] = useState([]), [conditions, setConditions] = useState([])
  const [form, setForm] = useState(() => blank(type)), [editing, setEditing] = useState(null), [detail, setDetail] = useState(null)
  const [stock, setStock] = useState([]), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false)
  const [error, setError] = useState(''), [success, setSuccess] = useState('')
  const [search, setSearch] = useState(''), [status, setStatus] = useState(''), [unitFilter, setUnitFilter] = useState(''), [page, setPage] = useState(1), [total, setTotal] = useState(0)
  const refresh = useCallback(async () => {
    setLoading(true); setError('')
    try { const result = await listTransfers({ transfer_type: type, page, ...(search && { search }), ...(status && { status }), ...(unitFilter && { unit_id: unitFilter }) }); setRows(result.items); setTotal(result.total) }
    catch (err) { setRows([]); setError(msg(err)) } finally { setLoading(false) }
  }, [type, page, search, status, unitFilter])
  useEffect(() => { const timer = setTimeout(refresh, 250); return () => clearTimeout(timer) }, [refresh])
  useEffect(() => { let active = true; Promise.all([companyUnits(), allMaterials(), references()]).then(([u, m, r]) => {
    if (active) { setUnits(u); setMaterials(m); setSources(r.sources); setConditions(r.conditions) }
  }).catch(err => { if (active) setError(msg(err)) }); return () => { active = false } }, [])
  const stockKey = form.items.map(i => `${i.material_id}:${i.source_id}:${i.condition_id}`).join('|')
  useEffect(() => {
    if (!form.company_unit_id || !stockKey) return
    let live = true
    const load = type === 'ISSUE' ? balances({}) : companyAssets(form.company_unit_id)
    load.then(data => { if (live) setStock(data) }).catch(err => { if (live) setError(msg(err)) })
    return () => { live = false }
  }, [form.company_unit_id, stockKey, type])
  function reset() { setForm(blank(type)); setEditing(null); setStock([]) }
  function changeItem(index, key, value) { setForm(f => ({ ...f, items: f.items.map((item, n) => n === index ? { ...item, [key]: value } : item) })) }
  const available = item => stock.find(m => String(m.id) === String(item.material_id))?.breakdown.find(b => String(b.source_id) === String(item.source_id) && String(b.condition_id || '') === String(item.condition_id || ''))?.quantity || '0'
  async function view(id) { setError(''); try { setDetail(await getTransfer(id)) } catch (err) { setError(msg(err)) } }
  async function edit(id) {
    setError(''); try { const row = await getTransfer(id); setEditing(row.id); setForm({ code: row.code, transfer_type: row.transfer_type, transfer_date: row.transfer_date,
      company_unit_id: String(type === 'ISSUE' ? row.to_unit_id : row.from_unit_id), document_no: row.document_no || '', note: row.note || '',
      items: row.items.map(i => ({ material_id: String(i.material_id), source_id: String(i.source_id), condition_id: i.condition_id ? String(i.condition_id) : '', quantity: i.quantity, note: i.note || '' })) }); document.getElementById('transfer-editor')?.scrollIntoView({ behavior: 'smooth' }) }
    catch (err) { setError(msg(err)) }
  }
  async function submit(e) {
    e.preventDefault(); setError(''); setSuccess('')
    if (!form.items.length || form.items.some(i => !i.material_id || !i.source_id || !Number.isSafeInteger(Number(i.quantity)) || Number(i.quantity) <= 0)) return setError('Mỗi dòng cần vật chất, nguồn và số lượng nguyên dương.')
    setBusy(true)
    try { await saveTransfer(editing, { ...form, items: form.items.map(i => ({ ...i, condition_id: i.condition_id || null, quantity: Number(i.quantity) })) }); setSuccess(editing ? 'Đã sửa phiếu nháp.' : 'Đã tạo phiếu nháp.'); reset(); await refresh() }
    catch (err) { setError(msg(err)) } finally { setBusy(false) }
  }
  async function action(id, post) {
    if (!window.confirm(post ? 'Ghi sổ phiếu? Vị trí xuất sẽ giảm và vị trí nhận tăng cùng số lượng; phiếu đã ghi không thể sửa/xóa.' : 'Xóa phiếu nháp?')) return
    setBusy(true); setError(''); setSuccess('')
    try { if (post) await postTransfer(id); else await deleteTransfer(id); setSuccess(post ? 'Đã ghi sổ phiếu.' : 'Đã xóa phiếu nháp.'); if (detail?.id === id) setDetail(null); if (editing === id) reset(); await refresh() }
    catch (err) { setError(msg(err)) } finally { setBusy(false) }
  }
  const title = type === 'ISSUE' ? 'Cấp phát' : 'Thu hồi'
  return <section className="accounts-page stock-page"><h2>{title} vật chất</h2><p>{type === 'ISSUE' ? 'Kho Tiểu đoàn → Đại đội' : 'Đại đội → Kho Tiểu đoàn'}. Phiếu nháp không thay đổi tồn; ghi sổ bảo toàn tổng tài sản.</p>
    {error && <Alert action={<button type="button" onClick={refresh}>Tải lại</button>}>{error}</Alert>}{success && <Alert variant="success">{success}</Alert>}
    <section className="account-card"><h3>Danh sách phiếu {title.toLowerCase()}</h3><div className="account-filters">
      <label>Tìm mã / chứng từ<input value={search} onChange={e => { setPage(1); setSearch(e.target.value) }} /></label>
      <label>Trạng thái<select value={status} onChange={e => { setPage(1); setStatus(e.target.value) }}><option value="">Tất cả</option><option value="DRAFT">NHÁP</option><option value="POSTED">ĐÃ GHI SỔ</option></select></label>
      <label>Đại đội<select value={unitFilter} onChange={e => { setPage(1); setUnitFilter(e.target.value) }}><option value="">Tất cả</option>{units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
    </div>{loading ? <p role="status">Đang tải phiếu…</p> : !rows.length ? <p>Không có phiếu phù hợp.</p> : <div className="table-scroll" tabIndex="0" aria-label="Danh sách phiếu, cuộn ngang khi cần"><table><thead><tr><th>Mã</th><th>Ngày</th><th>Đại đội</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{rows.map(r => <tr key={r.id}><td>{r.code}</td><td>{r.transfer_date}</td><td>{type === 'ISSUE' ? r.toUnit?.name : r.fromUnit?.name}</td><td><strong className="stock-badge">{r.status === 'DRAFT' ? 'NHÁP' : 'ĐÃ GHI SỔ'}</strong></td><td><div className="row-actions"><button type="button" onClick={() => view(r.id)}>Xem</button>{r.status === 'DRAFT' && <><button type="button" disabled={busy} onClick={() => edit(r.id)}>Sửa</button><button type="button" disabled={busy} onClick={() => action(r.id, true)}>Ghi sổ</button><button type="button" disabled={busy} onClick={() => action(r.id, false)}>Xóa</button></>}</div></td></tr>)}</tbody></table></div>}
    <div className="row-actions catalog-pages"><span>Trang {page} · {total} phiếu</span><button type="button" disabled={loading || page <= 1} onClick={() => setPage(p => p - 1)}>Trước</button><button type="button" disabled={loading || page * 20 >= total} onClick={() => setPage(p => p + 1)}>Sau</button></div></section>
    {detail && <section className="account-card"><h3>Phiếu {detail.code} · {detail.status === 'POSTED' ? 'ĐÃ GHI SỔ' : 'NHÁP'}</h3><p>{detail.fromUnit?.name} → {detail.toUnit?.name} · {detail.transfer_date} · {detail.document_no || 'Không có chứng từ'}</p><p>{detail.note}</p><div className="table-scroll" tabIndex="0"><table><thead><tr><th>Vật chất</th><th>Nguồn</th><th>Tình trạng</th><th>Số lượng</th><th>Ghi chú</th></tr></thead><tbody>{detail.items.map(i => <tr key={i.id}><td>{i.material?.name}</td><td>{i.source?.name}</td><td>{i.condition?.name || '—'}</td><td>{i.quantity}</td><td>{i.note || '—'}</td></tr>)}</tbody></table></div><button type="button" onClick={() => setDetail(null)}>Đóng</button></section>}
    <section className="account-card" id="transfer-editor"><h3>{editing ? 'Sửa phiếu nháp' : `Tạo phiếu ${title.toLowerCase()}`}</h3><form onSubmit={submit} onInvalid={e => { e.preventDefault(); setError('Vui lòng điền các trường bắt buộc và nhập số lượng nguyên dương.') }}>
      <div className="account-form"><label>Mã phiếu<input required maxLength={64} pattern="[A-Z0-9](?:[A-Z0-9_]|-)*" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} /></label>
      <label>Ngày<input required type="date" value={form.transfer_date} onChange={e => setForm(f => ({ ...f, transfer_date: e.target.value }))} /></label>
      <label>Đại đội {type === 'ISSUE' ? 'nhận' : 'thu hồi từ'}<select required value={form.company_unit_id} onChange={e => { setStock([]); setForm(f => ({ ...f, company_unit_id: e.target.value })) }}><option value="">Chọn Đại đội</option>{units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
      <label>Số chứng từ<input maxLength={120} value={form.document_no} onChange={e => setForm(f => ({ ...f, document_no: e.target.value }))} /></label><label>Ghi chú<textarea maxLength={5000} value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} /></label></div>
      <h4>Chi tiết vật chất</h4>{form.items.map((item, index) => <div key={index} className="receipt-item"><strong>Dòng {index + 1}</strong><div className="account-form">
        <label>Vật chất<select required value={item.material_id} onChange={e => changeItem(index, 'material_id', e.target.value)}><option value="">Chọn vật chất</option>{materials.filter(m => m.is_active || m.id === item.material_id).map(m => <option key={m.id} value={m.id}>{m.code} · {m.name}</option>)}</select></label>
        <label>Nguồn<select required value={item.source_id} onChange={e => changeItem(index, 'source_id', e.target.value)}><option value="">Chọn nguồn</option>{sources.filter(s => s.is_active || s.id === item.source_id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label>Tình trạng<select value={item.condition_id} onChange={e => changeItem(index, 'condition_id', e.target.value)}><option value="">Không phân loại</option>{conditions.filter(c => c.is_active || c.id === item.condition_id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label>Số lượng<input required type="number" min="1" step="1" value={item.quantity} onChange={e => changeItem(index, 'quantity', e.target.value)} /></label>
        <label>Có sẵn tại nơi xuất<output>{form.company_unit_id ? available(item) : 'Chọn Đại đội'}</output></label>
        <label>Ghi chú dòng<input maxLength={5000} value={item.note} onChange={e => changeItem(index, 'note', e.target.value)} /></label></div><button type="button" disabled={busy || form.items.length === 1} onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, n) => n !== index) }))}>Bỏ dòng</button></div>)}
      <div className="row-actions"><button type="button" disabled={busy || form.items.length >= 100} onClick={() => setForm(f => ({ ...f, items: [...f.items, blankItem()] }))}>Thêm dòng</button><button type="submit" disabled={busy || loading || !units.length || !materials.length || !sources.length}>{busy ? 'Đang lưu…' : 'Lưu nháp'}</button>{editing && <button type="button" onClick={reset}>Hủy sửa</button>}</div>
    </form></section>
  </section>
}
