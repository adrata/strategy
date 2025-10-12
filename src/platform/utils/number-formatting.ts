/**
 * Number formatting utilities for consistent display across the application
 */

/**
 * Format a number with thousand separators (commas)
 * @param num - The number to format
 * @returns Formatted string with commas (e.g., "40,000")
 */
export function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) return '0';
  return num.toLocaleString();
}

/**
 * Format a number with thousand separators, handling edge cases
 * @param num - The number to format
 * @param fallback - Fallback value if num is invalid (default: '0')
 * @returns Formatted string with commas
 */
export function formatNumberSafe(num: number | undefined | null, fallback: string = '0'): string {
  if (num === undefined || num === null || isNaN(num)) return fallback;
  return num.toLocaleString();
}
