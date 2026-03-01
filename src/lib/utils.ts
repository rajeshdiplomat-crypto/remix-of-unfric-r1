import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Standard shadcn/ui class merger
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Simple async wait/sleep utility
 */
export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Unique ID generator (wrapper for crypto.randomUUID)
 */
export const uuid = () => crypto.randomUUID();

/**
 * Short ID generator for lightweight local keys
 */
export const shortId = (length = 7) => Math.random().toString(36).substring(2, 2 + length);
