/**
 * PIPELINE PURE FUNCTIONS
 * 
 * Reusable, idempotent functions for data pipelines
 * Following 2025 best practices: pure, testable, composable
 */

import crypto from 'crypto';
import type { PipelineContext, PipelineStep } from '@/platform/intelligence/shared/orchestration';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate idempotency key from input
 */
export function generateIdempotencyKey(input: Record<string, any>): string {
  const normalized = JSON.stringify(input, Object.keys(input).sort());
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Normalize company name for comparison
 */
export function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate company input
 */
export const validateCompanyInput: PipelineStep<
  { companyName: string; website?: string },
  { companyName: string; website?: string }
> = {
  name: 'validateCompanyInput',
  description: 'Validate and normalize company input',
  idempotencyKey: (input) => generateIdempotencyKey(input),
  retryable: false, // No need to retry validation
  
  async execute(input, context) {
    console.log(`🔍 [VALIDATE] Validating: ${input.companyName}`);
    
    // Validate company name
    if (!input.companyName || typeof input.companyName !== 'string') {
      throw new Error('Company name is required');
    }
    
    const trimmedName = input.companyName.trim();
    
    if (trimmedName.length < 2) {
      throw new Error('Company name must be at least 2 characters');
    }
    
    if (trimmedName.length > 200) {
      throw new Error('Company name must be less than 200 characters');
    }
    
    // Validate website if provided
    if (input.website) {
      const trimmedWebsite = input.website.trim();
      
      if (!isValidUrl(trimmedWebsite) && !trimmedWebsite.includes('.')) {
        throw new Error('Invalid website URL format');
      }
      
      return {
        companyName: trimmedName,
        website: trimmedWebsite
      };
    }
    
    return {
      companyName: trimmedName,
      website: undefined
    };
  }
};

// ============================================================================
// CACHE FUNCTIONS
// ============================================================================

/**
 * Check cache for existing buyer group data
 */
export const checkCacheStep: PipelineStep<
  { companyName: string; enrichmentLevel: string },
  { companyName: string; enrichmentLevel: string; cached?: any }
> = {
  name: 'checkCache',
  description: 'Check cache for existing buyer group',
  idempotencyKey: (input) => `cache:${generateIdempotencyKey(input)}`,
  retryable: true,
  
  async execute(input, context) {
    console.log(`💾 [CACHE] Checking cache for: ${input.companyName}`);
    
    const cacheKey = `buyer-group:${normalizeCompanyName(input.companyName)}:${input.enrichmentLevel}`;
    
    // TODO: Implement actual cache lookup (Redis/Memory)
    // const cached = await redis.get(cacheKey);
    const cached = null;
    
    if (cached) {
      console.log(`✅ [CACHE] Hit for ${input.companyName}`);
      return { ...input, cached };
    }
    
    console.log(`❌ [CACHE] Miss for ${input.companyName}`);
    return { ...input, cached: undefined };
  }
};

/**
 * Update cache with new data
 */
export const updateCacheStep: PipelineStep<
  { companyName: string; enrichmentLevel: string; data: any },
  { companyName: string; data: any }
> = {
  name: 'updateCache',
  description: 'Update cache with new buyer group data',
  idempotencyKey: (input) => `cache-update:${generateIdempotencyKey(input)}`,
  retryable: true,
  
  async execute(input, context) {
    console.log(`💾 [CACHE] Updating cache for: ${input.companyName}`);
    
    const cacheKey = `buyer-group:${normalizeCompanyName(input.companyName)}:${input.enrichmentLevel}`;
    const ttl = 3600; // 1 hour
    
    // TODO: Implement actual cache update (Redis/Memory)
    // await redis.set(cacheKey, JSON.stringify(input.data), { EX: ttl });
    
    console.log(`✅ [CACHE] Updated for ${input.companyName}, TTL: ${ttl}s`);
    
    return {
      companyName: input.companyName,
      data: input.data
    };
  }
};

// ============================================================================
// DATABASE FUNCTIONS (IDEMPOTENT)
// ============================================================================

/**
 * Calculate influence level from buyer group role
 * Maps buyer group roles to influence levels for consistency
 */
function calculateInfluenceLevelFromRole(role: string | null | undefined): 'High' | 'Medium' | 'Low' | null {
  if (!role) return null;
  
  const normalizedRole = role.toLowerCase().trim();
  
  // Decision Maker and Champion have high influence
  if (normalizedRole === 'decision maker' || normalizedRole === 'champion') {
    return 'High';
  }
  
  // Blocker and Stakeholder have medium influence
  if (normalizedRole === 'blocker' || normalizedRole === 'stakeholder') {
    return 'Medium';
  }
  
  // Introducer has low influence
  if (normalizedRole === 'introducer') {
    return 'Low';
  }
  
  // Default to Medium for unknown roles
  return 'Medium';
}

/**
 * Save buyer group to database (idempotent with upsert)
 */
export const saveBuyerGroupStep: PipelineStep<
  { workspaceId: string; buyerGroup: any },
  { workspaceId: string; buyerGroup: any; savedCount: number }
> = {
  name: 'saveBuyerGroup',
  description: 'Save buyer group to database (idempotent)',
  idempotencyKey: (input) => `save:${generateIdempotencyKey(input)}`,
  retryable: true,
  maxRetries: 3,
  
  async execute(input, context) {
    console.log(`💾 [DATABASE] Saving buyer group for: ${input.buyerGroup.companyName}`);
    
    const { prisma } = await import('@/platform/database/prisma-client');
    let savedCount = 0;
    
    try {
      // Idempotent upsert for each member
      for (const member of input.buyerGroup.members) {
        if (!member.email) continue;
        
        // Calculate influence level from role
        const influenceLevel = calculateInfluenceLevelFromRole(member.role);
        
        // Check if person exists
        const existingPerson = await prisma.people.findFirst({
          where: {
            workspaceId: input.workspaceId,
            OR: [
              { email: member.email },
              { workEmail: member.email },
              { personalEmail: member.email }
            ]
          }
        });
        
        if (existingPerson) {
          // Update existing (idempotent)
          await prisma.people.update({
            where: { id: existingPerson.id },
            data: {
              buyerGroupRole: member.role,
              isBuyerGroupMember: true, // Always set to true when assigning a role
              influenceLevel: influenceLevel, // Set influence level based on role
              influenceScore: member.influenceScore || member.confidence || 0,
              updatedAt: new Date()
            }
          });
          savedCount++;
        } else {
          // Create new (idempotent via unique constraint on email)
          try {
            await prisma.people.create({
              data: {
                workspaceId: input.workspaceId,
                firstName: member.name.split(' ')[0] || '',
                lastName: member.name.split(' ').slice(1).join(' ') || '',
                fullName: member.name,
                jobTitle: member.title || '',
                email: member.email,
                phone: member.phone || null,
                linkedinUrl: member.linkedin || null,
                buyerGroupRole: member.role,
                isBuyerGroupMember: true, // Always set to true when creating with a role
                influenceLevel: influenceLevel, // Set influence level based on role
                influenceScore: member.influenceScore || member.confidence || 0,
                status: 'PROSPECT',
                createdAt: new Date(),
                updatedAt: new Date()
              }
            });
            savedCount++;
          } catch (error: any) {
            // Ignore duplicate errors (idempotency)
            if (!error.message?.includes('Unique constraint')) {
              throw error;
            }
          }
        }
      }
      
      console.log(`✅ [DATABASE] Saved ${savedCount} members for ${input.buyerGroup.companyName}`);
      
      return {
        workspaceId: input.workspaceId,
        buyerGroup: input.buyerGroup,
        savedCount
      };
    } catch (error) {
      console.error(`❌ [DATABASE] Save failed:`, error);
      throw error;
    }
  }
};

// ============================================================================
// LOGGING & MONITORING FUNCTIONS
// ============================================================================

/**
 * Log pipeline step execution
 */
export function logStepExecution(
  stepName: string,
  input: any,
  output: any,
  duration: number,
  context: PipelineContext
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    step: stepName,
    workspaceId: context.workspaceId,
    userId: context.userId,
    enrichmentLevel: context.enrichmentLevel,
    duration,
    input: {
      companyName: input.companyName || 'unknown'
    },
    output: {
      success: !!output,
      membersFound: output?.buyerGroup?.totalMembers || 0
    },
    traceId: context.metadata?.traceId || generateIdempotencyKey({ stepName, timestamp: Date.now() })
  };
  
  console.log(`📊 [METRICS]`, JSON.stringify(logEntry));
}

/**
 * Track API costs
 */
export function trackAPICost(
  apiName: string,
  callCount: number,
  estimatedCost: number,
  context: PipelineContext
): void {
  const costEntry = {
    timestamp: new Date().toISOString(),
    api: apiName,
    workspaceId: context.workspaceId,
    callCount,
    estimatedCost,
    enrichmentLevel: context.enrichmentLevel
  };
  
  console.log(`💰 [COST]`, JSON.stringify(costEntry));
}

// ============================================================================
// ERROR HANDLING FUNCTIONS
// ============================================================================

/**
 * Create error fallback result
 */
export function createErrorFallback(error: Error, context: any): any {
  return {
    success: false,
    error: error.message,
    errorType: error.constructor.name,
    timestamp: new Date().toISOString(),
    context: {
      companyName: context.companyName || 'unknown',
      enrichmentLevel: context.enrichmentLevel || 'unknown'
    }
  };
}

/**
 * Should retry error?
 */
export function shouldRetryError(error: Error): boolean {
  const retryableErrors = [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'Rate limit exceeded',
    'Too many requests'
  ];
  
  return retryableErrors.some(msg => 
    error.message.includes(msg) || error.name.includes(msg)
  );
}

/**
 * Calculate exponential backoff delay
 */
export function calculateBackoffDelay(attempt: number, baseDelay: number = 1000): number {
  const maxDelay = 60000; // 60 seconds max
  const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
  const jitter = Math.random() * 0.3 * delay; // Add 0-30% jitter
  return Math.floor(delay + jitter);
}

// Export all functions
export const pipelineFunctions = {
  validateCompanyInput,
  checkCacheStep,
  updateCacheStep,
  saveBuyerGroupStep,
  logStepExecution,
  trackAPICost,
  createErrorFallback,
  shouldRetryError,
  calculateBackoffDelay,
  generateIdempotencyKey,
  normalizeCompanyName,
  isValidUrl
};

export default pipelineFunctions;

