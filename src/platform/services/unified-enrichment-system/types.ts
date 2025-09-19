/**
 * 🎯 UNIFIED ENRICHMENT SYSTEM TYPES
 * 
 * Complete type definitions for the unified enrichment system
 */

export interface SellerProfile {
  productName: string;
  sellerCompanyName: string;
  solutionCategory: 'revenue_technology' | 'security' | 'infrastructure' | 'analytics' | 'platform' | 'operations' | 'marketing' | 'hr' | 'finance' | 'legal' | 'custom';
  customSolutionCategory?: string;
  targetMarket: 'smb' | 'mid_market' | 'enterprise' | 'all';
  
  buyingCenter: 'executive' | 'technical' | 'financial' | 'operations' | 'functional' | 'mixed';
  decisionLevel: 'manager' | 'director' | 'vp' | 'c_suite' | 'mixed';
  rolePriorities: {
    decision: string[];
    champion: string[];
    stakeholder: string[];
    blocker: string[];
    introducer: string[];
  };
  
  mustHaveTitles: string[];
  adjacentFunctions: string[];
  disqualifiers: string[];
  geo: string[];
  dealSize: 'small' | 'medium' | 'large' | 'enterprise';
  
  productCriticality?: 'mission_critical' | 'important' | 'nice_to_have';
  integrationDepth?: 'deep' | 'moderate' | 'light' | 'standalone';
  dataSensitivity?: 'high' | 'medium' | 'low';
  deploymentModel?: 'saas' | 'on_premise' | 'hybrid';
  buyingGovernance?: 'enterprise' | 'structured' | 'agile' | 'startup';
  
  primaryPainPoints?: string[];
  targetDepartments?: string[];
  competitiveThreats?: string[];
  keyIntegrations?: string[];
  complianceRequirements?: string[];
}

export interface PersonProfile {
  id: number;
  name: string;
  title: string;
  department: string;
  company: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  influenceScore: number;
  seniorityLevel: 'C-Level' | 'VP' | 'Director' | 'Manager' | 'IC';
  managementLevel: string;
  tenure: number;
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
  confidence?: number;
  cohesion?: {
    score: number;
    level: string;
  };
  metadata: {
    generatedAt: string;
    costInCredits: number;
  };
}

export interface IntelligenceReport {
  companyName: string;
  buyerGroup: BuyerGroup;
  companyIntelligence: any;
  confidence: number;
  metadata: {
    generatedAt: string;
    costInCredits: number;
    processingTime: number;
  };
}

export interface BuyerGroupRole {
  personId: number;
  role: 'decision' | 'champion' | 'stakeholder' | 'blocker' | 'introducer';
  score: number;
  confidence: number;
  rationale: string[];
  rank?: number;
  isLead?: boolean;
  importanceScore?: number;
}

export interface CompanyProfile {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  size?: string;
  revenue?: number;
  coreSignalId?: number;
}

export interface IntelligenceReport {
  companyName: string;
  buyerGroup: BuyerGroup;
  companyIntelligence: any;
  confidence: number;
  metadata: {
    generatedAt: string;
    costInCredits: number;
    processingTime: number;
  };
}

// Employment verification types
export interface EmploymentVerificationResult {
  isCurrentlyEmployed: boolean;
  confidence: number;
  dataAge: number;
  verificationMethod: 'recent_data' | 'coresignal' | 'perplexity' | 'multi_source' | 'failed';
  lastVerified: Date;
  employmentDetails?: {
    currentTitle?: string;
    startDate?: string;
    endDate?: string;
    verificationSources: string[];
  };
  warnings?: string[];
}

// Person lookup types
export interface PersonLookupContext {
  industry?: string;
  vertical?: string;
  companyContext?: string;
  roleContext?: string;
  geography?: string;
  workspaceId: string;
  sellerProfile?: SellerProfile;
}

export interface PersonLookupResult {
  type: 'single_match' | 'disambiguation_required' | 'external_search' | 'not_found';
  person?: any;
  candidates?: PersonCandidate[];
  confidence?: number;
  reasoning?: string[];
  suggestions?: string[];
}

export interface PersonCandidate {
  person: any;
  contextScore: number;
  employmentVerification: EmploymentVerificationResult;
  relevanceFactors: {
    industryMatch: number;
    companyMatch: number;
    roleMatch: number;
    geographyMatch: number;
    employmentCurrency: number;
  };
}

// Technology search types
export interface TechnologySearchContext {
  industry?: string;
  companySize?: string;
  geography?: string;
  experienceLevel?: 'junior' | 'mid' | 'senior' | 'lead' | 'principal';
  workspaceId: string;
}

export interface TechnologySearchResult {
  technology: string;
  role: string;
  totalFound: number;
  qualifiedCandidates: number;
  results: TechnologyCandidate[];
}

export interface TechnologyCandidate {
  person: PersonProfile;
  technologyRelevance: {
    score: number;
    matchedSkills: string[];
    experienceLevel: string;
    yearsExperience: number;
  };
  employmentVerification: EmploymentVerificationResult;
  overallFit: number;
}

// Buyer group relevance types
export interface BuyerGroupRelevanceResult {
  isRelevant: boolean;
  relevanceScore: number;
  reasoning: string[];
  productFit: ProductFitResult;
  companyFit: CompanyFitResult;
  authorityFit: AuthorityFitResult;
  recommendations: string[];
}

export interface ProductFitResult {
  directUser: boolean;
  influencer: boolean;
  budgetAuthority: boolean;
  technicalStakeholder: boolean;
  score: number;
}

export interface CompanyFitResult {
  sizeAppropriate: boolean;
  industryMatch: boolean;
  maturityLevel: boolean;
  score: number;
}

export interface AuthorityFitResult {
  hasDecisionAuthority: boolean;
  hasInfluence: boolean;
  hasBudgetControl: boolean;
  hasVetopower: boolean;
  score: number;
}
