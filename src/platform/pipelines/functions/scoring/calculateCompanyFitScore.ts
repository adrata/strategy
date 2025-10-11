/**
 * PURE SCORING FUNCTION
 * Calculates Target Company Intelligence (Company Fit Score)
 * 
 * Formula:
 * Company Fit Score = 
 *   (Firmographics × 30%) +
 *   (Innovation Adoption × 25%) +
 *   (Pain Signals × 25%) +
 *   (Buyer Group Quality × 20%)
 */

import type { Company } from '../discovery/discoverCompanies';

export interface CompanyFitScore {
  overall: number;
  firmographics: number;
  innovationAdoption: number;
  painSignals: number;
  buyerGroupQuality: number;
  breakdown: {
    firmographicsWeight: 30;
    innovationWeight: 25;
    painWeight: 25;
    buyerGroupWeight: 20;
  };
}

export interface ScoredCompany extends Company {
  fitScore: CompanyFitScore;
}

/**
 * Calculate company fit score (pure function)
 */
export function calculateCompanyFitScore(
  company: Company,
  data?: {
    innovationSegment?: 'innovators' | 'early_adopters' | 'early_majority' | 'late_majority' | 'laggards';
    painSignals?: string[];
    buyerGroupQuality?: number;
  }
): CompanyFitScore {
  // 1. Firmographics score (30%)
  const firmographicsScore = scoreFirmographics(company);

  // 2. Innovation adoption score (25%)
  const innovationScore = scoreInnovationAdoption(data?.innovationSegment);

  // 3. Pain signals score (25%)
  const painScore = scorePainSignals(data?.painSignals || []);

  // 4. Buyer group quality score (20%)
  const buyerGroupScore = data?.buyerGroupQuality || 50;

  // Calculate weighted overall score
  const overall =
    firmographicsScore * 0.3 +
    innovationScore * 0.25 +
    painScore * 0.25 +
    buyerGroupScore * 0.2;

  return {
    overall: Math.round(overall),
    firmographics: firmographicsScore,
    innovationAdoption: innovationScore,
    painSignals: painScore,
    buyerGroupQuality: buyerGroupScore,
    breakdown: {
      firmographicsWeight: 30,
      innovationWeight: 25,
      painWeight: 25,
      buyerGroupWeight: 20
    }
  };
}

/**
 * Score firmographics (pure function)
 */
function scoreFirmographics(company: Company): number {
  let score = 50; // Base score

  // Industry match
  if (company.industry) {
    const targetIndustries = ['SaaS', 'Technology', 'Software'];
    if (targetIndustries.includes(company.industry)) {
      score += 20;
    }
  }

  // Employee count (sweet spot: 100-5000)
  if (company.employeeCount) {
    if (company.employeeCount >= 100 && company.employeeCount <= 5000) {
      score += 20;
    } else if (company.employeeCount >= 50 && company.employeeCount <= 10000) {
      score += 10;
    }
  }

  // Revenue
  if (company.revenue) {
    if (company.revenue >= 10000000) {
      score += 10;
    }
  }

  return Math.min(100, score);
}

/**
 * Score innovation adoption (pure function)
 */
function scoreInnovationAdoption(
  segment?: 'innovators' | 'early_adopters' | 'early_majority' | 'late_majority' | 'laggards'
): number {
  if (!segment) return 50;

  const scores = {
    innovators: 95,
    early_adopters: 85,
    early_majority: 65,
    late_majority: 40,
    laggards: 20
  };

  return scores[segment];
}

/**
 * Score pain signals (pure function)
 */
function scorePainSignals(signals: string[]): number {
  if (signals.length === 0) return 30;

  // More pain signals = higher score (more likely to buy)
  const baseScore = 40;
  const signalBonus = Math.min(signals.length * 15, 60);

  return Math.min(100, baseScore + signalBonus);
}

/**
 * Sort companies by fit score (pure function)
 */
export function sortCompaniesByFitScore(companies: ScoredCompany[]): ScoredCompany[] {
  return [...companies].sort((a, b) => b.fitScore.overall - a.fitScore.overall);
}

/**
 * Filter companies by minimum fit score (pure function)
 */
export function filterByMinFitScore(
  companies: ScoredCompany[],
  minScore: number
): ScoredCompany[] {
  return companies.filter(c => c.fitScore.overall >= minScore);
}

