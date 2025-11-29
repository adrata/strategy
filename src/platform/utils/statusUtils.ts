/**
 * Status and styling utility functions for pipeline components.
 * Handles color coding, status labels, and visual indicators.
 * 
 * Now uses unified color system with theme-driven CSS variables.
 */

import { getStatusColorClass, getPriorityColorClass, getStageColorClass } from './color-utils';

// -------- Types --------
export type StatusType = 'status' | 'priority' | 'stage';
export type StatusColor = string;

// -------- Status Colors --------
/**
 * Get status color classes using unified color system
 * @deprecated Consider using getStatusColorClass from color-utils directly
 */
export function getStatusColor(status?: string): StatusColor {
  return getStatusColorClass(status);
}

// -------- Priority Colors --------
/**
 * Get priority color classes using unified color system
 * @deprecated Consider using getPriorityColorClass from color-utils directly
 */
export function getPriorityColor(priority?: string): StatusColor {
  return getPriorityColorClass(priority);
}

// -------- Stage Colors --------
/**
 * Get stage color classes using unified color system
 * @deprecated Consider using getStageColorClass from color-utils directly
 */
export function getStageColor(stage?: string, category?: string): StatusColor {
  return getStageColorClass(stage, category);
}

// -------- Speedrun Status Colors --------
/**
 * Get speedrun status color classes using unified color system
 * Uses error colors for high priority, warning for medium, hover for low
 */
export function getSpeedrunStatusColor(status?: string): StatusColor {
  if (!status) return 'bg-hover text-foreground';
  
  const statusLower = status.toLowerCase();
  
  // High priority statuses - use error colors
  if (['hot', 'qualified', 'active'].includes(statusLower)) {
    return 'bg-error-bg text-error-text border border-error-border';
  }
  
  // Medium priority statuses - use warning colors
  if (['warm', 'new', 'discovery'].includes(statusLower)) {
    return 'bg-warning-bg text-warning-text border border-warning-border';
  }
  
  // Low priority statuses - use hover colors
  if (['cold', 'lost', 'closed'].includes(statusLower)) {
    return 'bg-hover text-foreground border border-border';
  }
  
  return 'bg-hover text-foreground';
}

// -------- State Colors --------
/**
 * Get state color classes using unified color system
 * Uses category color for people category (violet/purple theme)
 */
export function getStateColor(state?: string): StatusColor {
  if (!state) return 'bg-hover text-foreground';
  
  // Use people category colors for states (purple theme)
  return 'bg-category-people-100 text-category-people-800 border border-category-people-200';
}

// -------- Speedrun Status Labels --------
export function getSpeedrunStatusLabel(status?: string): string {
  if (!status) return 'Unknown';
  
  const statusLower = status.toLowerCase();
  
  // Map to user-friendly labels
  const statusMap: Record<string, string> = {
    'hot': '🔥 Hot',
    'qualified': '✅ Qualified',
    'active': '⚡ Active',
    'warm': '🔥 Warm',
    'new': '🆕 New',
    'discovery': '🔍 Discovery',
    'cold': '❄️ Cold',
    'lost': '❌ Lost',
    'closed': '🔒 Closed',
  };
  
  return statusMap[statusLower] || status;
}

// -------- Action Timing Colors --------
/**
 * Get action timing color classes using unified color system
 */
export function getStandardizedActionTimingColor(timing: string, isLastAction: boolean = false): StatusColor {
  const timingLower = timing.toLowerCase();
  
  // Urgent timing - use error colors
  if (timingLower.includes('urgent') || timingLower.includes('asap')) {
    return 'bg-error-bg text-error-text border border-error-border';
  }
  
  // Today timing - use warning colors
  if (timingLower.includes('today') || timingLower.includes('same day')) {
    return 'bg-warning-bg text-warning-text border border-warning-border';
  }
  
  // This week timing - use info colors (yellow alternative)
  if (timingLower.includes('this week') || timingLower.includes('within week')) {
    return 'bg-info-bg text-info-text border border-info-border';
  }
  
  // Next week timing - use info colors (theme-aware)
  if (timingLower.includes('next week') || timingLower.includes('following week')) {
    return 'bg-info-bg text-info-text border border-info-border';
  }
  
  // Default timing
  return 'bg-hover text-foreground border border-border';
}

// -------- Realtime Action Timing --------
export function getRealtimeActionTiming(lastActionDate?: string | Date): { text: string; color: StatusColor } {
  if (!lastActionDate) {
    return { text: 'Never', color: 'bg-hover text-foreground' };
  }
  
  const now = new Date();
  const actionDate = new Date(lastActionDate);
  const diffMs = now.getTime() - actionDate.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);
  
  // Recent (within 1 hour) - Success/Green
  if (diffMinutes < 60) {
    if (diffMinutes < 1) {
      return { text: 'Just now', color: 'bg-success-bg text-success-text' };
    }
    return { text: `${diffMinutes}m ago`, color: 'bg-success-bg text-success-text' };
  }
  
  // Today (within 24 hours) - use info colors (theme-aware)
  if (diffHours < 24) {
    return { text: `${diffHours}h ago`, color: 'bg-info-bg text-info-text' };
  }
  
  // This week (within 7 days) - Warning/Yellow
  if (diffDays < 7) {
    return { text: `${diffDays}d ago`, color: 'bg-warning-bg text-warning-text' };
  }
  
  // This month (within 30 days) - Warning/Orange
  if (diffDays < 30) {
    return { text: `${diffWeeks}w ago`, color: 'bg-warning-bg text-warning-text' };
  }
  
  // This year (within 365 days) - Error/Red
  if (diffDays < 365) {
    return { text: `${diffMonths}mo ago`, color: 'bg-error-bg text-error-text' };
  }
  
  // Very old - Hover/Gray
  return { text: `${diffYears}y ago`, color: 'bg-hover text-foreground' };
}
