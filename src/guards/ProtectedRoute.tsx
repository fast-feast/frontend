import { Navigate } from 'react-router-dom';
import { useApp } from '@/hooks/useAppContext';
import { ROUTES } from '@/routes/paths';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/** Renders children only if the user is authenticated; otherwise redirects to role selection. */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { state } = useApp();

  if (!state.isLoggedIn) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <>{children}</>;
}

/** Renders children only if the user is NOT authenticated; otherwise redirects to home. */
export function PublicRoute({ children }: ProtectedRouteProps) {
  const { state } = useApp();

  if (state.isLoggedIn) {
    // Redirect to role-appropriate dashboard
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

  if (!state.isLoggedIn) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (!allowedRoles.includes(state.user.role as any)) {
    // Redirect to home if role doesn't match
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <>{children}</>;
}
