import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from './paths';
import { ProtectedRoute, PublicRoute, RoleRoute } from '@/guards/ProtectedRoute';


// ─── Lazy-loaded screens ───────────────────────────────

const SplashScreen = lazy(() => import('@/screens/SplashScreen'));
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
const NotFoundScreen = lazy(() => import('@/screens/NotFoundScreen'));

// ─── Loading Fallback ──────────────────────────────────

function RouteFallback() {
  return (
    <div className="screen-surface h-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF6B35] border-t-transparent animate-spin mx-auto" />
        <p className="text-xs text-[#6B6B6B] mt-2">Loading...</p>
      </div>
    </div>
  );
}

// ─── Route Configuration ───────────────────────────────

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* ─── Public / Pre-Auth Routes ───────────────── */}
        <Route path={ROUTES.SPLASH} element={<SplashScreen />} />
        <Route path={ROUTES.ONBOARDING} element={<OnboardingScreen />} />
        <Route path={ROUTES.LOGIN} element={<PublicRoute><LoginScreen /></PublicRoute>} />
        <Route path={ROUTES.LOGIN_CUSTOMER} element={<Navigate to={ROUTES.LOGIN} replace />} />
        <Route path={ROUTES.LOGIN_CANTEEN} element={<Navigate to={ROUTES.LOGIN} replace />} />
        <Route path={ROUTES.LOGIN_ADMIN} element={<Navigate to={ROUTES.LOGIN} replace />} />
        <Route path={ROUTES.ROLE_SELECTION} element={<Navigate to={ROUTES.LOGIN} replace />} />

        {/* ─── Customer Routes (authenticated) ──────────── */}
        <Route path={ROUTES.HOME} element={<ProtectedRoute><HomeScreen /></ProtectedRoute>} />
        <Route path={ROUTES.CANTEEN_DETAIL} element={<ProtectedRoute><CanteenDetailScreen /></ProtectedRoute>} />
        <Route path={ROUTES.CART} element={<ProtectedRoute><CartScreen /></ProtectedRoute>} />
        <Route path={ROUTES.PAYMENT} element={<ProtectedRoute><PaymentScreen /></ProtectedRoute>} />
        <Route path={ROUTES.ORDER_SUCCESS} element={<ProtectedRoute><OrderSuccessScreen /></ProtectedRoute>} />
        <Route path={ROUTES.ORDER_TRACKING} element={<ProtectedRoute><OrderTrackingScreen /></ProtectedRoute>} />
        <Route path={ROUTES.ORDERS} element={<ProtectedRoute><OrdersScreen /></ProtectedRoute>} />
        <Route path={ROUTES.GROUP_ORDER} element={<ProtectedRoute><GroupOrderScreen /></ProtectedRoute>} />
        <Route path={ROUTES.OFFERS} element={<ProtectedRoute><OffersScreen /></ProtectedRoute>} />
        <Route path={ROUTES.PROFILE} element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />

        {/* ─── Canteen Owner Routes ──────────────────── */}
        <Route
          path={ROUTES.CANTEEN_DASHBOARD}
          element={
            <RoleRoute allowedRoles={['canteen_owner', 'admin']}>
              <CanteenDashboardScreen />
            </RoleRoute>
          }
        />

        {/* ─── Admin Routes ─────────────────────────── */}
        <Route
          path={ROUTES.ADMIN_DASHBOARD}
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AdminScreen />
            </RoleRoute>
          }
        />

        {/* ─── 404 Catch-all ────────────────────────── */}
        <Route path="*" element={<NotFoundScreen />} />
      </Routes>
    </Suspense>
  );
}
