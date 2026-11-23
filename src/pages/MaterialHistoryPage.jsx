import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import Alert from '../components/Alert'
import { materialHistory } from '../services/search.service'
import { transactionLabel } from '../utils/businessLabels'
const msg = e => e.response?.data?.message || 'Không thể tải lịch sử. Vui lòng thử lại.'
const keys = ['unit_id', 'location_id', 'source_id', 'condition_id']
export default function MaterialHistoryPage() {
  const { id } = useParams()
  const [url] = useSearchParams()
  const [filters, setFilters] = useState({ transaction_type: '', from: '', to: '' }), [page, setPage] = useState(1)
  const [data, setData] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState(''), [revision, setRevision] = useState(0)
  const signature = url.toString()
  const change = (name, value) => { setFilters(prev => ({ ...prev, [name]: value })); setPage(1) }
  useEffect(() => {
    let active = true
    const timer = setTimeout(() => {
      setLoading(true); setData(null); setError('')
      const urlParams = new URLSearchParams(signature)
      const params = { ...Object.fromEntries(keys.filter(k => urlParams.has(k)).map(k => [k, urlParams.get(k)])),
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)), page }
      if (params.from && params.to && params.from > params.to) { if (active) { setError('Ngày bắt đầu phải không sau ngày kết thúc.'); setLoading(false) } return }
      materialHistory(id, params).then(result => { if (active) setData(result) })
        .catch(e => { if (active) setError(msg(e)) }).finally(() => { if (active) setLoading(false) })
    }, 250)
    return () => { active = false; clearTimeout(timer) }
  }, [id, signature, filters, page, revision])
  const invalidRange = Boolean(filters.from && filters.to && filters.from > filters.to)
  return <section className="accounts-page stock-page search-page"><Link to={`/stock/search/${id}?${signature}`}>← Chi tiết vật chất</Link>
    <h2>Lịch sử ghi sổ vật chất</h2><p>Lọc ngày chỉ thay đổi lịch sử phát sinh, không làm thay đổi số dư hiện tại. Giao dịch âm/dương cùng chứng từ có thể xuất hiện ở các trang khác nhau.</p>
    <section className="account-card"><div className="account-filters search-filters"><label>Loại giao dịch<select value={filters.transaction_type} onChange={e => change('transaction_type', e.target.value)}><option value="">Tất cả giao dịch</option>{[['RECEIPT','Nhập vật chất'],['OPENING_BALANCE','Ghi nhận tồn đầu kỳ'],['ISSUE','Cấp phát vật chất'],['RECALL','Thu hồi vật chất'],['INTERNAL_TRANSFER','Điều chuyển nội bộ'],['BORROW','Bàn giao vật chất cho mượn'],['RETURN','Trả vật chất mượn'],['DAMAGE_LOSS_OUT','Ghi giảm vật chất đã xác nhận mất'],['LOSS_RECOVERY_IN','Nhập lại vật chất tìm thấy'],['DAMAGE_CONDITION_OUT','Chuyển khỏi tình trạng ban đầu do báo hỏng'],['DAMAGE_CONDITION_IN','Chuyển vào tình trạng hỏng'],['REPAIR_CONDITION_OUT','Chuyển khỏi tình trạng hỏng sau sửa chữa'],['REPAIR_CONDITION_IN','Nhập vào tình trạng sau sửa chữa']].map(([code,label]) => <option key={code} value={code}>{label}</option>)}</select></label>
      <label>Từ ngày<input type="date" value={filters.from} onChange={e => change('from', e.target.value)} /></label>
      <label>Đến ngày<input type="date" value={filters.to} onChange={e => change('to', e.target.value)} /></label></div>
      {invalidRange && <Alert>Ngày bắt đầu phải không sau ngày kết thúc.</Alert>}
      <div className="row-actions"><button type="button" onClick={() => { setFilters({ transaction_type: '', from: '', to: '' }); setPage(1) }}>Xóa bộ lọc ngày/loại</button><button type="button" onClick={() => setRevision(n => n + 1)}>Tải lại</button></div>
      {error && <Alert action={<button type="button" onClick={() => setRevision(n => n + 1)}>Thử lại</button>}>{error}</Alert>}
      {loading ? <p role="status">Đang tải lịch sử…</p> : !data ? null : <><h3>{data.material.code} · {data.material.name} ({data.material.unit})</h3>
        {!data.items.length ? <p>Không có phát sinh trong khoảng lọc và phạm vi quyền.</p> : <><p role="status">{data.total} bút toán · trang {data.page}</p><div className="table-scroll" tabIndex="0"><table><thead><tr><th>Thời điểm</th><th>Đơn vị</th><th>Nơi giữ</th><th>Nguồn</th><th>Tình trạng</th><th>Lớp mượn</th><th>Giao dịch</th><th>Biến động ({data.material.unit})</th><th>Chứng từ</th><th>Chiều phát sinh</th></tr></thead><tbody>{data.items.map(row => <tr key={row.id}><td>{new Date(row.occurred_at).toLocaleString('vi-VN')}</td><td>{row.unit_name}</td><td>{row.location_name}</td><td>{row.source_name}</td><td>{row.condition_name || 'Chưa phân loại'}</td><td>{row.borrow_line_id ? `#${row.borrow_line_id}` : 'Không ràng buộc'}</td><td>{transactionLabel(row.transaction_type)}</td><td>{BigInt(row.quantity_delta) > 0n ? '+' : ''}{row.quantity_delta}</td><td>{row.receipt_item_id ? 'Phiếu nhập' : row.transfer_item_id ? 'Phiếu điều chuyển' : row.borrow_delivery_id ? 'Phiếu bàn giao cho mượn' : row.borrow_return_line_id ? 'Phiếu trả vật chất mượn' : row.reference_type === 'DAMAGE_LOSS' ? 'Phiếu hỏng/mất' : row.reference_type === 'DAMAGE_REPAIR' ? 'Hồ sơ sửa chữa' : row.reference_type === 'LOSS_RECOVERY' ? 'Hồ sơ tiếp nhận vật chất tìm thấy' : 'Chứng từ nghiệp vụ'}</td><td>{row.transfer_side === 'OUT' ? 'Xuất khỏi nơi giữ' : row.transfer_side === 'IN' ? 'Nhập vào nơi giữ' : '—'}</td></tr>)}</tbody></table></div></>}
        <div className="row-actions"><button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Trước</button><button type="button" disabled={page * data.limit >= data.total} onClick={() => setPage(page + 1)}>Sau</button></div></>}
    </section></section>
}
