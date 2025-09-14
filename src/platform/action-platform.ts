// Action Platform Types - Production Ready
export interface BaseRecord {
  readonly id: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly workspaceId: string;
  readonly userId: string;
}

export interface Lead extends BaseRecord {
  name: string;
  email: string;
  phone?: string;
  title?: string;
  company: string;
  status: LeadStatus;
  source: string;
  owner: string;
  notes?: string;
  department?: string;
  influence: InfluenceLevel;
  relationship: RelationshipStrength;
  buyerGroupRole: BuyerGroupRole;
  lastAction?: string;
  nextAction?: string;
  lastActionDate?: string;
  nextActionDate?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

export interface Opportunity extends BaseRecord {
  name: string;
  company: string;
  value: string;
  stage: OpportunityStage;
  probability: number;
  closeDate: string;
  contact?: string;
  source: string;
  status: OpportunityStatus;
  lastActionDate?: string;
  nextActionDate?: string;
  lastAction?: string;
  nextAction?: string;
  notes?: string;
  buyerGroup: Contact[];
  tags?: string[];
  customFields?: Record<string, unknown>;
}

export interface Contact extends BaseRecord {
  name: string;
  email: string;
  phone?: string;
  title?: string;
  company: string;
  department?: string;
  influence: InfluenceLevel;
  relationship: RelationshipStrength;
  buyerGroupRole: BuyerGroupRole;
  lastContact?: string;
  nextContact?: string;
  notes?: string;
  socialProfiles?: SocialProfile[];
  tags?: string[];
}

export interface Account extends BaseRecord {
  name: string;
  industry?: string;
  size?: CompanySize;
  website?: string;
  description?: string;
  tier: AccountTier;
  status: AccountStatus;
  revenue?: number;
  employees?: number;
  location?: string;
  contacts?: Contact[];
  opportunities?: Opportunity[];
  tags?: string[];
}

export interface Partnership extends BaseRecord {
  name: string;
  partnerType: PartnerType;
  contactName?: string;
  contactTitle?: string;
  contactEmail?: string;
  contactPhone?: string;
  relationshipStatus: RelationshipStatus;
  relationshipStrength: RelationshipStrength;
  commissionStructure?: string;
  website?: string;
  lastContactDate?: string;
  nextContactDate?: string;
  nextAction?: string;
  notes?: string;
  leadsReferred: number;
  totalReferralValue: number;
  tags?: string[];
}

// Enums for type safety
export enum LeadStatus {
  NEW = "New",
  CONTACTED = "Contacted",
  QUALIFIED = "Qualified",
  CONVERTED = "Converted",
  DISQUALIFIED = "Disqualified",
}

export enum OpportunityStage {
  DISCOVERY = "Discovery",
  QUALIFICATION = "Qualification",
  PROPOSAL = "Proposal",
  NEGOTIATION = "Negotiation",
  CLOSED_WON = "Closed Won",
  CLOSED_LOST = "Closed Lost",
}

export enum OpportunityStatus {
  ACTIVE = "Active",
  WON = "Won",
  LOST = "Lost",
  ON_HOLD = "On Hold",
}

export enum InfluenceLevel {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High",
  CRITICAL = "Critical",
}

export enum RelationshipStrength {
  COLD = "Cold",
  WARM = "Warm",
  HOT = "Hot",
  CHAMPION = "Champion",
}

export enum BuyerGroupRole {
  CHAMPION = "Champion",
  DECISION_MAKER = "Decision Maker",
  STAKEHOLDER = "Stakeholder",
  USER = "User",
  OPENER = "Opener",
  NOT_IN_BUYER_GROUP = "Not in Buyer Group",
  UNKNOWN = "Unknown",
}

export enum CompanySize {
  STARTUP = "Startup",
  SMB = "SMB",
  ENTERPRISE = "Enterprise",
  FORTUNE_500 = "Fortune 500",
}

export enum AccountTier {
  TIER_1 = "Tier 1",
  TIER_2 = "Tier 2",
  TIER_3 = "Tier 3",
}

export enum AccountStatus {
  PROSPECT = "Prospect",
  CUSTOMER = "Customer",
  FORMER_CUSTOMER = "Former Customer",
  PARTNER = "Partner",
}

export enum PartnerType {
  VC = "VC",
  AGENCY = "Agency",
  CONSULTANT = "Consultant",
  RESELLER = "Reseller",
  TECHNOLOGY = "Technology",
  STRATEGIC = "Strategic",
}

export enum RelationshipStatus {
  ACTIVE = "Active",
  INACTIVE = "Inactive",
  PENDING = "Pending",
  TERMINATED = "Terminated",
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Error Types
export interface ActionPlatformError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

// Configuration Types
export interface ActionPlatformConfig {
  workspaceId: string;
  userId: string;
  apiBaseUrl: string;
  enableRealTime: boolean;
  enableOfflineMode: boolean;
  cacheTimeout: number;
  retryAttempts: number;
  retryDelay: number;
}

// Filter Types
export interface FilterOptions {
  searchTerm?: string;
  status?: string[];
  source?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  customFilters?: Record<string, unknown>;
}

// Sort Types
export interface SortOptions {
  field: string;
  direction: "asc" | "desc";
}

// Social Profile Types
export interface SocialProfile {
  platform: "linkedin" | "twitter" | "github" | "other";
  url: string;
  username?: string;
}

// Chat Types
export interface ChatMessage {
  id: string;
  type: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  lastActivity: Date;
  context?: Record<string, unknown>;
}

// UI State Types
export interface ViewState {
  activeSection: string;
  selectedRecord: Lead | Opportunity | Contact | Account | Partnership | null;
  detailViewType:
    | "lead"
    | "opportunity"
    | "contact"
    | "account"
    | "partnership"
    | "company"
    | null;
  isLoading: boolean;
  error: ActionPlatformError | null;
}

// Context Types
export interface ActionPlatformContextType {
  // Data
  leads: Lead[];
  opportunities: Opportunity[];
  contacts: Contact[];
  accounts: Account[];
  partnerships: Partnership[];

  // State
  viewState: ViewState;
  config: ActionPlatformConfig;

  // Actions
  actions: {
    // CRUD operations
    createLead: (lead: Omit<Lead, keyof BaseRecord>) => Promise<Lead>;
    updateLead: (id: string, updates: Partial<Lead>) => Promise<Lead>;
    deleteLead: (id: string) => Promise<void>;

    createOpportunity: (
      opportunity: Omit<Opportunity, keyof BaseRecord>,
    ) => Promise<Opportunity>;
    updateOpportunity: (
      id: string,
      updates: Partial<Opportunity>,
    ) => Promise<Opportunity>;
    deleteOpportunity: (id: string) => Promise<void>;

    // State management
    setActiveSection: (section: string) => void;
    setSelectedRecord: (
      record: Lead | Opportunity | Contact | Account | Partnership | null,
    ) => void;
    setDetailViewType: (type: ViewState["detailViewType"]) => void;

    // Data operations
    refreshData: () => Promise<void>;
    searchRecords: (query: string, type?: string) => Promise<any[]>;

    // Error handling
    clearError: () => void;
    reportError: (error: ActionPlatformError) => void;
  };

  // Loading states
  loading: {
    leads: boolean;
    opportunities: boolean;
    contacts: boolean;
    accounts: boolean;
    partnerships: boolean;
  };

  // Chat
  chatSessions: Record<string, ChatMessage[]>;
  activeChatSession: string | null;
}
