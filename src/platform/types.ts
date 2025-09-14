// Hook imports removed to prevent circular dependencies
// Hook types are now defined in ./types/hooks.ts

export interface AcquisitionOSApp {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  sections: string[];
}

export interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  isTypewriter?: boolean;
}

export interface ChatSessions {
  [key: string]: ChatMessage[];
}

export interface CRMRecord {
  id: string;
  name: string;
  company?: string;
  title?: string;
  email?: string;
  phone?: string;
  value?: string;
  stage?: string;
  status?: string;
  probability?: number;
  closeDate?: string;
  lastAction?: string;
  nextAction?: string;
  lastActionDate?: string;
  nextActionDate?: string;
  notes?: string;
  directionalIntelligence?: string;
  hook?: string;
  [key: string]: any;
}

export interface FormData {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  source?: string;
  notes?: string;
  // Opportunity-specific fields
  amount?: string;
  probability?: string;
  stage?: string;
  closeDate?: string;
  contact?: string;
  // Partnership-specific fields
  partnerType?: string;
  relationshipStatus?: string;
  relationshipStrength?: string;
  contactName?: string;
  contactTitle?: string;
  commissionStructure?: string;
  website?: string;
  lastContactDate?: string;
  nextContactDate?: string;
  nextAction?: string;
}

export interface AcquireData {
  opportunities: any[];
  buyerGroups: any[];
  leads: any[];
  accounts: any[];
  contacts: any[];
  partnerships: any[];
  partners: any[];
  catalyst: any[];
  calendar: any[]; // Add calendar data to the interface
}

export interface Partnership {
  id: string;
  name: string;
  partnerType: string;
  contactName?: string;
  contactTitle?: string;
  contactEmail?: string;
  contactPhone?: string;
  relationshipStatus: string;
  relationshipStrength: string;
  commissionStructure?: string;
  notes?: string;
  website?: string;
  lastContactDate?: string;
  nextContactDate?: string;
  nextAction?: string;
  workspaceId: string;
  createdBy?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  leadsReferred?: number;
  totalReferralValue?: number;
  partnershipLeads?: PartnershipLead[];
}

export interface PartnershipLead {
  id: string;
  partnershipId: string;
  leadId: string;
  referralDate: string;
  referralValue?: number;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lead?: any;
  partnership?: Partnership;
}

export interface AcquisitionOSState {
  activeSubApp: string;
  activeSection: string;
  expandedSection: string | null;
  searchQuery: string;
  selectedStageFilter: string;
  selectedForecastFilter: string;
  sortBy: string;
  isLeftPanelVisible: boolean;
  isRightPanelVisible: boolean;
  isThemeModalOpen: boolean;
  isProfileOpen: boolean;
  profileAnchor: HTMLElement | null;
  rightChatInput: string;
  chatSessions: ChatSessions;
  selectedRecord: CRMRecord | null;
  detailViewType:
    | "lead"
    | "opportunity"
    | "company"
    | "person"
    | "report"
    | null;
  isAddModalOpen: boolean;
  isEditModalOpen: boolean;
  editingRecord: CRMRecord | null;
  formData: FormData;
  acquireData: AcquireData;
  isLoadingLeads: boolean;
}

export type AcquisitionOSContextType = {
  auth: ReturnType<typeof useAcquisitionOSAuth>;
  ui: ReturnType<typeof useAcquisitionOSUI>;
  data: ReturnType<typeof useAcquisitionOSData>;
  chat: ReturnType<typeof useAcquisitionOSChat>;
  forms: ReturnType<typeof useAcquisitionOSForms>;
  progress: ReturnType<typeof useAcquisitionOSProgress>;
};

// Legacy aliases for backwards compatibility
export type ActionPlatformApp = AcquisitionOSApp;
export type ActionPlatformState = AcquisitionOSState;
export type ActionPlatformContextType = AcquisitionOSContextType;
