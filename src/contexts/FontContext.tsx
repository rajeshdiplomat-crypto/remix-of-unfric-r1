import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type FontId = 'manrope' | 'plus-jakarta' | 'space-grotesk' | 'dm-sans';

export interface FontConfig {
  id: FontId;
  name: string;
  cssFamily: string;
  googleUrl: string;
}

export const FONTS: FontConfig[] = [
  {
    id: 'manrope',
    name: 'Manrope',
    cssFamily: "'Manrope', sans-serif",
    googleUrl: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap',
  },
  {
    id: 'plus-jakarta',
    name: 'Plus Jakarta Sans',
    cssFamily: "'Plus Jakarta Sans', sans-serif",
    googleUrl: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap',
  },
  {
    id: 'space-grotesk',
    name: 'Space Grotesk',
    cssFamily: "'Space Grotesk', sans-serif",
    googleUrl: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap',
  },
  {
    id: 'dm-sans',
    name: 'DM Sans',
    cssFamily: "'DM Sans', sans-serif",
    googleUrl: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap',
  },
];

interface FontContextValue {
  font: FontConfig;
  fontId: FontId;
  setFont: (fontId: FontId) => void;
}

const FontContext = createContext<FontContextValue | null>(null);

const STORAGE_KEY = 'mindflow-font';

export function FontProvider({ children }: { children: ReactNode }) {
  const [fontId, setFontId] = useState<FontId>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as FontId) || 'manrope';
  });

  const font = FONTS.find(f => f.id === fontId) || FONTS[0];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, fontId);
    applyFont(font);
  }, [fontId, font]);

  const setFont = (newFontId: FontId) => {
    setFontId(newFontId);
  };

  return (
    <FontContext.Provider value={{ font, fontId, setFont }}>
      {children}
    </FontContext.Provider>
  );
}

function applyFont(font: FontConfig) {
  // Load font if not already loaded
  const existingLink = document.querySelector(`link[href="${font.googleUrl}"]`);
  if (!existingLink) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = font.googleUrl;
    document.head.appendChild(link);
  }

  // Apply font to root
  document.documentElement.style.setProperty('--font-sans', font.cssFamily);
  document.body.style.fontFamily = font.cssFamily;
}

export function useFont() {
  const context = useContext(FontContext);
  if (!context) {
    throw new Error('useFont must be used within a FontProvider');
  }
  return context;
}
