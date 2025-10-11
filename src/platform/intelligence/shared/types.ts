/**
 * SHARED INTELLIGENCE TYPES
 * 
 * Common TypeScript types used across all intelligence modules
 */

// Enrichment Levels
export type EnrichmentLevel = 'identify' | 'enrich' | 'deep_research';

// Buyer Group Role Types
export type BuyerGroupRole = 'decision' | 'champion' | 'stakeholder' | 'blocker' | 'introducer';

// Buyer Group Member
export interface BuyerGroupMember {
  id?: string;
  name: string;
  title: string;
  role: BuyerGroupRole;
  email?: string;
  phone?: string;
  linkedin?: string;
  confidence: number; // 0-100
  influenceScore?: number; // 0-100
  department?: string;
  seniority?: string;
}

// Buyer Group Result
export interface BuyerGroup {
  companyName: string;
  website?: string;
  industry?: string;
  companySize?: string;
  totalMembers: number;
  cohesionScore: number; // 0-10
  overallConfidence: number; // 0-100
  roles: {
    decision: BuyerGroupMember[];
    champion: BuyerGroupMember[];
    stakeholder: BuyerGroupMember[];
    blocker: BuyerGroupMember[];
    introducer: BuyerGroupMember[];
  };
  members: BuyerGroupMember[];
}

// Enrichment Request
export interface EnrichmentRequest {
  companyName: string;
  website?: string;
  enrichmentLevel: EnrichmentLevel;
  workspaceId?: string;
  options?: EnrichmentOptions;
}

// Enrichment Options
export interface EnrichmentOptions {
  includeContacts?: boolean; // Level 2+
  includeIntelligence?: boolean; // Level 3 only
  includeRelationships?: boolean; // Level 3 only
  includeBuyingSignals?: boolean; // Level 3 only
  includeCareerAnalysis?: boolean; // Level 3 only
  saveToDatabase?: boolean; // Default: true
}

// Enrichment Result
export interface EnrichmentResult {
  success: boolean;
  buyerGroup: BuyerGroup;
  enrichmentLevel: EnrichmentLevel;
  processingTime: number;
  costEstimate: number;
  timestamp: string;
  databaseId?: string;
  cacheUtilized: boolean;
  intelligence?: DeepIntelligence; // Only for Level 3
}

// Deep Intelligence (Level 3)
export interface DeepIntelligence {
  careerAnalysis?: CareerAnalysis[];
  relationships?: RelationshipMap;
  buyingSignals?: BuyingSignal[];
  painPoints?: PainPoint[];
  decisionFlow?: DecisionFlow;
}

// Career Analysis
export interface CareerAnalysis {
  personId: string;
  name: string;
  careerTrajectory: 'rising_star' | 'stable' | 'lateral' | 'declining';
  averageTenure: number; // months
  promotionVelocity: number; // promotions per year
  previousCompanies: string[];
  expertise: string[];
  thoughtLeadership: boolean;
}

// Relationship Map
export interface RelationshipMap {
  internalConnections: Connection[];
  externalConnections: Connection[];
  mutualConnections: Connection[];
  warmIntroPaths: IntroPath[];
}

// Connection
export interface Connection {
  from: string;
  to: string;
  type: 'reports_to' | 'colleague' | 'past_colleague' | 'school' | 'mutual';
  strength: number; // 0-100
  context?: string;
}

// Intro Path
export interface IntroPath {
  target: string;
  path: string[];
  strength: number;
  recommendedApproach: string;
}

// Buying Signal
export interface BuyingSignal {
  type: 'funding' | 'hiring' | 'tech_change' | 'leadership_change' | 'expansion' | 'pain_expression';
  description: string;
  date: string;
  strength: number; // 0-100
  source: string;
}

// Pain Point
export interface PainPoint {
  role: string;
  pain: string;
  evidence: string;
  severity: number; // 0-100
  alignment: number; // 0-100 - alignment with your solution
}

// Decision Flow
export interface DecisionFlow {
  criticalPath: string[]; // Person IDs in decision sequence
  bottlenecks: string[]; // Person IDs who might block
  influencers: string[]; // Person IDs with high influence
  estimatedDuration: number; // days
  complexity: 'simple' | 'moderate' | 'complex';
}

// Person Intelligence
export interface PersonIntelligence {
  id: string;
  name: string;
  title: string;
  company: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  confidence: number;
  careerAnalysis?: CareerAnalysis;
  relationships?: RelationshipMap;
  buyingAuthority?: BuyingAuthority;
}

// Buying Authority
export interface BuyingAuthority {
  budgetOwner: boolean;
  estimatedBudget?: number;
  approvalLevel: 'final_decision' | 'influencer' | 'user' | 'blocker';
  decisionMakingPower: number; // 0-100
}

// People-Centric ICP Score
export interface PeopleCentricICPScore {
  companyName: string;
  overallScore: number; // 0-100
  peopleQualityScore: number; // 40% weight
  painAlignmentScore: number; // 30% weight
  buyingAuthorityScore: number; // 20% weight
  firmographicScore: number; // 10% weight
  explanation: string;
  topPeople: BuyerGroupMember[];
  keyPainPoints: PainPoint[];
  recommendedApproach: string;
}

// Company Recommendation
export interface CompanyRecommendation {
  rank: number;
  company: string;
  score: PeopleCentricICPScore;
  reasoning: string;
  nextSteps: string[];
}

// Cost Tracking
export interface CostTracking {
  enrichmentLevel: EnrichmentLevel;
  apiCallsMade: {
    coresignal?: number;
    lusha?: number;
    zerobounce?: number;
    perplexity?: number;
    other?: number;
  };
  estimatedCost: number;
  actualCost?: number;
}

// API Response Wrapper
export interface IntelligenceAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    timestamp: string;
    processingTime: number;
    enrichmentLevel?: EnrichmentLevel;
    costTracking?: CostTracking;
    cacheUtilized?: boolean;
  };
}

