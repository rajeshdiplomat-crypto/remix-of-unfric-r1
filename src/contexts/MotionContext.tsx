import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface MotionContextValue {
  motionEnabled: boolean;
  setMotionEnabled: (enabled: boolean) => void;
}

const MotionContext = createContext<MotionContextValue | null>(null);

const STORAGE_KEY = 'mindflow-motion';

export function MotionProvider({ children }: { children: ReactNode }) {
  const [motionEnabled, setMotionState] = useState<boolean>(() => {
    // Check system preference first
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return false;
    
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? false : stored === 'true';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(motionEnabled));
    
    // Apply motion class to document
    if (motionEnabled) {
      document.documentElement.classList.add('motion-enabled');
    } else {
      document.documentElement.classList.remove('motion-enabled');
    }
  }, [motionEnabled]);

  useEffect(() => {
    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setMotionState(false);
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const setMotionEnabled = (enabled: boolean) => {
    setMotionState(enabled);
  };

  return (
    <MotionContext.Provider value={{ motionEnabled, setMotionEnabled }}>
      {children}
    </MotionContext.Provider>
  );
}

export function useMotion() {
  const context = useContext(MotionContext);
  if (!context) {
    throw new Error('useMotion must be used within a MotionProvider');
  }
  return context;
}
