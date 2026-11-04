import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Alert from '../components/Alert'
import { useAuth } from '../context/useAuth'
import { searchMaterials } from '../services/search.service'
import { borrowReferences } from '../services/borrow.service'
import { locations as listLocations } from '../services/location.service'
import { searchUnits } from '../services/search.service'

const initial = { search: '', unit_id: '', location_id: '', source_id: '', condition_id: '', include_zero: false, sort: 'code', direction: 'asc' }
const message = e => e.response?.data?.message || 'Không thể kết nối máy chủ. Vui lòng thử lại.'
export default function MaterialSearchPage() {
  const { user } = useAuth()
  const [filters, setFilters] = useState(initial), [page, setPage] = useState(1)
  const [rows, setRows] = useState({ items: [], total: 0, page: 1, limit: 20 })
  const [locations, setLocations] = useState([]), [sources, setSources] = useState([]), [conditions, setConditions] = useState([]), [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [refsError, setRefsError] = useState('')
  const [revision, setRevision] = useState(0)
  const change = (key, value) => { setFilters(f => ({ ...f, [key]: value })); setPage(1) }
  const refresh = useCallback(() => setRevision(n => n + 1), [])
  useEffect(() => {
    let active = true
    Promise.all([listLocations(), searchUnits()]).then(([places, scoped]) => {
      if (active) { setLocations(places); setUnits(scoped); setRefsError('') }
    }).catch(() => { if (active) setRefsError('Không tải được bộ lọc nguồn/tình trạng/địa điểm. Vui lòng tải lại.') })
    return () => { active = false }
  }, [revision])
  useEffect(() => {
    let active = true
    // Source and condition are read-only reference data exposed by the borrow workflow.
    borrowReferences().then(ref => {
      if (active) { setSources(ref.sources); setConditions(ref.conditions) }
    }).catch(() => { if (active) setRefsError('Không tải được nguồn/tình trạng. Vui lòng tải lại trang.') })
    return () => { active = false }
  }, [revision])
  useEffect(() => {
    let active = true
    const timer = setTimeout(async () => {
      setLoading(true); setError('')
      try {
        const data = await searchMaterials({ ...Object.fromEntries(Object.entries(filters).filter(([k, v]) => k !== 'include_zero' && v !== '')),
          ...(filters.include_zero ? { include_zero: 'true' } : {}), page })
        if (active) setRows(data)
      } catch (e) { if (active) { setRows({ items: [], total: 0, page, limit: 20 }); setError(message(e)) } }
      finally { if (active) setLoading(false) }
    }, 250)
    return () => { active = false; clearTimeout(timer) }
  }, [filters, page, revision])
  return <section className="accounts-page stock-page search-page"><h2>Tra cứu vật chất toàn hệ thống</h2>
    <p>Tổng số hiện có bao gồm vật chất không ràng buộc mượn và vật chất đơn vị đang giữ do mượn. Hai phần này đã nằm trong tổng số, không cộng thêm lần nữa. Số liệu được tính từ sổ kho và hiển thị theo đơn vị tính của từng vật chất.</p>
    {refsError && <Alert action={<button type="button" onClick={refresh}>Tải lại bộ lọc</button>}>{refsError}</Alert>}
    {error && <Alert action={<button type="button" onClick={refresh}>Tải lại kết quả</button>}>{error}</Alert>}
    <section className="account-card"><div className="account-filters search-filters">
      <label>Tìm mã / tên vật chất<input value={filters.search} maxLength={100} onChange={e => change('search', e.target.value)} /></label>
      {user.role.code === 'BATTALION_ADMIN' && <label>Đơn vị<select value={filters.unit_id} onChange={e => change('unit_id', e.target.value)}><option value="">Toàn Tiểu đoàn</option>{units.map(u => <option key={u.id} value={u.id}>{u.name}</option>) }</select></label>}
      <label>Địa điểm<select value={filters.location_id} onChange={e => change('location_id', e.target.value)}><option value="">Mọi địa điểm</option>{locations.map(l => <option key={l.id} value={l.id}>{l.name} · {l.code}</option>)}</select></label>
      <label>Nguồn<select value={filters.source_id} onChange={e => change('source_id', e.target.value)}><option value="">Mọi nguồn</option>{sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
      <label>Tình trạng<select value={filters.condition_id} onChange={e => change('condition_id', e.target.value)}><option value="">Mọi tình trạng</option><option value="null">Chưa phân loại</option>{conditions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>Sắp xếp<select value={filters.sort} onChange={e => change('sort', e.target.value)}><option value="code">Mã vật chất</option><option value="name">Tên vật chất</option><option value="physical">Tổng số hiện có</option><option value="available">Số lượng không ràng buộc mượn</option><option value="borrowed">Số lượng đang giữ do mượn</option></select></label>
      <label>Thứ tự<select value={filters.direction} onChange={e => change('direction', e.target.value)}><option value="asc">Tăng dần</option><option value="desc">Giảm dần</option></select></label>
      <div className="search-check-field"><label className="search-check"><input type="checkbox" checked={filters.include_zero} onChange={e => change('include_zero', e.target.checked)} /><span>Hiển thị cả vật chất đã hết tồn</span></label><small>Chỉ hiển thị vật chất đã từng có giao dịch trong kho.</small></div>
    </div><div className="row-actions"><button type="button" onClick={() => { setFilters(initial); setPage(1) }}>Xóa bộ lọc</button><button type="button" onClick={refresh}>Tải lại</button></div>
      {loading ? <p role="status">Đang tải kết quả tra cứu…</p> : error ? null : !rows.items.length ? <p>Không có vật chất có lịch sử/tồn phù hợp trong phạm vi quyền.</p> : <><p role="status">{rows.total} vật chất · trang {rows.page}</p><div className="table-scroll" tabIndex="0"><table><thead><tr><th>Mã vật chất</th><th>Tên vật chất</th><th>Loại vật chất</th><th>Đơn vị tính</th><th>Tổng số hiện có</th><th>Số lượng không ràng buộc mượn</th><th>Số lượng đang giữ do mượn</th></tr></thead><tbody>{rows.items.map(item => <tr key={item.id}><td><Link to={`/stock/search/${item.id}?${new URLSearchParams(Object.fromEntries(['unit_id', 'location_id', 'source_id', 'condition_id'].filter(k => filters[k]).map(k => [k, filters[k]])))}`}>{item.code}</Link></td><td>{item.name}</td><td>{item.category}</td><td>{item.unit}</td><td>{item.physical}</td><td>{item.available}</td><td>{item.borrowed}</td></tr>)}</tbody></table></div><div className="row-actions"><button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>Trước</button><button type="button" disabled={page * rows.limit >= rows.total} onClick={() => setPage(page + 1)}>Sau</button></div></>}
    </section></section>
}
