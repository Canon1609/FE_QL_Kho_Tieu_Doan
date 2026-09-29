import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <p role="status" className="page-status">Đang xác thực…</p>
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (roles && !roles.includes(user.role.code)) return <Navigate to="/forbidden" replace />
  return <Outlet />
}
