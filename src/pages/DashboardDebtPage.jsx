import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import Alert from '../components/Alert'
import { dashboardBorrowDebts } from '../services/borrow.service'

const labels = { DELIVERED: 'Đang mượn', PARTIAL: 'Trả một phần' }
const date = value => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value)) : '—'
const number = value => new Intl.NumberFormat('vi-VN').format(Number(value || 0))
export default function DashboardDebtPage() {
  const { kind } = useParams()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const unitId = searchParams.get('unit_id') || ''
  const overdue = kind === 'overdue'
  const [page, setPage] = useState(1), [data, setData] = useState(null), [state, setState] = useState('loading'), [error, setError] = useState('')
  const unitName = ''
  const load = useCallback(async () => {
    setState('loading'); setError('')
    try { setData(await dashboardBorrowDebts({ kind: overdue ? 'overdue' : 'outstanding', page, ...(unitId ? { unit_id: unitId } : {}) })); setState('ready') }
    catch (e) { setError(e.response?.data?.message || 'Không tải được chi tiết. Vui lòng thử lại.'); setState('error') }
  }, [overdue, page, unitId])
  useEffect(() => { Promise.resolve().then(load) }, [load])
  if (!['outstanding', 'overdue'].includes(kind)) return <section className="dashboard-debt"><Link to="/">← Quay lại tổng quan</Link><p>Loại danh sách không hợp lệ.</p></section>
  return <section className="dashboard-debt">
    <Link to="/" state={location.state?.dashboardFilters ? location.state : undefined}>← Quay lại tổng quan</Link>
    <header><h2>{overdue ? 'Vật chất quá hạn trả' : 'Vật chất mượn chưa trả'}{unitName ? ` · ${unitName}` : ''}</h2><p>{overdue ? 'Chỉ gồm từng dòng vật chất còn nợ, có ngày quá hạn theo ngày Việt Nam.' : 'Gồm các phiếu đã giao còn ít nhất một dòng vật chất phải trả; phiếu trả một phần chỉ hiện phần còn nợ.'}</p></header>
    {state === 'loading' && <p role="status">Đang tải chi tiết…</p>}
    {state === 'error' && <Alert variant="error" action={<button type="button" onClick={load}>Thử tải lại</button>}>{error}</Alert>}
    {state === 'ready' && (!data.items.length ? <p className="dashboard-debt-empty">Không có vật chất phù hợp trong phạm vi được phép.</p> : <>
      <p role="status">{number(data.totalRequests)} phiếu có khoản còn nợ · Trang {data.page}</p>
      <div className="table-scroll dashboard-debt-table"><table><thead><tr><th>Mã phiếu</th><th>Đơn vị mượn</th><th>Tên vật chất</th><th>ĐVT</th>{!overdue && <><th>Đã giao</th><th>Đã trả</th></>}<th>Còn phải trả</th><th>Ngày giao</th><th>Hạn trả</th>{overdue && <th>Quá hạn</th>}<th>Tình trạng</th><th>Chi tiết</th></tr></thead><tbody>{data.items.map((row, index) => <tr key={`${row.requestId}-${row.materialId}-${index}`}>
        <td>{row.requestCode}</td><td>{row.companyUnitName}</td><td>{row.materialName} <small>({row.materialCode})</small></td><td>{row.measure}</td>{!overdue && <><td className="numeric">{number(row.quantityDelivered)}</td><td className="numeric">{number(row.quantityReturned)}</td></>}<td className="numeric">{number(row.quantityOutstanding)}</td><td>{date(row.deliveredAt)}</td><td>{date(row.dueDate)}</td>{overdue && <td><strong className="borrow-overdue">Quá hạn {number(row.overdueDays)} ngày</strong></td>}<td>{labels[row.status]}</td><td><Link to={`/stock/borrow?request=${encodeURIComponent(row.requestId)}`} state={{ returnTo: `${location.pathname}${location.search}`, returnState: { dashboardFilters: location.state?.dashboardFilters } }}>Mở phiếu</Link></td>
      </tr>)}</tbody></table></div>
      <div className="row-actions"><button type="button" disabled={data.page <= 1 || state === 'loading'} onClick={() => setPage(p => p - 1)}>Trước</button><span>Trang {data.page} · {number(data.totalRequests)} phiếu</span><button type="button" disabled={data.page * data.limit >= data.totalRequests || state === 'loading'} onClick={() => setPage(p => p + 1)}>Sau</button></div>
    </>)}
  </section>
}
