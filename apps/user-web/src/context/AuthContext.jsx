import { createContext, useEffect, useMemo, useState } from "react";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    const token = localStorage.getItem("userToken");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (err) {
        localStorage.removeItem("userToken");
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      user,
      loading,
      login: (nextUser) => {
        setUser(nextUser);
        setIsAuthenticated(true);
        localStorage.setItem("user", JSON.stringify(nextUser));
      },
      logout: () => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem("userToken");
        localStorage.removeItem("user");
      },
    }),
    [isAuthenticated, user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
