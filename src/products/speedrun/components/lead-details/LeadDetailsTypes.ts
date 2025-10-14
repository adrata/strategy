import { SpeedrunPerson, ValueIdea, Note } from "../../types/SpeedrunTypes";

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

export interface LeadDetailsState {
  activeTab: string;
  activeReport: string | null;
  showSnoozeModal: boolean;
  showRemoveModal: boolean;
  showCompanyDetail: boolean;
  showMoreActions: boolean;
  showSnoozeRemoveModal: boolean;
  powerDialerVisible: boolean;
  isCalling: boolean;
  isListening: boolean;
  dynamicReports: ValueIdea[];
  isLoadingReports: boolean;
  notes: Note[];
  newNote: string;
  showAutoDialerPopup: boolean;
  showPowerDialer: boolean;
  currentDialerContacts: any[];
}

export interface LeadDetailsHeaderProps {
  person: SpeedrunPerson;
  personIndex: number;
  totalPersons: number;
  isListening: boolean;
  showMoreActions: boolean;
  onBack: () => void;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
  onComplete: (personId: number) => void;

  onDial: () => void;
  onMoreActions: (show: boolean) => void;
  onUpdate?: () => void;
  onSnooze: (personId: number) => void;
  onRemove: (personId: number) => void;
  canNavigatePrevious: () => boolean;
  canNavigateNext: () => boolean;
}

export interface LeadDetailsModalManagerProps {
  person: SpeedrunPerson;
  allPeople: SpeedrunPerson[];
  showSnoozeRemoveModal: boolean;
  showAutoDialerPopup: boolean;
  showPowerDialer: boolean;
  currentDialerContacts: any[];
  userId: string;
  workspaceId: string;
  onSnoozeRemoveModalClose: () => void;
  onAutoDialerClose: () => void;
  onPowerDialerClose: () => void;
  onSnooze: (personId: number) => void;
  onRemove: (personId: number) => void;
  onComplete: (personId: number) => void;
  onStartAutoDialer: () => void;
  onDialSingle: (person: SpeedrunPerson) => void;
  onCallComplete: (
    contactId: number,
    callNotes: string,
    outcome: string,
  ) => void;
}

export interface LeadDetailsTabContentProps {
  person: SpeedrunPerson;
  activeTab: string;
  dynamicReports: ValueIdea[];
  isLoadingReports: boolean;
  notes: Note[];
  newNote: string;
  onReportClick: (reportUrl: string) => void;
  onCompanyDetailClick: () => void;
  onSetNewNote: (note: string) => void;
  onAddNote: () => void;
  formatTimestamp: (timestamp: string) => string;
  onInlineFieldSave?: (field: string, value: string, recordId: string, recordType: string) => Promise<void>;
}

export interface ReportData {
  marketSize?: number;
  growthRate?: number;
  competitors?: any[];
  trends?: any[];
  digitalMaturity?: number;
  competitivePressure?: number;
  innovationIndex?: number;
  recommendations?: any[];
  marketShare?: number;
  marketPosition?: string;
  competitivePosition?: string;
  competitiveAdvantage?: number;
  threatLevel?: number;
  customerSatisfaction?: number;
  threats?: any[];
  opportunities?: any[];
  swotAnalysis?: any;
  revenueGrowth?: number;
  digitalSales?: number;
  customerAcquisitionCost?: number;
  marketExpansion?: any[];
  growthDrivers?: any[];
  scalingChallenges?: any[];
  quickWins?: any[];
  challenges?: any[];
  systemHealth?: number;
  securityScore?: number;
  automationLevel?: number;
}

export interface LeadDetailsReportServiceProps {
  activeReport: string | null;
  person: SpeedrunPerson;
  onReportBack: () => void;
}

export const TABS = [
  "Overview",
  "Actions",
  "Intelligence",
  "Career",
  "Notes",
] as const;
export type TabType = (typeof TABS)[number];
