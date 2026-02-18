import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useUserPreferences } from "@/hooks/useUserSettings";

interface MotionContextValue {
  motionEnabled: boolean;
  setMotionEnabled: (enabled: boolean) => void;
}

const MotionContext = createContext<MotionContextValue | null>(null);

const STORAGE_KEY = "unfric-motion";

export function MotionProvider({ children }: { children: ReactNode }) {
  const { prefs, updatePrefs } = useUserPreferences();
  const [motionEnabled, setMotionState] = useState<boolean>(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return false;

    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? false : stored === "true";
  });

  // Sync from DB when prefs load
  useEffect(() => {
    if (prefs.motion_enabled !== undefined && prefs.motion_enabled !== motionEnabled) {
      setMotionState(prefs.motion_enabled);
    }
  }, [prefs.motion_enabled]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(motionEnabled));

    if (motionEnabled) {
      document.documentElement.classList.add("motion-enabled");
    } else {
      document.documentElement.classList.remove("motion-enabled");
    }
  }, [motionEnabled]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setMotionState(false);
      }
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const setMotionEnabled = (enabled: boolean) => {
    setMotionState(enabled);
    updatePrefs({ motion_enabled: enabled });
  };

  return <MotionContext.Provider value={{ motionEnabled, setMotionEnabled }}>{children}</MotionContext.Provider>;
}

export function useMotion() {
  const context = useContext(MotionContext);
  if (!context) {
    throw new Error("useMotion must be used within a MotionProvider");
  }
  return context;
}
