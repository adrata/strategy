"use client";

import { AIActionsService } from "@/platform/ai/services/AIActionsService";
import { PredictiveIntelligenceService } from "@/platform/ai/services/PredictiveIntelligenceService";

export interface SalesAction {
  id: string;
  type: 'call' | 'email' | 'linkedin' | 'demo' | 'follow_up' | 'research' | 'meeting';
  priority: 'critical' | 'high' | 'medium' | 'low';
  timing: 'immediate' | 'today' | 'this_week' | 'next_week';
  title: string;
  description: string;
  expectedOutcome: string;
  estimatedTime: number; // in minutes
  isCompleted: boolean;
  isAutoTracked: boolean;
  relatedContact?: any;
  relatedCompany?: string;
  targetMetric?: 'meetings' | 'emails' | 'calls' | 'demos' | 'opportunities';
  completedAt?: Date;
}

export interface DailySalesGoals {
  speedrunTarget: number; // 30 contacts per day
  meetingsTarget: number; // 3-5 meetings per day
  emailsTarget: number; // 25-30 emails per day
  callsTarget: number; // 15-20 calls per day
  demosTarget: number; // 1-2 demos per day
}

export class SpeedrunSalesActionsService {
  private static instance: SpeedrunSalesActionsService;
  
  static getInstance(): SpeedrunSalesActionsService {
    if (!this.instance) {
      this['instance'] = new SpeedrunSalesActionsService();
    }
    return this.instance;
  }

  /**
   * Generate optimal sales actions for the day based on speedrun targets
   */
  async generateDailySalesActions(
    speedrunProspects: any[],
    upcomingMeetings: any[],
    currentProgress: any,
    workspaceId: string
  ): Promise<SalesAction[]> {
    const actions: SalesAction[] = [];
    const today = new Date();
    const todayString = today.toDateString();

    // Get daily goals based on 30 speedrun target
    const dailyGoals = this.getDailyGoals();

    // 1. CRITICAL: Prep for upcoming meetings (auto-tracked)
    for (const meeting of upcomingMeetings.slice(0, 3)) {
      actions.push({
        id: `meeting-prep-${meeting.id}`,
        type: 'research',
        priority: 'critical',
        timing: 'immediate',
        title: `Prep for ${meeting.title}`,
        description: `Research attendees and prepare talking points for ${meeting.title} at ${new Date(meeting.startTime).toLocaleTimeString()}`,
        expectedOutcome: 'Well-prepared meeting with targeted value propositions',
        estimatedTime: 15,
        isCompleted: false,
        isAutoTracked: true,
        relatedCompany: meeting.company || 'Unknown',
        targetMetric: 'meetings'
      });
    }

    // 2. HIGH: Speedrun contact actions (first 10 high-priority contacts)
    const highPriorityContacts = speedrunProspects
      .filter(p => p['priority'] === 'high' || p.score >= 85)
      .slice(0, 10);

    for (const contact of highPriorityContacts) {
      // Generate personalized action based on contact data
      const action = await this.generatePersonalizedAction(contact, workspaceId);
      actions.push(action);
    }

    // 3. HIGH: Follow-up on recent outreach
    actions.push({
      id: 'follow-up-recent',
      type: 'follow_up',
      priority: 'high',
      timing: 'today',
      title: 'Follow up on recent outreach',
      description: 'Check responses from yesterday\'s emails and calls, prioritize hot leads',
      expectedOutcome: 'Convert 2-3 responses into meetings',
      estimatedTime: 30,
      isCompleted: false,
      isAutoTracked: false,
      targetMetric: 'meetings'
    });

    // 4. MEDIUM: Bulk email sequence for medium-priority contacts
    const mediumPriorityContacts = speedrunProspects
      .filter(p => p['priority'] === 'medium' || (p.score >= 70 && p.score < 85))
      .slice(0, 15);

    if (mediumPriorityContacts.length > 0) {
      actions.push({
        id: 'bulk-email-medium',
        type: 'email',
        priority: 'medium',
        timing: 'today',
        title: `Send personalized emails to ${mediumPriorityContacts.length} medium-priority contacts`,
        description: 'Use AI-generated templates with company-specific personalization',
        expectedOutcome: `Generate 3-5 responses from ${mediumPriorityContacts.length} contacts`,
        estimatedTime: 45,
        isCompleted: false,
        isAutoTracked: true,
        targetMetric: 'emails'
      });
    }

    // 5. MEDIUM: LinkedIn connection requests
    actions.push({
      id: 'linkedin-connections',
      type: 'linkedin',
      priority: 'medium',
      timing: 'today',
      title: 'Send 10 LinkedIn connection requests',
      description: 'Connect with decision makers from target companies with personalized messages',
      expectedOutcome: '7-8 connection acceptances, 2-3 conversations started',
      estimatedTime: 20,
      isCompleted: false,
      isAutoTracked: false,
      targetMetric: 'calls'
    });

    // 6. MEDIUM: Warm calling session
    const callableContacts = speedrunProspects
      .filter(p => p['phone'] && !p.lastContactedAt)
      .slice(0, 8);

    if (callableContacts.length > 0) {
      actions.push({
        id: 'warm-calling-session',
        type: 'call',
        priority: 'medium',
        timing: 'today',
        title: `Call ${callableContacts.length} warm prospects`,
        description: 'Power hour of calling prospects with recent engagement signals',
        expectedOutcome: '2-3 conversations, 1-2 meeting bookings',
        estimatedTime: 60,
        isCompleted: false,
        isAutoTracked: true,
        targetMetric: 'calls'
      });
    }

    // 7. LOW: Research new target accounts
    actions.push({
      id: 'research-new-accounts',
      type: 'research',
      priority: 'low',
      timing: 'this_week',
      title: 'Research 5 new target accounts',
      description: 'Identify expansion opportunities and new high-value prospects',
      expectedOutcome: 'Add 25 new qualified contacts to pipeline',
      estimatedTime: 45,
      isCompleted: false,
      isAutoTracked: false,
      targetMetric: 'opportunities'
    });

    // 8. Add goal-based actions to hit daily targets
    const goalActions = this.generateGoalBasedActions(dailyGoals, currentProgress);
    actions.push(...goalActions);

    // Sort by priority and timing
    return actions.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const timingOrder = { immediate: 0, today: 1, this_week: 2, next_week: 3 };
      
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return timingOrder[a.timing] - timingOrder[b.timing];
    });
  }

  /**
   * Generate personalized action for a specific contact
   */
  private async generatePersonalizedAction(contact: any, workspaceId: string): Promise<SalesAction> {
    try {
      // Use predictive intelligence to determine best action
      const leadScore = await PredictiveIntelligenceService.generateLeadScore(contact.id, workspaceId);
      const recommendedActions = leadScore.recommendedActions || [];
      
      if (recommendedActions.length > 0) {
        const topAction = recommendedActions[0];
        return {
          id: `personalized-${contact.id}`,
          type: topAction.type as any,
          priority: topAction.priority as any,
          timing: topAction.timing as any,
          title: `${topAction.message} - ${contact.name}`,
          description: `${topAction.reasoning} (${contact.company})`,
          expectedOutcome: topAction.expectedOutcome || 'Move lead forward',
          estimatedTime: this.getEstimatedTime(topAction.type),
          isCompleted: false,
          isAutoTracked: topAction['type'] === 'email' || topAction['type'] === 'call',
          relatedContact: contact,
          relatedCompany: contact.company,
          targetMetric: this.getTargetMetric(topAction.type)
        };
      }
    } catch (error) {
      console.warn('Failed to generate personalized action:', error);
    }

    // Fallback to generic action
    return {
      id: `generic-${contact.id}`,
      type: 'email',
      priority: 'high',
      timing: 'today',
      title: `Reach out to ${contact.name}`,
      description: `Send personalized email to ${contact.name} at ${contact.company}`,
      expectedOutcome: 'Generate response and potential meeting',
      estimatedTime: 10,
      isCompleted: false,
      isAutoTracked: true,
      relatedContact: contact,
      relatedCompany: contact.company,
      targetMetric: 'emails'
    };
  }

  /**
   * Generate actions to hit daily goals
   */
  private generateGoalBasedActions(goals: DailySalesGoals, currentProgress: any): SalesAction[] {
    const actions: SalesAction[] = [];
    const remaining = {
      meetings: Math.max(0, goals.meetingsTarget - (currentProgress.meetings || 0)),
      emails: Math.max(0, goals.emailsTarget - (currentProgress.emails || 0)),
      calls: Math.max(0, goals.callsTarget - (currentProgress.calls || 0)),
      demos: Math.max(0, goals.demosTarget - (currentProgress.demos || 0))
    };

    // Add actions to close gaps
    if (remaining.meetings > 0) {
      actions.push({
        id: 'book-meetings',
        type: 'follow_up',
        priority: 'high',
        timing: 'today',
        title: `Book ${remaining.meetings} more meetings`,
        description: 'Focus on converting warm leads into scheduled meetings',
        expectedOutcome: `Hit daily target of ${goals.meetingsTarget} meetings`,
        estimatedTime: remaining.meetings * 15,
        isCompleted: false,
        isAutoTracked: true,
        targetMetric: 'meetings'
      });
    }

    if (remaining.emails > 5) {
      actions.push({
        id: 'email-sprint',
        type: 'email',
        priority: 'medium',
        timing: 'today',
        title: `Send ${remaining.emails} more emails`,
        description: 'Use templates and AI assistance for efficient outreach',
        expectedOutcome: `Hit daily target of ${goals.emailsTarget} emails`,
        estimatedTime: Math.min(60, remaining.emails * 2),
        isCompleted: false,
        isAutoTracked: true,
        targetMetric: 'emails'
      });
    }

    return actions;
  }

  /**
   * Get daily goals based on 30 speedrun target
   */
  private getDailyGoals(): DailySalesGoals {
    return {
      speedrunTarget: 30,
      meetingsTarget: 4,
      emailsTarget: 25,
      callsTarget: 15,
      demosTarget: 1
    };
  }

  /**
   * Mark action as completed
   */
  markActionCompleted(actionId: string): void {
    // Store completion in localStorage
    const completedActions = this.getCompletedActions();
    const today = new Date().toDateString();
    
    if (!completedActions[today]) {
      completedActions[today] = [];
    }
    
    if (!completedActions[today].includes(actionId)) {
      completedActions[today].push(actionId);
      localStorage.setItem('speedrun-completed-actions', JSON.stringify(completedActions));
    }
  }

  /**
   * Get completed actions for today
   */
  getCompletedActions(): Record<string, string[]> {
    try {
      const stored = localStorage.getItem('speedrun-completed-actions');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  /**
   * Check if action is completed
   */
  isActionCompleted(actionId: string): boolean {
    const completedActions = this.getCompletedActions();
    const today = new Date().toDateString();
    return completedActions[today]?.includes(actionId) || false;
  }

  private getEstimatedTime(actionType: string): number {
    const timeMap: Record<string, number> = {
      email: 8,
      call: 15,
      linkedin: 5,
      demo: 60,
      follow_up: 10,
      research: 20,
      meeting: 30
    };
    return timeMap[actionType] || 15;
  }

  private getTargetMetric(actionType: string): 'meetings' | 'emails' | 'calls' | 'demos' | 'opportunities' {
    const metricMap: Record<string, any> = {
      email: 'emails',
      call: 'calls',
      linkedin: 'calls',
      demo: 'demos',
      follow_up: 'meetings',
      research: 'opportunities',
      meeting: 'meetings'
    };
    return metricMap[actionType] || 'opportunities';
  }
}
