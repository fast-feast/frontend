import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from './paths';
import { PublicRoute, RoleRoute } from '@/guards/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import { LoadingAnimation } from '@/components/ui/loading-animation';

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
const AdminLoginScreen = lazy(() => import('@/screens/AdminLoginScreen'));
const AdminUsersScreen = lazy(() => import('@/screens/AdminUsersScreen'));
const AdminCanteensScreen = lazy(() => import('@/screens/AdminCanteensScreen'));
const AdminOrdersScreen = lazy(() => import('@/screens/AdminOrdersScreen'));
const MenuManagementScreen = lazy(() => import('@/screens/MenuManagementScreen'));
const CanteenSettingsScreen = lazy(() => import('@/screens/CanteenSettingsScreen'));
const AllCanteensScreen = lazy(() => import('@/screens/AllCanteensScreen'));
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

// ─── Route Configuration ───────────────────────────────
// The three apps (Student / Canteen / Admin) share this router but
// each route is guarded by the role(s) allowed to see it:
//   Student   → role 'user'          → may ONLY access student routes
//   Canteen   → role 'canteen_owner' → may ONLY access /canteen/* routes
//   Admin     → role 'admin'         → may ONLY access /admin/* routes
// Unauthenticated users are sent to the login screen of the app they
// tried to enter; logged-in users of the wrong role are sent back to
// their own dashboard.

function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* ─── Root redirects to the student login. ── */}
        <Route path={ROUTES.ROOT} element={<Navigate to={ROUTES.LOGIN} replace />} />

        {/* ─── Public / Pre-Auth Routes ───────────────── */}
        <Route path={ROUTES.ONBOARDING} element={<OnboardingScreen />} />
        <Route path={ROUTES.LOGIN} element={<PublicRoute><LoginScreen /></PublicRoute>} />
        <Route path={ROUTES.LOGIN_CANTEEN} element={<PublicRoute><LoginScreen /></PublicRoute>} />
        <Route path={ROUTES.ADMIN_LOGIN} element={<PublicRoute><AdminLoginScreen /></PublicRoute>} />

        {/* ─── Canteen Owner Routes ──────────────────── */}
        {/* MUST come before /canteen/:canteenId to prevent parameter matching */}
        <Route
          path={ROUTES.CANTEEN_DASHBOARD}
          element={
            <RoleRoute allowedRoles={['canteen_owner']} loginPath={ROUTES.LOGIN_CANTEEN}>
              <CanteenDashboardScreen />
            </RoleRoute>
          }
        />

        {/* ─── Canteen Menu Management ────────────── */}
        <Route
          path={ROUTES.MENU_MANAGEMENT}
          element={
            <RoleRoute allowedRoles={['canteen_owner']} loginPath={ROUTES.LOGIN_CANTEEN}>
              <MenuManagementScreen />
            </RoleRoute>
          }
        />

        {/* ─── Canteen Settings ──────────────────── */}
        <Route
          path={ROUTES.CANTEEN_SETTINGS}
          element={
            <RoleRoute allowedRoles={['canteen_owner']} loginPath={ROUTES.LOGIN_CANTEEN}>
              <CanteenSettingsScreen />
            </RoleRoute>
          }
        />

        {/* ─── Admin Routes ─────────────────────────── */}
        <Route
          path={ROUTES.ADMIN_DASHBOARD}
          element={
            <RoleRoute allowedRoles={['admin']} loginPath={ROUTES.ADMIN_LOGIN}>
              <AdminLayout>
                <AdminScreen />
              </AdminLayout>
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_USERS}
          element={
            <RoleRoute allowedRoles={['admin']} loginPath={ROUTES.ADMIN_LOGIN}>
              <AdminLayout>
                <AdminUsersScreen />
              </AdminLayout>
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_CANTEENS}
          element={
            <RoleRoute allowedRoles={['admin']} loginPath={ROUTES.ADMIN_LOGIN}>
              <AdminLayout>
                <AdminCanteensScreen />
              </AdminLayout>
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_ORDERS}
          element={
            <RoleRoute allowedRoles={['admin']} loginPath={ROUTES.ADMIN_LOGIN}>
              <AdminLayout>
                <AdminOrdersScreen />
              </AdminLayout>
            </RoleRoute>
          }
        />

        {/* ─── Customer Routes (role: user) ───────────── */}
        <Route path={ROUTES.HOME} element={<RoleRoute allowedRoles={['user']}><HomeScreen /></RoleRoute>} />
        <Route path={ROUTES.ALL_CANTEENS} element={<RoleRoute allowedRoles={['user']}><AllCanteensScreen /></RoleRoute>} />
        <Route path={ROUTES.CANTEEN_DETAIL} element={<RoleRoute allowedRoles={['user']}><CanteenDetailScreen /></RoleRoute>} />
        <Route path={ROUTES.CART} element={<RoleRoute allowedRoles={['user']}><CartScreen /></RoleRoute>} />
        <Route path={ROUTES.PAYMENT} element={<RoleRoute allowedRoles={['user']}><PaymentScreen /></RoleRoute>} />
        <Route path={ROUTES.ORDER_SUCCESS} element={<RoleRoute allowedRoles={['user']}><OrderSuccessScreen /></RoleRoute>} />
        <Route path={ROUTES.ORDER_TRACKING} element={<RoleRoute allowedRoles={['user']}><OrderTrackingScreen /></RoleRoute>} />
        <Route path={ROUTES.ORDERS} element={<RoleRoute allowedRoles={['user']}><OrdersScreen /></RoleRoute>} />
        <Route path={ROUTES.GROUP_ORDER} element={<RoleRoute allowedRoles={['user']}><GroupOrderScreen /></RoleRoute>} />
        <Route path={ROUTES.OFFERS} element={<RoleRoute allowedRoles={['user']}><OffersScreen /></RoleRoute>} />
        <Route path={ROUTES.PROFILE} element={<RoleRoute allowedRoles={['user']}><ProfileScreen /></RoleRoute>} />

        {/* ─── 404 Catch-all ────────────────────────── */}
        <Route path="*" element={<NotFoundScreen />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
