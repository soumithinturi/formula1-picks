import { Navigate, Outlet } from "react-router";
import { auth } from "@/lib/auth";

/**
 * Protective route that only allows users with the 'ADMIN' role.
 * Redirects to home if the user is authenticated but not an admin.
 */
export function AdminRoute() {
  const user = auth.getUser();
  const isAdmin = user?.role === "ADMIN";

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
