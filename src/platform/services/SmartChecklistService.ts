/**
 * Smart Checklist Service
 * Generates intelligent daily action lists based on user goals, pipeline data, and AFM/URF/ESM frameworks
 */

import { PrismaClient } from '@prisma/client';
import { UserGoalsService, type GoalProgress } from './UserGoalsService';
import { RevenueOSKnowledgeBase } from './revenue-os-knowledge-base';

const prisma = new PrismaClient();

export interface SmartChecklistItem {
  id: string;
  text: string;
  reason: string;  // Why this action is important
  goalAlignment: string;  // Which goal this supports
  estimatedImpact: string;  // How this helps reach goal
  priority: 'high' | 'medium' | 'low';
  afmStage?: string;  // For acquisition actions
  urfScore?: number;  // For retention actions
  entityId?: string;  // Related person/company ID
  entityType?: 'person' | 'company';
  estimatedTime?: number;  // Minutes
  deadline?: Date;
}

export interface SmartChecklistResponse {
  items: SmartChecklistItem[];
  generatedAt: Date;
  goalsSummary: string;
  dailyFocus: string;
  estimatedTotalTime: number;  // Minutes
}

export class SmartChecklistService {
  /**
   * Generate smart daily checklist based on user goals and data
   */
  static async generateSmartChecklist(userId: string, workspaceId: string): Promise<SmartChecklistResponse> {
    try {
      console.log('🤖 [SMART CHECKLIST] Generating for user:', userId);
      
      // Get user goals and progress
      const goals = await UserGoalsService.getUserGoals(userId, workspaceId);
      const progress = await UserGoalsService.calculateProgress(userId, workspaceId);
      
      const items: SmartChecklistItem[] = [];
      
      // 1. HIGH PRIORITY: Overdue opportunities in Build/Justify stage
      const overdueOpportunities = await this.getOverdueOpportunities(userId, workspaceId);
      for (const opp of overdueOpportunities) {
        items.push({
          id: `opp-${opp.id}`,
          text: `Follow up with ${opp.name} - $${Number(opp.opportunityAmount || 0).toLocaleString()} opportunity`,
          reason: `This ${opp.opportunityStage} stage deal is ${this.getDaysOverdue(opp.nextActionDate)} days overdue. Critical for Q1 revenue.`,
          goalAlignment: goals?.quarterlyRevenueGoal ? 
            `Q1 Revenue Goal: $${goals.quarterlyRevenueGoal.toLocaleString()} (${progress.revenueProgress}% complete)` : 
            'Pipeline management',
          estimatedImpact: goals?.quarterlyRevenueGoal ?
            `Closing this = ${Math.round((Number(opp.opportunityAmount || 0) / goals.quarterlyRevenueGoal) * 100)}% toward Q1 goal` :
            'Move deal forward',
          priority: 'high',
          afmStage: this.mapStageToAFM(opp.opportunityStage || ''),
          entityId: opp.id,
          entityType: 'company',
          estimatedTime: 30,
          deadline: opp.nextActionDate || undefined
        });
      }
      
      // 2. HIGH PRIORITY: Champion-led prospects (AFM Initiate/Educate stage)
      const championProspects = await this.getChampionProspects(userId, workspaceId);
      for (const prospect of championProspects.slice(0, 3)) {  // Top 3
        items.push({
          id: `prospect-${prospect.id}`,
          text: `Connect with ${prospect.fullName} at ${prospect.company?.name || 'Unknown'} (Champion, ${this.getAFMStageFromStatus(prospect.status)})`,
          reason: `${prospect.jobTitle || 'Contact'} has Champion indicators. Quick wins possible in Initiate stage.`,
          goalAlignment: goals?.weeklyOutreachGoal ?
            `Weekly Outreach: ${progress.activityProgress}% complete (goal: ${goals.weeklyOutreachGoal})` :
            'Pipeline generation',
          estimatedImpact: 'High-probability conversion to opportunity',
          priority: 'high',
          afmStage: this.getAFMStageFromStatus(prospect.status),
          entityId: prospect.id,
          entityType: 'person',
          estimatedTime: 15
        });
      }
      
      // 3. MEDIUM PRIORITY: At-risk customers (URF Yellow/Red)
      const atRiskCustomers = await this.getAtRiskCustomers(userId, workspaceId);
      for (const customer of atRiskCustomers.slice(0, 2)) {  // Top 2
        const urfScore = this.calculateURFScore(customer);
        items.push({
          id: `customer-${customer.id}`,
          text: `Check in with ${customer.name} (URF Score: ${urfScore}, ${this.getURFColor(urfScore)})`,
          reason: `Customer engagement declining. Risk of churn without intervention.`,
          goalAlignment: 'Retention goal: Maintain 95% customer retention',
          estimatedImpact: `Preventing churn = $${Number(customer.opportunityAmount || 0).toLocaleString()} ARR saved`,
          priority: 'medium',
          urfScore,
          entityId: customer.id,
          entityType: 'company',
          estimatedTime: 20
        });
      }
      
      // 4. MEDIUM PRIORITY: Activity gap fillers (if behind on weekly goals)
      if (goals?.weeklyOutreachGoal && progress.activityProgress < 80) {
        const remaining = goals.weeklyOutreachGoal - Math.round((goals.weeklyOutreachGoal * progress.activityProgress) / 100);
        
        items.push({
          id: 'activity-outreach',
          text: `Complete ${remaining} more outreach actions this week`,
          reason: `You're at ${progress.activityProgress}% of weekly outreach goal. ${remaining} actions needed.`,
          goalAlignment: `Weekly Outreach Goal: ${goals.weeklyOutreachGoal} contacts`,
          estimatedImpact: 'Hit 100% of weekly activity goal',
          priority: 'medium',
          estimatedTime: remaining * 5  // 5 minutes per outreach
        });
      }
      
      // 5. LOW PRIORITY: Pipeline building (Generate stage leads)
      const generateStageLeads = await this.getGenerateStageLeads(userId, workspaceId);
      if (generateStageLeads.length > 0) {
        items.push({
          id: 'pipeline-generate',
          text: `Research and qualify ${Math.min(10, generateStageLeads.length)} new leads (Generate stage)`,
          reason: `You have ${generateStageLeads.length} leads in Generate stage. Identify Champions to move to Initiate.`,
          goalAlignment: goals?.pipelineValueGoal ?
            `Pipeline Goal: $${goals.pipelineValueGoal.toLocaleString()} (${progress.pipelineProgress}% complete)` :
            'Pipeline health',
          estimatedImpact: 'Build healthy top-of-funnel for future quarters',
          priority: 'low',
          afmStage: 'Generate',
          estimatedTime: 30
        });
      }
      
      // Sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
      
      // Calculate total estimated time
      const estimatedTotalTime = items.reduce((sum, item) => sum + (item.estimatedTime || 0), 0);
      
      // Generate daily focus summary
      const dailyFocus = this.generateDailyFocus(items, progress);
      const goalsSummary = this.generateGoalsSummary(goals, progress);
      
      return {
        items,
        generatedAt: new Date(),
        goalsSummary,
        dailyFocus,
        estimatedTotalTime
      };
      
    } catch (error) {
      console.error('Error generating smart checklist:', error);
      return this.getDefaultChecklist();
    }
  }
  
  /**
   * Refresh checklist based on new data (after user completes items)
   */
  static async refreshChecklist(userId: string, workspaceId: string): Promise<SmartChecklistResponse> {
    return this.generateSmartChecklist(userId, workspaceId);
  }
  
  // Helper methods for checklist generation
  
  private static async getOverdueOpportunities(userId: string, workspaceId: string) {
    const now = new Date();
    
    return prisma.companies.findMany({
      where: {
        workspaceId,
        mainSellerId: userId,
        status: 'OPPORTUNITY',
        opportunityStage: { in: ['Build', 'Justify', 'Negotiate'] },
        nextActionDate: { lt: now }
      },
      select: {
        id: true,
        name: true,
        opportunityAmount: true,
        opportunityStage: true,
        nextAction: true,
        nextActionDate: true
      },
      orderBy: [
        { opportunityAmount: 'desc' },
        { nextActionDate: 'asc' }
      ],
      take: 3
    });
  }
  
  private static async getChampionProspects(userId: string, workspaceId: string) {
    return prisma.people.findMany({
      where: {
        workspaceId,
        mainSellerId: userId,
        status: { in: ['PROSPECT', 'LEAD'] },
        buyerGroupRole: { in: ['champion', 'decision'] },
        OR: [
          { lastActionDate: null },
          { lastActionDate: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
        ]
      },
      select: {
        id: true,
        fullName: true,
        jobTitle: true,
        status: true,
        buyerGroupRole: true,
        company: {
          select: {
            name: true
          }
        }
      },
      orderBy: { globalRank: 'asc' },
      take: 5
    });
  }
  
  private static async getAtRiskCustomers(userId: string, workspaceId: string) {
    // Get customers with declining engagement
    return prisma.companies.findMany({
      where: {
        workspaceId,
        mainSellerId: userId,
        status: 'CLIENT',
        OR: [
          { lastActionDate: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
          { engagementScore: { lt: 70 } }
        ]
      },
      select: {
        id: true,
        name: true,
        opportunityAmount: true,
        lastActionDate: true,
        engagementScore: true
      },
      orderBy: { opportunityAmount: 'desc' },
      take: 3
    });
  }
  
  private static async getGenerateStageLeads(userId: string, workspaceId: string) {
    return prisma.people.findMany({
      where: {
        workspaceId,
        mainSellerId: userId,
        status: 'LEAD',
        buyerGroupRole: null  // No champion identified yet
      },
      select: {
        id: true,
        fullName: true
      },
      take: 20
    });
  }
  
  private static mapStageToAFM(stage: string): string {
    const mapping: Record<string, string> = {
      'Discovery': 'Generate',
      'Qualification': 'Initiate',
      'Proposal': 'Educate',
      'Build': 'Build',
      'Negotiation': 'Justify',
      'Closed': 'Negotiate'
    };
    return mapping[stage] || 'Generate';
  }
  
  private static getAFMStageFromStatus(status: string): string {
    const mapping: Record<string, string> = {
      'LEAD': 'Generate',
      'PROSPECT': 'Initiate',
      'OPPORTUNITY': 'Build',
      'CLIENT': 'Retention'
    };
    return mapping[status] || 'Generate';
  }
  
  private static calculateURFScore(customer: any): number {
    // Simplified URF scoring (real implementation would be more comprehensive)
    const engagement = customer.engagementScore || 0;
    const hasRecentActivity = customer.lastActionDate && 
      (Date.now() - customer.lastActionDate.getTime()) < (30 * 24 * 60 * 60 * 1000);
    
    let score = engagement;
    if (!hasRecentActivity) score -= 20;
    
    return Math.max(0, Math.min(100, score));
  }
  
  private static getURFColor(score: number): string {
    if (score >= 81) return 'Blue';
    if (score >= 71) return 'Green';
    if (score >= 46) return 'Yellow';
    return 'Red';
  }
  
  private static getDaysOverdue(date: Date | null): number {
    if (!date) return 0;
    const diff = Date.now() - date.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }
  
  private static generateDailyFocus(items: SmartChecklistItem[], progress: GoalProgress): string {
    if (!progress.isOnTrack) {
      return `FOCUS: Catch up on revenue goal. You're behind pace - prioritize closing deals in Build/Justify stages.`;
    }
    
    const highPriorityCount = items.filter(i => i.priority === 'high').length;
    
    if (highPriorityCount >= 3) {
      return `FOCUS: ${highPriorityCount} high-priority actions today. Complete these to stay on track for your goals.`;
    }
    
    return `FOCUS: Maintain momentum. Your on track - keep executing daily actions to hit your goals.`;
  }
  
  private static generateGoalsSummary(goals: any, progress: GoalProgress): string {
    if (!goals) {
      return 'No goals set yet. Set goals in Settings to get personalized recommendations.';
    }
    
    const statusEmoji = progress.isOnTrack ? '✅' : '⚠️';
    
    return `${statusEmoji} ${progress.overallProgress}% toward goals | ${progress.daysRemaining} days remaining in quarter | ${progress.isOnTrack ? 'On track' : 'Behind pace'}`;
  }
  
  private static getDefaultChecklist(): SmartChecklistResponse {
    return {
      items: [
        {
          id: 'default-1',
          text: 'Set your goals in Settings',
          reason: 'Smart checklist works best when aligned with your revenue and activity goals',
          goalAlignment: 'Foundation setup',
          estimatedImpact: 'Enable AI-powered daily recommendations',
          priority: 'high',
          estimatedTime: 5
        },
        {
          id: 'default-2',
          text: 'Review your top 5 opportunities',
          reason: 'Check progress on active deals',
          goalAlignment: 'Pipeline health',
          estimatedImpact: 'Identify any blockers',
          priority: 'medium',
          estimatedTime: 15
        },
        {
          id: 'default-3',
          text: 'Make 10 outreach touches',
          reason: 'Build healthy pipeline for future quarters',
          goalAlignment: 'Activity consistency',
          estimatedImpact: 'Generate new opportunities',
          priority: 'medium',
          estimatedTime: 30
        }
      ],
      generatedAt: new Date(),
      goalsSummary: 'Set goals in Settings to see personalized summary',
      dailyFocus: 'Complete your top priorities to build momentum',
      estimatedTotalTime: 50
    };
  }
}

