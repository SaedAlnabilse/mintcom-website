import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/DashboardLayout';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { DemoPage } from './pages/DemoPage';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';

// Dashboard Pages
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { OrdersPage } from './pages/dashboard/OrdersPage';
import { ProductsPage } from './pages/dashboard/ProductsPage';
import { CategoriesPage } from './pages/dashboard/CategoriesPage';
import { StaffPage } from './pages/dashboard/StaffPage';
import { CustomersPage } from './pages/dashboard/CustomersPage';
import { ReportsPage } from './pages/dashboard/ReportsPage';
import { DiscountsPage } from './pages/dashboard/DiscountsPage';
import { PaymentMethodsPage } from './pages/dashboard/PaymentMethodsPage';
import { SettingsPage } from './pages/dashboard/SettingsPage';
import { ActivityLogsPage } from './pages/dashboard/ActivityLogsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />

          {/* Protected Dashboard Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="staff" element={<StaffPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="discounts" element={<DiscountsPage />} />
              <Route path="payment-methods" element={<PaymentMethodsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="activity-logs" element={<ActivityLogsPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #374151',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </AuthProvider>
  );
}

export default App;
