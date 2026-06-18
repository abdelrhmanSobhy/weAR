import { Navigate, useLocation } from "react-router-dom";
import {
  selectHasHydrated,
  selectIsAuthenticated,
  useAuthStore,
} from "@/features/auth/useAuthStore";

type Props = { children: React.ReactNode };

export function RequireAuth({ children }: Props) {
  const location = useLocation();
  const hasHydrated = useAuthStore(selectHasHydrated);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  if (!hasHydrated) return null;

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
/**
 * TODO(BE):
 * - When backend is integrated, we may also verify session validity via /auth/me
 *   and logout the user if token/session is invalid.
 */
