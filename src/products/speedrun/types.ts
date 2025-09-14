// Speedrun Types - Extracted from 1,958-line monolithic SpeedrunRanking.ts

import type { CRMRecord } from "../types";

// User settings for Speedrun prioritization
export interface SpeedrunUserSettings {
  weeklyTarget: number; // Default contacts per week
  dailyTarget: number; // Daily contacts target
  strategy: "optimal" | "speed" | "revenue"; // 70/30 speed/revenue | speed focus | revenue focus
  role: "AE" | "SDR" | "CSM" | "VP" | "other";
  quota: number; // Yearly sales target
  pipelineHealth: "healthy" | "behind" | "ahead";
}

// Snooze options for leads
export interface SnoozeOption {
  id: string;
  label: string;
  duration: number; // in milliseconds
  type: "preset" | "custom";
}

// Lead state management
export interface LeadState {
  id: string;
  status: "active" | "snoozed" | "removed-temp" | "removed-permanent";
  snoozeUntil?: Date | undefined;
  removalReason?: string | undefined;
  addedToSpeedrunAt: Date;
  lastActionDate?: string;
}

// Daily lead cycling state
export interface DailySpeedrunState {
  date: string;
  viewedLeads: string[]; // IDs of leads shown today
  completedLeads: string[]; // IDs of leads completed today
  skippedLeads: string[]; // IDs of leads skipped today (deprecated)
  snoozedLeads: string[]; // IDs of leads snoozed today
  removedLeads: string[]; // IDs of leads removed today
  totalLeadsGenerated: number; // Total leads generated for the week
  currentBatch: number; // Which batch of 20 they're on
  dailyTargetMet: boolean;
  weeklyTargetMet: boolean;
}

// Enhanced contact data with ranking signals
export interface RankedContact extends CRMRecord {
  rankingScore: number;
  rankingReason: string;
  priority: "High" | "Medium" | "Low";
  daysSinceLastContact: number;
  estimatedDealValue?: number;
  companySize?: "Enterprise" | "Mid-Market" | "SMB";
  buyerGroupRole?: string;
  relationship?: string;
  influence?: string;
  dealStage?: string;
  probability?: number;
  freshnessFactor?: number; // How "fresh" this lead is for the user (0-1)
  optimalContactTime?: string; // Best time to contact based on patterns
  timeZone?: string; // Lead's timezone for optimal timing
  emailEngagementScore?: number; // Email engagement signals (0-100)
  readyToBuyScore?: number; // "Ready to buy" signal strength (0-100)
  callingPriority?: number; // 1-5, 5 = call first (same timezone), 1 = call later (Asia/Australia)
  callingWindow?: string; // Optimal calling window in ET
  companyRankingScore?: number; // Company-level ranking score (separate from individual)
}

// Progress tracking interfaces
export interface DailyProgress {
  completed: number;
  target: number;
  percentage: number;
  isComplete: boolean;
}

export interface WeeklyProgress {
  completed: number;
  target: number;
  percentage: number;
  isComplete: boolean;
}

export interface SmartDailyTarget {
  dailyTarget: number;
  reason: string;
  weeklyProgress: {
    completed: number;
    target: number;
    remaining: number;
  };
}

export interface SmartAddMoreCount {
  addCount: number;
  reason: string;
  targetBreakdown: {
    dailyTarget: number;
    currentCount: number;
    needed: number;
  };
}

// Pipeline data structure for processing
export interface CRMData {
  leads: CRMRecord[];
  contacts: CRMRecord[];
  buyerGroups: CRMRecord[];
  opportunities: CRMRecord[];
}

// Acquire data structure (external data source)
export interface AcquireData {
  leads: any[];
  contacts: any[];
  buyerGroups: any[];
  opportunities: any[];
  accounts?: any[];
}

// Time zone and calling information
export interface TimingInfo {
  timeZone: string;
  optimalTime: string;
  callingPriority: number; // 1-5, 5 = call first, 1 = call later in day
  callingWindow: string;
}

// Email engagement analysis
export interface EmailEngagement {
  emailScore: number;
  readyToBuyScore: number;
}
