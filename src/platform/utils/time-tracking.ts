/**
 * Time tracking utilities for pipeline metrics
 * Calculates hours left, daily/weekly progress, etc.
 */

export interface TimeTrackingData {
  hoursLeft: number;
  todayProgress: number;
  todayTarget: number;
  weekProgress: number;
  weekTarget: number;
  allTimeRecord: number;
  isWorkingHours: boolean;
  currentHour: number;
  timezone: string;
}

export interface ActivityCount {
  emails: number;
  calls: number;
  meetings: number;
  tasks: number;
  total: number;
}

/**
 * Calculate hours left until 5pm in user's timezone
 * @param timezone - User's timezone (e.g., 'America/New_York', 'UTC')
 * @returns Hours left until 5pm (0 if past 5pm or weekend)
 */
export function calculateHoursLeft(timezone: string = 'America/New_York'): number {
  try {
    const now = new Date();
    const userTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    
    // Get current day of week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = userTime.getDay();
    
    // If weekend, return 0
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 0;
    }
    
    const currentHour = userTime.getHours();
    const currentMinutes = userTime.getMinutes();
    
    // If before 9am or after 5pm, return 0
    if (currentHour < 9 || currentHour >= 17) {
      return 0;
    }
    
    // Calculate hours left until 5pm
    const totalMinutesLeft = (17 * 60) - (currentHour * 60 + currentMinutes);
    const hoursLeft = Math.max(0, Math.round(totalMinutesLeft / 60 * 10) / 10); // Round to 1 decimal
    
    return hoursLeft;
  } catch (error) {
    console.warn('Error calculating hours left:', error);
    return 8; // Default fallback
  }
}

/**
 * Check if current time is within working hours (9am-5pm, Mon-Fri)
 */
export function isWorkingHours(timezone: string = 'America/New_York'): boolean {
  try {
    const now = new Date();
    const userTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    
    const dayOfWeek = userTime.getDay();
    const currentHour = userTime.getHours();
    
    // Monday-Friday, 9am-5pm
    return dayOfWeek >= 1 && dayOfWeek <= 5 && currentHour >= 9 && currentHour < 17;
  } catch (error) {
    console.warn('Error checking working hours:', error);
    return true; // Default fallback
  }
}

/**
 * Get current activity counts for today
 * TODO: Connect to real activity tracking system
 */
export function getTodayActivityCount(): ActivityCount {
  // For now, return mock data - will be replaced with real tracking
  const stored = localStorage.getItem('todayActivity');
  if (stored) {
    try {
      const data = JSON.parse(stored);
      const today = new Date().toDateString();
      if (data['date'] === today) {
        return {
          emails: data.emails || 0,
          calls: data.calls || 0,
          meetings: data.meetings || 0,
          tasks: data.tasks || 0,
          total: (data.emails || 0) + (data.calls || 0) + (data.meetings || 0) + (data.tasks || 0)
        };
      }
    } catch (error) {
      console.warn('Error parsing stored activity:', error);
    }
  }
  
  return {
    emails: 0,
    calls: 0,
    meetings: 0,
    tasks: 0,
    total: 0
  };
}

/**
 * Get current activity counts for this week
 * TODO: Connect to real activity tracking system
 */
export function getWeekActivityCount(): ActivityCount {
  // For now, return mock data - will be replaced with real tracking
  const stored = localStorage.getItem('weekActivity');
  if (stored) {
    try {
      const data = JSON.parse(stored);
      const weekStart = getWeekStart();
      if (data['weekStart'] === weekStart.toDateString()) {
        return {
          emails: data.emails || 0,
          calls: data.calls || 0,
          meetings: data.meetings || 0,
          tasks: data.tasks || 0,
          total: (data.emails || 0) + (data.calls || 0) + (data.meetings || 0) + (data.tasks || 0)
        };
      }
    } catch (error) {
      console.warn('Error parsing stored weekly activity:', error);
    }
  }
  
  return {
    emails: 0,
    calls: 0,
    meetings: 0,
    tasks: 0,
    total: 0
  };
}

/**
 * Get all-time record (highest single day)
 * TODO: Connect to real activity tracking system
 */
export function getAllTimeRecord(): number {
  const stored = localStorage.getItem('allTimeRecord');
  if (stored) {
    try {
      return parseInt(stored, 10) || 0;
    } catch (error) {
      console.warn('Error parsing all-time record:', error);
    }
  }
  return 0;
}

/**
 * Update activity count for today
 */
export function updateTodayActivity(type: 'emails' | 'calls' | 'meetings' | 'tasks', increment: number = 1): ActivityCount {
  const current = getTodayActivityCount();
  const updated = {
    ...current,
    [type]: current[type] + increment
  };
  updated['total'] = updated.emails + updated.calls + updated.meetings + updated.tasks;
  
  // Store updated data
  localStorage.setItem('todayActivity', JSON.stringify({
    date: new Date().toDateString(),
    ...updated
  }));
  
  // Update weekly count
  const weekCurrent = getWeekActivityCount();
  const weekUpdated = {
    ...weekCurrent,
    [type]: weekCurrent[type] + increment
  };
  weekUpdated['total'] = weekUpdated.emails + weekUpdated.calls + weekUpdated.meetings + weekUpdated.tasks;
  
  localStorage.setItem('weekActivity', JSON.stringify({
    weekStart: getWeekStart().toDateString(),
    ...weekUpdated
  }));
  
  // Check if this is a new all-time record
  if (updated.total > getAllTimeRecord()) {
    localStorage.setItem('allTimeRecord', updated.total.toString());
  }
  
  return updated;
}

/**
 * Get the start of the current week (Monday)
 */
function getWeekStart(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Sunday
  return new Date(now.setDate(diff));
}

/**
 * Get comprehensive time tracking data
 */
export function getTimeTrackingData(timezone: string = 'America/New_York'): TimeTrackingData {
  const hoursLeft = calculateHoursLeft(timezone);
  const todayActivity = getTodayActivityCount();
  const weekActivity = getWeekActivityCount();
  const allTimeRecord = getAllTimeRecord();
  const isWorking = isWorkingHours(timezone);
  
  const now = new Date();
  const userTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
  
  return {
    hoursLeft,
    todayProgress: todayActivity.total,
    todayTarget: 50,
    weekProgress: weekActivity.total,
    weekTarget: 250,
    allTimeRecord,
    isWorkingHours: isWorking,
    currentHour: userTime.getHours(),
    timezone
  };
}

/**
 * Format hours for display (e.g., "8.5" -> "8.5", "8" -> "8", "0" -> "-")
 */
export function formatHours(hours: number): string {
  if (hours === 0) return '-';
  if (hours % 1 === 0) return hours.toString();
  return hours.toFixed(1);
}
