/**
 * Action and business logic utility functions for pipeline operations.
 * Handles last action tracking, next action prediction, and health status.
 */

import { formatDate, formatRelativeTime } from './dateUtils';
import { getStandardizedActionTimingColor } from './statusUtils';

// -------- Types --------
export type ActionTiming = 'urgent' | 'today' | 'this-week' | 'next-week' | 'later';
export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown';
export type ActionData = {
  timing: string;
  timingColor: string;
  action: string;
};

export type HealthData = {
  status: HealthStatus;
  color: string;
  text: string;
};

// -------- Shared Timing Utilities --------
/**
 * Calculate last action timing text (matches speedrun pattern)
 * Returns human-readable timing like "Today", "Yesterday", "3 days ago", etc.
 */
export function calculateLastActionTiming(lastActionDate?: string | Date, lastAction?: string): string {
  if (!lastActionDate || !lastAction || lastAction === 'No action taken') {
    return 'Never';
  }
  
  const daysSince = Math.floor((new Date().getTime() - new Date(lastActionDate).getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSince === 0) return 'Today';
  else if (daysSince === 1) return 'Yesterday';
  else if (daysSince <= 7) return `${daysSince} days ago`;
  else if (daysSince <= 30) return `${Math.floor(daysSince / 7)} weeks ago`;
  else return `${Math.floor(daysSince / 30)} months ago`;
}

/**
 * Calculate next action timing text (matches speedrun pattern)
 * Returns human-readable timing like "Today", "Tomorrow", "This week", etc.
 */
export function calculateNextActionTiming(nextActionDate?: string | Date): string {
  if (!nextActionDate) {
    return 'No date set';
  }
  
  const now = new Date();
  const actionDate = new Date(nextActionDate);
  const diffMs = actionDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'Overdue';
  else if (diffDays === 0) return 'Today';
  else if (diffDays === 1) return 'Tomorrow';
  else if (diffDays <= 7) return 'This week';
  else if (diffDays <= 14) return 'Next week';
  else if (diffDays <= 30) return 'This month';
  else return 'Future';
}

// -------- Last Action Functions --------
export function getLastContactTime(record: any): string {
  if (!record?.lastContactDate) {
    return 'No recent contact';
  }
  
  try {
    const contactDate = new Date(record.lastContactDate);
    const now = new Date();
    const diffInMs = now.getTime() - contactDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return formatDate(record.lastContactDate);
    }
  } catch (error) {
    console.error('Error formatting last contact time:', error);
    return 'Invalid date';
  }
}

export function getLastActionTime(record: any): string {
  if (!record?.lastActionDate) {
    return 'No recent action';
  }
  
  return formatRelativeTime(record.lastActionDate);
}

export function formatLastActionTime(record: any): string {
  // Prioritize lastContactDate as it's more accurate for actual contact timing
  const lastContact = record.lastContactDate || 
                     record.lastContact;
  
  if (lastContact) {
    return formatRelativeTime(lastContact);
  }
  
  // Fall back to lastActionDate if no contact date available
  const lastActivity = record.lastActionDate || 
                      record.lastActivityDate ||
                      record.lastEngagementAt ||
                      record.lastCallDate ||
                      record.lastEmailDate ||
                      record.lastMeetingDate;
  
  if (lastActivity) {
    return formatRelativeTime(lastActivity);
  }
  
  return 'Never';
}

export function getLastActionDescription(record: any): string {
  if (!record?.lastActionDescription) {
    return 'No recent action';
  }
  
  return record.lastActionDescription;
}

// -------- Smart Action Description --------
export function getSmartLastActionDescription(record: any, healthStatus: string): string {
  const lastAction = getLastActionDescription(record);
  const lastActionTime = getLastActionTime(record);
  
  if (lastAction === 'No recent action') {
    return 'No recent action';
  }
  
  // Add health context to action description
  if (healthStatus === 'critical') {
    return `🚨 ${lastAction} (${lastActionTime})`;
  } else if (healthStatus === 'warning') {
    return `⚠️ ${lastAction} (${lastActionTime})`;
  }
  
  return `${lastAction} (${lastActionTime})`;
}

// -------- Next Action Functions --------
export function getNextAction(record: any): string {
  return record?.nextAction || 'No next action';
}

export function getPredictiveNextAction(record: any): string {
  // Use database nextAction if it exists, otherwise generate predictive logic
  if (!record) return 'No next action';
  
  // If we have a nextAction from the database, use it
  if (record.nextAction && record.nextAction !== 'No next action') {
    return record.nextAction;
  }
  
  // Fallback to predictive logic based on record data
  const status = record.status?.toLowerCase();
  const lastActionTime = record.lastActionDate;
  
  if (!lastActionTime) {
    return 'Initial contact needed';
  }
  
  const daysSinceLastAction = Math.floor(
    (new Date().getTime() - new Date(lastActionTime).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysSinceLastAction > 14) {
    return 'Follow up required';
  } else if (daysSinceLastAction > 7) {
    return 'Check in needed';
  } else if (status === 'new') {
    return 'Qualification call';
  } else if (status === 'qualified') {
    return 'Demo scheduled';
  }
  
  return 'Continue nurturing';
}

// -------- Smart Next Action --------
export function getSmartNextAction(record: any): ActionData {
  const nextAction = getPredictiveNextAction(record);
  const lastActionTime = record?.lastActionDate;
  
  if (!lastActionTime) {
    return {
      timing: 'Today',
      timingColor: getStandardizedActionTimingColor('today'),
      action: nextAction,
    };
  }
  
  const daysSinceLastAction = Math.floor(
    (new Date().getTime() - new Date(lastActionTime).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  let timing: string;
  let timingColor: string;
  
  if (daysSinceLastAction > 14) {
    timing = 'Urgent';
    timingColor = getStandardizedActionTimingColor('urgent');
  } else if (daysSinceLastAction > 7) {
    timing = 'This week';
    timingColor = getStandardizedActionTimingColor('this week');
  } else {
    timing = 'Next week';
    timingColor = getStandardizedActionTimingColor('next week');
  }
  
  return {
    timing,
    timingColor,
    action: nextAction,
  };
}

// -------- Speedrun Next Action --------
export function getSpeedrunNextAction(record: any, recordIndex: number): ActionData {
  const nextAction = getPredictiveNextAction(record);
  const status = record?.status?.toLowerCase();
  
  // Speedrun logic: prioritize based on status and position
  let timing: string;
  let timingColor: string;
  
  if (status === 'hot' || recordIndex < 5) {
    timing = 'Today';
    timingColor = getStandardizedActionTimingColor('today');
  } else if (status === 'qualified' || recordIndex < 15) {
    timing = 'This week';
    timingColor = getStandardizedActionTimingColor('this week');
  } else {
    timing = 'Next week';
    timingColor = getStandardizedActionTimingColor('next week');
  }
  
  return {
    timing,
    timingColor,
    action: nextAction,
  };
}

// -------- Leads Next Action --------
export function getLeadsNextAction(record: any, recordIndex?: number): ActionData {
  const nextAction = getPredictiveNextAction(record);
  const status = record?.status?.toLowerCase();
  
  // Calculate timing based on nextActionDate if available
  let timing: string;
  let timingColor: string;
  
  if (record.nextActionDate) {
    // Use database nextActionDate to calculate timing
    const now = new Date();
    const nextDate = new Date(record.nextActionDate);
    const diffMs = nextDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      timing = 'Overdue';
      timingColor = getStandardizedActionTimingColor('urgent');
    } else if (diffDays === 0) {
      timing = 'Today';
      timingColor = getStandardizedActionTimingColor('today');
    } else if (diffDays === 1) {
      timing = 'Tomorrow';
      timingColor = getStandardizedActionTimingColor('this week');
    } else if (diffDays <= 7) {
      timing = 'This week';
      timingColor = getStandardizedActionTimingColor('this week');
    } else if (diffDays <= 14) {
      timing = 'Next week';
      timingColor = getStandardizedActionTimingColor('next week');
    } else {
      timing = 'Later';
      timingColor = getStandardizedActionTimingColor('later');
    }
  } else {
    // Fallback to status-based logic
    if (status === 'new') {
      timing = 'Today';
      timingColor = getStandardizedActionTimingColor('today');
    } else if (status === 'qualified') {
      timing = 'This week';
      timingColor = getStandardizedActionTimingColor('this week');
    } else {
      timing = 'Next week';
      timingColor = getStandardizedActionTimingColor('next week');
    }
  }
  
  return {
    timing,
    timingColor,
    action: nextAction,
  };
}

// -------- Health Status --------
export function getHealthStatus(record: any): HealthData {
  if (!record) {
    return {
      status: 'unknown',
      color: 'bg-[var(--hover)] text-gray-800',
      text: 'Unknown',
    };
  }
  
  const lastActionDate = record.lastActionDate;
  const status = record.status?.toLowerCase();
  
  if (!lastActionDate) {
    return {
      status: 'critical',
      color: 'bg-red-100 text-red-800',
      text: 'No recent action',
    };
  }
  
  const daysSinceLastAction = Math.floor(
    (new Date().getTime() - new Date(lastActionDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysSinceLastAction > 14) {
    return {
      status: 'critical',
      color: 'bg-red-100 text-red-800',
      text: 'Critical - No action in 14+ days',
    };
  } else if (daysSinceLastAction > 7) {
    return {
      status: 'warning',
      color: 'bg-orange-100 text-orange-800',
      text: 'Warning - No action in 7+ days',
    };
  } else if (status === 'hot' || status === 'qualified') {
    return {
      status: 'healthy',
      color: 'bg-green-100 text-green-800',
      text: 'Healthy - Active engagement',
    };
  }
  
  return {
    status: 'healthy',
    color: 'bg-green-100 text-green-800',
    text: 'Healthy - Recent activity',
  };
}
