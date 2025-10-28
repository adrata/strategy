/**
 * BUYER GROUP V2 TYPES
 * 
 * Comprehensive TypeScript types for the new buyer group system
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export interface CompanyInfo {
  id?: string;
  name: string;
  website?: string;
  industry?: string;
  size?: string;
  location?: string;
  coresignalId?: string;
}

export interface SellerProfile {
  solutionCategory?: 'platform' | 'revenue_technology' | 'operations' | 'security';
  targetMarket?: string;
  companySize?: string;
  industry?: string;
  geography?: string;
}

export type EnrichmentLevel = 'identify' | 'enrich' | 'deep_research';

export type BuyerGroupRole = 'decision_maker' | 'champion' | 'stakeholder' | 'blocker' | 'introducer';

export interface BuyerGroupMember {
  name: string;
  title: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  department?: string;
  role: BuyerGroupRole;
  confidence: number;
  influenceScore: number;
  priority: number;
  coresignalId?: string;
}

export interface BuyerGroupComposition {
  decision_maker: number;
  champion: number;
  stakeholder: number;
  blocker: number;
  introducer: number;
  total: number;
}

export interface QualityMetrics {
  coverage: 'excellent' | 'good' | 'fair' | 'limited';
  confidence: number;
  dataQuality: number;
  overallScore: number;
}

export interface AccuracyMetrics {
  coreMemberAccuracy: number;
  roleAssignmentAccuracy: number;
  relevanceScore: number;
  dataQuality: number;
  consistency: number;
  completeness: number;
  timeliness: number;
  overallScore: number;
}

export interface CreditsUsed {
  preview: number;
  fullProfiles: number;
  search?: number;
  collect?: number;
}

// ============================================================================
// BUYER GROUP DISCOVERY TYPES
// ============================================================================

export interface BuyerGroupDiscoveryOptions {
  companyName?: string;
  companyId?: string;
  companyLinkedInUrl?: string;
  workspaceId: string;
  enrichmentLevel?: EnrichmentLevel;
  sellerProfile?: SellerProfile;
}

export interface BuyerGroupResult {
  success: boolean;
  company: CompanyInfo;
  buyerGroup: BuyerGroupMember[];
  composition: BuyerGroupComposition;
  qualityMetrics: QualityMetrics;
  processingTime: number;
  creditsUsed: CreditsUsed;
  accuracyMetrics?: AccuracyMetrics;
  validationResults?: any;
}

// ============================================================================
// OPTIMAL BUYER FINDER TYPES
// ============================================================================

export interface OptimalBuyerOptions {
  industries: string[];
  sizeRange?: string;
  locations?: string[];
  minGrowthRate?: number;
  maxResults?: number;
  minReadinessScore?: number;
  enableBuyerGroupSampling?: boolean;
  employeeSampleSize?: number;
  sampleDepartments?: string[];
  workspaceId: string;
}

export interface BuyerGroupQuality {
  painSignalScore: number;
  innovationScore: number;
  buyerExperienceScore: number;
  buyerGroupStructureScore: number;
  employeesAnalyzed: number;
  reasoning?: string;
}

export interface OptimalCompany {
  company: CompanyInfo;
  readinessScore: number;
  painSignalScore: number;
  innovationScore: number;
  buyerExperienceScore: number;
  buyerGroupStructureScore: number;
  ranking: number;
  buyerGroupQuality?: BuyerGroupQuality;
}

export interface OptimalBuyerResult {
  success: boolean;
  companies: OptimalCompany[];
  processingTime: number;
  creditsUsed: CreditsUsed;
}

// ============================================================================
// COMPANY ENRICHER TYPES
// ============================================================================

export interface CompanyEnrichmentOptions {
  companyId?: string;
  companyName?: string;
  website?: string;
  workspaceId: string;
}

export interface EnrichedCompanyData {
  coresignalId: string;
  name: string;
  website?: string;
  industry?: string;
  size?: string;
  location?: string;
  description?: string;
  foundedYear?: number;
  revenue?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
  technologies?: string[];
  specialties?: string[];
  headquarters?: any;
  offices?: any[];
  socialMedia?: Record<string, any>;
  customFields?: Record<string, any>;
}

export interface CompanyEnrichmentResult {
  success: boolean;
  enrichedData?: EnrichedCompanyData;
  message?: string;
  creditsUsed: CreditsUsed;
}

// ============================================================================
// PERSON ENRICHER TYPES
// ============================================================================

export interface PersonEnrichmentOptions {
  personId?: string;
  email?: string;
  linkedinUrl?: string;
  workspaceId: string;
}

export interface EnrichedPersonData {
  coresignalId: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  jobTitle?: string;
  department?: string;
  seniorityLevel?: string;
  companyName?: string;
  companyId?: string;
  location?: string;
  profilePicture?: string;
  summary?: string;
  experience?: any[];
  education?: any[];
  skills?: string[];
  languages?: string[];
  certifications?: any[];
  publications?: any[];
  awards?: any[];
  volunteerExperience?: any[];
  recommendations?: any[];
  connections?: number;
  followers?: number;
  customFields?: Record<string, any>;
}

export interface PersonEnrichmentResult {
  success: boolean;
  enrichedData?: EnrichedPersonData;
  message?: string;
  creditsUsed: CreditsUsed;
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

export interface WebhookEvent {
  id: string;
  type: string;
  timestamp: string;
  data: any;
  subscription_id: string;
}

export interface WebhookSubscription {
  id: string;
  webhook_url: string;
  event_types: string[];
  criteria: any;
  active: boolean;
  created_at: string;
}

// ============================================================================
// AI CHAT TOOL TYPES
// ============================================================================

export interface RoleQueryOptions {
  query?: string;
  companyName?: string;
  companyId?: string;
  role?: string;
  department?: string;
  maxResults?: number;
}

export interface RoleQueryResult {
  success: boolean;
  company: string;
  role: string;
  department: string;
  people: EnrichedPersonData[];
  buyerGroupAnalysis?: {
    totalMembers: number;
    composition: BuyerGroupComposition;
    qualityScore: number;
  };
  creditsUsed: CreditsUsed;
  message?: string;
  timestamp: string;
}

// ============================================================================
// DATABASE TYPES
// ============================================================================

export interface BuyerGroup {
  id: string;
  companyId: string;
  workspaceId: string;
  status: 'active' | 'inactive' | 'archived';
  enrichmentLevel: EnrichmentLevel;
  totalMembers: number;
  composition: BuyerGroupComposition;
  qualityMetrics: QualityMetrics;
  customFields?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface BuyerGroupMember {
  id: string;
  buyerGroupId: string;
  coresignalId?: string;
  name: string;
  title: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  department?: string;
  seniorityLevel?: string;
  location?: string;
  profilePicture?: string;
  summary?: string;
  experience?: any[];
  skills?: string[];
  role: BuyerGroupRole;
  confidence: number;
  influenceScore: number;
  priority: number;
  customFields?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
  timestamp?: string;
}

export interface BuyerGroupApiResponse {
  success: boolean;
  company: CompanyInfo;
  buyerGroup: {
    totalMembers: number;
    composition: BuyerGroupComposition;
    members: BuyerGroupMember[];
  };
  quality: QualityMetrics;
  processingTime: number;
  creditsUsed: CreditsUsed;
  databaseId?: string;
  timestamp: string;
}

export interface OptimalBuyerApiResponse {
  success: boolean;
  companies: OptimalCompany[];
  processingTime: number;
  creditsUsed: CreditsUsed;
  timestamp: string;
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface BuyerGroupConfig {
  adaptiveSizing: Record<string, {
    min: number;
    max: number;
    departments: number;
  }>;
  validationWeights: {
    aiClassification: number;
    ruleBasedClassification: number;
    linkedInVerification: number;
    organizationalContext: number;
  };
  relevanceCategories: Record<string, {
    targetDepartments: string[];
    keyTitles: string[];
    relevanceWeight: number;
  }>;
  processingSettings: {
    delayBetweenRequests: number;
    delayBetweenBatches: number;
    batchSize: number;
    maxPreviewPages: number;
    previewPageSize: number;
  };
}

export interface OptimalBuyerConfig {
  scoringWeights: {
    firmographicFit: number;
    growthSignals: number;
    technologyAdoption: number;
    adoptionMaturity: number;
    buyerGroupQuality: number;
  };
  samplingConfig: {
    employeeSampleSize: number;
    sampleDepartments: string[];
  };
  processingSettings: {
    delayBetweenRequests: number;
    delayBetweenBatches: number;
    batchSize: number;
  };
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface BuyerGroupError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ProcessingError {
  step: string;
  error: string;
  retryable: boolean;
  timestamp: string;
}