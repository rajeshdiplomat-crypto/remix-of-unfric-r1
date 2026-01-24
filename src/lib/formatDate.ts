import { format, formatDistanceToNow, parseISO, startOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

/**
 * Centralized date/time formatting utilities that respect user timezone
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
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };
  const parts = new Intl.DateTimeFormat("en-CA", options).formatToParts(now);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return `${year}-${month}-${day}`;
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
