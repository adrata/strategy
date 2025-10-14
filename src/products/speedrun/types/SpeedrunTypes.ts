export interface SpeedrunPerson {
  id: number;
  name: string;
  title: string;
  company: string | { 
    id: string; 
    name: string; 
    industry?: string; 
    size?: string; 
    globalRank?: number;
    hqState?: string;
    state?: string;
  };
  email: string;
  phone: string;
  mobilePhone?: string;
  linkedin?: string;
  linkedinUrl?: string;
  location?: string;
  photo: string | null;
  priority: string;
  status: string;
  lastContact: string;
  nextAction: string;
  relationship: string;
  bio: string;
  interests: string[];
  recentActivity: string;
  commission: string;
  stableIndex?: number | undefined;
  vertical?: string; // Add vertical field for filtering
  notes?: string; // Notes field for persistence
  // Multi-player sales fields
  owner?: string; // Owner's name or '-'
  coSellers?: string; // Comma-separated co-sellers names or '-'
  ownerId?: string; // Owner's user ID
  ownerData?: any; // Full owner user object
  coSellersData?: any[]; // Full co-sellers user objects
  // 🔥 MONACO ENRICHMENT DATA
  customFields?: {
    monacoEnrichment?: {
      personIntelligence?: {
        influence?: number;
        decisionPower?: number;
        department?: string;
        seniorityLevel?: string;
        skills?: string[];
        painPoints?: string[];
        motivations?: string[];
        communicationStyle?: string;
        decisionFactors?: string[];
      };
      buyerGroupAnalysis?: {
        role?: string;
        confidence?: number;
        rationale?: string;
      };
      companyIntelligence?: {
        industry?: string;
        companySize?: string;
        revenue?: string;
        techStack?: string[];
        competitors?: string[];
        marketPosition?: string;
        digitalMaturity?: number;
      };
      opportunityIntelligence?: {
        signals?: string[];
        urgency?: string;
        budget?: string;
        timeline?: string;
        nextBestAction?: string;
      };
      contactInformation?: {
        linkedin_profile?: string;
        phones?: Array<{
          number: string;
          type: string;
          confidence: number;
        }>;
        emails?: Array<{
          address: string;
          type: string;
          verified: boolean;
        }>;
      };
      enrichedProfiles?: {
        personality?: string;
        recentActivity?: Array<{
          type: string;
          description: string;
          timestamp?: string;
        }>;
        experience?: Array<{
          company: string;
          title: string;
          duration: string;
        }>;
        education?: Array<{
          school: string;
          degree: string;
          field: string;
          year: string;
        }>;
      };
      // Additional Monaco enrichment fields
      [key: string]: any;
    };
    [key: string]: any;
  };
}

export interface ValueIdea {
  title: string;
  description: string;
  urgency: "high" | "medium" | "low";
  type: string;
}

export interface SpeedrunLeadDetailsProps {
  person: SpeedrunPerson;
  personIndex: number;
  totalPersons: number;
  allPeople: SpeedrunPerson[];
  onBack: () => void;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
  onSnooze: (personId: number) => void;
  onRemove: (personId: number) => void;
  onComplete: (personId: number) => void;
}

export interface TabProps {
  person: SpeedrunPerson;
  onShowCompanyDetail?: () => void;
}

export interface InsightsData {
  nextMove: string;
  persona: string;
  buyingSignals: string[];
  objections: string[];
  recommendations: string[];
  winLoss: string;
  competitive: string;
}

export interface ProfileData {
  personality: string;
  communication: string;
  motivators: string;
  values: string;
  social: string;
  interests: string;
  role: string;
  context: string;
  tips: string;
}

export interface CareerData {
  summary: string;
  education: string;
  certifications: string[];
  skills: string[];
  timeline: Array<{
    year: string;
    title: string;
    company: string;
    achievements: string[];
  }>;
}

export interface WorkspaceData {
  company: string;
  industry: string;
  size: string;
  hq: string;
  mission: string;
  techStack: string[];
  dayToDay: string;
  orgChart: Array<{
    name: string;
    title: string;
    department?: string;
    seniority?: string;
  }>;
  news: string[];
  fit: string;
}

export interface HistoryData {
  aiSummary: string;
  timeline: Array<{
    date: string;
    type: string;
    summary: string;
  }>;
  communicationHistory: Array<{
    date: string;
    channel: string;
    subject: string;
    status: string;
  }>;
  interactionMetrics: {
    totalInteractions: number;
    emailsSent: number;
    callsMade: number;
    linkedinMessages: number;
    avgResponseTime: string;
    lastInteraction: string;
    engagementTrend: string;
    preferredChannel: string;
  };
}

export interface Note {
  id: string;
  content: string;
  timestamp: string;
  author: string;
}
