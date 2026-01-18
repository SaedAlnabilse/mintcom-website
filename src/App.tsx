import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute, EstablishmentRequiredRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/DashboardLayout';
import { OwnerLayout } from './components/OwnerLayout';
import { Outlet } from 'react-router-dom';

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

// Owner Portal Pages
import { OwnerOverviewPage } from './pages/owner/OwnerOverviewPage';
import { OwnerEstablishmentsPage } from './pages/owner/OwnerEstablishmentsPage';
import { OwnerEmployeesPage } from './pages/owner/OwnerEmployeesPage';
import { OwnerBillingPage } from './pages/owner/OwnerBillingPage';
import { OwnerMergePage } from './pages/owner/OwnerMergePage';
import { OwnerBrandsPage } from './pages/owner/OwnerBrandsPage';

// Brand Dashboard
import { BrandLayout } from './components/BrandLayout';
import { BrandDashboardPage } from './pages/brand/BrandDashboardPage';
import { BrandLocationsPage } from './pages/brand/BrandLocationsPage';
import { BrandTeamPage } from './pages/brand/BrandTeamPage';

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
import { AdminUsersPage } from './pages/dashboard/AdminUsersPage';

const router = createBrowserRouter([
  {
    element: (
      <>
        <Outlet />
      </>
    ),
    children: [
      {
        path: "/",
        element: <LandingPage />,
      },
      {
        path: "/demo",
        element: <DemoPage />,
      },
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/signup",
        element: <SignUpPage />,
      },
      {
        path: "/verify-email",
        element: <VerifyEmailPage />,
      },
      {
        path: "/forgot-password",
        element: <ForgotPasswordPage />,
      },
      {
        path: "/reset-password",
        element: <ResetPasswordPage />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "/onboarding",
            element: <OnboardingPage />,
          },
          {
            path: "/select-establishment",
            element: <SelectEstablishmentPage />,
          },
          {
            path: "/owner",
            element: <OwnerLayout />,
            children: [
              { index: true, element: <OwnerOverviewPage /> },
              { path: "establishments", element: <OwnerEstablishmentsPage /> },
              { path: "brands", element: <OwnerBrandsPage /> },
              { path: "employees", element: <OwnerEmployeesPage /> },
              { path: "billing", element: <OwnerBillingPage /> },
              { path: "merge", element: <OwnerMergePage /> },
            ],
          },
          {
            path: "/brand/:brandId",
            element: <BrandLayout />,
            children: [
              { index: true, element: <BrandDashboardPage /> },
              { path: "locations", element: <BrandLocationsPage /> },
              { path: "team", element: <BrandTeamPage /> },
            ],
          },
        ],
      },
      {
        element: <EstablishmentRequiredRoute />,
        children: [
          {
            path: "/dashboard",
            element: <DashboardLayout />,
            children: [
              { index: true, element: <DashboardPage /> },
              { path: "orders", element: <OrdersPage /> },
              { path: "products", element: <ProductsPage /> },
              { path: "categories", element: <CategoriesPage /> },
              { path: "staff", element: <StaffPage /> },
              { path: "customers", element: <CustomersPage /> },
              { path: "reports", element: <ReportsPage /> },
              { path: "discounts", element: <DiscountsPage /> },
              { path: "payment-methods", element: <PaymentMethodsPage /> },
              { path: "settings", element: <SettingsPage /> },
              { path: "activity-logs", element: <ActivityLogsPage /> },
              { path: "addons", element: <AddonsPage /> },
              { path: "materials", element: <MaterialsPage /> },
              { path: "recipes", element: <RecipesPage /> },
              { path: "establishments", element: <EstablishmentsPage /> },
              { path: "billing", element: <BillingPage /> },
              { path: "admin-users", element: <AdminUsersPage /> },
            ],
          },
        ],
      },
    ]
  }
]);

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="paymint-ui-theme">
      <AuthProvider>
        <RouterProvider router={router} />
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



