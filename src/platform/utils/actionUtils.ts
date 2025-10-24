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
 * @param lastActionDate - The date of the last action
 * @param lastActionText - The text description of the last action
 * @returns The timing text for display
 */
export function calculateLastActionTiming(lastActionDate: Date | null, lastActionText: string | null): string {
  // System actions that should not count as real actions
  const systemActions = [
    'Record created',
    'No action taken',
    'Record updated',
    'Person created',
    'Company created'
  ];
  
  // If no date or it's a system action, return "Never"
  if (!lastActionDate || !lastActionText || systemActions.includes(lastActionText)) {
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