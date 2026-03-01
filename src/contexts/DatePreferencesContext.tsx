import React, { createContext, useContext, useCallback, useMemo } from "react";
import { format as dateFnsFormat } from "date-fns";
import { useSettings } from "@/contexts/SettingsContext";

/**
 * Lightweight wrapper that provides date-formatting utilities 
 * based on unified SettingsContext.
 */

export type DateFormatType = "MM/DD" | "DD/MM" | "MM/DD/YYYY" | "DD/MM/YYYY";
export type WeekStartType = "sunday" | "monday";

interface DatePreferencesContextType {
    dateFormat: DateFormatType;
    weekStartsOn: 0 | 1;
    formatDate: (date: Date | number | string, pattern?: string) => string;
    loaded: boolean;
    refresh: () => Promise<void>;
}

const DatePreferencesContext = createContext<DatePreferencesContextType | undefined>(undefined);

function resolvePattern(key: string, isDayFirst: boolean): string {
    switch (key) {
        case "short":
            return isDayFirst ? "d MMM" : "MMM d";
        case "full":
            return isDayFirst ? "d MMM yyyy" : "MMM d, yyyy";
        case "weekday":
            return isDayFirst ? "EEE, d MMM" : "EEE, MMM d";
        case "weekdayFull":
            return isDayFirst ? "EEEE, d MMMM" : "EEEE, MMMM d";
        case "monthYear":
            return "MMM yyyy";
        case "dayMonth":
            return isDayFirst ? "d MMM" : "MMM d";
        default:
            return key;
    }
}

// NOTE: This provider can be nested under SettingsProvider in App.tsx or combined.
// For backwards compatibility, we keep it as a separate exported Provider.
export const DatePreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { settings, loaded, refresh } = useSettings();

    const dateFormat = (settings.date_format || "MM/DD") as DateFormatType;
    const weekStart = (settings.start_of_week || "monday") as WeekStartType;

    const weekStartsOn = useMemo<0 | 1>(() => (weekStart === "sunday" ? 0 : 1), [weekStart]);
    const isDayFirst = useMemo(() => dateFormat.startsWith("DD"), [dateFormat]);

    const formatDate = useCallback(
        (date: Date | number | string, pattern: string = "short") => {
            if (!date) return "";
            const d = typeof date === 'string' ? new Date(date) : date;
            const resolved = resolvePattern(pattern, isDayFirst);
            return dateFnsFormat(d, resolved);
        },
        [isDayFirst],
    );

    const value = useMemo(() => ({
        dateFormat,
        weekStartsOn,
        formatDate,
        loaded,
        refresh
    }), [dateFormat, weekStartsOn, formatDate, loaded, refresh]);

    return (
        <DatePreferencesContext.Provider value={value}>
            {children}
        </DatePreferencesContext.Provider>
    );
};

export const useDatePreferencesContext = () => {
    const context = useContext(DatePreferencesContext);
    if (context === undefined) {
        throw new Error("useDatePreferencesContext must be used within a DatePreferencesProvider");
    }
    return context;
};
