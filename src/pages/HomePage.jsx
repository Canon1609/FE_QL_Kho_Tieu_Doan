import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Alert from '../components/Alert'
import { dashboardFilters, dashboardSummary, dashboardUnits } from '../services/dashboard.service'
import { dashboardYears, vietnamYear } from '../utils/dashboardYears'

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date())
const monthStart = () => `${today().slice(0, 7)}-01`
const number = value => new Intl.NumberFormat('vi-VN').format(Number(value || 0))

export default function HomePage() {
  const location = useLocation()
  const [units, setUnits] = useState([])
  const [filters, setFilters] = useState(() => ({ unit_id: '', from: monthStart(), to: today(), ...(location.state?.dashboardFilters || {}) }))
  const [data, setData] = useState(null)
  const [options, setOptions] = useState({ materials: [], sources: [], conditions: [], locations: [] })
  const [state, setState] = useState('loading')
  const [year, setYear] = useState(() => vietnamYear())
  const [error, setError] = useState('')
  const params = useMemo(() => ({ year, ...(filters.unit_id ? { unit_id: filters.unit_id } : {}), ...(filters.material_id ? { material_id: filters.material_id } : {}), ...(filters.source_id ? { source_id: filters.source_id } : {}), ...(filters.condition_id ? { condition_id: filters.condition_id } : {}), ...(filters.location_id ? { location_id: filters.location_id } : {}), ...(filters.from ? { from: filters.from } : {}), ...(filters.to ? { to: filters.to } : {}) }), [filters, year])
  const load = useCallback(async () => {
    setState('loading'); setError('')
    try { const result = await dashboardSummary(params); setData(result); setState('ready') }
    catch (e) { const message = e.response?.data?.message; setError(!message || e.response?.status >= 500 || /internal server error/i.test(message) ? 'Không thể tải thông tin tổng quan. Vui lòng thử lại.' : message); setState('error') }
  }, [params])
  useEffect(() => { Promise.resolve().then(() => dashboardUnits(filters.unit_id ? { unit_id: filters.unit_id } : {})).then(setUnits).catch(() => setUnits([])); dashboardFilters(filters.unit_id ? { unit_id: filters.unit_id } : {}).then(setOptions).catch(() => setOptions({ materials: [], sources: [], conditions: [], locations: [] })) }, [filters.unit_id])
  useEffect(() => { Promise.resolve().then(load) }, [load])
  const change = event => {
    const { name, value } = event.target
    setFilters(old => name === 'unit_id'
      ? { ...old, unit_id: value, material_id: '', source_id: '', condition_id: '', location_id: '' }
      : { ...old, [name]: value })
  }
  const reset = () => setFilters({ unit_id: '', material_id: '', source_id: '', condition_id: '', location_id: '', from: monthStart(), to: today() })
  return <div className="dashboard-page">
    <header className="dashboard-heading"><div><h2>Tổng quan</h2><p>Tình hình vật chất và công việc kho trong phạm vi đơn vị được phép xem.</p></div></header>
    <details className="dashboard-filter-panel" open><summary>Lọc số liệu</summary><section className="dashboard-filters" aria-label="Bộ lọc tổng quan">
      <label>Đơn vị<select name="unit_id" value={filters.unit_id} onChange={change}><option value="">Tất cả đơn vị trong phạm vi</option>{units.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label>
      <label>Vật chất<select name="material_id" value={filters.material_id || ''} onChange={change}><option value="">Tất cả vật chất</option>{options.materials.map(item => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}</select></label>
      <label>Nguồn vật chất<select name="source_id" value={filters.source_id || ''} onChange={change}><option value="">Tất cả nguồn</option>{options.sources.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>Tình trạng<select name="condition_id" value={filters.condition_id || ''} onChange={change}><option value="">Tất cả tình trạng</option><option value="null">Chưa xác định</option>{options.conditions.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>Địa điểm lưu giữ<select name="location_id" value={filters.location_id || ''} onChange={change}><option value="">Tất cả địa điểm</option>{options.locations.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>Từ ngày phát sinh<input type="date" name="from" value={filters.from} onChange={change} /></label>
      <label>Đến ngày phát sinh<input type="date" name="to" value={filters.to} onChange={change} /></label>
      <div className="dashboard-filter-actions"><button type="button" onClick={load} disabled={state === 'loading'}>Áp dụng</button><button type="button" className="button-secondary" onClick={reset}>Đặt lại</button></div>
    </section></details>
    <p className="dashboard-note">Ngày lọc chỉ áp dụng cho phát sinh sổ kho trong kỳ. Bộ lọc vật chất/nguồn/tình trạng/địa điểm áp dụng cho số mã có tồn và phân bố tồn hiện tại; không áp dụng cho các phiếu mượn/chờ duyệt/quá hạn. Các phiếu này luôn phản ánh <strong>hiện tại</strong> trong đơn vị đã chọn.</p>
    {state === 'loading' && <p role="status" className="page-status">Đang tải số liệu tổng quan…</p>}
    {state === 'error' && <Alert variant="error" action={<button onClick={load}>Thử tải lại</button>}>{error}</Alert>}
    {state === 'ready' && <>
      <section className="dashboard-chart attention"><h3>Công việc cần chú ý</h3><p>Các phiếu và công việc đang cần theo dõi hoặc xử lý.</p>{data.current.pendingRequests + data.current.overdueBorrowRequests + data.current.outstandingBorrowRequests === 0 ? <p>Hiện không có công việc cần chú ý.</p> : <div className="attention-list">{data.current.pendingRequests > 0 && <div><span>Chờ duyệt</span><strong>{number(data.current.pendingRequests)} phiếu</strong><Link to="/stock/borrow" state={{ dashboardFilters: { ...filters, status: 'SUBMITTED' } }}>Xem chi tiết</Link></div>}{data.current.overdueBorrowRequests > 0 && <div><span>Quá hạn trả</span><strong>{number(data.current.overdueBorrowRequests)} phiếu</strong><Link to={{ pathname: '/dashboard/debts/overdue', search: filters.unit_id ? `?unit_id=${filters.unit_id}` : '' }}>Xem chi tiết</Link></div>}{data.current.outstandingBorrowRequests > 0 && <div><span>Mượn chưa trả</span><strong>{number(data.current.outstandingBorrowRequests)} phiếu</strong><Link to={{ pathname: '/dashboard/debts/outstanding', search: filters.unit_id ? `?unit_id=${filters.unit_id}` : '' }}>Xem chi tiết</Link></div>}</div>}</section>
      <div className="dashboard-kpis">
        <article><span>Vật chất hiện có</span><strong>{number(data.current.materialCodesWithStock)}</strong><small>{data.scope.selectedUnitId ? 'Mã vật chất' : 'Mã vật chất duy nhất trong phạm vi'} còn tồn vật lý khác 0 · Hiện tại</small></article>
        <article><span>Đang chờ duyệt</span><strong>{number(data.current.pendingRequests)}</strong><small>Số yêu cầu đã gửi · Hiện tại</small></article>
        <Link className="dashboard-kpi-link" to={{ pathname: '/dashboard/debts/outstanding', search: filters.unit_id ? `?unit_id=${encodeURIComponent(filters.unit_id)}` : '' }} state={{ dashboardFilters: filters }}><span>Mượn chưa trả</span><strong>{number(data.current.outstandingBorrowRequests)}</strong><small>Số phiếu còn vật chất phải trả, kể cả trả một phần · Xem chi tiết</small></Link>
        <Link className="dashboard-kpi-link dashboard-kpi-overdue" to={{ pathname: '/dashboard/debts/overdue', search: filters.unit_id ? `?unit_id=${encodeURIComponent(filters.unit_id)}` : '' }} state={{ dashboardFilters: filters }}><span>Quá hạn trả</span><strong>{number(data.current.overdueBorrowRequests)}</strong><small>Còn nợ sau hạn theo ngày Việt Nam · Xem chi tiết</small></Link>
      </div>
      {!data.materialBreakdown.length ? <div className="dashboard-empty"><h3>Vật chất đang có tồn</h3><p>Chưa có số liệu tồn trong phạm vi đang xem.</p></div> : <section className="dashboard-chart"><h3>Vật chất đang có tồn</h3><div className="table-scroll"><table><thead><tr><th>Đơn vị</th><th>Mã vật chất</th><th>Tên vật chất</th><th>Đơn vị tính</th><th>Tồn vật lý</th><th>Không ràng buộc mượn</th><th>Đang giữ do mượn</th></tr></thead><tbody>{data.materialBreakdown.map(row => <tr key={`${row.unitId}-${row.materialId}`}><td>{row.unitName}</td><td>{row.materialCode}</td><td><Link to={`/stock/search/${row.materialId}?${new URLSearchParams({ unit_id: row.unitId })}`}>{row.materialName}</Link></td><td>{row.measure}</td><td>{number(row.physical)}</td><td>{number(row.unbound)}</td><td>{number(row.borrowed)}</td></tr>)}</tbody></table></div></section>}
      <section className="dashboard-period"><div className="month-heading"><div><h3>Hoạt động kho theo tháng</h3><p>Số phiếu đã ghi sổ theo ngày nghiệp vụ. Không áp dụng bộ lọc vật chất, nguồn, tình trạng, địa điểm hoặc ngày phía trên.</p></div><label>Năm<select value={year} onChange={e => setYear(Number(e.target.value))}>{dashboardYears().map(y => <option key={y} value={y}>{y}</option>)}</select></label></div>{data.activity.months.every(m => !m.receipt && !m.issue && !m.recall) ? <p>Chưa có hoạt động kho trong năm được chọn.</p> : <div className="monthly-chart">{data.activity.months.map(m => <div className="monthly-month" key={m.month}><div className="monthly-bars"><i title={`Nhập kho ${m.receipt}`} style={{height:`${Math.max(2,m.receipt*12)}px`}} /><i title={`Cấp phát ${m.issue}`} style={{height:`${Math.max(2,m.issue*12)}px`}} /><i title={`Thu hồi ${m.recall}`} style={{height:`${Math.max(2,m.recall*12)}px`}} /></div><small>{m.month}</small><span>{m.receipt}/{m.issue}/{m.recall}</span></div>)}</div>}<div className="month-legend"><span>Nhập kho</span><span>Cấp phát</span><span>Thu hồi</span><small>Thứ tự số theo tháng: nhập / cấp phát / thu hồi</small></div></section>
    </>}
  </div>
}
