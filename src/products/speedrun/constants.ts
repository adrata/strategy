// Speedrun Constants - Extracted from 1,958-line monolithic SpeedrunRanking.ts

import type { SnoozeOption } from "./types";

// Ranking weights based on strategy
export const STRATEGY_WEIGHTS = {
  optimal: { speed: 0.7, revenue: 0.3 },
  speed: { speed: 0.9, revenue: 0.1 },
  revenue: { speed: 0.2, revenue: 0.8 },
};

// Role-based weekly targets
export const DEFAULT_WEEKLY_TARGETS = {
  AE: 400,
  SDR: 25,
  CSM: 10,
  VP: 8,
  other: 400,
};

// Role-based daily targets (roughly weekly / 4 working days)
export const DEFAULT_DAILY_TARGETS = {
  AE: 30,
  SDR: 5,
  CSM: 2,
  VP: 2,
  other: 30,
};

// Company size revenue multipliers
export const COMPANY_SIZE_MULTIPLIERS = {
  Enterprise: 3.0,
  "Mid-Market": 1.5,
  SMB: 1.0,
};

// Buyer group role influence scores
export const BUYER_GROUP_ROLE_SCORES = {
  Champion: 10,
  "Decision Maker": 9,
  Stakeholder: 6,
  Blocker: 4,
  Opener: 3,
  Influencer: 5,
};

// Relationship warmth scores
export const RELATIONSHIP_SCORES = {
  Hot: 10,
  Warm: 8,
  Building: 6,
  Neutral: 4,
  Cold: 2,
};

// Deal stage urgency scores
export const STAGE_URGENCY_SCORES = {
  Negotiate: 10,
  Proposal: 9,
  Demo: 8,
  Discovery: 6,
  Qualified: 5,
  Contacted: 4,
  New: 3,
};

// Predefined snooze options
export const SNOOZE_OPTIONS: SnoozeOption[] = [
  {
    id: "hour",
    label: "1 Hour",
    duration: 60 * 60 * 1000, // 1 hour in milliseconds
    type: "preset",
  },
  {
    id: "day",
    label: "1 Day",
    duration: 24 * 60 * 60 * 1000, // 1 day in milliseconds
    type: "preset",
  },
  {
    id: "week",
    label: "1 Week",
    duration: 7 * 24 * 60 * 60 * 1000, // 1 week in milliseconds
    type: "preset",
  },
  {
    id: "custom",
    label: "Pick Date",
    duration: 0, // Will be set dynamically
    type: "custom",
  },
];

// Source-based bonuses for add to speedrun scoring
export const SOURCE_BONUS = {
  chat: 15, // High priority - active conversation
  meeting: 20, // Very high - just met them
  inbound: 25, // Highest - they reached out
  manual: 10, // Medium - manually added
  import: 5, // Low - bulk import
  enrichment: 8, // Low-medium - discovered via enrichment
};

// Urgent keywords for priority detection
export const URGENT_KEYWORDS = [
  "urgent",
  "asap",
  "immediate",
  "today",
  "emergency",
];

// Time zone priorities for calling optimization
export const TIMEZONE_CALLING_PRIORITY = {
  "America/New_York": 5, // Eastern Time - highest priority (same as ET)
  "America/Chicago": 4, // Central Time - high priority
  "America/Denver": 3, // Mountain Time - medium priority
  "America/Los_Angeles": 3, // Pacific Time - medium priority
  "Europe/London": 2, // UK Time - lower priority (early morning calls)
  "Europe/Paris": 2, // EU Time - lower priority
  "Asia/Tokyo": 1, // Asian Time - lowest priority (very early/late calls)
  "Asia/Singapore": 1, // Asian Time - lowest priority
  "Australia/Sydney": 1, // Australian Time - lowest priority
  default: 3, // Unknown timezone - medium priority
};

// Default daily target for lead generation
export const DAILY_TARGET = 30;

// Email engagement score thresholds
export const EMAIL_ENGAGEMENT_THRESHOLDS = {
  HIGH: 80,
  MEDIUM: 50,
  LOW: 20,
};

// Ready to buy score thresholds
export const READY_TO_BUY_THRESHOLDS = {
  HIGH: 70,
  MEDIUM: 40,
  LOW: 15,
};

// Deal value normalization constants
export const DEAL_VALUE_NORMALIZATION = {
  BASELINE: 100000, // $100K baseline for scoring
  MAX_MULTIPLIER: 10, // Maximum deal value multiplier
};

// Freshness factor decay constants
export const FRESHNESS_DECAY = {
  HALF_LIFE_DAYS: 30, // Half-life for freshness decay
  MIN_FRESHNESS: 0.1, // Minimum freshness factor
};

// Company ranking score weights
export const COMPANY_RANKING_WEIGHTS = {
  TOTAL_PIPELINE_VALUE: 0.4, // 40% of company score
  AVERAGE_DEAL_SIZE: 0.25, // 25% of company score
  ACTIVE_DEALS_MOMENTUM: 0.2, // 20% of company score
  HIGH_INFLUENCE_CONTACTS: 0.1, // 10% of company score
  COMPANY_SIZE_MULTIPLIER: 0.05, // 5% of company score
};

// Individual ranking score weights within companies
export const INDIVIDUAL_RANKING_WEIGHTS = {
  ROLE_INFLUENCE: 0.4, // 40% of individual score
  RELATIONSHIP_WARMTH: 0.25, // 25% of individual score
  TIMING_URGENCY: 0.2, // 20% of individual score
  EMAIL_ENGAGEMENT: 0.1, // 10% of individual score
  FRESHNESS_FACTOR: 0.05, // 5% of individual score
};
