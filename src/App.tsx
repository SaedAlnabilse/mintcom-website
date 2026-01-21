import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoadingFallback } from './components/LoadingFallback';

// ============================================================================
// EAGER IMPORTS (Critical path - always needed)
// ============================================================================
// These are loaded immediately as they're needed for the auth flow
import { ProtectedRoute, EstablishmentRequiredRoute } from './components/ProtectedRoute';

// ============================================================================
// LAZY IMPORTS - PUBLIC PAGES
// ============================================================================
// Landing page is the entry point - consider preloading for better UX
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const DemoPage = lazy(() => import('./pages/DemoPage').then(m => ({ default: m.DemoPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const SignUpPage = lazy(() => import('./pages/SignUpPage').then(m => ({ default: m.SignUpPage })));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage').then(m => ({ default: m.VerifyEmailPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));

// ============================================================================
// LAZY IMPORTS - ONBOARDING
// ============================================================================
const OnboardingPage = lazy(() => import('./pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const SelectEstablishmentPage = lazy(() => import('./pages/SelectEstablishmentPage').then(m => ({ default: m.SelectEstablishmentPage })));

// ============================================================================
// LAZY IMPORTS - LAYOUTS (Loaded when entering each section)
// ============================================================================
const DashboardLayout = lazy(() => import('./components/DashboardLayout').then(m => ({ default: m.DashboardLayout })));
const OwnerLayout = lazy(() => import('./components/OwnerLayout').then(m => ({ default: m.OwnerLayout })));
const BrandLayout = lazy(() => import('./components/BrandLayout').then(m => ({ default: m.BrandLayout })));

// ============================================================================
// LAZY IMPORTS - OWNER PORTAL PAGES
// ============================================================================
const OwnerOverviewPage = lazy(() => import('./pages/owner/OwnerOverviewPage').then(m => ({ default: m.OwnerOverviewPage })));
const OwnerEstablishmentsPage = lazy(() => import('./pages/owner/OwnerEstablishmentsPage').then(m => ({ default: m.OwnerEstablishmentsPage })));
const OwnerEmployeesPage = lazy(() => import('./pages/owner/OwnerEmployeesPage').then(m => ({ default: m.OwnerEmployeesPage })));
const OwnerBillingPage = lazy(() => import('./pages/owner/OwnerBillingPage').then(m => ({ default: m.OwnerBillingPage })));
const OwnerMergePage = lazy(() => import('./pages/owner/OwnerMergePage').then(m => ({ default: m.OwnerMergePage })));
const OwnerBrandsPage = lazy(() => import('./pages/owner/OwnerBrandsPage').then(m => ({ default: m.OwnerBrandsPage })));

// ============================================================================
// LAZY IMPORTS - BRAND PORTAL PAGES
// ============================================================================
const BrandDashboardPage = lazy(() => import('./pages/brand/BrandDashboardPage').then(m => ({ default: m.BrandDashboardPage })));
const BrandLocationsPage = lazy(() => import('./pages/brand/BrandLocationsPage').then(m => ({ default: m.BrandLocationsPage })));
const BrandTeamPage = lazy(() => import('./pages/brand/BrandTeamPage').then(m => ({ default: m.BrandTeamPage })));

// ============================================================================
// LAZY IMPORTS - DASHBOARD PAGES (Largest chunk - most features)
// ============================================================================
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const OrdersPage = lazy(() => import('./pages/dashboard/OrdersPage').then(m => ({ default: m.OrdersPage })));
const ProductsPage = lazy(() => import('./pages/dashboard/ProductsPage').then(m => ({ default: m.ProductsPage })));
const CategoriesPage = lazy(() => import('./pages/dashboard/CategoriesPage').then(m => ({ default: m.CategoriesPage })));
const StaffPage = lazy(() => import('./pages/dashboard/StaffPage').then(m => ({ default: m.StaffPage })));
const CustomersPage = lazy(() => import('./pages/dashboard/CustomersPage').then(m => ({ default: m.CustomersPage })));
const ReportsPage = lazy(() => import('./pages/dashboard/ReportsPage').then(m => ({ default: m.ReportsPage })));
const DiscountsPage = lazy(() => import('./pages/dashboard/DiscountsPage').then(m => ({ default: m.DiscountsPage })));
const PaymentMethodsPage = lazy(() => import('./pages/dashboard/PaymentMethodsPage').then(m => ({ default: m.PaymentMethodsPage })));
const SettingsPage = lazy(() => import('./pages/dashboard/SettingsPage').then(m => ({ default: m.SettingsPage })));
const ActivityLogsPage = lazy(() => import('./pages/dashboard/ActivityLogsPage').then(m => ({ default: m.ActivityLogsPage })));
const AddonsPage = lazy(() => import('./pages/dashboard/AddonsPage').then(m => ({ default: m.AddonsPage })));
const MaterialsPage = lazy(() => import('./pages/dashboard/MaterialsPage').then(m => ({ default: m.MaterialsPage })));
const RecipesPage = lazy(() => import('./pages/dashboard/RecipesPage').then(m => ({ default: m.RecipesPage })));
const EstablishmentsPage = lazy(() => import('./pages/dashboard/EstablishmentsPage').then(m => ({ default: m.EstablishmentsPage })));
const BillingPage = lazy(() => import('./pages/dashboard/BillingPage').then(m => ({ default: m.BillingPage })));
const AdminUsersPage = lazy(() => import('./pages/dashboard/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })));

// ============================================================================
// SUSPENSE WRAPPER COMPONENTS
// ============================================================================
// These wrap lazy components with appropriate loading states

/** Wrapper for full-page lazy components */
function PageSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingFallback message="Loading..." />}>
      {children}
    </Suspense>
  );
}

/** Wrapper for layout components (shows loading while layout chunk loads) */
function LayoutSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingFallback message="Loading..." />}>
      {children}
    </Suspense>
  );
}

// ============================================================================
// ROUTER CONFIGURATION
// ============================================================================
const router = createBrowserRouter([
  {
    element: (
      <>
        <Outlet />
      </>
    ),
    children: [
      // ========== PUBLIC ROUTES ==========
      {
        path: "/",
        element: (
          <PageSuspense>
            <LandingPage />
          </PageSuspense>
        ),
      },
      {
        path: "/demo",
        element: (
          <PageSuspense>
            <DemoPage />
          </PageSuspense>
        ),
      },
      {
        path: "/login",
        element: (
          <PageSuspense>
            <LoginPage />
          </PageSuspense>
        ),
      },
      {
        path: "/signup",
        element: (
          <PageSuspense>
            <SignUpPage />
          </PageSuspense>
        ),
      },
      {
        path: "/verify-email",
        element: (
          <PageSuspense>
            <VerifyEmailPage />
          </PageSuspense>
        ),
      },
      {
        path: "/forgot-password",
        element: (
          <PageSuspense>
            <ForgotPasswordPage />
          </PageSuspense>
        ),
      },
      {
        path: "/reset-password",
        element: (
          <PageSuspense>
            <ResetPasswordPage />
          </PageSuspense>
        ),
      },

      // ========== PROTECTED ROUTES (Require Authentication) ==========
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "/onboarding",
            element: (
              <PageSuspense>
                <OnboardingPage />
              </PageSuspense>
            ),
          },
          {
            path: "/select-establishment",
            element: (
              <PageSuspense>
                <SelectEstablishmentPage />
              </PageSuspense>
            ),
          },

          // ========== OWNER PORTAL ==========
          {
            path: "/owner",
            element: (
              <LayoutSuspense>
                <OwnerLayout />
              </LayoutSuspense>
            ),
            children: [
              {
                index: true,
                element: (
                  <PageSuspense>
                    <OwnerOverviewPage />
                  </PageSuspense>
                ),
              },
              {
                path: "establishments",
                element: (
                  <PageSuspense>
                    <OwnerEstablishmentsPage />
                  </PageSuspense>
                ),
              },
              {
                path: "brands",
                element: (
                  <PageSuspense>
                    <OwnerBrandsPage />
                  </PageSuspense>
                ),
              },
              {
                path: "employees",
                element: (
                  <PageSuspense>
                    <OwnerEmployeesPage />
                  </PageSuspense>
                ),
              },
              {
                path: "billing",
                element: (
                  <PageSuspense>
                    <OwnerBillingPage />
                  </PageSuspense>
                ),
              },
              {
                path: "merge",
                element: (
                  <PageSuspense>
                    <OwnerMergePage />
                  </PageSuspense>
                ),
              },
            ],
          },

          // ========== BRAND PORTAL ==========
          {
            path: "/brand/:brandId",
            element: (
              <LayoutSuspense>
                <BrandLayout />
              </LayoutSuspense>
            ),
            children: [
              {
                index: true,
                element: (
                  <PageSuspense>
                    <BrandDashboardPage />
                  </PageSuspense>
                ),
              },
              {
                path: "locations",
                element: (
                  <PageSuspense>
                    <BrandLocationsPage />
                  </PageSuspense>
                ),
              },
              {
                path: "team",
                element: (
                  <PageSuspense>
                    <BrandTeamPage />
                  </PageSuspense>
                ),
              },
            ],
          },
        ],
      },

      // ========== ESTABLISHMENT-REQUIRED ROUTES ==========
      {
        element: <EstablishmentRequiredRoute />,
        children: [
          {
            path: "/dashboard",
            element: (
              <LayoutSuspense>
                <DashboardLayout />
              </LayoutSuspense>
            ),
            children: [
              {
                index: true,
                element: (
                  <PageSuspense>
                    <DashboardPage />
                  </PageSuspense>
                ),
              },
              {
                path: "orders",
                element: (
                  <PageSuspense>
                    <OrdersPage />
                  </PageSuspense>
                ),
              },
              {
                path: "products",
                element: (
                  <PageSuspense>
                    <ProductsPage />
                  </PageSuspense>
                ),
              },
              {
                path: "categories",
                element: (
                  <PageSuspense>
                    <CategoriesPage />
                  </PageSuspense>
                ),
              },
              {
                path: "staff",
                element: (
                  <PageSuspense>
                    <StaffPage />
                  </PageSuspense>
                ),
              },
              {
                path: "customers",
                element: (
                  <PageSuspense>
                    <CustomersPage />
                  </PageSuspense>
                ),
              },
              {
                path: "reports",
                element: (
                  <PageSuspense>
                    <ReportsPage />
                  </PageSuspense>
                ),
              },
              {
                path: "discounts",
                element: (
                  <PageSuspense>
                    <DiscountsPage />
                  </PageSuspense>
                ),
              },
              {
                path: "payment-methods",
                element: (
                  <PageSuspense>
                    <PaymentMethodsPage />
                  </PageSuspense>
                ),
              },
              {
                path: "settings",
                element: (
                  <PageSuspense>
                    <SettingsPage />
                  </PageSuspense>
                ),
              },
              {
                path: "activity-logs",
                element: (
                  <PageSuspense>
                    <ActivityLogsPage />
                  </PageSuspense>
                ),
              },
              {
                path: "addons",
                element: (
                  <PageSuspense>
                    <AddonsPage />
                  </PageSuspense>
                ),
              },
              {
                path: "materials",
                element: (
                  <PageSuspense>
                    <MaterialsPage />
                  </PageSuspense>
                ),
              },
              {
                path: "recipes",
                element: (
                  <PageSuspense>
                    <RecipesPage />
                  </PageSuspense>
                ),
              },
              {
                path: "establishments",
                element: (
                  <PageSuspense>
                    <EstablishmentsPage />
                  </PageSuspense>
                ),
              },
              {
                path: "billing",
                element: (
                  <PageSuspense>
                    <BillingPage />
                  </PageSuspense>
                ),
              },
              {
                path: "admin-users",
                element: (
                  <PageSuspense>
                    <AdminUsersPage />
                  </PageSuspense>
                ),
              },
            ],
          },
        ],
      },
    ],
  },
]);

// ============================================================================
// APP COMPONENT
// ============================================================================
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
