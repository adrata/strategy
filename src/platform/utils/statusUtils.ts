/**
 * Status and styling utility functions for pipeline components.
 * Handles color coding, status labels, and visual indicators.
 */

// -------- Types --------
export type StatusType = 'status' | 'priority' | 'stage';
export type StatusColor = string;

// -------- Status Colors --------
export function getStatusColor(status?: string): StatusColor {
  if (!status) return 'bg-gray-100 text-gray-800';
  
  const statusLower = status.toLowerCase();
  if (['active', 'qualified', 'hot', 'won'].includes(statusLower)) {
    return 'bg-gray-100 text-gray-800';
  }
  if (['new', 'discovery', 'proposal'].includes(statusLower)) {
    return 'bg-orange-100 text-orange-800';
  }
  if (['cold', 'lost', 'closed'].includes(statusLower)) {
    return 'bg-red-100 text-red-800';
  }
  return 'bg-gray-100 text-gray-800';
}

// -------- Priority Colors --------
export function getPriorityColor(priority?: string): StatusColor {
  if (!priority) return 'bg-gray-100 text-gray-800';
  
  const priorityLower = priority.toLowerCase();
  if (priorityLower === 'high') return 'bg-red-100 text-red-800';
  if (priorityLower === 'medium') return 'bg-orange-100 text-orange-800';
  if (priorityLower === 'low') return 'bg-gray-100 text-gray-800';
  return 'bg-gray-100 text-gray-800';
}

// -------- Stage Colors --------
export function getStageColor(stage?: string): StatusColor {
  if (!stage) return 'bg-gray-100 text-gray-800';
  
  const stageLower = stage.toLowerCase().replace(/\s+/g, '-');
  
  // Closed stages
  if (['won', 'closed-won'].includes(stageLower)) return 'bg-green-100 text-green-800';
  if (['lost', 'closed-lost'].includes(stageLower)) return 'bg-gray-100 text-gray-800';
  if (stageLower === 'closed-lost-to-competition') return 'bg-red-100 text-red-800 border border-red-200';
  
  // Active stages  
  if (['proposal', 'proposal-price-quote'].includes(stageLower)) return 'bg-blue-100 text-blue-800';
  if (['negotiation', 'negotiation-review'].includes(stageLower)) return 'bg-orange-100 text-orange-800';
  if (['discovery', 'qualification', 'needs-analysis'].includes(stageLower)) return 'bg-gray-100 text-gray-800';
  
  return 'bg-gray-100 text-gray-800';
}

// -------- Speedrun Status Colors --------
export function getSpeedrunStatusColor(status?: string): StatusColor {
  if (!status) return 'bg-gray-100 text-gray-800';
  
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
    return 'bg-gray-100 text-gray-800 border border-gray-200';
  }
  
  return 'bg-gray-100 text-gray-800';
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
    return 'bg-blue-100 text-blue-800 border border-blue-200';
  }
  
  // Default timing
  return 'bg-gray-100 text-gray-800 border border-gray-200';
}
