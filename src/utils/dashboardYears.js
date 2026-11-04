export function vietnamYear(now = new Date()) {
  return Number(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric' }).format(now))
}

// 2024 marks the system's operational baseline, not an upper bound.
export function dashboardYears(now = new Date(), firstYear = 2024) {
  const current = vietnamYear(now)
  return Array.from({ length: Math.max(0, current - firstYear + 1) }, (_, index) => current - index)
}
