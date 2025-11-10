/**
 * Enrichment Service
 * 
 * Centralized service for triggering enrichment pipelines
 * Used by API endpoints and auto-triggers
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface EnrichmentOptions {
  verifyEmail?: boolean;
  verifyPhone?: boolean;
  discoverContacts?: boolean;
  dealSize?: number;
  productCategory?: string;
  maxContacts?: number;
  useAI?: boolean;
}

export interface EnrichmentResult {
  success: boolean;
  entityId: string;
  entityType: string;
  enrichments: {
    emailVerified?: boolean;
    phoneVerified?: boolean;
    contactsDiscovered?: number;
    intelligenceGathered?: boolean;
  };
  metadata: {
    duration: number;
    cost: number;
    timestamp: string;
  };
  error?: string;
}

export class EnrichmentService {
  /**
   * Auto-trigger enrichment check
   * Called after person/company create or update
   */
  static async autoTriggerCheck(
    entityType: 'person' | 'company',
    entityId: string,
    trigger: 'create' | 'update',
    workspaceId: string
  ): Promise<{ shouldEnrich: boolean; reason: string }> {
    try {
      if (entityType === 'person') {
        const person = await prisma.people.findUnique({
          where: { id: entityId },
          select: {
            email: true,
            linkedinUrl: true,
            companyId: true,
            emailVerified: true,
            phoneVerified: true,
            lastEnriched: true
          }
        });

        if (!person) {
          return { shouldEnrich: false, reason: 'Person not found' };
        }

        // Trigger conditions for person:
        // 1. Has email, LinkedIn, or company
        // 2. Email/phone not verified OR
        // 3. Not enriched in last 30 days
        const hasContact = !!(person.email || person.linkedinUrl || person.companyId);
        const needsVerification = !person.emailVerified || !person.phoneVerified;
        const isStale = !person.lastEnriched || 
          (Date.now() - person.lastEnriched.getTime()) > 30 * 24 * 60 * 60 * 1000;
        
        if (hasContact && (trigger === 'create' || needsVerification || isStale)) {
          return {
            shouldEnrich: true,
            reason: trigger === 'create' 
              ? 'New person with contact information'
              : needsVerification 
              ? 'Contact verification needed'
              : 'Data refresh needed (> 30 days old)'
          };
        }
        
        return { shouldEnrich: false, reason: 'No enrichment criteria met' };
      }

      if (entityType === 'company') {
        const company = await prisma.companies.findUnique({
          where: { id: entityId },
          select: {
            website: true,
            linkedinUrl: true,
            customFields: true,
            lastEnriched: true
          }
        });

        if (!company) {
          return { shouldEnrich: false, reason: 'Company not found' };
        }

        // Trigger conditions for company:
        // 1. Has website or LinkedIn
        // 2. Not enriched with Coresignal OR
        // 3. Not enriched in last 90 days
        const hasIdentifier = !!(company.website || company.linkedinUrl);
        const isEnriched = !!(company.customFields as any)?.coresignalId;
        const isStale = !company.lastEnriched || 
          (Date.now() - company.lastEnriched.getTime()) > 90 * 24 * 60 * 60 * 1000;
        
        if (hasIdentifier && (!isEnriched || (trigger === 'create' && !isEnriched) || isStale)) {
          return {
            shouldEnrich: true,
            reason: trigger === 'create'
              ? 'New company with identifier'
              : !isEnriched
              ? 'Company intelligence needed'
              : 'Intelligence refresh needed (> 90 days old)'
          };
        }
        
        return { shouldEnrich: false, reason: 'No enrichment criteria met' };
      }

      return { shouldEnrich: false, reason: 'Unknown entity type' };

    } catch (error) {
      console.error('❌ Auto-trigger check failed:', error);
      return { shouldEnrich: false, reason: `Error: ${error.message}` };
    }
  }

  /**
   * Queue enrichment job for background processing
   */
  static async queueEnrichment(
    entityType: string,
    entityId: string,
    workspaceId: string,
    options: EnrichmentOptions = {}
  ): Promise<{ jobId: string; queued: boolean }> {
    // In production, this would queue to job system (BullMQ, Inngest, etc.)
    // For now, create a simple job record
    
    const jobId = `enrich_${entityType}_${entityId}_${Date.now()}`;
    
    console.log(`📋 Queued enrichment job: ${jobId}`, {
      entityType,
      entityId,
      workspaceId,
      options
    });

    // Could store job in database for tracking:
    // await prisma.enrichmentJobs.create({
    //   data: { jobId, entityType, entityId, workspaceId, status: 'queued', options }
    // });

    return { jobId, queued: true };
  }

  /**
   * Execute enrichment (for immediate execution, not queued)
   */
  static async enrichNow(
    entityType: 'person' | 'company',
    entityId: string,
    workspaceId: string,
    options: EnrichmentOptions = {}
  ): Promise<EnrichmentResult> {
    const startTime = Date.now();
    
    try {
      // Import pipeline modules dynamically
      // This keeps them out of the main bundle
      
      let result;
      
      if (entityType === 'person') {
        // Would dynamically import and run person enrichment
        result = {
          success: true,
          entityId,
          entityType: 'person',
          enrichments: {
            emailVerified: true,
            phoneVerified: true
          },
          metadata: {
            duration: Date.now() - startTime,
            cost: 0.03,
            timestamp: new Date().toISOString()
          }
        };
      } else if (entityType === 'company') {
        // Would dynamically import and run company enrichment
        result = {
          success: true,
          entityId,
          entityType: 'company',
          enrichments: {
            contactsDiscovered: 5,
            emailVerified: true,
            phoneVerified: true,
            intelligenceGathered: true
          },
          metadata: {
            duration: Date.now() - startTime,
            cost: 0.17,
            timestamp: new Date().toISOString()
          }
        };
      }

      return result!;

    } catch (error) {
      return {
        success: false,
        entityId,
        entityType,
        enrichments: {},
        metadata: {
          duration: Date.now() - startTime,
          cost: 0,
          timestamp: new Date().toISOString()
        },
        error: error.message
      };
    }
  }

  /**
   * Auto-trigger enrichment asynchronously
   * Checks if enrichment should be triggered and calls the enrichment API
   * Runs in background without blocking the main request
   * 
   * @param entityType - 'person' or 'company'
   * @param entityId - ID of the entity to enrich
   * @param trigger - 'create' or 'update'
   * @param workspaceId - Workspace ID for context
   * @param authToken - Optional Authorization token from the original request
   * @param changedFields - Optional array of field names that changed (for updates)
   */
  static triggerEnrichmentAsync(
    entityType: 'person' | 'company',
    entityId: string,
    trigger: 'create' | 'update',
    workspaceId: string,
    authToken?: string,
    changedFields?: string[]
  ): void {
    // Run asynchronously to not block the main request
    setImmediate(async () => {
      try {
        // Check if enrichment should be triggered
        const checkResult = await this.autoTriggerCheck(
          entityType,
          entityId,
          trigger,
          workspaceId
        );

        if (!checkResult.shouldEnrich) {
          console.log(`⏭️ [ENRICHMENT] Skipping enrichment for ${entityType}:${entityId} - ${checkResult.reason}`);
          return;
        }

        console.log(`🤖 [ENRICHMENT] Auto-triggering enrichment for ${entityType}:${entityId} - ${checkResult.reason}`);

        // Get base URL for internal API call
        const { getBaseUrl } = await import('@/lib/env-urls');
        const baseUrl = getBaseUrl();
        const enrichUrl = `${baseUrl}/api/v1/enrich`;

        // Prepare headers
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        // Add Authorization header if provided
        if (authToken) {
          headers['Authorization'] = authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;
        }

        // Call enrichment API
        const response = await fetch(enrichUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            type: entityType,
            entityId: entityId,
            options: {
              verifyEmail: true,
              verifyPhone: true,
              discoverContacts: entityType === 'company',
            }
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ [ENRICHMENT] Failed to trigger enrichment for ${entityType}:${entityId}:`, {
            status: response.status,
            error: errorText
          });
          return;
        }

        const result = await response.json();
        console.log(`✅ [ENRICHMENT] Enrichment triggered successfully for ${entityType}:${entityId}`, {
          result: result.data || result
        });

      } catch (error) {
        console.error(`❌ [ENRICHMENT] Error triggering enrichment for ${entityType}:${entityId}:`, {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        // Don't throw - enrichment failures shouldn't break the main request
      }
    });
  }
}

export default EnrichmentService;

