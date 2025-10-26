/**
 * Meaningful Action Types - Actions that should appear in Last Action column
 * These match the filtering logic used in the Actions tab
 */

/**
 * Action types that represent meaningful engagement activities
 * These should update lastAction fields and appear in the Last Action column
 */
export const MEANINGFUL_ACTION_TYPES = new Set([
  // LinkedIn Actions
  'LinkedIn Connection',
  'LinkedIn InMail', 
  'LinkedIn Message',
  'linkedin_connection_request',
  'linkedin_message',
  'linkedin_inmail',
  'linkedin_profile_viewed',
  'linkedin_post_liked',
  'linkedin_post_commented',
  
  // Phone Actions
  'Phone',
  'phone_call',
  'cold_call',
  'follow_up_call',
  'discovery_call',
  'qualification_call',
  'demo_call',
  'closing_call',
  'voicemail_left',
  'call_scheduled',
  'call_completed',
  
  // Email Actions
  'Email',
  'email_sent',
  'email_received',
  'email_replied',
  'email_forwarded',
  'cold_email',
  'follow_up_email',
  'email_conversation',
  
  // Meeting Actions
  'Meeting',
  'meeting_scheduled',
  'meeting_completed',
  'demo_meeting',
  'discovery_meeting',
  'proposal_meeting',
  'closing_meeting',
  'appointment',
  
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
  'decision_maker_identified'
]);

/**
 * Check if an action type represents a meaningful engagement activity
 * @param actionType - The action type to check
 * @returns true if this is a meaningful action that should update lastAction fields
 */
export function isMeaningfulAction(actionType: string): boolean {
  if (!actionType || typeof actionType !== 'string') {
    return false;
  }
  
  const lowerType = actionType.toLowerCase();
  
  // FIRST: Explicitly reject system actions (these should never be counted)
  if (lowerType.includes('created') || lowerType.includes('updated') || 
      lowerType.includes('imported') || lowerType.includes('deleted') ||
      lowerType.includes('viewed') || lowerType.includes('status_changed') ||
      lowerType.includes('data_update') || lowerType.includes('field_updated') ||
      lowerType.includes('note_added') || lowerType.includes('stage_advanced') ||
      lowerType === 'person_created' || lowerType === 'company_created' ||
      lowerType === 'record_created' || lowerType === 'record_updated') {
    return false;
  }
  
  // Check exact match first
  if (MEANINGFUL_ACTION_TYPES.has(actionType)) {
    return true;
  }
  
  // Only check for specific partial matches to avoid false positives
  // Check for common variations of meaningful actions
  if (lowerType.includes('linkedin') && 
      (lowerType.includes('connection') || lowerType.includes('message') || lowerType.includes('inmail'))) {
    return true;
  }
  
  if (lowerType.includes('phone') || lowerType.includes('call')) {
    return true;
  }
  
  if (lowerType.includes('email') && 
      (lowerType.includes('sent') || lowerType.includes('received') || lowerType.includes('reply'))) {
    return true;
  }
  
  if (lowerType.includes('meeting') || lowerType.includes('appointment')) {
    return true;
  }
  
  // If we get here, it's not a meaningful action
  return false;
}

/**
 * Get a human-readable description of the meaningful action type
 * @param actionType - The action type
 * @returns A formatted description of the action
 */
export function getMeaningfulActionDescription(actionType: string): string {
  const descriptions: Record<string, string> = {
    // LinkedIn Actions
    'LinkedIn Connection': 'LinkedIn Connection Request',
    'LinkedIn InMail': 'LinkedIn InMail Sent',
    'LinkedIn Message': 'LinkedIn Message Sent',
    'linkedin_connection_request': 'LinkedIn Connection Request',
    'linkedin_message': 'LinkedIn Message Sent',
    'linkedin_inmail': 'LinkedIn InMail Sent',
    'linkedin_profile_viewed': 'LinkedIn Profile Viewed',
    'linkedin_post_liked': 'LinkedIn Post Liked',
    'linkedin_post_commented': 'LinkedIn Post Commented',
    
    // Phone Actions
    'Phone': 'Phone Call',
    'phone_call': 'Phone Call',
    'cold_call': 'Cold Call',
    'follow_up_call': 'Follow-up Call',
    'discovery_call': 'Discovery Call',
    'qualification_call': 'Qualification Call',
    'demo_call': 'Demo Call',
    'closing_call': 'Closing Call',
    'voicemail_left': 'Voicemail Left',
    'call_scheduled': 'Call Scheduled',
    'call_completed': 'Call Completed',
    
    // Email Actions
    'Email': 'Email Sent',
    'email_sent': 'Email Sent',
    'email_received': 'Email Received',
    'email_replied': 'Email Replied',
    'email_forwarded': 'Email Forwarded',
    'cold_email': 'Cold Email Sent',
    'follow_up_email': 'Follow-up Email',
    'email_conversation': 'Email Conversation',
    
    // Meeting Actions
    'Meeting': 'Meeting',
    'meeting_scheduled': 'Meeting Scheduled',
    'meeting_completed': 'Meeting Completed',
    'demo_meeting': 'Demo Meeting',
    'discovery_meeting': 'Discovery Meeting',
    'proposal_meeting': 'Proposal Meeting',
    'closing_meeting': 'Closing Meeting',
    'appointment': 'Appointment',
    
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
    'decision_maker_identified': 'Decision Maker Identified'
  };
  
  return descriptions[actionType] || actionType;
}
