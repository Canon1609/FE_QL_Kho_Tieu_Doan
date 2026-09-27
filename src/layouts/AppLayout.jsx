import { Outlet } from 'react-router-dom'

export default function AppLayout() {
  return (
    <main className="app-layout">
      <header className="app-header">
        <h1>Hệ thống quản lý kho Tiểu đoàn 5</h1>
      </header>
      <Outlet />
    </main>
  )
}
