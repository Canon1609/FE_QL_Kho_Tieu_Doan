import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function AppLayout() {
  const { user, signOut } = useAuth()
  return <div className="app-shell">
    <aside className="sidebar"><div className="brand">TĐ5 <span>· QUẢN LÝ KHO</span></div>
      <nav aria-label="Điều hướng chính"><NavLink to="/" end>Trang chủ</NavLink><NavLink to="/account/security">Tài khoản cá nhân</NavLink><span className="nav-hint">Quản lý kho · Danh mục</span><NavLink to="/catalog/materials">Vật chất</NavLink><NavLink to="/catalog/categories">Loại vật chất</NavLink><NavLink to="/catalog/units">Đơn vị tính</NavLink>
        {user.role.code === 'BATTALION_ADMIN' && <><span className="nav-hint">Quản trị Tiểu đoàn</span><NavLink to="/admin/accounts">Tài khoản</NavLink></>}
        {user.role.code === 'COMPANY_ADMIN' && <span className="nav-hint">Đơn vị của tôi</span>}
      </nav>
    </aside>
    <div className="shell-main"><header className="shell-header">
      <div><p className="eyebrow">HỆ THỐNG NỘI BỘ</p><h1>Quản lý kho Tiểu đoàn 5</h1></div>
      <div className="account"><span>{user.full_name}<small>{user.role.name} · {user.unit.name}</small></span><button type="button" onClick={signOut}>Đăng xuất</button></div>
    </header><main className="shell-content"><Outlet /></main></div>
  </div>
}
