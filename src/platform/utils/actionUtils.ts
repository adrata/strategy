/**
 * Action utility functions for identifying and categorizing actions
 */

/**
 * Real engagement action types that should update lastAction fields
 * These represent actual sales/engagement activities with prospects
 */
export const ENGAGEMENT_ACTION_TYPES = new Set([
  // Email Actions
  'cold_email',
  'follow_up_email', 
  'email_conversation',
  'email_sent',
  'email_received',
  'email_replied',
  'email_forwarded',
  
  // Call Actions
  'cold_call',
  'follow_up_call',
  'discovery_call',
  'qualification_call',
  'demo_call',
  'closing_call',
  'phone_call',
  'voicemail_left',
  'call_scheduled',
  'call_completed',
  
  // LinkedIn Actions
  'linkedin_connection_request',
  'linkedin_message',
  'linkedin_inmail',
  'linkedin_profile_viewed',
  'linkedin_post_liked',
  'linkedin_post_commented',
  
  // Meeting Actions
  'meeting_scheduled',
  'meeting_completed',
  'demo_meeting',
  'discovery_meeting',
  'proposal_meeting',
  'closing_meeting',
  
  // Sales Process Actions
  'proposal_sent',
  'proposal_follow_up',
  'contract_sent',
  'deal_closed',
  
  // Relationship Building
  'relationship_building',
  'buying_signal_detected',
  'interest_expressed',
  'objection_raised',
  'decision_maker_identified',
  
  // Research & Intelligence (if user-initiated)
  'research_completed',
  'company_researched',
  'contact_researched',
  'intelligence_gathered',
  
  // System Actions (now included to show all activity)
  'data_update',
  'company_created',
  'person_created',
  'record_created',
  'record_updated',
  'note_added',
  'field_updated',
  'status_changed',
  'stage_advanced'
]);

/**
 * System action types that should NOT update lastAction fields
 * These are automated system actions, not real engagement activities
 */
export const SYSTEM_ACTION_TYPES = new Set([
  'person_created',
  'company_created', 
  'record_created',
  'record_updated',
  'note_added',
  'field_updated',
  'status_changed',
  'stage_advanced'
]);

/**
 * Check if an action type represents a real engagement activity
 * @param actionType - The action type to check
 * @returns true if this is a real engagement action that should update lastAction fields
 */
export function isEngagementAction(actionType: string): boolean {
  return ENGAGEMENT_ACTION_TYPES.has(actionType);
}

/**
 * Check if an action type is a system action
 * @param actionType - The action type to check
 * @returns true if this is a system action that should NOT update lastAction fields
 */
export function isSystemAction(actionType: string): boolean {
  return SYSTEM_ACTION_TYPES.has(actionType);
}

/**
 * Get a human-readable description of the action type
 * @param actionType - The action type
 * @returns A formatted description of the action
 */
export function getActionDescription(actionType: string): string {
  const descriptions: Record<string, string> = {
    // Email Actions
    'cold_email': 'Cold Email Outreach',
    'follow_up_email': 'Follow-up Email',
    'email_conversation': 'Email Conversation',
    'email_sent': 'Email Sent',
    'email_received': 'Email Received',
    'email_replied': 'Email Replied',
    'email_forwarded': 'Email Forwarded',
    
    // Call Actions
    'cold_call': 'Cold Call',
    'follow_up_call': 'Follow-up Call',
    'discovery_call': 'Discovery Call',
    'qualification_call': 'Qualification Call',
    'demo_call': 'Demo Call',
    'closing_call': 'Closing Call',
    'phone_call': 'Phone Call',
    'voicemail_left': 'Voicemail Left',
    'call_scheduled': 'Call Scheduled',
    'call_completed': 'Call Completed',
    
    // LinkedIn Actions
    'linkedin_connection_request': 'LinkedIn Connection Request',
    'linkedin_message': 'LinkedIn Message',
    'linkedin_inmail': 'LinkedIn InMail',
    'linkedin_profile_viewed': 'LinkedIn Profile Viewed',
    'linkedin_post_liked': 'LinkedIn Post Liked',
    'linkedin_post_commented': 'LinkedIn Post Commented',
    
    // Meeting Actions
    'meeting_scheduled': 'Meeting Scheduled',
    'meeting_completed': 'Meeting Completed',
    'demo_meeting': 'Demo Meeting',
    'discovery_meeting': 'Discovery Meeting',
    'proposal_meeting': 'Proposal Meeting',
    'closing_meeting': 'Closing Meeting',
    
    // Sales Process Actions
    'proposal_sent': 'Proposal Sent',
    'proposal_follow_up': 'Proposal Follow-up',
    'contract_sent': 'Contract Sent',
    'deal_closed': 'Deal Closed',
    
    // Relationship Building
    'relationship_building': 'Relationship Building',
    'buying_signal_detected': 'Buying Signal Detected',
    'interest_expressed': 'Interest Expressed',
    'objection_raised': 'Objection Raised',
    'decision_maker_identified': 'Decision Maker Identified',
    
    // Research & Intelligence
    'research_completed': 'Research Completed',
    'company_researched': 'Company Researched',
    'contact_researched': 'Contact Researched',
    'intelligence_gathered': 'Intelligence Gathered',
    
    // System Actions (for reference)
    'person_created': 'Person Created',
    'company_created': 'Company Created',
    'record_created': 'Record Created',
    'record_updated': 'Record Updated',
    'note_added': 'Note Added',
    'field_updated': 'Field Updated',
    'status_changed': 'Status Changed',
    'stage_advanced': 'Stage Advanced'
  };
  
  return descriptions[actionType] || actionType;
}

/**
 * Calculate the timing for the last action
 * 
 * NOTE: System action filtering should be done BEFORE calling this function.
 * Use isMeaningfulAction() from meaningfulActions.ts to filter actions first.
 * This function only calculates timing display text, not action filtering.
 * 
 * @param lastActionDate - The date of the last action
 * @param lastActionText - The text description of the last action
 * @returns The timing text for display
 */
export function calculateLastActionTiming(lastActionDate: Date | null, lastActionText: string | null): string {
  // If no date or text, return "Never"
  if (!lastActionDate || !lastActionText) {
    return 'Never';
  }
  
  const now = new Date();
  const daysSince = Math.floor((now.getTime() - new Date(lastActionDate).getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSince === 0) return 'Today';
  if (daysSince === 1) return 'Yesterday';
  if (daysSince <= 7) return `${daysSince} days ago`;
  if (daysSince <= 30) return `${Math.floor(daysSince / 7)} weeks ago`;
  return `${Math.floor(daysSince / 30)} months ago`;
}

/**
 * Calculate the timing for the next action
 * @param nextActionDate - The date of the next action
 * @returns The timing text for display
 */
export function calculateNextActionTiming(nextActionDate: Date | null): string {
  if (!nextActionDate) {
    return 'No date set';
  }
  
  const now = new Date();
  const actionDate = new Date(nextActionDate);
  const diffMs = actionDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 7) return 'This week';
  if (diffDays <= 14) return 'Next week';
  if (diffDays <= 30) return 'This month';
  return 'Future';
}

/**
 * Get the last action time from a record
 * @param record - The pipeline record
 * @returns The last action timestamp or null
 */
export function getLastActionTime(record: any): Date | null {
  const lastActionDate = record?.lastActionDate || record?.lastActionTime || record?.lastContactDate || record?.lastContact;
  if (!lastActionDate) return null;
  
  try {
    const date = new Date(lastActionDate);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Check if a date falls on a weekend (Saturday or Sunday)
 * @param date - The date to check
 * @returns true if the date is a weekend
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

/**
 * Add business days to a date, skipping weekends
 * @param startDate - The starting date
 * @param daysToAdd - Number of business days to add
 * @returns The new date with business days added
 */
export function addBusinessDays(startDate: Date, daysToAdd: number): Date {
  let currentDate = new Date(startDate);
  let addedDays = 0;
  
  while (addedDays < daysToAdd) {
    currentDate.setDate(currentDate.getDate() + 1);
    if (!isWeekend(currentDate)) {
      addedDays++;
    }
  }
  
  return currentDate;
}

/**
 * Get the next business day from a given date
 * @param date - The starting date
 * @returns The next business day
 */
export function getNextBusinessDay(date: Date): Date {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  
  // If it's Saturday, move to Monday
  if (nextDay.getDay() === 6) {
    nextDay.setDate(nextDay.getDate() + 2);
  }
  // If it's Sunday, move to Monday
  else if (nextDay.getDay() === 0) {
    nextDay.setDate(nextDay.getDate() + 1);
  }
  
  return nextDay;
}

/**
 * Calculate business days between two dates
 * @param startDate - The start date
 * @param endDate - The end date
 * @returns Number of business days between the dates
 */
export function getBusinessDaysBetween(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  
  while (current < endDate) {
    if (!isWeekend(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

/**
 * Get prospect temperature based on engagement signals and deal stage
 * @param record - The pipeline record
 * @returns Temperature level for timing adjustments
 */
export function getProspectTemperature(record: any): 'hot' | 'warm' | 'cold' {
  // Check for hot signals
  const hotSignals = [
    record?.status?.toLowerCase().includes('qualified'),
    record?.status?.toLowerCase().includes('proposal'),
    record?.status?.toLowerCase().includes('negotiation'),
    record?.priority === 'high',
    record?.score >= 85,
    record?.engagementLevel === 'high'
  ];
  
  if (hotSignals.some(signal => signal)) {
    return 'hot';
  }
  
  // Check for warm signals
  const warmSignals = [
    record?.status?.toLowerCase().includes('active'),
    record?.status?.toLowerCase().includes('interested'),
    record?.priority === 'medium',
    record?.score >= 60,
    record?.engagementLevel === 'medium'
  ];
  
  if (warmSignals.some(signal => signal)) {
    return 'warm';
  }
  
  // Default to cold
  return 'cold';
}

/**
 * Get a smart last action description from a record
 * @param record - The pipeline record
 * @returns A formatted last action description
 */
export function getSmartLastActionDescription(record: any): string {
  return record?.lastAction || record?.lastActionDescription || 'No action';
}

/**
 * Format last action time for display
 * @param date - The date to format
 * @returns Formatted date string
 */
export function formatLastActionTime(date: Date | null): string {
  if (!date) return 'Never';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 60) {
    return diffMinutes < 1 ? 'Just now' : `${diffMinutes}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks}w ago`;
  }
  return date.toLocaleDateString();
}

/**
 * Calculate health status based on record data
 * @param record - The pipeline record
 * @returns Health status object
 */
export function getHealthStatus(record: any): { status: string; color: string; score: number } {
  const lastActionTime = getLastActionTime(record);
  const now = new Date();
  
  if (!lastActionTime) {
    return { status: 'Cold', color: 'bg-red-100 text-red-800', score: 0 };
  }
  
  const diffDays = Math.floor((now.getTime() - lastActionTime.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 1) {
    return { status: 'Hot', color: 'bg-green-100 text-green-800', score: 100 };
  }
  if (diffDays <= 7) {
    return { status: 'Warm', color: 'bg-yellow-100 text-yellow-800', score: 75 };
  }
  if (diffDays <= 30) {
    return { status: 'Cool', color: 'bg-orange-100 text-orange-800', score: 50 };
  }
  
  return { status: 'Cold', color: 'bg-red-100 text-red-800', score: 25 };
}

/**
 * Get smart next action based on record context
 * @param record - The pipeline record
 * @returns Suggested next action text
 */
export function getSmartNextAction(record: any): string {
  const lastAction = record?.lastAction || record?.lastActionDescription || '';
  const status = record?.status?.toLowerCase() || '';
  
  // If no last action, suggest initial outreach
  if (!lastAction || lastAction === 'No action') {
    if (record?.email) {
      return 'Send initial email introduction';
    }
    if (record?.linkedinUrl) {
      return 'Send LinkedIn connection request';
    }
    return 'Make initial contact';
  }
  
  // Suggest follow-up based on last action type
  if (lastAction.toLowerCase().includes('email')) {
    return 'Follow up with phone call or LinkedIn message';
  }
  if (lastAction.toLowerCase().includes('linkedin')) {
    return 'Send follow-up email or schedule meeting';
  }
  if (lastAction.toLowerCase().includes('call') || lastAction.toLowerCase().includes('phone')) {
    return 'Send follow-up email with next steps';
  }
  if (lastAction.toLowerCase().includes('meeting')) {
    return 'Send meeting summary and next steps';
  }
  
  // Default suggestions based on status
  if (status === 'hot' || status === 'qualified') {
    return 'Schedule demo or proposal meeting';
  }
  if (status === 'warm') {
    return 'Send value-focused follow-up';
  }
  
  return 'Continue nurturing relationship';
}

/**
 * Get next action for leads with priority logic
 * @param record - The pipeline record
 * @param index - The record index (0-based)
 * @returns Next action object with timing and action text
 */
export function getLeadsNextAction(record: any, index: number): { timing: string; timingColor: string; action: string } {
  // Top 50 priority: always show "Today"
  if (index < 50) {
    return {
      timing: 'Today',
      timingColor: 'bg-red-100 text-red-800 border border-red-200',
      action: getSmartNextAction(record)
    };
  }
  
  // If nextActionDate exists, use it
  if (record?.nextActionDate) {
    const nextDate = new Date(record.nextActionDate);
    const now = new Date();
    const diffMs = nextDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return {
        timing: 'Overdue',
        timingColor: 'bg-red-100 text-red-800 border border-red-200',
        action: record?.nextAction || getSmartNextAction(record)
      };
    }
    if (diffDays === 0) {
      return {
        timing: 'Today',
        timingColor: 'bg-orange-100 text-orange-800 border border-orange-200',
        action: record?.nextAction || getSmartNextAction(record)
      };
    }
    if (diffDays <= 7) {
      return {
        timing: 'This week',
        timingColor: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
        action: record?.nextAction || getSmartNextAction(record)
      };
    }
    return {
      timing: 'Future',
      timingColor: 'bg-gray-100 text-gray-800 border border-gray-200',
      action: record?.nextAction || getSmartNextAction(record)
    };
  }
  
  // Calculate optimal timing based on last action
  const lastActionTime = getLastActionTime(record);
  const lastAction = record?.lastAction || record?.lastActionDescription || '';
  
  if (!lastActionTime || !lastAction || lastAction === 'No action') {
    return {
      timing: 'ASAP',
      timingColor: 'bg-red-100 text-red-800 border border-red-200',
      action: getSmartNextAction(record)
    };
  }
  
  const now = new Date();
  
  // Calculate business days since last action (Skip Miller principle: B2B sales happen Mon-Fri)
  const diffBusinessDays = getBusinessDaysBetween(lastActionTime, now);
  
  // Get prospect temperature for context-aware timing
  const temperature = getProspectTemperature(record);
  
  // Skip Miller ProActive Selling timing rules
  let optimalDays = 4; // Default: 4 business days
  
  if (lastAction.toLowerCase().includes('linkedin')) {
    optimalDays = 3; // LinkedIn actions: 3-4 business days (cold outreach standard)
  } else if (lastAction.toLowerCase().includes('email')) {
    optimalDays = 4; // Email: 3-5 business days (depends on stage)
  } else if (lastAction.toLowerCase().includes('call') || lastAction.toLowerCase().includes('phone')) {
    optimalDays = 2; // Phone call: 2-3 business days
  } else if (lastAction.toLowerCase().includes('meeting')) {
    optimalDays = 1; // Meeting follow-up: 1 business day (critical window)
  }
  
  // Apply temperature-based adjustments
  const temperatureMultiplier = temperature === 'hot' ? 0.7 : temperature === 'warm' ? 1.0 : 1.3;
  optimalDays = Math.round(optimalDays * temperatureMultiplier);
  
  // Calculate days until next action
  const daysUntilNext = optimalDays - diffBusinessDays;
  
  // Grace period: 2 business days before marking as "Overdue"
  const gracePeriod = 2;
  
  if (daysUntilNext < -gracePeriod) {
    return {
      timing: 'Overdue',
      timingColor: 'bg-red-100 text-red-800 border border-red-200',
      action: getSmartNextAction(record)
    };
  } else if (daysUntilNext <= 0) {
    return {
      timing: 'Due soon',
      timingColor: 'bg-orange-100 text-orange-800 border border-orange-200',
      action: getSmartNextAction(record)
    };
  } else if (daysUntilNext === 1) {
    return {
      timing: 'Tomorrow',
      timingColor: 'bg-orange-100 text-orange-800 border border-orange-200',
      action: getSmartNextAction(record)
    };
  } else if (daysUntilNext <= 3) {
    return {
      timing: 'This week',
      timingColor: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      action: getSmartNextAction(record)
    };
  } else if (daysUntilNext <= 7) {
    return {
      timing: 'Next week',
      timingColor: 'bg-blue-100 text-blue-800 border border-blue-200',
      action: getSmartNextAction(record)
    };
  }
  
  return {
    timing: 'Future',
    timingColor: 'bg-gray-100 text-gray-800 border border-gray-200',
    action: getSmartNextAction(record)
  };
}