import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface CustomColors {
  background: string;
  card: string;
}

interface CustomThemeContextValue {
  customColors: CustomColors | null;
  setCustomColors: (colors: CustomColors | null) => void;
  isCustomTheme: boolean;
}

const CustomThemeContext = createContext<CustomThemeContextValue | null>(null);

const STORAGE_KEY = "unfric-custom-theme";

const DEFAULT_COLORS: CustomColors = {
  background: "#F0F4F8",
  card: "#FAFBFC",
};

// Convert HEX to HSL
function hexToHsl(hex: string): string {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }

  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyCustomColors(colors: CustomColors) {
  const root = document.documentElement;
  root.style.setProperty("--background", hexToHsl(colors.background));
  root.style.setProperty("--card", hexToHsl(colors.card));
}

export function CustomThemeProvider({ children }: { children: ReactNode }) {
  const [customColors, setCustomColorsState] = useState<CustomColors | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (customColors) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customColors));
      applyCustomColors(customColors);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [customColors]);

  const setCustomColors = (colors: CustomColors | null) => {
    setCustomColorsState(colors);
    if (!colors) {
      const root = document.documentElement;
      root.style.removeProperty("--background");
      root.style.removeProperty("--card");
    }
  };

  return (
    <CustomThemeContext.Provider
      value={{
        customColors,
        setCustomColors,
        isCustomTheme: customColors !== null,
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

export { DEFAULT_COLORS };
