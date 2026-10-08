import { useCallback, useEffect, useState } from 'react'
import Alert from '../components/Alert'
import { useAuth } from '../context/useAuth'
import { companyUnits, companyAssets, companyHistory } from '../services/transfer.service'
const msg = err => err.response?.data?.message || 'Không thể kết nối máy chủ. Vui lòng thử lại.'
export default function CompanyAssetsPage() {
  const { user } = useAuth(), admin = user.role.code === 'BATTALION_ADMIN'
  const [units, setUnits] = useState([]), [unitId, setUnitId] = useState(admin ? '' : user.unit.id)
  const [items, setItems] = useState([]), [history, setHistory] = useState(null), [page, setPage] = useState(1)
  const [search, setSearch] = useState(''), [loading, setLoading] = useState(false), [error, setError] = useState('')
  useEffect(() => { if (admin) companyUnits().then(setUnits).catch(e => setError(msg(e))) }, [admin])
  const refresh = useCallback(async () => {
    if (!unitId) { setItems([]); return }
    setLoading(true); setError('')
    try { setItems(await companyAssets(unitId, search ? { search } : {})) } catch (e) { setItems([]); setError(msg(e)) } finally { setLoading(false) }
  }, [unitId, search])
  useEffect(() => { const timer = setTimeout(refresh, 250); return () => clearTimeout(timer) }, [refresh])
  async function view(item, nextPage = 1) {
    setError(''); try { const data = await companyHistory(unitId, { material_id: item.id, page: nextPage }); setHistory({ item, data }); setPage(nextPage) }
    catch (e) { setError(msg(e)) }
  }
  return <section className="accounts-page stock-page"><h2>Tài sản đơn vị</h2><p>Vật chất đang được Đại đội giữ. Tổng tài sản Tiểu đoàn không giảm khi cấp phát hoặc thu hồi.</p>
    {error && <Alert action={<button type="button" onClick={refresh}>Tải lại</button>}>{error}</Alert>}
    {admin && <label>Đại đội <select value={unitId} onChange={e => { setUnitId(e.target.value); setHistory(null) }}><option value="">Chọn Đại đội</option>{units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label>}
    <label>Tìm mã / tên vật chất <input value={search} onChange={e => setSearch(e.target.value)} /></label>
    {!unitId ? <p>Chọn Đại đội để xem tài sản.</p> : loading ? <p role="status">Đang tải tài sản…</p> : !items.length ? <p>{error ? 'Không tải được tài sản.' : 'Không có vật chất phù hợp.'}</p> : <div className="account-card table-scroll" tabIndex="0" aria-label="Tài sản, cuộn ngang khi cần"><table><thead><tr><th>Mã</th><th>Vật chất</th><th>ĐVT</th><th>Số lượng</th><th>Thao tác</th></tr></thead><tbody>{items.map(item => <tr key={item.id}><td>{item.code}</td><td>{item.name}</td><td>{item.unit?.name}</td><td>{item.quantity}</td><td><button type="button" onClick={() => view(item)}>Chi tiết</button></td></tr>)}</tbody></table></div>}
    {history && <section className="account-card"><h3>{history.item.code} · {history.item.name}</h3><p>Tổng hiện giữ: {history.item.quantity} {history.item.unit?.name}</p>
      <h4>Theo nguồn / tình trạng</h4><div className="table-scroll" tabIndex="0"><table><thead><tr><th>Nguồn</th><th>Tình trạng</th><th>Số lượng</th></tr></thead><tbody>{history.item.breakdown.map(b => <tr key={`${b.source_id}:${b.condition_id}`}><td>{b.source}</td><td>{b.condition || 'Không phân loại'}</td><td>{b.quantity}</td></tr>)}</tbody></table></div>
      <h4>Lịch sử cấp phát / thu hồi</h4>{!history.data.items.length ? <p>Chưa có lịch sử.</p> : <div className="table-scroll" tabIndex="0"><table><thead><tr><th>Ngày</th><th>Loại</th><th>Nguồn</th><th>Tình trạng</th><th>Biến động</th><th>Phiếu</th></tr></thead><tbody>{history.data.items.map(e => <tr key={e.id}><td>{new Date(e.occurred_at).toLocaleString('vi-VN')}</td><td>{e.transaction_type === 'ISSUE' ? 'Cấp phát' : 'Thu hồi'}</td><td>{e.source?.name}</td><td>{e.condition?.name || '—'}</td><td>{e.quantity_delta}</td><td>#{e.reference_id}</td></tr>)}</tbody></table></div>}
      <div className="row-actions"><button type="button" disabled={page <= 1} onClick={() => view(history.item, page - 1)}>Trước</button><button type="button" disabled={page * 20 >= history.data.total} onClick={() => view(history.item, page + 1)}>Sau</button><button type="button" onClick={() => setHistory(null)}>Đóng</button></div>
    </section>}
  </section>
}
