import { lazy, Suspense, useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom';
import { EstablishmentUrlResolver } from './components/EstablishmentUrlResolver';
import { Toaster, toast } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { LoadingFallback } from './components/LoadingFallback';
import { CookieConsent } from './components/CookieConsent';
import { FeedbackWidget } from './components/FeedbackWidget';
import { ErrorBoundary } from './components/ErrorBoundary';

// ============================================================================
// Eager Imports (Critical path - always needed)
// ============================================================================
// These are loaded immediately as they're needed for the auth flow
import { ErrorPage } from './components/ErrorPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ChatWidgetEnhancer } from './components/ChatWidgetEnhancer';
import { ScrollToTop } from './components/ScrollToTop';

// ============================================================================
// Lazy Imports - Public Pages
// ============================================================================
// Landing page is the entry point - consider preloading for better UX
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));

const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const SignUpPage = lazy(() => import('./pages/SignUpPage').then(m => ({ default: m.SignUpPage })));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage').then(m => ({ default: m.VerifyEmailPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const CookiePolicyPage = lazy(() => import('./pages/CookiePolicyPage').then(m => ({ default: m.CookiePolicyPage })));
const AboutUsPage = lazy(() => import('./pages/AboutUsPage').then(m => ({ default: m.AboutUsPage })));
const QAPage = lazy(() => import('./pages/QAPage').then(m => ({ default: m.QAPage })));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })));

// ============================================================================
// Lazy Imports - Support Pages
// ============================================================================
const SupportPage = lazy(() => import('./pages/support/SupportPage').then(m => ({ default: m.SupportPage })));
const TicketsPage = lazy(() => import('./pages/support/TicketsPage').then(m => ({ default: m.TicketsPage })));
const TicketDetailPage = lazy(() => import('./pages/support/TicketDetailPage').then(m => ({ default: m.TicketDetailPage })));
const NewTicketPage = lazy(() => import('./pages/support/NewTicketPage').then(m => ({ default: m.NewTicketPage })));
const SupportCategoryPage = lazy(() => import('./pages/support/SupportCategoryPage').then(m => ({ default: m.SupportCategoryPage })));
const ArticlePage = lazy(() => import('./pages/support/ArticlePage').then(m => ({ default: m.ArticlePage })));
const AllArticlesPage = lazy(() => import('./pages/support/AllArticlesPage').then(m => ({ default: m.AllArticlesPage })));
const SupportAdminPage = lazy(() => import('./pages/support/SupportAdminPage').then(m => ({ default: m.SupportAdminPage })));
const SupportAdminDetailPage = lazy(() => import('./pages/support/SupportAdminDetailPage').then(m => ({ default: m.SupportAdminDetailPage })));

// ============================================================================
// Lazy Imports - Portal Pages
// ============================================================================
const PortalPage = lazy(() => import('./pages/portal/PortalPage').then(m => ({ default: m.PortalPage })));

// ============================================================================
// Lazy Imports - Onboarding
// ============================================================================
const OnboardingPage = lazy(() => import('./pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const SelectEstablishmentPage = lazy(() => import('./pages/SelectEstablishmentPage').then(m => ({ default: m.SelectEstablishmentPage })));

// ============================================================================
// Lazy Imports - Layouts (Loaded when entering each section)
// ============================================================================
const DashboardLayout = lazy(() => import('./components/DashboardLayout').then(m => ({ default: m.DashboardLayout })));
const OwnerLayout = lazy(() => import('./components/OwnerLayout').then(m => ({ default: m.OwnerLayout })));
const BrandLayout = lazy(() => import('./components/BrandLayout').then(m => ({ default: m.BrandLayout })));

// ============================================================================
// Lazy Imports - Owner Portal Pages
// ============================================================================
const OwnerOverviewPage = lazy(() => import('./pages/owner/OwnerOverviewPage').then(m => ({ default: m.OwnerOverviewPage })));
const OwnerEstablishmentsPage = lazy(() => import('./pages/owner/OwnerEstablishmentsPage').then(m => ({ default: m.OwnerEstablishmentsPage })));
const OwnerEmployeesPage = lazy(() => import('./pages/owner/OwnerEmployeesPage').then(m => ({ default: m.OwnerEmployeesPage })));
const OwnerBillingPage = lazy(() => import('./pages/owner/OwnerBillingPage').then(m => ({ default: m.OwnerBillingPage })));
const OwnerMergePage = lazy(() => import('./pages/owner/OwnerMergePage').then(m => ({ default: m.OwnerMergePage })));
const OwnerBrandsPage = lazy(() => import('./pages/owner/OwnerBrandsPage').then(m => ({ default: m.OwnerBrandsPage })));
const OwnerRolesPage = lazy(() => import('./pages/owner/OwnerRolesPage').then(m => ({ default: m.OwnerRolesPage })));
const OwnerAccountManagementPage = lazy(() => import('./pages/owner/OwnerAccountManagementPage').then(m => ({ default: m.OwnerAccountManagementPage })));

// ============================================================================
// Lazy Imports - Brand Portal Pages
// ============================================================================
const BrandDashboardPage = lazy(() => import('./pages/brand/BrandDashboardPage').then(m => ({ default: m.BrandDashboardPage })));
const BrandLocationsPage = lazy(() => import('./pages/brand/BrandLocationsPage').then(m => ({ default: m.BrandLocationsPage })));
const BrandTeamPage = lazy(() => import('./pages/brand/BrandTeamPage'));

// ============================================================================
// Lazy Imports - Dashboard Pages (Largest chunk - most features)
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
const LoyaltyPage = lazy(() => import('./pages/dashboard/LoyaltyPage').then(m => ({ default: m.LoyaltyPage })));
const ActivityLogsPage = lazy(() => import('./pages/dashboard/ActivityLogsPage').then(m => ({ default: m.ActivityLogsPage })));
const AddonsPage = lazy(() => import('./pages/dashboard/AddonsPage').then(m => ({ default: m.AddonsPage })));
const MaterialsPage = lazy(() => import('./pages/dashboard/MaterialsPage').then(m => ({ default: m.MaterialsPage })));
const RecipesPage = lazy(() => import('./pages/dashboard/RecipesPage').then(m => ({ default: m.RecipesPage })));
const EstablishmentsPage = lazy(() => import('./pages/dashboard/EstablishmentsPage').then(m => ({ default: m.EstablishmentsPage })));
const BillingPage = lazy(() => import('./pages/dashboard/BillingPage').then(m => ({ default: m.BillingPage })));
const AdminUsersPage = lazy(() => import('./pages/dashboard/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })));
const CustomRolesPage = lazy(() => import('./pages/dashboard/CustomRolesPage').then(m => ({ default: m.CustomRolesPage })));

// ============================================================================
// Suspense Wrapper Components
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
// Router Configuration
// ============================================================================
const router = createBrowserRouter([
  {
    errorElement: <ErrorPage />,
    element: (
      <>
        <ScrollToTop />
        <Outlet />
        <CookieConsent />
        <FeedbackWidget />
        <ChatWidgetEnhancer />
      </>
    ),
    children: [
      // ========== Public Routes ==========
      {
        path: "/",
        element: (
          <PageSuspense>
            <LandingPage />
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
      {
        path: "/legal/cookie-policy",
        element: (
          <PageSuspense>
            <CookiePolicyPage />
          </PageSuspense>
        ),
      },
      {
        path: "/about",
        element: (
          <PageSuspense>
            <AboutUsPage />
          </PageSuspense>
        ),
      },
      {
        path: "/qa",
        element: (
          <PageSuspense>
            <QAPage />
          </PageSuspense>
        ),
      },
      {
        path: "/legal/privacy",
        element: (
          <PageSuspense>
            <PrivacyPolicyPage />
          </PageSuspense>
        ),
      },
      {
        path: "/legal/terms",
        element: (
          <PageSuspense>
            <TermsPage />
          </PageSuspense>
        ),
      },

      // ========== Support Routes (Public Articles) ==========
      {
        path: "/support",
        element: (
          <PageSuspense>
            <SupportPage />
          </PageSuspense>
        ),
      },
      {
        path: "/support/category/:categoryId",
        element: (
          <PageSuspense>
            <SupportCategoryPage />
          </PageSuspense>
        ),
      },
      {
        path: "/support/article/:articleId",
        element: (
          <PageSuspense>
            <ArticlePage />
          </PageSuspense>
        ),
      },
      {
        path: "/support/articles",
        element: (
          <PageSuspense>
            <AllArticlesPage />
          </PageSuspense>
        ),
      },

      // ========== Support Admin Portal (handles its own auth) ==========
      {
        path: "/support/admin",
        element: (
          <PageSuspense>
            <SupportAdminPage />
          </PageSuspense>
        ),
      },
      {
        path: "/support/admin/:ticketId",
        element: (
          <PageSuspense>
            <SupportAdminDetailPage />
          </PageSuspense>
        ),
      },

      // ========== Community Routes (Temporarily Disabled) ==========
      {
        path: "/community-hub",
        element: <Navigate to="/" replace />,
      },
      {
        path: "/community/*",
        element: <Navigate to="/" replace />,
      },

      // ========== Portal Routes (Protected) ==========
      {
        element: <ProtectedRoute />,
        children: [
          // ========== Support Ticket Routes (Protected) ==========
          {
            path: "/support/tickets",
            element: (
              <PageSuspense>
                <TicketsPage />
              </PageSuspense>
            ),
          },
          {
            path: "/support/tickets/new",
            element: (
              <PageSuspense>
                <NewTicketPage />
              </PageSuspense>
            ),
          },
          {
            path: "/support/tickets/:ticketId",
            element: (
              <PageSuspense>
                <TicketDetailPage />
              </PageSuspense>
            ),
          },
          {
            path: "/portal",
            element: (
              <PageSuspense>
                <PortalPage />
              </PageSuspense>
            ),
          },
          {
            path: "/onboarding",
            element: <Navigate to="/onboarding/step/1" replace />,
          },
          {
            path: "/onboarding/step/:step",
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

          // ========== Owner Portal ==========
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
                path: "roles",
                element: (
                  <PageSuspense>
                    <OwnerRolesPage />
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
              {
                path: "account",
                element: (
                  <PageSuspense>
                    <OwnerAccountManagementPage />
                  </PageSuspense>
                ),
              },
            ],
          },

          // ========== Brand Portal ==========
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
      // ========== Establishment-Required Routes ==========
      // Use simpler wrapper or direct routes since Resolver handles logic
      {
        children: [
          // Redirect root /dashboard to selection
          {
            path: "/dashboard",
            element: <Navigate to="/select-establishment" replace />
          },
          {
            path: "/dashboard/:locationSlug",
            element: (
              <EstablishmentUrlResolver>
                <LayoutSuspense>
                  <DashboardLayout />
                </LayoutSuspense>
              </EstablishmentUrlResolver>
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
                path: "reports/:type?",
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
                path: "loyalty",
                element: (
                  <PageSuspense>
                    <LoyaltyPage />
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
              {
                path: "roles",
                element: (
                  <PageSuspense>
                    <CustomRolesPage />
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
// App Component
// ============================================================================
function App() {
  // Listen for permission-denied events from API interceptor
  useEffect(() => {
    const handlePermissionDenied = (event: CustomEvent<{ message: string }>) => {
      toast.error(event.detail.message || 'You do not have permission to perform this action', {
        duration: 5000,
        id: 'permission-denied', // Prevent duplicate toasts
      });
    };

    window.addEventListener('permission-denied', handlePermissionDenied as EventListener);
    return () => {
      window.removeEventListener('permission-denied', handlePermissionDenied as EventListener);
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system" storageKey="paymint-ui-theme">
        <AuthProvider>
          <CurrencyProvider>
            <div id="global-blocking-overlay" />
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
          </CurrencyProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

