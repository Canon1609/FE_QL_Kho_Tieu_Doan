import { useEffect, useRef } from 'react'

export default function Alert({ variant = 'error', children, action }) {
  const alertRef = useRef(null)
  useEffect(() => {
    if (variant !== 'info') alertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [children, variant])

  return <div ref={alertRef} className={`app-alert app-alert--${variant}`} role={variant === 'error' ? 'alert' : 'status'}>
    <span className="app-alert__icon" aria-hidden="true">{variant === 'error' ? '!' : variant === 'success' ? '✓' : 'i'}</span>
    <div className="app-alert__body"><strong>{variant === 'error' ? 'Có lỗi xảy ra' : variant === 'success' ? 'Thành công' : 'Lưu ý'}</strong><div>{children}</div></div>
    {action}
  </div>
}
