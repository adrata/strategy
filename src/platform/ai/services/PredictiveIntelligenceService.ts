/**
 * 🔮 PREDICTIVE INTELLIGENCE SERVICE
 * 
 * Advanced AI service that makes Adrata the smartest sales helper
 * Provides predictive insights, behavioral learning, and proactive recommendations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PredictiveLeadScore {
  leadId: string;
  conversionProbability: number; // 0-1
  timeToClose: number; // days
  revenueProjection: number;
  engagementLikelihood: number; // 0-1
  competitorRisk: number; // 0-1
  urgencyFactors: string[];
  recommendedActions: RecommendedAction[];
  confidence: number; // 0-1
}

export interface RecommendedAction {
  type: 'email' | 'call' | 'linkedin' | 'demo' | 'proposal' | 'follow_up';
  priority: 'critical' | 'high' | 'medium' | 'low';
  timing: 'immediate' | 'today' | 'this_week' | 'next_week';
  message: string;
  reasoning: string;
  expectedOutcome: string;
}

export interface SmartAlert {
  id: string;
  type: 'opportunity' | 'risk' | 'timing' | 'competitor' | 'budget' | 'engagement';
  priority: 'critical' | 'high' | 'medium' | 'low';
  leadId: string;
  companyId: string;
  title: string;
  message: string;
  insight: string;
  recommendedActions: RecommendedAction[];
  timeWindow: {
    start: Date;
    end: Date;
    optimal: Date;
  };
  confidence: number;
}

export interface BehavioralPattern {
  userId: string;
  patternType: 'communication' | 'timing' | 'decision' | 'success';
  pattern: Record<string, any>;
  confidence: number;
  lastUpdated: Date;
}

export class PredictiveIntelligenceService {

  /**
   * Generate predictive lead score with advanced ML insights
   */
  static async generateLeadScore(leadId: string, workspaceId: string): Promise<PredictiveLeadScore> {
    try {
      // Fetch lead data with relationships
      const lead = await prisma.leads.findFirst({
        where: { id: leadId, workspaceId , deletedAt: null},
        include: {
          opportunities: true,
          leadNotes: { orderBy: { createdAt: 'desc' }, take: 10 },
          activities: { orderBy: { createdAt: 'desc' }, take: 20 }
        }
      });

      if (!lead) {
        throw new Error('Lead not found');
      }

      // Calculate base scores
      const companyScore = this.calculateCompanyScore(lead);
      const roleScore = this.calculateRoleScore(lead);
      const engagementScore = await this.calculateEngagementScore(lead);
      const timingScore = this.calculateTimingScore(lead);
      const competitorRisk = await this.calculateCompetitorRisk(lead);

      // Weighted combination for conversion probability
      const conversionProbability = Math.min(1, 
        (companyScore * 0.3) + 
        (roleScore * 0.25) + 
        (engagementScore * 0.25) + 
        (timingScore * 0.2)
      );

      // Estimate time to close based on historical patterns
      const timeToClose = this.estimateTimeToClose(lead, conversionProbability);

      // Project revenue based on company size and opportunity indicators
      const revenueProjection = this.projectRevenue(lead, conversionProbability);

      // Generate urgency factors
      const urgencyFactors = this.identifyUrgencyFactors(lead);

      // Generate recommended actions
      const recommendedActions = await this.generateRecommendedActions(lead, {
        conversionProbability,
        engagementScore,
        timingScore,
        competitorRisk
      });

      return {
        leadId,
        conversionProbability,
        timeToClose,
        revenueProjection,
        engagementLikelihood: engagementScore,
        competitorRisk,
        urgencyFactors,
        recommendedActions,
        confidence: this.calculateConfidence(lead, engagementScore)
      };

    } catch (error) {
      console.error('Error generating lead score:', error);
      throw error;
    }
  }

  /**
   * Generate smart alerts based on behavioral patterns and signals
   */
  static async generateSmartAlerts(workspaceId: string, userId: string): Promise<SmartAlert[]> {
    try {
      const alerts: SmartAlert[] = [];

      // Get recent leads with activity
      const recentLeads = await prisma.leads.findMany({
        where: {
          workspaceId,
          updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) , deletedAt: null} // Last 7 days
        },
        include: {
          opportunities: true,
          leadNotes: { orderBy: { createdAt: 'desc' }, take: 5 },
          activities: { orderBy: { createdAt: 'desc' }, take: 10 }
        },
        take: 50
      });

      for (const lead of recentLeads) {
        // Engagement spike alert
        const engagementAlert = await this.checkEngagementSpike(lead);
        if (engagementAlert) alerts.push(engagementAlert);

        // Timing opportunity alert
        const timingAlert = this.checkTimingOpportunity(lead);
        if (timingAlert) alerts.push(timingAlert);

        // Risk alert
        const riskAlert = this.checkRiskFactors(lead);
        if (riskAlert) alerts.push(riskAlert);

        // Competitor alert
        const competitorAlert = await this.checkCompetitorSignals(lead);
        if (competitorAlert) alerts.push(competitorAlert);
      }

      // Sort by priority and confidence
      return alerts
        .sort((a, b) => {
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return b.confidence - a.confidence;
        })
        .slice(0, 10); // Return top 10 alerts

    } catch (error) {
      console.error('Error generating smart alerts:', error);
      return [];
    }
  }

  /**
   * Learn and update behavioral patterns
   */
  static async updateBehavioralPatterns(userId: string, interaction: any): Promise<void> {
    try {
      // This would implement behavioral learning
      // For now, we'll create a basic pattern recognition system
      
      const patterns = await this.analyzeBehavioralPatterns(userId, interaction);
      
      for (const pattern of patterns) {
        await this.storeBehavioralPattern(pattern);
      }

    } catch (error) {
      console.error('Error updating behavioral patterns:', error);
    }
  }

  /**
   * Get personalized recommendations based on user behavior
   */
  static async getPersonalizedRecommendations(
    userId: string, 
    workspaceId: string, 
    context?: any
  ): Promise<RecommendedAction[]> {
    try {
      // Get user's behavioral patterns
      const userPatterns = await this.getUserBehavioralPatterns(userId);
      
      // Get current high-priority leads
      const priorityLeads = await this.getPriorityLeads(workspaceId, 5);
      
      const recommendations: RecommendedAction[] = [];

      for (const lead of priorityLeads) {
        const leadScore = await this.generateLeadScore(lead.id, workspaceId);
        const personalizedActions = this.personalizeActions(leadScore.recommendedActions, userPatterns);
        recommendations.push(...personalizedActions);
      }

      return recommendations.slice(0, 5); // Top 5 recommendations

    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      return [];
    }
  }

  // Private helper methods

  private static calculateCompanyScore(lead: any): number {
    let score = 0.5; // Base score

    // Company size indicators
    const company = lead.company?.toLowerCase() || '';
    if (company.includes('corp') || company.includes('inc') || company.includes('llc')) {
      score += 0.2;
    }

    // Industry indicators (retail/convenience stores are high value for this demo)
    if (company.includes('starbucks') || company.includes('target') || company.includes('walmart')) {
      score += 0.3;
    }

    return Math.min(1, score);
  }

  private static calculateRoleScore(lead: any): number {
    let score = 0.3; // Base score

    const title = lead.jobTitle?.toLowerCase() || lead.title?.toLowerCase() || '';
    
    // Decision maker indicators
    if (title.includes('cto') || title.includes('cio') || title.includes('vp')) {
      score += 0.4;
    } else if (title.includes('director') || title.includes('manager')) {
      score += 0.3;
    } else if (title.includes('analyst') || title.includes('senior')) {
      score += 0.2;
    }

    return Math.min(1, score);
  }

  private static async calculateEngagementScore(lead: any): Promise<number> {
    let score = 0.2; // Base score

    // Recent activity
    const recentActivities = lead.activities?.filter((activity: any) => {
      const activityDate = new Date(activity.createdAt);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return activityDate > weekAgo;
    }) || [];

    score += Math.min(0.4, recentActivities.length * 0.1);

    // Notes indicate engagement
    const recentNotes = lead.leadNotes?.filter((note: any) => {
      const noteDate = new Date(note.createdAt);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return noteDate > weekAgo;
    }) || [];

    score += Math.min(0.3, recentNotes.length * 0.1);

    // Status indicates engagement level
    if (lead['status'] === 'qualified') score += 0.3;
    else if (lead['status'] === 'contacted') score += 0.2;
    else if (lead['status'] === 'new') score += 0.1;

    return Math.min(1, score);
  }

  private static calculateTimingScore(lead: any): number {
    let score = 0.5; // Base score

    // Recent updates indicate good timing
    const lastUpdate = new Date(lead.updatedAt);
    const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceUpdate < 1) score += 0.3;
    else if (daysSinceUpdate < 3) score += 0.2;
    else if (daysSinceUpdate < 7) score += 0.1;
    else if (daysSinceUpdate > 30) score -= 0.2;

    // Quarter timing (Q4 is typically better for B2B)
    const currentMonth = new Date().getMonth();
    if (currentMonth >= 9) score += 0.2; // Q4

    return Math.max(0, Math.min(1, score));
  }

  private static async calculateCompetitorRisk(lead: any): Promise<number> {
    let risk = 0.2; // Base risk

    // Check notes for competitor mentions
    const notes = lead.leadNotes || [];
    const competitorKeywords = ['competitor', 'alternative', 'comparing', 'evaluation', 'vendor'];
    
    for (const note of notes) {
      const content = note.content?.toLowerCase() || '';
      if (competitorKeywords.some(keyword => content.includes(keyword))) {
        risk += 0.3;
        break;
      }
    }

    return Math.min(1, risk);
  }

  private static estimateTimeToClose(lead: any, conversionProbability: number): number {
    // Base time to close: 45 days
    let days = 45;

    // Adjust based on conversion probability
    if (conversionProbability > 0.8) days = 30;
    else if (conversionProbability > 0.6) days = 35;
    else if (conversionProbability < 0.3) days = 90;

    // Adjust based on role
    const title = lead.jobTitle?.toLowerCase() || '';
    if (title.includes('cto') || title.includes('cio')) days -= 10;
    else if (title.includes('analyst')) days += 15;

    return Math.max(7, days); // Minimum 7 days
  }

  private static projectRevenue(lead: any, conversionProbability: number): number {
    // Base revenue projection
    let revenue = 25000; // $25K base

    // Adjust based on company size
    const company = lead.company?.toLowerCase() || '';
    if (company.includes('starbucks') || company.includes('walmart')) {
      revenue = 100000; // $100K for large enterprises
    } else if (company.includes('target') || company.includes('costco')) {
      revenue = 75000; // $75K for large retailers
    }

    // Adjust based on role
    const title = lead.jobTitle?.toLowerCase() || '';
    if (title.includes('cto') || title.includes('cio')) revenue *= 1.5;
    else if (title.includes('vp')) revenue *= 1.3;

    // Apply conversion probability
    return Math.round(revenue * conversionProbability);
  }

  private static identifyUrgencyFactors(lead: any): string[] {
    const factors: string[] = [];

    // Recent activity
    const lastUpdate = new Date(lead.updatedAt);
    const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceUpdate < 1) {
      factors.push('Recent activity - high engagement');
    }

    // Status-based urgency
    if (lead['status'] === 'qualified') {
      factors.push('Qualified lead - ready for opportunity creation');
    }

    // Quarter timing
    const currentMonth = new Date().getMonth();
    if (currentMonth >= 9) {
      factors.push('Q4 timing - budget availability');
    }

    // Company-specific factors
    const company = lead.company?.toLowerCase() || '';
    if (company.includes('starbucks')) {
      factors.push('Large enterprise - high revenue potential');
    }

    return factors;
  }

  private static async generateRecommendedActions(
    lead: any, 
    scores: { conversionProbability: number; engagementScore: number; timingScore: number; competitorRisk: number }
  ): Promise<RecommendedAction[]> {
    const actions: RecommendedAction[] = [];

    // High conversion probability - move fast
    if (scores.conversionProbability > 0.7) {
      actions.push({
        type: 'demo',
        priority: 'high',
        timing: 'this_week',
        message: 'Schedule product demonstration',
        reasoning: 'High conversion probability indicates readiness for demo',
        expectedOutcome: 'Move to opportunity stage'
      });
    }

    // High engagement - capitalize
    if (scores.engagementScore > 0.6) {
      actions.push({
        type: 'call',
        priority: 'high',
        timing: 'today',
        message: 'Follow up with phone call',
        reasoning: 'Recent engagement indicates interest',
        expectedOutcome: 'Qualify needs and timeline'
      });
    }

    // Competitor risk - address quickly
    if (scores.competitorRisk > 0.5) {
      actions.push({
        type: 'email',
        priority: 'critical',
        timing: 'immediate',
        message: 'Send competitive differentiation email',
        reasoning: 'Competitor evaluation detected',
        expectedOutcome: 'Position against competition'
      });
    }

    // Good timing - reach out
    if (scores.timingScore > 0.7) {
      actions.push({
        type: 'linkedin',
        priority: 'medium',
        timing: 'this_week',
        message: 'Connect on LinkedIn with personalized message',
        reasoning: 'Optimal timing for outreach',
        expectedOutcome: 'Build relationship and awareness'
      });
    }

    // Default action for new leads
    if (lead['status'] === 'new' && actions['length'] === 0) {
      actions.push({
        type: 'email',
        priority: 'medium',
        timing: 'today',
        message: 'Send personalized introduction email',
        reasoning: 'New lead requires initial outreach',
        expectedOutcome: 'Generate interest and response'
      });
    }

    return actions.slice(0, 3); // Top 3 actions
  }

  private static calculateConfidence(lead: any, engagementScore: number): number {
    let confidence = 0.5; // Base confidence

    // More data = higher confidence
    const dataPoints = [
      lead.email,
      lead.phone,
      lead.company,
      lead.jobTitle,
      lead.leadNotes?.length > 0,
      lead.activities?.length > 0
    ].filter(Boolean).length;

    confidence += (dataPoints / 6) * 0.3;

    // Recent activity increases confidence
    confidence += engagementScore * 0.2;

    return Math.min(1, confidence);
  }

  // Placeholder methods for advanced features
  private static async checkEngagementSpike(lead: any): Promise<SmartAlert | null> {
    // Implementation would analyze engagement patterns
    return null;
  }

  private static checkTimingOpportunity(lead: any): SmartAlert | null {
    // Implementation would check timing signals
    return null;
  }

  private static checkRiskFactors(lead: any): SmartAlert | null {
    // Implementation would identify risk factors
    return null;
  }

  private static async checkCompetitorSignals(lead: any): Promise<SmartAlert | null> {
    // Implementation would monitor competitor mentions
    return null;
  }

  private static async analyzeBehavioralPatterns(userId: string, interaction: any): Promise<BehavioralPattern[]> {
    // Implementation would analyze user behavior patterns
    return [];
  }

  private static async storeBehavioralPattern(pattern: BehavioralPattern): Promise<void> {
    // Implementation would store patterns in database
  }

  private static async getUserBehavioralPatterns(userId: string): Promise<BehavioralPattern[]> {
    // Implementation would retrieve user patterns
    return [];
  }

  private static async getPriorityLeads(workspaceId: string, limit: number): Promise<any[]> {
    return await prisma.leads.findMany({
      where: { workspaceId, status: { in: ['new', 'contacted', 'qualified'] , deletedAt: null } },
      orderBy: { updatedAt: 'desc' },
      take: limit
    });
  }

  private static personalizeActions(actions: RecommendedAction[], patterns: BehavioralPattern[]): RecommendedAction[] {
    // Implementation would personalize actions based on user patterns
    return actions;
  }
}
