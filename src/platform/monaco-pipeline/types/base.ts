import { z } from "zod";

// Base Pipeline Types
export type PipelineStatus = "pending" | "running" | "completed" | "error";

export interface PipelineState {
  currentStep: number;
  totalSteps: number;
  startTime?: Date;
  endTime?: Date;
  status: PipelineStatus;
  error?: string;
  outputFiles: Record<string, string>;
}

export interface PipelineStep {
  id: number;
  name: string;
  description: string;
  run: (data: any) => Promise<any>;
  validate: (data: any) => boolean;
}

export interface PipelineData {
  sellerProfile: any;
  competitors: any[];
  buyerCompanies: any[];
  peopleData: any[];
  orgStructures: any[];
  buyerGroups: any[];
  intelligenceReports: any[];
  enablementAssets: any[];
  enrichedProfiles?: any[];
  [key: string]: any;
}

export interface PipelineConfig {
  apiKeys: {
    // brightdata: string; // Removed - no longer using BrightData
    anthropic: string;
    openai: string;
  };
  datasetIds: {
    linkedinCompanies: string;
    linkedinPeople: string;
    b2bEnrichment: string;
  };
  pipeline: {
    maxCompanies: number;
    minSearchPool: number;
    outputDir: string;
    logLevel: string;
  };
  sellerProfile: {
    companyName: string;
    industry: string;
    companySize: string;
    product: string;
    salesTeam: string;
    targetMarkets: string[];
    successCriteria: string[];
  };
  buyerFilter: {
    industry: string[];
    companySize: string[];
    revenue: string;
    techStack: string[];
  };
}

// Core entity types
export interface Person {
  id: string;
  name: string;
  title: string;
  company: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  connections?: number;
  level?: number;
  department?: string;
  location?: string;
  // Social media and engagement properties
  followers?: number;
  postFrequency?: number;
  // Additional properties for pipeline processing
  [key: string]: any;
}

export interface BuyerCompany {
  id: string;
  name: string;
  industry: string;
  size: string;
  revenue?: string;
  location?: string | { city: string; country: string };
  website?: string;
  technologies?: string[];
  [key: string]: any;
}

export interface EnrichedProfile {
  id: string;
  personId: string;
  person: Person;
  company: BuyerCompany;
  contactInfo: {
    email?: string;
    phone?: string;
    linkedin?: string;
  };
  enrichmentData: {
    technologies?: string[];
    interests?: string[];
    activities?: string[];
    connections?: number;
  };
  [key: string]: any;
}

export interface G2Data {
  products: Array<{
    id: string;
    name: string;
    description: string;
    rating: number;
    reviewCount: number;
    features: string[];
    pricing: {
      model: string;
      startingPrice: number;
      currency: string;
    };
    competitors: string[];
    categories: string[];
    lastUpdated: string;
  }>;
  marketPosition: {
    category: string;
    rank: number;
    totalCompetitors: number;
  };
  competitiveAnalysis: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  lastUpdated: string;
  [key: string]: any;
}

// Analysis types
export interface PowerScore {
  personId: string;
  name: string;
  title: string;
  department: string;
  influenceScore: number;
  decisionMakingPower: number;
  totalScore: number;
  seniorityScore: number;
  networkScore: number;
  tenureScore: number;
  departmentScore: number;
  activityScore: number;
  influenceRadius: number;
  keyRelationships: string[];
  decisionMakingStyle: string;
}

export interface OrgStructure {
  companyId: string;
  departments: {
    name: string;
    head: string;
    members: string[];
    relationships: { from: string; to: string; type: string }[];
  }[];
  levels: {
    level: number;
    people: string[];
    relationships: { from: string; to: string; type: string }[];
  }[];
  hierarchy: {
    personId: string;
    level: number;
    reportsTo?: string;
    directReports: string[];
  }[];
  [key: string]: any;
}

export interface InfluenceAnalysis {
  personId: string;
  influenceScore: number;
  decisionMakingPower: number;
  networkSize: number;
  relationships: { target: string; strength: number; type: string }[];
  companyId: string;
  powerScores: PowerScore[];
  decisionPatterns: Record<
    string,
    {
      style: string;
      frequency: number;
      effectiveness: number;
    }
  >;
  [key: string]: any;
}

export interface BuyerGroup {
  id: string;
  name: string;
  companyId: string;
  companyName: string;
  champions: string[];
  decisionMakers: string[];
  blockers: string[];
  stakeholders: string[];
  openers: string[];
  members: string[];
  influencers: string[];
  dynamics: any;
  rationale: any;
  characteristics: string[];
  [key: string]: any;
}

export interface FlightRiskAnalysis {
  personId: string;
  riskScore: number;
  factors: string[];
  timeline: string;
  mitigation: string[];
  [key: string]: any;
}

export interface CompetitorActivityAnalysis {
  companyId: string;
  activities: string[];
  threatLevel: number;
  opportunities: string[];
  [key: string]: any;
}

// Content and assets types
export interface AuthorityPost {
  id: string;
  title: string;
  content: string;
  target: any;
  week: string;
  post: string;
  rationale: string;
  hashtags: string[];
  timestamp: string;
  noveltyScoreNews: number;
  noveltyScoreLinkedin: number;
  noveltyLabelLinkedin: string;
  noveltyScoreCombined: number;
  noveltyLabel: string;
  targetAudience: string[];
  channels: string[];
  metrics: {
    engagementRate: number;
    reach: number;
    conversions: number;
  };
  [key: string]: any;
}

export interface EnablementAsset {
  id: string;
  name: string;
  type: string;
  targetId: string;
  targetName: string;
  title: string;
  content: string;
  targetAudience: string;
  keyPoints: string[];
  attachments: string[];
  leadMagnets: string[];
  emailDraft: string;
  targetBuyerGroup: string;
  effectiveness: number;
  [key: string]: any;
}

export interface IntelligenceReport {
  id: string;
  title: string;
  content: string;
  insights: string[];
  recommendations:
    | string[]
    | Array<{
        category: string;
        description: string;
        priority: number;
        actionItems: string[];
      }>;
  confidence: number;
  [key: string]: any;
}

// Playbook types
export interface OpportunityPlaybook {
  id: string;
  name: string;
  companyId: any;
  companyName: any;
  opportunitySignals: any;
  targetBuyerGroup: string;
  keyStakeholders: any[];
  strategy: {
    approach: string;
    valueProposition: string;
    keyMessages: string[];
    objections: any[];
  };
  timeline: any[];
  successMetrics: any[];
  lastUpdated: string;
  strategies: string[];
  tactics: string[];
  success_metrics: string[];
  [key: string]: any;
}

export interface EngagementPlaybook {
  id: string;
  name: string;
  targetPersona: string;
  touchpoints: string[];
  messaging: string[];
  timeline: string;
  [key: string]: any;
}

export interface SalesPlaybook {
  id: string;
  name: string;
  targetMarket: string;
  strategies: string[];
  objectionHandling: string[];
  closingTechniques: string[];
  [key: string]: any;
}

export interface CompetitorBattlecard {
  id: string;
  competitorName: string;
  strengths: string[];
  weaknesses: string[];
  positioning: string[];
  counterStrategies: string[];
  [key: string]: any;
}

// Signal and opportunity types
export interface OpportunitySignal {
  id: string;
  type: string;
  signal: string;
  strength: number;
  personId: string;
  companyId: string;
  actionable: boolean;
  insight: string;
  confidence: number;
  rationale: string[];
  dataSources: string[];
  actionableItems: string[];
  [key: string]: any;
}

export interface DecisionFlow {
  id: string;
  name: string;
  companyId: any;
  paths: DecisionPath[];
  bottlenecks: string[];
  avgPathDuration: number;
  criticalPaths: string[];
  steps: string[];
  decisionMakers: string[];
  influencers: string[];
  timeline: string;
  [key: string]: any;
}

export interface DecisionPath {
  criticalPath: string[];
  [key: string]: any;
}

export interface Competitor {
  id: string;
  name: string;
  industry: string;
  size: string;
  product: string;
  website: string;
  linkedinUrl: string;
  strengths: string[];
  weaknesses: string[];
  messaging: Array<{
    theme: string;
    content: string;
  }>;
  [key: string]: any;
}

// Schema types
export interface SellerProfileSchema {
  companyName: string;
  industry: string;
  companySize: string;
  product: string;
  salesTeam: string;
  targetMarkets: string[];
  successCriteria: string[];
}
