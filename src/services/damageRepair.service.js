import api from '../api/axiosClient'

const request = async promise => {
  try {
    const response = await promise
    return response.data.data
  } catch (error) {
    const status = Number(error?.response?.status)
    const bodyMessage = error?.response?.data?.message
    let message = 'Chưa thể tải hoặc lưu thông tin sửa chữa. Vui lòng thử lại.'
    if (status === 503 || /chưa được thiết lập đầy đủ/i.test(bodyMessage || '')) {
      message = 'Chức năng sửa chữa chưa được thiết lập đầy đủ. Vui lòng liên hệ người quản lý hệ thống.'
    } else if ([400, 403, 404, 409].includes(status)) {
      message = bodyMessage || 'Yêu cầu sửa chữa không hợp lệ hoặc không còn phù hợp với trạng thái hiện tại.'
    }
    const safe = new Error(message)
    safe.status = status || undefined
    throw safe
  }
}

export const damageRepairService = {
  get: reportId => request(api.get(`/damage-repair/${reportId}`)),
  open: reportId => request(api.post(`/damage-repair/${reportId}/open`)),
  propose: (reportId, itemId, data) => request(api.post(`/damage-repair/${reportId}/items/${itemId}/allocations`, data)),
  accept: (id, data) => request(api.post(`/damage-repair/allocations/${id}/accept`, data)),
  result: (id, data) => request(api.post(`/damage-repair/allocations/${id}/result`, data)),
  inspect: (id, data) => request(api.post(`/damage-repair/allocations/${id}/inspect`, data)),
}
