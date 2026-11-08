import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";
import type { UserRole } from "../types/auth";

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-screen">Loading...</div>;

  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}

export function RoleRoute({ allowedRoles }: { allowedRoles: UserRole[] }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return <Outlet />;
}

export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case "CUSTOMER":
      return "/customer";
    case "TECHNICIAN":
      return "/technician";
    case "ADMIN":
      return "/admin";
    default:
      return "/login";
  }
}
