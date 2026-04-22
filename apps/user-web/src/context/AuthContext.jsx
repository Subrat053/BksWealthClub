import { createContext, useMemo, useState } from "react";

export const AuthContext = createContext(null);

const defaultUser = {
  id: "u_001",
  memberId: "GRW328370",
  username: "GRW328370",
  displayName: "Demo Member",
  status: "Inactive",
  avatarUrl: "",
  role: "member",
};

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [user, setUser] = useState(defaultUser);

  const value = useMemo(
    () => ({
      isAuthenticated,
      user,
      login: (nextUser = defaultUser) => {
        setUser(nextUser);
        setIsAuthenticated(true);
      },
      logout: () => {
        setUser(null);
        setIsAuthenticated(false);
      },
    }),
    [isAuthenticated, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
