import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function AppLayout() {
  const { user, signOut } = useAuth()
  return <div className="app-shell">
    <aside className="sidebar"><div className="brand">TĐ5 <span>· QUẢN LÝ KHO</span></div>
      <nav aria-label="Điều hướng chính">
        <NavLink className="nav-primary" to="/" end>Trang chủ</NavLink>
        <NavLink className="nav-primary" to="/account/security">Tài khoản cá nhân</NavLink>
        <div className="nav-group" role="group" aria-labelledby="nav-catalog">
          <span className="nav-heading" id="nav-catalog">Quản lý kho · Danh mục</span>
          <div className="nav-submenu">
            <NavLink to="/catalog/materials">Vật chất</NavLink>
            <NavLink to="/catalog/categories">Loại vật chất</NavLink>
            <NavLink to="/catalog/units">Đơn vị tính</NavLink>
          </div>
        </div>
        {user.role.code === 'BATTALION_ADMIN' && <>
          <div className="nav-group" role="group" aria-labelledby="nav-stock">
            <span className="nav-heading" id="nav-stock">Quản lý kho · Giao dịch</span>
            <div className="nav-submenu">
              <NavLink to="/stock/receipts">Nhập kho</NavLink>
              <NavLink to="/stock/issue">Cấp phát</NavLink>
              <NavLink to="/stock/recall">Thu hồi</NavLink>
              <NavLink to="/stock/balance">Tồn kho</NavLink>
              <NavLink to="/company/assets">Tài sản đơn vị</NavLink>
            </div>
          </div>
          <div className="nav-group" role="group" aria-labelledby="nav-admin">
            <span className="nav-heading" id="nav-admin">Quản trị Tiểu đoàn</span>
            <div className="nav-submenu"><NavLink to="/admin/accounts">Tài khoản</NavLink></div>
          </div>
        </>}
        {user.role.code === 'COMPANY_ADMIN' && <div className="nav-group" role="group" aria-labelledby="nav-company">
          <span className="nav-heading" id="nav-company">Đơn vị của tôi</span>
          <div className="nav-submenu"><NavLink to="/company/assets">Tài sản đơn vị</NavLink></div>
        </div>}
      </nav>
    </aside>
    <div className="shell-main"><header className="shell-header">
      <div><p className="eyebrow">HỆ THỐNG NỘI BỘ</p><h1>Quản lý kho Tiểu đoàn 5</h1></div>
      <div className="account"><span>{user.full_name}<small>{user.role.name} · {user.unit.name}</small></span><button type="button" onClick={signOut}>Đăng xuất</button></div>
    </header><main className="shell-content"><Outlet /></main></div>
  </div>
}
