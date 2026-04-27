import { Navigate, Outlet } from "react-router-dom";

export default function AdminProtectedRoute() {
  const isAuthenticated = !!localStorage.getItem("adminToken");
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
