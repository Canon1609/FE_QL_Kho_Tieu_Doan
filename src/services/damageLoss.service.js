import api from '../api/axiosClient'

export class DamageLossApiError extends Error {
  constructor(status, message, fields = null) {
    super(message)
    this.name = 'DamageLossApiError'
    this.status = status
    this.fields = fields
  }
}

function userMessage(status, message) {
  if (status === 400 || status === 422) return message && message !== 'Invalid request' ? message : 'Thông tin phiếu chưa hợp lệ. Kiểm tra đơn vị, vật chất, địa điểm, nguồn, tình trạng và số lượng.'
  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này.'
  if (status === 0) return 'Không thể kết nối tới hệ thống. Vui lòng thử lại khi kết nối ổn định.'
  if (status === 404) return 'Không tìm thấy phiếu hoặc dữ liệu tham chiếu trong phạm vi của bạn.'
  if (status === 409) return message || 'Dữ liệu đã thay đổi hoặc không đủ tồn. Vui lòng kiểm tra lại.'
  return 'Không thể lưu phiếu lúc này. Vui lòng thử lại hoặc liên hệ người quản lý hệ thống.'
}

function request(promise) {
  return promise.then(response => {
    const body = response.data
    if (!body || typeof body !== 'object' || body.success !== true || !Object.hasOwn(body, 'data')) {
      throw new DamageLossApiError(response.status, userMessage(response.status))
    }
    return body.data
  }).catch(error => {
    if (error instanceof DamageLossApiError) throw error
    const status = error.response?.status || 0
    const body = error.response?.data
    const message = body && typeof body === 'object' && typeof body.message === 'string' ? body.message : ''
    const details = body?.errors && typeof body.errors === 'object' ? Object.values(body.errors).filter(value => typeof value === 'string').join(' ') : ''
    const safeMessage = message && message !== 'Invalid request' ? message : details
    throw new DamageLossApiError(status, userMessage(status, safeMessage), body?.errors || null)
  })
}

export const damageLossService = {
  list: params => request(api.get('/damage-loss', { params })),
  detail: id => request(api.get(`/damage-loss/${id}`)),
  references: () => request(api.get('/damage-loss/references')),
  create: data => request(api.post('/damage-loss', data)),
  update: (id, data) => request(api.patch(`/damage-loss/${id}`, data)),
  action: (id, action, note) => request(api.post(`/damage-loss/${id}/${action}`, note ? { note } : {})),
}
