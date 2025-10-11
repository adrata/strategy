/**
 * Status and styling utility functions for pipeline components.
 * Handles color coding, status labels, and visual indicators.
 */

// -------- Types --------
export type StatusType = 'status' | 'priority' | 'stage';
export type StatusColor = string;

// -------- Status Colors --------
export function getStatusColor(status?: string): StatusColor {
  if (!status) return 'bg-[var(--hover)] text-gray-800';
  
  const statusLower = status.toLowerCase();
  if (['active', 'qualified', 'hot', 'won'].includes(statusLower)) {
    return 'bg-[var(--hover)] text-gray-800';
  }
  if (['new', 'discovery', 'proposal'].includes(statusLower)) {
    return 'bg-orange-100 text-orange-800';
  }
  if (['cold', 'lost', 'closed'].includes(statusLower)) {
    return 'bg-red-100 text-red-800';
  }
  return 'bg-[var(--hover)] text-gray-800';
}

// -------- Priority Colors --------
export function getPriorityColor(priority?: string): StatusColor {
  if (!priority) return 'bg-[var(--hover)] text-gray-800';
  
  const priorityLower = priority.toLowerCase();
  if (priorityLower === 'high') return 'bg-red-100 text-red-800';
  if (priorityLower === 'medium') return 'bg-orange-100 text-orange-800';
  if (priorityLower === 'low') return 'bg-[var(--hover)] text-gray-800';
  return 'bg-[var(--hover)] text-gray-800';
}

// -------- Stage Colors --------
export function getStageColor(stage?: string): StatusColor {
  if (!stage) return 'bg-[var(--hover)] text-gray-800';
  
  const stageLower = stage.toLowerCase().replace(/\s+/g, '-');
  
  // Closed stages
  if (['won', 'closed-won'].includes(stageLower)) return 'bg-green-100 text-green-800';
  if (['lost', 'closed-lost'].includes(stageLower)) return 'bg-[var(--hover)] text-gray-800';
  if (stageLower === 'closed-lost-to-competition') return 'bg-red-100 text-red-800 border border-red-200';
  
  // Active stages  
  if (['proposal', 'proposal-price-quote'].includes(stageLower)) return 'bg-navy-100 text-navy-800';
  if (['negotiation', 'negotiation-review'].includes(stageLower)) return 'bg-orange-100 text-orange-800';
  if (['discovery', 'qualification', 'needs-analysis'].includes(stageLower)) return 'bg-[var(--hover)] text-gray-800';
  
  return 'bg-[var(--hover)] text-gray-800';
}

// -------- Speedrun Status Colors --------
export function getSpeedrunStatusColor(status?: string): StatusColor {
  if (!status) return 'bg-[var(--hover)] text-gray-800';
  
  const statusLower = status.toLowerCase();
  
  // High priority statuses
  if (['hot', 'qualified', 'active'].includes(statusLower)) {
    return 'bg-red-100 text-red-800 border border-red-200';
  }
  
  // Medium priority statuses
  if (['warm', 'new', 'discovery'].includes(statusLower)) {
    return 'bg-orange-100 text-orange-800 border border-orange-200';
  }
  
  // Low priority statuses
  if (['cold', 'lost', 'closed'].includes(statusLower)) {
    return 'bg-[var(--hover)] text-gray-800 border border-[var(--border)]';
  }
  
  return 'bg-[var(--hover)] text-gray-800';
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
export function getStandardizedActionTimingColor(timing: string, isLastAction: boolean = false): StatusColor {
  const timingLower = timing.toLowerCase();
  
  // Urgent timing
  if (timingLower.includes('urgent') || timingLower.includes('asap')) {
    return 'bg-red-100 text-red-800 border border-red-200';
  }
  
  // Today timing
  if (timingLower.includes('today') || timingLower.includes('same day')) {
    return 'bg-orange-100 text-orange-800 border border-orange-200';
  }
  
  // This week timing
  if (timingLower.includes('this week') || timingLower.includes('within week')) {
    return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
  }
  
  // Next week timing
  if (timingLower.includes('next week') || timingLower.includes('following week')) {
    return 'bg-navy-100 text-navy-800 border border-navy-200';
  }
  
  // Default timing
  return 'bg-[var(--hover)] text-gray-800 border border-[var(--border)]';
}

// -------- Realtime Action Timing --------
export function getRealtimeActionTiming(lastActionDate?: string | Date): { text: string; color: StatusColor } {
  if (!lastActionDate) {
    return { text: 'Never', color: 'bg-[var(--hover)] text-gray-800' };
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
  
  // Recent (within 1 hour) - Green
  if (diffMinutes < 60) {
    if (diffMinutes < 1) {
      return { text: 'Just now', color: 'bg-green-100 text-green-800' };
    }
    return { text: `${diffMinutes}m ago`, color: 'bg-green-100 text-green-800' };
  }
  
  // Today (within 24 hours) - Blue
  if (diffHours < 24) {
    return { text: `${diffHours}h ago`, color: 'bg-navy-100 text-navy-800' };
  }
  
  // This week (within 7 days) - Yellow
  if (diffDays < 7) {
    return { text: `${diffDays}d ago`, color: 'bg-yellow-100 text-yellow-800' };
  }
  
  // This month (within 30 days) - Orange
  if (diffDays < 30) {
    return { text: `${diffWeeks}w ago`, color: 'bg-orange-100 text-orange-800' };
  }
  
  // This year (within 365 days) - Red
  if (diffDays < 365) {
    return { text: `${diffMonths}mo ago`, color: 'bg-red-100 text-red-800' };
  }
  
  // Very old - Gray
  return { text: `${diffYears}y ago`, color: 'bg-[var(--hover)] text-gray-800' };
}
