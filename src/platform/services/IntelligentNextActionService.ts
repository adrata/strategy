import { PrismaClient } from '@prisma/client';
import { UserGoalsService } from './UserGoalsService';

const prisma = new PrismaClient();

export interface NextActionRecommendation {
  action: string;  // Single sentence tactical action
  directionalIntelligence: string;  // NEW: 2-4 sentence strategic guidance
  date: Date;
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
  type: 'linkedin_connection_request' | 'email_conversation' | 'phone_call' | 'linkedin_inmail' | 'meeting_scheduled';
  context: string;
  afmStage?: string;  // NEW: AcquisitionOS stage
  urfScore?: number;  // NEW: RetentionOS score
  goalAlignment?: string;  // NEW: How this aligns with user goals
  updatedAt: Date;
}

export interface ActionContext {
  entityType: 'person' | 'company';
  entityId: string;
  personId?: string;
  companyId?: string;
  leadId?: string;
  opportunityId?: string;
  prospectId?: string;
  globalRank?: number | null;
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
    this.claudeApiKey = process.env['ANTHROPIC_API_KEY'] || '';
  }

  /**
   * Generate intelligent next action using Claude API
   * @param baseDate - Optional date to use as base for next action calculation (if action was taken today)
   */
  public async generateNextAction(entityId: string, entityType: 'person' | 'company', baseDate?: Date | null): Promise<NextActionRecommendation | null> {
    try {
      // Get action context
      const context = await this.getActionContext(entityId, entityType);
      
      if (!context) {
        return null;
      }

      // 🏆 FIX: If baseDate is provided (action taken today), override lastContactDate in context
      if (baseDate) {
        context.entityInfo.lastContactDate = baseDate;
      }

      // Call Claude API for intelligent recommendation
      const recommendation = await this.callClaudeAPI(context);
      
      if (recommendation) {
        // Update the entity with the new nextAction
        await this.updateEntityNextAction(entityId, entityType, recommendation);
        
        return recommendation;
      }

      // Fallback to rule-based system
      return await this.generateFallbackNextAction(context);
      
    } catch (error) {
      console.error('❌ Error generating next action:', error);
      return null;
    }
  }

  /**
   * Get comprehensive action context for AI analysis with AcquisitionOS data
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

      // Get entity information with AcquisitionOS context
      let entityInfo;
      let globalRank: number | null = null;
      let companyStatus: string | null = null;
      let peopleCount: number = 0;
      let hasEmail: boolean = false;
      let hasLinkedIn: boolean = false;
      
      if (entityType === 'person') {
        const person = await prisma.people.findUnique({
          where: { id: entityId },
          select: {
            fullName: true,
            jobTitle: true,
            email: true,
            linkedinUrl: true,
            companyId: true,
            lastActionDate: true,
            globalRank: true,
            company: {
              select: {
                name: true,
                industry: true,
                status: true
              }
            }
          }
        });

        if (!person) return null;

        globalRank = person.globalRank;
        companyStatus = person.company?.status || null;
        hasEmail = !!person.email;
        hasLinkedIn = !!person.linkedinUrl;
        
        entityInfo = {
          name: person.fullName,
          title: person.jobTitle || undefined,
          company: person.company?.name,
          industry: person.company?.industry,
          lastContactDate: person.lastActionDate
        };

        // Get people count at company
        if (person.companyId) {
          peopleCount = await prisma.people.count({
            where: {
              companyId: person.companyId,
              workspaceId: this.config.workspaceId,
              deletedAt: null
            }
          });
        }
      } else {
        const company = await prisma.companies.findUnique({
          where: { id: entityId },
          select: {
            name: true,
            industry: true,
            status: true,
            lastActionDate: true,
            globalRank: true
          }
        });

        if (!company) return null;

        globalRank = company.globalRank;
        companyStatus = company.status;
        
        entityInfo = {
          name: company.name,
          industry: company.industry || undefined,
          lastContactDate: company.lastActionDate
        };

        // Get people count at company
        peopleCount = await prisma.people.count({
          where: {
            companyId: entityId,
            workspaceId: this.config.workspaceId,
            deletedAt: null
          }
        });

        // Check if any people have email or LinkedIn
        const peopleWithContactInfo = await prisma.people.findMany({
          where: {
            companyId: entityId,
            workspaceId: this.config.workspaceId,
            deletedAt: null
          },
          select: {
            email: true,
            linkedinUrl: true
          },
          take: 5
        });

        hasEmail = peopleWithContactInfo.some(p => !!p.email);
        hasLinkedIn = peopleWithContactInfo.some(p => !!p.linkedinUrl);
      }

      return {
        entityType,
        entityId,
        personId: entityType === 'person' ? entityId : undefined,
        companyId: entityType === 'company' ? entityId : undefined,
        globalRank,
        recentActions: recentActions.map(action => ({
          type: action.type,
          subject: action.subject,
          createdAt: action.createdAt,
          status: action.status
        })),
        entityInfo,
        // Add AcquisitionOS context
        companyStatus,
        peopleCount,
        hasEmail,
        hasLinkedIn
      } as ActionContext & {
        companyStatus: string | null;
        peopleCount: number;
        hasEmail: boolean;
        hasLinkedIn: boolean;
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
      // Get user goals context for goal-aligned recommendations
      const goalContext = await UserGoalsService.getGoalContextForAI(this.config.userId, this.config.workspaceId);
      
      const prompt = this.buildClaudePrompt(context, goalContext);
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.claudeApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 2000, // Increased for more comprehensive responses
          temperature: 0.3, // Lower temperature for more consistent business recommendations
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
   * Build comprehensive prompt for Claude with AcquisitionOS framework
   */
  private buildClaudePrompt(context: ActionContext, goalContext?: string): string {
    const recentActionsText = context.recentActions
      .map(action => `- ${action.type}: ${action.subject} (${action.createdAt.toISOString().split('T')[0]})`)
      .join('\n');

    const daysSinceLastContact = context.entityInfo.lastContactDate 
      ? Math.floor((Date.now() - context.entityInfo.lastContactDate.getTime()) / (1000 * 60 * 60 * 24))
      : 'unknown';

    // Get company status and stage information
    const companyStatus = (context as any).companyStatus || 'UNKNOWN';
    const peopleCount = (context as any).peopleCount || 0;
    const hasEmail = (context as any).hasEmail || false;
    const hasLinkedIn = (context as any).hasLinkedIn || false;

    return `You are an expert B2B sales strategist using the AcquisitionOS Acquisition Factor Model. Analyze this contact's engagement history and recommend the most strategic next action based on their acquisition stage.

CONTACT INFORMATION:
- Name: ${context.entityInfo.name}
- Title: ${context.entityInfo.title || 'Unknown'}
- Company: ${context.entityInfo.company || 'Unknown'}
- Industry: ${context.entityInfo.industry || 'Unknown'}
- Company Status: ${companyStatus}
- People at Company: ${peopleCount}
- Has Email: ${hasEmail}
- Has LinkedIn: ${hasLinkedIn}
- Days since last contact: ${daysSinceLastContact}
- Global Rank: ${context.globalRank || 'Unknown'}

RECENT ACTIONS (most recent first):
${recentActionsText}

${goalContext || 'USER GOALS: Not set yet.'}

ACQUISITIONOS FRAMEWORK - STAGE-BASED STRATEGY:

GENERATE PIPELINE (LEAD Status):
- Companies with 0 people: "Research company and identify key contacts"
- People with LinkedIn but no email: "Send LinkedIn connection request"
- People with email: "Send introduction email"
- People without contact info: "Find contact information on LinkedIn"
- Focus: Identify Champion, Map org structure, Research priorities

BUILD SALE (PROSPECT Status):
- Focus: Validate pain, Build credibility, Earn trust
- Actions: Discovery calls, stakeholder mapping, pain validation
- Deploy Big Idea Pitch, Use Contrast Frames, Show time-to-value
- Qualify Champion's Role and Influence, Map Organizational Structure

JUSTIFY/NEGOTIATE (OPPORTUNITY Status):
- Focus: Business case, Stakeholder alignment, Timeline validation
- Actions: ROI quantification, executive alignment, proposal drafting
- Position solution as strategic fit, Collaborate on business case
- Navigate procurement and legal approvals

AVAILABLE ACTION TYPES:
1. linkedin_connection_request - Send LinkedIn connection request
2. email_conversation - Send follow-up email
3. phone_call - Make phone call
4. linkedin_inmail - Send LinkedIn InMail
5. meeting_scheduled - Schedule a meeting
6. proposal_sent - Send proposal or pricing information
7. demo_scheduled - Schedule product demonstration
8. reference_request - Request case study or testimonial
9. research - Research company and identify key contacts
10. discovery_call - Schedule discovery call to validate pain

ACQUISITIONOS STRATEGY RULES:
- For LEAD status: Focus on research, contact identification, and initial outreach
- For PROSPECT status: Focus on pain validation, credibility building, and stakeholder mapping
- For OPPORTUNITY status: Focus on business case, alignment, and closing activities
- Speedrun companies (rank 1-50) get TODAY priority - immediate action required
- Use Directional Intelligence to eliminate wasted effort
- Compress time as the single greatest lever for revenue generation
- Match action to acquisition stage and available contact information

RESPONSE FORMAT:
Respond in this exact JSON format:
{
  "action": "Single sentence tactical action (e.g., 'Schedule discovery call with John Smith')",
  "directionalIntelligence": "2-4 sentence strategic guidance explaining AFM stage, why this matters, what it achieves, and how it compresses time. Include goal alignment if relevant.",
  "type": "action_type",
  "reasoning": "Detailed explanation using AcquisitionOS framework principles",
  "priority": "high|medium|low",
  "afmStage": "Generate|Initiate|Educate|Build|Justify|Negotiate",
  "daysFromNow": 2,
  "expectedOutcome": "What you expect to achieve with this action",
  "followUpStrategy": "How to follow up if this action doesn't get a response"
}

EXAMPLE RESPONSE:
{
  "action": "Schedule stakeholder mapping call with DataCorp",
  "directionalIntelligence": "DataCorp is in Build stage (AFM) with Champion identified but incomplete stakeholder mapping. This call will identify Decision Makers and Blockers, critical for moving to Justify stage. Focus on uncovering who controls budget and timeline. Compressing this discovery phase from weeks to days is key to faster close.",
  "type": "phone_call",
  "reasoning": "Multiple touchpoints completed but stakeholder structure still unclear. Need to map buying group.",
  "priority": "high",
  "afmStage": "Build",
  "daysFromNow": 1,
  "expectedOutcome": "Complete stakeholder map with decision authority levels",
  "followUpStrategy": "If no response in 2 days, reach out via Champion"
}

Focus on the most strategic next move that will advance the relationship through the AcquisitionOS stages toward a closed deal.`;
  }

  /**
   * Calculate next action date based on global rank and last action
   */
  private calculateRankBasedDate(globalRank: number | null, lastActionDate: Date | null): Date {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Check if last action was today - if so, push to tomorrow minimum
    const lastActionToday = lastActionDate && 
      lastActionDate.getFullYear() === now.getFullYear() &&
      lastActionDate.getMonth() === now.getMonth() &&
      lastActionDate.getDate() === now.getDate();
    
    let targetDate: Date;
    
    // Rank-based date calculation
    if (!globalRank || globalRank <= 50) {
      // Top 50: TODAY (or tomorrow if action already today)
      targetDate = lastActionToday ? new Date(today.getTime() + 24 * 60 * 60 * 1000) : today;
    } else if (globalRank <= 200) {
      // High priority (51-200): THIS WEEK (3-7 days)
      const daysOut = lastActionToday ? 3 : 2;
      targetDate = new Date(today.getTime() + daysOut * 24 * 60 * 60 * 1000);
    } else if (globalRank <= 500) {
      // Medium priority (201-500): NEXT WEEK (7-14 days)
      targetDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else {
      // Lower priority (500+): THIS MONTH (14-30 days)
      targetDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    }
    
    // Push weekend dates to Monday
    const dayOfWeek = targetDate.getDay();
    if (dayOfWeek === 0) { // Sunday
      targetDate = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000); // Move to Monday
    } else if (dayOfWeek === 6) { // Saturday
      targetDate = new Date(targetDate.getTime() + 2 * 24 * 60 * 60 * 1000); // Move to Monday
    }
    
    return targetDate;
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
      
      // Get globalRank from context if available
      const globalRank = (context as any).globalRank || null;
      const lastActionDate = context.entityInfo.lastContactDate || null;
      
      // Use rank-based date calculation instead of AI's suggestion
      const nextDate = this.calculateRankBasedDate(globalRank, lastActionDate);

      // Enhanced reasoning with expected outcome and follow-up strategy
      const enhancedReasoning = `${parsed.reasoning}${parsed.expectedOutcome ? ` Expected outcome: ${parsed.expectedOutcome}.` : ''}${parsed.followUpStrategy ? ` Follow-up strategy: ${parsed.followUpStrategy}.` : ''}`;

      return {
        action: parsed.action,
        directionalIntelligence: parsed.directionalIntelligence || `${parsed.action}. ${enhancedReasoning}`,
        date: nextDate,
        reasoning: enhancedReasoning,
        priority: parsed.priority || 'medium',
        type: parsed.type,
        afmStage: parsed.afmStage,
        goalAlignment: parsed.goalAlignment,
        context: `AI-generated recommendation for ${context.entityInfo.name} - ${context.entityInfo.company || 'Unknown Company'}`,
        updatedAt: new Date()
      };

    } catch (error) {
      console.error('❌ Error parsing Claude response:', error);
      return null;
    }
  }

  /**
   * Fallback rule-based next action system with AcquisitionOS framework
   */
  private async generateFallbackNextAction(context: ActionContext): Promise<NextActionRecommendation> {
    const recentActions = context.recentActions;
    const lastAction = recentActions[0];
    
    // Calculate date using rank-based logic
    const nextDate = this.calculateRankBasedDate(
      context.globalRank || null,
      context.entityInfo.lastContactDate || null
    );

    // Get AcquisitionOS context
    const companyStatus = (context as any).companyStatus || 'UNKNOWN';
    const peopleCount = (context as any).peopleCount || 0;
    const hasEmail = (context as any).hasEmail || false;
    const hasLinkedIn = (context as any).hasLinkedIn || false;

    // For companies, check if there are people attached and use their next action
    if (context.entityType === 'company' && peopleCount > 0) {
      try {
        // Find the highest-ranked person at this company
        const topPerson = await prisma.people.findFirst({
          where: {
            companyId: context.entityId,
            workspaceId: this.config.workspaceId,
            deletedAt: null
          },
          select: {
            id: true,
            fullName: true,
            nextAction: true,
            globalRank: true
          },
          orderBy: { globalRank: 'asc' }
        });

        if (topPerson) {
          if (topPerson.nextAction) {
            // Person has a next action - use it
            const afmStage = this.mapStatusToAFMStage(companyStatus);
            const directionalIntelligence = this.generateDirectionalIntelligence(
              `Engage ${topPerson.fullName} - ${topPerson.nextAction}`,
              `Focus on highest-ranked person at ${context.entityInfo.name}`,
              afmStage,
              context
            );
            
            return {
              action: `Engage ${topPerson.fullName} - ${topPerson.nextAction}`,
              directionalIntelligence,
              date: nextDate,
              reasoning: `Focus on highest-ranked person (${topPerson.globalRank}) at ${context.entityInfo.name}`,
              priority: topPerson.globalRank && topPerson.globalRank <= 50 ? 'high' : 
                       topPerson.globalRank && topPerson.globalRank <= 200 ? 'medium' : 'low',
              type: 'person_engagement' as any,
              afmStage,
              context: `Person-focused action for ${context.entityInfo.name}`,
              updatedAt: new Date()
            };
          } else {
            // Person exists but no next action - generate one for them
            const personContext = await this.getActionContext(topPerson.id, 'person');
            if (personContext) {
              const personAction = this.getStageBasedAction(
                (personContext as any).companyStatus || 'UNKNOWN',
                peopleCount,
                (personContext as any).hasEmail || false,
                (personContext as any).hasLinkedIn || false,
                personContext.recentActions[0]
              );
              
              const afmStage = this.mapStatusToAFMStage(companyStatus);
              const directionalIntelligence = this.generateDirectionalIntelligence(
                `Engage ${topPerson.fullName} - ${personAction.action}`,
                `Focus on highest-ranked person at ${context.entityInfo.name}`,
                afmStage,
                context
              );
              
              return {
                action: `Engage ${topPerson.fullName} - ${personAction.action}`,
                directionalIntelligence,
                date: nextDate,
                reasoning: `Focus on highest-ranked person (${topPerson.globalRank}) at ${context.entityInfo.name}`,
                priority: topPerson.globalRank && topPerson.globalRank <= 50 ? 'high' : 
                         topPerson.globalRank && topPerson.globalRank <= 200 ? 'medium' : 'low',
                type: personAction.type as any,
                afmStage,
                context: `Person-focused action for ${context.entityInfo.name}`,
                updatedAt: new Date()
              };
            }
          }
        }
      } catch (error) {
        console.error('❌ Error fetching top person for company:', error);
        // Fall through to company-level action
      }
    }

    // Generate stage-based action using AcquisitionOS framework (for people or companies with no people)
    const stageAction = this.getStageBasedAction(companyStatus, peopleCount, hasEmail, hasLinkedIn, lastAction);
    
    // Determine priority based on rank
    const priority = context.globalRank && context.globalRank <= 50 ? 'high' : 
                    context.globalRank && context.globalRank <= 200 ? 'medium' : 'low';

    // Generate directional intelligence for fallback action
    const afmStage = this.mapStatusToAFMStage(companyStatus);
    const directionalIntelligence = this.generateDirectionalIntelligence(
      stageAction.action,
      stageAction.reasoning,
      afmStage,
      context
    );

    return {
      action: stageAction.action,
      directionalIntelligence,
      date: nextDate,
      reasoning: stageAction.reasoning,
      priority,
      type: stageAction.type as any,
      afmStage,
      context: `AcquisitionOS ${companyStatus} stage action for ${context.entityInfo.name}`,
      updatedAt: new Date()
    };
  }

  /**
   * Get stage-based action using AcquisitionOS framework
   */
  private getStageBasedAction(
    companyStatus: string | null, 
    peopleCount: number, 
    hasEmail: boolean, 
    hasLinkedIn: boolean, 
    lastAction: any
  ): { action: string; type: string; reasoning: string } {
    
    // GENERATE PIPELINE (LEAD Status)
    if (companyStatus === 'LEAD') {
      if (peopleCount === 0) {
        return {
          action: 'Research company and identify key contacts',
          type: 'research',
          reasoning: 'LEAD stage: Company has no people - need to research and identify key decision makers'
        };
      }
      
      if (hasLinkedIn && !hasEmail) {
        return {
          action: 'Send LinkedIn connection request',
          type: 'linkedin_connection_request',
          reasoning: 'LEAD stage: Has LinkedIn but no email - LinkedIn connection is the best first touch'
        };
      }
      
      if (hasEmail) {
        return {
          action: 'Send introduction email',
          type: 'email_conversation',
          reasoning: 'LEAD stage: Has email contact - send personalized introduction email'
        };
      }
      
      return {
        action: 'Find contact information on LinkedIn',
        type: 'research',
        reasoning: 'LEAD stage: No contact info available - research LinkedIn for contact details'
      };
    }

    // BUILD SALE (PROSPECT Status)
    if (companyStatus === 'PROSPECT') {
      if (!lastAction || lastAction.type === 'linkedin_connection_request') {
        return {
          action: 'Schedule discovery call to validate pain',
          type: 'discovery_call',
          reasoning: 'PROSPECT stage: Need to validate pain and build credibility through discovery'
        };
      }
      
      if (lastAction.type === 'discovery_call') {
        return {
          action: 'Send follow-up email with pain validation insights',
          type: 'email_conversation',
          reasoning: 'PROSPECT stage: Follow up discovery call with pain validation and next steps'
        };
      }
      
      return {
        action: 'Schedule stakeholder mapping call',
        type: 'phone_call',
        reasoning: 'PROSPECT stage: Map organizational structure and identify key stakeholders'
      };
    }

    // JUSTIFY/NEGOTIATE (OPPORTUNITY Status)
    if (companyStatus === 'OPPORTUNITY') {
      if (!lastAction || lastAction.type.includes('discovery') || lastAction.type.includes('call')) {
        return {
          action: 'Send business case and ROI proposal',
          type: 'proposal_sent',
          reasoning: 'OPPORTUNITY stage: Present business case with quantified ROI and strategic fit'
        };
      }
      
      if (lastAction.type === 'proposal_sent') {
        return {
          action: 'Schedule executive alignment meeting',
          type: 'meeting_scheduled',
          reasoning: 'OPPORTUNITY stage: Align stakeholders and secure executive buy-in'
        };
      }
      
      return {
        action: 'Follow up on proposal and address objections',
        type: 'email_conversation',
        reasoning: 'OPPORTUNITY stage: Address any objections and move toward closing'
      };
    }

    // Default fallback for unknown status
    if (!lastAction) {
      return {
        action: 'Send LinkedIn connection request',
        type: 'linkedin_connection_request',
        reasoning: 'Initial outreach - LinkedIn connection request is the best starting point'
      };
    }

    // Smart cycling for unknown status
    const actionCycle = ['linkedin_connection_request', 'email_conversation', 'phone_call', 'linkedin_inmail'];
    const lastActionIndex = actionCycle.indexOf(lastAction.type);
    const nextIndex = lastActionIndex === -1 ? 0 : (lastActionIndex + 1) % actionCycle.length;
    const nextActionType = actionCycle[nextIndex];

    return {
      action: this.getActionDescription(nextActionType),
      type: nextActionType,
      reasoning: `Follow-up action after ${lastAction.type}`
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
      case 'research':
        return 'Research company and identify key contacts';
      case 'discovery_call':
        return 'Schedule discovery call to validate pain';
      case 'proposal_sent':
        return 'Send business case and ROI proposal';
      case 'demo_scheduled':
        return 'Schedule product demonstration';
      case 'reference_request':
        return 'Request case study or testimonial';
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
      if (entityType === 'person') {
        // People table has all the fields including directionalIntelligence
        await prisma.people.update({
          where: { id: entityId },
          data: {
            nextAction: recommendation.action,
            nextActionDate: recommendation.date,
            directionalIntelligence: recommendation.directionalIntelligence,
            nextActionReasoning: recommendation.reasoning,
            nextActionPriority: recommendation.priority,
            nextActionType: recommendation.type,
            nextActionUpdatedAt: recommendation.updatedAt
          }
        });
      } else {
        // Companies table has directionalIntelligence field now
        await prisma.companies.update({
          where: { id: entityId },
          data: {
            nextAction: recommendation.action,
            nextActionDate: recommendation.date,
            directionalIntelligence: recommendation.directionalIntelligence,
            nextActionReasoning: recommendation.reasoning,
            nextActionPriority: recommendation.priority,
            nextActionType: recommendation.type,
            nextActionUpdatedAt: recommendation.updatedAt
          }
        });
      }

      console.log(`✅ Updated nextAction for ${entityType} ${entityId}: ${recommendation.action}`);
      
    } catch (error) {
      console.error('❌ Error updating entity nextAction:', error);
    }
  }

  /**
   * Update nextAction when a new action is created
   * 🏆 FIX: When action is completed today, recalculate nextActionDate from TODAY, not old lastActionDate
   */
  public async updateNextActionOnNewAction(action: any): Promise<void> {
    try {
      // 🏆 FIX: If action was completed today, use TODAY as the base date for next action calculation
      const actionDate = action.completedAt ? new Date(action.completedAt) : new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const actionDateOnly = new Date(actionDate);
      actionDateOnly.setHours(0, 0, 0, 0);
      const isActionToday = actionDateOnly.getTime() === today.getTime();
      
      // Update nextAction for person if action has personId
      if (action.personId) {
        // 🏆 FIX: Pass today's date if action was taken today to ensure nextActionDate is calculated correctly
        await this.generateNextAction(action.personId, 'person', isActionToday ? today : null);
        
        // 🚀 COMPANY-PEOPLE LINKAGE: Also update company if person has one
        try {
          const person = await prisma.people.findUnique({
            where: { id: action.personId },
            select: { companyId: true }
          });
          if (person?.companyId) {
            await this.generateNextAction(person.companyId, 'company', isActionToday ? today : null);
            console.log(`✅ [NEXT ACTION] Updated company nextAction due to person action: ${person.companyId}`);
          }
        } catch (error) {
          console.error('⚠️ [NEXT ACTION] Failed to update company from person action:', error);
        }
      }

      // Update nextAction for company if action has companyId
      if (action.companyId) {
        // 🏆 FIX: Pass today's date if action was taken today to ensure nextActionDate is calculated correctly
        await this.generateNextAction(action.companyId, 'company', isActionToday ? today : null);
        
        // 🚀 COMPANY-PEOPLE LINKAGE: Also update key people at the company
        try {
          const keyPeople = await prisma.people.findMany({
            where: { companyId: action.companyId },
            orderBy: { globalRank: 'asc' },
            take: 3, // Top 3 people at company
            select: { id: true }
          });
          
          for (const person of keyPeople) {
            await this.generateNextAction(person.id, 'person', isActionToday ? today : null);
          }
          console.log(`✅ [NEXT ACTION] Updated ${keyPeople.length} key people nextActions due to company action: ${action.companyId}`);
        } catch (error) {
          console.error('⚠️ [NEXT ACTION] Failed to update people from company action:', error);
        }
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
  
  /**
   * Map company status to AFM stage
   */
  private mapStatusToAFMStage(status: string | null): string {
    const mapping: Record<string, string> = {
      'LEAD': 'Generate',
      'PROSPECT': 'Initiate',
      'OPPORTUNITY': 'Build',
      'CLIENT': 'Retention',
      'SUPERFAN': 'Evangelize'
    };
    return mapping[status || 'LEAD'] || 'Generate';
  }
  
  /**
   * Generate directional intelligence (strategic guidance) for action
   */
  private generateDirectionalIntelligence(
    action: string,
    reasoning: string,
    afmStage: string,
    context: ActionContext
  ): string {
    const entityName = context.entityInfo.name;
    const company = context.entityInfo.company || 'their company';
    const title = context.entityInfo.title || 'contact';
    const rankInfo = context.globalRank && context.globalRank <= 50 ? 
      ` This is a high-priority contact (Rank #${context.globalRank}) requiring immediate attention.` : '';
    
    // Stage-specific strategic guidance
    const stageGuidance: Record<string, string> = {
      'Generate': `${entityName} is in Generate stage (AFM). The goal is to identify Champions and assess pain levels. ${action} will help determine if they have decision-making authority and genuine pain worth solving. Focus on qualifying quickly to avoid wasting time on low-fit prospects.${rankInfo}`,
      
      'Initiate': `${entityName} at ${company} is in Initiate stage (AFM). ${title} has been identified as a potential Champion. ${action} will help convert their pain to interest by deploying Big Idea positioning and mapping the organizational structure. The faster we identify stakeholders and decision criteria, the faster we compress time-to-close.${rankInfo}`,
      
      'Educate': `${entityName} is in Educate stage (AFM). The Champion's pain is validated. ${action} will establish credibility and position you as an internal thought leader they trust. Research organizational priorities and equip the Champion with insights that make them indispensable internally. This builds the foundation for becoming their go-to advisor.${rankInfo}`,
      
      'Build': `${entityName} at ${company} is in Build stage (AFM). Champion is engaged and pain is quantified. ${action} will validate stakeholder pain, map the buying group, and strengthen the Champion's internal position. Focus on making them the hero who solves everyone's pain. This is the critical phase where deals either accelerate or stall.${rankInfo}`,
      
      'Justify': `${entityName} is in Justify stage (AFM). ${action} will help position the solution as strategic fit and collaborate on the business case. The Champion needs to present co-built solution to leadership. Provide tools, ROI quantification, and Executive Summary to support their internal pitch. Speed here determines if this closes this quarter.${rankInfo}`,
      
      'Negotiate': `${entityName} at ${company} is in Negotiate stage (AFM). ${action} will help secure buying committee alignment and remove procurement friction. Map individual motivations of all decision-makers and create tailored messaging. The goal is to compress legal/procurement from months to weeks.${rankInfo}`,
      
      'Retention': `${entityName} is an existing customer. ${action} will maintain engagement and prevent churn. Monitor URF score and ensure Process + Technology + Emotion balance is maintained. Strong retention creates expansion opportunities.${rankInfo}`,
      
      'Evangelize': `${entityName} is a customer advocate (Evangelize stage). ${action} will strengthen their evangelism and create expansion opportunities. Leverage their success story for case studies and referrals. High URF score (81+) means they're primed for expansion.${rankInfo}`
    };
    
    return stageGuidance[afmStage] || `${entityName}: ${action}. ${reasoning}${rankInfo}`;
  }
}
