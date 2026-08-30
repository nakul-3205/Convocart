import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ShopPage from './pages/ShopPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminOrderDetailPage from './pages/AdminOrderDetailPage';
import NotFoundPage from './pages/NotFoundPage';
import RequireAdminAuth from './components/RequireAdminAuth';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/shop" element={<ShopPage />} />
      <Route path="/track/:orderId" element={<OrderTrackingPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin"
        element={
          <RequireAdminAuth>
            <AdminDashboardPage />
          </RequireAdminAuth>
        }
      />
      <Route
        path="/admin/orders/:orderId"
        element={
          <RequireAdminAuth>
            <AdminOrderDetailPage />
          </RequireAdminAuth>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
