import {
    format,
    formatDistanceToNow,
    parseISO,
    startOfDay,
    addDays,
    isAfter,
    isBefore,
    getDay
} from "date-fns";
import { toZonedTime } from "date-fns-tz";

/**
 * ==========================================
 * TIMEZONE AWARE FORMATTING
 * ==========================================
 */

/**
 * Format a date string for display, accounting for timezone
 */
export function formatDateInTimezone(
    dateString: string,
    formatStr: string,
    timezone: string
): string {
    const date = parseISO(dateString);
    const zonedDate = toZonedTime(date, timezone);
    return format(zonedDate, formatStr);
}

/**
 * Get "time ago" string for a timestamp, adjusted to timezone context
 */
export function formatTimeAgo(timestamp: string): string {
    return formatDistanceToNow(parseISO(timestamp), { addSuffix: true });
}

/**
 * Get hour from a timestamp in a specific timezone
 */
export function getHourInTimezone(timestamp: string, timezone: string): number {
    const date = parseISO(timestamp);
    const options: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        hour: "numeric",
        hour12: false,
    };
    const parts = new Intl.DateTimeFormat("en-US", options).formatToParts(date);
    const hourPart = parts.find((p) => p.type === "hour");
    return parseInt(hourPart?.value || "0", 10);
}

/**
 * Get time period based on hour in user's timezone
 */
export function getTimePeriodInTimezone(
    timestamp: string,
    timezone: string
): "morning" | "afternoon" | "evening" | "night" {
    const hour = getHourInTimezone(timestamp, timezone);
    if (hour >= 6 && hour < 12) return "morning";
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 21) return "evening";
    return "night";
}

/**
 * Get today's date string in user's timezone (yyyy-MM-dd format)
 */
export function getTodayInTimezone(timezone: string): string {
    const zonedDate = toZonedTime(new Date(), timezone);
    return format(zonedDate, "yyyy-MM-dd");
}

/**
 * Get the start of today in user's timezone as a Date object
 */
export function getStartOfTodayInTimezone(timezone: string): Date {
    const todayStr = getTodayInTimezone(timezone);
    return startOfDay(parseISO(todayStr));
}

/**
 * Check if a date string (yyyy-MM-dd) is today in user's timezone
 */
export function isDateToday(dateStr: string, timezone: string): boolean {
    return dateStr === getTodayInTimezone(timezone);
}

/**
 * Check if a date is in the future relative to user's timezone
 */
export function isDateFuture(date: Date, timezone: string): boolean {
    const todayStart = getStartOfTodayInTimezone(timezone);
    return date > todayStart;
}

/**
 * Format time from timestamp in user's timezone
 */
export function formatTimeInTimezone(timestamp: string, timezone: string): string {
    const date = parseISO(timestamp);
    const options: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    };
    return new Intl.DateTimeFormat("en-US", options).format(date);
}

/**
 * ==========================================
 * HABIT & SCHEDULE CALCULATIONS
 * ==========================================
 */

/**
 * Maps JS getDay (0=Sun) to Habit pattern index (0=Mon)
 */
function getHabitDayIndex(date: Date): number {
    return (getDay(date) + 6) % 7;
}

/**
 * Computes the end date for a habit based on frequency pattern and target occurrences.
 */
export function computeEndDateForHabitDays(
    startDate: Date,
    frequencyPattern: boolean[],
    habitDays: number
): Date {
    if (habitDays < 1) return new Date(startDate);

    const effectivePattern = frequencyPattern.some(Boolean)
        ? frequencyPattern
        : [true, true, true, true, true, true, true];

    let count = 0;
    let currentDate = new Date(startDate);

    // Safety: Limit search to 10 years
    const maxSearchDate = addDays(startDate, 365 * 10);

    while (currentDate <= maxSearchDate) {
        if (effectivePattern[getHabitDayIndex(currentDate)]) {
            count++;
            if (count >= habitDays) return new Date(currentDate);
        }
        currentDate = addDays(currentDate, 1);
    }

    return new Date(startDate);
}

/**
 * Generates an array of scheduled dates for a habit.
 */
export function getScheduledDates(
    startDate: Date,
    frequencyPattern: boolean[],
    habitDays: number
): Date[] {
    const dates: Date[] = [];
    if (habitDays < 1) return dates;

    const effectivePattern = frequencyPattern.some(Boolean)
        ? frequencyPattern
        : [true, true, true, true, true, true, true];

    let currentDate = new Date(startDate);
    const maxSearchDate = addDays(startDate, 365 * 10);

    while (dates.length < habitDays && currentDate <= maxSearchDate) {
        if (effectivePattern[getHabitDayIndex(currentDate)]) {
            dates.push(new Date(currentDate));
        }
        currentDate = addDays(currentDate, 1);
    }

    return dates;
}

/**
 * Counts the number of scheduled sessions between two dates based on frequency pattern.
 */
export function countScheduledSessions(
    startDate: Date,
    endDate: Date,
    frequencyPattern: boolean[]
): number {
    let count = 0;
    let currentDate = new Date(startDate);

    while (!isAfter(currentDate, endDate)) {
        if (frequencyPattern[getHabitDayIndex(currentDate)]) {
            count++;
        }
        currentDate = addDays(currentDate, 1);
    }

    return count;
}
