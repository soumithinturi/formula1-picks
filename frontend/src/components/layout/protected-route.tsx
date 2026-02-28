import { Navigate, Outlet, useLocation } from "react-router";
import { auth } from "@/lib/auth";

export function ProtectedRoute() {
  const location = useLocation();
  const user = auth.getUser();
  const isAuthenticated = !!user;
  const hasProfile = !!user?.display_name;

  if (!isAuthenticated || !hasProfile) {
    // Save the current URL to session storage so we can redirect back after login
    // Don't save if it's already the login page, or if it's an auth callback fragment
    const isAuthCallback =
      location.pathname.includes("access_token") ||
      location.pathname.includes("type=magiclink") ||
      location.pathname.includes("type=recovery") ||
      location.pathname.includes("type=signup");

    if (location.pathname !== "/login" && location.pathname !== "/" && !isAuthCallback) {
      sessionStorage.setItem("post_login_redirect", location.pathname + location.search + location.hash);
    }
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
