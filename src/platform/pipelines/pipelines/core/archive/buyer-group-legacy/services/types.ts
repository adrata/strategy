/**
 * 🎯 BUYER GROUP INTELLIGENCE TYPES
 * 
 * Centralized type definitions for the buyer group intelligence system
 */

export interface SellerProfile {
  // Core Product Information
  productName: string;
  sellerCompanyName: string; // The company selling the product
  solutionCategory: 'revenue_technology' | 'security' | 'infrastructure' | 'analytics' | 'platform' | 'operations' | 'marketing' | 'hr' | 'finance' | 'legal' | 'custom';
  customSolutionCategory?: string; // For solutionCategory: 'custom'
  targetMarket: 'smb' | 'mid_market' | 'enterprise' | 'all'; // Market segment focus
  
  // Buyer Group Configuration
  buyingCenter: 'executive' | 'technical' | 'financial' | 'operations' | 'functional' | 'mixed';
  decisionLevel: 'manager' | 'director' | 'vp' | 'c_suite' | 'mixed';
  rolePriorities: {
    decision: string[];
    champion: string[];
    stakeholder: string[];
    blocker: string[];
    introducer: string[];
  };
  
  // Solution Context
  mustHaveTitles: string[];
  adjacentFunctions: string[];
  disqualifiers: string[];
  geo: string[];
  dealSize: 'small' | 'medium' | 'large' | 'enterprise';
  
  // Adaptive Intelligence Variables
  productCriticality?: 'mission_critical' | 'important' | 'nice_to_have';
  integrationDepth?: 'deep' | 'moderate' | 'light' | 'standalone';
  dataSensitivity?: 'high' | 'medium' | 'low';
  deploymentModel?: 'saas' | 'on_premise' | 'hybrid';
  buyingGovernance?: 'enterprise' | 'structured' | 'agile' | 'startup';
  securityGateLevel?: 'high' | 'medium' | 'low';
  procurementMaturity?: 'mature' | 'developing' | 'minimal';
  vendorConsolidation?: 'strict' | 'preferred' | 'flexible';
  decisionStyle?: 'consensus' | 'executive' | 'technical' | 'committee';
  
  // Universal Adaptability
  primaryPainPoints?: string[]; // What problems does this product solve?
  targetDepartments?: string[]; // Which departments primarily use this?
  competitiveThreats?: string[]; // Who might block this sale?
  keyIntegrations?: string[]; // What systems does this integrate with?
  complianceRequirements?: string[]; // What compliance standards matter?
}

export interface CoreSignalProfile {
  // Identifiers
  id: number;
  parent_id?: number;
  public_profile_id?: number;
  professional_network_url?: string;
  
  // Employee information
  full_name?: string;
  first_name?: string;
  last_name?: string;
  picture_url?: string;
  connections_count?: number;
  followers_count?: number;
  
  // Location
  location_full?: string;
  location_country?: string;
  location_country_iso2?: string;
  location_country_iso3?: string;
  
  // Active experience overview
  headline?: string;
  summary?: string;
  is_working?: number;
  active_experience_company_id?: number;
  active_experience_title?: string;
  active_experience_department?: string;
  active_experience_management_level?: string;
  is_decision_maker?: number;
  
  // Skills
  inferred_skills?: string[];
  
  // Experience duration
  total_experience_duration_months?: number;
  
  // Full experience information
  experience?: Array<{
    active_experience: number; // 1 = current, 0 = past
    position_title?: string;
    department?: string;
    management_level?: string;
    location?: string;
    date_from?: string;
    date_to?: string;
    duration_months?: number;
    company_id?: number;
    company_name?: string;
    company_type?: string;
    company_industry?: string;
    order_in_profile?: number;
  }>;
  
  // Salary projections
  projected_total_salary_p75?: number;
  projected_total_salary_currency?: string;
  
  // Recent changes
  experience_recently_started?: Array<{
    company_name?: string;
    title?: string;
    identification_date?: string;
  }>;
  
  // Legacy compatibility
  connections?: number;
  followers?: number;
  linkedin_url?: string;
  painIntelligence?: PainIntelligence;
}

export interface PersonProfile {
  id: number;
  name: string;
  title: string;
  department: string;
  managementLevel: string;
  company: string;
  location: string;
  linkedinUrl: string;
  influenceScore: number;
  seniorityLevel: 'IC' | 'Manager' | 'Director' | 'VP' | 'C-Level';
  isAboveTheLine: boolean;
  connections: number;
  currentExperience?: {
    title: string;
    department: string;
    managementLevel: string;
    tenure: number; // months
  };
}

export interface BuyerGroupRole {
  personId: number;
  role: 'decision' | 'champion' | 'stakeholder' | 'blocker' | 'introducer';
  score: number;
  confidence: number;
  rationale: string[];
  // Optional scoring breakdown for defensibility
  scoreBreakdown?: Record<string, number>;
  painIntelligence?: PainIntelligence;
  // Ranking within role type (1 = most important/chief)
  rank?: number;
  isLead?: boolean; // True for the primary person in each role
  importanceScore?: number; // Overall importance to the deal (0-100)
}

export interface PainIntelligence {
  primaryChallenges: Challenge[];
  painScore: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  buyingSignals: BuyingSignal[];
  engagementStrategy: EngagementStrategy;
  lastUpdated: string;
}

export interface Challenge {
  category: 'operational' | 'strategic' | 'technical' | 'financial' | 'competitive';
  description: string;
  confidence: number;
  urgency: number;
  evidence: string[];
  suggestedSolution: string;
}

export interface BuyingSignal {
  type: 'hiring' | 'budget_increase' | 'technology_change' | 'market_pressure' | 'compliance' | 'growth';
  strength: number; // 0-1
  description: string;
  timeframe: string;
  source: string;
}

export interface EngagementStrategy {
  approach: 'consultative' | 'technical' | 'financial' | 'executive';
  messagingAngle: string;
  valueProposition: string;
  urgencyTriggers: string[];
  recommendedTiming: string;
  collateral: string[];
}

export interface BuyerGroup {
  id: string;
  companyName: string;
  totalMembers: number;
  roles: {
    decision: BuyerGroupRole[];
    champion: BuyerGroupRole[];
    stakeholder: BuyerGroupRole[];
    blocker: BuyerGroupRole[];
    introducer: BuyerGroupRole[];
  };
  dynamics: {
    powerDistribution: number;
    consensusLevel: number;
    riskLevel: 'low' | 'medium' | 'high';
    decisionComplexity: number;
  };
  decisionFlow: {
    criticalPath: number[];
    bottlenecks: number[];
    estimatedDuration: number; // days
  };
  flightRisk: Array<{
    personId: number;
    riskLevel: 'CRITICAL' | 'ELEVATED' | 'STABLE' | 'LOW RISK';
    riskScore: number;
    factors: string[];
    mitigation: string[];
  }>;
  opportunitySignals: Array<{
    signal: string;
    strength: number;
    source: string;
    confidence: number;
  }>;
  cohesion?: {
    score: number;
    level: string;
    overallScore: number;
    departmentAlignment: number;
    managementLevelDistribution: number;
    crossFunctionalRep: number;
    primaryBusinessUnit?: string;
    departmentClusters?: any[];
    [key: string]: any; // Allow additional cohesion properties
  };
  metadata: {
    generatedAt: string;
    collectionMethod: string;
    totalCandidates: number;
    finalCount: number;
    costInCredits: number;
  };
}

export interface IntelligenceReport {
  companyName: string;
  sellerProfile: SellerProfile;
  query: any; // Elasticsearch query used
  buyerGroup: BuyerGroup;
  opportunitySignals: Array<{
    type: string;
    strength: number;
    source: string;
    confidence: number;
  }>;
  painIntelligence: {
    aggregatedChallenges: Array<{
      challenge: string;
      frequency: number;
      urgency: number;
      impact: number;
    }>;
    companyWideTrends: string[];
    strategicInitiatives: string[];
    overallPainScore?: number;
    topChallenges?: Array<{
      description: string;
      severity: number;
    }>;
  };
  engagementStrategy: {
    primaryApproach: string;
    sequencing: string[];
    messaging: Record<string, string>;
    riskMitigation: string[];
    timeline?: string;
  };
  enablementAssets?: Array<{
    type: string;
    title: string;
    description: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
  }>;
  recommendations?: Array<{
    type: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    rationale: string;
    category?: string;
    action?: string;
    timeline?: string;
    confidence?: number;
  }>;
  metadata: {
    generatedAt: string;
    version: string;
    creditsUsed: { search: number; collect: number };
    processingTime: number;
    dryRun?: boolean;
    estimatedCredits?: number;
    estimatedCost?: number;
  };
  // Optional defensibility section generated by LLM
  defensibility?: {
    summary: string;
    llmModel?: string;
    roleRationales?: Record<string, string[]>; // personId -> rationale lines
  };
}

export interface PipelineConfig {
  sellerProfile: SellerProfile | string;
  coreSignal: {
    apiKey: string;
    baseUrl: string;
    maxCollects: number;
    batchSize: number;
    useCache: boolean;
    cacheTTL: number; // hours
    dryRun?: boolean; // Estimate costs without API calls
  };
  analysis: {
    minInfluenceScore: number;
    maxBuyerGroupSize: number;
    requireDirector: boolean;
    allowIC: boolean;
    // Optional target range for adaptive buyer group sizing
    targetBuyerGroupRange?: { min: number; max: number };
    // Early stop behavior prioritizing accuracy
    earlyStopMode?: 'off' | 'conservative' | 'aggressive' | 'accuracy_first';
    // Minimum role targets required before early stop
    minRoleTargets?: {
      decision?: number;
      champion?: number;
      stakeholder?: number;
      blocker?: number;
      introducer?: number;
    };
    // Deal size adaptation
    dealSizeBand?: 'small' | 'medium' | 'large' | 'enterprise';
    // Adaptive scoring weights based on context
    adaptiveWeights?: {
      decisionMakerBoost?: number; // Extra weight for is_decision_maker signal
      salaryAuthorityThreshold?: number; // Minimum salary for budget authority
      securityGateWeight?: number; // Weight for security/compliance roles
      procurementWeight?: number; // Weight for procurement involvement
      networkInfluenceWeight?: number; // Weight for high connection counts
    };
  };
  output: {
    format: 'json' | 'csv' | 'both';
    includeFlightRisk: boolean;
    includeDecisionFlow: boolean;
    generatePlaybooks: boolean;
  };
  // Optional LLM augmentation configuration
  llm?: LLMConfig;
  // Optional company aliases for exact matching
  targetCompanyAliases?: string[];
  // Enforce exact current-company matching against target + aliases
  enforceExactCompany?: boolean;
}

export interface LLMConfig {
  enabled: boolean;
  provider: 'openai';
  model: string; // e.g., 'gpt-4o-mini'
  maxTokens?: number;
  temperature?: number;
}

// 🕸️ Network Cohesion Analysis Types
export interface NetworkMapping {
  personId: string;
  connections: string[];
  influenceScore: number;
  authorityLevel: 'low' | 'medium' | 'high' | 'executive';
}

export interface InfluenceRanking {
  personId: string;
  name: string;
  role: string;
  influenceScore: number;
  authorityScore: number;
  networkConnections: number;
  isTopInfluencer: boolean;
  rationale: string[];
}
