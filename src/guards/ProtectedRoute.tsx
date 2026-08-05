import { Navigate } from 'react-router-dom';
import { useApp } from '@/hooks/useAppContext';
import { ROUTES } from '@/routes/paths';
import { LoadingAnimation } from '@/components/ui/loading-animation';

type UserRole = 'user' | 'canteen_owner' | 'admin';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Where unauthenticated users are sent. Defaults to the student login. */
  loginPath?: string;
}

/** Minimal loading spinner shown while auth state is being restored. */
function AuthLoadingSpinner() {
  return (
    <LoadingAnimation
      variant="fullscreen"
      message="Checking authentication..."
    />
  );
}

/** Renders children only if the user is authenticated; otherwise redirects to the configured login. */
export function ProtectedRoute({ children, loginPath = ROUTES.LOGIN }: ProtectedRouteProps) {
  const { state } = useApp();

  if (state.isAuthLoading) {
    return <AuthLoadingSpinner />;
  }

  if (!state.isLoggedIn) {
    return <Navigate to={loginPath} replace />;
  }

  return <>{children}</>;
}

/** Renders children only if the user is NOT authenticated; otherwise redirects to the correct dashboard. */
export function PublicRoute({ children }: ProtectedRouteProps) {
  const { state } = useApp();

  if (state.isAuthLoading) {
    return <AuthLoadingSpinner />;
  }

  if (state.isLoggedIn) {
    const role = state.user.role;
    if (role === 'admin') return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
    if (role === 'canteen_owner') return <Navigate to={ROUTES.CANTEEN_DASHBOARD} replace />;
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <>{children}</>;
}

interface RoleRouteProps extends ProtectedRouteProps {
  allowedRoles: UserRole[];
}

/**
 * Renders children only if the user has one of the allowed roles.
 * - Unauthenticated users are sent to the login screen of the app they entered.
 * - Logged-in users of the wrong role are sent back to their own dashboard.
 */
export function RoleRoute({ children, allowedRoles, loginPath = ROUTES.LOGIN }: RoleRouteProps) {
  const { state } = useApp();

  if (state.isAuthLoading) {
    return <AuthLoadingSpinner />;
  }

  if (!state.isLoggedIn) {
    return <Navigate to={loginPath} replace />;
  }

  const role: UserRole = state.user.role ?? 'user';

  if (!allowedRoles.includes(role)) {
    const home =
      role === 'admin' ? ROUTES.ADMIN_DASHBOARD
      : role === 'canteen_owner' ? ROUTES.CANTEEN_DASHBOARD
      : ROUTES.HOME;
    return <Navigate to={home} replace />;
  }

  return <>{children}</>;
}
