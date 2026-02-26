import { Navigate, Outlet, useLocation } from "react-router";
import { auth } from "@/lib/auth";

export function ProtectedRoute() {
  const location = useLocation();
  const isAuthenticated = auth.isAuthenticated();

  if (!isAuthenticated) {
    // Save the current URL to session storage so we can redirect back after login
    // Don't save if it's already the login page
    if (location.pathname !== "/login" && location.pathname !== "/") {
      sessionStorage.setItem("post_login_redirect", location.pathname + location.search + location.hash);
    }
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
