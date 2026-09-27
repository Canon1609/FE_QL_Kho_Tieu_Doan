import { useEffect, useState } from 'react'
import { getHealth } from '../services/health.service'

export default function HomePage() {
  const [health, setHealth] = useState({ status: 'checking' })

  useEffect(() => {
    let active = true
    getHealth()
      .then((result) => { if (active) setHealth({ status: 'connected', data: result.data, message: result.message }) })
      .catch(() => { if (active) setHealth({ status: 'unavailable' }) })
    return () => { active = false }
  }, [])

  return (
    <section className="home-page" aria-labelledby="health-title">
      <h2 id="health-title">Trạng thái kết nối</h2>
      {health.status === 'checking' && <p role="status">Đang kiểm tra Backend và cơ sở dữ liệu…</p>}
      {health.status === 'connected' && <div className="health-status" role="status"><p>Backend/API: {health.data.api}</p><p>Database: {health.data.database}</p><p>{health.message}</p></div>}
      {health.status === 'unavailable' && <p role="status">Backend hoặc cơ sở dữ liệu hiện không khả dụng.</p>}
    </section>
  )
}
