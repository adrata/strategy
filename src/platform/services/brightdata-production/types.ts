// BrightData Production Service Types

export interface BrightDataOptions {
  useCache?: boolean;
  cacheTTL?: number; // milliseconds
  maxResults?: number;
  includeIndustryIntelligence?: boolean;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  cost: number;
  accessCount: number;
}

export interface CompanyEnrichmentData {
  id: string;
  name: string;
  industry: string;
  industryClassification?: Array<{
    industryId: string;
    confidence: number;
    reasoning: string;
  }>;
  marketIntelligence?: any;
  size: string;
  website?: string;
  linkedinUrl?: string;
  employees: number;
  foundedYear?: number;
  funding?: string;
  location: string;
  revenue?: string;
  description?: string;
  technologies?: string[];
  keyExecutives?: Array<{
    name: string;
    title: string;
    linkedinUrl?: string;
  }>;
  recentNews?: Array<{
    title: string;
    date: string;
    source: string;
    url: string;
  }>;
  financialHealth?: {
    score: number;
    indicators: string[];
  };
  growthSignals?: string[];
}

export interface PersonEnrichmentData {
  id: string;
  name: string;
  title: string;
  email?: string;
  linkedinUrl?: string;
  companyId: string;
  company: string;
  department: string;
  seniority: string;
  location?: string;
  experience?: Array<{
    company: string;
    title: string;
    duration: string;
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    field: string;
  }>;
  skills?: string[];
  connections?: number;
  recentActivity?: Array<{
    type: string;
    description: string;
    date: string;
  }>;
}

export interface CompanySearchFilters {
  industries?: string[];
  companySize?: string[];
  location?: string[];
  revenue?: string;
  employees?: { min?: number; max?: number };
}

export interface PeopleSearchFilters {
  departments?: string[];
  seniorities?: string[];
  titles?: string[];
}

export interface BuyerCriteria {
  industries?: string[];
  company_size?: string[];
  revenue?: string;
  location?: string[];
  technologies?: string[];
  intent_signals?: boolean;
  growth_indicators?: boolean;
}

export interface SnapshotConfig {
  dataset: "companies" | "people" | "enrichment";
  filters: any;
  format?: "json" | "csv";
}

export interface SnapshotResult {
  data: any[];
  status: string;
  totalRecords: number;
}

export interface CostStatistics {
  totalCost: number;
  totalSavings: number;
  cacheHitRate: number;
  cachedEntries: number;
  averageCostPerRequest: number;
}

export interface CostTracker {
  totalCost: number;
  savings: number;
  requestCount: number;
  cacheHits: number;
}
