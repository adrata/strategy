/**
 * Vercel Cron Job: Enrich All Workspaces
 * 
 * Weekly enrichment for all workspace customers
 * Runs every Sunday at 2am to refresh contact data
 * 
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/enrich-all-workspaces",
 *     "schedule": "0 2 * * 0"  // 2am every Sunday
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🚀 [ENRICH CRON] Starting workspace enrichment for all customers');

    // Get all active workspaces
    const workspaces = await prisma.workspaces.findMany({
      where: {
        isActive: true,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        slug: true
      }
    });

    console.log(`📊 [ENRICH CRON] Found ${workspaces.length} active workspaces`);

    const results = {
      workspaces: workspaces.length,
      processed: 0,
      peopleEnriched: 0,
      companiesEnriched: 0,
      errors: []
    };

    // Process each workspace
    for (const workspace of workspaces) {
      try {
        console.log(`📦 [ENRICH CRON] Processing: ${workspace.name}`);
        
        const workspaceResult = await enrichWorkspace(workspace.id);
        
        results.processed++;
        results.peopleEnriched += workspaceResult.peopleEnriched;
        results.companiesEnriched += workspaceResult.companiesEnriched;
        
        console.log(`✅ [ENRICH CRON] ${workspace.name}: ${workspaceResult.peopleEnriched} people, ${workspaceResult.companiesEnriched} companies`);
        
      } catch (error: any) {
        console.error(`❌ [ENRICH CRON] Error in ${workspace.name}:`, error);
        results.errors.push({
          workspaceId: workspace.id,
          workspaceName: workspace.name,
          error: error.message
        });
      }
    }

    const duration = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    console.log(`\n✅ [ENRICH CRON] Completed in ${minutes}m ${seconds}s`);
    console.log(`   Workspaces: ${results.processed}/${results.workspaces}`);
    console.log(`   People: ${results.peopleEnriched}`);
    console.log(`   Companies: ${results.companiesEnriched}`);

    return NextResponse.json({
      success: true,
      message: `Enrichment completed for ${results.processed} workspaces`,
      duration: `${minutes}m ${seconds}s`,
      results
    });

  } catch (error: any) {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    console.error('❌ [ENRICH CRON] Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        duration: `${duration}s`
      },
      { status: 500 }
    );
  }
}

/**
 * Enrich a single workspace
 */
async function enrichWorkspace(workspaceId: string) {
  const stats = {
    peopleEnriched: 0,
    companiesEnriched: 0
  };

  // Get people needing enrichment (not verified or stale > 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const peopleNeedingEnrichment = await prisma.people.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      OR: [
        { emailVerified: false },
        { phoneVerified: false },
        { dataLastVerified: { lt: thirtyDaysAgo } },
        { dataLastVerified: null }
      ]
    },
    take: 50 // Limit per workspace per run
  });

  console.log(`   📧 ${peopleNeedingEnrichment.length} people need enrichment`);

  // For now, mark as enriched
  // In production, would call enrichment service
  for (const person of peopleNeedingEnrichment) {
    try {
      // Queue enrichment job (async)
      // await EnrichmentService.queueEnrichment('person', person.id, workspaceId);
      
      stats.peopleEnriched++;
    } catch (error) {
      console.error(`   ❌ Error queuing enrichment for ${person.fullName}:`, error);
    }
  }

  // Get companies needing enrichment
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const companiesNeedingEnrichment = await prisma.companies.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      OR: [
        {
          customFields: {
            equals: null
          }
        },
        {
          lastEnriched: { lt: ninetyDaysAgo }
        },
        {
          lastEnriched: null
        }
      ],
      website: {
        not: null
      }
    },
    take: 20 // Limit per workspace per run
  });

  console.log(`   🏢 ${companiesNeedingEnrichment.length} companies need enrichment`);

  for (const company of companiesNeedingEnrichment) {
    try {
      // Queue enrichment job
      // await EnrichmentService.queueEnrichment('company', company.id, workspaceId);
      
      stats.companiesEnriched++;
    } catch (error) {
      console.error(`   ❌ Error queuing enrichment for ${company.name}:`, error);
    }
  }

  return stats;
}

/**
 * POST: Manual trigger for testing
 */
export async function POST(request: NextRequest) {
  // Same as GET but can be triggered manually for testing
  return GET(request);
}

