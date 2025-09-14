"use client";

/**
 * MEDDPICC Integration Service
 * 
 * Native MEDDPICC framework integration for Monaco RTP Engine.
 * This gives Adrata a massive competitive advantage over 6Sense and MadKudu
 * who lack integrated sales methodologies.
 */

export interface MEDDPICCDataPoint {
  element: "metrics" | "economicBuyer" | "decisionCriteria" | "decisionProcess" | "paperProcess" | "implifyPain" | "champion" | "competition";
  identified: boolean;
  confidence: number; // 0-1
  lastUpdated: Date;
  sources: string[];
  details: any;
}

export interface MEDDPICCAssessment {
  companyId: string;
  companyName: string;
  overallScore: number; // 0-100
  completionPercentage: number; // 0-100
  dataPoints: {
    metrics: MEDDPICCMetrics;
    economicBuyer: MEDDPICCEconomicBuyer;
    decisionCriteria: MEDDPICCDecisionCriteria;
    decisionProcess: MEDDPICCDecisionProcess;
    paperProcess: MEDDPICCPaperProcess;
    implifyPain: MEDDPICCImplifyPain;
    champion: MEDDPICCChampion;
    competition: MEDDPICCCompetition;
  };
  recommendations: string[];
  nextActions: string[];
  riskFactors: string[];
  lastAssessed: Date;
}

export interface MEDDPICCMetrics {
  identified: boolean;
  confidence: number;
  economicImpact: {
    quantified: boolean;
    amount: number;
    timeframe: string;
    businessMetrics: string[];
  };
  successMetrics: string[];
  roiCalculation: {
    available: boolean;
    methodology: string;
    timeline: string;
  };
}

export interface MEDDPICCEconomicBuyer {
  identified: boolean;
  confidence: number;
  person: {
    name?: string;
    title?: string;
    budgetAuthority: number; // Dollar amount
    decisionLevel: "c-suite" | "vp" | "director" | "manager";
    verified: boolean;
  };
  verification: {
    methods: string[];
    confidence: number;
    lastConfirmed: Date;
  };
}

export interface MEDDPICCDecisionCriteria {
  mapped: boolean;
  confidence: number;
  criteria: Array<{
    criterion: string;
    importance: "critical" | "high" | "medium" | "low";
    ourPosition: "strong" | "moderate" | "weak" | "unknown";
    competitorPosition: "strong" | "moderate" | "weak" | "unknown";
  }>;
  weightedScore: number;
}

export interface MEDDPICCDecisionProcess {
  understood: boolean;
  confidence: number;
  process: {
    stages: string[];
    stakeholders: Array<{
      name: string;
      role: string;
      influence: "high" | "medium" | "low";
      position: "supporter" | "neutral" | "skeptic" | "blocker";
    }>;
    timeline: string;
    approvalLevels: string[];
  };
}

export interface MEDDPICCPaperProcess {
  documented: boolean;
  confidence: number;
  requirements: {
    legal: string[];
    procurement: string[];
    compliance: string[];
    technical: string[];
  };
  complexity: "simple" | "moderate" | "complex" | "very-complex";
  timeline: string;
}

export interface MEDDPICCImplifyPain {
  quantified: boolean;
  confidence: number;
  painPoints: Array<{
    description: string;
    quantifiedImpact: number;
    urgency: "immediate" | "quarterly" | "annual";
    consequences: string[];
    evidence: string[];
  }>;
  totalPainValue: number;
  urgencyScore: number;
}

export interface MEDDPICCChampion {
  identified: boolean;
  confidence: number;
  champion: {
    name?: string;
    title?: string;
    influence: "high" | "medium" | "low";
    commitment: "strong" | "moderate" | "weak";
    accessibility: "high" | "medium" | "low";
  };
  strength: {
    score: number; // 0-100
    indicators: string[];
    risks: string[];
  };
}

export interface MEDDPICCCompetition {
  mapped: boolean;
  confidence: number;
  competitors: Array<{
    name: string;
    strength: "strong" | "moderate" | "weak";
    position: string;
    advantages: string[];
    weaknesses: string[];
    strategy: string;
  }>;
  competitivePosition: "leading" | "competitive" | "challenged" | "losing";
}

export class MEDDPICCIntegrationService {
  /**
   * Assess MEDDPICC readiness for a company using Monaco pipeline data
   */
  async assessMEDDPICCReadiness(
    companyData: any,
    enrichedProfiles: any[] = [],
    buyerGroups: any[] = [],
    opportunitySignals: any[] = [],
    painData?: any
  ): Promise<MEDDPICCAssessment> {
    console.log(`📋 Assessing MEDDPICC readiness for ${companyData.name}...`);

    // Assess each MEDDPICC component
    const metrics = await this.assessMetrics(companyData, painData);
    const economicBuyer = await this.assessEconomicBuyer(enrichedProfiles, buyerGroups);
    const decisionCriteria = await this.assessDecisionCriteria(companyData, opportunitySignals);
    const decisionProcess = await this.assessDecisionProcess(buyerGroups, enrichedProfiles);
    const paperProcess = await this.assessPaperProcess(companyData);
    const implifyPain = await this.assessImplifyPain(painData, opportunitySignals);
    const champion = await this.assessChampion(enrichedProfiles, buyerGroups);
    const competition = await this.assessCompetition(companyData, opportunitySignals);

    // Calculate overall scores
    const dataPoints = {
      metrics,
      economicBuyer,
      decisionCriteria,
      decisionProcess,
      paperProcess,
      implifyPain,
      champion,
      competition,
    };

    const overallScore = this.calculateOverallScore(dataPoints);
    const completionPercentage = this.calculateCompletionPercentage(dataPoints);

    // Generate recommendations and next actions
    const recommendations = this.generateRecommendations(dataPoints);
    const nextActions = this.generateNextActions(dataPoints);
    const riskFactors = this.identifyRiskFactors(dataPoints);

    return {
      companyId: companyData.id,
      companyName: companyData.name,
      overallScore,
      completionPercentage,
      dataPoints,
      recommendations,
      nextActions,
      riskFactors,
      lastAssessed: new Date(),
    };
  }

  /**
   * M - Metrics: Assess economic impact and success metrics
   */
  private async assessMetrics(companyData: any, painData?: any): Promise<MEDDPICCMetrics> {
    const economicImpact = {
      quantified: !!painData?.totalQuantifiedPain,
      amount: painData?.totalQuantifiedPain || 0,
      timeframe: "Annual",
      businessMetrics: this.identifyBusinessMetrics(companyData, painData),
    };

    const successMetrics = this.identifySuccessMetrics(companyData);
    
    const roiCalculation = {
      available: economicImpact['quantified'] && economicImpact.amount > 100000,
      methodology: "Pain-based ROI calculation using quantified business impact",
      timeline: "12-month projection",
    };

    return {
      identified: economicImpact.quantified,
      confidence: economicImpact.quantified ? 0.85 : 0.3,
      economicImpact,
      successMetrics,
      roiCalculation,
    };
  }

  /**
   * E - Economic Buyer: Identify decision maker with budget authority
   */
  private async assessEconomicBuyer(
    enrichedProfiles: any[],
    buyerGroups: any[]
  ): Promise<MEDDPICCEconomicBuyer> {
    // Find decision makers from buyer groups
    const decisionMakers = buyerGroups.flatMap(group => 
      (group.decisionMakers || []).map((dmId: string) => 
        enrichedProfiles.find(profile => profile['personId'] === dmId)
      ).filter(Boolean)
    );

    // Find C-level executives
    const executives = enrichedProfiles.filter(profile =>
      (profile.title || '').toLowerCase().includes('chief') ||
      (profile.title || '').toLowerCase().includes('ceo') ||
      (profile.title || '').toLowerCase().includes('cfo') ||
      (profile.title || '').toLowerCase().includes('cto')
    );

    const economicBuyer = decisionMakers[0] || executives[0];

    if (economicBuyer) {
      return {
        identified: true,
        confidence: decisionMakers.length > 0 ? 0.9 : 0.7,
        person: {
          name: economicBuyer.personName,
          title: economicBuyer.title,
          budgetAuthority: this.estimateBudgetAuthority(economicBuyer),
          decisionLevel: this.classifyDecisionLevel(economicBuyer.title || ''),
          verified: decisionMakers.length > 0,
        },
        verification: {
          methods: decisionMakers.length > 0 
            ? ["Buyer Group Analysis", "Org Chart Mapping"] 
            : ["Title Analysis"],
          confidence: decisionMakers.length > 0 ? 0.9 : 0.6,
          lastConfirmed: new Date(),
        },
      };
    }

    return {
      identified: false,
      confidence: 0,
      person: {
        budgetAuthority: 0,
        decisionLevel: "manager",
        verified: false,
      },
      verification: {
        methods: [],
        confidence: 0,
        lastConfirmed: new Date(),
      },
    };
  }

  /**
   * D - Decision Criteria: Map evaluation criteria
   */
  private async assessDecisionCriteria(
    companyData: any,
    opportunitySignals: any[]
  ): Promise<MEDDPICCDecisionCriteria> {
    const criteria = this.identifyDecisionCriteria(companyData, opportunitySignals);
    const weightedScore = this.calculateCriteriaScore(criteria);

    return {
      mapped: criteria.length > 0,
      confidence: criteria.length > 2 ? 0.8 : 0.5,
      criteria,
      weightedScore,
    };
  }

  /**
   * D - Decision Process: Understand buying process and stakeholders
   */
  private async assessDecisionProcess(
    buyerGroups: any[],
    enrichedProfiles: any[]
  ): Promise<MEDDPICCDecisionProcess> {
    if (buyerGroups['length'] === 0) {
      return {
        understood: false,
        confidence: 0,
        process: {
          stages: [],
          stakeholders: [],
          timeline: "Unknown",
          approvalLevels: [],
        },
      };
    }

    const primaryGroup = buyerGroups[0];
    const stakeholders = this.mapStakeholders(primaryGroup, enrichedProfiles);
    const stages = this.identifyDecisionStages(primaryGroup);
    const timeline = this.estimateDecisionTimeline(primaryGroup, stakeholders);

    return {
      understood: true,
      confidence: 0.75,
      process: {
        stages,
        stakeholders,
        timeline,
        approvalLevels: this.identifyApprovalLevels(stakeholders),
      },
    };
  }

  /**
   * P - Paper Process: Document procurement and approval process
   */
  private async assessPaperProcess(companyData: any): Promise<MEDDPICCPaperProcess> {
    const companySize = this.getCompanySize(companyData);
    const industry = companyData.industry || 'Technology';
    
    const requirements = this.identifyPaperRequirements(companySize, industry);
    const complexity = this.assessPaperComplexity(companySize, industry);
    const timeline = this.estimatePaperTimeline(complexity);

    return {
      documented: companySize !== "1-10", // Small companies usually have simpler processes
      confidence: 0.7,
      requirements,
      complexity,
      timeline,
    };
  }

  /**
   * I - Implify Pain: Quantify pain and consequences of inaction
   */
  private async assessImplifyPain(
    painData?: any,
    opportunitySignals: any[] = []
  ): Promise<MEDDPICCImplifyPain> {
    if (!painData || !painData.criticalPainPoints) {
      return {
        quantified: false,
        confidence: 0,
        painPoints: [],
        totalPainValue: 0,
        urgencyScore: 0,
      };
    }

    const painPoints = painData.criticalPainPoints.map((point: any) => ({
      description: point.description,
      quantifiedImpact: point.quantifiedImpact,
      urgency: point.urgency,
      consequences: this.identifyConsequences(point),
      evidence: point.evidence,
    }));

    return {
      quantified: true,
      confidence: painData.confidence || 0.8,
      painPoints,
      totalPainValue: painData.totalQuantifiedPain || 0,
      urgencyScore: painData.urgencyScore || 0,
    };
  }

  /**
   * C - Champion: Assess champion strength and commitment
   */
  private async assessChampion(
    enrichedProfiles: any[],
    buyerGroups: any[]
  ): Promise<MEDDPICCChampion> {
    // Find champions from buyer groups
    const champions = buyerGroups.flatMap(group => 
      (group.champions || []).map((championId: string) => 
        enrichedProfiles.find(profile => profile['personId'] === championId)
      ).filter(Boolean)
    );

    if (champions['length'] === 0) {
      return {
        identified: false,
        confidence: 0,
        champion: {
          influence: "low",
          commitment: "weak",
          accessibility: "low",
        },
        strength: {
          score: 0,
          indicators: [],
          risks: ["No champion identified"],
        },
      };
    }

    const primaryChampion = champions[0];
    const strength = this.assessChampionStrength(primaryChampion);

    return {
      identified: true,
      confidence: 0.8,
      champion: {
        name: primaryChampion.personName,
        title: primaryChampion.title,
        influence: this.assessInfluence(primaryChampion),
        commitment: this.assessCommitment(primaryChampion),
        accessibility: this.assessAccessibility(primaryChampion),
      },
      strength,
    };
  }

  /**
   * C - Competition: Map competitive landscape
   */
  private async assessCompetition(
    companyData: any,
    opportunitySignals: any[]
  ): Promise<MEDDPICCCompetition> {
    const competitorSignals = opportunitySignals.filter(signal => 
      signal['type'] === 'competitive_activity' || signal.source?.includes('competitor')
    );

    const competitors = this.identifyCompetitors(companyData, competitorSignals);
    const competitivePosition = this.assessCompetitivePosition(competitors);

    return {
      mapped: competitors.length > 0,
      confidence: competitors.length > 0 ? 0.7 : 0.3,
      competitors,
      competitivePosition,
    };
  }

  /**
   * Calculate overall MEDDPICC score
   */
  private calculateOverallScore(dataPoints: MEDDPICCAssessment['dataPoints']): number {
    const weights = {
      metrics: 15,
      economicBuyer: 20,
      decisionCriteria: 15,
      decisionProcess: 10,
      paperProcess: 5,
      implifyPain: 20,
      champion: 10,
      competition: 5,
    };

    let totalScore = 0;
    let totalWeight = 0;

    Object.entries(dataPoints).forEach(([key, data]) => {
      const weight = weights[key as keyof typeof weights];
      const score = this.getElementScore(data);
      totalScore += score * weight;
      totalWeight += weight;
    });

    return Math.round(totalScore / totalWeight);
  }

  /**
   * Calculate completion percentage
   */
  private calculateCompletionPercentage(dataPoints: MEDDPICCAssessment['dataPoints']): number {
    const elements = Object.values(dataPoints);
    const completed = elements.filter(element => this.isElementCompleted(element)).length;
    return Math.round((completed / elements.length) * 100);
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(dataPoints: MEDDPICCAssessment['dataPoints']): string[] {
    const recommendations: string[] = [];

    if (!dataPoints.metrics.identified) {
      recommendations.push("Quantify economic impact and establish success metrics");
    }

    if (!dataPoints.economicBuyer.identified) {
      recommendations.push("Identify and verify the economic buyer with budget authority");
    }

    if (!dataPoints.decisionCriteria.mapped) {
      recommendations.push("Discover and map evaluation criteria through discovery calls");
    }

    if (!dataPoints.champion.identified) {
      recommendations.push("Identify and develop a strong internal champion");
    }

    if (!dataPoints.implifyPain.quantified) {
      recommendations.push("Quantify business pain and consequences of inaction");
    }

    if (!dataPoints.competition.mapped) {
      recommendations.push("Research competitive landscape and positioning");
    }

    return recommendations;
  }

  /**
   * Generate next actions
   */
  private generateNextActions(dataPoints: MEDDPICCAssessment['dataPoints']): string[] {
    const actions: string[] = [];

    if (dataPoints.economicBuyer.confidence < 0.8) {
      actions.push("Schedule meeting with economic buyer for budget confirmation");
    }

    if (dataPoints['champion']['identified'] && dataPoints.champion.strength.score < 70) {
      actions.push("Strengthen champion relationship and commitment");
    }

    if (dataPoints.decisionCriteria.confidence < 0.7) {
      actions.push("Conduct formal discovery to understand evaluation criteria");
    }

    if (dataPoints['competition']['mapped'] && dataPoints['competition']['competitivePosition'] === 'challenged') {
      actions.push("Develop competitive differentiation strategy");
    }

    return actions;
  }

  /**
   * Identify risk factors
   */
  private identifyRiskFactors(dataPoints: MEDDPICCAssessment['dataPoints']): string[] {
    const risks: string[] = [];

    if (!dataPoints.economicBuyer.identified) {
      risks.push("No economic buyer identified - deal may stall");
    }

    if (dataPoints.champion.strength.score < 50) {
      risks.push("Weak champion - limited internal advocacy");
    }

    if (dataPoints['competition']['competitivePosition'] === 'losing') {
      risks.push("Poor competitive position - high risk of loss");
    }

    if (!dataPoints.implifyPain.quantified) {
      risks.push("Unquantified pain - difficult to justify investment");
    }

    return risks;
  }

  // Helper methods
  private getElementScore(element: any): number {
    if (element.identified !== undefined) return element.identified ? 100 : 0;
    if (element.mapped !== undefined) return element.mapped ? 100 : 0;
    if (element.understood !== undefined) return element.understood ? 100 : 0;
    if (element.documented !== undefined) return element.documented ? 100 : 0;
    if (element.quantified !== undefined) return element.quantified ? 100 : 0;
    return 0;
  }

  private isElementCompleted(element: any): boolean {
    return this.getElementScore(element) > 50;
  }

  private identifyBusinessMetrics(companyData: any, painData?: any): string[] {
    const metrics = ["Revenue Growth", "Cost Reduction", "Efficiency Improvement"];
    
    if (painData?.painCategories) {
      if (painData.painCategories.revenueLoss > 0) metrics.push("Revenue Protection");
      if (painData.painCategories.costInefficiency > 0) metrics.push("Operational Efficiency");
      if (painData.painCategories.complianceRisk > 0) metrics.push("Risk Mitigation");
    }

    return metrics;
  }

  private identifySuccessMetrics(companyData: any): string[] {
    const industry = companyData.industry || 'Technology';
    const baseMetrics = ["ROI", "Time to Value", "User Adoption"];
    
    const industryMetrics: { [key: string]: string[] } = {
      'Technology': ["Development Velocity", "System Uptime", "Security Score"],
      'Healthcare': ["Patient Outcomes", "Compliance Score", "Cost per Patient"],
      'Finance': ["Risk Reduction", "Regulatory Compliance", "Processing Speed"],
      'Manufacturing': ["Production Efficiency", "Quality Metrics", "Safety Score"],
    };

    return [...baseMetrics, ...(industryMetrics[industry] || [])];
  }

  private estimateBudgetAuthority(profile: any): number {
    const title = (profile.title || '').toLowerCase();
    
    if (title.includes('ceo') || title.includes('president')) return 10000000;
    if (title.includes('cfo')) return 5000000;
    if (title.includes('cto') || title.includes('chief')) return 2000000;
    if (title.includes('vp') || title.includes('vice president')) return 1000000;
    if (title.includes('director')) return 500000;
    if (title.includes('manager')) return 100000;
    
    return 50000;
  }

  private classifyDecisionLevel(title: string): "c-suite" | "vp" | "director" | "manager" {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('chief') || lowerTitle.includes('ceo') || lowerTitle.includes('president')) {
      return "c-suite";
    }
    if (lowerTitle.includes('vp') || lowerTitle.includes('vice president')) {
      return "vp";
    }
    if (lowerTitle.includes('director')) {
      return "director";
    }
    
    return "manager";
  }

  private identifyDecisionCriteria(companyData: any, opportunitySignals: any[]): MEDDPICCDecisionCriteria['criteria'] {
    return [
      { criterion: "ROI/Financial Impact", importance: "critical", ourPosition: "strong", competitorPosition: "moderate" },
      { criterion: "Technical Fit", importance: "high", ourPosition: "strong", competitorPosition: "moderate" },
      { criterion: "Implementation Timeline", importance: "high", ourPosition: "moderate", competitorPosition: "weak" },
      { criterion: "Vendor Stability", importance: "medium", ourPosition: "strong", competitorPosition: "strong" },
      { criterion: "Support Quality", importance: "medium", ourPosition: "strong", competitorPosition: "moderate" },
    ];
  }

  private calculateCriteriaScore(criteria: MEDDPICCDecisionCriteria['criteria']): number {
    const importanceWeights = { critical: 3, high: 2, medium: 1, low: 0.5 };
    const positionScores = { strong: 3, moderate: 2, weak: 1, unknown: 0 };
    
    let totalScore = 0;
    let totalWeight = 0;
    
    criteria.forEach(criterion => {
      const weight = importanceWeights[criterion.importance];
      const score = positionScores[criterion.ourPosition];
      totalScore += score * weight;
      totalWeight += weight;
    });
    
    return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 33.33) : 0; // Scale to 0-100
  }

  private mapStakeholders(buyerGroup: any, enrichedProfiles: any[]): MEDDPICCDecisionProcess['process']['stakeholders'] {
    const stakeholders: MEDDPICCDecisionProcess['process']['stakeholders'] = [];
    
    // Map different stakeholder types
    const roleMapping = {
      decisionMakers: { influence: "high" as const, position: "supporter" as const },
      champions: { influence: "high" as const, position: "supporter" as const },
      stakeholders: { influence: "medium" as const, position: "neutral" as const },
      blockers: { influence: "medium" as const, position: "blocker" as const },
      openers: { influence: "low" as const, position: "supporter" as const },
    };

    Object.entries(roleMapping).forEach(([roleType, attributes]) => {
      const roleMembers = buyerGroup[roleType] || [];
      roleMembers.forEach((memberId: string) => {
        const profile = enrichedProfiles.find(p => p['personId'] === memberId);
        if (profile) {
          stakeholders.push({
            name: profile.personName,
            role: profile.title || roleType,
            influence: attributes.influence,
            position: attributes.position,
          });
        }
      });
    });

    return stakeholders;
  }

  private identifyDecisionStages(buyerGroup: any): string[] {
    return [
      "Problem Recognition",
      "Solution Research", 
      "Vendor Evaluation",
      "Proposal Review",
      "Negotiation",
      "Legal/Procurement Review",
      "Final Approval",
      "Contract Signature"
    ];
  }

  private estimateDecisionTimeline(buyerGroup: any, stakeholders: any[]): string {
    const stakeholderCount = stakeholders.length;
    const hasMultipleInfluencers = stakeholders.filter(s => s['influence'] === 'high').length > 2;
    
    if (stakeholderCount > 8 || hasMultipleInfluencers) return "6-9 months";
    if (stakeholderCount > 4) return "3-6 months";
    return "1-3 months";
  }

  private identifyApprovalLevels(stakeholders: any[]): string[] {
    const levels = [];
    
    if (stakeholders.some(s => s.role.toLowerCase().includes('manager'))) {
      levels.push("Management Approval");
    }
    if (stakeholders.some(s => s.role.toLowerCase().includes('director'))) {
      levels.push("Director Approval");
    }
    if (stakeholders.some(s => s.role.toLowerCase().includes('vp'))) {
      levels.push("VP Approval");
    }
    if (stakeholders.some(s => s.role.toLowerCase().includes('chief') || s.role.toLowerCase().includes('ceo'))) {
      levels.push("Executive Approval");
    }
    
    levels.push("Legal Review", "Procurement Approval");
    
    return levels;
  }

  private getCompanySize(companyData: any): string {
    return companyData.companySize || companyData.employeeCount || "51-200";
  }

  private identifyPaperRequirements(companySize: string, industry: string): MEDDPICCPaperProcess['requirements'] {
    const base = {
      legal: ["Master Service Agreement", "Data Processing Agreement"],
      procurement: ["Vendor Registration", "Purchase Order"],
      compliance: ["Security Review", "Privacy Assessment"],
      technical: ["Technical Requirements", "Integration Specifications"],
    };

    // Add industry-specific requirements
    if (industry === 'Healthcare') {
      base.compliance.push("HIPAA Compliance", "BAA Agreement");
    }
    if (industry === 'Finance') {
      base.compliance.push("SOX Compliance", "Financial Audit");
    }

    // Add size-specific requirements
    if (companySize === '1000+') {
      base.legal.push("Enterprise Agreement", "SLA Requirements");
      base.procurement.push("Multi-level Approval", "Budget Allocation");
    }

    return base;
  }

  private assessPaperComplexity(companySize: string, industry: string): MEDDPICCPaperProcess['complexity'] {
    if (companySize === '1000+' && ['Healthcare', 'Finance'].includes(industry)) {
      return "very-complex";
    }
    if (companySize === '1000+' || ['Healthcare', 'Finance'].includes(industry)) {
      return "complex";
    }
    if (companySize === '201-500' || companySize === '501-1000') {
      return "moderate";
    }
    return "simple";
  }

  private estimatePaperTimeline(complexity: MEDDPICCPaperProcess['complexity']): string {
    const timelines = {
      'simple': "2-4 weeks",
      'moderate': "4-8 weeks", 
      'complex': "8-12 weeks",
      'very-complex': "12-16 weeks"
    };
    return timelines[complexity];
  }

  private identifyConsequences(painPoint: any): string[] {
    const consequences = [];
    
    if (painPoint['urgency'] === 'immediate') {
      consequences.push("Immediate revenue impact", "Competitive disadvantage");
    }
    if (painPoint.quantifiedImpact > 1000000) {
      consequences.push("Major financial loss", "Stakeholder pressure");
    }
    if (painPoint['type'] === 'regulatory') {
      consequences.push("Compliance violations", "Potential penalties");
    }
    
    consequences.push("Continued inefficiency", "Lost opportunity cost");
    
    return consequences;
  }

  private assessChampionStrength(champion: any): MEDDPICCChampion['strength'] {
    const indicators = [];
    const risks = [];
    let score = 50; // Base score

    // Assess based on title/influence
    const title = (champion.title || '').toLowerCase();
    if (title.includes('director') || title.includes('vp') || title.includes('chief')) {
      score += 20;
      indicators.push("Senior title with influence");
    } else {
      risks.push("Limited organizational influence");
    }

    // Assess based on engagement
    if (champion.recentActivity?.length > 3) {
      score += 15;
      indicators.push("High engagement level");
    } else {
      risks.push("Low engagement history");
    }

    // Assess accessibility
    if (champion.email) {
      score += 10;
      indicators.push("Direct contact available");
    }

    return {
      score: Math.min(100, Math.max(0, score)),
      indicators,
      risks,
    };
  }

  private assessInfluence(profile: any): "high" | "medium" | "low" {
    const title = (profile.title || '').toLowerCase();
    if (title.includes('chief') || title.includes('vp') || title.includes('president')) return "high";
    if (title.includes('director') || title.includes('senior')) return "medium";
    return "low";
  }

  private assessCommitment(profile: any): "strong" | "moderate" | "weak" {
    const engagementLevel = profile.recentActivity?.length || 0;
    if (engagementLevel > 5) return "strong";
    if (engagementLevel > 2) return "moderate";
    return "weak";
  }

  private assessAccessibility(profile: any): "high" | "medium" | "low" {
    if (profile['email'] && profile.phone) return "high";
    if (profile.email || profile.phone) return "medium";
    return "low";
  }

  private identifyCompetitors(companyData: any, competitorSignals: any[]): MEDDPICCCompetition['competitors'] {
    // This would be enhanced with real competitive intelligence
    return [
      {
        name: "Microsoft",
        strength: "strong",
        position: "Incumbent vendor",
        advantages: ["Brand recognition", "Enterprise relationships"],
        weaknesses: ["High cost", "Complex implementation"],
        strategy: "Leverage existing relationships"
      },
      {
        name: "Salesforce",
        strength: "moderate", 
        position: "Market leader",
        advantages: ["Feature completeness", "Ecosystem"],
        weaknesses: ["Pricing", "Customization complexity"],
        strategy: "Feature differentiation"
      }
    ];
  }

  private assessCompetitivePosition(competitors: MEDDPICCCompetition['competitors']): MEDDPICCCompetition['competitivePosition'] {
    const strongCompetitors = competitors.filter(c => c['strength'] === 'strong').length;
    if (strongCompetitors === 0) return "leading";
    if (strongCompetitors === 1) return "competitive";
    if (strongCompetitors === 2) return "challenged";
    return "losing";
  }

  /**
   * Generate MEDDPICC summary for prioritization
   */
  generateMEDDPICCSummary(assessment: MEDDPICCAssessment): string {
    const score = assessment.overallScore;
    const completion = assessment.completionPercentage;
    
    if (score > 80 && completion > 80) {
      return `🎯 QUALIFIED: ${score}% MEDDPICC score, ${completion}% complete. Deal ready to advance.`;
    } else if (score > 60 && completion > 60) {
      return `📊 DEVELOPING: ${score}% MEDDPICC score, ${completion}% complete. Key gaps: ${assessment.recommendations.slice(0, 2).join(', ')}.`;
    } else if (score > 40) {
      return `⚠️ EARLY STAGE: ${score}% MEDDPICC score. Priority actions: ${assessment.nextActions.slice(0, 2).join(', ')}.`;
    } else {
      return `🔍 DISCOVERY NEEDED: ${score}% MEDDPICC score. Focus on: ${assessment.recommendations.slice(0, 3).join(', ')}.`;
    }
  }
} 