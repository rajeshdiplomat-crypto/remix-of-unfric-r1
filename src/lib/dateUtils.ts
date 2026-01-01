import { addDays, format } from "date-fns";

/**
 * Computes the end date for a habit based on the number of habit days (measured occurrences)
 * and the frequency pattern (which days of the week the habit is scheduled).
 * 
 * @param startDate - The start date (inclusive)
 * @param frequencyPattern - Array of 7 booleans where index 0 = Monday, 6 = Sunday
 * @param habitDays - Number of habit occurrences (>= 1)
 * @returns The end date (the last scheduled occurrence)
 */
export function computeEndDateForHabitDays(
  startDate: Date,
  frequencyPattern: boolean[],
  habitDays: number
): Date {
  if (habitDays < 1) {
    return new Date(startDate);
  }

  // If no days selected, treat as daily (all 7 days)
  const hasSelectedDays = frequencyPattern.some(Boolean);
  const effectivePattern = hasSelectedDays ? frequencyPattern : [true, true, true, true, true, true, true];

  let count = 0;
  let currentDate = new Date(startDate);

  while (true) {
    // Convert JS day (0=Sun) to our pattern (0=Mon)
    const dayOfWeek = (currentDate.getDay() + 6) % 7;
    
    if (effectivePattern[dayOfWeek]) {
      count++;
      if (count >= habitDays) {
        return new Date(currentDate);
      }
    }
    currentDate = addDays(currentDate, 1);
    
    // Safety: prevent infinite loop (max 10 years)
    if (count === 0 && currentDate.getTime() - startDate.getTime() > 365 * 10 * 24 * 60 * 60 * 1000) {
      return new Date(startDate);
    }
  }
}

/**
 * Generates an array of scheduled dates for a habit.
 * 
 * @param startDate - The start date (inclusive)
 * @param frequencyPattern - Array of 7 booleans where index 0 = Monday, 6 = Sunday
 * @param habitDays - Number of habit occurrences
 * @returns Array of scheduled dates
 */
export function getScheduledDates(
  startDate: Date,
  frequencyPattern: boolean[],
  habitDays: number
): Date[] {
  const dates: Date[] = [];
  
  if (habitDays < 1) {
    return dates;
  }

  // If no days selected, treat as daily
  const hasSelectedDays = frequencyPattern.some(Boolean);
  const effectivePattern = hasSelectedDays ? frequencyPattern : [true, true, true, true, true, true, true];

  let currentDate = new Date(startDate);

  while (dates.length < habitDays) {
    const dayOfWeek = (currentDate.getDay() + 6) % 7;
    
    if (effectivePattern[dayOfWeek]) {
      dates.push(new Date(currentDate));
    }
    currentDate = addDays(currentDate, 1);
    
    // Safety: prevent infinite loop
    if (dates.length === 0 && currentDate.getTime() - startDate.getTime() > 365 * 10 * 24 * 60 * 60 * 1000) {
      break;
    }
  }

  return dates;
}

/**
 * Counts the number of scheduled sessions between two dates based on frequency pattern.
 * 
 * @param startDate - The start date (inclusive)
 * @param endDate - The end date (inclusive)
 * @param frequencyPattern - Array of 7 booleans where index 0 = Monday, 6 = Sunday
 * @returns Number of scheduled sessions
 */
export function countScheduledSessions(
  startDate: Date,
  endDate: Date,
  frequencyPattern: boolean[]
): number {
  let count = 0;
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayOfWeek = (currentDate.getDay() + 6) % 7;
    if (frequencyPattern[dayOfWeek]) {
      count++;
    }
    currentDate = addDays(currentDate, 1);
  }

  return count;
}
