/**
 * PURE ANALYSIS FUNCTION
 * Performs 6-dimensional person intelligence analysis
 */

import type { EnrichedPerson } from '../enrichment/enrichContacts';

export interface PersonIntelligence {
  person: EnrichedPerson;
  innovationProfile?: {
    segment: 'innovators' | 'early_adopters' | 'early_majority' | 'late_majority' | 'laggards';
    score: number;
    signals: string[];
  };
  painAwareness?: {
    activePains: string[];
    urgencyScore: number;
    keywords: string[];
  };
  buyingAuthority?: {
    role: 'decision_maker' | 'champion' | 'stakeholder' | 'blocker' | 'introducer';
    budgetControl: 'very_high' | 'high' | 'moderate' | 'low' | 'none';
    signingLimit?: number;
  };
  influenceNetwork?: {
    reportsTo?: string;
    directReports: number;
    keyRelationships: string[];
    externalInfluence: 'high' | 'moderate' | 'low';
  };
  careerTrajectory?: {
    trend: 'rising_star' | 'stable' | 'declining';
    promotionVelocity: 'very_fast' | 'fast' | 'moderate' | 'slow';
    jobChangeLikelihood: 'high' | 'moderate' | 'low';
  };
  riskProfile?: {
    type: 'aggressive_risk_taker' | 'calculated_risk_taker' | 'moderate_risk' | 'risk_averse';
    decisionStyle: 'analytical_innovator' | 'intuitive_visionary' | 'pragmatic_innovator';
  };
}

export interface AnalysisOptions {
  includeInnovationProfile?: boolean;
  includePainAwareness?: boolean;
  includeBuyingAuthority?: boolean;
  includeInfluenceNetwork?: boolean;
  includeCareerTrajectory?: boolean;
  includeRiskProfile?: boolean;
}

/**
 * Analyze person intelligence across 6 dimensions
 * 
 * Pure function: deterministic analysis based on person data
 */
import type { APIClients } from '../types/api-clients';

export async function analyzePersonIntelligence(
  person: EnrichedPerson,
  options: AnalysisOptions = {},
  apis: APIClients
): Promise<PersonIntelligence> {
  console.log(`🔬 [ANALYZE] Performing person intelligence analysis for ${person.name}`);

  const result: PersonIntelligence = { person };

  // 1. Innovation Profile
  if (options.includeInnovationProfile !== false) {
    result.innovationProfile = analyzeInnovationProfile(person);
  }

  // 2. Pain Awareness
  if (options.includePainAwareness !== false) {
    result.painAwareness = analyzePainAwareness(person);
  }

  // 3. Buying Authority
  if (options.includeBuyingAuthority !== false) {
    result.buyingAuthority = analyzeBuyingAuthority(person);
  }

  // 4. Influence Network
  if (options.includeInfluenceNetwork !== false) {
    result.influenceNetwork = analyzeInfluenceNetwork(person);
  }

  // 5. Career Trajectory
  if (options.includeCareerTrajectory !== false) {
    result.careerTrajectory = analyzeCareerTrajectory(person);
  }

  // 6. Risk Profile
  if (options.includeRiskProfile !== false) {
    result.riskProfile = analyzeRiskProfile(person);
  }

  return result;
}

/**
 * Analyze innovation adoption profile (pure function)
 */
function analyzeInnovationProfile(person: EnrichedPerson) {
  // TODO: Implement actual analysis using Perplexity/AI
  // Look for signals: conference speaking, blog posts, early tech adoption, etc.
  
  const titleLower = person.title.toLowerCase();
  let segment: 'innovators' | 'early_adopters' | 'early_majority' | 'late_majority' | 'laggards' = 'early_majority';
  let score = 50;

  if (titleLower.includes('cto') || titleLower.includes('chief innovation')) {
    segment = 'innovators';
    score = 90;
  } else if (titleLower.includes('vp') || titleLower.includes('director')) {
    segment = 'early_adopters';
    score = 75;
  }

  return {
    segment,
    score,
    signals: ['Title indicates innovation focus']
  };
}

/**
 * Analyze pain awareness (pure function)
 */
function analyzePainAwareness(person: EnrichedPerson) {
  // TODO: Implement actual pain detection
  return {
    activePains: ['scaling_challenges'],
    urgencyScore: 0.7,
    keywords: ['automation', 'efficiency', 'scale']
  };
}

/**
 * Analyze buying authority (pure function)
 */
function analyzeBuyingAuthority(person: EnrichedPerson) {
  const titleLower = person.title.toLowerCase();
  
  let role: 'decision_maker' | 'champion' | 'stakeholder' | 'blocker' | 'introducer' = 'stakeholder';
  let budgetControl: 'very_high' | 'high' | 'moderate' | 'low' | 'none' = 'moderate';

  if (titleLower.includes('ceo') || titleLower.includes('president')) {
    role = 'decision_maker';
    budgetControl = 'very_high';
  } else if (titleLower.includes('cfo') || titleLower.includes('cro')) {
    role = 'decision_maker';
    budgetControl = 'very_high';
  } else if (titleLower.includes('vp')) {
    role = 'decision_maker';
    budgetControl = 'high';
  } else if (titleLower.includes('director')) {
    role = 'champion';
    budgetControl = 'moderate';
  }

  return { role, budgetControl, signingLimit: undefined };
}

/**
 * Analyze influence network (pure function)
 */
function analyzeInfluenceNetwork(person: EnrichedPerson) {
  // TODO: Implement actual network analysis
  return {
    reportsTo: undefined,
    directReports: 5,
    keyRelationships: [],
    externalInfluence: 'moderate' as const
  };
}

/**
 * Analyze career trajectory (pure function)
 */
function analyzeCareerTrajectory(person: EnrichedPerson) {
  // TODO: Implement actual trajectory analysis
  return {
    trend: 'stable' as const,
    promotionVelocity: 'moderate' as const,
    jobChangeLikelihood: 'low' as const
  };
}

/**
 * Analyze risk profile (pure function)
 */
function analyzeRiskProfile(person: EnrichedPerson) {
  // TODO: Implement actual risk profiling
  return {
    type: 'calculated_risk_taker' as const,
    decisionStyle: 'pragmatic_innovator' as const
  };
}

