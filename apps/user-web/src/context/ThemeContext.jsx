import { createContext, useMemo } from "react";
import { themeTokens } from "../utils/themeTokens";

export const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const value = useMemo(() => ({ themeTokens }), []);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
