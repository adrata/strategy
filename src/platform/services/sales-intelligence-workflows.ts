/**
 * 🎯 SALES INTELLIGENCE WORKFLOWS
 * 
 * Comprehensive workflows for sales leaders and sellers using CoreSignal data
 * Provides actionable insights, timing triggers, and competitive intelligence
 */

import { CoreSignalClient } from './buyer-group/coresignal-client';
import { RoleFinderPipeline, RoleDefinition } from './role-finder-pipeline';

export interface SalesIntelligenceConfig {
  coreSignal: {
    apiKey: string;
    baseUrl: string;
  };
  alerts: {
    enableRealTimeAlerts: boolean;
    alertWebhookUrl?: string;
    checkIntervalHours: number;
  };
  scoring: {
    enableAccountScoring: boolean;
    scoringWeights: {
      growth: number;
      funding: number;
      executiveTurnover: number;
      employeeSatisfaction: number;
      technographics: number;
    };
  };
}

export interface AccountIntelligenceRequest {
  companyIds?: number[];
  companyNames?: string[];
  industries?: string[];
  employeeCountRange?: { min: number; max: number };
  revenueRange?: { min: number; max: number };
  fundingStage?: string[];
  geography?: string[];
  timeframe?: 'last_30_days' | 'last_90_days' | 'last_year';
}

export interface TriggerEvent {
  type: 'executive_change' | 'funding_round' | 'acquisition' | 'job_posting' | 'employee_growth' | 'tech_adoption';
  company: {
    id: number;
    name: string;
    website?: string;
  };
  event: {
    description: string;
    date: string;
    impact: 'high' | 'medium' | 'low';
    actionable: boolean;
  };
  suggestedActions: string[];
  priority: number; // 1-10 scale
}

export interface AccountScore {
  companyId: number;
  companyName: string;
  overallScore: number; // 0-100
  scoreBreakdown: {
    growth: number;
    funding: number;
    executiveTurnover: number;
    employeeSatisfaction: number;
    technographics: number;
  };
  reasoning: string[];
  lastUpdated: string;
}

export interface CompetitiveIntelligence {
  targetCompany: {
    id: number;
    name: string;
  };
  competitors: Array<{
    id: number;
    name: string;
    similarityScore: number;
    keyDifferences: string[];
    competitiveAdvantages: string[];
  }>;
  marketPosition: {
    rank: number;
    totalMarketSize: number;
    marketShare?: number;
  };
  talentFlow: {
    topSourceCompanies: Array<{ name: string; count: number }>;
    topDestinationCompanies: Array<{ name: string; count: number }>;
  };
}

export class SalesIntelligenceWorkflows {
  private config: SalesIntelligenceConfig;
  private coreSignalClient: CoreSignalClient;
  private roleFinderPipeline: RoleFinderPipeline;

  constructor(config: SalesIntelligenceConfig) {
    this['config'] = config;
    this['coreSignalClient'] = new CoreSignalClient(this.config.coreSignal);
    // Initialize RoleFinderPipeline with appropriate config
    this['roleFinderPipeline'] = new RoleFinderPipeline({
      coreSignal: {
        ...this.config.coreSignal,
        maxCollects: 100,
        batchSize: 20,
        useCache: true,
        cacheTTL: 24
      },
      output: { format: 'json', includeContactInfo: true, includeCompanyInfo: true, includeConfidenceScores: true },
      search: { maxResultsPerCompany: 5, minConfidenceScore: 75, includeRecentlyLeft: true }
    });
  }

  /**
   * 🚀 WORKFLOW 1: Account Prioritization & Scoring
   * "Show me my best accounts to focus on this quarter"
   */
  async scoreAccounts(request: AccountIntelligenceRequest): Promise<AccountScore[]> {
    console.log('🎯 Starting account scoring workflow...');
    
    // Get company data for scoring
    const companies = await this.getCompaniesForScoring(request);
    const scores: AccountScore[] = [];

    for (const company of companies) {
      try {
        const score = await this.calculateAccountScore(company);
        scores.push(score);
      } catch (error) {
        console.error(`Failed to score company ${company.id}:`, error);
      }
    }

    // Sort by overall score (highest first)
    return scores.sort((a, b) => b.overallScore - a.overallScore);
  }

  /**
   * 🔔 WORKFLOW 2: Real-Time Trigger Events
   * "Alert me when something important happens at my target accounts"
   */
  async detectTriggerEvents(companyIds: number[], timeframe: string = 'last_30_days'): Promise<TriggerEvent[]> {
    console.log(`🔔 Detecting trigger events for ${companyIds.length} companies...`);
    
    const events: TriggerEvent[] = [];

    for (const companyId of companyIds) {
      try {
        // Check for executive changes
        const executiveEvents = await this.detectExecutiveChanges(companyId, timeframe);
        events.push(...executiveEvents);

        // Check for funding rounds
        const fundingEvents = await this.detectFundingEvents(companyId, timeframe);
        events.push(...fundingEvents);

        // Check for job postings (hiring signals)
        const hiringEvents = await this.detectHiringSignals(companyId, timeframe);
        events.push(...hiringEvents);

        // Check for employee growth/decline
        const growthEvents = await this.detectEmployeeGrowthEvents(companyId, timeframe);
        events.push(...growthEvents);

      } catch (error) {
        console.error(`Failed to detect events for company ${companyId}:`, error);
      }
    }

    // Sort by priority (highest first)
    return events.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 🏆 WORKFLOW 3: Competitive Intelligence
   * "Show me everything about Nike's competitive landscape"
   */
  async analyzeCompetitiveLandscape(companyId: number): Promise<CompetitiveIntelligence> {
    console.log(`🏆 Analyzing competitive landscape for company ${companyId}...`);
    
    // Get company data
    const companyData = await this.coreSignalClient.getCompanyData(companyId);
    
    // Analyze competitors
    const competitors = await this.analyzeCompetitors(companyData);
    
    // Analyze talent flow
    const talentFlow = await this.analyzeTalentFlow(companyData);
    
    // Determine market position
    const marketPosition = await this.determineMarketPosition(companyData);

    return {
      targetCompany: {
        id: companyId,
        name: companyData.company_name
      },
      competitors,
      marketPosition,
      talentFlow
    };
  }

  /**
   * 👥 WORKFLOW 4: Stakeholder Mapping
   * "Show me all the decision makers at this account"
   */
  async mapAccountStakeholders(companyId: number, roles: string[] = ['CEO', 'CFO', 'CRO', 'VP_SALES']): Promise<any> {
    console.log(`👥 Mapping stakeholders for company ${companyId}...`);
    
    // Get company data first
    const companyData = await this.coreSignalClient.getCompanyData(companyId);
    
    // Use RoleFinderPipeline to find specific roles
    const stakeholderSearch = await this.roleFinderPipeline.findRoles({
      companies: [{ name: companyData.company_name, website: companyData.website }],
      roles: roles.map(roleKey => {
        // Convert role keys to role definitions
        const roleMap: Record<string, RoleDefinition> = {
          'CEO': { name: 'CEO', titles: ['Chief Executive Officer', 'CEO'], seniorityLevel: 'c_suite', priority: 'high' },
          'CFO': { name: 'CFO', titles: ['Chief Financial Officer', 'CFO'], seniorityLevel: 'c_suite', priority: 'high' },
          'CRO': { name: 'CRO', titles: ['Chief Revenue Officer', 'CRO'], seniorityLevel: 'c_suite', priority: 'high' },
          'VP_SALES': { name: 'VP Sales', titles: ['VP Sales', 'Vice President Sales'], seniorityLevel: 'vp', priority: 'high' }
        };
        return roleMap[roleKey] || roleMap['CEO'];
      }),
      filters: {
        excludeConsultants: true,
        excludeContractors: true,
        minTenure: 6 // At least 6 months in role
      }
    });

    return {
      company: {
        id: companyId,
        name: companyData.company_name,
        website: companyData.website,
        employeeCount: companyData.employees_count,
        industry: companyData.industry
      },
      stakeholders: stakeholderSearch.results,
      orgChart: await this.buildOrgChart(stakeholderSearch.results),
      summary: {
        totalStakeholders: stakeholderSearch.results.length,
        byRole: this.groupStakeholdersByRole(stakeholderSearch.results),
        averageConfidence: stakeholderSearch.summary.averageConfidence
      }
    };
  }

  /**
   * 📈 WORKFLOW 5: Growth & Expansion Signals
   * "Show me companies that are expanding and might need our solution"
   */
  async detectGrowthSignals(request: AccountIntelligenceRequest): Promise<any[]> {
    console.log('📈 Detecting growth signals...');
    
    const companies = await this.getCompaniesForScoring(request);
    const growthSignals = [];

    for (const company of companies) {
      try {
        const signals = await this.analyzeGrowthSignals(company);
        if (signals.length > 0) {
          growthSignals.push({
            company: {
              id: company.id,
              name: company.company_name,
              website: company.website
            },
            signals,
            growthScore: this.calculateGrowthScore(signals),
            recommendedActions: this.getGrowthBasedActions(signals)
          });
        }
      } catch (error) {
        console.error(`Failed to analyze growth signals for ${company.id}:`, error);
      }
    }

    return growthSignals.sort((a, b) => b.growthScore - a.growthScore);
  }

  // Private helper methods

  private async getCompaniesForScoring(request: AccountIntelligenceRequest): Promise<any[]> {
    // Implementation would use CoreSignal search API to find companies matching criteria
    // For now, return mock data structure
    return [];
  }

  private async calculateAccountScore(company: any): Promise<AccountScore> {
    const weights = this.config.scoring.scoringWeights;
    
    // Calculate individual scores (0-100 scale)
    const growthScore = await this.calculateGrowthScore(company);
    const fundingScore = await this.calculateFundingScore(company);
    const turnoverScore = await this.calculateTurnoverScore(company);
    const satisfactionScore = await this.calculateSatisfactionScore(company);
    const techScore = await this.calculateTechScore(company);

    // Calculate weighted overall score
    const overallScore = Math.round(
      (growthScore * weights.growth) +
      (fundingScore * weights.funding) +
      (turnoverScore * weights.executiveTurnover) +
      (satisfactionScore * weights.employeeSatisfaction) +
      (techScore * weights.technographics)
    );

    return {
      companyId: company.id,
      companyName: company.company_name,
      overallScore,
      scoreBreakdown: {
        growth: growthScore,
        funding: fundingScore,
        executiveTurnover: turnoverScore,
        employeeSatisfaction: satisfactionScore,
        technographics: techScore
      },
      reasoning: this.generateScoreReasoning(company, overallScore),
      lastUpdated: new Date().toISOString()
    };
  }

  private async detectExecutiveChanges(companyId: number, timeframe: string): Promise<TriggerEvent[]> {
    // Implementation would check key_executive_arrivals and key_executive_departures
    return [];
  }

  private async detectFundingEvents(companyId: number, timeframe: string): Promise<TriggerEvent[]> {
    // Implementation would check last_funding_round_announced_date
    return [];
  }

  private async detectHiringSignals(companyId: number, timeframe: string): Promise<TriggerEvent[]> {
    // Implementation would check active_job_postings and growth in specific departments
    return [];
  }

  private async detectEmployeeGrowthEvents(companyId: number, timeframe: string): Promise<TriggerEvent[]> {
    // Implementation would check employees_count_change and department-specific growth
    return [];
  }

  private async analyzeCompetitors(companyData: any): Promise<CompetitiveIntelligence['competitors']> {
    // Implementation would use competitors field and analyze competitive positioning
    return [];
  }

  private async analyzeTalentFlow(companyData: any): Promise<CompetitiveIntelligence['talentFlow']> {
    // Implementation would use top_previous_companies and top_next_companies
    return {
      topSourceCompanies: [],
      topDestinationCompanies: []
    };
  }

  private async determineMarketPosition(companyData: any): Promise<CompetitiveIntelligence['marketPosition']> {
    // Implementation would analyze market position based on various metrics
    return {
      rank: 0,
      totalMarketSize: 0
    };
  }

  private buildOrgChart(stakeholders: any[]): any {
    // Build organizational chart from stakeholder data
    return {};
  }

  private groupStakeholdersByRole(stakeholders: any[]): Record<string, number> {
    return stakeholders.reduce((acc, stakeholder) => {
      const role = stakeholder.role.name;
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});
  }

  private async analyzeGrowthSignals(company: any): Promise<string[]> {
    const signals = [];
    
    // Check employee growth
    if (company.employees_count_change?.change_quarterly > 0) {
      signals.push(`Growing team: +${company.employees_count_change.change_quarterly} employees this quarter`);
    }

    // Check funding
    if (company.last_funding_round_announced_date) {
      const fundingDate = new Date(company.last_funding_round_announced_date);
      const monthsAgo = (Date.now() - fundingDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (monthsAgo < 12) {
        signals.push(`Recent funding: $${company.last_funding_round_amount_raised?.toLocaleString()} raised ${Math.round(monthsAgo)} months ago`);
      }
    }

    // Check job postings
    if (company.active_job_postings_count > 0) {
      signals.push(`Active hiring: ${company.active_job_postings_count} open positions`);
    }

    return signals;
  }

  private calculateGrowthScore(company: any): number {
    // Implementation would analyze various growth metrics
    return 75; // Mock score
  }

  private calculateFundingScore(company: any): number {
    // Implementation would analyze funding history and recent rounds
    return 80; // Mock score
  }

  private calculateTurnoverScore(company: any): number {
    // Implementation would analyze executive turnover rates
    return 60; // Mock score
  }

  private calculateSatisfactionScore(company: any): number {
    // Implementation would analyze employee review scores
    return 70; // Mock score
  }

  private calculateTechScore(company: any): number {
    // Implementation would analyze technology adoption
    return 85; // Mock score
  }

  private generateScoreReasoning(company: any, score: number): string[] {
    // Generate human-readable reasoning for the score
    return [
      `Company shows strong growth indicators`,
      `Recent funding activity suggests expansion`,
      `Technology adoption aligns with market trends`
    ];
  }

  private getGrowthBasedActions(signals: string[]): string[] {
    // Generate recommended actions based on growth signals
    return [
      'Schedule discovery call to understand expansion plans',
      'Research recent funding use cases',
      'Connect with hiring managers in growing departments'
    ];
  }
}

// Predefined workflow templates for common sales scenarios
export const SALES_WORKFLOW_TEMPLATES = {
  ACCOUNT_PRIORITIZATION: {
    name: 'Account Prioritization',
    description: 'Score and rank accounts based on growth, funding, and opportunity signals',
    defaultConfig: {
      scoringWeights: {
        growth: 0.3,
        funding: 0.25,
        executiveTurnover: 0.15,
        employeeSatisfaction: 0.15,
        technographics: 0.15
      }
    }
  },
  
  TRIGGER_MONITORING: {
    name: 'Trigger Event Monitoring',
    description: 'Monitor target accounts for executive changes, funding, and growth signals',
    defaultConfig: {
      checkIntervalHours: 24,
      enableRealTimeAlerts: true
    }
  },
  
  COMPETITIVE_ANALYSIS: {
    name: 'Competitive Intelligence',
    description: 'Analyze competitive landscape and positioning',
    defaultConfig: {
      includeMarketShare: true,
      analyzeTalentFlow: true
    }
  },
  
  STAKEHOLDER_MAPPING: {
    name: 'Stakeholder Mapping',
    description: 'Identify and map decision makers at target accounts',
    defaultConfig: {
      roles: ['CEO', 'CFO', 'CRO', 'VP_SALES', 'VP_MARKETING'],
      minConfidenceScore: 80
    }
  }
};
