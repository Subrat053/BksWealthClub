import { createContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/auth.service";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    const token = localStorage.getItem("userToken");
    const storedUser = localStorage.getItem("user");

    const syncProfile = async (fallbackUser) => {
      try {
        const response = await authService.getProfile();
        const nextUser = {
          ...fallbackUser,
          ...response.data?.user,
        };
        setUser(nextUser);
        setIsAuthenticated(true);
        localStorage.setItem("user", JSON.stringify(nextUser));
      } catch (err) {
        if (!fallbackUser) {
          localStorage.removeItem("userToken");
          localStorage.removeItem("user");
        }
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      let parsedUser = null;
      if (storedUser) {
        try {
          parsedUser = JSON.parse(storedUser);
        } catch (err) {
          localStorage.removeItem("user");
        }
      }

      if (parsedUser) {
        setUser(parsedUser);
        setIsAuthenticated(true);
      }

      syncProfile(parsedUser);
      return;
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
