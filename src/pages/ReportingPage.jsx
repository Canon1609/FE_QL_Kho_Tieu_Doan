import { useState } from 'react'
import api from '../api/axiosClient'
import { transactionLabel, statusLabel } from '../utils/businessLabels'

export default function ReportingPage() {
  const [report, setReport] = useState('inventory')
  const [period, setPeriod] = useState('month')
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 8) + '01')
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10))
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [exportBusy, setExportBusy] = useState(false)

  const choosePeriod = (value) => {
    setPeriod(value)
    const today = new Date()
    const end = today.toISOString().slice(0, 10)
    let start
    if (value === 'week') {
      const monday = new Date(today)
      monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
      start = monday.toISOString().slice(0, 10)
    } else if (value === 'month') start = `${end.slice(0, 7)}-01`
    else if (value === 'quarter') start = `${end.slice(0, 4)}-${String(Math.floor(today.getMonth() / 3) * 3 + 1).padStart(2, '0')}-01`
    else if (value === 'year') start = `${end.slice(0, 4)}-01-01`
    if (start) { setFrom(start); setTo(end) }
  }

  const endpoint = report === 'inventory' ? 'inventory' : report === 'damage-loss' ? 'damage-loss' : 'transactions'
  const label = report === 'inventory' ? 'tồn kho' : report === 'transactions' ? 'biến động kho' : 'hỏng/mất'

  const load = async () => {
    setBusy(true); setError(''); setData(null)
    try {
      const response = await api.get(`/reports/${endpoint}`, { params: { from, to } })
      setData(response.data.data)
    } catch (e) { setError(e.response?.data?.message || 'Không tải được báo cáo.') }
    finally { setBusy(false) }
  }

  const download = async () => {
    setExportBusy(true); setError('')
    try {
      const response = await api.get('/reports/export.xlsx', { params: { from, to, report }, responseType: 'blob' })
      const url = URL.createObjectURL(response.data)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `Bao_cao_${report}_${to}.xlsx`
      document.body.appendChild(anchor); anchor.click(); anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (e) {
      const blob = e.response?.data
      if (blob instanceof Blob) {
        try { setError(JSON.parse(await blob.text()).message || 'Xuất Excel thất bại.') }
        catch { setError('Xuất Excel thất bại. Vui lòng thử lại.') }
      } else setError(e.response?.data?.message || 'Xuất Excel thất bại.')
    } finally { setExportBusy(false) }
  }

  const rows = Array.isArray(data) ? data : data?.rows || []
  return <section className="phase11-page">
    <h2>Thống kê và báo cáo</h2>
    <div className="phase11-filters">
      <label>Loại báo cáo<select value={report} onChange={e => { setReport(e.target.value); setData(null); setError('') }}>
        <option value="inventory">Tồn kho</option><option value="transactions">Biến động kho</option><option value="damage-loss">Hỏng/Mất</option>
      </select></label>
      <label>Kỳ<select value={period} onChange={e => choosePeriod(e.target.value)}>
        <option value="week">Tuần này</option><option value="month">Tháng này</option><option value="quarter">Quý này</option><option value="year">Năm nay</option><option value="custom">Tùy chọn</option>
      </select></label>
      <label>Từ ngày<input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label>
      <label>Đến ngày<input type="date" value={to} onChange={e => setTo(e.target.value)} /></label>
      <button onClick={load} disabled={busy}>{busy ? 'Đang tải…' : 'Xem báo cáo'}</button>
      <button onClick={download} disabled={exportBusy}>{exportBusy ? 'Đang xuất…' : 'Xuất Excel'}</button>
    </div>
    {error && <p role="alert">{error}<button onClick={load}>Thử lại</button></p>}
    {busy && <p aria-live="polite">Đang tải dữ liệu…</p>}
    {data && <div className="phase11-table"><table><thead><tr>
      {(report === 'inventory' ? ['Vật chất', 'Đơn vị quản lý', 'Địa điểm lưu giữ', 'Nguồn hình thành', 'Tình trạng', 'Đơn vị tính', 'Tồn đầu kỳ', 'Tăng trong kỳ', 'Giảm trong kỳ', 'Tồn cuối kỳ'] : ['Ngày', 'Loại', 'Vật chất', 'Đơn vị', 'Nguồn', 'Tình trạng', 'Số lượng', 'Phân loại']).map(x => <th key={x}>{x}</th>)}
    </tr></thead><tbody>{rows.map((row, index) => <tr key={row.id || `${row.material_code || ''}-${index}`}>
      {report === 'inventory' ? <>
        <td>{row.material_name} ({row.material_code})</td><td>{row.unit_name}</td><td>{row.location_name || '—'}</td><td>{row.source_name || '—'}</td><td>{row.condition_name || '—'}</td><td>{row.uom_name}</td><td>{row.opening}</td><td>{row.increases}</td><td>{row.decreases}</td><td>{row.closing}</td>
      </> : <>
        <td>{row.occurred_at ? new Date(row.occurred_at).toLocaleString('vi-VN') : '—'}</td>
        <td>{row.transaction_name || (row.transaction_type ? transactionLabel(row.transaction_type) : row.incident_type === 'DAMAGE' ? 'Báo hỏng' : row.incident_type === 'LOSS' ? 'Báo mất' : 'Nghiệp vụ chưa được phân loại')}</td>
        <td>{row.material_name || '—'}</td><td>{row.unit_name || row.unit?.name || '—'}</td><td>{row.source_name || '—'}</td><td>{row.condition_name || '—'}</td><td>{row.quantity_delta ?? row.quantity ?? '—'}</td><td>{row.category || statusLabel(row.status)}</td>
      </>}
    </tr>)}</tbody></table>{!rows.length && <p>Không có dữ liệu {label} trong khoảng thời gian đã chọn.</p>}</div>}
  </section>
}
