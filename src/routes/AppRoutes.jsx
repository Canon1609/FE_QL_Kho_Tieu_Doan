import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import ProtectedRoute from './ProtectedRoute'
import AppLayout from '../layouts/AppLayout'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import AccountsPage from '../pages/AccountsPage'
import CatalogPage from '../pages/CatalogPage'
import AccountSecurityPage from '../pages/AccountSecurityPage'
import ForgotPasswordPage from '../pages/ForgotPasswordPage'
import NotFoundPage from '../pages/NotFoundPage'
import ReceiptsPage from '../pages/ReceiptsPage'
import StockBalancePage from '../pages/StockBalancePage'

export default function AppRoutes() {
  return <BrowserRouter><AuthProvider><Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route element={<ProtectedRoute />}><Route element={<AppLayout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/account/security" element={<AccountSecurityPage />} />
      <Route path="/catalog/:kind" element={<CatalogPage />} />
      <Route element={<ProtectedRoute roles={['BATTALION_ADMIN']} />}><Route path="/admin/accounts" element={<AccountsPage />} /><Route path="/stock/receipts" element={<ReceiptsPage />} /><Route path="/stock/balance" element={<StockBalancePage />} /></Route>
      <Route path="/forbidden" element={<section><h2>Không có quyền truy cập</h2><p>Liên hệ quản trị nếu cần cấp quyền.</p><Link to="/">Về trang chủ</Link></section>} />
      <Route path="*" element={<NotFoundPage />} />
    </Route></Route>
  </Routes></AuthProvider></BrowserRouter>
}
