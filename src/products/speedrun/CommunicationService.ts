// 🚀 COMPREHENSIVE COMMUNICATION SERVICE
// Integrates all messaging channels: emails, calls, SMS, LinkedIn, meetings, website visits

export interface Email {
  id: string;
  sentAt: Date;
  subject: string;
  content: string;
  direction: "inbound" | "outbound";
  status: "sent" | "delivered" | "opened" | "replied";
  sender: string;
  recipient: string;
  threadId: string;
  attachments: any[];
  aiSentiment: "positive" | "neutral" | "negative";
  aiSummary: string;
  opened: boolean;
  clicked: boolean;
  replied: boolean;
  openedAt?: Date;
  clickedAt?: Date;
  repliedAt?: Date;
}

export interface Call {
  id: string;
  startTime: Date;
  duration: number;
  direction: "inbound" | "outbound";
  status: "completed" | "missed" | "voicemail" | "failed";
  recordingUrl?: string;
  transcript?: string;
  aiSummary?: string;
  aiSentiment?: "positive" | "neutral" | "negative";
  nextSteps: string[];
  keyTopics: string[];
  caller: string;
  callee: string;
  notes?: string;
  followUpRequired: boolean;
  outcome?: string;
}

export interface SMS {
  id: string;
  sentAt: Date;
  message: string;
  direction: "inbound" | "outbound";
  status: "sent" | "delivered" | "read";
  sender: string;
  recipient: string;
  threadId: string;
  aiSentiment?: "positive" | "neutral" | "negative";
  isAutomated: boolean;
}

export interface LinkedInMessage {
  id: string;
  sentAt: Date;
  message: string;
  direction: "inbound" | "outbound";
  status: string;
  sender: string;
  recipient: string;
  connectionRequest: boolean;
  aiSentiment?: "positive" | "neutral" | "negative";
}

export interface Meeting {
  id: string;
  startTime: Date;
  title: string;
  duration: number;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  attendees: string[];
  agenda?: string;
  notes?: string;
  recordingUrl?: string;
  transcript?: string;
  aiSummary?: string;
  nextSteps: string[];
  outcome?: string;
  location?: string;
  platform?: "zoom" | "teams" | "google_meet" | "in_person";
}

export interface WebsiteVisit {
  id: string;
  timestamp: Date;
  pages: string[];
  duration: number;
  source: string;
  campaign?: string;
  userAgent: string;
  ip: string;
  location?: string;
  behavior: "engaged" | "browsing" | "quick_exit";
  intent: "high" | "medium" | "low";
}

// Mock data for demonstration
const mockEmails: Email[] = [
  {
    id: "email-1",
    sentAt: new Date("2025-01-15T10:30:00Z"),
    subject: "Follow-up: Sales Intelligence Discussion",
    content:
      "Hi John, Thank you for taking the time to discuss your sales intelligence needs...",
    direction: "outbound",
    status: "opened",
    sender: "sarah@adrata.com",
    recipient: "john@example.com",
    threadId: "thread-1",
    attachments: [],
    aiSentiment: "positive",
    aiSummary: "Professional follow-up with interest in solution demonstration",
    opened: true,
    clicked: false,
    replied: false,
    openedAt: new Date("2025-01-15T11:15:00Z"),
  },
];

const mockCalls: Call[] = [
  {
    id: "call-1",
    startTime: new Date("2025-01-14T14:00:00Z"),
    duration: 1800, // 30 minutes
    direction: "outbound",
    status: "completed",
    recordingUrl: "/recordings/call-1.mp3",
    transcript: "Discussed current sales challenges and potential solutions...",
    aiSummary:
      "Productive discovery call with strong interest in AI-powered sales insights",
    aiSentiment: "positive",
    nextSteps: ["Send product demo", "Schedule technical deep-dive"],
    keyTopics: ["Lead scoring", "Sales intelligence", "ROI calculation"],
    caller: "Sarah Chen",
    callee: "John Smith",
    notes: "Very engaged, specifically interested in lead scoring capabilities",
    followUpRequired: true,
    outcome: "demo_scheduled",
  },
];

const mockSMS: SMS[] = [
  {
    id: "sms-1",
    sentAt: new Date("2025-01-15T16:20:00Z"),
    message:
      "Quick reminder about our demo tomorrow at 2 PM. Looking forward to showing you the platform!",
    direction: "outbound",
    status: "read",
    sender: "sarah@adrata.com",
    recipient: "+1234567890",
    threadId: "sms-thread-1",
    aiSentiment: "positive",
    isAutomated: false,
  },
];

const mockLinkedIn: LinkedInMessage[] = [
  {
    id: "linkedin-1",
    sentAt: new Date("2025-01-13T09:00:00Z"),
    message:
      "Hi John, I noticed you're focused on sales optimization at Example Corp. Would love to share some insights...",
    direction: "outbound",
    status: "accepted",
    sender: "Sarah Chen",
    recipient: "John Smith",
    connectionRequest: true,
    aiSentiment: "positive",
  },
];

const mockMeetings: Meeting[] = [
  {
    id: "meeting-1",
    startTime: new Date("2025-01-16T14:00:00Z"),
    title: "Product Demo - Sales Intelligence Platform",
    duration: 3600, // 60 minutes
    status: "scheduled",
    attendees: ["john@example.com", "sarah@adrata.com"],
    agenda: "1. Platform overview\n2. Lead scoring demo\n3. Q&A\n4. Next steps",
    notes: "",
    nextSteps: [],
    location: "Virtual",
    platform: "zoom",
  },
];

const mockWebsiteVisits: WebsiteVisit[] = [
  {
    id: "visit-1",
    timestamp: new Date("2025-01-15T11:20:00Z"),
    pages: ["/pricing", "/features", "/case-studies"],
    duration: 420, // 7 minutes
    source: "email_campaign",
    campaign: "Q1_Sales_Intelligence",
    userAgent: "Mozilla/5.0...",
    ip: "192.168.1.1",
    location: "San Francisco, CA",
    behavior: "engaged",
    intent: "high",
  },
];

// Service functions
export function getEmailHistory(leadId: string): Email[] {
  // In production, this would fetch from the database/API
  return mockEmails;
}

export function getCallHistory(leadId: string): Call[] {
  // In production, this would fetch from call recording system
  return mockCalls;
}

export function getSMSHistory(leadId: string): SMS[] {
  // In production, this would fetch from SMS service
  return mockSMS;
}

export function getLinkedInHistory(leadId: string): LinkedInMessage[] {
  // In production, this would fetch from LinkedIn integration
  return mockLinkedIn;
}

export function getMeetingHistory(leadId: string): Meeting[] {
  // In production, this would fetch from calendar integration
  return mockMeetings;
}

export function getWebsiteHistory(leadId: string): WebsiteVisit[] {
  // In production, this would fetch from tracking system
  return mockWebsiteVisits;
}

// Helper functions for unified communication timeline
export function getAllCommunications(leadId: string) {
  const emails = getEmailHistory(leadId);
  const calls = getCallHistory(leadId);
  const sms = getSMSHistory(leadId);
  const linkedin = getLinkedInHistory(leadId);
  const meetings = getMeetingHistory(leadId);
  const website = getWebsiteHistory(leadId);

  return {
    emails,
    calls,
    sms,
    linkedin,
    meetings,
    website,
    total:
      emails.length +
      calls.length +
      sms.length +
      linkedin.length +
      meetings.length +
      website.length,
  };
}
