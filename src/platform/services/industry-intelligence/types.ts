// Industry Intelligence Types - Extracted from 1,309-line monolithic industry-intelligence.ts

export interface IndustryDefinition {
  id: string;
  name: string;
  sector: string;
  vertical: string;
  market: string;
  naicsCode?: string;
  sicCode?: string;
  description: string;
  marketSize: string; // e.g., "$500B globally"
  growthRate: number; // Annual growth rate as decimal
  maturity: "emerging" | "growth" | "mature" | "declining" | "transforming";
  cyclicality: "cyclical" | "counter-cyclical" | "non-cyclical";
  keyPlayers: string[];
  technologies: string[];
  buyingPatterns: {
    avgSalesCycle: string;
    decisionMakers: string[];
    budgetSeason: string[];
    pricesensitivity: "low" | "medium" | "high";
  };
  painPoints: string[];
  opportunities: string[];
  competitiveFactors: string[];
  regulatoryEnvironment: {
    complexity: "low" | "medium" | "high" | "extreme";
    keyRegulations: string[];
    complianceRequirements: string[];
  };
  intelligence: {
    keyTrends: string[];
    disruptors: string[];
    futureOutlook: string;
    investmentFocus: string[];
  };
}

export interface MarketSegment {
  id: string;
  name: string;
  industries: string[];
  characteristics: {
    size: string;
    growth: number;
    competitiveness: "low" | "medium" | "high";
    innovationRate: "slow" | "moderate" | "rapid";
  };
  buyerBehavior: {
    preferredChannels: string[];
    evaluationCriteria: string[];
    typicalBudget: string;
  };
}

export interface CompanyData {
  name: string;
  description?: string;
  website?: string;
  industry?: string;
  keywords?: string[];
}

export interface CompanyClassification {
  industryId: string;
  confidence: number;
  reasoning: string;
}

export interface SearchCriteria {
  sector?: string;
  vertical?: string;
  market?: string;
  maturity?: string;
  growthRate?: { min?: number; max?: number };
  marketSize?: string;
}

export interface MarketIntelligence {
  industryId: string;
  overview: {
    marketSize: string;
    growthRate: number;
    maturity: string;
    cyclicality: string;
  };
  competitiveLandscape: {
    competitionLevel: "low" | "medium" | "high";
    keyPlayers: string[];
    marketLeaders: string[];
    barriers: string[];
    differentiators: string[];
  };
  trends: {
    current: string[];
    emerging: string[];
    disruptors: string[];
  };
  opportunities: {
    immediate: string[];
    longTerm: string[];
    riskFactors: string[];
  };
  buyingBehavior: {
    decisionMakers: string[];
    salesCycle: string;
    budgetSeason: string[];
    painPoints: string[];
  };
  regulatory: {
    complexity: string;
    keyRegulations: string[];
    complianceRequirements: string[];
  };
  intelligence: {
    keyInsights: string[];
    futureOutlook: string;
    investmentFocus: string[];
    recommendations: string[];
  };
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export interface IndustrySearchResult {
  industry: IndustryDefinition;
  relevanceScore: number;
  matchedFields: string[];
}

// Service configuration
export interface IndustryIntelligenceConfig {
  cacheEnabled: boolean;
  cacheTTL: number; // milliseconds
  aiClassificationEnabled: boolean;
  fallbackToBasic: boolean;
}
