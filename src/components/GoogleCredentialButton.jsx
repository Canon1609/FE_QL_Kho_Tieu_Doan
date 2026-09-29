import { useEffect, useRef, useState } from 'react'
import { renderGoogleButton } from '../services/googleIdentity.service'

// Official Google Identity Services button; callback receives an ID token only in memory.
export default function GoogleCredentialButton({ onCredential }) {
  const element = useRef(null)
  const callback = useRef(onCredential)
  const [status, setStatus] = useState('loading')
  useEffect(() => { callback.current = onCredential }, [onCredential])
  useEffect(() => {
    if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) return
    let active = true
    let cleanup
    renderGoogleButton(element.current, credential => callback.current(credential), () => active)
      .then(dispose => { if (active) { cleanup = dispose; setStatus('ready') } else dispose() })
      .catch(() => { if (active) setStatus('error') })
    return () => { active = false; cleanup?.() }
  }, [])
  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) return <p>Google Sign-In chưa được cấu hình. Liên hệ quản trị viên.</p>
  return <>
    {status === 'loading' && <p role="status">Đang tải Google Sign-In…</p>}
    <div ref={element} aria-label="Đăng nhập bằng Google" />
    {status === 'error' && <p role="alert" className="error-text">Không tải hoặc khởi tạo được Google Sign-In. Vui lòng kiểm tra kết nối và thử tải lại trang.</p>}
  </>
}
