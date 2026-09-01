import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/constants/routes.constant";
import type { Role } from "@/constants/roles.constant";

interface RoleBasedRouteProps {
  allowedRoles: Role[];
}

/**
 * RoleBasedRoute - Sirf specific role(s) ko access allow karta hai.
 * Ye ProtectedRoute ke ANDAR nest hoga - matlab pehle login check, phir role check.
 *
 * Example: Settings page sirf Super Admin dekh sakta hai ->
 *   <Route element={<RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]} />}>
 *     <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
 *   </Route>
 */
export function RoleBasedRoute({ allowedRoles }: RoleBasedRouteProps) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }

  return <Outlet />;
}
