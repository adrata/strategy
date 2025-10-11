/**
 * 🚀 COMPANY INTELLIGENCE ENGINE
 * Leverages CoreSignal's Historical Headcount API and Multi-source Company API
 * for advanced pain intelligence and company change detection
 */

import { CoreSignalClient } from './coresignal-client';

export interface HistoricalHeadcountData {
  created: string;
  company_id: number;
  headcount: number;
  follower_count: number;
  size: string;
  industry: string;
  location: string;
  country: string;
}

export interface CompanyData {
  id: number;
  company_name: string;
  industry: string;
  naics_codes: string[];
  sic_codes: string[];
  founded_year: string;
  size_range: string;
  employees_count: number;
  hq_country: string;
  hq_region: string[];
  revenue_annual_range?: {
    source_4_annual_revenue_range?: {
      annual_revenue_range_from: number;
      annual_revenue_range_to: number;
      annual_revenue_range_currency: string;
    };
  };
  employees_count_change?: {
    current: number;
    change_monthly: number;
    change_monthly_percentage: number;
    change_quarterly: number;
    change_quarterly_percentage: number;
    change_yearly: number;
    change_yearly_percentage: number;
  };
  key_executive_departures?: Array<{
    member_full_name: string;
    member_position_title: string;
    departure_date: string;
  }>;
  key_executive_arrivals?: Array<{
    member_full_name: string;
    member_position_title: string;
    arrival_date: string;
  }>;
  active_job_postings_count?: number;
  active_job_postings_count_change?: {
    current: number;
    change_monthly: number;
    change_monthly_percentage: number;
  };
  employee_reviews_score_aggregated_change?: {
    current: number;
    change_monthly: number;
    change_quarterly: number;
    change_yearly: number;
  };
  product_reviews_score_change?: {
    current: number;
    change_monthly: number;
    change_quarterly: number;
    change_yearly: number;
  };
  funding_rounds?: Array<{
    name: string;
    announced_date: string;
    amount_raised: number;
    amount_raised_currency: string;
  }>;
  acquisition_list_source_1?: Array<{
    acquiree_name: string;
    announced_date: string;
    price: string;
    currency: string;
  }>;
}

export interface PainSignal {
  type: 'headcount_decline' | 'executive_departure' | 'hiring_freeze' | 'negative_reviews' | 
        'funding_pressure' | 'competitive_pressure' | 'growth_pressure' | 'operational_stress';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  confidence: number;
  timeframe: 'recent' | 'current' | 'trend';
  impact: string[];
  buyingSignal: boolean;
}

export interface CompanyIntelligence {
  companyId: number;
  companyName: string;
  industry: string;
  naicsCode?: string;
  region: string;
  painSignals: PainSignal[];
  opportunityScore: number;
  urgencyIndicators: string[];
  budgetContext: {
    estimatedRevenue?: number;
    recentFunding?: number;
    growthStage: 'startup' | 'growth' | 'mature' | 'decline';
  };
  changeEvents: {
    headcountTrend: 'growing' | 'stable' | 'declining';
    leadershipChanges: number;
    hiringActivity: 'accelerating' | 'stable' | 'slowing' | 'frozen';
  };
  competitiveContext: {
    marketPosition: 'leader' | 'challenger' | 'follower' | 'niche';
    pressureLevel: 'low' | 'medium' | 'high';
  };
}

export class CompanyIntelligenceEngine {
  constructor(private coreSignalClient: CoreSignalClient) {}

  /**
   * Generate comprehensive company intelligence using all available CoreSignal APIs
   */
  async generateCompanyIntelligence(
    companyName: string,
    companyId?: number
  ): Promise<CompanyIntelligence> {
    try {
      // Step 1: Get company data (multi-source)
      const companyData = await this.getCompanyData(companyName, companyId);
      if (!companyData) {
        throw new Error(`Company data not found for ${companyName}`);
      }

      // Step 2: Get historical headcount data
      const historicalData = await this.getHistoricalHeadcount(companyData.id);

      // Step 3: Analyze pain signals
      const painSignals = this.analyzePainSignals(companyData, historicalData);

      // Step 4: Calculate opportunity score
      const opportunityScore = this.calculateOpportunityScore(painSignals, companyData);

      // Step 5: Generate insights
      const intelligence: CompanyIntelligence = {
        companyId: companyData.id,
        companyName: companyData.company_name,
        industry: companyData.industry,
        naicsCode: companyData.naics_codes?.[0],
        region: this.getRegionFromCountry(companyData.hq_country),
        painSignals,
        opportunityScore,
        urgencyIndicators: this.generateUrgencyIndicators(painSignals, companyData),
        budgetContext: this.analyzeBudgetContext(companyData),
        changeEvents: this.analyzeChangeEvents(companyData, historicalData),
        competitiveContext: this.analyzeCompetitiveContext(companyData)
      };

      return intelligence;

    } catch (error) {
      console.error("Error generating company intelligence:", error);
      throw error;
    }
  }

  /**
   * Get company data using Multi-source Company API
   */
  private async getCompanyData(companyName: string, companyId?: number): Promise<CompanyData | null> {
    try {
      if (companyId) {
        return await this.coreSignalClient.collectCompanyById(companyId);
      } else {
        console.warn("Company ID not provided, using company name search");
        return await this.coreSignalClient.searchCompanies(companyName);
      }
    } catch (error) {
      console.error('Error getting company data:', error);
      return null;
    }
  }
}