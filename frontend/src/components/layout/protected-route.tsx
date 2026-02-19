import { Navigate, Outlet } from "react-router";
import { auth } from "@/lib/auth";

export function ProtectedRoute() {
  const isAuthenticated = auth.isAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
