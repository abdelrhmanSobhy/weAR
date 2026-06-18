import { Navigate, useLocation } from "react-router-dom";
import {
  getHomePathForRole,
  selectHasHydrated,
  selectIsAuthenticated,
  selectRole,
  type UserRole,
  useAuthStore,
} from "@/features/auth/useAuthStore";
import { getLoginPathForRole } from "@/lib/axios";

type Props = {
  role: UserRole;
  children: React.ReactNode;
};

export function RequireRole({ role: requiredRole, children }: Props) {
  const location = useLocation();
  const hasHydrated = useAuthStore(selectHasHydrated);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const role = useAuthStore(selectRole);

  if (!hasHydrated) return null;

  if (!isAuthenticated) {
    return <Navigate to={getLoginPathForRole(requiredRole)} replace state={{ from: location }} />;
  }

  if (!role || role !== requiredRole) {
    return <Navigate to={role ? getHomePathForRole(role) : getLoginPathForRole(requiredRole)} replace />;
  }

  return <>{children}</>;
}
