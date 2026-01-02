export type TestDriveMode = 'run-1' | 'run-many' | 'pull-intelligence' | 'industry-ranking' | 'industry-comparison';

export interface CompanyInput {
  name?: string;
  website?: string;
  linkedinUrl?: string;
}

export interface TestDriveFormData {
  yourCompany: CompanyInput;
  targetCompany: CompanyInput;
}

export interface RunManyCompanyInput extends CompanyInput {
  id?: string; // For tracking during processing
}

export interface RunManyFormData {
  yourCompany: CompanyInput;
  targetCompanies: RunManyCompanyInput[];
}

export interface BuyerGroupMember {
  name: string;
  title: string;
  role: 'decision_maker' | 'champion' | 'stakeholder' | 'blocker' | 'introducer';
  confidence: number;
  email?: string;
  phone?: string;
  linkedin?: string;
  influenceScore?: number;
}

export interface BuyerGroupResult {
  success: boolean;
  company?: {
    name: string;
    website?: string;
    industry?: string;
  };
  buyerGroup?: {
    totalMembers: number;
    composition?: {
      decisionMakers: number;
      champions: number;
      stakeholders: number;
    };
    members: BuyerGroupMember[];
  };
  qualityMetrics?: {
    overallScore: number;
    averageConfidence: number;
  };
  processingTime?: number;
  error?: string;
}

export interface ProcessingStage {
  id: string;
  label: string;
  completed: boolean;
  inProgress: boolean;
}

export interface RunManyResult {
  company: RunManyCompanyInput;
  result: BuyerGroupResult | null;
  error?: string;
  copied?: boolean; // Track if user has copied this result
}

export interface RunManyResults {
  yourCompany: CompanyInput;
  results: RunManyResult[];
  totalProcessed: number;
  totalSuccessful: number;
  totalFailed: number;
}

// =============================================================================
// PULL Intelligence (OBP) Types
// =============================================================================

export interface PullIntelligenceFormData {
  yourCompany: CompanyInput;
  targetCompany: CompanyInput;
  productContext?: {
    productName?: string;
    problemStatement?: string;
    targetDepartments?: string[];
  };
}

export interface PullChampion {
  name: string;
  title: string;
  tenure: string;
  tenureDays?: number;
  windowRemaining: string | number;
  previousCompany?: string;
  previousTitle?: string;
  urgencyLevel?: number;
  knowledgeLevel?: string;
  insight?: string;
}

export interface PullTension {
  score: number;
  implication: string;
  data?: Record<string, unknown>;
}

export interface PullTensions {
  ratio: PullTension;
  leadership: PullTension & { champions?: number };
  growth: PullTension & { companyGrowth?: number };
  resource: PullTension & { fundingStage?: string };
  reporting: PullTension;
}

export interface PullActionWindow {
  type: string;
  daysRemaining?: number;
  urgency: 'high' | 'moderate' | 'low';
  description: string;
}

export interface PullPredictions {
  buyingProbability: number;
  actionWindow: {
    windows: PullActionWindow[];
    primaryWindow?: PullActionWindow;
    optimalTiming?: string;
  };
  decisionPath?: {
    champion?: string;
    reportsTo?: string;
    budgetAuthority?: string;
    stakeholders?: Array<{
      role: string;
      person: string;
      need?: string;
      objection?: string;
    }>;
  };
  behavioralPatterns?: Array<{
    principle: string;
    description: string;
    application: string;
    tactic: string;
  }>;
}

export interface PullStrategy {
  pitchAngle?: {
    primary?: {
      audience: string;
      message: string;
      format?: string;
    };
    secondary?: Array<{
      audience: string;
      message: string;
      format?: string;
    }>;
    avoid?: string[];
    openingAngle?: string;
  };
  timing?: {
    urgency: 'high' | 'moderate' | 'low';
    daysToAct?: number;
    rationale?: string[];
    bestApproach?: string;
  };
  objections?: Array<{
    source: string;
    objection: string;
    response: string;
  }>;
}

export interface PullIntelligenceResult {
  success: boolean;
  company: string;
  pullScore: number;
  classification: {
    category: 'HIGH_PULL' | 'PULL' | 'HIGH_CONSIDERATION' | 'CONSIDERATION' | 'LOW_PRIORITY' | 'NOT_IN_MARKET';
    description: string;
    score: number;
  };
  executiveSummary?: string;
  champion?: PullChampion;
  tensions: PullTensions;
  predictions?: PullPredictions;
  strategy?: PullStrategy;
  internalDialogue?: string;
  htmlReportUrl?: string;
  analyzedAt: string;
  processingTime?: number;
  error?: string;
}

// =============================================================================
// Industry Ranking (PULL Scan) Types
// =============================================================================

export interface IndustryRankingFormData {
  yourCompany: CompanyInput;
  industry: string;
  employeeRange: { min: number; max: number };
  location?: string;
  maxCompanies: number;
  deepAnalysisCount: number;
}

export interface IndustryRankingCompany {
  rank: number;
  company: string;
  domain?: string;
  coresignalId?: string;
  pullScore: number;
  classification: {
    category: 'HIGH_PULL' | 'PULL' | 'HIGH_CONSIDERATION' | 'CONSIDERATION' | 'LOW_PRIORITY' | 'NOT_IN_MARKET';
    description: string;
  };
  champion?: PullChampion;
  tensions?: PullTensions;
  quickInsight: string;
  analyzed: boolean;
  preScreenFactors?: Array<{
    factor: string;
    impact: number;
    value?: string;
  }>;
}

export interface IndustryRankingResult {
  success: boolean;
  totalScanned: number;
  totalAnalyzed: number;
  rankings: IndustryRankingCompany[];
  costUsed?: {
    coresignalCredits: number;
    claudeTokens: number;
  };
  scanDuration: number;
  error?: string;
}

export interface IndustryRankingProgress {
  stage: 'discovery' | 'collection' | 'pre_screening' | 'deep_analysis' | 'complete';
  totalCompanies: number;
  scanned: number;
  preScreened: number;
  deepAnalyzed: number;
  currentCompany: string | null;
}

// =============================================================================
// Industry Comparison Types
// =============================================================================

export type ComparisonTier = 'pulse' | 'scan' | 'deep';

export interface IndustryComparisonFormData {
  yourCompany: CompanyInput;
  industries: string[];
  tier: ComparisonTier;
  employeeRange?: { min: number; max: number };
  location?: string;
}

export interface IndustryScoreDimension {
  value: string | number;
  score: number;
  weight: number;
  interpretation: string;
}

export interface IndustryScoring {
  totalScore: number;
  dimensions: {
    pullConcentration: IndustryScoreDimension;
    marketSize: IndustryScoreDimension;
    growthRate: IndustryScoreDimension;
    competitiveIntensity: IndustryScoreDimension;
    dealVelocity: IndustryScoreDimension;
    accessibility: IndustryScoreDimension;
    regulatoryPressure: IndustryScoreDimension;
  };
  highPullCompanies: Array<{
    company: string;
    pullScore: number;
    champion: string | null;
  }>;
  companiesScanned: number;
  companiesWithPull: number;
}

export interface IndustryRecommendation {
  action: 'PRIORITIZE' | 'FOCUS' | 'TEST' | 'DEPRIORITIZE';
  priority: number;
  rationale: string;
  insights: string[];
  topTargets: Array<{
    company: string;
    pullScore: number;
    champion: string | null;
  }>;
}

export interface IndustryComparisonResultItem {
  rank: number | null;
  industry: string;
  scoring: IndustryScoring | null;
  recommendation: IndustryRecommendation | null;
  error?: string;
}

export interface IndustryComparisonResult {
  success: boolean;
  tier: string;
  industriesCompared: number;
  results: IndustryComparisonResultItem[];
  topRecommendation: IndustryComparisonResultItem | null;
  comparisonDuration: number;
  estimatedCreditsUsed: number;
  error?: string;
}

