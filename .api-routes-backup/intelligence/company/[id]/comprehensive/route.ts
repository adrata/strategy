/**
 * Comprehensive Company Intelligence API
 * 
 * GET /api/intelligence/company/[id]/comprehensive
 * 
 * Returns comprehensive company intelligence combining:
 * - CoreSignal data from database
 * - Real-time news from Perplexity
 * - Deep insights from Claude AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { CompanyIntelligenceService } from '@/platform/services/CompanyIntelligenceService';

const companyIntelligenceService = new CompanyIntelligenceService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log(`🏢 [COMPANY_INTELLIGENCE_API] Fetching comprehensive intelligence for company: ${id}`);

    // Check for cached insights first
    const cachedInsights = await companyIntelligenceService.getCachedInsights(id, 24);
    if (cachedInsights) {
      console.log(`✅ [COMPANY_INTELLIGENCE_API] Returning cached insights for company: ${id}`);
      return NextResponse.json({
        success: true,
        data: cachedInsights,
        cached: true,
        lastUpdated: cachedInsights.lastUpdated
      });
    }

    // Generate fresh insights
    const insights = await companyIntelligenceService.generateComprehensiveInsights(id);
    
    // Cache the insights
    await companyIntelligenceService.cacheInsights(id, insights);

    console.log(`✅ [COMPANY_INTELLIGENCE_API] Generated fresh insights for company: ${id}`);

    return NextResponse.json({
      success: true,
      data: insights,
      cached: false,
      lastUpdated: insights.lastUpdated
    });

  } catch (error) {
    console.error(`❌ [COMPANY_INTELLIGENCE_API] Error fetching company intelligence:`, error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch company intelligence',
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
    
    console.log(`🔄 [COMPANY_INTELLIGENCE_API] Refreshing intelligence for company: ${id}, force: ${forceRefresh}`);

    // Force refresh by clearing cache if requested
    if (forceRefresh) {
      // Clear cache by updating with null
      await companyIntelligenceService.cacheInsights(id, null as any);
    }

    // Generate fresh insights
    const insights = await companyIntelligenceService.generateComprehensiveInsights(id);
    
    // Cache the insights
    await companyIntelligenceService.cacheInsights(id, insights);

    console.log(`✅ [COMPANY_INTELLIGENCE_API] Refreshed insights for company: ${id}`);

    return NextResponse.json({
      success: true,
      data: insights,
      refreshed: true,
      lastUpdated: insights.lastUpdated
    });

  } catch (error) {
    console.error(`❌ [COMPANY_INTELLIGENCE_API] Error refreshing company intelligence:`, error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to refresh company intelligence',
        data: null
      },
      { status: 500 }
    );
  }
}
