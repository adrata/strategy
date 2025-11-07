/**
 * AI Web Search API
 * 
 * Enables AI right panel to search the web for real-time information
 * Uses Perplexity API with fallback to other search providers
 * 
 * Vercel-compatible (no Playwright, uses API-based search)
 */

import { NextRequest, NextResponse } from 'next/server';
import { webResearchService } from '@/platform/ai/services/WebResearchService';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';

// Using Node.js runtime (not edge) because getSecureApiContext requires jsonwebtoken which needs Node.js stream module
export const maxDuration = 60; // Maximum 60 seconds for web search

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Authenticate user
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response;
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const body = await request.json();
    const { query, searchContext, options } = body;

    if (!query || typeof query !== 'string') {
      return createErrorResponse('Query is required', 'VALIDATION_ERROR', 400);
    }

    console.log('🌐 [WEB SEARCH] Processing query:', {
      query: query.substring(0, 100),
      userId: context.userId,
      workspaceId: context.workspaceId
    });

    // Perform web research
    const result = await webResearchService.performResearch({
      query,
      context: searchContext,
      options: {
        maxResults: options?.maxResults || 10,
        includeImages: options?.includeImages || false,
        includeRelated: options?.includeRelated || true,
        language: options?.language || 'en'
      }
    });

    const processingTime = Date.now() - startTime;

    console.log('✅ [WEB SEARCH] Completed:', {
      query: query.substring(0, 50),
      sourcesFound: result.sources.length,
      confidence: result.confidence,
      processingTime: `${processingTime}ms`,
      model: result.model
    });

    return createSuccessResponse({
      content: result.content,
      sources: result.sources,
      confidence: result.confidence,
      processingTime,
      model: result.model,
      query
    });

  } catch (error) {
    console.error('❌ [WEB SEARCH] Error:', error);
    
    const processingTime = Date.now() - startTime;
    
    return createErrorResponse(
      error instanceof Error ? error.message : 'Web search failed',
      'WEB_SEARCH_ERROR',
      500,
      { processingTime }
    );
  }
}

// GET endpoint for simple queries
export async function GET(request: NextRequest) {
  try {
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response;
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('query');

    if (!query) {
      return createErrorResponse('Query parameter required', 'VALIDATION_ERROR', 400);
    }

    const result = await webResearchService.performResearch({
      query,
      options: {
        maxResults: 5,
        includeRelated: false
      }
    });

    return createSuccessResponse({
      content: result.content,
      sources: result.sources,
      confidence: result.confidence,
      model: result.model
    });

  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : 'Web search failed',
      'WEB_SEARCH_ERROR',
      500
    );
  }
}

