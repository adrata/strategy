// Scoring Algorithms - Extracted from 1,958-line monolithic SpeedrunRanking.ts

import type { CRMRecord } from "../types";
import type {
  RankedContact,
  SpeedrunUserSettings,
  EmailEngagement,
} from "./types";
import {
  COMPANY_SIZE_MULTIPLIERS,
  BUYER_GROUP_ROLE_SCORES,
  RELATIONSHIP_SCORES,
  STAGE_URGENCY_SCORES,
  STRATEGY_WEIGHTS,
  DEAL_VALUE_NORMALIZATION,
  FRESHNESS_DECAY,
} from "./constants";

/**
 * Calculate days since last contact
 */
export function calculateDaysSinceContact(lastContactDate?: string): number {
  if (!lastContactDate) return 999; // Very high number if never contacted

  const lastContact = new Date(lastContactDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastContact.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Calculate freshness factor (how "fresh" this lead is for the user)
 */
export function calculateFreshnessFactor(leadId: string): number {
  // Check if this lead has been shown to the user recently
  const viewedHistory = localStorage.getItem(`lead-viewed-${leadId}`);

  if (!viewedHistory) {
    return 1.0; // Brand new lead, maximum freshness
  }

  const lastViewed = new Date(viewedHistory);
  const now = new Date();
  const daysSinceViewed = Math.floor(
    (now.getTime() - lastViewed.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Exponential decay with half-life of 30 days
  const freshness = Math.max(
    FRESHNESS_DECAY.MIN_FRESHNESS,
    Math.pow(0.5, daysSinceViewed / FRESHNESS_DECAY.HALF_LIFE_DAYS),
  );

  return freshness;
}

/**
 * Determine company size from record data
 */
export function determineCompanySize(
  record: CRMRecord,
): "Enterprise" | "Mid-Market" | "SMB" {
  // Look for size indicators in various fields
  const sizeIndicators = [
    record.size,
    record.industry,
    record.notes,
    record.value,
  ]
    .join(" ")
    .toLowerCase();

  if (
    sizeIndicators.includes("enterprise") ||
    sizeIndicators.includes("large") ||
    sizeIndicators.includes("fortune")
  ) {
    return "Enterprise";
  }

  if (
    sizeIndicators.includes("mid-market") ||
    sizeIndicators.includes("medium") ||
    sizeIndicators.includes("growing")
  ) {
    return "Mid-Market";
  }

  return "SMB";
}

/**
 * Extract deal value from record
 */
export function extractDealValue(record: CRMRecord): number {
  // Try to extract numeric value from value field
  const valueStr = record.value || record.dealValue || record.revenue || "0";
  const numericValue = parseFloat(valueStr.replace(/[^\d.]/g, ""));

  return isNaN(numericValue) ? 0 : numericValue;
}

/**
 * Detect buying signals from record data
 */
export function detectBuyingSignals(record: CRMRecord): number {
  let signals = 0;
  const allText = [
    record.notes,
    record.nextAction,
    record.recentActivity,
    record.title,
    record.company,
  ]
    .join(" ")
    .toLowerCase();

  // Positive buying signals
  const positiveSignals = [
    "budget",
    "purchase",
    "buying",
    "evaluate",
    "demo",
    "trial",
    "pilot",
    "proposal",
    "quote",
    "pricing",
    "contract",
    "decision",
    "urgent",
    "timeline",
    "deadline",
    "q4",
    "q1",
    "fiscal",
    "approved",
    "authorized",
  ];

  positiveSignals.forEach((signal) => {
    if (allText.includes(signal)) {
      signals += 1;
    }
  });

  // Negative signals (reduce score)
  const negativeSignals = [
    "not interested",
    "no budget",
    "happy with current",
    "not ready",
    "maybe next year",
    "on hold",
    "postponed",
    "cancelled",
  ];

  negativeSignals.forEach((signal) => {
    if (allText.includes(signal)) {
      signals -= 2;
    }
  });

  return Math.max(0, signals);
}

/**
 * Detect email engagement and ready-to-buy signals
 */
export function detectEmailEngagement(record: CRMRecord): EmailEngagement {
  const allText = [
    record.notes,
    record.nextAction,
    record.recentActivity,
    record.lastEmail,
  ]
    .join(" ")
    .toLowerCase();

  let emailScore = 0;
  let readyToBuyScore = 0;

  // Email engagement indicators
  const engagementIndicators = [
    "replied",
    "responded",
    "opened",
    "clicked",
    "forwarded",
    "scheduled",
    "meeting",
    "call",
    "interested",
    "question",
    "more info",
  ];

  engagementIndicators.forEach((indicator) => {
    if (allText.includes(indicator)) {
      emailScore += 10;
    }
  });

  // Ready-to-buy indicators
  const buyingIndicators = [
    "budget",
    "purchase",
    "buy",
    "decision",
    "evaluate",
    "demo",
    "trial",
    "proposal",
    "quote",
    "pricing",
    "contract",
    "urgent",
    "timeline",
    "deadline",
    "approve",
    "authorize",
    "sign",
    "close",
  ];

  buyingIndicators.forEach((indicator) => {
    if (allText.includes(indicator)) {
      readyToBuyScore += 8;
    }
  });

  // 🎯 FIX: Recent activity bonus - only give bonus if it's been a while (not same day)
  if (record.lastActionDate) {
    const daysSince = calculateDaysSinceContact(record.lastActionDate);
    // Only give bonus if contacted 7-30 days ago (not too recent)
    if (daysSince > 7 && daysSince <= 14) {
      emailScore += 10;
      readyToBuyScore += 10;
    } else if (daysSince > 14 && daysSince <= 30) {
      emailScore += 5;
      readyToBuyScore += 5;
    }
    // No bonus for very recent contact (0-7 days) - let the penalty apply
  }

  return {
    emailScore: Math.min(emailScore, 100),
    readyToBuyScore: Math.min(readyToBuyScore, 100),
  };
}

/**
 * Calculate timing urgency score
 * 🎯 FIX: Penalize recent contact, reward people who need attention
 */
export function calculateTimingUrgency(
  record: CRMRecord,
  daysSinceContact: number,
): number {
  let urgencyScore = 0;

  // 🎯 PENALTY for recent contact (they've been handled recently)
  if (daysSinceContact === 0) urgencyScore -= 30;        // Contacted today = -30
  else if (daysSinceContact === 1) urgencyScore -= 20;   // Yesterday = -20
  else if (daysSinceContact <= 3) urgencyScore -= 15;    // 2-3 days ago = -15
  else if (daysSinceContact <= 7) urgencyScore -= 10;    // This week = -10
  // 🎯 BONUS for people who need attention (longer without contact = higher urgency)
  else if (daysSinceContact >= 30) urgencyScore += 15;   // 30+ days = +15
  else if (daysSinceContact >= 14) urgencyScore += 10;   // 14-29 days = +10
  else if (daysSinceContact >= 7) urgencyScore += 5;     // 7-13 days = +5

  // Deal stage urgency
  const stageScore =
    STAGE_URGENCY_SCORES[
      record.dealStage as keyof typeof STAGE_URGENCY_SCORES
    ] || 0;
  urgencyScore += stageScore;

  // Next action urgency
  if (record.nextAction) {
    const nextActionText = record.nextAction.toLowerCase();
    if (nextActionText.includes("urgent") || nextActionText.includes("asap")) {
      urgencyScore += 15;
    } else if (
      nextActionText.includes("follow up") ||
      nextActionText.includes("call")
    ) {
      urgencyScore += 8;
    }
  }

  return urgencyScore;
}

/**
 * Calculate speed-focused score (quick wins)
 * 🎯 FIX: Penalize recent contact, reward people who need attention
 */
export function calculateSpeedScore(contact: RankedContact): number {
  let speedScore = 0;

  // Relationship warmth (easier to connect)
  const relationshipScore =
    RELATIONSHIP_SCORES[
      contact.relationship as keyof typeof RELATIONSHIP_SCORES
    ] || 0;
  speedScore += relationshipScore;

  // 🎯 FIX: Penalize recent contact, reward people who need attention
  if (contact.daysSinceLastContact === 0) speedScore -= 25;      // Contacted today = -25
  else if (contact.daysSinceLastContact === 1) speedScore -= 15; // Yesterday = -15
  else if (contact.daysSinceLastContact <= 7) speedScore -= 10;  // This week = -10
  else if (contact.daysSinceLastContact >= 30) speedScore += 10; // 30+ days = +10
  else if (contact.daysSinceLastContact >= 14) speedScore += 5;  // 14-29 days = +5

  // Email engagement (responsive)
  speedScore += (contact.emailEngagementScore || 0) * 0.1;

  // Deal stage (close to conversion)
  if (contact['dealStage'] === "Demo" || contact['dealStage'] === "Proposal")
    speedScore += 8;
  else if (contact['dealStage'] === "Qualified") speedScore += 6;

  // Freshness factor - prioritize leads they haven't seen recently
  speedScore += (contact.freshnessFactor || 0) * 5;

  return speedScore;
}

/**
 * Calculate revenue-focused score (prioritizes big deals)
 */
export function calculateRevenueScore(contact: RankedContact): number {
  let revenueScore = 0;

  // Deal value (normalized to 0-10 scale)
  const dealValue = contact.estimatedDealValue || 0;
  const normalizedValue = Math.min(
    dealValue / DEAL_VALUE_NORMALIZATION.BASELINE,
    DEAL_VALUE_NORMALIZATION.MAX_MULTIPLIER,
  );
  revenueScore += normalizedValue * 3;

  // Company size (bigger companies = bigger deals)
  const sizeMultiplier =
    COMPANY_SIZE_MULTIPLIERS[
      contact.companySize as keyof typeof COMPANY_SIZE_MULTIPLIERS
    ] || 1;
  revenueScore += sizeMultiplier * 2;

  // Deal probability
  if (contact.probability) {
    revenueScore += (contact.probability / 100) * 3;
  }

  // Buyer group role influence
  const roleScore =
    BUYER_GROUP_ROLE_SCORES[
      contact.buyerGroupRole as keyof typeof BUYER_GROUP_ROLE_SCORES
    ] || 0;
  revenueScore += roleScore * 0.2;

  // Enterprise influence level
  if (contact['influence'] === "High") revenueScore += 3;
  else if (contact['influence'] === "Medium") revenueScore += 1;

  // Freshness factor - prioritize leads they haven't seen recently
  revenueScore += (contact.freshnessFactor || 0) * 3;

  return revenueScore;
}

/**
 * Generate enhanced ranking reason
 */
export function generateEnhancedRankingReason(
  contact: RankedContact,
  settings: SpeedrunUserSettings,
): string {
  const reasons = [];
  const priority = [];
  
  // Relationship status
  if (contact['relationship'] === "Hot") {
    priority.push("hot contact");
  } else if (contact['relationship'] === "Warm") {
    priority.push("warm contact");
  } else if (contact['relationship'] === "Cold") {
    priority.push("cold prospect");
  }

  // Decision making power
  if (contact['buyerGroupRole'] === "Decision Maker") {
    reasons.push("decision maker");
  } else if (contact['buyerGroupRole'] === "Champion") {
    reasons.push("internal champion");
  }

  // Deal stage urgency
  if (contact['dealStage'] === "Negotiate" || contact['dealStage'] === "Proposal") {
    reasons.push("late stage deal");
  }

  // Company size importance
  if (contact['companySize'] === "Enterprise") {
    reasons.push("enterprise account");
  }

  // Activity timing
  if (contact.daysSinceLastContact <= 3) {
    reasons.push("responded recently");
  } else if (contact.daysSinceLastContact > 30) {
    reasons.push("needs re-engagement");
  }

  // Engagement level
  if ((contact.emailEngagementScore || 0) > 70) {
    reasons.push("highly engaged");
  }

  // Buying readiness
  if ((contact.readyToBuyScore || 0) > 60) {
    reasons.push("ready to buy");
  }

  // Executive level contact
  const title = (contact.title || '').toLowerCase();
  if (title.includes('ceo') || title.includes('president') || title.includes('founder')) {
    reasons.push("C-level executive");
  } else if (title.includes('vp') || title.includes('vice president') || title.includes('director')) {
    reasons.push("senior executive");
  }

  // Build human-readable explanation
  const priorityText = priority.length > 0 ? priority[0] : "contact";
  const reasonText = reasons.length > 0 ? reasons.slice(0, 2).join(", ") : "standard priority";
  
  // Determine overall priority level
  let priorityLevel = "Medium priority";
  if (contact.rankingScore >= 70) {
    priorityLevel = "High priority";
  } else if (contact.rankingScore >= 90) {
    priorityLevel = "Critical priority";
  }
  
  return `${priorityLevel}: ${priorityText}${reasons.length > 0 ? ', ' + reasonText : ''}`;
}

/**
 * Calculate combined ranking score based on strategy
 */
export function calculateCombinedScore(
  contact: RankedContact,
  settings: SpeedrunUserSettings,
): number {
  const speedScore = calculateSpeedScore(contact);
  const revenueScore = calculateRevenueScore(contact);

  const weights = STRATEGY_WEIGHTS[settings.strategy];
  const combinedScore =
    speedScore * weights.speed + revenueScore * weights.revenue;

  return combinedScore;
}

/**
 * Calculate individual scoring within company context
 */
export function calculateIndividualScore(
  contact: RankedContact,
  settings: SpeedrunUserSettings,
): number {
  let individualScore = 0;

  // Role influence (40% of individual score)
  if (contact['buyerGroupRole'] === "Decision Maker") individualScore += 20;
  else if (contact['buyerGroupRole'] === "Champion") individualScore += 15;
  else if (contact['buyerGroupRole'] === "Stakeholder") individualScore += 10;
  else individualScore += 5;

  // Relationship warmth (25% of individual score)
  const relationshipScore =
    RELATIONSHIP_SCORES[
      contact.relationship as keyof typeof RELATIONSHIP_SCORES
    ] || 0;
  individualScore += relationshipScore * 0.5;

  // Timing urgency (20% of individual score)
  const timingScore = calculateTimingUrgency(
    contact,
    contact.daysSinceLastContact,
  );
  individualScore += timingScore * 0.4;

  // Email engagement (10% of individual score)
  individualScore += (contact.emailEngagementScore || 0) * 0.1;

  // Freshness factor (5% of individual score)
  individualScore += (contact.freshnessFactor || 0) * 2;

  return individualScore;
}
