import { Field } from './FormField'
export default function LocationPicker({ rows, value, onChange, label, required = false, error }) {
  const byId = new Map(rows.map(r => [String(r.id), r]))
  function path(row) {
    const names = [], seen = new Set(); let node = row
    while (node && !seen.has(String(node.id))) { names.unshift(node.name); seen.add(String(node.id)); node = byId.get(String(node.parent_location_id)) }
    return names.join(' › ')
  }
  return <Field label={label} required={required} help="Chọn theo tên phòng hoặc kho, không nhập mã kỹ thuật." error={error}><select required={required} value={value} onChange={e => onChange(e.target.value)}><option value="">Chọn nơi lưu giữ</option>{rows.filter(r => r.is_active && r.is_stock_holding).map(r => <option key={r.id} value={r.id}>{path(r)}</option>)}</select></Field>
}
