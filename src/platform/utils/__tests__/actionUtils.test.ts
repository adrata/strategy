import { isEngagementAction, isSystemAction, getActionDescription } from '../actionUtils';

describe('actionUtils', () => {
  describe('isEngagementAction', () => {
    it('should return true for email actions', () => {
      expect(isEngagementAction('cold_email')).toBe(true);
      expect(isEngagementAction('follow_up_email')).toBe(true);
      expect(isEngagementAction('email_conversation')).toBe(true);
      expect(isEngagementAction('email_sent')).toBe(true);
    });

    it('should return true for call actions', () => {
      expect(isEngagementAction('cold_call')).toBe(true);
      expect(isEngagementAction('discovery_call')).toBe(true);
      expect(isEngagementAction('phone_call')).toBe(true);
    });

    it('should return true for LinkedIn actions', () => {
      expect(isEngagementAction('linkedin_connection_request')).toBe(true);
      expect(isEngagementAction('linkedin_message')).toBe(true);
      expect(isEngagementAction('linkedin_inmail')).toBe(true);
    });

    it('should return true for meeting actions', () => {
      expect(isEngagementAction('meeting_scheduled')).toBe(true);
      expect(isEngagementAction('meeting_completed')).toBe(true);
      expect(isEngagementAction('demo_meeting')).toBe(true);
    });

    it('should return true for sales actions', () => {
      expect(isEngagementAction('proposal_sent')).toBe(true);
      expect(isEngagementAction('deal_closed')).toBe(true);
    });

    it('should return false for system actions', () => {
      expect(isEngagementAction('person_created')).toBe(false);
      expect(isEngagementAction('company_created')).toBe(false);
      expect(isEngagementAction('record_created')).toBe(false);
      expect(isEngagementAction('record_updated')).toBe(false);
    });

    it('should return false for unknown actions', () => {
      expect(isEngagementAction('unknown_action')).toBe(false);
      expect(isEngagementAction('')).toBe(false);
    });
  });

  describe('isSystemAction', () => {
    it('should return true for system actions', () => {
      expect(isSystemAction('person_created')).toBe(true);
      expect(isSystemAction('company_created')).toBe(true);
      expect(isSystemAction('record_created')).toBe(true);
      expect(isSystemAction('record_updated')).toBe(true);
      expect(isSystemAction('note_added')).toBe(true);
      expect(isSystemAction('field_updated')).toBe(true);
      expect(isSystemAction('status_changed')).toBe(true);
    });

    it('should return false for engagement actions', () => {
      expect(isSystemAction('cold_email')).toBe(false);
      expect(isSystemAction('phone_call')).toBe(false);
      expect(isSystemAction('meeting_scheduled')).toBe(false);
    });

    it('should return false for unknown actions', () => {
      expect(isSystemAction('unknown_action')).toBe(false);
      expect(isSystemAction('')).toBe(false);
    });
  });

  describe('getActionDescription', () => {
    it('should return human-readable descriptions for engagement actions', () => {
      expect(getActionDescription('cold_email')).toBe('Cold Email Outreach');
      expect(getActionDescription('phone_call')).toBe('Phone Call');
      expect(getActionDescription('meeting_scheduled')).toBe('Meeting Scheduled');
    });

    it('should return human-readable descriptions for system actions', () => {
      expect(getActionDescription('person_created')).toBe('Person Created');
      expect(getActionDescription('company_created')).toBe('Company Created');
    });

    it('should return the action type for unknown actions', () => {
      expect(getActionDescription('unknown_action')).toBe('unknown_action');
      expect(getActionDescription('')).toBe('');
    });
  });
});
