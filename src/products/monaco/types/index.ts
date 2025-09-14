// Monaco Dashboard UI Types
// Re-export pipeline types for convenience
export * from "@/platform/monaco-pipeline/types";

// UI-specific interfaces
export interface Company {
  id: string;
  name: string;
  industry: string;
  employeeCount: number;
  location: string;
  icpScore: number; // Keep for backward compatibility
  matchScore?: number; // New property - optional for transition
  status: string;
  lastUpdated: string;
  domain: string;
  revenue?: string; // Add back for compatibility
  budgetRange?: string;
  decisionTimeline?: string;
  urgency?: string;
  buyerGroup?: string;
  platformCount?: number;
  engineeringHeadcount?: number; // Engineering team size
  engagementStatus?: {
    label: string;
    color: string;
    priority: number;
  };
  // Enhanced intelligence fields (optional for compatibility)
  companyIntelligence?: {
    foundedYear: number;
    funding: string;
    growthStage: "Startup" | "Growth" | "Scale-up" | "Enterprise" | "Public";
    techStack: string[];
    painPoints: string[];
    businessPriorities: string[];
    decisionMakingStyle: "Consensus" | "Top-down" | "Democratic" | "Technical";
    buyingSignals: string[];
    competitorAnalysis: string[];
    recentNews: string[];
    executiveInsights: string;
    salesIntelligence: {
      idealContactTitle: string[];
      avgSalesCycle: string;
      avgDealSize: string;
      successFactors: string[];
      objectionHandling: string[];
    };
  };
}

export interface Partner {
  id: string;
  name: string;
  domain: string;
  partnershipType: string;
  status: "active" | "pending" | "paused";
  region: string;
  revenue: string;
  lastContact: string;
}

export interface Person {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  linkedin: string;
  location: string;
  department: string;
  seniority: string;
  lastContact: string;
  status: "prospect" | "contacted" | "qualified" | "customer";
  // Additional contact fields
  phone?: string;
  activeBuyerGroups?: string; // Format like "12/15" showing active/total buyer groups
  // Intelligence analysis fields
  decisionPower?: number;
  influenceLevel?: "Low" | "Medium" | "High" | "Executive";
  buyerGroupRole?:
    | "Decision Maker"
    | "Champion"
    | "Stakeholder"
    | "Blocker"
    | "Openers";
  // Company context fields
  industry?: string;
  companySize?: string;
  techStack?: string[];
  growthStage?: string;
  // Deep personal intelligence
  personalIntelligence?: {
    background: {
      education: string;
      careerPath: string[];
      yearsInRole: number;
      previousCompanies: string[];
      certifications: string[];
    };
    psychographics: {
      communicationStyle:
        | "Direct"
        | "Collaborative"
        | "Analytical"
        | "Relationship-focused";
      decisionMaking:
        | "Data-driven"
        | "Intuitive"
        | "Consensus-seeking"
        | "Risk-averse";
      personality: "Driver" | "Expressive" | "Amiable" | "Analytical";
      motivations: string[];
      challenges: string[];
    };
    digitalFootprint: {
      linkedinActivity: string[];
      recentPosts: string[];
      professionalInterests: string[];
      industryInfluence: "Low" | "Medium" | "High" | "Thought Leader";
    };
    engagement: {
      bestContactTime: string;
      preferredChannel: "Email" | "Phone" | "LinkedIn" | "Video";
      responseRate: number;
      lastEngagement: string;
      engagementHistory: string[];
    };
    businessContext: {
      currentProjects: string[];
      quarterlyGoals: string[];
      budgetAuthority: string;
      influenceLevel:
        | "Champion"
        | "Influencer"
        | "Gatekeeper"
        | "Decision Maker";
      stakeholderMap: string[];
    };
  };
  // Pain analysis for Q4 context
  painSummary?: string;
}

// AI Search interfaces
export interface SearchPill {
  id: string;
  type:
    | "location"
    | "industry"
    | "size"
    | "revenue"
    | "department"
    | "seniority"
    | "status"
    | "developer_type"
    | "tech_stack"
    | "role_level";
  value: string;
  alternatives: string[];
  isActive: boolean;
}

export interface SearchResults {
  companies: Company[];
  partners: Partner[];
  people: Person[];
  query: string;
  pills: SearchPill[];
  totalResults: number;
}

export interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  searchResults?: SearchResults;
}

export interface ChatSession {
  [key: string]: ChatMessage[];
}

export interface PendingAction {
  type: string;
  query: string;
  targets: (Company | Person)[];
  summary: string;
}

export interface SectionStats {
  all: number;
  week: number;
  change: number;
}

// Search alternatives type definitions
export type SearchAlternatives = {
  location: { [key: string]: string[] };
  industry: { [key: string]: string[] };
  developerType: { [key: string]: string[] };
  techStack: { [key: string]: string[] };
  seniority: { [key: string]: string[] };
  department: { [key: string]: string[] };
};

export interface ICPList {
  id: string;
  name: string;
  description: string;
  count: number;
  isCompleted: boolean;
  isCustom: boolean;
  tier?: string;
  fitScore?: number;
}

export interface AllSection {
  id: string;
  name: string;
  description: string;
  count: number;
}

export type MonacoRecord = Company | Person;

export interface FilterOption {
  type:
    | "location"
    | "industry"
    | "sector"
    | "vertical"
    | "department"
    | "role"
    | "size"
    | "revenue";
  label: string;
  value: string;
}

export interface CustomListFilters {
  location?: string[];
  industry?: string[];
  sector?: string[];
  vertical?: string[];
  department?: string[];
  role?: string[];
  size?: string[];
  revenue?: string[];
  description?: string;
}

// Rich company data from Acquisition OS
export interface RichCompany extends Company {
  // Financial data
  marketCap?: string;
  fundingRounds?: Array<{
    type: string;
    amount: string;
    date: string;
    investors: string[];
  }>;

  // People data
  keyContacts?: Array<{
    name: string;
    title: string;
    email?: string;
    linkedin?: string;
    department: string;
  }>;

  // Technology stack
  technologies?: string[];

  // News and events
  recentNews?: Array<{
    title: string;
    date: string;
    source: string;
    summary: string;
  }>;

  // Competitive intelligence
  competitors?: string[];

  // Engagement history
  engagementHistory?: Array<{
    type: "email" | "call" | "meeting" | "demo";
    date: string;
    contact: string;
    outcome: string;
    nextSteps?: string;
  }>;

  // Intent signals
  intentSignals?: Array<{
    signal: string;
    strength: "low" | "medium" | "high";
    date: string;
    source: string;
  }>;
}

// Rich person data from Acquisition OS
export interface RichPerson extends Person {
  // Professional details
  bio?: string;
  education?: Array<{
    school: string;
    degree: string;
    year: string;
  }>;

  // Career history
  workHistory?: Array<{
    company: string;
    title: string;
    duration: string;
    description?: string;
  }>;

  // Contact preferences
  preferredContact?: "email" | "linkedin" | "phone";
  timezone?: string;

  // Social presence
  socialProfiles?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };

  // Engagement data
  engagementScore?: number;
  lastEngagement?: {
    type: string;
    date: string;
    outcome: string;
  };

  // Interests and topics
  interests?: string[];
  expertiseAreas?: string[];

  // Network connections
  mutualConnections?: Array<{
    name: string;
    relationship: string;
  }>;
}
