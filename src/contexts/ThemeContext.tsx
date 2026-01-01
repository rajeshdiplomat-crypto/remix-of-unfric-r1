import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ThemeId = 'calm-blue' | 'forest-green' | 'sunset-coral' | 'royal-purple' | 'warm-sand' | 'midnight-dark';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
  isDark: boolean;
  colors: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    destructive: string;
    destructiveForeground: string;
    border: string;
    input: string;
    ring: string;
    chart1: string;
    chart2: string;
    chart3: string;
    chart4: string;
    chart5: string;
    success: string;
    warning: string;
  };
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'calm-blue',
    name: 'Calm Blue',
    description: 'Default calming blue theme',
    isDark: false,
    colors: {
      background: '209 40% 96%',
      foreground: '222 47% 11%',
      card: '210 40% 98%',
      cardForeground: '222 47% 11%',
      popover: '214 31% 91%',
      popoverForeground: '222 47% 11%',
      primary: '200 98% 39%',
      primaryForeground: '204 100% 97%',
      secondary: '215 24% 26%',
      secondaryForeground: '210 40% 98%',
      muted: '215 20% 65%',
      mutedForeground: '222 47% 11%',
      accent: '210 40% 98%',
      accentForeground: '215 19% 34%',
      destructive: '0 72% 50%',
      destructiveForeground: '0 85% 97%',
      border: '212 26% 83%',
      input: '212 26% 83%',
      ring: '200 98% 39%',
      chart1: '198 93% 59%',
      chart2: '213 93% 67%',
      chart3: '215 20% 65%',
      chart4: '215 16% 46%',
      chart5: '215 19% 34%',
      success: '142 76% 36%',
      warning: '38 92% 50%',
    },
  },
  {
    id: 'forest-green',
    name: 'Forest Green',
    description: 'Nature-inspired green tones',
    isDark: false,
    colors: {
      background: '138 20% 95%',
      foreground: '150 40% 10%',
      card: '140 25% 97%',
      cardForeground: '150 40% 10%',
      popover: '138 20% 90%',
      popoverForeground: '150 40% 10%',
      primary: '142 70% 35%',
      primaryForeground: '140 80% 97%',
      secondary: '150 25% 25%',
      secondaryForeground: '140 25% 97%',
      muted: '140 15% 60%',
      mutedForeground: '150 40% 15%',
      accent: '140 25% 97%',
      accentForeground: '150 25% 30%',
      destructive: '0 72% 50%',
      destructiveForeground: '0 85% 97%',
      border: '140 20% 80%',
      input: '140 20% 80%',
      ring: '142 70% 35%',
      chart1: '142 70% 45%',
      chart2: '160 60% 50%',
      chart3: '140 15% 60%',
      chart4: '150 20% 45%',
      chart5: '150 25% 30%',
      success: '142 76% 36%',
      warning: '38 92% 50%',
    },
  },
  {
    id: 'sunset-coral',
    name: 'Sunset Coral',
    description: 'Warm coral and orange tones',
    isDark: false,
    colors: {
      background: '25 40% 96%',
      foreground: '20 45% 12%',
      card: '30 45% 98%',
      cardForeground: '20 45% 12%',
      popover: '25 35% 90%',
      popoverForeground: '20 45% 12%',
      primary: '16 80% 55%',
      primaryForeground: '30 100% 97%',
      secondary: '20 30% 28%',
      secondaryForeground: '30 45% 97%',
      muted: '25 20% 62%',
      mutedForeground: '20 45% 15%',
      accent: '30 45% 97%',
      accentForeground: '20 30% 32%',
      destructive: '0 72% 50%',
      destructiveForeground: '0 85% 97%',
      border: '25 25% 82%',
      input: '25 25% 82%',
      ring: '16 80% 55%',
      chart1: '16 85% 60%',
      chart2: '30 80% 55%',
      chart3: '25 20% 62%',
      chart4: '20 25% 48%',
      chart5: '20 30% 35%',
      success: '142 76% 36%',
      warning: '38 92% 50%',
    },
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    description: 'Elegant purple palette',
    isDark: false,
    colors: {
      background: '270 30% 96%',
      foreground: '280 45% 12%',
      card: '275 35% 98%',
      cardForeground: '280 45% 12%',
      popover: '270 25% 90%',
      popoverForeground: '280 45% 12%',
      primary: '265 70% 52%',
      primaryForeground: '275 100% 98%',
      secondary: '280 28% 28%',
      secondaryForeground: '275 35% 97%',
      muted: '270 18% 62%',
      mutedForeground: '280 45% 15%',
      accent: '275 35% 97%',
      accentForeground: '280 28% 32%',
      destructive: '0 72% 50%',
      destructiveForeground: '0 85% 97%',
      border: '270 22% 82%',
      input: '270 22% 82%',
      ring: '265 70% 52%',
      chart1: '265 75% 58%',
      chart2: '285 70% 55%',
      chart3: '270 18% 62%',
      chart4: '275 22% 48%',
      chart5: '280 28% 35%',
      success: '142 76% 36%',
      warning: '38 92% 50%',
    },
  },
  {
    id: 'warm-sand',
    name: 'Warm Sand',
    description: 'Earthy neutral tones',
    isDark: false,
    colors: {
      background: '40 25% 95%',
      foreground: '35 35% 15%',
      card: '42 30% 97%',
      cardForeground: '35 35% 15%',
      popover: '40 22% 90%',
      popoverForeground: '35 35% 15%',
      primary: '35 65% 45%',
      primaryForeground: '42 80% 97%',
      secondary: '35 22% 30%',
      secondaryForeground: '42 30% 96%',
      muted: '38 18% 60%',
      mutedForeground: '35 35% 18%',
      accent: '42 30% 96%',
      accentForeground: '35 22% 34%',
      destructive: '0 72% 50%',
      destructiveForeground: '0 85% 97%',
      border: '38 20% 80%',
      input: '38 20% 80%',
      ring: '35 65% 45%',
      chart1: '35 70% 52%',
      chart2: '50 65% 50%',
      chart3: '38 18% 60%',
      chart4: '35 20% 48%',
      chart5: '35 22% 36%',
      success: '142 76% 36%',
      warning: '38 92% 50%',
    },
  },
  {
    id: 'midnight-dark',
    name: 'Midnight Dark',
    description: 'Dark mode for night owls',
    isDark: true,
    colors: {
      background: '222 47% 11%',
      foreground: '210 40% 98%',
      card: '217 32% 17%',
      cardForeground: '210 40% 98%',
      popover: '215 24% 26%',
      popoverForeground: '210 40% 98%',
      primary: '198 93% 59%',
      primaryForeground: '204 80% 15%',
      secondary: '212 26% 83%',
      secondaryForeground: '228 84% 4%',
      muted: '215 16% 46%',
      mutedForeground: '210 40% 98%',
      accent: '228 84% 4%',
      accentForeground: '215 20% 65%',
      destructive: '0 84% 60%',
      destructiveForeground: '0 85% 97%',
      border: '215 19% 34%',
      input: '215 19% 34%',
      ring: '198 93% 59%',
      chart1: '199 95% 73%',
      chart2: '211 96% 78%',
      chart3: '215 20% 65%',
      chart4: '215 16% 46%',
      chart5: '215 19% 34%',
      success: '142 70% 45%',
      warning: '38 92% 50%',
    },
  },
];

interface ThemeContextValue {
  theme: ThemeConfig;
  themeId: ThemeId;
  setTheme: (themeId: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'inbalance-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as ThemeId) || 'calm-blue';
  });

  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, themeId);
    applyTheme(theme);
  }, [themeId, theme]);

  const setTheme = (newThemeId: ThemeId) => {
    setThemeId(newThemeId);
  };

  return (
    <ThemeContext.Provider value={{ theme, themeId, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function applyTheme(theme: ThemeConfig) {
  const root = document.documentElement;
  
  // Apply dark class if needed
  if (theme.isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Apply CSS variables
  root.style.setProperty('--background', theme.colors.background);
  root.style.setProperty('--foreground', theme.colors.foreground);
  root.style.setProperty('--card', theme.colors.card);
  root.style.setProperty('--card-foreground', theme.colors.cardForeground);
  root.style.setProperty('--popover', theme.colors.popover);
  root.style.setProperty('--popover-foreground', theme.colors.popoverForeground);
  root.style.setProperty('--primary', theme.colors.primary);
  root.style.setProperty('--primary-foreground', theme.colors.primaryForeground);
  root.style.setProperty('--secondary', theme.colors.secondary);
  root.style.setProperty('--secondary-foreground', theme.colors.secondaryForeground);
  root.style.setProperty('--muted', theme.colors.muted);
  root.style.setProperty('--muted-foreground', theme.colors.mutedForeground);
  root.style.setProperty('--accent', theme.colors.accent);
  root.style.setProperty('--accent-foreground', theme.colors.accentForeground);
  root.style.setProperty('--destructive', theme.colors.destructive);
  root.style.setProperty('--destructive-foreground', theme.colors.destructiveForeground);
  root.style.setProperty('--border', theme.colors.border);
  root.style.setProperty('--input', theme.colors.input);
  root.style.setProperty('--ring', theme.colors.ring);
  root.style.setProperty('--chart-1', theme.colors.chart1);
  root.style.setProperty('--chart-2', theme.colors.chart2);
  root.style.setProperty('--chart-3', theme.colors.chart3);
  root.style.setProperty('--chart-4', theme.colors.chart4);
  root.style.setProperty('--chart-5', theme.colors.chart5);
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
