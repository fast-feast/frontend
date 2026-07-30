import { Navigate } from 'react-router-dom';
import { useApp } from '@/hooks/useAppContext';
import { ROUTES } from '@/routes/paths';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/** Minimal loading spinner shown while auth state is being restored. */
function AuthLoadingSpinner() {
  return (
    <div className="screen-surface h-full flex flex-col items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-[#FF6B35] border-t-transparent animate-spin" />
      <p className="text-xs text-[#6B6B6B] mt-3">Checking authentication...</p>
    </div>
  );
}

/** Renders children only if the user is authenticated; otherwise redirects to the student login. */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { state } = useApp();

  if (state.isAuthLoading) {
    return <AuthLoadingSpinner />;
  }

  if (!state.isLoggedIn) {
    return <Navigate to={ROUTES.LOGIN} replace />;
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
  allowedRoles: Array<'user' | 'canteen_owner' | 'admin'>;
}

/** Renders children only if the user has one of the allowed roles. */
export function RoleRoute({ children, allowedRoles }: RoleRouteProps) {
  const { state } = useApp();

  if (state.isAuthLoading) {
    return <AuthLoadingSpinner />;
  }

  if (!state.isLoggedIn) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (!allowedRoles.includes(state.user.role as any)) {
    return <Navigate to={state.user.role === 'canteen_owner' ? ROUTES.CANTEEN_DASHBOARD : ROUTES.HOME} replace />;
  }

  return <>{children}</>;
}
