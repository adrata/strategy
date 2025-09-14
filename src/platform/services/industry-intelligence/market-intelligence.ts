// Market Intelligence - Extracted from 1,309-line monolithic industry-intelligence.ts

import type { MarketIntelligence, IndustryDefinition } from "./types";
import { industryIntelligence } from "./service";

/**
 * Get comprehensive market intelligence for an industry
 */
export function getMarketIntelligence(
  industryIdentifier: string,
): MarketIntelligence | null {
  return industryIntelligence.getMarketIntelligence(industryIdentifier);
}

/**
 * Get market overview for an industry
 */
export function getMarketOverview(
  industryIdentifier: string,
): MarketIntelligence["overview"] | null {
  const intelligence = getMarketIntelligence(industryIdentifier);
  return intelligence?.overview || null;
}

/**
 * Get competitive landscape for an industry
 */
export function getCompetitiveLandscape(
  industryIdentifier: string,
): MarketIntelligence["competitiveLandscape"] | null {
  const intelligence = getMarketIntelligence(industryIdentifier);
  return intelligence?.competitiveLandscape || null;
}

/**
 * Get industry trends
 */
export function getIndustryTrends(
  industryIdentifier: string,
): MarketIntelligence["trends"] | null {
  const intelligence = getMarketIntelligence(industryIdentifier);
  return intelligence?.trends || null;
}

/**
 * Get buying behavior insights
 */
export function getBuyingBehavior(
  industryIdentifier: string,
): MarketIntelligence["buyingBehavior"] | null {
  const intelligence = getMarketIntelligence(industryIdentifier);
  return intelligence?.buyingBehavior || null;
}
