/**
 * 🧠 INTELLIGENCE PLATFORM TYPES
 * 
 * Core type definitions for the adaptive intelligence system
 */

// ===== CORE INTERFACES =====

export interface ResearchRequest {
  accounts: AccountInput[];
  targetRoles: ExecutiveRole[];
  researchDepth: ResearchDepth;
  maxCostPerAccount?: number;
  urgency: ResearchUrgency;
  userId: string;
  workspaceId: string;
}

export interface ResearchResult {
  sessionId: string;
  executives: ExecutiveContact[];
  totalCost: number;
  processingTimeMs: number;
  confidence: number;
  researchMethods: string[];
  buyerGroupAnalysis?: BuyerGroupInsight;
  errors?: ResearchError[];
}

export interface AccountInput {
  id?: string;
  name: string;
  website?: string;
  domain?: string;
  industry?: string;
  accountType?: string;
  importance?: AccountImportance;
  metadata?: Record<string, any>;
}

export interface ExecutiveContact {
  id: string;
  accountId: string;
  name: string;
  title: string;
  role: ExecutiveRole;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  confidenceScore: number; // 0-100
  researchMethods: string[];
  lastVerified: Date;
  isCurrent: boolean;
  selectionReasoning?: string;
  buyerGroupReasoning?: string; // Why they're assigned to specific buyer group role
}

// ===== ENUMS & TYPES =====

export type ResearchDepth = 'auto' | 'quick' | 'thorough' | 'comprehensive';

export type ResearchUrgency = 'realtime' | 'batch' | 'background';

export type ExecutiveRole = 
  | 'CFO' | 'CRO' | 'CEO' | 'CTO' | 'COO' | 'CMO' 
  | 'VP_Finance' | 'VP_Sales' | 'VP_Engineering' | 'VP_Marketing'
  | 'Director_Finance' | 'Director_Sales' | 'Head_of_Sales'
  | 'Controller' | 'Treasurer' | 'Decision_Maker' | 'Buyer' | 'Influencer';

export type AccountImportance = 'strategic' | 'high_value' | 'standard' | 'prospect';

// ===== RESEARCH PLANNING =====

export interface ResearchPlan {
  stages: ResearchStage[];
  estimatedCost: number;
  estimatedTimeMs: number;
  confidence: number;
  reasoning: string;
}

export interface ResearchStage {
  name: string;
  modules: string[];
  apis: string[];
  estimatedCost: number;
  estimatedTimeMs: number;
  priority: number;
}

// ===== API CONFIGURATION =====

export interface APIConfig {
  PERPLEXITY_API_KEY?: string;
  OPENAI_API_KEY?: string;
  CORESIGNAL_API_KEY?: string;
  LUSHA_API_KEY?: string;
  ZEROBOUNCE_API_KEY?: string;
  PROSPEO_API_KEY?: string;
  MYEMAILVERIFIER_API_KEY?: string;
  
  // Rate limits (requests per minute)
  RATE_LIMITS: {
    prospeo: number;
    coresignal: number;
    lusha: number;
    zerobounce: number;
    openai: number;
    perplexity: number;
  };
  
  // Processing limits
  MAX_PARALLEL_COMPANIES: number;
  MAX_PARALLEL_APIS: number;
  TIMEOUT_MS: number;
  CACHE_TTL_SECONDS: number;
}

// ===== BUYER GROUP ANALYSIS =====

export interface BuyerGroupInsight {
  // Core MEDDIC roles
  decisionMaker?: ExecutiveContact;    // Economic Buyer (budget authority)
  champion?: ExecutiveContact;         // Internal advocate
  influencers: ExecutiveContact[];     // Technical buyers & advisors
  stakeholders: ExecutiveContact[];    // End users affected by decision
  introducers: ExecutiveContact[];     // Can provide access & warm intros
  blockers: ExecutiveContact[];        // Can delay/prevent decisions
  
  // Business intelligence
  budgetAuthority: string;             // Who has spending power
  decisionStyle: string;               // How they make decisions
  salesCycleEstimate: string;          // Expected timeline
  routingStrategy: string[];           // How to approach
  
  // Context intelligence  
  painPoints: string[];                // What hurts them
  economicImpact: string;              // ROI and business case
  competitiveContext: string;          // Market position
  implementationFactors: string[];     // Decision criteria
  
  // Outcome prediction
  closeDate?: string;                  // AI-predicted close
  probability: number;                 // Success likelihood
  nextActions: string[];               // Clear next steps
  
  confidence: number;
}

// ===== ERROR HANDLING =====

export interface ResearchError {
  code: string;
  message: string;
  accountId?: string;
  module: string;
  retryable: boolean;
  timestamp: Date;
}

// ===== CACHING =====

export interface CacheEntry {
  key: string;
  data: any;
  ttl: number;
  createdAt: Date;
  source: string;
}

// ===== RESEARCH SESSION =====

export interface ResearchSession {
  id: string;
  accountIds: string[];
  targetRoles: ExecutiveRole[];
  researchDepth: ResearchDepth;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  totalCost: number;
  executivesFound: number;
  confidenceAvg: number;
  processingTimeMs: number;
  userId: string;
  workspaceId: string;
  createdAt: Date;
  completedAt?: Date;
  errors?: ResearchError[];
}

// ===== COST TRACKING =====

export interface CostBreakdown {
  perplexity: number;
  coresignal: number;
  lusha: number;
  prospeo: number;
  zerobounce: number;
  total: number;
  currency: string;
}

// ===== VALIDATION =====

export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  issues: string[];
  recommendations: string[];
}

// ===== COMPANY INTELLIGENCE =====

export interface CompanyIntelligence {
  name: string;
  domain: string;
  industry?: string;
  size?: string;
  revenue?: string;
  location?: string;
  operationalStatus: 'active' | 'acquired' | 'merged' | 'inactive';
  parentCompany?: string;
  acquisitionDate?: Date;
  confidence: number;
}

// ===== EXPORT UTILITIES =====

export const DEFAULT_API_CONFIG: APIConfig = {
  RATE_LIMITS: {
    prospeo: 60,
    coresignal: 100,
    lusha: 200,
    zerobounce: 100,
    openai: 50,
    perplexity: 60
  },
  MAX_PARALLEL_COMPANIES: 10,
  MAX_PARALLEL_APIS: 5,
  TIMEOUT_MS: 30000,
  CACHE_TTL_SECONDS: 3600
};

export const EXECUTIVE_ROLE_HIERARCHY: Record<ExecutiveRole, number> = {
  'CEO': 1,
  'CFO': 2,
  'CRO': 2,
  'CTO': 2,
  'COO': 2,
  'CMO': 2,
  'VP_Finance': 3,
  'VP_Sales': 3,
  'VP_Engineering': 3,
  'VP_Marketing': 3,
  'Director_Finance': 4,
  'Director_Sales': 4,
  'Head_of_Sales': 4,
  'Controller': 5,
  'Treasurer': 5,
  'Decision_Maker': 2,
  'Buyer': 3,
  'Influencer': 4
};
