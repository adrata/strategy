"use client";

/**
 * Pain Quantification Engine
 * 
 * Quantifies prospect pain in actual dollar amounts using Monaco pipeline data,
 * alternative data sources, and business intelligence. This goes far beyond
 * 6Sense's qualitative intent scoring by providing concrete financial impact.
 */

export interface PainDataPoint {
  source: string;
  type: "financial" | "operational" | "competitive" | "regulatory" | "strategic";
  description: string;
  quantifiedImpact: number; // Dollar amount
  confidence: number; // 0-1
  urgency: "immediate" | "quarterly" | "annual" | "strategic";
  evidence: string[];
}

export interface QuantifiedPain {
  companyId: string;
  companyName: string;
  totalQuantifiedPain: number;
  painCategories: {
    revenueLoss: number;
    costInefficiency: number;
    opportunityCost: number;
    complianceRisk: number;
    competitiveDisadvantage: number;
  };
  criticalPainPoints: PainDataPoint[];
  urgencyScore: number; // 0-100
  confidence: number; // 0-1
  lastUpdated: Date;
  nextReviewDate: Date;
}

export interface PainQuantificationConfig {
  // Data sources to analyze
  sources: {
    financialReports: boolean;
    industryBenchmarks: boolean;
    newsAndEvents: boolean;
    executiveStatements: boolean;
    jobPostings: boolean;
    technologyStack: boolean;
    competitorActivity: boolean;
    regulatoryChanges: boolean;
  };
  
  // Quantification methods
  methods: {
    revenueLossCalculation: boolean;
    costInefficiencyAnalysis: boolean;
    opportunityCostModeling: boolean;
    complianceRiskAssessment: boolean;
    competitiveImpactAnalysis: boolean;
  };
  
  // Thresholds for pain classification
  thresholds: {
    criticalPain: number;
    moderatePain: number;
    minViablePain: number;
  };
}

export class PainQuantificationEngine {
  private config: PainQuantificationConfig;

  constructor(config: PainQuantificationConfig) {
    this['config'] = config;
  }

  /**
   * Quantify pain for a company using all available data sources
   */
  async quantifyCompanyPain(
    companyData: any,
    enrichedProfiles: any[] = [],
    alternativeData: any = {},
    opportunitySignals: any[] = []
  ): Promise<QuantifiedPain> {
    console.log(`🎯 Quantifying pain for ${companyData.name}...`);

    const painDataPoints: PainDataPoint[] = [];

    // 1. Analyze Financial Signals
    if (this.config.sources.financialReports) {
      const financialPain = await this.analyzeFinancialPain(companyData, alternativeData);
      painDataPoints.push(...financialPain);
    }

    // 2. Analyze Operational Inefficiencies
    if (this.config.sources.technologyStack) {
      const operationalPain = await this.analyzeOperationalPain(companyData, enrichedProfiles);
      painDataPoints.push(...operationalPain);
    }

    // 3. Analyze Competitive Disadvantages
    if (this.config.sources.competitorActivity) {
      const competitivePain = await this.analyzeCompetitivePain(companyData, opportunitySignals);
      painDataPoints.push(...competitivePain);
    }

    // 4. Analyze Regulatory/Compliance Risks
    if (this.config.sources.regulatoryChanges) {
      const compliancePain = await this.analyzeCompliancePain(companyData, alternativeData);
      painDataPoints.push(...compliancePain);
    }

    // 5. Analyze Strategic Opportunity Costs
    const strategicPain = await this.analyzeStrategicPain(companyData, enrichedProfiles);
    painDataPoints.push(...strategicPain);

    // Calculate total quantified pain and categorize
    const painCategories = this.categorizePain(painDataPoints);
    const totalQuantifiedPain = Object.values(painCategories).reduce((sum, val) => sum + val, 0);
    
    // Filter critical pain points above threshold
    const criticalPainPoints = painDataPoints.filter(
      pain => pain.quantifiedImpact >= this.config.thresholds.criticalPain
    );

    // Calculate urgency score based on pain types and timeframes
    const urgencyScore = this.calculateUrgencyScore(painDataPoints);
    
    // Calculate confidence based on data quality and sources
    const confidence = this.calculateConfidence(painDataPoints);

    return {
      companyId: companyData.id,
      companyName: companyData.name,
      totalQuantifiedPain,
      painCategories,
      criticalPainPoints,
      urgencyScore,
      confidence,
      lastUpdated: new Date(),
      nextReviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };
  }

  /**
   * Analyze financial pain from revenue loss, margin compression, etc.
   */
  private async analyzeFinancialPain(
    companyData: any,
    alternativeData: any
  ): Promise<PainDataPoint[]> {
    const painPoints: PainDataPoint[] = [];

    // Revenue decline analysis
    if (alternativeData.financialTrends?.revenueGrowth < 0) {
      const quarterlyRevenueLoss = this.estimateQuarterlyRevenueLoss(companyData, alternativeData);
      painPoints.push({
        source: "Financial Reports",
        type: "financial",
        description: "Declining revenue growth rate indicating market share loss",
        quantifiedImpact: quarterlyRevenueLoss,
        confidence: 0.85,
        urgency: "quarterly",
        evidence: [
          `Revenue growth: ${alternativeData.financialTrends.revenueGrowth}%`,
          "Quarterly revenue decline trend",
          "Market share compression risk"
        ]
      });
    }

    // Margin compression from inefficiency
    if (alternativeData.operationalMetrics?.marginTrend < 0) {
      const marginLoss = this.estimateMarginCompressionImpact(companyData, alternativeData);
      painPoints.push({
        source: "Operational Analysis",
        type: "operational",
        description: "Margin compression from operational inefficiencies",
        quantifiedImpact: marginLoss,
        confidence: 0.8,
        urgency: "immediate",
        evidence: [
          `Margin trend: ${alternativeData.operationalMetrics.marginTrend}%`,
          "Cost structure optimization needed",
          "Efficiency improvements required"
        ]
      });
    }

    return painPoints;
  }

  /**
   * Analyze operational pain from technology inefficiencies
   */
  private async analyzeOperationalPain(
    companyData: any,
    enrichedProfiles: any[]
  ): Promise<PainDataPoint[]> {
    const painPoints: PainDataPoint[] = [];

    // Technology debt analysis
    const techStackAge = this.analyzeTechnologyStackAge(companyData);
    if (techStackAge.avgAge > 5) { // Technology older than 5 years
      const modernizationCost = this.estimateTechModernizationUrgency(companyData, techStackAge);
      painPoints.push({
        source: "Technology Analysis",
        type: "operational",
        description: "Legacy technology stack creating operational inefficiency",
        quantifiedImpact: modernizationCost,
        confidence: 0.75,
        urgency: "annual",
        evidence: [
          `Average tech stack age: ${techStackAge.avgAge} years`,
          "Legacy system maintenance costs increasing",
          "Developer productivity impact",
          "Security vulnerability exposure"
        ]
      });
    }

    // Scale-related pain
    const scalingPain = this.analyzeScalingChallenges(companyData, enrichedProfiles);
    if (scalingPain.impact > 0) {
      painPoints.push({
        source: "Scaling Analysis",
        type: "operational",
        description: "Rapid growth creating infrastructure and process bottlenecks",
        quantifiedImpact: scalingPain.impact,
        confidence: 0.7,
        urgency: "quarterly",
        evidence: scalingPain.evidence
      });
    }

    return painPoints;
  }

  /**
   * Analyze competitive pain from market positioning
   */
  private async analyzeCompetitivePain(
    companyData: any,
    opportunitySignals: any[]
  ): Promise<PainDataPoint[]> {
    const painPoints: PainDataPoint[] = [];

    // Competitive pressure analysis
    const competitorSignals = opportunitySignals.filter(signal => 
      signal['type'] === 'competitive_activity'
    );

    if (competitorSignals.length > 0) {
      const competitivePressure = this.quantifyCompetitivePressure(companyData, competitorSignals);
      painPoints.push({
        source: "Competitive Intelligence",
        type: "competitive",
        description: "Increasing competitive pressure in core markets",
        quantifiedImpact: competitivePressure.impact,
        confidence: competitivePressure.confidence,
        urgency: "immediate",
        evidence: competitivePressure.evidence
      });
    }

    return painPoints;
  }

  /**
   * Analyze compliance and regulatory pain
   */
  private async analyzeCompliancePain(
    companyData: any,
    alternativeData: any
  ): Promise<PainDataPoint[]> {
    const painPoints: PainDataPoint[] = [];

    // Regulatory compliance risk
    if (alternativeData.regulatoryIntelligence?.riskScore > 70) {
      const complianceCost = this.estimateComplianceRisk(companyData, alternativeData);
      painPoints.push({
        source: "Regulatory Intelligence",
        type: "regulatory",
        description: "High regulatory compliance risk requiring immediate attention",
        quantifiedImpact: complianceCost,
        confidence: 0.9,
        urgency: "immediate",
        evidence: [
          `Regulatory risk score: ${alternativeData.regulatoryIntelligence.riskScore}`,
          "New compliance requirements",
          "Potential penalty exposure"
        ]
      });
    }

    return painPoints;
  }

  /**
   * Analyze strategic opportunity cost pain
   */
  private async analyzeStrategicPain(
    companyData: any,
    enrichedProfiles: any[]
  ): Promise<PainDataPoint[]> {
    const painPoints: PainDataPoint[] = [];

    // Executive hiring patterns indicating strategic gaps
    const executiveHiring = enrichedProfiles.filter(profile => 
      (profile.title || '').toLowerCase().includes('chief') ||
      (profile.title || '').toLowerCase().includes('vp') ||
      (profile.title || '').toLowerCase().includes('director')
    );

    if (executiveHiring.length > 2) { // Significant leadership changes
      const strategicRealignmentCost = this.estimateStrategicRealignmentCost(companyData, executiveHiring);
      painPoints.push({
        source: "Executive Intelligence",
        type: "strategic",
        description: "Strategic realignment indicated by executive hiring patterns",
        quantifiedImpact: strategicRealignmentCost,
        confidence: 0.65,
        urgency: "strategic",
        evidence: [
          `${executiveHiring.length} recent executive hires`,
          "Strategic transformation indicators",
          "Organizational restructuring signals"
        ]
      });
    }

    return painPoints;
  }

  /**
   * Categorize pain points by type and sum totals
   */
  private categorizePain(painDataPoints: PainDataPoint[]): QuantifiedPain['painCategories'] {
    const categories = {
      revenueLoss: 0,
      costInefficiency: 0,
      opportunityCost: 0,
      complianceRisk: 0,
      competitiveDisadvantage: 0,
    };

    painDataPoints.forEach(pain => {
      switch (pain.type) {
        case "financial":
          categories.revenueLoss += pain.quantifiedImpact;
          break;
        case "operational":
          categories.costInefficiency += pain.quantifiedImpact;
          break;
        case "strategic":
          categories.opportunityCost += pain.quantifiedImpact;
          break;
        case "regulatory":
          categories.complianceRisk += pain.quantifiedImpact;
          break;
        case "competitive":
          categories.competitiveDisadvantage += pain.quantifiedImpact;
          break;
      }
    });

    return categories;
  }

  /**
   * Calculate urgency score based on pain timeframes and severity
   */
  private calculateUrgencyScore(painDataPoints: PainDataPoint[]): number {
    if (painDataPoints['length'] === 0) return 0;

    const urgencyWeights = {
      immediate: 100,
      quarterly: 75,
      annual: 50,
      strategic: 25
    };

    const weightedUrgency = painDataPoints.reduce((sum, pain) => {
      const weight = urgencyWeights[pain.urgency];
      const impactFactor = Math.min(pain.quantifiedImpact / 1000000, 1); // Scale by $1M
      return sum + (weight * impactFactor * pain.confidence);
    }, 0);

    return Math.min(100, weightedUrgency / painDataPoints.length);
  }

  /**
   * Calculate confidence based on data quality and source reliability
   */
  private calculateConfidence(painDataPoints: PainDataPoint[]): number {
    if (painDataPoints['length'] === 0) return 0;

    const avgConfidence = painDataPoints.reduce((sum, pain) => sum + pain.confidence, 0) / painDataPoints.length;
    const sourceVariety = new Set(painDataPoints.map(p => p.source)).size;
    const varietyBonus = Math.min(sourceVariety * 0.1, 0.3); // Up to 30% bonus for source variety

    return Math.min(1, avgConfidence + varietyBonus);
  }

  // Helper methods for specific calculations
  private estimateQuarterlyRevenueLoss(companyData: any, alternativeData: any): number {
    const estimatedRevenue = this.estimateAnnualRevenue(companyData);
    const growthDecline = Math.abs(alternativeData.financialTrends?.revenueGrowth || 5);
    return (estimatedRevenue * (growthDecline / 100)) / 4; // Quarterly impact
  }

  private estimateMarginCompressionImpact(companyData: any, alternativeData: any): number {
    const estimatedRevenue = this.estimateAnnualRevenue(companyData);
    const marginDecline = Math.abs(alternativeData.operationalMetrics?.marginTrend || 3);
    return estimatedRevenue * (marginDecline / 100);
  }

  private estimateTechModernizationUrgency(companyData: any, techStackAge: any): number {
    const estimatedRevenue = this.estimateAnnualRevenue(companyData);
    const inefficiencyFactor = Math.min(techStackAge.avgAge / 10, 0.15); // Up to 15% inefficiency
    return estimatedRevenue * inefficiencyFactor;
  }

  private estimateComplianceRisk(companyData: any, alternativeData: any): number {
    const estimatedRevenue = this.estimateAnnualRevenue(companyData);
    const riskScore = alternativeData.regulatoryIntelligence?.riskScore || 0;
    const riskFactor = riskScore / 1000; // Scale risk score to percentage
    return estimatedRevenue * riskFactor;
  }

  private estimateStrategicRealignmentCost(companyData: any, executiveHiring: any[]): number {
    const estimatedRevenue = this.estimateAnnualRevenue(companyData);
    const realignmentFactor = Math.min(executiveHiring.length * 0.02, 0.1); // Up to 10% for major realignment
    return estimatedRevenue * realignmentFactor;
  }

  private estimateAnnualRevenue(companyData: any): number {
    // Estimate revenue based on company size and industry
    const sizeMultipliers = {
      "1-10": 1000000,
      "11-50": 5000000,
      "51-200": 20000000,
      "201-500": 100000000,
      "501-1000": 500000000,
      "1000+": 2000000000,
    };

    const employeeCount = companyData.employeeCount || companyData.companySize || "51-200";
    return sizeMultipliers[employeeCount as keyof typeof sizeMultipliers] || 20000000;
  }

  private analyzeTechnologyStackAge(companyData: any): { avgAge: number; technologies: any[] } {
    const techStack = companyData.techStack || [];
    const currentYear = new Date().getFullYear();
    
    const ageAnalysis = techStack.map((tech: string) => {
      // Simplified age estimation based on common technology release dates
      const techAges: { [key: string]: number } = {
        "jquery": 2006,
        "angular": 2010,
        "react": 2013,
        "vue": 2014,
        "node.js": 2009,
        "mongodb": 2009,
        "postgresql": 1996,
        "mysql": 1995,
        "redis": 2009,
        "elasticsearch": 2010,
        "docker": 2013,
        "kubernetes": 2014,
        "aws": 2006,
        "azure": 2010,
        "gcp": 2008,
      };

      const releaseYear = techAges[tech.toLowerCase()] || currentYear - 3;
      return {
        technology: tech,
        age: currentYear - releaseYear,
      };
    });

    const avgAge = ageAnalysis.length > 0 
      ? ageAnalysis.reduce((sum: number, tech: { technology: string; age: number }) => sum + tech.age, 0) / ageAnalysis.length 
      : 0;

    return { avgAge, technologies: ageAnalysis };
  }

  private analyzeScalingChallenges(companyData: any, enrichedProfiles: any[]): { impact: number; evidence: string[] } {
    const engineeringHires = enrichedProfiles.filter(profile =>
      (profile.title || '').toLowerCase().includes('engineer') ||
      (profile.title || '').toLowerCase().includes('developer')
    );

    if (engineeringHires.length > 10) { // Rapid engineering growth
      const estimatedRevenue = this.estimateAnnualRevenue(companyData);
      const scalingInefficiency = Math.min(engineeringHires.length * 0.001, 0.05); // Up to 5% inefficiency
      
      return {
        impact: estimatedRevenue * scalingInefficiency,
        evidence: [
          `${engineeringHires.length} recent engineering hires`,
          "Rapid team scaling challenges",
          "Infrastructure bottlenecks likely",
          "Process optimization opportunities"
        ]
      };
    }

    return { impact: 0, evidence: [] };
  }

  private quantifyCompetitivePressure(companyData: any, competitorSignals: any[]): { impact: number; confidence: number; evidence: string[] } {
    const estimatedRevenue = this.estimateAnnualRevenue(companyData);
    const pressureScore = competitorSignals.length * 10; // Simplified scoring
    const impactFactor = Math.min(pressureScore / 1000, 0.1); // Up to 10% revenue risk
    
    return {
      impact: estimatedRevenue * impactFactor,
      confidence: 0.7,
      evidence: [
        `${competitorSignals.length} competitive signals detected`,
        "Market positioning challenges",
        "Differentiation pressure increasing"
      ]
    };
  }

  /**
   * Generate pain summary for quick assessment
   */
  generatePainSummary(quantifiedPain: QuantifiedPain): string {
    const totalPain = quantifiedPain.totalQuantifiedPain;
    const urgency = quantifiedPain.urgencyScore;
    const topPain = quantifiedPain['criticalPainPoints'][0];

    if (totalPain > 5000000) {
      return `🚨 CRITICAL: $${(totalPain / 1000000).toFixed(1)}M quantified pain, ${urgency}% urgency. Primary: ${topPain?.description || 'Multiple factors'}`;
    } else if (totalPain > 1000000) {
      return `⚠️ HIGH: $${(totalPain / 1000000).toFixed(1)}M quantified pain, ${urgency}% urgency. Key issue: ${topPain?.description || 'Operational challenges'}`;
    } else if (totalPain > 250000) {
      return `📊 MODERATE: $${(totalPain / 1000).toFixed(0)}K quantified pain, ${urgency}% urgency. Focus: ${topPain?.description || 'Efficiency improvements'}`;
    } else {
      return `📈 LOW: $${(totalPain / 1000).toFixed(0)}K pain identified. Opportunity for optimization.`;
    }
  }
} 