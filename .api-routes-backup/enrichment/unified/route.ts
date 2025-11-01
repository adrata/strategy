/**
 * 🚀 UNIFIED ENRICHMENT API - PRODUCTION ENDPOINT
 * 
 * Single API endpoint for ALL enrichment operations
 * Replaces all previous enrichment endpoints with one powerful API
 */

import { NextRequest, NextResponse } from 'next/server';
import { UnifiedEnrichmentFactory, EnrichmentRequest } from '@/platform/services/unified-enrichment-system';
import jwt from 'jsonwebtoken';


import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
// Performance caching
const enrichmentCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 3600000; // 1 hour

/**
 * 🎯 POST - Execute Enrichment Operation
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  // 1. Authenticate and authorize user
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response; // Return error response if authentication failed
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const { searchParams } = new URL(request.url);
    
    // Use authenticated user's workspace and ID
    const workspaceId = context.workspaceId;
    const userId = context.userId;

    try {
    // Parse request body
    const body = await request.json() as EnrichmentRequest;
    
    // Validate request
    if (!body.operation || !body.target) {
      return createErrorResponse('$1', '$2', $3);
    }
    
    // Get workspace context
    const { workspaceId, userId } = await getWorkspaceContext(request);
    
    // Create cache key
    const cacheKey = createCacheKey(workspaceId, body);
    
    // Check cache first (for non-realtime operations)
    if (body.options?.urgencyLevel !== 'realtime' && enrichmentCache.has(cacheKey)) {
      const cached = enrichmentCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`💾 [CACHE HIT] Returning cached result for ${body.operation}`);
        return createSuccessResponse(cached.data.data, {
          ...cached.data.meta,
          cacheHit: true,
          responseTime: Date.now() - startTime,
          userId: context.userId,
          workspaceId: context.workspaceId,
          role: context.role
        });
      }
    }
    
    // Create enrichment system instance
    const enrichmentSystem = UnifiedEnrichmentFactory.createForWorkspace(workspaceId, userId);
    
    // Execute enrichment
    console.log(`🚀 [API] Executing ${body.operation} for workspace ${workspaceId}`);
    const result = await enrichmentSystem.enrich(body);
    
    // Cache successful results
    if (result.success && body.options?.urgencyLevel !== 'realtime') {
      enrichmentCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
    }
    
    const responseTime = Date.now() - startTime;
    
    return createSuccessResponse(result.data, {
      timestamp: new Date().toISOString(),
      responseTime,
      cacheHit: false,
      userId: context.userId,
      workspaceId: context.workspaceId,
      role: context.role
    });
    
  } catch (error) {
    console.error('[UNIFIED API] Error:', error);
    
    return createErrorResponse(
      'Failed to process enrichment request',
      'ENRICHMENT_ERROR',
      500
    );
  }
}

/**
 * 🔍 GET - System Health and Capabilities
 */
export async function GET(request: NextRequest) {
  // 1. Authenticate and authorize user
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response; // Return error response if authentication failed
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const { searchParams } = new URL(request.url);
    
    // Use authenticated user's workspace and ID
    const workspaceId = context.workspaceId;
    const userId = context.userId;

    try {
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation');
    
    // Get workspace context
    const { workspaceId, userId } = await getWorkspaceContext(request);
    
    if (operation === 'health') {
      // System health check
      const health = await checkSystemHealth();
      return createSuccessResponse(health, {
        userId: context.userId,
        workspaceId: context.workspaceId,
        role: context.role
      });
    }
    
    if (operation === 'capabilities') {
      // System capabilities
      const capabilities = getSystemCapabilities();
      return createSuccessResponse(capabilities, {
        userId: context.userId,
        workspaceId: context.workspaceId,
        role: context.role
      });
    }
    
    if (operation === 'stats') {
      // System statistics
      const enrichmentSystem = UnifiedEnrichmentFactory.createForWorkspace(workspaceId, userId);
      const stats = enrichmentSystem.getSystemStats();
      return createSuccessResponse(stats, {
        userId: context.userId,
        workspaceId: context.workspaceId,
        role: context.role
      });
    }
    
    // Default: Return API documentation
    return createSuccessResponse({
      name: 'Unified Enrichment API',
      version: '1.0.0',
      description: 'Single endpoint for all data enrichment operations',
      operations: [
        'buyer_group',
        'people_search', 
        'company_research',
        'contact_enrichment',
        'full_enrichment'
      ],
      endpoints: {
        POST: '/api/enrichment/unified - Execute enrichment operation',
        GET: '/api/enrichment/unified?operation=health - System health check',
        GET: '/api/enrichment/unified?operation=capabilities - System capabilities',
        GET: '/api/enrichment/unified?operation=stats - System statistics'
      }
    }, {
      userId: context.userId,
      workspaceId: context.workspaceId,
      role: context.role
    });
    
  } catch (error) {
    console.error('[UNIFIED API] GET Error:', error);
    
    return createErrorResponse(
      'Failed to get enrichment status',
      'ENRICHMENT_STATUS_ERROR',
      500
    );
  }
}

/**
 * 🔐 WORKSPACE CONTEXT RESOLUTION
 */
async function getWorkspaceContext(request: NextRequest): Promise<{
  workspaceId: string;
  userId: string;
}> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const secret = process.env.NEXTAUTH_SECRET || process.env['JWT_SECRET'] || "dev-secret-key";
      const decoded = jwt.verify(token, secret) as any;
      
      return {
        workspaceId: decoded.workspaceId,
        userId: decoded.userId
      };
    }
    
    // Fallback to query parameters for development
    const { searchParams } = new URL(request.url);
    // Use secure context instead of query parameters
    const workspaceId = context.workspaceId;
    // Use secure context instead of query parameters
    const userId = context.userId;
    
    if (!workspaceId || !userId) {
      throw new Error('Missing authentication or workspace context');
    }
    
    return { workspaceId, userId };
    
  } catch (error) {
    throw new Error('Invalid authentication token');
  }
}

/**
 * 🔑 CACHE KEY GENERATION
 */
function createCacheKey(workspaceId: string, request: EnrichmentRequest): string {
  const keyComponents = [
    workspaceId,
    request.operation,
    request.target.companyId || request.target.companyName || request.target.personId,
    request.options.depth,
    request.options.includeBuyerGroup ? 'bg' : '',
    request.options.includeIndustryIntel ? 'ind' : ''
  ].filter(Boolean);
  
  return keyComponents.join(':');
}

/**
 * 🏥 SYSTEM HEALTH CHECK
 */
async function checkSystemHealth(): Promise<any> {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: false,
      coreSignal: false,
      hunter: false,
      prospeo: false,
      perplexity: false
    },
    performance: {
      cacheSize: enrichmentCache.size,
      uptime: process.uptime()
    }
  };
  
  try {
    // Check database connection
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = true;} catch (error) {
    console.error('Database health check failed:', error);
  }
  
  // Check API keys
  health.checks.coreSignal = !!process.env['CORESIGNAL_API_KEY'];
  health.checks.hunter = !!process.env['HUNTER_API_KEY'];
  health.checks.prospeo = !!process.env['PROSPEO_API_KEY'];
  health.checks.perplexity = !!process.env['PERPLEXITY_API_KEY'];
  
  // Overall status
  const allChecks = Object.values(health.checks);
  health.status = allChecks.every(check => check) ? 'healthy' : 'degraded';
  
  return health;
}

/**
 * 🎯 SYSTEM CAPABILITIES
 */
function getSystemCapabilities(): any {
  return {
    operations: {
      buyer_group: {
        description: 'Generate complete buyer groups for companies',
        features: ['MEDDIC-aligned roles', 'Industry adaptation', 'Influence scoring'],
        performance: 'Sub-2-second response, 95%+ accuracy'
      },
      people_search: {
        description: 'Advanced people discovery and enrichment',
        features: ['Multi-criteria search', 'Contact enrichment', 'Role classification'],
        performance: 'Sub-1-second search, 90%+ contact accuracy'
      },
      company_research: {
        description: 'Comprehensive company intelligence',
        features: ['Market analysis', 'Competitor tracking', 'Technology stack'],
        performance: 'Sub-3-second research, real-time updates'
      },
      contact_enrichment: {
        description: 'High-accuracy contact information',
        features: ['Email verification', 'Phone discovery', 'Social profiles'],
        performance: '95%+ email accuracy, 85%+ phone accuracy'
      },
      full_enrichment: {
        description: 'Complete enrichment including all operations',
        features: ['Buyer groups', 'People research', 'Company intel', 'Contacts'],
        performance: 'Sub-5-second complete enrichment'
      }
    },
    
    providers: {
      coreSignal: { status: !!process.env['CORESIGNAL_API_KEY'], purpose: 'Primary B2B data' },
      hunter: { status: !!process.env['HUNTER_API_KEY'], purpose: 'Email discovery' },
      prospeo: { status: !!process.env['PROSPEO_API_KEY'], purpose: 'LinkedIn emails' },
      perplexity: { status: !!process.env['PERPLEXITY_API_KEY'], purpose: 'Accuracy validation' }
    },
    
    performance: {
      parallelProcessing: true,
      maxConcurrency: 15,
      caching: 'Multi-layer with 1-hour TTL',
      costOptimization: 'Provider selection and batching'
    }
  };
}
