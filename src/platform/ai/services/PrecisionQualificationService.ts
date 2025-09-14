/**
 * 🎯 PRECISION QUALIFICATION SERVICE
 * 
 * World-class sales qualification using the PRECISION methodology:
 * P - Pain & Priority
 * R - Reality Check  
 * E - Economic Impact
 * C - Champion & Coalition
 * I - Intelligence
 * S - Solution Fit
 * I - Implementation
 * O - Outcome Prediction
 * N - Next Actions
 */

import { PrismaClient } from '@prisma/client';
import { OpenAIService } from './openaiService';

const prisma = new PrismaClient();

export interface PrecisionScore {
  pain: number;           // 0-10: Pain severity and priority
  reality: number;        // 0-10: Reality check accuracy
  economic: number;       // 0-10: Economic impact and budget
  champion: number;       // 0-10: Champion strength and coalition
  intelligence: number;   // 0-10: Competitive and political intelligence
  solution: number;       // 0-10: Solution fit and criteria match
  implementation: number; // 0-10: Implementation readiness
  outcome: number;        // 0-10: Outcome predictability
  nextActions: number;    // 0-10: Next actions clarity
  overall: number;        // 0-100: Weighted overall score
}

export interface PrecisionData {
  // P - Pain & Priority
  painPoints: string[];
  painSeverity: 'low' | 'medium' | 'high' | 'critical';
  businessImpact: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'urgent';
  costOfInaction: string;
  
  // R - Reality Check
  todayPerception: string;    // What we think is happening
  actualReality: string;      // What's really happening
  realityGap: string;         // The disconnect
  gapImpact: 'positive' | 'negative' | 'neutral';
  engagementLevel: 'low' | 'medium' | 'high';
  
  // E - Economic Impact
  quantifiedMetrics: string[];
  roiProjection: string;
  budgetConfirmed: boolean;
  budgetAmount: number | null;
  budgetAuthority: string;
  financialApprovalProcess: string;
  
  // C - Champion & Coalition
  championName: string;
  championInfluence: 'low' | 'medium' | 'high';
  championCommitment: 'weak' | 'moderate' | 'strong';
  supportingStakeholders: string[];
  opposition: string[];
  stakeholderMap: any;
  
  // I - Intelligence
  competitorAnalysis: {
    competitors: string[];
    ourAdvantages: string[];
    competitiveThreats: string[];
    differentiators: string[];
  };
  politicalLandscape: {
    powerBrokers: string[];
    influenceMap: any;
    internalDynamics: string;
  };
  
  // S - Solution Fit
  decisionCriteria: string[];
  technicalRequirements: string[];
  solutionAlignment: 'poor' | 'fair' | 'good' | 'excellent';
  gapAnalysis: string[];
  
  // I - Implementation
  decisionProcess: {
    steps: string[];
    timeline: string;
    stakeholders: string[];
    approvals: string[];
  };
  paperProcess: {
    legal: string[];
    procurement: string[];
    security: string[];
    compliance: string[];
  };
  
  // O - Outcome Prediction
  predictedCloseDate: Date;
  closeProbability: number; // 0-100
  confidenceLevel: number; // 0-100
  predictionReasoning: string;
  riskFactors: string[];
  accelerators: string[];
  
  // N - Next Actions
  immediateActions: string[];
  actionOwners: string[];
  actionDeadlines: Date[];
  successMetrics: string[];
  accountability: string;
}

export interface PrecisionAnalysis {
  opportunityId: string;
  score: PrecisionScore;
  data: PrecisionData;
  confidence: number;
  lastUpdated: Date;
  recommendations: string[];
  riskAlerts: string[];
}

export class PrecisionQualificationService {
  private openAI: OpenAIService;

  constructor() {
    this['openAI'] = new OpenAIService();
  }

  /**
   * Generate comprehensive PRECISION analysis for an opportunity
   */
  async analyzePrecision(opportunityId: string, workspaceId: string): Promise<PrecisionAnalysis> {
    console.log(`🎯 Generating PRECISION analysis for opportunity ${opportunityId}`);

    try {
      // Fetch comprehensive opportunity data
      const opportunity = await this.fetchOpportunityData(opportunityId, workspaceId);
      
      if (!opportunity) {
        throw new Error('Opportunity not found');
      }

      // Generate PRECISION data (can be AI-generated or blank for manual entry)
      const precisionData = await this.generatePrecisionData(opportunity);
      
      // Calculate PRECISION scores
      const precisionScore = this.calculatePrecisionScore(precisionData, opportunity);
      
      // Generate AI recommendations
      const recommendations = await this.generateRecommendations(opportunity, precisionData, precisionScore);
      
      // Identify risk alerts
      const riskAlerts = this.identifyRiskAlerts(precisionData, precisionScore);
      
      // Calculate overall confidence
      const confidence = this.calculateConfidence(opportunity, precisionData);
      
      const analysis: PrecisionAnalysis = {
        opportunityId,
        score: precisionScore,
        data: precisionData,
        confidence,
        lastUpdated: new Date(),
        recommendations,
        riskAlerts
      };

      // Save to database
      await this.savePrecisionAnalysis(opportunityId, analysis);

      return analysis;

    } catch (error) {
      console.error('Error generating PRECISION analysis:', error);
      throw error;
    }
  }

  /**
   * Fetch comprehensive opportunity data
   */
  private async fetchOpportunityData(opportunityId: string, workspaceId: string) {
    return await prisma.opportunities.findFirst({
      where: { id: opportunityId, workspaceId , deletedAt: null},
      include: {
        account: true,
        assignedUser: true,
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 30
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
   * Generate PRECISION data (AI-assisted with fallbacks for manual entry)
   */
  private async generatePrecisionData(opportunity: any): Promise<PrecisionData> {
    // Start with blank/default data structure
    const precisionData: PrecisionData = {
      // P - Pain & Priority (can be inferred from notes/activities)
      painPoints: this.extractPainPoints(opportunity),
      painSeverity: this.assessPainSeverity(opportunity),
      businessImpact: opportunity.notes?.substring(0, 200) || '',
      urgencyLevel: this.mapPriorityToUrgency(opportunity.priority),
      costOfInaction: '',
      
      // R - Reality Check
      todayPerception: opportunity.nextSteps || 'Moving forward with next steps',
      actualReality: await this.assessActualReality(opportunity),
      realityGap: '',
      gapImpact: 'neutral',
      engagementLevel: this.assessEngagementLevel(opportunity),
      
      // E - Economic Impact
      quantifiedMetrics: [],
      roiProjection: '',
      budgetConfirmed: !!opportunity.amount,
      budgetAmount: opportunity.amount || null,
      budgetAuthority: opportunity.economicBuyer || '',
      financialApprovalProcess: '',
      
      // C - Champion & Coalition
      championName: opportunity.champion || '',
      championInfluence: 'medium',
      championCommitment: 'moderate',
      supportingStakeholders: opportunity.stakeholders?.map((s: any) => s.name) || [],
      opposition: [],
      stakeholderMap: opportunity.politicalMap || {},
      
      // I - Intelligence
      competitorAnalysis: {
        competitors: this.extractCompetitors(opportunity),
        ourAdvantages: [],
        competitiveThreats: [],
        differentiators: []
      },
      politicalLandscape: {
        powerBrokers: [],
        influenceMap: {},
        internalDynamics: ''
      },
      
      // S - Solution Fit
      decisionCriteria: this.extractDecisionCriteria(opportunity),
      technicalRequirements: [],
      solutionAlignment: 'good',
      gapAnalysis: [],
      
      // I - Implementation
      decisionProcess: {
        steps: [],
        timeline: opportunity.expectedCloseDate ? `Target: ${new Date(opportunity.expectedCloseDate).toLocaleDateString()}` : '',
        stakeholders: opportunity.stakeholders?.map((s: any) => s.name) || [],
        approvals: []
      },
      paperProcess: {
        legal: [],
        procurement: [],
        security: [],
        compliance: []
      },
      
      // O - Outcome Prediction
      predictedCloseDate: opportunity.predictedCloseDate || opportunity.expectedCloseDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      closeProbability: Math.round((opportunity.probability || 0.5) * 100),
      confidenceLevel: opportunity.closePredictionConfidence || 50,
      predictionReasoning: opportunity.closePredictionReasoning || '',
      riskFactors: opportunity.riskFactors || [],
      accelerators: opportunity.accelerationOpportunities || [],
      
      // N - Next Actions
      immediateActions: opportunity.nextSteps ? [opportunity.nextSteps] : [],
      actionOwners: [opportunity.assignedUser?.name || 'Unassigned'],
      actionDeadlines: opportunity.nextActivityDate ? [new Date(opportunity.nextActivityDate)] : [],
      successMetrics: [],
      accountability: ''
    };

    // Fill reality gap analysis
    precisionData['realityGap'] = this.analyzeRealityGap(
      precisionData.todayPerception, 
      precisionData.actualReality
    );
    precisionData['gapImpact'] = this.assessGapImpact(precisionData.realityGap);

    return precisionData;
  }

  /**
   * Calculate PRECISION scores based on data completeness and quality
   */
  private calculatePrecisionScore(data: PrecisionData, opportunity: any): PrecisionScore {
    const pain = this.scorePainPriority(data);
    const reality = this.scoreRealityCheck(data);
    const economic = this.scoreEconomicImpact(data);
    const champion = this.scoreChampionCoalition(data);
    const intelligence = this.scoreIntelligence(data);
    const solution = this.scoreSolutionFit(data);
    const implementation = this.scoreImplementation(data);
    const outcome = this.scoreOutcomePrediction(data);
    const nextActions = this.scoreNextActions(data);

    // Weighted overall score (some components more important than others)
    const overall = Math.round(
      (pain * 0.15) +           // 15% - Pain drives urgency
      (reality * 0.10) +        // 10% - Reality check
      (economic * 0.15) +       // 15% - Budget/ROI critical
      (champion * 0.15) +       // 15% - Internal support crucial
      (intelligence * 0.10) +   // 10% - Competitive awareness
      (solution * 0.10) +       // 10% - Solution fit
      (implementation * 0.10) + // 10% - Process readiness
      (outcome * 0.10) +        // 10% - Predictability
      (nextActions * 0.05)      // 5% - Action clarity
    );

    return {
      pain,
      reality,
      economic,
      champion,
      intelligence,
      solution,
      implementation,
      outcome,
      nextActions,
      overall
    };
  }

  // Individual scoring methods
  private scorePainPriority(data: PrecisionData): number {
    let score = 0;
    
    // Pain points identified
    if (data.painPoints.length > 0) score += 3;
    if (data.painPoints.length >= 3) score += 1;
    
    // Pain severity
    const severityScores = { low: 1, medium: 2, high: 3, critical: 4 };
    score += severityScores[data.painSeverity];
    
    // Urgency level
    const urgencyScores = { low: 0, medium: 1, high: 2, urgent: 2 };
    score += urgencyScores[data.urgencyLevel];
    
    return Math.min(10, score);
  }

  private scoreRealityCheck(data: PrecisionData): number {
    let score = 5; // Start neutral
    
    // Engagement level
    const engagementScores = { low: -2, medium: 0, high: 3 };
    score += engagementScores[data.engagementLevel];
    
    // Reality gap impact
    const impactScores = { positive: 2, neutral: 0, negative: -2 };
    score += impactScores[data.gapImpact];
    
    // Gap analysis quality
    if (data['realityGap'] && data.realityGap.length > 10) score += 2;
    
    return Math.max(0, Math.min(10, score));
  }

  private scoreEconomicImpact(data: PrecisionData): number {
    let score = 0;
    
    // Budget confirmed
    if (data.budgetConfirmed) score += 3;
    if (data['budgetAmount'] && data.budgetAmount > 0) score += 2;
    
    // ROI projection
    if (data['roiProjection'] && data.roiProjection.length > 10) score += 2;
    
    // Quantified metrics
    if (data.quantifiedMetrics.length > 0) score += 2;
    if (data.quantifiedMetrics.length >= 3) score += 1;
    
    return Math.min(10, score);
  }

  private scoreChampionCoalition(data: PrecisionData): number {
    let score = 0;
    
    // Champion identified
    if (data['championName'] && data.championName.length > 0) score += 3;
    
    // Champion influence
    const influenceScores = { low: 0, medium: 1, high: 2 };
    score += influenceScores[data.championInfluence];
    
    // Champion commitment
    const commitmentScores = { weak: 0, moderate: 1, strong: 2 };
    score += commitmentScores[data.championCommitment];
    
    // Supporting stakeholders
    if (data.supportingStakeholders.length >= 2) score += 2;
    if (data.supportingStakeholders.length >= 4) score += 1;
    
    return Math.min(10, score);
  }

  private scoreIntelligence(data: PrecisionData): number {
    let score = 0;
    
    // Competitive analysis
    if (data.competitorAnalysis.competitors.length > 0) score += 2;
    if (data.competitorAnalysis.ourAdvantages.length > 0) score += 2;
    if (data.competitorAnalysis.differentiators.length > 0) score += 2;
    
    // Political landscape
    if (data.politicalLandscape.powerBrokers.length > 0) score += 2;
    if (data.politicalLandscape.internalDynamics.length > 10) score += 2;
    
    return Math.min(10, score);
  }

  private scoreSolutionFit(data: PrecisionData): number {
    let score = 0;
    
    // Decision criteria
    if (data.decisionCriteria.length > 0) score += 3;
    if (data.decisionCriteria.length >= 3) score += 1;
    
    // Solution alignment
    const alignmentScores = { poor: 0, fair: 2, good: 4, excellent: 6 };
    score += alignmentScores[data.solutionAlignment];
    
    return Math.min(10, score);
  }

  private scoreImplementation(data: PrecisionData): number {
    let score = 0;
    
    // Decision process defined
    if (data.decisionProcess.steps.length > 0) score += 3;
    if (data.decisionProcess.timeline.length > 0) score += 2;
    
    // Paper process understood
    const paperProcesses = [
      data.paperProcess.legal,
      data.paperProcess.procurement,
      data.paperProcess.security,
      data.paperProcess.compliance
    ];
    const definedProcesses = paperProcesses.filter(p => p.length > 0).length;
    score += definedProcesses; // 1 point per defined process
    
    return Math.min(10, score);
  }

  private scoreOutcomePrediction(data: PrecisionData): number {
    let score = 0;
    
    // Prediction confidence
    if (data.confidenceLevel >= 70) score += 3;
    else if (data.confidenceLevel >= 50) score += 2;
    else if (data.confidenceLevel >= 30) score += 1;
    
    // Close probability
    if (data.closeProbability >= 70) score += 3;
    else if (data.closeProbability >= 50) score += 2;
    else if (data.closeProbability >= 30) score += 1;
    
    // Risk and accelerator analysis
    if (data.riskFactors.length > 0) score += 2;
    if (data.accelerators.length > 0) score += 2;
    
    return Math.min(10, score);
  }

  private scoreNextActions(data: PrecisionData): number {
    let score = 0;
    
    // Immediate actions defined
    if (data.immediateActions.length > 0) score += 4;
    if (data.immediateActions.length >= 3) score += 1;
    
    // Action owners assigned
    if (data.actionOwners.length > 0) score += 2;
    
    // Deadlines set
    if (data.actionDeadlines.length > 0) score += 2;
    
    // Accountability defined
    if (data.accountability.length > 10) score += 1;
    
    return Math.min(10, score);
  }

  // Helper methods for data extraction and analysis
  private extractPainPoints(opportunity: any): string[] {
    const painPoints: string[] = [];
    
    // Extract from notes
    if (opportunity.notes) {
      const notes = opportunity.notes.toLowerCase();
      if (notes.includes('problem') || notes.includes('issue') || notes.includes('challenge')) {
        painPoints.push('Business challenges identified in notes');
      }
      if (notes.includes('cost') || notes.includes('expensive') || notes.includes('budget')) {
        painPoints.push('Cost concerns mentioned');
      }
      if (notes.includes('slow') || notes.includes('inefficient') || notes.includes('manual')) {
        painPoints.push('Efficiency issues noted');
      }
    }
    
    return painPoints;
  }

  private assessPainSeverity(opportunity: any): 'low' | 'medium' | 'high' | 'critical' {
    if (opportunity['priority'] === 'high') return 'high';
    if (opportunity['priority'] === 'low') return 'low';
    if (opportunity['amount'] && opportunity.amount > 100000) return 'high';
    return 'medium';
  }

  private mapPriorityToUrgency(priority?: string): 'low' | 'medium' | 'high' | 'urgent' {
    const mapping: Record<string, 'low' | 'medium' | 'high' | 'urgent'> = {
      'low': 'low',
      'medium': 'medium',
      'high': 'high',
      'urgent': 'urgent'
    };
    return mapping[priority || 'medium'] || 'medium';
  }

  private async assessActualReality(opportunity: any): Promise<string> {
    // Analyze recent activities and engagement
    const recentActivities = opportunity.activities?.filter((a: any) => {
      const daysSince = (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 14;
    }) || [];

    if (recentActivities['length'] === 0) {
      return 'No recent engagement - deal may be stalled';
    }

    const completedActivities = recentActivities.filter((a: any) => a['status'] === 'completed');
    const responseRate = completedActivities.length / recentActivities.length;

    if (responseRate > 0.7) {
      return 'Strong engagement - deal progressing well';
    } else if (responseRate < 0.3) {
      return 'Limited responsiveness - needs attention';
    } else {
      return 'Moderate engagement - standard progression';
    }
  }

  private assessEngagementLevel(opportunity: any): 'low' | 'medium' | 'high' {
    const recentActivities = opportunity.activities?.filter((a: any) => {
      const daysSince = (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 14;
    }) || [];

    if (recentActivities.length >= 4) return 'high';
    if (recentActivities.length >= 2) return 'medium';
    return 'low';
  }

  private extractCompetitors(opportunity: any): string[] {
    const competitors: string[] = [];
    
    if (opportunity.competitionData) {
      // Parse existing competition data
      try {
        const compData = typeof opportunity['competitionData'] === 'string' 
          ? JSON.parse(opportunity.competitionData) 
          : opportunity.competitionData;
        
        if (compData.competitors) {
          competitors.push(...compData.competitors);
        }
      } catch (e) {
        // Handle parsing errors gracefully
      }
    }
    
    return competitors;
  }

  private extractDecisionCriteria(opportunity: any): string[] {
    const criteria: string[] = [];
    
    if (opportunity.decisionCriteria) {
      try {
        const decisionData = typeof opportunity['decisionCriteria'] === 'string'
          ? JSON.parse(opportunity.decisionCriteria)
          : opportunity.decisionCriteria;
        
        if (Array.isArray(decisionData)) {
          criteria.push(...decisionData);
        } else if (decisionData.criteria) {
          criteria.push(...decisionData.criteria);
        }
      } catch (e) {
        // Handle parsing errors gracefully
      }
    }
    
    return criteria;
  }

  private analyzeRealityGap(today: string, reality: string): string {
    if (today === reality) return 'Aligned - perception matches reality';
    
    if (reality.includes('stalled') || reality.includes('no recent')) {
      return 'Engagement gap - less active than perceived';
    }
    
    if (reality.includes('strong') || reality.includes('progressing well')) {
      return 'Positive momentum - better than expected';
    }
    
    return 'Standard variance - minor perception differences';
  }

  private assessGapImpact(gap: string): 'positive' | 'negative' | 'neutral' {
    if (gap.includes('positive') || gap.includes('better') || gap.includes('momentum')) {
      return 'positive';
    }
    if (gap.includes('gap') || gap.includes('stalled') || gap.includes('less')) {
      return 'negative';
    }
    return 'neutral';
  }

  private async generateRecommendations(
    opportunity: any, 
    data: PrecisionData, 
    score: PrecisionScore
  ): Promise<string[]> {
    const recommendations: string[] = [];
    
    // Score-based recommendations
    if (score.pain < 6) {
      recommendations.push('Deepen pain discovery - conduct stakeholder interviews to uncover critical business challenges');
    }
    
    if (score.champion < 6) {
      recommendations.push('Strengthen champion relationship - schedule executive briefing to build internal advocacy');
    }
    
    if (score.economic < 6) {
      recommendations.push('Quantify business impact - develop ROI model with specific metrics and timeline');
    }
    
    if (score.intelligence < 6) {
      recommendations.push('Gather competitive intelligence - understand evaluation criteria and competitive landscape');
    }
    
    if (score.nextActions < 6) {
      recommendations.push('Define clear next steps - establish specific actions, owners, and deadlines');
    }
    
    // Engagement-based recommendations
    if (data['engagementLevel'] === 'low') {
      recommendations.push('Increase engagement frequency - schedule regular touchpoints with key stakeholders');
    }
    
    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }

  private identifyRiskAlerts(data: PrecisionData, score: PrecisionScore): string[] {
    const alerts: string[] = [];
    
    // Score-based alerts
    if (score.overall < 40) {
      alerts.push('LOW QUALIFICATION SCORE - Deal needs immediate attention and qualification work');
    }
    
    if (score.reality < 4) {
      alerts.push('ENGAGEMENT RISK - Limited recent activity suggests deal may be stalling');
    }
    
    if (score.champion < 4) {
      alerts.push('CHAMPION RISK - Weak internal advocacy threatens deal progression');
    }
    
    if (score.economic < 4) {
      alerts.push('BUDGET RISK - Economic impact and budget authority not established');
    }
    
    // Data-based alerts
    if (data['gapImpact'] === 'negative') {
      alerts.push('REALITY GAP - Significant disconnect between perception and actual situation');
    }
    
    if (data.competitorAnalysis.competitors.length > 2) {
      alerts.push('COMPETITIVE PRESSURE - Multiple competitors in evaluation');
    }
    
    return alerts;
  }

  private calculateConfidence(opportunity: any, data: PrecisionData): number {
    let confidence = 50; // Base confidence
    
    // Adjust based on data completeness
    const completenessFactors = [
      data.painPoints.length > 0,
      data.budgetConfirmed,
      data.championName.length > 0,
      data.decisionCriteria.length > 0,
      data.immediateActions.length > 0,
      data.competitorAnalysis.competitors.length > 0
    ];
    
    const completeness = completenessFactors.filter(Boolean).length / completenessFactors.length;
    confidence += (completeness * 30); // Up to 30 points for completeness
    
    // Adjust based on engagement
    const engagementBonus = { low: -10, medium: 0, high: 15 };
    confidence += engagementBonus[data.engagementLevel];
    
    // Adjust based on recent activity
    const recentActivities = opportunity.activities?.filter((a: any) => {
      const daysSince = (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 7;
    }) || [];
    
    if (recentActivities.length > 0) confidence += 10;
    
    return Math.max(10, Math.min(95, confidence));
  }

  /**
   * Save PRECISION analysis to database
   */
  private async savePrecisionAnalysis(opportunityId: string, analysis: PrecisionAnalysis) {
    await prisma.opportunities.update({
      where: { id: opportunityId },
      data: {
        precisionScore: analysis.score,
        precisionData: analysis.data,
        predictedCloseDate: analysis.data.predictedCloseDate,
        closePredictionConfidence: analysis.confidence,
        closePredictionReasoning: analysis.data.predictionReasoning,
        lastPrecisionUpdate: analysis.lastUpdated,
        
        // Update individual components for easy querying
        painPriority: {
          painPoints: analysis.data.painPoints,
          severity: analysis.data.painSeverity,
          urgency: analysis.data.urgencyLevel,
          businessImpact: analysis.data.businessImpact
        },
        realityCheck: {
          today: analysis.data.todayPerception,
          reality: analysis.data.actualReality,
          gap: analysis.data.realityGap,
          impact: analysis.data.gapImpact
        },
        economicImpact: {
          metrics: analysis.data.quantifiedMetrics,
          roi: analysis.data.roiProjection,
          budget: analysis.data.budgetAmount,
          authority: analysis.data.budgetAuthority
        },
        championCoalition: {
          champion: analysis.data.championName,
          influence: analysis.data.championInfluence,
          supporters: analysis.data.supportingStakeholders,
          opposition: analysis.data.opposition
        },
        intelligence: analysis.data.competitorAnalysis,
        solutionFit: {
          criteria: analysis.data.decisionCriteria,
          alignment: analysis.data.solutionAlignment,
          gaps: analysis.data.gapAnalysis
        },
        implementation: {
          decisionProcess: analysis.data.decisionProcess,
          paperProcess: analysis.data.paperProcess
        },
        outcomePredict: {
          closeDate: analysis.data.predictedCloseDate,
          probability: analysis.data.closeProbability,
          confidence: analysis.data.confidenceLevel,
          risks: analysis.data.riskFactors,
          accelerators: analysis.data.accelerators
        },
        nextActions: {
          actions: analysis.data.immediateActions,
          owners: analysis.data.actionOwners,
          deadlines: analysis.data.actionDeadlines,
          accountability: analysis.data.accountability
        }
      }
    });
  }

  /**
   * Get existing PRECISION analysis or generate new one
   */
  async getPrecisionAnalysis(opportunityId: string, workspaceId: string): Promise<PrecisionAnalysis | null> {
    const opportunity = await prisma.opportunities.findFirst({
      where: { id: opportunityId, workspaceId , deletedAt: null},
      select: {
        precisionScore: true,
        precisionData: true,
        lastPrecisionUpdate: true,
        closePredictionConfidence: true
      }
    });

    if (!opportunity?.precisionScore || !opportunity?.precisionData) {
      return null;
    }

    return {
      opportunityId,
      score: opportunity.precisionScore as PrecisionScore,
      data: opportunity.precisionData as PrecisionData,
      confidence: opportunity.closePredictionConfidence || 50,
      lastUpdated: opportunity.lastPrecisionUpdate || new Date(),
      recommendations: [],
      riskAlerts: []
    };
  }
}
