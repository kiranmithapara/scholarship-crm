import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/constants/routes.constant";
import { PageLoader } from "@/components/common/PageLoader";

/**
 * ProtectedRoute - Login required.
 * Not logged in -> redirect to /login, aur jahan se aaya tha wo location save kar deta hai
 * taaki login ke baad wapas wahi page pe bhej sake.
 */
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <PageLoader />;

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return <Outlet />;
}
