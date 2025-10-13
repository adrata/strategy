/**
 * Time tracking utilities for pipeline metrics
 * Calculates hours left, daily/weekly progress, etc.
 */

export interface TimeTrackingData {
  hoursLeft: number;
  hoursTillStart: number;
  isBeforeWorkingHours: boolean;
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
 * Calculate hours left until end time in user's timezone
 * @param timezone - User's timezone (e.g., 'America/New_York', 'UTC')
 * @param endHour - End hour (default: 17 for 5pm)
 * @returns Hours left until end time (0 if past end time or weekend)
 */
export function calculateHoursLeft(timezone: string = 'America/New_York', endHour: number = 17): number {
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
    
    // If before 9am or after end time, return 0
    if (currentHour < 9 || currentHour >= endHour) {
      return 0;
    }
    
    // Calculate hours left until end time
    const totalMinutesLeft = (endHour * 60) - (currentHour * 60 + currentMinutes);
    const hoursLeft = Math.max(0, Math.round(totalMinutesLeft / 60 * 10) / 10); // Round to 1 decimal
    
    return hoursLeft;
  } catch (error) {
    console.warn('Error calculating hours left:', error);
    return 8; // Default fallback
  }
}

/**
 * Calculate hours until start time in user's timezone
 * @param timezone - User's timezone (e.g., 'America/New_York', 'UTC')
 * @param startHour - Start hour (default: 9 for 9am)
 * @returns Hours until start time (0 if past start time or weekend)
 */
export function calculateHoursTillStart(timezone: string = 'America/New_York', startHour: number = 9): number {
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
    
    // If after start time, return 0
    if (currentHour >= startHour) {
      return 0;
    }
    
    // Calculate hours until start time
    const totalMinutesTillStart = (startHour * 60) - (currentHour * 60 + currentMinutes);
    const hoursTillStart = Math.max(0, Math.round(totalMinutesTillStart / 60 * 10) / 10); // Round to 1 decimal
    
    return hoursTillStart;
  } catch (error) {
    console.warn('Error calculating hours till start:', error);
    return 0; // Default fallback
  }
}

/**
 * Check if current time is before working hours start
 * @param timezone - User's timezone (e.g., 'America/New_York', 'UTC')
 * @param startHour - Start hour (default: 9 for 9am)
 */
export function isBeforeWorkingHours(timezone: string = 'America/New_York', startHour: number = 9): boolean {
  try {
    const now = new Date();
    const userTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    
    // Get current day of week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = userTime.getDay();
    
    // If weekend, return false
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }
    
    const currentHour = userTime.getHours();
    
    // Return true if before start time
    return currentHour < startHour;
  } catch (error) {
    console.warn('Error checking if before working hours:', error);
    return false;
  }
}

/**
 * Check if current time is within working hours (Mon-Fri)
 * @param timezone - User's timezone (e.g., 'America/New_York', 'UTC')
 * @param startHour - Start hour (default: 9 for 9am)
 * @param endHour - End hour (default: 17 for 5pm)
 */
export function isWorkingHours(timezone: string = 'America/New_York', startHour: number = 9, endHour: number = 17): boolean {
  try {
    const now = new Date();
    const userTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    
    const dayOfWeek = userTime.getDay();
    const currentHour = userTime.getHours();
    
    // Monday-Friday, within working hours
    return dayOfWeek >= 1 && dayOfWeek <= 5 && currentHour >= startHour && currentHour < endHour;
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
 * Get user working hours from settings
 * @param userId - User ID to get settings for
 * @returns Object with startHour and endHour, defaults to 9-17
 */
export function getUserWorkingHours(userId?: string): { startHour: number; endHour: number } {
  try {
    if (typeof window !== 'undefined' && userId) {
      const userSettings = localStorage.getItem(`user-settings-${userId}`);
      if (userSettings) {
        const settings = JSON.parse(userSettings);
        if (settings.preferredCallTimes) {
          const startHour = parseInt(settings.preferredCallTimes.start.split(':')[0]) || 9;
          const endHour = parseInt(settings.preferredCallTimes.end.split(':')[0]) || 17;
          return { startHour, endHour };
        }
      }
    }
  } catch (error) {
    console.warn('Error getting user working hours:', error);
  }
  
  // Default to 9-5
  return { startHour: 9, endHour: 17 };
}

/**
 * Get comprehensive time tracking data
 * This function now integrates with speedrun progress tracking
 */
export function getTimeTrackingData(timezone: string = 'America/New_York', userId?: string): TimeTrackingData {
  const { startHour, endHour } = getUserWorkingHours(userId);
  
  const hoursLeft = calculateHoursLeft(timezone, endHour);
  const hoursTillStart = calculateHoursTillStart(timezone, startHour);
  const isBeforeWorking = isBeforeWorkingHours(timezone, startHour);
  const isWorking = isWorkingHours(timezone, startHour, endHour);
  
  const now = new Date();
  const userTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
  
  // Try to get speedrun progress data first (preferred source)
  let todayProgress = 0;
  let weekProgress = 0;
  let allTimeRecord = 0;
  
  try {
    // Check for speedrun state (most accurate source)
    const today = new Date().toDateString();
    const speedrunState = localStorage.getItem(`speedrun-state-${today}`);
    
    if (speedrunState) {
      const state = JSON.parse(speedrunState);
      todayProgress = state.completedLeads?.length || 0;
      
      // Calculate weekly progress from speedrun states (Monday-Sunday)
      const monday = new Date();
      const daysFromMonday = monday.getDay() === 0 ? 6 : monday.getDay() - 1;
      monday.setDate(monday.getDate() - daysFromMonday);
      
      let weekTotal = 0;
      let maxDailyRecord = 0;
      
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(monday);
        checkDate.setDate(monday.getDate() + i);
        const dateString = checkDate.toDateString();
        const dayState = localStorage.getItem(`speedrun-state-${dateString}`);
        
        if (dayState) {
          const parsed = JSON.parse(dayState);
          const dayCount = parsed.completedLeads?.length || 0;
          weekTotal += dayCount;
          maxDailyRecord = Math.max(maxDailyRecord, dayCount);
        }
      }
      
      weekProgress = weekTotal;
      allTimeRecord = Math.max(maxDailyRecord, getAllTimeRecord());
    } else {
      // Fallback to old activity tracking system
      const todayActivity = getTodayActivityCount();
      const weekActivity = getWeekActivityCount();
      todayProgress = todayActivity.total;
      weekProgress = weekActivity.total;
      allTimeRecord = getAllTimeRecord();
    }
  } catch (error) {
    console.warn('Error reading speedrun progress, falling back to activity tracking:', error);
    // Fallback to old activity tracking system
    const todayActivity = getTodayActivityCount();
    const weekActivity = getWeekActivityCount();
    todayProgress = todayActivity.total;
    weekProgress = weekActivity.total;
    allTimeRecord = getAllTimeRecord();
  }
  
  return {
    hoursLeft,
    hoursTillStart,
    isBeforeWorkingHours: isBeforeWorking,
    todayProgress,
    todayTarget: 50,
    weekProgress,
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
