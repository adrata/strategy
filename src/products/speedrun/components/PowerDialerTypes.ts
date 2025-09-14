export interface PowerDialerProps {
  contacts: Array<{
    id: number;
    name: string;
    phone: string;
    company: string;
    title: string;
    nextAction: string;
    priority: string;
    location?: string;
    city?: string;
  }>;
  onCallComplete: (
    contactId: number,
    notes: string,
    outcome: CallOutcome,
  ) => void;
  onDialerClose: () => void;
  userId: string;
  workspaceId: string;
}

export interface CallState {
  status:
    | "idle"
    | "dialing"
    | "ringing"
    | "connected"
    | "complete"
    | "awaiting-summary"
    | "error";
  currentContact: number;
  callStartTime: Date | null;
  callDuration: number;
  isPaused: boolean;
  callSid?: string;
  fromNumber?: string;
  startTime?: Date;
  connectedTime?: Date;
  duration?: number;
  error?: string;
}

export type CallOutcome =
  | "connected"
  | "voicemail"
  | "no-answer"
  | "busy"
  | "pitched"
  | "demo-scheduled"
  | "not-interested"
  | "callback-later"
  | "wrong-number"
  | "failed";

export interface ForwardingStatus {
  enabled: boolean;
  cellPhone?: string;
  message: string;
}

export interface PowerDialerContact {
  id: number;
  name: string;
  phone: string;
  company: string;
  title: string;
  nextAction: string;
  priority: string;
  location?: string;
  city?: string;
}

export interface PowerDialerSettings {
  isAutoAdvance: boolean;
  delayBetweenCalls: number;
}

export interface PowerDialerState {
  callState: CallState;
  notes: string;
  callOutcome: CallOutcome | null;
  callAnswered: boolean;
  autoAdvanceTimer: NodeJS.Timeout | null;
  forwardingStatus: ForwardingStatus | null;
  settings: PowerDialerSettings;
}
