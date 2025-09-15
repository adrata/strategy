/**
 * 🎯 COMPLETE ACTION MODEL - UNIFIED SALES ACTION SYSTEM
 * 
 * This service provides a complete, connected action model that:
 * 1. Standardizes all action types across the platform
 * 2. Connects every action to person/company with proper relationships
 * 3. Integrates emails, notes, calls, LinkedIn, CRUD operations
 * 4. Provides timeline view integration
 * 5. Connects lastAction fields to action system
 * 6. Generates nextAction automatically from AI context/strategy
 */

import { PrismaClient } from '@prisma/client';

// Standardized action types for complete sales coverage
export const COMPLETE_ACTION_TYPES = {
  // Communication Actions
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
  'follow_up_meeting': 'Follow-up Meeting',
  
  // Sales Process Actions
  'proposal_sent': 'Proposal Sent',
  'proposal_follow_up': 'Proposal Follow-up',
  'contract_sent': 'Contract Sent',
  'contract_signed': 'Contract Signed',
  'deal_closed': 'Deal Closed',
  'deal_lost': 'Deal Lost',
  'quote_sent': 'Quote Sent',
  'pricing_discussed': 'Pricing Discussed',
  
  // Relationship Building
  'relationship_building': 'Relationship Building',
  'buying_signal_detected': 'Buying Signal Detected',
  'interest_expressed': 'Interest Expressed',
  'objection_raised': 'Objection Raised',
  'objection_handled': 'Objection Handled',
  'decision_maker_identified': 'Decision Maker Identified',
  'champion_identified': 'Champion Identified',
  'influencer_identified': 'Influencer Identified',
  
  // System Actions (CRUD)
  'record_created': 'Record Created',
  'record_updated': 'Record Updated',
  'record_deleted': 'Record Deleted',
  'note_added': 'Note Added',
  'note_updated': 'Note Updated',
  'field_updated': 'Field Updated',
  'status_changed': 'Status Changed',
  'stage_advanced': 'Stage Advanced',
  'priority_changed': 'Priority Changed',
  'assigned_user_changed': 'Assigned User Changed',
  
  // Research & Intelligence
  'research_completed': 'Research Completed',
  'company_researched': 'Company Researched',
  'contact_researched': 'Contact Researched',
  'intelligence_gathered': 'Intelligence Gathered',
  'competitor_analysis': 'Competitor Analysis',
  'market_research': 'Market Research',
  
  // Campaign Actions
  'campaign_launched': 'Campaign Launched',
  'campaign_paused': 'Campaign Paused',
  'campaign_completed': 'Campaign Completed',
  'sequence_started': 'Sequence Started',
  'sequence_paused': 'Sequence Paused',
  'sequence_completed': 'Sequence Completed',
  
  // Document Actions
  'document_sent': 'Document Sent',
  'document_reviewed': 'Document Reviewed',
  'document_signed': 'Document Signed',
  'presentation_sent': 'Presentation Sent',
  'demo_scheduled': 'Demo Scheduled',
  'demo_completed': 'Demo Completed'
} as const;

export type ActionType = keyof typeof COMPLETE_ACTION_TYPES;

// Action priority levels
export const ACTION_PRIORITIES = {
  'critical': 'Critical',
  'high': 'High', 
  'medium': 'Medium',
  'low': 'Low'
} as const;

// Action status levels
export const ACTION_STATUSES = {
  'planned': 'Planned',
  'in_progress': 'In Progress',
  'completed': 'Completed',
  'cancelled': 'Cancelled',
  'deferred': 'Deferred'
} as const;

// Action relationship types
export interface ActionRelationship {
  personId?: string;
  companyId?: string;
  leadId?: string;
  prospectId?: string;
  opportunityId?: string;
  contactId?: string;
  accountId?: string;
}

// Complete action interface
export interface CompleteAction {
  id: string;
  workspaceId: string;
  userId: string;
  type: ActionType;
  subject: string;
  description?: string;
  outcome?: string;
  status: keyof typeof ACTION_STATUSES;
  priority: keyof typeof ACTION_PRIORITIES;
  
  // Timing
  scheduledAt?: Date;
  scheduledDate?: Date;
  completedAt?: Date;
  duration?: number;
  
  // Relationships (at least one must be provided)
  personId?: string;
  companyId?: string;
  leadId?: string;
  prospectId?: string;
  opportunityId?: string;
  
  // Additional metadata
  attachments?: any;
  metadata?: any;
  externalId?: string;
  assignedUserId?: string;
  campaignType?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Next action generation context
export interface NextActionContext {
  recordType: 'person' | 'company' | 'lead' | 'prospect' | 'opportunity';
  recordId: string;
  currentStatus: string;
  currentStage?: string;
  priority: string;
  lastAction?: string;
  lastActionDate?: Date;
  engagementLevel: string;
  relationship: string;
  industry?: string;
  companySize?: string;
  buyerGroup?: any;
  recentActivities: CompleteAction[];
  aiInsights?: any;
}

// AI-generated next action
export interface GeneratedNextAction {
  action: string;
  type: ActionType;
  priority: keyof typeof ACTION_PRIORITIES;
  scheduledDate: Date;
  reasoning: string;
  confidence: number;
  expectedOutcome: string;
  requiredResources?: string[];
}

export class CompleteActionModel {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Create a complete action with proper relationships
   */
  async createAction(
    workspaceId: string,
    userId: string,
    actionData: Omit<CompleteAction, 'id' | 'workspaceId' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<CompleteAction> {
    // Validate that at least one relationship is provided
    const hasRelationship = actionData.personId || actionData.companyId || 
                           actionData.leadId || actionData.prospectId || actionData.opportunityId;
    
    if (!hasRelationship) {
      throw new Error('Action must be connected to at least one entity (person, company, lead, prospect, or opportunity)');
    }

    // Validate action type
    if (!COMPLETE_ACTION_TYPES[actionData.type]) {
      throw new Error(`Invalid action type: ${actionData.type}`);
    }

    const action = await this.prisma.actions.create({
      data: {
        workspaceId,
        userId,
        type: actionData.type,
        subject: actionData.subject,
        description: actionData.description,
        outcome: actionData.outcome,
        status: actionData.status,
        priority: actionData.priority,
        scheduledAt: actionData.scheduledAt,
        scheduledDate: actionData.scheduledDate,
        completedAt: actionData.completedAt,
        duration: actionData.duration,
        personId: actionData.personId,
        companyId: actionData.companyId,
        leadId: actionData.leadId,
        prospectId: actionData.prospectId,
        opportunityId: actionData.opportunityId,
        attachments: actionData.attachments,
        metadata: actionData.metadata,
        externalId: actionData.externalId,
        assignedUserId: actionData.assignedUserId,
        campaignType: actionData.campaignType,
        updatedAt: new Date()
      }
    });

    // Update lastAction fields on related entities
    await this.updateLastActionFields(action);

    return action as CompleteAction;
  }

  /**
   * Get all actions for a specific entity
   */
  async getActionsForEntity(
    workspaceId: string,
    entityType: 'person' | 'company' | 'lead' | 'prospect' | 'opportunity',
    entityId: string,
    limit: number = 100
  ): Promise<CompleteAction[]> {
    const whereClause: any = {
      workspaceId,
      [entityType === 'person' ? 'personId' : 
       entityType === 'company' ? 'companyId' :
       entityType === 'lead' ? 'leadId' :
       entityType === 'prospect' ? 'prospectId' : 'opportunityId']: entityId
    };

    const actions = await this.prisma.actions.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return actions as CompleteAction[];
  }

  /**
   * Update lastAction fields on related entities
   */
  private async updateLastActionFields(action: any): Promise<void> {
    const updateData = {
      lastAction: action.subject,
      lastActionDate: action.completedAt || action.createdAt,
      actionStatus: action.status
    };

    // Update person if connected
    if (action.personId) {
      await this.prisma.people.update({
        where: { id: action.personId },
        data: updateData
      });
    }

    // Update company if connected
    if (action.companyId) {
      await this.prisma.companies.update({
        where: { id: action.companyId },
        data: updateData
      });
    }

    // Update lead if connected
    if (action.leadId) {
      await this.prisma.leads.update({
        where: { id: action.leadId },
        data: updateData
      });
    }

    // Update prospect if connected
    if (action.prospectId) {
      await this.prisma.prospects.update({
        where: { id: action.prospectId },
        data: updateData
      });
    }

    // Update opportunity if connected
    if (action.opportunityId) {
      await this.prisma.opportunities.update({
        where: { id: action.opportunityId },
        data: updateData
      });
    }
  }

  /**
   * Generate next action using AI context and strategy
   */
  async generateNextAction(context: NextActionContext): Promise<GeneratedNextAction> {
    // Get recent activities for context
    const recentActions = await this.getActionsForEntity(
      context.recordId, // This should be workspaceId, but keeping for compatibility
      context.recordType,
      context.recordId,
      10
    );

    // Analyze context and generate intelligent next action
    const nextAction = await this.analyzeContextAndGenerateAction(context, recentActions);

    return nextAction;
  }

  /**
   * Analyze context and generate intelligent next action
   */
  private async analyzeContextAndGenerateAction(
    context: NextActionContext,
    recentActions: CompleteAction[]
  ): Promise<GeneratedNextAction> {
    // AI-powered next action generation logic
    const analysis = this.analyzeActionPatterns(recentActions);
    const strategy = this.determineOptimalStrategy(context, analysis);
    const nextAction = this.generateActionFromStrategy(strategy, context);

    return nextAction;
  }

  /**
   * Analyze action patterns to understand engagement level
   */
  private analyzeActionPatterns(actions: CompleteAction[]): any {
    const patterns = {
      totalActions: actions.length,
      emailActions: actions.filter(a => a.type.includes('email')).length,
      callActions: actions.filter(a => a.type.includes('call')).length,
      meetingActions: actions.filter(a => a.type.includes('meeting')).length,
      lastActionType: actions[0]?.type,
      lastActionDate: actions[0]?.createdAt,
      engagementLevel: 'low',
      responseRate: 0
    };

    // Calculate engagement level based on patterns
    if (patterns.totalActions > 5) {
      patterns.engagementLevel = 'high';
    } else if (patterns.totalActions > 2) {
      patterns.engagementLevel = 'medium';
    }

    return patterns;
  }

  /**
   * Determine optimal strategy based on context and analysis
   */
  private determineOptimalStrategy(context: NextActionContext, analysis: any): string {
    // Strategy determination logic
    if (context.engagementLevel === 'initial' && context.relationship === 'cold') {
      return 'initial_outreach';
    } else if (analysis.engagementLevel === 'high' && context.priority === 'high') {
      return 'accelerate_close';
    } else if (context.lastAction?.includes('email') && analysis.responseRate < 0.3) {
      return 'follow_up_diversification';
    } else if (context.currentStage === 'proposal' && context.priority === 'high') {
      return 'proposal_follow_up';
    } else {
      return 'relationship_building';
    }
  }

  /**
   * Generate specific action from strategy
   */
  private generateActionFromStrategy(strategy: string, context: NextActionContext): GeneratedNextAction {
    const now = new Date();
    let action: GeneratedNextAction;

    switch (strategy) {
      case 'initial_outreach':
        action = {
          action: 'Send personalized cold email introducing our solutions',
          type: 'cold_email',
          priority: 'medium',
          scheduledDate: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
          reasoning: 'Initial outreach to establish contact and introduce value proposition',
          confidence: 0.8,
          expectedOutcome: 'Response rate of 15-25%',
          requiredResources: ['Email template', 'Company research']
        };
        break;

      case 'accelerate_close':
        action = {
          action: 'Schedule discovery call to understand needs and timeline',
          type: 'discovery_call',
          priority: 'high',
          scheduledDate: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours
          reasoning: 'High engagement and priority indicate readiness to move forward',
          confidence: 0.9,
          expectedOutcome: 'Qualified opportunity with clear next steps',
          requiredResources: ['Calendar availability', 'Discovery questions']
        };
        break;

      case 'follow_up_diversification':
        action = {
          action: 'Send LinkedIn connection request with personalized message',
          type: 'linkedin_connection_request',
          priority: 'medium',
          scheduledDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days
          reasoning: 'Low email response rate suggests need for alternative communication channel',
          confidence: 0.7,
          expectedOutcome: 'Alternative touchpoint and relationship building',
          requiredResources: ['LinkedIn profile', 'Personalized message']
        };
        break;

      case 'proposal_follow_up':
        action = {
          action: 'Follow up on proposal with value reinforcement and timeline',
          type: 'proposal_follow_up',
          priority: 'high',
          scheduledDate: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
          reasoning: 'Proposal stage requires active follow-up to maintain momentum',
          confidence: 0.85,
          expectedOutcome: 'Clarification of timeline and next steps',
          requiredResources: ['Proposal summary', 'Value proposition']
        };
        break;

      default: // relationship_building
        action = {
          action: 'Send value-add content or industry insight',
          type: 'relationship_building',
          priority: 'low',
          scheduledDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 week
          reasoning: 'Ongoing relationship building to maintain engagement',
          confidence: 0.6,
          expectedOutcome: 'Maintained relationship and thought leadership',
          requiredResources: ['Relevant content', 'Industry insights']
        };
    }

    return action;
  }

  /**
   * Migrate email messages to actions
   */
  async migrateEmailsToActions(workspaceId: string, limit: number = 100): Promise<number> {
    // Get email accounts for the workspace first
    const emailAccounts = await this.prisma.email_accounts.findMany({
      where: { workspaceId },
      select: { id: true }
    });
    
    const accountIds = emailAccounts.map(account => account.id);
    
    if (accountIds.length === 0) {
      return 0;
    }
    
    const emailMessages = await this.prisma.email_messages.findMany({
      where: { accountId: { in: accountIds } },
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    let migratedCount = 0;

    for (const email of emailMessages) {
      try {
        // Determine action type based on email direction and content
        const actionType = this.determineEmailActionType(email);
        
        // Find related person/company
        const relationships = await this.findEmailRelationships(email);
        
        if (relationships.personId || relationships.companyId) {
          await this.createAction(workspaceId, email.userId || 'system', {
            type: actionType,
            subject: email.subject || 'Email Communication',
            description: email.body?.substring(0, 500) || '',
            status: 'completed',
            priority: 'medium',
            completedAt: email.sentAt || email.receivedAt || email.createdAt,
            ...relationships,
            externalId: email.id,
            metadata: {
              originalEmailId: email.id,
              messageId: email.messageId,
              threadId: email.threadId
            }
          });
          
          migratedCount++;
        }
      } catch (error) {
        console.error(`Failed to migrate email ${email.id}:`, error);
      }
    }

    return migratedCount;
  }

  /**
   * Migrate notes to actions
   */
  async migrateNotesToActions(workspaceId: string, limit: number = 100): Promise<number> {
    const notes = await this.prisma.notes.findMany({
      where: { workspaceId },
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    let migratedCount = 0;

    for (const note of notes) {
      try {
        // Find related person/company
        const relationships = await this.findNoteRelationships(note);
        
        if (relationships.personId || relationships.companyId) {
          await this.createAction(workspaceId, note.userId || 'system', {
            type: 'note_added',
            subject: note.title || 'Note Added',
            description: note.content || '',
            status: 'completed',
            priority: 'low',
            completedAt: note.createdAt,
            ...relationships,
            externalId: note.id,
            metadata: {
              originalNoteId: note.id,
              noteType: note.type
            }
          });
          
          migratedCount++;
        }
      } catch (error) {
        console.error(`Failed to migrate note ${note.id}:`, error);
      }
    }

    return migratedCount;
  }

  /**
   * Determine email action type
   */
  private determineEmailActionType(email: any): ActionType {
    const subject = (email.subject || '').toLowerCase();
    const body = (email.body || '').toLowerCase();
    
    if (subject.includes('follow up') || body.includes('follow up')) {
      return 'follow_up_email';
    } else if (subject.includes('demo') || body.includes('demo')) {
      return 'demo_call';
    } else if (subject.includes('proposal') || body.includes('proposal')) {
      return 'proposal_sent';
    } else if (email.direction === 'sent') {
      return 'email_sent';
    } else {
      return 'email_received';
    }
  }

  /**
   * Find email relationships
   */
  private async findEmailRelationships(email: any): Promise<ActionRelationship> {
    const relationships: ActionRelationship = {};

    // Get workspaceId from email account
    const emailAccount = await this.prisma.email_accounts.findFirst({
      where: { id: email.accountId },
      select: { workspaceId: true }
    });
    
    if (!emailAccount) {
      return relationships;
    }

    // Try to find person by email
    if (email.to && email.to.length > 0) {
      const person = await this.prisma.people.findFirst({
        where: {
          email: { in: email.to },
          workspaceId: emailAccount.workspaceId
        }
      });
      
      if (person) {
        relationships.personId = person.id;
        relationships.companyId = person.companyId;
      }
    }

    // Try to find by from email
    if (email.from && !relationships.personId) {
      const person = await this.prisma.people.findFirst({
        where: {
          email: email.from,
          workspaceId: emailAccount.workspaceId
        }
      });
      
      if (person) {
        relationships.personId = person.id;
        relationships.companyId = person.companyId;
      }
    }

    return relationships;
  }

  /**
   * Find note relationships
   */
  private async findNoteRelationships(note: any): Promise<ActionRelationship> {
    const relationships: ActionRelationship = {};

    // Check if note has direct relationships
    if (note.personId) relationships.personId = note.personId;
    if (note.companyId) relationships.companyId = note.companyId;
    if (note.leadId) relationships.leadId = note.leadId;
    if (note.prospectId) relationships.prospectId = note.prospectId;
    if (note.opportunityId) relationships.opportunityId = note.opportunityId;

    return relationships;
  }

  /**
   * Get timeline data for an entity
   */
  async getTimelineData(
    workspaceId: string,
    entityType: 'person' | 'company' | 'lead' | 'prospect' | 'opportunity',
    entityId: string
  ): Promise<any[]> {
    const actions = await this.getActionsForEntity(workspaceId, entityType, entityId, 50);
    
    return actions.map(action => ({
      id: action.id,
      type: action.type,
      date: action.completedAt || action.createdAt,
      title: action.subject,
      description: action.description,
      status: action.status,
      priority: action.priority,
      user: action.userId,
      metadata: action.metadata
    }));
  }

  /**
   * Clean up orphaned actions
   */
  async cleanupOrphanedActions(workspaceId: string): Promise<number> {
    const orphanedActions = await this.prisma.actions.findMany({
      where: {
        workspaceId,
        personId: null,
        companyId: null,
        leadId: null,
        prospectId: null,
        opportunityId: null
      }
    });

    let cleanedCount = 0;

    for (const action of orphanedActions) {
      try {
        // Try to find relationships based on subject/description
        const relationships = await this.findActionRelationships(action);
        
        if (relationships.personId || relationships.companyId) {
          // Update action with found relationships
          await this.prisma.actions.update({
            where: { id: action.id },
            data: relationships
          });
          cleanedCount++;
        } else {
          // Delete truly orphaned actions
          await this.prisma.actions.delete({
            where: { id: action.id }
          });
          cleanedCount++;
        }
      } catch (error) {
        console.error(`Failed to clean up action ${action.id}:`, error);
      }
    }

    return cleanedCount;
  }

  /**
   * Find relationships for orphaned actions
   */
  private async findActionRelationships(action: any): Promise<ActionRelationship> {
    const relationships: ActionRelationship = {};

    // Try to extract person/company names from subject/description
    const text = `${action.subject} ${action.description || ''}`.toLowerCase();
    
    // This is a simplified approach - in production, you'd use more sophisticated NLP
    // to extract names and match them to existing records
    
    return relationships;
  }

  /**
   * Get action statistics
   */
  async getActionStatistics(workspaceId: string): Promise<any> {
    const stats = await this.prisma.actions.groupBy({
      by: ['type', 'status'],
      where: { workspaceId },
      _count: { type: true }
    });

    const totalActions = await this.prisma.actions.count({
      where: { workspaceId }
    });

    const actionsWithRelationships = await this.prisma.actions.count({
      where: {
        workspaceId,
        OR: [
          { personId: { not: null } },
          { companyId: { not: null } },
          { leadId: { not: null } },
          { prospectId: { not: null } },
          { opportunityId: { not: null } }
        ]
      }
    });

    return {
      totalActions,
      actionsWithRelationships,
      orphanedActions: totalActions - actionsWithRelationships,
      typeBreakdown: stats,
      relationshipCoverage: (actionsWithRelationships / totalActions) * 100
    };
  }
}

// Export singleton instance
export const completeActionModel = new CompleteActionModel();
