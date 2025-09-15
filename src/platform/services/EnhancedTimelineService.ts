/**
 * 📅 ENHANCED TIMELINE SERVICE - COMPLETE ACTION INTEGRATION
 * 
 * This service provides a unified timeline view that integrates:
 * - All actions from the complete action model
 * - Email messages and threads
 * - Notes and comments
 * - System events and CRUD operations
 * - AI-generated insights and recommendations
 */

import { PrismaClient } from '@prisma/client';
import { completeActionModel, CompleteAction } from './CompleteActionModel';

export interface TimelineEvent {
  id: string;
  type: 'action' | 'email' | 'note' | 'system' | 'ai_insight';
  date: Date;
  title: string;
  description?: string;
  user?: string;
  status?: string;
  priority?: string;
  metadata?: any;
  relatedEntities?: {
    personId?: string;
    companyId?: string;
    leadId?: string;
    prospectId?: string;
    opportunityId?: string;
  };
  // Email-specific fields
  emailThreadId?: string;
  emailDirection?: 'sent' | 'received';
  // AI-specific fields
  aiConfidence?: number;
  aiReasoning?: string;
  // Action-specific fields
  actionType?: string;
  actionOutcome?: string;
  duration?: number;
}

export interface TimelineFilters {
  entityType?: 'person' | 'company' | 'lead' | 'prospect' | 'opportunity';
  entityId?: string;
  eventTypes?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  userId?: string;
  priority?: string;
  status?: string;
}

export interface TimelineStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByUser: Record<string, number>;
  eventsByPriority: Record<string, number>;
  averageEventsPerDay: number;
  mostActiveDay: string;
  engagementScore: number;
}

export class EnhancedTimelineService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get complete timeline for an entity
   */
  async getEntityTimeline(
    workspaceId: string,
    entityType: 'person' | 'company' | 'lead' | 'prospect' | 'opportunity',
    entityId: string,
    filters?: TimelineFilters
  ): Promise<TimelineEvent[]> {
    const events: TimelineEvent[] = [];

    // 1. Get actions from complete action model
    const actions = await completeActionModel.getActionsForEntity(
      workspaceId,
      entityType,
      entityId,
      100
    );

    // Convert actions to timeline events
    const actionEvents = actions.map(action => ({
      id: action.id,
      type: 'action' as const,
      date: action.completedAt || action.createdAt,
      title: action.subject,
      description: action.description,
      user: action.userId,
      status: action.status,
      priority: action.priority,
      metadata: action.metadata,
      relatedEntities: {
        personId: action.personId,
        companyId: action.companyId,
        leadId: action.leadId,
        prospectId: action.prospectId,
        opportunityId: action.opportunityId
      },
      actionType: action.type,
      actionOutcome: action.outcome,
      duration: action.duration
    }));

    events.push(...actionEvents);

    // 2. Get email messages
    const emailEvents = await this.getEmailTimelineEvents(workspaceId, entityType, entityId);
    events.push(...emailEvents);

    // 3. Get notes
    const noteEvents = await this.getNoteTimelineEvents(workspaceId, entityType, entityId);
    events.push(...noteEvents);

    // 4. Get system events (record creation, updates)
    const systemEvents = await this.getSystemTimelineEvents(workspaceId, entityType, entityId);
    events.push(...systemEvents);

    // 5. Get AI insights
    const aiEvents = await this.getAITimelineEvents(workspaceId, entityType, entityId);
    events.push(...aiEvents);

    // 6. Sort by date (newest first)
    events.sort((a, b) => b.date.getTime() - a.date.getTime());

    // 7. Apply filters
    return this.applyTimelineFilters(events, filters);
  }

  /**
   * Get email timeline events
   */
  private async getEmailTimelineEvents(
    workspaceId: string,
    entityType: string,
    entityId: string
  ): Promise<TimelineEvent[]> {
    // Get email accounts for the workspace first
    const emailAccounts = await this.prisma.email_accounts.findMany({
      where: { workspaceId },
      select: { id: true }
    });
    
    const accountIds = emailAccounts.map(account => account.id);
    
    if (accountIds.length === 0) {
      return [];
    }
    
    // Find emails related to this entity
    const emails = await this.prisma.email_messages.findMany({
      where: {
        accountId: { in: accountIds },
        OR: [
          { to: { has: entityId } },
          { from: entityId },
          { cc: { has: entityId } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return emails.map(email => ({
      id: `email_${email.id}`,
      type: 'email' as const,
      date: email.sentAt || email.receivedAt || email.createdAt,
      title: email.subject || 'Email Communication',
      description: this.truncateText(email.body || '', 200),
      user: email.userId || 'system',
      metadata: {
        emailId: email.id,
        messageId: email.messageId,
        threadId: email.threadId,
        direction: email.direction,
        isRead: email.isRead,
        isImportant: email.isImportant
      },
      emailThreadId: email.threadId,
      emailDirection: email.direction as 'sent' | 'received'
    }));
  }

  /**
   * Get note timeline events
   */
  private async getNoteTimelineEvents(
    workspaceId: string,
    entityType: string,
    entityId: string
  ): Promise<TimelineEvent[]> {
    const notes = await this.prisma.notes.findMany({
      where: {
        workspaceId,
        OR: [
          { personId: entityType === 'person' ? entityId : undefined },
          { companyId: entityType === 'company' ? entityId : undefined },
          { leadId: entityType === 'lead' ? entityId : undefined },
          { prospectId: entityType === 'prospect' ? entityId : undefined },
          { opportunityId: entityType === 'opportunity' ? entityId : undefined }
        ].filter(Boolean)
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return notes.map(note => ({
      id: `note_${note.id}`,
      type: 'note' as const,
      date: note.createdAt,
      title: note.title || 'Note Added',
      description: this.truncateText(note.content || '', 200),
      user: note.userId || 'system',
      metadata: {
        noteId: note.id,
        noteType: note.type,
        isPrivate: note.isPrivate
      }
    }));
  }

  /**
   * Get system timeline events (record creation, updates)
   */
  private async getSystemTimelineEvents(
    workspaceId: string,
    entityType: string,
    entityId: string
  ): Promise<TimelineEvent[]> {
    const events: TimelineEvent[] = [];

    // Get record creation event
    let record: any = null;
    try {
      switch (entityType) {
        case 'person':
          record = await this.prisma.people.findUnique({ where: { id: entityId } });
          break;
        case 'company':
          record = await this.prisma.companies.findUnique({ where: { id: entityId } });
          break;
        case 'lead':
          record = await this.prisma.leads.findUnique({ where: { id: entityId } });
          break;
        case 'prospect':
          record = await this.prisma.prospects.findUnique({ where: { id: entityId } });
          break;
        case 'opportunity':
          record = await this.prisma.opportunities.findUnique({ where: { id: entityId } });
          break;
      }

      if (record && record.createdAt) {
        events.push({
          id: `system_${entityType}_created_${entityId}`,
          type: 'system' as const,
          date: record.createdAt,
          title: `${this.getEntityDisplayName(entityType)} created`,
          description: `New ${entityType} record added to system`,
          user: record.createdBy || 'system',
          metadata: {
            operation: 'create',
            entityType,
            entityId
          }
        });
      }
    } catch (error) {
      console.error('Error getting system events:', error);
    }

    return events;
  }

  /**
   * Get AI timeline events (insights, recommendations)
   */
  private async getAITimelineEvents(
    workspaceId: string,
    entityType: string,
    entityId: string
  ): Promise<TimelineEvent[]> {
    // This would integrate with your AI services to get insights
    // For now, return empty array - implement based on your AI services
    return [];
  }

  /**
   * Apply timeline filters
   */
  private applyTimelineFilters(events: TimelineEvent[], filters?: TimelineFilters): TimelineEvent[] {
    if (!filters) return events;

    return events.filter(event => {
      // Filter by event types
      if (filters.eventTypes && !filters.eventTypes.includes(event.type)) {
        return false;
      }

      // Filter by date range
      if (filters.dateRange) {
        if (event.date < filters.dateRange.start || event.date > filters.dateRange.end) {
          return false;
        }
      }

      // Filter by user
      if (filters.userId && event.user !== filters.userId) {
        return false;
      }

      // Filter by priority
      if (filters.priority && event.priority !== filters.priority) {
        return false;
      }

      // Filter by status
      if (filters.status && event.status !== filters.status) {
        return false;
      }

      return true;
    });
  }

  /**
   * Get timeline statistics
   */
  async getTimelineStats(
    workspaceId: string,
    entityType: string,
    entityId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<TimelineStats> {
    const events = await this.getEntityTimeline(workspaceId, entityType as any, entityId, {
      dateRange
    });

    const eventsByType: Record<string, number> = {};
    const eventsByUser: Record<string, number> = {};
    const eventsByPriority: Record<string, number> = {};

    events.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsByUser[event.user || 'unknown'] = (eventsByUser[event.user || 'unknown'] || 0) + 1;
      if (event.priority) {
        eventsByPriority[event.priority] = (eventsByPriority[event.priority] || 0) + 1;
      }
    });

    // Calculate engagement score
    const engagementScore = this.calculateEngagementScore(events);

    // Find most active day
    const eventsByDay: Record<string, number> = {};
    events.forEach(event => {
      const day = event.date.toISOString().split('T')[0];
      eventsByDay[day] = (eventsByDay[day] || 0) + 1;
    });

    const mostActiveDay = Object.entries(eventsByDay)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

    // Calculate average events per day
    const days = dateRange ? 
      Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) :
      30; // Default to 30 days
    const averageEventsPerDay = events.length / days;

    return {
      totalEvents: events.length,
      eventsByType,
      eventsByUser,
      eventsByPriority,
      averageEventsPerDay,
      mostActiveDay,
      engagementScore
    };
  }

  /**
   * Calculate engagement score based on timeline activity
   */
  private calculateEngagementScore(events: TimelineEvent[]): number {
    if (events.length === 0) return 0;

    let score = 0;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    events.forEach(event => {
      // Base score for any event
      score += 1;

      // Bonus for recent events (within 30 days)
      if (event.date > thirtyDaysAgo) {
        score += 2;
      }

      // Bonus for high-priority events
      if (event.priority === 'high' || event.priority === 'critical') {
        score += 3;
      }

      // Bonus for completed actions
      if (event.type === 'action' && event.status === 'completed') {
        score += 2;
      }

      // Bonus for email responses
      if (event.type === 'email' && event.emailDirection === 'received') {
        score += 1;
      }
    });

    // Normalize score to 0-100
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Get entity display name
   */
  private getEntityDisplayName(entityType: string): string {
    switch (entityType) {
      case 'person': return 'Contact';
      case 'company': return 'Company';
      case 'lead': return 'Lead';
      case 'prospect': return 'Prospect';
      case 'opportunity': return 'Opportunity';
      default: return entityType.charAt(0).toUpperCase() + entityType.slice(1);
    }
  }

  /**
   * Truncate text to specified length
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  /**
   * Get timeline for multiple entities (cross-entity view)
   */
  async getCrossEntityTimeline(
    workspaceId: string,
    entityIds: { type: string; id: string }[],
    filters?: TimelineFilters
  ): Promise<TimelineEvent[]> {
    const allEvents: TimelineEvent[] = [];

    for (const entity of entityIds) {
      const events = await this.getEntityTimeline(
        workspaceId,
        entity.type as any,
        entity.id,
        filters
      );
      allEvents.push(...events);
    }

    // Sort by date (newest first)
    allEvents.sort((a, b) => b.date.getTime() - a.date.getTime());

    return allEvents;
  }

  /**
   * Get timeline insights and recommendations
   */
  async getTimelineInsights(
    workspaceId: string,
    entityType: string,
    entityId: string
  ): Promise<any> {
    const events = await this.getEntityTimeline(workspaceId, entityType as any, entityId);
    const stats = await this.getTimelineStats(workspaceId, entityType, entityId);

    const insights = {
      engagementTrend: this.analyzeEngagementTrend(events),
      communicationPattern: this.analyzeCommunicationPattern(events),
      actionEffectiveness: this.analyzeActionEffectiveness(events),
      recommendations: this.generateTimelineRecommendations(events, stats)
    };

    return insights;
  }

  /**
   * Analyze engagement trend
   */
  private analyzeEngagementTrend(events: TimelineEvent[]): any {
    const last30Days = events.filter(e => 
      e.date > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    const previous30Days = events.filter(e => {
      const date = e.date;
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      return date > sixtyDaysAgo && date <= thirtyDaysAgo;
    });

    const currentEngagement = last30Days.length;
    const previousEngagement = previous30Days.length;
    const trend = currentEngagement > previousEngagement ? 'increasing' : 
                 currentEngagement < previousEngagement ? 'decreasing' : 'stable';

    return {
      trend,
      currentEngagement,
      previousEngagement,
      changePercent: previousEngagement > 0 ? 
        ((currentEngagement - previousEngagement) / previousEngagement) * 100 : 0
    };
  }

  /**
   * Analyze communication pattern
   */
  private analyzeCommunicationPattern(events: TimelineEvent[]): any {
    const emailEvents = events.filter(e => e.type === 'email');
    const sentEmails = emailEvents.filter(e => e.emailDirection === 'sent');
    const receivedEmails = emailEvents.filter(e => e.emailDirection === 'received');

    return {
      totalEmails: emailEvents.length,
      sentEmails: sentEmails.length,
      receivedEmails: receivedEmails.length,
      responseRate: sentEmails.length > 0 ? (receivedEmails.length / sentEmails.length) * 100 : 0,
      averageResponseTime: this.calculateAverageResponseTime(emailEvents)
    };
  }

  /**
   * Analyze action effectiveness
   */
  private analyzeActionEffectiveness(events: TimelineEvent[]): any {
    const actionEvents = events.filter(e => e.type === 'action');
    const completedActions = actionEvents.filter(e => e.status === 'completed');
    const highPriorityActions = actionEvents.filter(e => e.priority === 'high' || e.priority === 'critical');

    return {
      totalActions: actionEvents.length,
      completedActions: completedActions.length,
      completionRate: actionEvents.length > 0 ? (completedActions.length / actionEvents.length) * 100 : 0,
      highPriorityActions: highPriorityActions.length,
      averageActionDuration: this.calculateAverageActionDuration(actionEvents)
    };
  }

  /**
   * Generate timeline recommendations
   */
  private generateTimelineRecommendations(events: TimelineEvent[], stats: TimelineStats): string[] {
    const recommendations: string[] = [];

    if (stats.engagementScore < 30) {
      recommendations.push('Low engagement detected. Consider increasing outreach frequency or diversifying communication channels.');
    }

    if (stats.eventsByType.email && stats.eventsByType.action) {
      const emailToActionRatio = stats.eventsByType.email / stats.eventsByType.action;
      if (emailToActionRatio > 3) {
        recommendations.push('High email-to-action ratio. Consider following up with calls or meetings.');
      }
    }

    if (stats.averageEventsPerDay < 0.5) {
      recommendations.push('Low activity level. Consider setting up automated follow-up sequences.');
    }

    return recommendations;
  }

  /**
   * Calculate average response time
   */
  private calculateAverageResponseTime(emailEvents: TimelineEvent[]): number {
    // Simplified implementation - would need more sophisticated logic for actual response time calculation
    return 0;
  }

  /**
   * Calculate average action duration
   */
  private calculateAverageActionDuration(actionEvents: TimelineEvent[]): number {
    const eventsWithDuration = actionEvents.filter(e => e.duration && e.duration > 0);
    if (eventsWithDuration.length === 0) return 0;
    
    const totalDuration = eventsWithDuration.reduce((sum, e) => sum + (e.duration || 0), 0);
    return totalDuration / eventsWithDuration.length;
  }
}

// Export singleton instance
export const enhancedTimelineService = new EnhancedTimelineService();
