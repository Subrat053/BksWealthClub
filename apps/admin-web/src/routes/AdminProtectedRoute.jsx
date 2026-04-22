import { Navigate, Outlet } from "react-router-dom";

const isAuthenticated = true;

export default function AdminProtectedRoute() {
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
