import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface CustomColors {
  background: string;
  card: string;
  foreground: string;
  mutedForeground: string;
  primary: string;
  border: string;
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
  foreground: "#1A202C",
  mutedForeground: "#718096",
  primary: "#3B82F6",
  border: "#E2E8F0",
};

// Convert HEX to HSL
function hexToHsl(hex: string): string {
  let r = 0,
    g = 0,
    b = 0;
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
  let h = 0,
    s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Calculate contrast ratio
function getContrastRatio(hex1: string, hex2: string): number {
  const getLuminance = (hex: string) => {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;

    r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function checkContrast(colors: CustomColors): { hasIssue: boolean; message: string } {
  const textOnBg = getContrastRatio(colors.foreground, colors.background);
  const textOnCard = getContrastRatio(colors.foreground, colors.card);

  if (textOnBg < 4.5 || textOnCard < 4.5) {
    return { hasIssue: true, message: "Text contrast is too low for readability" };
  }
  return { hasIssue: false, message: "" };
}

export function autoFixContrast(colors: CustomColors): CustomColors {
  // Simple fix: if foreground is dark, make bg lighter; if foreground is light, make bg darker
  const fgLuminance =
    parseInt(colors.foreground.slice(1, 3), 16) +
    parseInt(colors.foreground.slice(3, 5), 16) +
    parseInt(colors.foreground.slice(5, 7), 16);

  if (fgLuminance < 382) {
    // Dark text, need lighter background
    return { ...colors, background: "#F8FAFC", card: "#FFFFFF" };
  } else {
    // Light text, need darker background
    return { ...colors, background: "#1A1A2E", card: "#252540" };
  }
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
      // Reset to theme defaults by removing overrides
      const root = document.documentElement;
      root.style.removeProperty("--background");
      root.style.removeProperty("--card");
      root.style.removeProperty("--foreground");
      root.style.removeProperty("--muted-foreground");
      root.style.removeProperty("--primary");
      root.style.removeProperty("--border");
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

function applyCustomColors(colors: CustomColors) {
  const root = document.documentElement;

  root.style.setProperty("--background", hexToHsl(colors.background));
  root.style.setProperty("--card", hexToHsl(colors.card));
  root.style.setProperty("--foreground", hexToHsl(colors.foreground));
  root.style.setProperty("--card-foreground", hexToHsl(colors.foreground));
  root.style.setProperty("--muted-foreground", hexToHsl(colors.mutedForeground));
  root.style.setProperty("--primary", hexToHsl(colors.primary));
  root.style.setProperty("--border", hexToHsl(colors.border));
  root.style.setProperty("--input", hexToHsl(colors.border));
  root.style.setProperty("--ring", hexToHsl(colors.primary));
}

export function useCustomTheme() {
  const context = useContext(CustomThemeContext);
  if (!context) {
    throw new Error("useCustomTheme must be used within a CustomThemeProvider");
  }
  return context;
}

export { DEFAULT_COLORS };
