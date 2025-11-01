/**
 * Comprehensive Person Intelligence API
 * 
 * GET /api/intelligence/person/[id]/comprehensive
 * 
 * Returns comprehensive person intelligence combining:
 * - CoreSignal data from database
 * - Real-time news from Perplexity
 * - Deep insights from Claude AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { PersonIntelligenceService } from '@/platform/services/PersonIntelligenceService';

const personIntelligenceService = new PersonIntelligenceService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log(`🧠 [PERSON_INTELLIGENCE_API] Fetching comprehensive intelligence for person: ${id}`);

    // Check for cached insights first
    const cachedInsights = await personIntelligenceService.getCachedInsights(id, 24);
    if (cachedInsights) {
      console.log(`✅ [PERSON_INTELLIGENCE_API] Returning cached insights for person: ${id}`);
      return NextResponse.json({
        success: true,
        data: cachedInsights,
        cached: true,
        lastUpdated: cachedInsights.lastUpdated
      });
    }

    // Generate fresh insights
    const insights = await personIntelligenceService.generateComprehensiveInsights(id);
    
    // Cache the insights
    await personIntelligenceService.cacheInsights(id, insights);

    console.log(`✅ [PERSON_INTELLIGENCE_API] Generated fresh insights for person: ${id}`);

    return NextResponse.json({
      success: true,
      data: insights,
      cached: false,
      lastUpdated: insights.lastUpdated
    });

  } catch (error) {
    console.error(`❌ [PERSON_INTELLIGENCE_API] Error fetching person intelligence:`, error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch person intelligence',
        data: null
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { forceRefresh = false } = body;
    
    console.log(`🔄 [PERSON_INTELLIGENCE_API] Refreshing intelligence for person: ${id}, force: ${forceRefresh}`);

    // Force refresh by clearing cache if requested
    if (forceRefresh) {
      // Clear cache by updating with null
      await personIntelligenceService.cacheInsights(id, null as any);
    }

    // Generate fresh insights
    const insights = await personIntelligenceService.generateComprehensiveInsights(id);
    
    // Cache the insights
    await personIntelligenceService.cacheInsights(id, insights);

    console.log(`✅ [PERSON_INTELLIGENCE_API] Refreshed insights for person: ${id}`);

    return NextResponse.json({
      success: true,
      data: insights,
      refreshed: true,
      lastUpdated: insights.lastUpdated
    });

  } catch (error) {
    console.error(`❌ [PERSON_INTELLIGENCE_API] Error refreshing person intelligence:`, error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to refresh person intelligence',
        data: null
      },
      { status: 500 }
    );
  }
}
