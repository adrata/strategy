/**
 * User Goals Service
 * Manages user revenue and activity goals for Smart checklist generation and AI recommendations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface UserGoals {
  // Revenue Goals
  quarterlyRevenueGoal?: number;
  yearlyRevenueGoal?: number;
  currentQuarterRevenue?: number;
  currentYearRevenue?: number;
  
  // Pipeline Goals
  pipelineValueGoal?: number;
  currentPipelineValue?: number;
  avgDealSizeGoal?: number;
  winRateGoal?: number;
  
  // Activity Goals
  weeklyOutreachGoal?: number;
  weeklyMeetingsGoal?: number;
  weeklyCallsGoal?: number;
  weeklyEmailsGoal?: number;
  
  // Custom Goals
  customGoals?: Array<{
    name: string;
    target: number;
    current: number;
    unit: string;
    deadline?: Date;
  }>;
  
  // Goal Period
  goalPeriod?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  goalStartDate?: Date;
  goalEndDate?: Date;
}

export interface GoalProgress {
  overallProgress: number;  // 0-100
  isOnTrack: boolean;
  daysRemaining: number;
  
  // Individual Goal Progress
  revenueProgress: number;
  pipelineProgress: number;
  activityProgress: number;
  customGoalsProgress: Array<{
    name: string;
    progress: number;
    isOnTrack: boolean;
  }>;
  
  // Recommendations
  recommendations: string[];
  priorityAreas: string[];
}

export class UserGoalsService {
  /**
   * Get user goals from database
   */
  static async getUserGoals(userId: string, workspaceId: string): Promise<UserGoals | null> {
    try {
      const goals = await prisma.user_goals.findUnique({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId
          }
        }
      });
      
      if (!goals) {
        return null;
      }
      
      // Parse custom goals from JSONB
      const customGoals = goals.customGoals ? 
        (typeof goals.customGoals === 'string' ? JSON.parse(goals.customGoals) : goals.customGoals) : 
        [];
      
      return {
        quarterlyRevenueGoal: goals.quarterlyRevenueGoal ? Number(goals.quarterlyRevenueGoal) : undefined,
        yearlyRevenueGoal: goals.yearlyRevenueGoal ? Number(goals.yearlyRevenueGoal) : undefined,
        currentQuarterRevenue: goals.currentQuarterRevenue ? Number(goals.currentQuarterRevenue) : undefined,
        currentYearRevenue: goals.currentYearRevenue ? Number(goals.currentYearRevenue) : undefined,
        pipelineValueGoal: goals.pipelineValueGoal ? Number(goals.pipelineValueGoal) : undefined,
        currentPipelineValue: goals.currentPipelineValue ? Number(goals.currentPipelineValue) : undefined,
        avgDealSizeGoal: goals.avgDealSizeGoal ? Number(goals.avgDealSizeGoal) : undefined,
        winRateGoal: goals.winRateGoal ? Number(goals.winRateGoal) : undefined,
        weeklyOutreachGoal: goals.weeklyOutreachGoal || undefined,
        weeklyMeetingsGoal: goals.weeklyMeetingsGoal || undefined,
        weeklyCallsGoal: goals.weeklyCallsGoal || undefined,
        weeklyEmailsGoal: goals.weeklyEmailsGoal || undefined,
        customGoals: customGoals,
        goalPeriod: (goals.goalPeriod as any) || 'quarterly',
        goalStartDate: goals.goalStartDate || undefined,
        goalEndDate: goals.goalEndDate || undefined
      };
    } catch (error) {
      console.error('Error fetching user goals:', error);
      return null;
    }
  }
  
  /**
   * Set or update user goals
   */
  static async setUserGoals(userId: string, workspaceId: string, goals: UserGoals): Promise<boolean> {
    try {
      await prisma.user_goals.upsert({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId
          }
        },
        update: {
          quarterlyRevenueGoal: goals.quarterlyRevenueGoal,
          yearlyRevenueGoal: goals.yearlyRevenueGoal,
          currentQuarterRevenue: goals.currentQuarterRevenue,
          currentYearRevenue: goals.currentYearRevenue,
          pipelineValueGoal: goals.pipelineValueGoal,
          currentPipelineValue: goals.currentPipelineValue,
          avgDealSizeGoal: goals.avgDealSizeGoal,
          winRateGoal: goals.winRateGoal,
          weeklyOutreachGoal: goals.weeklyOutreachGoal,
          weeklyMeetingsGoal: goals.weeklyMeetingsGoal,
          weeklyCallsGoal: goals.weeklyCallsGoal,
          weeklyEmailsGoal: goals.weeklyEmailsGoal,
          customGoals: goals.customGoals ? JSON.stringify(goals.customGoals) : undefined,
          goalPeriod: goals.goalPeriod,
          goalStartDate: goals.goalStartDate,
          goalEndDate: goals.goalEndDate,
          updatedAt: new Date()
        },
        create: {
          userId,
          workspaceId,
          quarterlyRevenueGoal: goals.quarterlyRevenueGoal,
          yearlyRevenueGoal: goals.yearlyRevenueGoal,
          currentQuarterRevenue: goals.currentQuarterRevenue || 0,
          currentYearRevenue: goals.currentYearRevenue || 0,
          pipelineValueGoal: goals.pipelineValueGoal,
          currentPipelineValue: goals.currentPipelineValue || 0,
          avgDealSizeGoal: goals.avgDealSizeGoal,
          winRateGoal: goals.winRateGoal,
          weeklyOutreachGoal: goals.weeklyOutreachGoal,
          weeklyMeetingsGoal: goals.weeklyMeetingsGoal,
          weeklyCallsGoal: goals.weeklyCallsGoal,
          weeklyEmailsGoal: goals.weeklyEmailsGoal,
          customGoals: goals.customGoals ? JSON.stringify(goals.customGoals) : '[]',
          goalPeriod: goals.goalPeriod || 'quarterly',
          goalStartDate: goals.goalStartDate,
          goalEndDate: goals.goalEndDate
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error saving user goals:', error);
      return false;
    }
  }
  
  /**
   * Calculate progress toward goals
   */
  static async calculateProgress(userId: string, workspaceId: string): Promise<GoalProgress> {
    try {
      const goals = await this.getUserGoals(userId, workspaceId);
      
      if (!goals) {
        return this.getDefaultProgress();
      }
      
      // Get actual revenue data from opportunities
      const opportunities = await prisma.companies.findMany({
        where: {
          workspaceId,
          mainSellerId: userId,
          status: { in: ['OPPORTUNITY', 'CLIENT'] }
        },
        select: {
          opportunityAmount: true,
          opportunityStage: true,
          status: true,
          actualCloseDate: true
        }
      });
      
      // Calculate current quarter revenue (closed deals)
      const currentQuarter = this.getCurrentQuarter();
      const quarterRevenue = opportunities
        .filter(opp => 
          opp.status === 'CLIENT' && 
          opp.actualCloseDate &&
          this.isInCurrentQuarter(opp.actualCloseDate)
        )
        .reduce((sum, opp) => sum + Number(opp.opportunityAmount || 0), 0);
      
      // Calculate pipeline value (open opportunities)
      const pipelineValue = opportunities
        .filter(opp => opp.status === 'OPPORTUNITY')
        .reduce((sum, opp) => sum + Number(opp.opportunityAmount || 0), 0);
      
      // Get activity counts for the week
      const weekStart = this.getWeekStart();
      const weekActivities = await prisma.actions.findMany({
        where: {
          workspaceId,
          userId,
          createdAt: { gte: weekStart }
        },
        select: {
          type: true
        }
      });
      
      const weeklyOutreach = weekActivities.filter(a => 
        a.type === 'email_conversation' || 
        a.type === 'phone_call' || 
        a.type === 'linkedin_connection_request'
      ).length;
      
      const weeklyMeetings = weekActivities.filter(a => 
        a.type === 'meeting_scheduled' || 
        a.type === 'call'
      ).length;
      
      const weeklyCalls = weekActivities.filter(a => 
        a.type === 'phone_call' || 
        a.type === 'call'
      ).length;
      
      // Calculate progress percentages
      const revenueProgress = goals.quarterlyRevenueGoal ? 
        Math.min(100, (quarterRevenue / goals.quarterlyRevenueGoal) * 100) : 0;
      
      const pipelineProgress = goals.pipelineValueGoal ?
        Math.min(100, (pipelineValue / goals.pipelineValueGoal) * 100) : 0;
      
      const activityProgress = goals.weeklyOutreachGoal ?
        Math.min(100, (weeklyOutreach / goals.weeklyOutreachGoal) * 100) : 0;
      
      // Calculate overall progress (weighted average)
      const overallProgress = (revenueProgress * 0.5) + (pipelineProgress * 0.3) + (activityProgress * 0.2);
      
      // Determine if on track (need to be at ~75% by 75% of period)
      const daysRemaining = goals.goalEndDate ? 
        Math.ceil((goals.goalEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 90;
      
      const isOnTrack = overallProgress >= 70 || revenueProgress >= 75;
      
      // Generate recommendations based on gaps
      const recommendations: string[] = [];
      const priorityAreas: string[] = [];
      
      if (revenueProgress < 50) {
        recommendations.push('Focus on closing Build/Justify stage opportunities to accelerate revenue');
        priorityAreas.push('Revenue');
      }
      
      if (pipelineProgress < 70) {
        recommendations.push('Build pipeline by moving more prospects from Initiate to Educate stage');
        priorityAreas.push('Pipeline');
      }
      
      if (activityProgress < 80) {
        recommendations.push('Increase outreach to hit weekly activity goal');
        priorityAreas.push('Activity');
      }
      
      // Update goals with calculated values
      await prisma.user_goals.update({
        where: {
          userId_workspaceId: { userId, workspaceId }
        },
        data: {
          currentQuarterRevenue: quarterRevenue,
          currentPipelineValue: pipelineValue,
          progressPercentage: Math.round(overallProgress),
          isOnTrack,
          daysRemaining,
          lastCalculated: new Date()
        }
      });
      
      return {
        overallProgress: Math.round(overallProgress),
        isOnTrack,
        daysRemaining,
        revenueProgress: Math.round(revenueProgress),
        pipelineProgress: Math.round(pipelineProgress),
        activityProgress: Math.round(activityProgress),
        customGoalsProgress: [],  // TODO: Calculate custom goals
        recommendations,
        priorityAreas
      };
      
    } catch (error) {
      console.error('Error calculating goal progress:', error);
      return this.getDefaultProgress();
    }
  }
  
  /**
   * Check if user is on track to hit goals
   */
  static async checkOnTrack(userId: string, workspaceId: string): Promise<boolean> {
    try {
      const progress = await this.calculateProgress(userId, workspaceId);
      return progress.isOnTrack;
    } catch (error) {
      console.error('Error checking on-track status:', error);
      return true;  // Default to optimistic
    }
  }
  
  /**
   * Get goal-based recommendations for AI
   */
  static async getGoalRecommendations(userId: string, workspaceId: string): Promise<string[]> {
    try {
      const progress = await this.calculateProgress(userId, workspaceId);
      return progress.recommendations;
    } catch (error) {
      console.error('Error getting goal recommendations:', error);
      return [];
    }
  }
  
  /**
   * Get goal context string for AI prompts
   */
  static async getGoalContextForAI(userId: string, workspaceId: string): Promise<string> {
    try {
      const goals = await this.getUserGoals(userId, workspaceId);
      const progress = await this.calculateProgress(userId, workspaceId);
      
      if (!goals) {
        return 'USER GOALS: Not set yet. Recommend user sets goals in Settings.';
      }
      
      const onTrackEmoji = progress.isOnTrack ? '✅' : '⚠️';
      
      let contextString = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
USER GOALS & PROGRESS ${onTrackEmoji}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

QUARTERLY GOALS (${progress.daysRemaining} days remaining):
`;

      if (goals.quarterlyRevenueGoal) {
        contextString += `• Revenue Goal: $${goals.quarterlyRevenueGoal.toLocaleString()} (Current: $${goals.currentQuarterRevenue?.toLocaleString() || '0'} - ${progress.revenueProgress}%)
`;
      }
      
      if (goals.pipelineValueGoal) {
        contextString += `• Pipeline Goal: $${goals.pipelineValueGoal.toLocaleString()} (Current: $${goals.currentPipelineValue?.toLocaleString() || '0'} - ${progress.pipelineProgress}%)
`;
      }
      
      contextString += `
WEEKLY ACTIVITY GOALS:
`;
      
      if (goals.weeklyOutreachGoal) {
        contextString += `• Outreach: ${goals.weeklyOutreachGoal} contacts per week
`;
      }
      
      if (goals.weeklyMeetingsGoal) {
        contextString += `• Meetings: ${goals.weeklyMeetingsGoal} meetings per week
`;
      }
      
      if (goals.customGoals && goals.customGoals.length > 0) {
        contextString += `
CUSTOM GOALS:
${goals.customGoals.map(g => `• ${g.name}: ${g.current}/${g.target} ${g.unit}`).join('\n')}
`;
      }
      
      contextString += `
PROGRESS STATUS: ${progress.isOnTrack ? 'ON TRACK ✅' : 'BEHIND PACE ⚠️'}
Overall Progress: ${progress.overallProgress}%

PRIORITY AREAS: ${progress.priorityAreas.join(', ') || 'None'}

RECOMMENDATIONS:
${progress.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI INSTRUCTION: Align all recommendations with these goals. Every suggested action should help user progress toward their targets.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
      
      return contextString;
    } catch (error) {
      console.error('Error building goal context for AI:', error);
      return 'USER GOALS: Error loading goals data.';
    }
  }
  
  // Helper methods
  
  private static getCurrentQuarter(): { start: Date; end: Date } {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const quarter = Math.floor(month / 3);
    
    const start = new Date(year, quarter * 3, 1);
    const end = new Date(year, (quarter + 1) * 3, 0, 23, 59, 59);
    
    return { start, end };
  }
  
  private static isInCurrentQuarter(date: Date): boolean {
    const quarter = this.getCurrentQuarter();
    return date >= quarter.start && date <= quarter.end;
  }
  
  private static getWeekStart(): Date {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday as start
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - diff);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }
  
  private static getDefaultProgress(): GoalProgress {
    return {
      overallProgress: 0,
      isOnTrack: true,
      daysRemaining: 90,
      revenueProgress: 0,
      pipelineProgress: 0,
      activityProgress: 0,
      customGoalsProgress: [],
      recommendations: ['Set goals in Settings to get personalized recommendations'],
      priorityAreas: []
    };
  }
}

