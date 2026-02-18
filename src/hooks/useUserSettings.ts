import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Central hook for syncing user settings between localStorage (instant) and database (persistent).
 * Uses localStorage as fast cache, DB as source of truth.
 * On login: loads from DB → writes to localStorage.
 * On change: writes to both localStorage and DB.
 */

export interface UserPreferences {
  theme_id?: string;
  font_pair_id?: string;
  custom_theme_colors?: Record<string, string> | null;
  motion_enabled?: boolean;
  focus_settings?: Record<string, any> | null;
  clock_widget_mode?: string;
  journal_template?: Record<string, any> | null;
  manifest_viz_settings?: Record<string, any> | null;
}

const PREFS_CACHE_KEY = "unfric-user-prefs-cache";

let globalPrefs: UserPreferences | null = null;
let globalListeners: Set<() => void> = new Set();

function notifyListeners() {
  globalListeners.forEach((fn) => fn());
}

// Load cached prefs from localStorage (instant, before DB)
function loadCachedPrefs(): UserPreferences {
  try {
    const cached = localStorage.getItem(PREFS_CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch {}
  // Fall back to legacy keys
  return {
    theme_id: localStorage.getItem("unfric-theme") || "calm-blue",
    font_pair_id: localStorage.getItem("unfric-font-pair") || "elegant",
    custom_theme_colors: (() => {
      try {
        const v = localStorage.getItem("unfric-custom-theme");
        return v ? JSON.parse(v) : null;
      } catch { return null; }
    })(),
    motion_enabled: localStorage.getItem("unfric-motion") === "true",
    focus_settings: (() => {
      try {
        const v = localStorage.getItem("luxuryfocus-settings");
        return v ? JSON.parse(v) : null;
      } catch { return null; }
    })(),
    clock_widget_mode: localStorage.getItem("unfric-clock-widget-mode") || "digital",
    journal_template: (() => {
      try {
        const v = localStorage.getItem("journal_template");
        return v ? JSON.parse(v) : null;
      } catch { return null; }
    })(),
  };
}

function saveCachedPrefs(prefs: UserPreferences) {
  try {
    localStorage.setItem(PREFS_CACHE_KEY, JSON.stringify(prefs));
  } catch {}
}

export function useUserPreferences() {
  const [prefs, setPrefs] = useState<UserPreferences>(() => {
    if (globalPrefs) return globalPrefs;
    globalPrefs = loadCachedPrefs();
    return globalPrefs;
  });
  const [loaded, setLoaded] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Subscribe to global changes
  useEffect(() => {
    const listener = () => {
      if (globalPrefs) setPrefs({ ...globalPrefs });
    };
    globalListeners.add(listener);
    return () => { globalListeners.delete(listener); };
  }, []);

  // Load from DB on mount
  useEffect(() => {
    let cancelled = false;
    const loadFromDb = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) { setLoaded(true); return; }

      const { data } = await supabase
        .from("user_settings")
        .select("theme_id, font_pair_id, custom_theme_colors, motion_enabled, focus_settings, clock_widget_mode, journal_template, manifest_viz_settings")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data && !cancelled) {
        const dbPrefs: UserPreferences = {
          theme_id: (data as any).theme_id || prefs.theme_id,
          font_pair_id: (data as any).font_pair_id || prefs.font_pair_id,
          custom_theme_colors: (data as any).custom_theme_colors ?? prefs.custom_theme_colors,
          motion_enabled: (data as any).motion_enabled ?? prefs.motion_enabled,
          focus_settings: (data as any).focus_settings ?? prefs.focus_settings,
          clock_widget_mode: (data as any).clock_widget_mode || prefs.clock_widget_mode,
          journal_template: (data as any).journal_template ?? prefs.journal_template,
          manifest_viz_settings: (data as any).manifest_viz_settings ?? prefs.manifest_viz_settings,
        };
        globalPrefs = dbPrefs;
        saveCachedPrefs(dbPrefs);
        setPrefs(dbPrefs);
        notifyListeners();
      }
      setLoaded(true);
    };
    loadFromDb();
    return () => { cancelled = true; };
  }, []);

  const updatePrefs = useCallback(async (updates: Partial<UserPreferences>) => {
    const newPrefs = { ...globalPrefs, ...updates };
    globalPrefs = newPrefs;
    saveCachedPrefs(newPrefs);
    setPrefs(newPrefs);
    notifyListeners();

    // Debounced save to DB
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from("user_settings")
        .upsert({ user_id: user.id, ...updates }, { onConflict: "user_id" });
    }, 500);
  }, []);

  return { prefs, loaded, updatePrefs };
}
