// Compare calendar dates in Vietnam, not milliseconds since due-date midnight.
export function vietnamToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}
export function overdueDays(dueDate, today = vietnamToday()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate || '') || !/^\d{4}-\d{2}-\d{2}$/.test(today || '')) return 0
  const days = (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${dueDate}T00:00:00Z`)) / 86400000
  return Number.isFinite(days) ? Math.max(0, days) : 0
}
export function borrowOverdue(row, outstanding, today = vietnamToday()) {
  const days = overdueDays(row.due_date, today)
  return ['DELIVERED', 'PARTIAL'].includes(row.status) && row.delivery !== null && row.delivery !== undefined && Number(outstanding) > 0 && days > 0 ? days : 0
}
