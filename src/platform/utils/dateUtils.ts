/**
 * Date and time utility functions for pipeline operations.
 * Handles federal holidays, working days, and dynamic goal calculations.
 */

// -------- Constants --------
const FEDERAL_HOLIDAYS_2025 = [
  '2025-01-01', // New Year's Day
  '2025-01-20', // Martin Luther King Jr. Day
  '2025-02-17', // Presidents' Day
  '2025-05-26', // Memorial Day
  '2025-06-19', // Juneteenth
  '2025-07-04', // Independence Day
  '2025-09-01', // Labor Day
  '2025-10-13', // Columbus Day
  '2025-11-11', // Veterans Day
  '2025-11-27', // Thanksgiving Day
  '2025-12-25', // Christmas Day
];

// -------- Types --------
export type WorkingDayTiming = 'morning' | 'afternoon' | 'evening';
export type DynamicGoals = {
  daily: number;
  weekly: number;
  weeklyWorkingDays: number;
};

// -------- Holiday Detection --------
export function isFederalHoliday(date: Date): boolean {
  const dateStr = date.toISOString().split('T')[0];
  return FEDERAL_HOLIDAYS_2025.includes(dateStr);
}

export function isNonWorkingDay(date: Date): boolean {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6 || isFederalHoliday(date);
}

// -------- Working Day Calculations --------
export function getNextWorkingDay(startDate: Date): Date {
  const nextDay = new Date(startDate);
  nextDay.setDate(nextDay.getDate() + 1);
  
  while (isNonWorkingDay(nextDay)) {
    nextDay.setDate(nextDay.getDate() + 1);
  }
  
  return nextDay;
}

export function getWorkingDaysInWeek(startDate: Date): number {
  let workingDays = 0;
  const currentDate = new Date(startDate);
  
  // Check the next 7 days
  for (let i = 0; i < 7; i++) {
    if (!isNonWorkingDay(currentDate)) {
      workingDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return workingDays;
}

// -------- Dynamic Goals --------
export function getDynamicGoals(): DynamicGoals {
  const today = new Date();
  const workingDays = getWorkingDaysInWeek(today);
  
  // Base goals that adjust based on working days in the week
  const baseDaily = 5;
  const baseWeekly = 25;
  
  return {
    daily: baseDaily,
    weekly: baseWeekly,
    weeklyWorkingDays: workingDays,
  };
}

// -------- Working Day Timing --------
export function getWorkingDayTiming(baseTiming: string, isWeekend: boolean): string {
  if (isWeekend) {
    return 'Weekend timing';
  }
  
  return baseTiming;
}

// -------- Date Formatting --------
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
      return formatDate(dateString);
    }
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Invalid date';
  }
}

export function formatLastActionTime(record: any): string {
  if (!record?.lastActionDate) {
    return 'No recent action';
  }
  
  try {
    const actionDate = new Date(record.lastActionDate);
    const now = new Date();
    const diffInMs = now.getTime() - actionDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return formatDate(record.lastActionDate);
    }
  } catch (error) {
    console.error('Error formatting last action time:', error);
    return 'Invalid date';
  }
}
