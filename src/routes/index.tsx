import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from './paths';
import { ProtectedRoute, PublicRoute, RoleRoute } from '@/guards/ProtectedRoute';
import { LoadingAnimation } from '@/components/ui/loading-animation';
import type { Location } from 'react-router-dom';

// ─── Lazy-loaded screens ───────────────────────────────

const OnboardingScreen = lazy(() => import('@/screens/OnboardingScreen'));
const LoginScreen = lazy(() => import('@/screens/LoginScreen'));
const HomeScreen = lazy(() => import('@/screens/HomeScreen'));
const CanteenDetailScreen = lazy(() => import('@/screens/CanteenDetailScreen'));
const CartScreen = lazy(() => import('@/screens/CartScreen'));
const PaymentScreen = lazy(() => import('@/screens/PaymentScreen'));
const OrderSuccessScreen = lazy(() => import('@/screens/OrderSuccessScreen'));
const OrderTrackingScreen = lazy(() => import('@/screens/OrderTrackingScreen'));
const OrdersScreen = lazy(() => import('@/screens/OrdersScreen'));
const GroupOrderScreen = lazy(() => import('@/screens/GroupOrderScreen'));
const OffersScreen = lazy(() => import('@/screens/OffersScreen'));
const ProfileScreen = lazy(() => import('@/screens/ProfileScreen'));
const CanteenDashboardScreen = lazy(() => import('@/screens/CanteenDashboardScreen'));
const AdminScreen = lazy(() => import('@/screens/AdminScreen'));
const MenuManagementScreen = lazy(() => import('@/screens/MenuManagementScreen'));
const CanteenSettingsScreen = lazy(() => import('@/screens/CanteenSettingsScreen'));
const NotFoundScreen = lazy(() => import('@/screens/NotFoundScreen'));

// ─── Loading Fallback ──────────────────────────────────

function RouteFallback() {
  return (
    <LoadingAnimation
      variant="fullscreen"
      message="Loading..."
    />
  );
}

// ─── Shared route elements for keep-alive caching ──────
// Extracted into an array so multiple <Routes> instances can
// render the same route definitions with different locations.

type RouteItem = {
  path: string;
  element: React.ReactNode;
};

// ─── Redirect-only routes (never cached) ───────────
// These use <Navigate> and must NOT be rendered inside cached pages
// because <Navigate> fires on every render, even when hidden.
const REDIRECT_ROUTES: RouteItem[] = [
  { path: ROUTES.ROOT, element: <Navigate to={ROUTES.LOGIN} replace /> },
];

// ─── Content routes (eligible for keep-alive caching) ─
const CONTENT_ROUTES: RouteItem[] = [
  // ─── Public / Pre-Auth Routes ─────────────────
  { path: ROUTES.ONBOARDING, element: <OnboardingScreen /> },
  { path: ROUTES.LOGIN, element: <PublicRoute><LoginScreen /></PublicRoute> },
  { path: ROUTES.LOGIN_CANTEEN, element: <PublicRoute><LoginScreen /></PublicRoute> },

  // ─── Canteen Owner Routes ────────────────────
  { path: ROUTES.CANTEEN_DASHBOARD, element: <RoleRoute allowedRoles={['canteen_owner', 'admin']}><CanteenDashboardScreen /></RoleRoute> },
  { path: ROUTES.MENU_MANAGEMENT, element: <RoleRoute allowedRoles={['canteen_owner', 'admin']}><MenuManagementScreen /></RoleRoute> },
  { path: ROUTES.CANTEEN_SETTINGS, element: <RoleRoute allowedRoles={['canteen_owner', 'admin']}><CanteenSettingsScreen /></RoleRoute> },

  // ─── Admin Routes ───────────────────────────
  { path: ROUTES.ADMIN_DASHBOARD, element: <RoleRoute allowedRoles={['admin']}><AdminScreen /></RoleRoute> },

  // ─── Customer Routes (authenticated) ────────────
  { path: ROUTES.HOME, element: <ProtectedRoute><HomeScreen /></ProtectedRoute> },
  { path: ROUTES.CANTEEN_DETAIL, element: <ProtectedRoute><CanteenDetailScreen /></ProtectedRoute> },
  { path: ROUTES.CART, element: <ProtectedRoute><CartScreen /></ProtectedRoute> },
  { path: ROUTES.PAYMENT, element: <ProtectedRoute><PaymentScreen /></ProtectedRoute> },
  { path: ROUTES.ORDER_SUCCESS, element: <ProtectedRoute><OrderSuccessScreen /></ProtectedRoute> },
  { path: ROUTES.ORDER_TRACKING, element: <ProtectedRoute><OrderTrackingScreen /></ProtectedRoute> },
  { path: ROUTES.ORDERS, element: <ProtectedRoute><OrdersScreen /></ProtectedRoute> },
  { path: ROUTES.GROUP_ORDER, element: <ProtectedRoute><GroupOrderScreen /></ProtectedRoute> },
  { path: ROUTES.OFFERS, element: <ProtectedRoute><OffersScreen /></ProtectedRoute> },
  { path: ROUTES.PROFILE, element: <ProtectedRoute><ProfileScreen /></ProtectedRoute> },

  // ─── 404 Catch-all ──────────────────────────
  { path: '*', element: <NotFoundScreen /> },
];

// ─── Route Configuration ───────────────────────────────

interface AppRoutesProps {
  /**
   * Optional location override. When provided, the <Routes> renders
   * the matching route for that location instead of the real URL.
   * This lets us keep visited pages alive in the DOM for instant
   * back-navigation without remounting.
   */
  location?: string | Partial<Location>;
}

function AppRoutes({ location }: AppRoutesProps) {
  const isCachedView = !!location;

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes location={location}>
        {/* Redirect routes — only in primary view (never cached) */}
        {!isCachedView &&
          REDIRECT_ROUTES.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        {CONTENT_ROUTES.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
