import { createContext, useContext, ReactNode } from "react";

interface CustomThemeContextValue {
  customColors: null;
  setCustomColors: (colors: null) => void;
  isCustomTheme: boolean;
}

const CustomThemeContext = createContext<CustomThemeContextValue | null>(null);

export function CustomThemeProvider({ children }: { children: ReactNode }) {
  return (
    <CustomThemeContext.Provider
      value={{
        customColors: null,
        setCustomColors: () => {},
        isCustomTheme: false,
      }}
    >
      {children}
    </CustomThemeContext.Provider>
  );
}

export function useCustomTheme() {
  const context = useContext(CustomThemeContext);
  if (!context) {
    throw new Error("useCustomTheme must be used within a CustomThemeProvider");
  }
  return context;
}
