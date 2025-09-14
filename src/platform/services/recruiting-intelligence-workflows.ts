/**
 * 👥 RECRUITING INTELLIGENCE WORKFLOWS
 * 
 * Comprehensive workflows for recruiters and talent acquisition teams
 * Provides talent sourcing, market intelligence, and candidate research
 */

import { CoreSignalClient } from './buyer-group/coresignal-client';
import { RoleFinderPipeline, RoleDefinition, COMMON_ROLES } from './role-finder-pipeline';

export interface RecruitingIntelligenceConfig {
  coreSignal: {
    apiKey: string;
    baseUrl: string;
  };
  sourcing: {
    maxCandidatesPerSearch: number;
    minConfidenceScore: number;
    includeRecentlyLeft: boolean;
    excludeCurrentEmployees: boolean;
  };
  alerts: {
    enableTalentAlerts: boolean;
    alertWebhookUrl?: string;
    monitoringRoles: string[];
  };
}

export interface TalentSourcingRequest {
  roles: Array<string | RoleDefinition>;
  targetCompanies?: string[];
  excludeCompanies?: string[];
  industries?: string[];
  geography?: string[];
  experience?: {
    minYears?: number;
    maxYears?: number;
    specificCompanies?: string[];
    specificRoles?: string[];
  };
  compensation?: {
    minSalary?: number;
    maxSalary?: number;
    currency?: string;
  };
  filters?: {
    excludeConsultants?: boolean;
    excludeContractors?: boolean;
    recentlyActive?: boolean; // Active on professional networks
    openToWork?: boolean;
  };
}

export interface CandidateProfile {
  person: {
    id: string;
    name: string;
    title: string;
    company: string;
    department?: string;
    location?: string;
    linkedinUrl?: string;
    email?: string;
  };
  experience: {
    currentRole: {
      title: string;
      company: string;
      duration: string;
      startDate?: string;
    };
    previousRoles: Array<{
      title: string;
      company: string;
      duration: string;
      startDate?: string;
      endDate?: string;
    }>;
    totalExperience: string;
    relevantExperience: string;
  };
  skills: {
    technical?: string[];
    leadership?: string[];
    industry?: string[];
  };
  education?: Array<{
    degree: string;
    school: string;
    year?: string;
  }>;
  compensation?: {
    currentSalary?: {
      base: number;
      total: number;
      currency: string;
    };
    marketRate?: {
      p25: number;
      median: number;
      p75: number;
      currency: string;
    };
  };
  signals: {
    likelyToMove: number; // 0-100 score
    reasonsToMove: string[];
    recentActivity: string[];
  };
  fit: {
    roleMatch: number; // 0-100 score
    companyMatch: number; // 0-100 score
    overallFit: number; // 0-100 score
    reasoning: string[];
  };
}

export interface MarketIntelligence {
  role: string;
  market: {
    totalCandidates: number;
    availableCandidates: number;
    competitionLevel: 'low' | 'medium' | 'high';
    averageTimeToFill: number; // days
  };
  compensation: {
    baseSalary: {
      p25: number;
      median: number;
      p75: number;
      currency: string;
    };
    totalCompensation: {
      p25: number;
      median: number;
      p75: number;
      currency: string;
    };
    trends: {
      salaryGrowth: number; // percentage
      demandGrowth: number; // percentage
    };
  };
  topCompanies: Array<{
    name: string;
    candidateCount: number;
    averageTenure: number;
    employeeSatisfaction: number;
    isHiring: boolean;
  }>;
  skills: {
    inDemand: string[];
    emerging: string[];
    declining: string[];
  };
  geography: {
    topLocations: Array<{
      location: string;
      candidateCount: number;
      averageSalary: number;
    }>;
    remote: {
      percentage: number;
      salaryPremium: number;
    };
  };
}

export interface TalentMovementAlert {
  type: 'executive_departure' | 'team_departure' | 'new_hire' | 'promotion' | 'company_layoffs';
  company: {
    id: number;
    name: string;
    industry: string;
  };
  person?: {
    name: string;
    title: string;
    linkedinUrl?: string;
  };
  event: {
    description: string;
    date: string;
    impact: 'high' | 'medium' | 'low';
  };
  opportunity: {
    description: string;
    actionItems: string[];
    priority: number; // 1-10
  };
}

export class RecruitingIntelligenceWorkflows {
  private config: RecruitingIntelligenceConfig;
  private coreSignalClient: CoreSignalClient;
  private roleFinderPipeline: RoleFinderPipeline;

  constructor(config: RecruitingIntelligenceConfig) {
    this['config'] = config;
    this['coreSignalClient'] = new CoreSignalClient(this.config.coreSignal);
    this['roleFinderPipeline'] = new RoleFinderPipeline({
      coreSignal: {
        ...this.config.coreSignal,
        maxCollects: this.config.sourcing.maxCandidatesPerSearch,
        batchSize: 25,
        useCache: true,
        cacheTTL: 12 // Shorter cache for recruiting (12 hours)
      },
      output: { format: 'json', includeContactInfo: true, includeCompanyInfo: true, includeConfidenceScores: true },
      search: { 
        maxResultsPerCompany: 10, 
        minConfidenceScore: this.config.sourcing.minConfidenceScore, 
        includeRecentlyLeft: this.config.sourcing.includeRecentlyLeft 
      }
    });
  }

  /**
   * 🎯 WORKFLOW 1: Advanced Talent Sourcing
   * "Find me senior React developers who worked at FAANG companies"
   */
  async sourceTalent(request: TalentSourcingRequest): Promise<{
    candidates: CandidateProfile[];
    summary: {
      totalFound: number;
      averageFit: number;
      topSources: Array<{ company: string; count: number }>;
      geography: Array<{ location: string; count: number }>;
    };
  }> {
    console.log('🎯 Starting advanced talent sourcing...');
    
    // Convert request to company list for role finder
    const companies = request.targetCompanies || await this.getTopCompaniesForRoles(request.roles);
    
    // Use RoleFinderPipeline to find candidates
    const searchResults = await this.roleFinderPipeline.findRoles({
      companies: companies.map(name => ({ name })),
      roles: request.roles.map(role => typeof role === 'string' ? COMMON_ROLES[role.toUpperCase()] || this.createCustomRole(role) : role),
      geography: request.geography,
      filters: {
        excludeConsultants: request.filters?.excludeConsultants ?? true,
        excludeContractors: request.filters?.excludeContractors ?? true,
        minTenure: request.experience?.minYears ? request.experience.minYears * 12 : undefined
      }
    });

    // Enrich candidates with additional intelligence
    const candidates: CandidateProfile[] = [];
    for (const result of searchResults.results) {
      try {
        const enrichedCandidate = await this.enrichCandidateProfile(result, request);
        candidates.push(enrichedCandidate);
      } catch (error) {
        console.error('Failed to enrich candidate:', error);
      }
    }

    // Filter by compensation if specified
    const filteredCandidates = request.compensation 
      ? candidates.filter(c => this.matchesCompensationCriteria(c, request.compensation!))
      : candidates;

    // Sort by overall fit score
    const sortedCandidates = filteredCandidates.sort((a, b) => b.fit.overallFit - a.fit.overallFit);

    return {
      candidates: sortedCandidates,
      summary: {
        totalFound: sortedCandidates.length,
        averageFit: sortedCandidates.reduce((sum, c) => sum + c.fit.overallFit, 0) / sortedCandidates.length,
        topSources: this.getTopSources(sortedCandidates),
        geography: this.getGeographyBreakdown(sortedCandidates)
      }
    };
  }

  /**
   * 📊 WORKFLOW 2: Market Intelligence & Compensation Analysis
   * "What's the market like for VP of Engineering roles?"
   */
  async analyzeMarket(role: string, geography?: string[], industries?: string[]): Promise<MarketIntelligence> {
    console.log(`📊 Analyzing market for ${role}...`);
    
    // Get market data from CoreSignal
    const marketData = await this.getMarketData(role, geography, industries);
    
    // Analyze compensation trends
    const compensationData = await this.analyzeCompensationTrends(role, geography);
    
    // Get top companies for this role
    const topCompanies = await this.getTopCompaniesForRole(role, geography, industries);
    
    // Analyze skill trends
    const skillTrends = await this.analyzeSkillTrends(role);
    
    // Get geographic distribution
    const geoData = await this.analyzeGeographicDistribution(role);

    return {
      role,
      market: {
        totalCandidates: marketData.totalCandidates,
        availableCandidates: marketData.availableCandidates,
        competitionLevel: this.calculateCompetitionLevel(marketData),
        averageTimeToFill: marketData.averageTimeToFill
      },
      compensation: compensationData,
      topCompanies,
      skills: skillTrends,
      geography: geoData
    };
  }

  /**
   * 🔔 WORKFLOW 3: Talent Movement Monitoring
   * "Alert me when senior engineers leave Google"
   */
  async monitorTalentMovement(
    targetCompanies: string[], 
    roles: string[], 
    timeframe: string = 'last_30_days'
  ): Promise<TalentMovementAlert[]> {
    console.log(`🔔 Monitoring talent movement for ${targetCompanies.length} companies...`);
    
    const alerts: TalentMovementAlert[] = [];

    for (const company of targetCompanies) {
      try {
        // Get company data
        const companyData = await this.getCompanyByName(company);
        
        // Check for executive departures
        const departures = await this.detectExecutiveDepartures(companyData, roles, timeframe);
        alerts.push(...departures);
        
        // Check for team departures (multiple people leaving same department)
        const teamDepartures = await this.detectTeamDepartures(companyData, timeframe);
        alerts.push(...teamDepartures);
        
        // Check for layoffs or downsizing
        const layoffSignals = await this.detectLayoffSignals(companyData, timeframe);
        alerts.push(...layoffSignals);
        
        // Check for new executive hires (competitive intelligence)
        const newHires = await this.detectNewExecutiveHires(companyData, roles, timeframe);
        alerts.push(...newHires);

      } catch (error) {
        console.error(`Failed to monitor ${company}:`, error);
      }
    }

    // Sort by priority and return
    return alerts.sort((a, b) => b.opportunity.priority - a.opportunity.priority);
  }

  /**
   * 🕵️ WORKFLOW 4: Candidate Research & Intelligence
   * "Tell me everything about this candidate"
   */
  async researchCandidate(candidateId: string): Promise<{
    profile: CandidateProfile;
    careerPath: {
      progression: Array<{
        role: string;
        company: string;
        duration: string;
        promotions: boolean;
        careerGrowth: 'up' | 'lateral' | 'down';
      }>;
      patterns: string[];
      nextLikelyMove: string[];
    };
    network: {
      currentColleagues: Array<{ name: string; title: string; relationship: string }>;
      formerColleagues: Array<{ name: string; title: string; company: string }>;
      industryConnections: number;
    };
    signals: {
      likelyToMove: number;
      reasonsToMove: string[];
      bestApproach: string[];
    };
  }> {
    console.log(`🕵️ Researching candidate ${candidateId}...`);
    
    // Get detailed candidate profile
    const profile = await this.getDetailedCandidateProfile(candidateId);
    
    // Analyze career progression
    const careerPath = await this.analyzeCareerProgression(profile);
    
    // Map professional network
    const network = await this.mapProfessionalNetwork(profile);
    
    // Calculate likelihood to move and best approach
    const signals = await this.calculateMoveSignals(profile);

    return {
      profile,
      careerPath,
      network,
      signals
    };
  }

  /**
   * 🏢 WORKFLOW 5: Company Talent Analysis
   * "Show me the talent landscape at Stripe"
   */
  async analyzeCompanyTalent(companyName: string): Promise<{
    company: {
      name: string;
      industry: string;
      size: number;
      growth: string;
    };
    talent: {
      totalEmployees: number;
      byDepartment: Record<string, number>;
      bySeniority: Record<string, number>;
      keyExecutives: Array<{
        name: string;
        title: string;
        tenure: string;
        background: string[];
      }>;
    };
    trends: {
      hiring: {
        activePostings: number;
        growingDepartments: string[];
        inDemandRoles: string[];
      };
      attrition: {
        recentDepartures: number;
        atRiskTalent: Array<{
          name: string;
          title: string;
          riskScore: number;
          reasons: string[];
        }>;
      };
    };
    opportunities: {
      talentToPoach: Array<{
        name: string;
        title: string;
        poachability: number;
        approach: string[];
      }>;
      referralSources: Array<{
        name: string;
        title: string;
        networkSize: number;
      }>;
    };
  }> {
    console.log(`🏢 Analyzing talent at ${companyName}...`);
    
    // Get comprehensive company data
    const companyData = await this.getCompanyByName(companyName);
    
    // Analyze talent composition
    const talentAnalysis = await this.analyzeTalentComposition(companyData);
    
    // Analyze hiring and attrition trends
    const trends = await this.analyzeTalentTrends(companyData);
    
    // Identify opportunities
    const opportunities = await this.identifyTalentOpportunities(companyData);

    return {
      company: {
        name: companyData.company_name,
        industry: companyData.industry,
        size: companyData.employees_count,
        growth: this.calculateGrowthTrend(companyData)
      },
      talent: talentAnalysis,
      trends,
      opportunities
    };
  }

  // Private helper methods

  private async getTopCompaniesForRoles(roles: Array<string | RoleDefinition>): Promise<string[]> {
    // Implementation would find top companies that typically have these roles
    return ['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'Netflix', 'Uber', 'Airbnb'];
  }

  private createCustomRole(roleString: string): RoleDefinition {
    return {
      name: roleString,
      titles: [roleString],
      seniorityLevel: 'director', // Default
      priority: 'medium'
    };
  }

  private async enrichCandidateProfile(result: any, request: TalentSourcingRequest): Promise<CandidateProfile> {
    // Enrich the basic result with additional intelligence
    const moveSignals = await this.calculateMoveSignals(result);
    const fitScore = await this.calculateFitScore(result, request);
    const compensationData = await this.getCompensationData(result.person.title, result.company.name);

    return {
      person: {
        id: result.metadata.searchQuery, // Use search query as ID for now
        name: result.person.name,
        title: result.person.title,
        company: result.company.name,
        department: result.person.department,
        location: 'Unknown', // Would be enriched from profile data
        linkedinUrl: result.person.linkedinUrl,
        email: result.person.email
      },
      experience: {
        currentRole: {
          title: result.person.title,
          company: result.company.name,
          duration: result.person.tenure || 'Unknown',
          startDate: undefined // Would be enriched
        },
        previousRoles: result.person.previousRoles?.map((role: string) => ({
          title: role,
          company: 'Unknown',
          duration: 'Unknown'
        })) || [],
        totalExperience: 'Unknown',
        relevantExperience: 'Unknown'
      },
      skills: {
        technical: [],
        leadership: [],
        industry: []
      },
      compensation: compensationData,
      signals: moveSignals,
      fit: fitScore
    };
  }

  private matchesCompensationCriteria(candidate: CandidateProfile, criteria: NonNullable<TalentSourcingRequest['compensation']>): boolean {
    if (!candidate.compensation?.currentSalary) return true; // Include if no data
    
    const salary = candidate.compensation.currentSalary.total;
    if (criteria['minSalary'] && salary < criteria.minSalary) return false;
    if (criteria['maxSalary'] && salary > criteria.maxSalary) return false;
    
    return true;
  }

  private getTopSources(candidates: CandidateProfile[]): Array<{ company: string; count: number }> {
    const sources = candidates.reduce((acc, c) => {
      acc[c.person.company] = (acc[c.person.company] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(sources)
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getGeographyBreakdown(candidates: CandidateProfile[]): Array<{ location: string; count: number }> {
    const locations = candidates.reduce((acc, c) => {
      const location = c.person.location || 'Unknown';
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(locations)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count);
  }

  // Mock implementations for complex analysis methods
  private async getMarketData(role: string, geography?: string[], industries?: string[]): Promise<any> {
    return { totalCandidates: 10000, availableCandidates: 2000, averageTimeToFill: 45 };
  }

  private async analyzeCompensationTrends(role: string, geography?: string[]): Promise<MarketIntelligence['compensation']> {
    return {
      baseSalary: { p25: 120000, median: 150000, p75: 180000, currency: 'USD' },
      totalCompensation: { p25: 150000, median: 200000, p75: 250000, currency: 'USD' },
      trends: { salaryGrowth: 8.5, demandGrowth: 12.3 }
    };
  }

  private async getTopCompaniesForRole(role: string, geography?: string[], industries?: string[]): Promise<MarketIntelligence['topCompanies']> {
    return [
      { name: 'Google', candidateCount: 500, averageTenure: 3.2, employeeSatisfaction: 4.3, isHiring: true },
      { name: 'Microsoft', candidateCount: 450, averageTenure: 4.1, employeeSatisfaction: 4.1, isHiring: true }
    ];
  }

  private async analyzeSkillTrends(role: string): Promise<MarketIntelligence['skills']> {
    return {
      inDemand: ['React', 'TypeScript', 'AWS', 'Kubernetes'],
      emerging: ['WebAssembly', 'Rust', 'Edge Computing'],
      declining: ['jQuery', 'PHP', 'Flash']
    };
  }

  private async analyzeGeographicDistribution(role: string): Promise<MarketIntelligence['geography']> {
    return {
      topLocations: [
        { location: 'San Francisco Bay Area', candidateCount: 2500, averageSalary: 180000 },
        { location: 'New York City', candidateCount: 1800, averageSalary: 165000 }
      ],
      remote: { percentage: 35, salaryPremium: 5 }
    };
  }

  private calculateCompetitionLevel(marketData: any): 'low' | 'medium' | 'high' {
    const ratio = marketData.availableCandidates / marketData.totalCandidates;
    if (ratio > 0.3) return 'low';
    if (ratio > 0.15) return 'medium';
    return 'high';
  }

  private async getCompanyByName(companyName: string): Promise<any> {
    // Implementation would search for company by name
    return { company_name: companyName, id: 123 };
  }

  private async detectExecutiveDepartures(companyData: any, roles: string[], timeframe: string): Promise<TalentMovementAlert[]> {
    // Implementation would check key_executive_departures
    return [];
  }

  private async detectTeamDepartures(companyData: any, timeframe: string): Promise<TalentMovementAlert[]> {
    // Implementation would analyze employee count changes by department
    return [];
  }

  private async detectLayoffSignals(companyData: any, timeframe: string): Promise<TalentMovementAlert[]> {
    // Implementation would check for sudden employee count drops
    return [];
  }

  private async detectNewExecutiveHires(companyData: any, roles: string[], timeframe: string): Promise<TalentMovementAlert[]> {
    // Implementation would check key_executive_arrivals
    return [];
  }

  private async getDetailedCandidateProfile(candidateId: string): Promise<CandidateProfile> {
    // Implementation would get detailed profile from CoreSignal
    return {} as CandidateProfile;
  }

  private async analyzeCareerProgression(profile: CandidateProfile): Promise<any> {
    // Implementation would analyze career path and progression
    return {};
  }

  private async mapProfessionalNetwork(profile: CandidateProfile): Promise<any> {
    // Implementation would map professional connections
    return {};
  }

  private async calculateMoveSignals(profile: any): Promise<any> {
    // Implementation would calculate likelihood to move
    return {
      likelyToMove: 65,
      reasonsToMove: ['Career growth', 'Compensation'],
      recentActivity: []
    };
  }

  private async calculateFitScore(result: any, request: TalentSourcingRequest): Promise<any> {
    // Implementation would calculate fit score
    return {
      roleMatch: 85,
      companyMatch: 75,
      overallFit: 80,
      reasoning: ['Strong technical background', 'Relevant experience']
    };
  }

  private async getCompensationData(title: string, company: string): Promise<any> {
    // Implementation would get compensation data
    return undefined;
  }

  private async analyzeTalentComposition(companyData: any): Promise<any> {
    // Implementation would analyze talent by department and seniority
    return {};
  }

  private async analyzeTalentTrends(companyData: any): Promise<any> {
    // Implementation would analyze hiring and attrition trends
    return {};
  }

  private async identifyTalentOpportunities(companyData: any): Promise<any> {
    // Implementation would identify poachable talent and referral sources
    return {};
  }

  private calculateGrowthTrend(companyData: any): string {
    // Implementation would calculate growth trend
    return 'Growing';
  }
}

// Predefined recruiting workflow templates
export const RECRUITING_WORKFLOW_TEMPLATES = {
  TALENT_SOURCING: {
    name: 'Advanced Talent Sourcing',
    description: 'Find and qualify candidates based on specific criteria',
    defaultConfig: {
      maxCandidatesPerSearch: 100,
      minConfidenceScore: 80,
      includeRecentlyLeft: true
    }
  },
  
  MARKET_ANALYSIS: {
    name: 'Market Intelligence',
    description: 'Analyze talent market conditions and compensation trends',
    defaultConfig: {
      includeCompensationData: true,
      analyzeSkillTrends: true,
      includeGeographicData: true
    }
  },
  
  TALENT_MONITORING: {
    name: 'Talent Movement Monitoring',
    description: 'Monitor target companies for talent movement opportunities',
    defaultConfig: {
      checkIntervalHours: 12,
      enableTalentAlerts: true,
      monitoringRoles: ['VP', 'Director', 'Senior']
    }
  },
  
  CANDIDATE_RESEARCH: {
    name: 'Candidate Intelligence',
    description: 'Deep research on specific candidates',
    defaultConfig: {
      includeNetworkMapping: true,
      analyzeMoveSignals: true,
      includeCareerProgression: true
    }
  },
  
  COMPANY_ANALYSIS: {
    name: 'Company Talent Analysis',
    description: 'Analyze talent landscape at target companies',
    defaultConfig: {
      includeTalentTrends: true,
      identifyOpportunities: true,
      mapReferralSources: true
    }
  }
};
