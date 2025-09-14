/**
 * 🏁 Workday Utilities
 * 
 * Functions to determine workdays, handle holidays, and manage email scheduling
 */

// Major US holidays (simplified - you may want to use a proper holiday library)
const US_HOLIDAYS = [
  '2025-01-01', // New Year's Day
  '2025-01-20', // Martin Luther King Jr. Day
  '2025-02-17', // Presidents' Day
  '2025-05-26', // Memorial Day
  '2025-07-04', // Independence Day
  '2025-09-01', // Labor Day
  '2025-10-13', // Columbus Day
  '2025-11-11', // Veterans Day
  '2025-11-27', // Thanksgiving Day
  '2025-12-25', // Christmas Day
];

/**
 * Check if a date is a holiday
 */
export function isHoliday(date: Date): boolean {
  const dateString = date.toISOString().split('T')[0];
  return US_HOLIDAYS.includes(dateString);
}

/**
 * Check if a date is a weekend
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

/**
 * Check if a date is a workday (not weekend and not holiday)
 */
export function isWorkday(date: Date): boolean {
  return !isWeekend(date) && !isHoliday(date);
}

/**
 * Get the first workday of the current week
 * If Monday is a holiday, returns Tuesday, etc.
 */
export function getFirstWorkdayOfWeek(date: Date = new Date()): Date {
  const currentDate = new Date(date);
  
  // Get Monday of the current week
  const dayOfWeek = currentDate.getDay();
  const daysToMonday = dayOfWeek === 0 ? 1 : (dayOfWeek === 1 ? 0 : 8 - dayOfWeek);
  const monday = new Date(currentDate);
  monday.setDate(currentDate.getDate() - daysToMonday);
  monday.setHours(0, 0, 0, 0);
  
  // Check if Monday is a workday
  if (isWorkday(monday)) {
    return monday;
  }
  
  // If Monday is not a workday, find the next workday
  let nextWorkday = new Date(monday);
  for (let i = 1; i <= 7; i++) {
    nextWorkday.setDate(monday.getDate() + i);
    if (isWorkday(nextWorkday)) {
      return nextWorkday;
    }
  }
  
  // Fallback to Monday if somehow no workday found
  return monday;
}

/**
 * Check if today is the first workday of the week
 */
export function isFirstWorkdayOfWeek(date: Date = new Date()): boolean {
  const firstWorkday = getFirstWorkdayOfWeek(date);
  const today = new Date(date);
  
  return firstWorkday.toDateString() === today.toDateString();
}

/**
 * Get the next workday after a given date
 */
export function getNextWorkday(date: Date): Date {
  const nextDay = new Date(date);
  nextDay.setDate(date.getDate() + 1);
  
  while (!isWorkday(nextDay)) {
    nextDay.setDate(nextDay.getDate() + 1);
  }
  
  return nextDay;
}

/**
 * Get the end of workday time (5 PM)
 */
export function getEndOfWorkday(date: Date = new Date()): Date {
  const endOfDay = new Date(date);
  endOfDay.setHours(17, 0, 0, 0); // 5 PM
  return endOfDay;
}

/**
 * Check if it's time to send end-of-day emails (after 5 PM on workdays)
 */
export function shouldSendEndOfDayEmail(date: Date = new Date()): boolean {
  if (!isWorkday(date)) {
    return false;
  }
  
  const endOfWorkday = getEndOfWorkday(date);
  return date >= endOfWorkday;
}

/**
 * Check if it's time to send weekly summary emails (Friday after 5 PM)
 */
export function shouldSendWeeklySummaryEmail(date: Date = new Date()): boolean {
  const dayOfWeek = date.getDay();
  const isFriday = dayOfWeek === 5;
  
  if (!isFriday) {
    return false;
  }
  
  return shouldSendEndOfDayEmail(date);
}

/**
 * Check if it's time to send Friday combined email (Friday after 5 PM)
 * This replaces both daily and weekly emails on Friday
 */
export function shouldSendFridayCombinedEmail(date: Date = new Date()): boolean {
  return shouldSendWeeklySummaryEmail(date);
}

/**
 * Format date for email display
 */
export function formatDateForEmail(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Get week number of the year
 */
export function getWeekNumber(date: Date = new Date()): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}
