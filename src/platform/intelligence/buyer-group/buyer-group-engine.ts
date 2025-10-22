/**
 * BUYER GROUP ENGINE
 * 
 * Main orchestrator for world-class buyer group discovery
 * Supports progressive enrichment levels (identify, enrich, deep_research)
 */

import type {
  EnrichmentRequest,
  EnrichmentResult,
  BuyerGroup,
} from '../shared/types';
import { ProgressiveEnrichmentEngine } from './progressive-enrichment';
const BuyerGroupPreviewDiscovery = require('../../pipelines/modules/core/BuyerGroupPreviewDiscovery');

export class BuyerGroupEngine {
  private enrichmentEngine: ProgressiveEnrichmentEngine;
  private previewDiscovery: BuyerGroupPreviewDiscovery;
  private cache: Map<string, EnrichmentResult> = new Map();

  constructor() {
    this.enrichmentEngine = new ProgressiveEnrichmentEngine();
    this.previewDiscovery = new BuyerGroupPreviewDiscovery();
  }

  /**
   * Main discovery method with Preview API enhancement
   */
  async discover(request: EnrichmentRequest): Promise<EnrichmentResult> {
    console.log(
      `\n🎯 [BUYER GROUP ENGINE] Starting discovery for: ${request.companyName}`
    );
    console.log(`   Level: ${request.enrichmentLevel}`);
    console.log(
      `   Estimated Cost: $${this.enrichmentEngine.estimateCost(request.enrichmentLevel).toFixed(2)}`
    );

    // Check cache first
    const cacheKey = this.getCacheKey(request);
    const cached = this.cache.get(cacheKey);

    if (cached) {
      // Check if we can use cached data or need to upgrade
      if (
        cached.enrichmentLevel === request.enrichmentLevel ||
        !this.enrichmentEngine.canUpgrade(cached.enrichmentLevel, request.enrichmentLevel)
      ) {
        console.log(`   💨 Using cached result`);
        return {
          ...cached,
          cacheUtilized: true,
        };
      } else {
        console.log(
          `   ⬆️ Upgrading from ${cached.enrichmentLevel} to ${request.enrichmentLevel}`
        );
      }
    }

    // Use Preview API for comprehensive discovery
    console.log(`   🔍 Using Preview API for comprehensive discovery...`);
    const previewResult = await this.previewDiscovery.discoverBuyerGroup(request.companyName, {
      enrichmentLevel: request.enrichmentLevel,
      website: request.website
    });

    // Process with progressive enrichment
    const result = await this.enrichmentEngine.enrich({
      ...request,
      previewData: previewResult
    });

    // Save to database if requested
    if (request.options?.saveToDatabase !== false && request.workspaceId) {
      const dbId = await this.saveToDatabase(result, request.workspaceId);
      result.databaseId = dbId;
    }

    // Cache the result
    this.cache.set(cacheKey, result);

    console.log(
      `✅ [BUYER GROUP ENGINE] Complete! Members: ${result.buyerGroup.totalMembers}, Time: ${result.processingTime}ms`
    );

    return result;
  }

  /**
   * Batch discovery for multiple companies
   */
  async discoverBatch(
    requests: EnrichmentRequest[]
  ): Promise<EnrichmentResult[]> {
    console.log(
      `\n🚀 [BUYER GROUP ENGINE] Batch discovery for ${requests.length} companies`
    );

    const results: EnrichmentResult[] = [];

    // Process in parallel with concurrency limit
    const BATCH_SIZE = 3;
    for (let i = 0; i < requests.length; i += BATCH_SIZE) {
      const batch = requests.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map((req) => this.discover(req).catch((err) => {
          console.error(`   ❌ Failed to process ${req.companyName}:`, err.message);
          return null;
        }))
      );

      results.push(...batchResults.filter((r): r is EnrichmentResult => r !== null));

      // Rate limiting
      if (i + BATCH_SIZE < requests.length) {
        await this.delay(1000);
      }
    }

    console.log(
      `✅ [BUYER GROUP ENGINE] Batch complete! Processed: ${results.length}/${requests.length}`
    );

    return results;
  }

  /**
   * Save buyer group to database (streamlined approach)
   */
  private async saveToDatabase(
    result: EnrichmentResult,
    workspaceId: string
  ): Promise<string> {
    const { prisma } = await import('@/platform/database/prisma-client');

    try {
      // Update people records with buyer group roles
      for (const member of result.buyerGroup.members) {
        if (!member.email) continue;

        // Find existing person
        const existing = await prisma.people.findFirst({
          where: {
            workspaceId,
            OR: [
              { email: member.email },
              { workEmail: member.email },
              { personalEmail: member.email },
            ],
          },
        });

        if (existing) {
          // Update with buyer group role and membership
          await prisma.people.update({
            where: { id: existing.id },
            data: {
              buyerGroupRole: member.role,
              isBuyerGroupMember: true, // Always set to true when assigning a role
              influenceScore: member.influenceScore || member.confidence || 0,
              updatedAt: new Date(),
            },
          });
        } else {
          // Create new person
          await prisma.people.create({
            data: {
              workspaceId,
              firstName: member.name.split(' ')[0] || '',
              lastName: member.name.split(' ').slice(1).join(' ') || '',
              fullName: member.name,
              jobTitle: member.title || '',
              email: member.email,
              phone: member.phone || null,
              linkedinUrl: member.linkedin || null,
              buyerGroupRole: member.role,
              isBuyerGroupMember: true, // Always set to true when creating with a role
              influenceScore: member.influenceScore || member.confidence || 0,
              status: 'PROSPECT',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
      }

      console.log(
        `   💾 Saved ${result.buyerGroup.members.length} members to database`
      );
      return result.buyerGroup.companyName; // Return company name as ID
    } catch (error) {
      console.error(`   ⚠️ Database save failed:`, error);
      throw error;
    }
  }

  /**
   * Retrieve saved buyer group from database
   */
  async retrieve(
    companyName: string,
    workspaceId: string
  ): Promise<BuyerGroup | null> {
    const { prisma } = await import('@/platform/database/prisma-client');

    const members = await prisma.people.findMany({
      where: {
        workspaceId,
        buyerGroupRole: { not: null },
        company: {
          name: { equals: companyName, mode: 'insensitive' },
        },
      },
      include: { company: true },
      orderBy: { influenceScore: 'desc' },
    });

    if (members.length === 0) return null;

    // Group by role
    const roles = {
      decision: [],
      champion: [],
      stakeholder: [],
      blocker: [],
      introducer: [],
    };

    members.forEach((member) => {
      if (member.buyerGroupRole && roles[member.buyerGroupRole]) {
        roles[member.buyerGroupRole].push({
          id: member.id,
          name: member.fullName || '',
          title: member.jobTitle || '',
          role: member.buyerGroupRole,
          email: member.email || undefined,
          phone: member.phone || undefined,
          linkedin: member.linkedinUrl || undefined,
          confidence: member.influenceScore || 0,
          influenceScore: member.influenceScore || 0,
        });
      }
    });

    return {
      companyName,
      website: members[0]?.company?.website || undefined,
      industry: members[0]?.company?.industry || undefined,
      companySize: members[0]?.company?.size?.toString() || undefined,
      totalMembers: members.length,
      cohesionScore: 0, // TODO: Calculate from data
      overallConfidence:
        members.reduce((sum, m) => sum + (m.influenceScore || 0), 0) /
        members.length,
      roles: roles as any,
      members: roles.decision
        .concat(roles.champion)
        .concat(roles.stakeholder)
        .concat(roles.blocker)
        .concat(roles.introducer) as any,
    };
  }

  /**
   * Helper: Generate cache key
   */
  private getCacheKey(request: EnrichmentRequest): string {
    return `${request.companyName.toLowerCase()}:${request.enrichmentLevel}`;
  }

  /**
   * Helper: Delay for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

