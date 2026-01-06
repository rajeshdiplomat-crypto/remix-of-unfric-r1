import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type FontPairId = 'classic' | 'modern' | 'geometric' | 'elegant';

export interface FontPairConfig {
  id: FontPairId;
  name: string;
  description: string;
  headingFamily: string;
  bodyFamily: string;
  headingUrl: string;
  bodyUrl: string;
}

export const FONT_PAIRS: FontPairConfig[] = [
  {
    id: 'classic',
    name: 'Classic Elegance',
    description: 'Playfair Display + Inter',
    headingFamily: "'Playfair Display', Georgia, serif",
    bodyFamily: "'Inter', system-ui, sans-serif",
    headingUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap',
    bodyUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  },
  {
    id: 'modern',
    name: 'Modern Serif',
    description: 'Fraunces + Plus Jakarta Sans',
    headingFamily: "'Fraunces', Georgia, serif",
    bodyFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    headingUrl: 'https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600;700&display=swap',
    bodyUrl: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap',
  },
  {
    id: 'geometric',
    name: 'Geometric',
    description: 'Space Grotesk + Manrope',
    headingFamily: "'Space Grotesk', system-ui, sans-serif",
    bodyFamily: "'Manrope', system-ui, sans-serif",
    headingUrl: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap',
    bodyUrl: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap',
  },
  {
    id: 'elegant',
    name: 'Elegant Sans',
    description: 'DM Serif Display + DM Sans',
    headingFamily: "'DM Serif Display', Georgia, serif",
    bodyFamily: "'DM Sans', system-ui, sans-serif",
    headingUrl: 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:wght@400&display=swap',
    bodyUrl: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap',
  },
];

interface FontContextValue {
  fontPair: FontPairConfig;
  fontPairId: FontPairId;
  setFontPair: (id: FontPairId) => void;
}

const FontContext = createContext<FontContextValue | null>(null);

const STORAGE_KEY = 'ambalanced-font-pair';

// Track loaded fonts to avoid duplicates
const loadedFonts = new Set<string>();

function loadFont(url: string) {
  if (loadedFonts.has(url)) return;
  loadedFonts.add(url);
  
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
}

function applyFontPair(fontPair: FontPairConfig) {
  // Load fonts
  loadFont(fontPair.headingUrl);
  loadFont(fontPair.bodyUrl);
  
  const root = document.documentElement;
  root.style.setProperty('--font-heading', fontPair.headingFamily);
  root.style.setProperty('--font-body', fontPair.bodyFamily);
  root.style.setProperty('--font-sans', fontPair.bodyFamily);
  root.style.setProperty('--font-serif', fontPair.headingFamily);
  
  // Apply to body
  document.body.style.fontFamily = fontPair.bodyFamily;
}

export function FontProvider({ children }: { children: ReactNode }) {
  const [fontPairId, setFontPairId] = useState<FontPairId>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as FontPairId) || 'elegant';
  });

  const fontPair = FONT_PAIRS.find(f => f.id === fontPairId) || FONT_PAIRS[3];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, fontPairId);
    applyFontPair(fontPair);
  }, [fontPairId, fontPair]);

  const setFontPair = (id: FontPairId) => {
    setFontPairId(id);
  };

  return (
    <FontContext.Provider value={{ fontPair, fontPairId, setFontPair }}>
      {children}
    </FontContext.Provider>
  );
}

export function useFont() {
  const context = useContext(FontContext);
  if (!context) {
    throw new Error('useFont must be used within a FontProvider');
  }
  return context;
}
