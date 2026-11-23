const transactionLabels = {
  RECEIPT: 'Nhập vật chất', OPENING_BALANCE: 'Ghi nhận tồn đầu kỳ', ISSUE: 'Cấp phát vật chất', RECALL: 'Thu hồi vật chất',
  INTERNAL_TRANSFER: 'Điều chuyển nội bộ', BORROW: 'Bàn giao vật chất cho mượn', RETURN: 'Trả vật chất mượn',
  DAMAGE_LOSS_OUT: 'Ghi giảm vật chất đã xác nhận mất', LOSS_RECOVERY_IN: 'Nhập lại vật chất tìm thấy',
  DAMAGE_CONDITION_OUT: 'Chuyển khỏi tình trạng ban đầu do báo hỏng', DAMAGE_CONDITION_IN: 'Chuyển vào tình trạng hỏng',
  REPAIR_CONDITION_OUT: 'Chuyển khỏi tình trạng hỏng sau sửa chữa', REPAIR_CONDITION_IN: 'Nhập vào tình trạng sau sửa chữa',
  ADJUSTMENT_IN: 'Điều chỉnh tăng tồn', ADJUSTMENT_OUT: 'Điều chỉnh giảm tồn',
}
const statusLabels = {
  DRAFT: 'Bản nháp', IN_PROGRESS: 'Đang kiểm kê', SUBMITTED: 'Chờ Tiểu đoàn xem xét', PENDING_APPROVAL: 'Chờ Tiểu đoàn xem xét',
  PENDING: 'Chờ xử lý', APPROVED: 'Đã phê duyệt', RECEIVED: 'Đã tiếp nhận', COMPLETED: 'Đã hoàn tất',
  REJECTED: 'Không được chấp nhận', CANCELLED: 'Đã hủy',
  PARTIAL: 'Đã tiếp nhận một phần', RETURNED: 'Đã trả đủ', REPAIR_ACCEPTED: 'Đã nghiệm thu sửa chữa',
  REPAIR_FAILED: 'Sửa chữa không đạt', AWAITING_INSPECTION: 'Chờ nghiệm thu',
}
const warned = new Set()
export function transactionLabel(code) {
  if (transactionLabels[code]) return transactionLabels[code]
  if (code && !warned.has(code)) { warned.add(code); console.warn('Unclassified ledger transaction type', code) }
  return 'Nghiệp vụ chưa được phân loại'
}
export function statusLabel(code) { return statusLabels[code] || (code ? 'Đang xử lý' : '—') }
