import { useSettings, UserSettings } from "@/contexts/SettingsContext";

/**
 * Legacy wrapper hook for syncing user preferences.
 * Redirects to the unified SettingsContext.
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

export function useUserPreferences() {
  const { settings, loaded, updateSettings } = useSettings();

  // Convert settings context to the shape expected by legacy callers
  const prefs: UserPreferences = {
    theme_id: settings.theme_id,
    font_pair_id: settings.font_pair_id,
    custom_theme_colors: settings.custom_theme_colors,
    motion_enabled: settings.motion_enabled,
    focus_settings: settings.focus_settings,
    clock_widget_mode: settings.clock_widget_mode,
    journal_template: settings.journal_template,
    manifest_viz_settings: settings.manifest_viz_settings,
  };

  const updatePrefs = async (updates: Partial<UserPreferences>) => {
    // Cast updates to correct type for the unified context
    await updateSettings(updates as Partial<UserSettings>);
  };

  return { prefs, loaded, updatePrefs };
}
