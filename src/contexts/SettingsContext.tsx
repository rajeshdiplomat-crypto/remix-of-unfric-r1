import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Single source of truth for all user-level settings and preferences.
 * Fetches from 'manage-settings' Edge function and syncs via Postgres Realtime.
 */

export interface UserSettings {
    timezone: string;
    date_format: string;
    start_of_week: string;
    default_home_screen: string;
    daily_reset_time: string;
    notification_diary_prompt: boolean;
    notification_emotion_checkin: boolean;
    notification_task_reminder: boolean;
    privacy_blur_sensitive: boolean;
    privacy_passcode_enabled: boolean;
    note_skin_preference: string;
    default_task_tab: string;
    default_task_view: string;
    default_notes_view: string;
    default_emotions_tab: string;
    journal_mode: string;
    time_format: string;
    reminder_time_diary: string;
    reminder_time_habits: string;
    reminder_time_emotions: string;
    // Visual/Theme Preference fields
    theme_id: string;
    font_pair_id: string;
    custom_theme_colors: Record<string, string> | null;
    motion_enabled: boolean;
    focus_settings: Record<string, any> | null;
    clock_widget_mode: string;
    journal_template: Record<string, any> | null;
    manifest_viz_settings: Record<string, any> | null;
}

const DEFAULT_SETTINGS: UserSettings = {
    timezone: "UTC",
    date_format: "MM/DD",
    start_of_week: "monday",
    default_home_screen: "diary",
    daily_reset_time: "08:00",
    notification_diary_prompt: true,
    notification_emotion_checkin: true,
    notification_task_reminder: true,
    privacy_blur_sensitive: false,
    privacy_passcode_enabled: false,
    note_skin_preference: "default",
    default_task_tab: "board",
    default_task_view: "status",
    default_notes_view: "list",
    default_emotions_tab: "feel",
    journal_mode: "structured",
    time_format: "24h",
    reminder_time_diary: "08:00",
    reminder_time_habits: "08:00",
    reminder_time_emotions: "08:00",
    // Visuals
    theme_id: "calm-blue",
    font_pair_id: "elegant",
    custom_theme_colors: null,
    motion_enabled: true,
    focus_settings: null,
    clock_widget_mode: "digital",
    journal_template: null,
    manifest_viz_settings: null,
};

const SETTINGS_CACHE_KEY = "unfric_unified_settings_cache";

interface SettingsContextType {
    settings: UserSettings;
    loaded: boolean;
    updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
    refresh: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [settings, setSettings] = useState<UserSettings>(() => {
        try {
            const cached = localStorage.getItem(SETTINGS_CACHE_KEY);
            return cached ? { ...DEFAULT_SETTINGS, ...JSON.parse(cached) } : DEFAULT_SETTINGS;
        } catch {
            return DEFAULT_SETTINGS;
        }
    });
    const [loaded, setLoaded] = useState(false);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

    const fetchSettings = useCallback(async () => {
        if (!user) {
            setLoaded(true);
            return;
        }

        try {
            const { data: res, error } = await supabase.functions.invoke("manage-settings", {
                body: { action: "fetch_settings" }
            });

            if (error) throw error;
            const data = res?.data;

            if (data) {
                const merged = { ...DEFAULT_SETTINGS, ...data };
                setSettings(merged);
                localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(merged));
            }
        } catch (err) {
            console.error("[SettingsContext] Failed to fetch settings:", err);
        } finally {
            setLoaded(true);
        }
    }, [user]);

    // Initial fetch and Realtime setup
    useEffect(() => {
        fetchSettings();

        if (!user) return;

        const channel = supabase
            .channel("settings-realtime-sync")
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "user_settings",
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    const updated = { ...settings, ...payload.new };
                    setSettings(updated);
                    localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(updated));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, fetchSettings]);

    // Unified update function
    const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
        // 1. Instant optimistic update
        setSettings((prev) => {
            const next = { ...prev, ...updates };
            localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(next));
            return next;
        });

        // 2. Debounced DB write
        if (!user) return;

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(async () => {
            try {
                const { error } = await supabase.functions.invoke("manage-settings", {
                    body: { action: "update_settings", updates }
                });
                if (error) throw error;
            } catch (err) {
                console.error("[SettingsContext] Failed to update DB settings:", err);
            }
        }, 500);
    }, [user]);

    return (
        <SettingsContext.Provider value={{ settings, loaded, updateSettings, refresh: fetchSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
};
