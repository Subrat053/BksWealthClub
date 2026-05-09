import { createContext, useState, useEffect, useCallback } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth on mount
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const adminData = localStorage.getItem("adminUser");

    if (token && adminData) {
      try {
        const parsed = JSON.parse(adminData);
        setAdmin(parsed);
        setIsAuthenticated(true);
      } catch (err) {
        console.error("Failed to parse admin data:", err);
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        setIsAuthenticated(false);
      }
    }

    setLoading(false);
  }, []);

  // Listen for storage changes (e.g., logout from another tab or axios interceptor)
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem("adminToken");
      const adminData = localStorage.getItem("adminUser");

      if (!token) {
        setAdmin(null);
        setIsAuthenticated(false);
      } else if (token && adminData) {
        try {
          const parsed = JSON.parse(adminData);
          setAdmin(parsed);
          setIsAuthenticated(true);
        } catch (err) {
          setIsAuthenticated(false);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = useCallback((token, adminData) => {
    localStorage.setItem("adminToken", token);
    localStorage.setItem("adminUser", JSON.stringify(adminData));
    setAdmin(adminData);
    setIsAuthenticated(true);
    setError(null);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    setAdmin(null);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  const value = {
    isAuthenticated,
    admin,
    loading,
    error,
    login,
    logout,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
