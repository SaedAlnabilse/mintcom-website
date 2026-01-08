import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute, EstablishmentRequiredRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/DashboardLayout';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { DemoPage } from './pages/DemoPage';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

// Onboarding
import { OnboardingPage } from './pages/OnboardingPage';

import { SelectEstablishmentPage } from './pages/SelectEstablishmentPage';

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
import { AddonsPage } from './pages/dashboard/AddonsPage';
import { MaterialsPage } from './pages/dashboard/MaterialsPage';
import { RecipesPage } from './pages/dashboard/RecipesPage';
import { EstablishmentsPage } from './pages/dashboard/EstablishmentsPage';
import { BillingPage } from './pages/dashboard/BillingPage';
import { BrandsPage } from './pages/dashboard/BrandsPage';
import { BrandDetailPage } from './pages/dashboard/BrandDetailPage';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="paymint-ui-theme">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Onboarding Route */}
          <Route element={<ProtectedRoute />}>
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/select-establishment" element={<SelectEstablishmentPage />} />
          </Route>

          {/* Protected Dashboard Routes */}
          <Route element={<EstablishmentRequiredRoute />}>
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
              <Route path="addons" element={<AddonsPage />} />
              <Route path="materials" element={<MaterialsPage />} />
              <Route path="recipes" element={<RecipesPage />} />
              <Route path="establishments" element={<EstablishmentsPage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="brands" element={<BrandsPage />} />
              <Route path="brands/:brandId" element={<BrandDetailPage />} />
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
              primary: '#7CC39F',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#D55263',
              secondary: '#fff',
            },
          },
        }}
      />
          </AuthProvider>
        </ThemeProvider>
      );
    }
export default App;



