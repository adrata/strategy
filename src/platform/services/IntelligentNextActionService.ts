import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface NextActionRecommendation {
  action: string;
  date: Date;
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
  type: 'linkedin_connection_request' | 'email_conversation' | 'phone_call' | 'linkedin_inmail' | 'meeting_scheduled';
  context: string;
  updatedAt: Date;
}

export interface ActionContext {
  personId?: string;
  companyId?: string;
  leadId?: string;
  opportunityId?: string;
  prospectId?: string;
  recentActions: Array<{
    type: string;
    subject: string;
    createdAt: Date;
    status: string;
  }>;
  entityInfo: {
    name: string;
    title?: string;
    company?: string;
    industry?: string;
    lastContactDate?: Date;
  };
}

export class IntelligentNextActionService {
  private config: { workspaceId: string; userId: string };
  private claudeApiKey: string;

  constructor(config: { workspaceId: string; userId: string }) {
    this.config = config;
    this.claudeApiKey = process.env.ANTHROPIC_API_KEY || '';
  }

  /**
   * Generate intelligent next action using Claude API
   */
  public async generateNextAction(entityId: string, entityType: 'person' | 'company'): Promise<NextActionRecommendation | null> {
    try {
      // Get action context
      const context = await this.getActionContext(entityId, entityType);
      
      if (!context) {
        return null;
      }

      // Call Claude API for intelligent recommendation
      const recommendation = await this.callClaudeAPI(context);
      
      if (recommendation) {
        // Update the entity with the new nextAction
        await this.updateEntityNextAction(entityId, entityType, recommendation);
        
        return recommendation;
      }

      // Fallback to rule-based system
      return this.generateFallbackNextAction(context);
      
    } catch (error) {
      console.error('❌ Error generating next action:', error);
      return null;
    }
  }

  /**
   * Get comprehensive action context for AI analysis
   */
  private async getActionContext(entityId: string, entityType: 'person' | 'company'): Promise<ActionContext | null> {
    try {
      // Get recent actions (last 10)
      const recentActions = await prisma.actions.findMany({
        where: {
          workspaceId: this.config.workspaceId,
          OR: [
            { personId: entityId },
            { companyId: entityId }
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          type: true,
          subject: true,
          createdAt: true,
          status: true,
          description: true
        }
      });

      // Get entity information
      let entityInfo;
      if (entityType === 'person') {
        const person = await prisma.people.findUnique({
          where: { id: entityId },
          select: {
            fullName: true,
            jobTitle: true,
            companyId: true,
            lastContactDate: true,
            company: {
              select: {
                name: true,
                industry: true
              }
            }
          }
        });

        if (!person) return null;

        entityInfo = {
          name: person.fullName,
          title: person.jobTitle || undefined,
          company: person.company?.name,
          industry: person.company?.industry,
          lastContactDate: person.lastContactDate
        };
      } else {
        const company = await prisma.companies.findUnique({
          where: { id: entityId },
          select: {
            name: true,
            industry: true,
            lastContactDate: true
          }
        });

        if (!company) return null;

        entityInfo = {
          name: company.name,
          industry: company.industry || undefined,
          lastContactDate: company.lastContactDate
        };
      }

      return {
        personId: entityType === 'person' ? entityId : undefined,
        companyId: entityType === 'company' ? entityId : undefined,
        recentActions: recentActions.map(action => ({
          type: action.type,
          subject: action.subject,
          createdAt: action.createdAt,
          status: action.status
        })),
        entityInfo
      };

    } catch (error) {
      console.error('❌ Error getting action context:', error);
      return null;
    }
  }

  /**
   * Call Claude API for intelligent next action recommendation
   */
  private async callClaudeAPI(context: ActionContext): Promise<NextActionRecommendation | null> {
    if (!this.claudeApiKey) {
      console.log('⚠️ Claude API key not found, using fallback system');
      return null;
    }

    try {
      const prompt = this.buildClaudePrompt(context);
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.claudeApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.content[0].text;
      
      return this.parseClaudeResponse(content, context);
      
    } catch (error) {
      console.error('❌ Claude API call failed:', error);
      return null;
    }
  }

  /**
   * Build comprehensive prompt for Claude
   */
  private buildClaudePrompt(context: ActionContext): string {
    const recentActionsText = context.recentActions
      .map(action => `- ${action.type}: ${action.subject} (${action.createdAt.toISOString().split('T')[0]})`)
      .join('\n');

    const daysSinceLastContact = context.entityInfo.lastContactDate 
      ? Math.floor((Date.now() - context.entityInfo.lastContactDate.getTime()) / (1000 * 60 * 60 * 24))
      : 'unknown';

    return `You are an expert sales strategist. Analyze this contact's engagement history and recommend the next best action.

CONTACT INFORMATION:
- Name: ${context.entityInfo.name}
- Title: ${context.entityInfo.title || 'Unknown'}
- Company: ${context.entityInfo.company || 'Unknown'}
- Industry: ${context.entityInfo.industry || 'Unknown'}
- Days since last contact: ${daysSinceLastContact}

RECENT ACTIONS (most recent first):
${recentActionsText}

AVAILABLE ACTION TYPES:
1. linkedin_connection_request - Send LinkedIn connection request
2. email_conversation - Send follow-up email
3. phone_call - Make phone call
4. linkedin_inmail - Send LinkedIn InMail
5. meeting_scheduled - Schedule a meeting

SALES STRATEGY RULES:
- Cycle between LinkedIn, email, and phone calls
- LinkedIn connection requests should come first for new contacts
- Wait 2-3 days between actions of the same type
- Phone calls are for warmer leads (after email/LinkedIn engagement)
- LinkedIn InMails are for high-value prospects
- Meetings are for qualified leads showing strong interest

Respond in this exact JSON format:
{
  "action": "Specific action description",
  "type": "action_type",
  "reasoning": "Why this is the best next action",
  "priority": "high|medium|low",
  "daysFromNow": 2
}

Focus on the most strategic next move that will advance the relationship.`;
  }

  /**
   * Parse Claude's response into NextActionRecommendation
   */
  private parseClaudeResponse(content: string, context: ActionContext): NextActionRecommendation | null {
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      const daysFromNow = parsed.daysFromNow || 2;
      const nextDate = new Date(Date.now() + (daysFromNow * 24 * 60 * 60 * 1000));

      return {
        action: parsed.action,
        date: nextDate,
        reasoning: parsed.reasoning,
        priority: parsed.priority || 'medium',
        type: parsed.type,
        context: `AI-generated recommendation for ${context.entityInfo.name}`,
        updatedAt: new Date()
      };

    } catch (error) {
      console.error('❌ Error parsing Claude response:', error);
      return null;
    }
  }

  /**
   * Fallback rule-based next action system
   */
  private generateFallbackNextAction(context: ActionContext): NextActionRecommendation {
    const recentActions = context.recentActions;
    const lastAction = recentActions[0];
    
    if (!lastAction) {
      // No previous actions, start with LinkedIn connection
      return {
        action: 'Send LinkedIn connection request',
        date: new Date(Date.now() + (24 * 60 * 60 * 1000)), // Tomorrow
        reasoning: 'First contact - LinkedIn connection request is the best starting point',
        priority: 'high',
        type: 'linkedin_connection_request',
        context: `Initial outreach to ${context.entityInfo.name}`,
        updatedAt: new Date()
      };
    }

    // Smart cycling logic
    const actionCycle = ['linkedin_connection_request', 'email_conversation', 'phone_call', 'linkedin_inmail'];
    const lastActionIndex = actionCycle.indexOf(lastAction.type);
    
    let nextActionType: string;
    let daysFromNow: number;
    let reasoning: string;

    if (lastActionIndex === -1) {
      // Unknown action type, default to email
      nextActionType = 'email_conversation';
      daysFromNow = 3;
      reasoning = 'Follow up with email after previous action';
    } else {
      // Cycle to next action
      const nextIndex = (lastActionIndex + 1) % actionCycle.length;
      nextActionType = actionCycle[nextIndex];
      
      // Smart timing based on action type
      switch (nextActionType) {
        case 'linkedin_connection_request':
          daysFromNow = 2;
          reasoning = 'LinkedIn connection request - professional networking approach';
          break;
        case 'email_conversation':
          daysFromNow = 3;
          reasoning = 'Follow-up email to continue conversation';
          break;
        case 'phone_call':
          daysFromNow = 5;
          reasoning = 'Phone call for more personal engagement';
          break;
        case 'linkedin_inmail':
          daysFromNow = 7;
          reasoning = 'LinkedIn InMail for high-value prospect';
          break;
        default:
          daysFromNow = 3;
          reasoning = 'Standard follow-up action';
      }
    }

    const nextDate = new Date(Date.now() + (daysFromNow * 24 * 60 * 60 * 1000));

    return {
      action: this.getActionDescription(nextActionType),
      date: nextDate,
      reasoning,
      priority: 'medium',
      type: nextActionType as any,
      context: `Strategic follow-up for ${context.entityInfo.name}`,
      updatedAt: new Date()
    };
  }

  /**
   * Get human-readable action description
   */
  private getActionDescription(actionType: string): string {
    switch (actionType) {
      case 'linkedin_connection_request':
        return 'Send LinkedIn connection request';
      case 'email_conversation':
        return 'Send follow-up email';
      case 'phone_call':
        return 'Make phone call';
      case 'linkedin_inmail':
        return 'Send LinkedIn InMail';
      case 'meeting_scheduled':
        return 'Schedule meeting';
      default:
        return 'Follow up';
    }
  }

  /**
   * Update entity with new nextAction
   */
  private async updateEntityNextAction(
    entityId: string, 
    entityType: 'person' | 'company', 
    recommendation: NextActionRecommendation
  ): Promise<void> {
    try {
      const updateData = {
        nextAction: recommendation.action,
        nextActionDate: recommendation.date,
        nextActionReasoning: recommendation.reasoning,
        nextActionPriority: recommendation.priority,
        nextActionType: recommendation.type,
        nextActionUpdatedAt: recommendation.updatedAt
      };

      if (entityType === 'person') {
        await prisma.people.update({
          where: { id: entityId },
          data: updateData
        });
      } else {
        await prisma.companies.update({
          where: { id: entityId },
          data: updateData
        });
      }

      console.log(`✅ Updated nextAction for ${entityType} ${entityId}: ${recommendation.action}`);
      
    } catch (error) {
      console.error('❌ Error updating entity nextAction:', error);
    }
  }

  /**
   * Update nextAction when a new action is created
   */
  public async updateNextActionOnNewAction(action: any): Promise<void> {
    try {
      // Update nextAction for person if action has personId
      if (action.personId) {
        await this.generateNextAction(action.personId, 'person');
      }

      // Update nextAction for company if action has companyId
      if (action.companyId) {
        await this.generateNextAction(action.companyId, 'company');
      }

    } catch (error) {
      console.error('❌ Error updating nextAction on new action:', error);
    }
  }

  /**
   * Batch update nextActions for all entities
   */
  public async batchUpdateNextActions(limit: number = 100): Promise<void> {
    console.log(`🔄 Batch updating nextActions for ${limit} entities...`);

    // Update people
    const people = await prisma.people.findMany({
      where: { workspaceId: this.config.workspaceId },
      select: { id: true },
      take: Math.floor(limit / 2)
    });

    for (const person of people) {
      await this.generateNextAction(person.id, 'person');
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Update companies
    const companies = await prisma.companies.findMany({
      where: { workspaceId: this.config.workspaceId },
      select: { id: true },
      take: Math.floor(limit / 2)
    });

    for (const company of companies) {
      await this.generateNextAction(company.id, 'company');
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Batch updated nextActions for ${people.length} people and ${companies.length} companies`);
  }
}
