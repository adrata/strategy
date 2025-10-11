/**
 * COMPANY DISCOVERY PIPELINE (Thin Orchestrator)
 * 
 * Coordinates company discovery workflow using pure functions
 * No business logic - just orchestration
 */

import {
  validateCompanyDiscoveryCriteria,
  type CompanyDiscoveryCriteria
} from '../functions/validation/validateCompanyDiscoveryCriteria';
import {
  discoverCompanies,
  filterCompanies,
  type Company
} from '../functions/discovery/discoverCompanies';
import {
  calculateCompanyFitScore,
  filterByMinFitScore,
  sortCompaniesByFitScore,
  type ScoredCompany
} from '../functions/scoring/calculateCompanyFitScore';

export interface CompanyDiscoveryResult {
  success: boolean;
  companies?: ScoredCompany[];
  metadata?: {
    totalFound: number;
    totalReturned: number;
    averageFitScore: number;
    executionTime: number;
    timestamp: string;
  };
  error?: string;
}

import type { APIClients } from '../functions/types/api-clients';

/**
 * THIN ORCHESTRATOR
 * Just coordinates - all logic in pure functions
 */
export class CompanyDiscoveryPipeline {
  constructor(private apis: APIClients = {}) {}

  /**
   * Discover companies matching criteria
   * Pure orchestration - no business logic
   */
  async discover(criteria: CompanyDiscoveryCriteria): Promise<CompanyDiscoveryResult> {
    console.log(`\n🏢 [COMPANY DISCOVERY] Starting discovery...`);

    const startTime = Date.now();

    try {
      // Step 1: Validate (pure function)
      const validated = validateCompanyDiscoveryCriteria(criteria);

      // Step 2: Discover (pure function)
      const discovered = await discoverCompanies(validated, this.apis);

      // Step 3: Filter by firmographics (pure function)
      const filtered = filterCompanies(discovered.companies, validated);

      // Step 4: Score each company (pure function)
      const scored: ScoredCompany[] = filtered.map(company => {
        const fitScore = calculateCompanyFitScore(company, {
          innovationSegment: validated.innovationProfile?.segment,
          painSignals: validated.painSignals,
          buyerGroupQuality: undefined // Would be calculated if needed
        });

        return { ...company, fitScore };
      });

      // Step 5: Filter by minimum score (pure function)
      const minScoreFiltered = validated.minCompanyFitScore
        ? filterByMinFitScore(scored, validated.minCompanyFitScore)
        : scored;

      // Step 6: Sort by fit score (pure function)
      const sorted = sortCompaniesByFitScore(minScoreFiltered);

      // Step 7: Apply limit
      const limited = validated.limit
        ? sorted.slice(0, validated.limit)
        : sorted;

      const executionTime = Date.now() - startTime;

      // Calculate average fit score (pure calculation)
      const averageFitScore =
        limited.length > 0
          ? Math.round(
              limited.reduce((sum, c) => sum + c.fitScore.overall, 0) / limited.length
            )
          : 0;

      console.log(`\n✅ [COMPANY DISCOVERY] Complete (${executionTime}ms)`);
      console.log(`   Total found: ${discovered.totalFound}`);
      console.log(`   After scoring: ${limited.length}`);
      console.log(`   Average fit score: ${averageFitScore}`);

      return {
        success: true,
        companies: limited,
        metadata: {
          totalFound: discovered.totalFound,
          totalReturned: limited.length,
          averageFitScore,
          executionTime,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      console.error(`\n❌ [COMPANY DISCOVERY] Error:`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          totalFound: 0,
          totalReturned: 0,
          averageFitScore: 0,
          executionTime,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
}

