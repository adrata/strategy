/**
 * ROLE INTELLIGENCE SERVICE
 * 
 * Intelligent role matching, scoring, and tier detection
 * Pure functions for role analysis
 */

import type { RoleVariations } from './generateRoleVariations';
import { normalizeRoleTitle } from './generateRoleVariations';

// ============================================================================
// TYPES
// ============================================================================

export interface RoleMatch {
  matched: boolean;
  tier: number;
  confidence: number;
  matchedVariation: string;
  exactMatch: boolean;
}

export interface ScoredCandidate<T = any> {
  candidate: T;
  roleMatch: RoleMatch;
  overallScore: number;
  ranking: number;
}

// ============================================================================
// ROLE MATCHING
// ============================================================================

/**
 * Match a job title against role variations
 * 
 * @example
 * const match = matchRoleTitle('VP Marketing', marketingVariations);
 * // Returns: { matched: true, tier: 2, confidence: 95, ... }
 */
export function matchRoleTitle(
  title: string,
  variations: RoleVariations
): RoleMatch {
  const normalizedTitle = normalizeRoleTitle(title);
  
  // Check for exact match in each tier
  for (const [tierKey, tierVariations] of Object.entries(variations.tiers)) {
    const tierNum = parseInt(tierKey.replace('tier', ''));
    
    for (const variation of tierVariations) {
      const normalizedVariation = normalizeRoleTitle(variation);
      
      // Exact match
      if (normalizedTitle === normalizedVariation) {
        return {
          matched: true,
          tier: tierNum,
          confidence: 100,
          matchedVariation: variation,
          exactMatch: true
        };
      }
      
      // Partial match
      if (normalizedTitle.includes(normalizedVariation) || normalizedVariation.includes(normalizedTitle)) {
        return {
          matched: true,
          tier: tierNum,
          confidence: 85,
          matchedVariation: variation,
          exactMatch: false
        };
      }
    }
  }
  
  // Fuzzy match (last resort)
  const fuzzyMatch = findFuzzyMatch(title, variations);
  if (fuzzyMatch) {
    return fuzzyMatch;
  }
  
  // No match
  return {
    matched: false,
    tier: 5,
    confidence: 0,
    matchedVariation: '',
    exactMatch: false
  };
}

/**
 * Find fuzzy match using word overlap
 */
function findFuzzyMatch(
  title: string,
  variations: RoleVariations
): RoleMatch | null {
  const titleWords = normalizeRoleTitle(title).split(' ');
  
  for (const [tierKey, tierVariations] of Object.entries(variations.tiers)) {
    const tierNum = parseInt(tierKey.replace('tier', ''));
    
    for (const variation of tierVariations) {
      const variationWords = normalizeRoleTitle(variation).split(' ');
      const overlap = titleWords.filter(word => variationWords.includes(word));
      
      // If 60%+ words overlap, consider it a fuzzy match
      const overlapPercent = (overlap.length / Math.max(titleWords.length, variationWords.length)) * 100;
      
      if (overlapPercent >= 60) {
        return {
          matched: true,
          tier: tierNum,
          confidence: Math.round(overlapPercent),
          matchedVariation: variation,
          exactMatch: false
        };
      }
    }
  }
  
  return null;
}

// ============================================================================
// ROLE SCORING
// ============================================================================

/**
 * Score multiple candidates for a role
 * 
 * @example
 * const scored = scoreRoleCandidates(people, 'VP Marketing', variations);
 * // Returns candidates sorted by score, with tier and confidence
 */
export function scoreRoleCandidates<T extends { title: string }>(
  candidates: T[],
  targetRole: string,
  variations: RoleVariations
): ScoredCandidate<T>[] {
  // Score each candidate
  const scored = candidates.map(candidate => {
    const roleMatch = matchRoleTitle(candidate.title, variations);
    const overallScore = calculateOverallScore(roleMatch);
    
    return {
      candidate,
      roleMatch,
      overallScore,
      ranking: 0 // Will be set after sorting
    };
  });
  
  // Sort by score (highest first)
  scored.sort((a, b) => b.overallScore - a.overallScore);
  
  // Assign rankings
  scored.forEach((item, index) => {
    item.ranking = index + 1;
  });
  
  return scored;
}

/**
 * Calculate overall score from role match
 */
function calculateOverallScore(roleMatch: RoleMatch): number {
  if (!roleMatch.matched) return 0;
  
  // Base score from confidence
  let score = roleMatch.confidence;
  
  // Tier bonus (higher tier = higher score)
  const tierBonus = (5 - roleMatch.tier) * 5; // Tier 1 = +20, Tier 2 = +15, etc.
  score += tierBonus;
  
  // Exact match bonus
  if (roleMatch.exactMatch) {
    score += 10;
  }
  
  return Math.min(100, score);
}

// ============================================================================
// TIER DETECTION
// ============================================================================

/**
 * Determine role tier from title (without variations)
 * 
 * @example
 * getRoleTier('Chief Marketing Officer') → 1
 * getRoleTier('VP Marketing') → 2
 * getRoleTier('Marketing Director') → 3
 */
export function getRoleTier(title: string): number {
  const normalized = normalizeRoleTitle(title);
  
  // Tier 1: C-Level
  if (
    normalized.includes('chief') ||
    normalized.match(/\bc[a-z]o\b/) || // CMO, CFO, CTO, etc.
    normalized === 'ceo' ||
    normalized === 'president'
  ) {
    return 1;
  }
  
  // Tier 2: VP-Level
  if (
    normalized.includes('vice president') ||
    normalized.includes('vp ') ||
    normalized.includes('svp') ||
    normalized.includes('evp')
  ) {
    return 2;
  }
  
  // Tier 3: Director-Level
  if (
    normalized.includes('director') ||
    normalized.includes('head of')
  ) {
    return 3;
  }
  
  // Tier 4: Manager-Level
  if (
    normalized.includes('manager') ||
    normalized.includes('lead')
  ) {
    return 4;
  }
  
  // Default: Tier 5 (Individual Contributor or unknown)
  return 5;
}

/**
 * Get tier name from tier number
 */
export function getTierName(tier: number): string {
  const tierNames: Record<number, string> = {
    1: 'C-Level',
    2: 'VP-Level',
    3: 'Director-Level',
    4: 'Manager-Level',
    5: 'Individual Contributor'
  };
  
  return tierNames[tier] || 'Unknown';
}

// ============================================================================
// ROLE COMPARISON
// ============================================================================

/**
 * Compare two role titles to see if they match
 */
export function compareRoleTitles(title1: string, title2: string): {
  match: boolean;
  similarity: number;
} {
  const norm1 = normalizeRoleTitle(title1);
  const norm2 = normalizeRoleTitle(title2);
  
  // Exact match
  if (norm1 === norm2) {
    return { match: true, similarity: 100 };
  }
  
  // Word overlap similarity
  const words1 = norm1.split(' ');
  const words2 = norm2.split(' ');
  const overlap = words1.filter(word => words2.includes(word));
  
  const similarity = (overlap.length / Math.max(words1.length, words2.length)) * 100;
  
  return {
    match: similarity >= 60,
    similarity: Math.round(similarity)
  };
}

/**
 * Filter candidates by minimum tier
 */
export function filterByMinimumTier<T extends { title: string }>(
  candidates: T[],
  minTier: number
): T[] {
  return candidates.filter(candidate => getRoleTier(candidate.title) <= minTier);
}

/**
 * Filter candidates by exact tier
 */
export function filterByTier<T extends { title: string }>(
  candidates: T[],
  tier: number
): T[] {
  return candidates.filter(candidate => getRoleTier(candidate.title) === tier);
}

