/**
 * 🔮 DEAL CLOSE DATE PREDICTION SERVICE
 * 
 * AI-powered deal close date prediction with LLM reasoning
 * Uses Adrata Methodology (A.D.R.A.T.A) for comprehensive analysis
 */

import { PrismaClient } from '@prisma/client';
import { OpenAIService } from './openaiService';

const prisma = new PrismaClient();

export interface DealClosePrediction {
  opportunityId: string;
  predictedCloseDate: Date;
  confidence: number; // 0-100
  reasoning: string;
  adrataScore: AdrataScore;
  riskFactors: string[];
  accelerationOpportunities: string[];
  recommendedActions: string[];
  lastUpdated: Date;
}

export interface AdrataScore {
  authority: number; // 0-10
  dynamics: number; // 0-10  
  reality: number; // 0-10
  acceleration: number; // 0-10
  timeline: number; // 0-10
  actions: number; // 0-10
  overall: number; // 0-100
}

export interface TodayVsReality {
  today: string; // What we think is happening
  reality: string; // What's actually happening
  gap: string; // The disconnect
  impact: 'positive' | 'negative' | 'neutral';
}

export class DealClosePredictionService {
  private openAI: OpenAIService;

  constructor() {
    this['openAI'] = new OpenAIService();
  }

  /**
   * Generate AI-powered close date prediction with reasoning
   */
  async predictCloseDate(opportunityId: string, workspaceId: string): Promise<DealClosePrediction> {
    console.log(`🔮 Generating close date prediction for opportunity ${opportunityId}`);

    try {
      // Fetch comprehensive opportunity data
      const opportunity = await this.fetchOpportunityData(opportunityId, workspaceId);
      
      if (!opportunity) {
        throw new Error('Opportunity not found');
      }

      // Calculate Adrata Score using A.D.R.A.T.A methodology
      const adrataScore = await this.calculateAdrataScore(opportunity);
      
      // Generate TODAY vs REALITY analysis
      const todayVsReality = await this.analyzeTodayVsReality(opportunity);
      
      // Generate LLM-powered prediction and reasoning
      const prediction = await this.generateLLMPrediction(opportunity, adrataScore, todayVsReality);
      
      // Calculate confidence based on data completeness and score
      const confidence = this.calculateConfidence(opportunity, adrataScore);
      
      return {
        opportunityId,
        predictedCloseDate: prediction.closeDate,
        confidence,
        reasoning: prediction.reasoning,
        adrataScore,
        riskFactors: prediction.riskFactors,
        accelerationOpportunities: prediction.accelerationOpportunities,
        recommendedActions: prediction.recommendedActions,
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error('Error predicting close date:', error);
      throw error;
    }
  }

  /**
   * Fetch comprehensive opportunity data for analysis
   */
  private async fetchOpportunityData(opportunityId: string, workspaceId: string) {
    return await prisma.opportunities.findFirst({
      where: { id: opportunityId, workspaceId , deletedAt: null},
      include: {
        account: true,
        assignedUser: true,
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        stakeholders: {
          include: {
            contact: true
          }
        }
      }
    });
  }

  /**
   * Calculate Adrata Score using A.D.R.A.T.A methodology
   */
  private async calculateAdrataScore(opportunity: any): Promise<AdrataScore> {
    const authority = this.scoreAuthority(opportunity);
    const dynamics = this.scoreDynamics(opportunity);
    const reality = this.scoreReality(opportunity);
    const acceleration = this.scoreAcceleration(opportunity);
    const timeline = this.scoreTimeline(opportunity);
    const actions = this.scoreActions(opportunity);
    
    const overall = Math.round((authority + dynamics + reality + acceleration + timeline + actions) / 6 * 10);
    
    return {
      authority,
      dynamics,
      reality,
      acceleration,
      timeline,
      actions,
      overall
    };
  }

  /**
   * A - Authority: Decision maker identification and access
   */
  private scoreAuthority(opportunity: any): number {
    let score = 0;
    
    // Check for economic buyer identification
    if (opportunity.buyingCommittee?.economicBuyer) score += 3;
    
    // Check stakeholder authority levels
    const stakeholders = opportunity.stakeholders || [];
    const hasExecutive = stakeholders.some((s: any) => 
      s.role?.toLowerCase().includes('ceo') || 
      s.role?.toLowerCase().includes('president') ||
      s.role?.toLowerCase().includes('director')
    );
    if (hasExecutive) score += 2;
    
    // Check for budget authority
    if (opportunity['amount'] && opportunity.amount > 0) score += 2;
    
    // Check for decision timeline
    if (opportunity.expectedCloseDate) score += 2;
    
    // Engagement with authority figures
    const executiveEngagement = stakeholders.filter((s: any) => 
      s['engagementLevel'] === 'High' && s['influence'] === 'High'
    ).length;
    if (executiveEngagement > 0) score += 1;
    
    return Math.min(10, score);
  }

  /**
   * D - Dynamics: Political landscape and stakeholder dynamics
   */
  private scoreDynamics(opportunity: any): number {
    let score = 0;
    
    const stakeholders = opportunity.stakeholders || [];
    
    // Stakeholder mapping completeness
    if (stakeholders.length >= 3) score += 2;
    if (stakeholders.length >= 5) score += 1;
    
    // Champion identification
    const champions = stakeholders.filter((s: any) => s.role?.toLowerCase().includes('champion'));
    if (champions.length > 0) score += 3;
    
    // Influence mapping
    const highInfluence = stakeholders.filter((s: any) => s['influence'] === 'High').length;
    if (highInfluence >= 2) score += 2;
    
    // Competition analysis
    if (opportunity.competitionData) score += 1;
    
    // Internal alignment
    const supportive = stakeholders.filter((s: any) => s['engagementLevel'] === 'High').length;
    if (supportive >= 2) score += 1;
    
    return Math.min(10, score);
  }

  /**
   * R - Reality: Current situation vs perception
   */
  private scoreReality(opportunity: any): number {
    let score = 5; // Start neutral
    
    // Recent activity indicates engagement
    const recentActivities = opportunity.activities?.filter((a: any) => {
      const daysSince = (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 7;
    }) || [];
    
    if (recentActivities.length > 0) score += 2;
    if (recentActivities.length >= 3) score += 1;
    
    // Response rate and engagement
    const completedActivities = opportunity.activities?.filter((a: any) => a['status'] === 'completed') || [];
    const responseRate = opportunity.activities?.length > 0 ? 
      completedActivities.length / opportunity.activities.length : 0;
    
    if (responseRate > 0.7) score += 2;
    else if (responseRate < 0.3) score -= 2;
    
    // Timeline alignment
    if (opportunity.expectedCloseDate) {
      const daysToClose = (new Date(opportunity.expectedCloseDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysToClose > 0 && daysToClose < 90) score += 1;
      else if (daysToClose < 0) score -= 2; // Overdue
    }
    
    return Math.max(0, Math.min(10, score));
  }

  /**
   * A - Acceleration: Factors that speed up deal closure
   */
  private scoreAcceleration(opportunity: any): number {
    let score = 0;
    
    // Urgency factors
    if (opportunity['priority'] === 'high') score += 2;
    if (opportunity.tags?.includes('urgent')) score += 1;
    
    // Budget cycle alignment
    const currentMonth = new Date().getMonth();
    const isQuarterEnd = [2, 5, 8, 11].includes(currentMonth); // Mar, Jun, Sep, Dec
    if (isQuarterEnd) score += 1;
    
    // Competitive pressure
    if (opportunity.competitionData) score += 1;
    
    // Implementation deadline
    if (opportunity.customFields?.implementationDeadline) score += 2;
    
    // Executive sponsorship
    const stakeholders = opportunity.stakeholders || [];
    const executiveSponsor = stakeholders.some((s: any) => 
      s['influence'] === 'High' && s['engagementLevel'] === 'High'
    );
    if (executiveSponsor) score += 2;
    
    // Deal size (larger deals often have more urgency)
    if (opportunity.amount > 100000) score += 1;
    
    return Math.min(10, score);
  }

  /**
   * T - Timeline: Realistic timeline assessment
   */
  private scoreTimeline(opportunity: any): number {
    let score = 5; // Start neutral
    
    // Expected close date exists and reasonable
    if (opportunity.expectedCloseDate) {
      const daysToClose = (new Date(opportunity.expectedCloseDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      
      if (daysToClose > 0 && daysToClose <= 30) score += 3; // Good timeline
      else if (daysToClose > 30 && daysToClose <= 90) score += 2; // Reasonable
      else if (daysToClose > 90) score += 1; // Long timeline
      else if (daysToClose < 0) score -= 3; // Overdue
    } else {
      score -= 2; // No timeline set
    }
    
    // Stage progression rate
    if (opportunity.stageEntryDate) {
      const daysInStage = (Date.now() - new Date(opportunity.stageEntryDate).getTime()) / (1000 * 60 * 60 * 24);
      if (daysInStage > 60) score -= 1; // Stuck in stage
    }
    
    // Historical velocity (would use actual data in production)
    const averageSalesCycle = 45; // days
    if (opportunity.expectedCloseDate) {
      const projectedCycle = (new Date(opportunity.expectedCloseDate).getTime() - new Date(opportunity.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (projectedCycle <= averageSalesCycle) score += 1;
    }
    
    return Math.max(0, Math.min(10, score));
  }

  /**
   * A - Actions: Next steps clarity and execution
   */
  private scoreActions(opportunity: any): number {
    let score = 0;
    
    // Clear next steps defined
    if (opportunity['nextSteps'] && opportunity.nextSteps.length > 10) score += 3;
    
    // Next activity scheduled
    if (opportunity.nextActivityDate) {
      const daysToNext = (new Date(opportunity.nextActivityDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysToNext >= 0 && daysToNext <= 7) score += 3; // Soon
      else if (daysToNext > 7 && daysToNext <= 14) score += 2; // Reasonable
      else if (daysToNext < 0) score -= 1; // Overdue
    } else {
      score -= 2; // No next activity
    }
    
    // Recent activity execution
    const recentActivities = opportunity.activities?.filter((a: any) => {
      const daysSince = (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 14;
    }) || [];
    
    if (recentActivities.length >= 2) score += 2;
    if (recentActivities.length >= 4) score += 1;
    
    // Action quality (completed vs planned)
    const completedRecent = recentActivities.filter((a: any) => a['status'] === 'completed').length;
    if (completedRecent >= 1) score += 1;
    
    return Math.min(10, score);
  }

  /**
   * Analyze TODAY vs REALITY gap
   */
  private async analyzeTodayVsReality(opportunity: any): Promise<TodayVsReality> {
    const today = opportunity.nextSteps || "Moving forward with proposal";
    
    // Analyze actual situation based on data
    let reality = today;
    let gap = "Aligned";
    let impact: 'positive' | 'negative' | 'neutral' = 'neutral';
    
    // Check for warning signs
    const recentActivities = opportunity.activities?.filter((a: any) => {
      const daysSince = (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 14;
    }) || [];
    
    if (recentActivities['length'] === 0) {
      reality = "No recent engagement - deal may be stalled";
      gap = "Engagement disconnect";
      impact = 'negative';
    }
    
    // Check for overdue activities
    if (opportunity['nextActivityDate'] && new Date(opportunity.nextActivityDate) < new Date()) {
      reality = "Overdue on next steps - needs immediate attention";
      gap = "Timeline slippage";
      impact = 'negative';
    }
    
    // Check for positive signals
    const highEngagement = opportunity.stakeholders?.filter((s: any) => 
      s['engagementLevel'] === 'High'
    ).length || 0;
    
    if (highEngagement >= 2) {
      reality = "Strong stakeholder engagement - deal progressing well";
      gap = "Positive momentum";
      impact = 'positive';
    }
    
    return { today, reality, gap, impact };
  }

  /**
   * Generate LLM-powered prediction with reasoning
   */
  private async generateLLMPrediction(
    opportunity: any, 
    adrataScore: AdrataScore, 
    todayVsReality: TodayVsReality
  ) {
    const prompt = `
    Analyze this B2B sales opportunity and predict the close date with detailed reasoning:

    OPPORTUNITY DATA:
    - Name: ${opportunity.name}
    - Current Stage: ${opportunity.stage}
    - Amount: $${opportunity.amount?.toLocaleString() || 'Not specified'}
    - Expected Close: ${opportunity.expectedCloseDate || 'Not set'}
    - Created: ${new Date(opportunity.createdAt).toLocaleDateString()}
    - Priority: ${opportunity.priority}
    
    ADRATA METHODOLOGY SCORES (0-10):
    - Authority (Decision makers): ${adrataScore.authority}/10
    - Dynamics (Politics): ${adrataScore.dynamics}/10  
    - Reality (Current state): ${adrataScore.reality}/10
    - Acceleration (Urgency): ${adrataScore.acceleration}/10
    - Timeline (Realistic): ${adrataScore.timeline}/10
    - Actions (Next steps): ${adrataScore.actions}/10
    - Overall Score: ${adrataScore.overall}/100
    
    TODAY vs REALITY:
    - What we think: ${todayVsReality.today}
    - What's actually happening: ${todayVsReality.reality}
    - Gap: ${todayVsReality.gap} (${todayVsReality.impact})
    
    STAKEHOLDERS: ${opportunity.stakeholders?.length || 0} identified
    RECENT ACTIVITIES: ${opportunity.activities?.filter((a: any) => {
      const daysSince = (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 14;
    }).length || 0} in last 14 days
    
    Based on this data, provide:
    1. PREDICTED CLOSE DATE (specific date)
    2. DETAILED REASONING (why this date, what factors influenced it)
    3. TOP 3 RISK FACTORS (what could delay/kill the deal)
    4. TOP 3 ACCELERATION OPPORTUNITIES (what could speed it up)
    5. RECOMMENDED ACTIONS (specific next steps)
    
    Be realistic and data-driven. Consider industry standards for B2B sales cycles.
    `;

    const response = await this.openAI.generateCompletion(prompt, {
      maxTokens: 800,
      model: 'reasoning' // Use reasoning model for complex analysis
    });

    // Parse the response (in production, you'd want more robust parsing)
    const lines = response.split('\n').filter(line => line.trim());
    
    // Extract predicted date (simplified parsing)
    const dateMatch = response.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|[A-Z][a-z]+ \d{1,2}, \d{4})/);
    const predictedDateStr = dateMatch ? dateMatch[0] : null;
    
    let closeDate = new Date();
    if (predictedDateStr) {
      closeDate = new Date(predictedDateStr);
    } else {
      // Fallback: use scoring-based prediction
      const daysToAdd = Math.max(7, Math.min(180, 90 - (adrataScore.overall * 0.8)));
      closeDate = new Date(Date.now() + (daysToAdd * 24 * 60 * 60 * 1000));
    }
    
    return {
      closeDate,
      reasoning: response,
      riskFactors: this.extractRiskFactors(response),
      accelerationOpportunities: this.extractAccelerationOpportunities(response),
      recommendedActions: this.extractRecommendedActions(response)
    };
  }

  /**
   * Calculate confidence based on data completeness and score
   */
  private calculateConfidence(opportunity: any, adrataScore: AdrataScore): number {
    let confidence = adrataScore.overall; // Base on overall score
    
    // Adjust for data completeness
    const dataPoints = [
      opportunity.amount,
      opportunity.expectedCloseDate,
      opportunity.nextSteps,
      opportunity.stakeholders?.length > 0,
      opportunity.activities?.length > 0,
      opportunity.account,
      opportunity.stage
    ].filter(Boolean).length;
    
    const completeness = (dataPoints / 7) * 100;
    confidence = (confidence + completeness) / 2;
    
    // Adjust for recency of data
    const recentActivity = opportunity.activities?.some((a: any) => {
      const daysSince = (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 7;
    });
    
    if (recentActivity) confidence += 10;
    else confidence -= 15;
    
    return Math.max(10, Math.min(95, confidence));
  }

  // Helper methods for parsing LLM response
  private extractRiskFactors(response: string): string[] {
    const riskSection = response.match(/RISK FACTORS?:?\s*(.*?)(?=ACCELERATION|RECOMMENDED|$)/is);
    if (riskSection) {
      return riskSection[1]
        .split(/\n/)
        .filter(line => line.trim())
        .map(line => line.replace(/^\d+\.?\s*/, '').trim())
        .filter(line => line.length > 10)
        .slice(0, 3);
    }
    return ['Limited stakeholder engagement', 'Budget approval delays', 'Competitive pressure'];
  }

  private extractAccelerationOpportunities(response: string): string[] {
    const accelSection = response.match(/ACCELERATION OPPORTUNITIES?:?\s*(.*?)(?=RECOMMENDED|$)/is);
    if (accelSection) {
      return accelSection[1]
        .split(/\n/)
        .filter(line => line.trim())
        .map(line => line.replace(/^\d+\.?\s*/, '').trim())
        .filter(line => line.length > 10)
        .slice(0, 3);
    }
    return ['Executive engagement', 'Urgency creation', 'Proof of concept success'];
  }

  private extractRecommendedActions(response: string): string[] {
    const actionSection = response.match(/RECOMMENDED ACTIONS?:?\s*(.*?)$/is);
    if (actionSection) {
      return actionSection[1]
        .split(/\n/)
        .filter(line => line.trim())
        .map(line => line.replace(/^\d+\.?\s*/, '').trim())
        .filter(line => line.length > 10)
        .slice(0, 5);
    }
    return ['Schedule executive briefing', 'Confirm budget and timeline', 'Address technical concerns'];
  }
}
