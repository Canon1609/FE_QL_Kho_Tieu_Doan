import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import Alert from '../components/Alert'
import { materialDetail } from '../services/search.service'
const msg = e => e.response?.data?.message || 'Không thể tải chi tiết. Vui lòng thử lại.'
const keys = ['unit_id', 'location_id', 'source_id', 'condition_id']
const format = n => BigInt(n || 0).toLocaleString('vi-VN')
export default function MaterialDetailPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const [data, setData] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState(''), [revision, setRevision] = useState(0)
  const signature = searchParams.toString()
  useEffect(() => {
    let active = true
    const timer = setTimeout(() => {
      setData(null); setError(''); setLoading(true)
      const query = new URLSearchParams(signature)
      const params = Object.fromEntries(keys.filter(key => query.has(key)).map(key => [key, query.get(key)]))
      materialDetail(id, params).then(result => { if (active) setData(result) })
        .catch(e => { if (active) setError(msg(e)) }).finally(() => { if (active) setLoading(false) })
    }, 0)
    return () => { active = false; clearTimeout(timer) }
  // signature is a serialized URL query; filters come only from this URL.
  }, [id, signature, revision])
  function group(rows, key, label) {
    const map = new Map()
    for (const row of rows) {
      const id = row[key] || 'null'
      if (!map.has(id)) map.set(id, { id, label: row[label] || 'Chưa phân loại', physical: 0n, available: 0n, borrowed: 0n, children: [] })
      const bucket = map.get(id)
      for (const field of ['physical', 'available', 'borrowed']) bucket[field] += BigInt(row[field])
      bucket.children.push(row)
    }
    return [...map.values()]
  }
  function node(rows, depth = 0) {
    if (depth === 4) return rows.map(row => <div className="detail-level" key={`${row.unit_id}:${row.location_id}:${row.source_id}:${row.condition_id}:${row.borrow_line_id || 'free'}`}>
      <span>{row.borrow_line_id ? `Dòng mượn #${row.borrow_line_id}` : 'Không ràng buộc'}</span> · Vật lý {format(row.physical)} · Khả dụng {format(row.available)} · Đang mượn {format(row.borrowed)}
    </div>)
    const fields = [['unit_id', 'unit_name'], ['location_id', 'location_name'], ['source_id', 'source_name'], ['condition_id', 'condition_name']]
    const [key, label] = fields[depth]
    return group(rows, key, label).map(bucket => <details className="detail-level" key={`${depth}:${bucket.id}`} open={depth === 0}>
      <summary>{bucket.label} · Vật lý {format(bucket.physical)} · Khả dụng {format(bucket.available)} · Đang mượn {format(bucket.borrowed)}</summary>
      {node(bucket.children, depth + 1)}
    </details>)
  }
  return <section className="accounts-page stock-page search-page"><Link to="/stock/search">← Danh sách tra cứu</Link>
    <h2>Chi tiết vật chất</h2><p>Số dư hiện tại theo đơn vị chịu trách nhiệm → nơi giữ → nguồn → tình trạng → lớp mượn. Các dòng có tồn 0 vẫn hiện nếu có lịch sử.</p>
    {error && <Alert action={<button type="button" onClick={() => setRevision(n => n + 1)}>Thử lại</button>}>{error}</Alert>}
    {loading ? <p role="status">Đang tải chi tiết…</p> : !data ? null : <section className="account-card"><h3>{data.material.code} · {data.material.name}</h3>
      <p>Loại: {data.material.category || '—'} · ĐVT: {data.material.unit || '—'}</p>
      <p><strong>Tồn vật lý: {format(data.totals.physical)}</strong> {data.material.unit} · Khả dụng không ràng buộc: {format(data.totals.available)} {data.material.unit} · Đang mượn tại nơi giữ: {format(data.totals.borrowed)} {data.material.unit}</p>
      <p><Link to={`/stock/search/${id}/history?${signature}`}>Xem lịch sử ghi sổ →</Link></p>
      {!data.items.length ? <p>Không có bút toán theo bộ lọc hiện tại.</p> : <div className="detail-tree">{node(data.items)}</div>}
    </section>}
  </section>
}
