export const validCode = value => /^[A-Z0-9][A-Z0-9_-]{0,63}$/.test(value)
export const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value
export const positiveInteger = value => /^(?:[1-9]\d*)$/.test(String(value)) && Number.isSafeInteger(Number(value))
export const stockFields = (form, { transfer = false, type = '' } = {}) => {
  const errors = {}
  if (!validCode(form.code)) errors.code = 'Mã cần 1–64 ký tự in hoa, số, _ hoặc - (ví dụ PN_11).'
  const dateKey = transfer ? 'transfer_date' : 'receipt_date'
  if (!validDate(form[dateKey])) errors[dateKey] = 'Vui lòng chọn ngày hợp lệ.'
  if (transfer) {
    if (!form.company_unit_id) errors.company_unit_id = 'Vui lòng chọn Đại đội.'
    if (type === 'INTERNAL_TRANSFER' && !form.from_location_id) errors.from_location_id = 'Vui lòng chọn nơi chuyển.'
    if (type !== 'RECALL' && !form.to_location_id) errors.to_location_id = 'Vui lòng chọn nơi nhận.'
    if (type === 'INTERNAL_TRANSFER' && form.from_location_id && form.from_location_id === form.to_location_id) errors.to_location_id = 'Nơi nhận phải khác nơi chuyển.'
  }
  if (!form.items.length || form.items.length > 100) errors.items = 'Phiếu cần từ 1 đến 100 dòng vật chất.'
  form.items.forEach((item, index) => {
    if (!item.material_id) errors[`items.${index}.material_id`] = 'Vui lòng chọn vật chất.'
    if (!item.source_id) errors[`items.${index}.source_id`] = 'Vui lòng chọn nguồn.'
    if (!positiveInteger(item.quantity)) errors[`items.${index}.quantity`] = 'Số lượng phải là số nguyên dương (ví dụ 5).'
  })
  return errors
}
export const apiFieldErrors = (err, form) => {
  if (err.response?.data?.errors) return err.response.data.errors
  const message = err.response?.data?.message || ''
  if (err.response?.status === 409 && /Mã phiếu|Mã danh mục|Username already exists/.test(message)) return { [form === 'account' ? 'username' : 'code']: form === 'account' ? 'Tên đăng nhập đã tồn tại.' : 'Mã đã tồn tại. Vui lòng chọn mã khác.' }
  if (/Dòng vật chất\/nguồn\/tình trạng bị trùng/.test(message)) return { items: 'Các dòng không được trùng vật chất, nguồn và tình trạng.' }
  return {}
}
export const friendlyError = err => {
  const text = err.response?.data?.message
  if (err.response?.status >= 500) return err.response.status === 503 && /^(Không lưu được, thử lại|Dịch vụ tạm gián đoạn)$/.test(text) ? text : 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'
  if (!text || text === 'Invalid request' || text === 'Internal server error') return 'Không thể hoàn tất thao tác. Vui lòng kiểm tra dữ liệu và thử lại.'
  return text === 'Username already exists' ? 'Tên đăng nhập đã tồn tại.' : text
}
