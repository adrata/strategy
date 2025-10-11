/**
 * ROLE DISCOVERY PIPELINE (Thin Orchestrator)
 * 
 * Coordinates role discovery workflow using pure functions
 * No business logic - just orchestration
 * 
 * NEW: AI-powered role variation generation for ANY role
 */

import {
  validateRoleCriteria,
  type RoleCriteria,
  type EnrichmentLevel
} from '../functions/validation/validateRoleCriteria';
import {
  discoverPeople,
  filterPeople,
  type Person
} from '../functions/discovery/discoverPeople';
import {
  enrichContacts,
  type EnrichedPerson
} from '../functions/enrichment/enrichContacts';
import { generateRoleVariations } from '../functions/roles/generateRoleVariations';
import { getCachedOrGenerate, roleVariationCache } from '../functions/roles/roleVariationCache';
import { getFallbackVariations } from '../functions/roles/commonRoleDefinitions';
import { scoreRoleCandidates } from '../functions/roles/roleIntelligence';
import { searchPeopleByRole } from '../functions/providers/pdl-service';

export interface RoleDiscoveryResult {
  success: boolean;
  people?: EnrichedPerson[];
  metadata?: {
    totalFound: number;
    totalReturned: number;
    enrichmentLevel: EnrichmentLevel;
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
export class RoleDiscoveryPipeline {
  constructor(private apis: APIClients = {}) {}

  /**
   * Discover people by role using AI-powered variation generation
   * Pure orchestration - no business logic
   */
  async discover(criteria: RoleCriteria): Promise<RoleDiscoveryResult> {
    console.log(`\n👤 [ROLE DISCOVERY] Starting AI-powered discovery...`);
    console.log(`   Roles: ${criteria.roles?.join(', ')}`);
    console.log(`   Companies: ${criteria.companies?.length || 0}`);
    console.log(`   Enrichment: ${criteria.enrichmentLevel || 'discover'}`);

    const startTime = Date.now();

    try {
      // Step 1: Validate (pure function)
      const validated = validateRoleCriteria(criteria);

      // Step 2: Generate AI-powered role variations for each role
      console.log(`\n🤖 [AI ROLE GEN] Generating variations for ${validated.roles.length} roles...`);
      const roleVariations = await Promise.all(
        validated.roles.map(async (role) => {
          // Try cache first, then AI, then fallback
          return await getCachedOrGenerate(role, async () => {
            // Try fallback for common roles first (faster)
            const fallback = getFallbackVariations(role);
            if (fallback) {
              console.log(`   ✅ Using fallback variations for: ${role}`);
              return fallback;
            }
            
            // Generate with AI
            return await generateRoleVariations(role, this.apis);
          });
        })
      );

      // Collect all role variations
      const allRoleVariations = roleVariations.flatMap(rv => rv.variations);
      const uniqueVariations = Array.from(new Set(allRoleVariations));
      
      console.log(`   ✅ Generated ${uniqueVariations.length} unique role variations`);
      console.log(`   📊 Variations: ${uniqueVariations.slice(0, 10).join(', ')}${uniqueVariations.length > 10 ? ', ...' : ''}`);

      // Step 3: Discover people using ALL variations (pure function)
      const discovered = await discoverPeople(
        uniqueVariations,
        validated.companies,
        this.apis
      );

      // Step 3.5: Cross-reference with PDL for enhanced discovery
      console.log(`\n🔍 [PDL CROSS-REF] Cross-referencing with People Data Labs...`);
      const pdlResults = await Promise.all(
        validated.roles.map(async (role) => {
          try {
            return await searchPeopleByRole(role, validated.companies, this.apis);
          } catch (error) {
            console.warn(`   ⚠️ PDL search failed for ${role}:`, error instanceof Error ? error.message : 'Unknown error');
            return { people: [], totalFound: 0 };
          }
        })
      );

      // Merge PDL results with discovered people
      const pdlPeople = pdlResults.flatMap(result => result.people);
      const allDiscoveredPeople = [...discovered.people, ...pdlPeople];
      
      // Remove duplicates based on email/name
      const uniquePeople = allDiscoveredPeople.filter((person, index, self) => 
        index === self.findIndex(p => 
          (person.email && p.email && person.email === p.email) ||
          (person.name && p.name && person.name === p.name)
        )
      );

      console.log(`   ✅ PDL found ${pdlPeople.length} additional people`);
      console.log(`   📊 Total unique people: ${uniquePeople.length}`);

      // Step 4: Enrich (pure function)
      const enriched = await enrichContacts(
        uniquePeople,
        validated.enrichmentLevel,
        this.apis
      );

      // Step 5: Filter (pure function)
      const filtered = filterPeople(enriched, validated.filters);

      // Step 6: Score and rank by role match (pure function)
      const scored = scoreRoleCandidates(
        filtered,
        validated.roles[0], // Use first role for scoring
        roleVariations[0]
      );

      // Extract just the candidates
      const rankedPeople = scored.map(s => s.candidate);

      const executionTime = Date.now() - startTime;

      console.log(`\n✅ [ROLE DISCOVERY] Complete (${executionTime}ms)`);
      console.log(`   Total found: ${discovered.totalFound + pdlPeople.length}`);
      console.log(`   After scoring: ${rankedPeople.length}`);

      return {
        success: true,
        people: rankedPeople,
        metadata: {
          totalFound: discovered.totalFound + pdlPeople.length,
          totalReturned: rankedPeople.length,
          enrichmentLevel: validated.enrichmentLevel,
          executionTime,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      console.error(`\n❌ [ROLE DISCOVERY] Error:`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          totalFound: 0,
          totalReturned: 0,
          enrichmentLevel: 'discover',
          executionTime,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
}

