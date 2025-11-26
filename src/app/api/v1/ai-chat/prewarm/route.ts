/**
 * 🔥 AI CONTEXT PRE-WARMING ENDPOINT
 * 
 * Lightweight endpoint that pre-builds and caches AI context
 * when a user navigates to a record. This dramatically reduces
 * time-to-first-token for the next AI chat message.
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSecureApiContext } from '@/platform/services/secure-api-helper';
import { AIContextService } from '@/platform/ai/services/AIContextService';

/**
 * POST /api/v1/ai-chat/prewarm - Pre-warm AI context cache
 * 
 * Called when user navigates to a record to build context ahead of time.
 * Context is cached in AIContextService for 5 minutes.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. AUTHENTICATION CHECK (lightweight - no rate limiting for pre-warm)
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response || !context) {
      return response || NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    
    const { 
      appType, 
      currentRecord, 
      recordType,
      listViewContext
    } = body;

    // 2. BUILD CONTEXT (this populates the session cache)
    try {
      await AIContextService.buildContext({
        userId: context.userId,
        workspaceId: context.workspaceId,
        appType: appType || 'general',
        currentRecord,
        recordType,
        listViewContext,
        conversationHistory: [],
        documentContext: null
      });
      
      const buildTime = Date.now() - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔥 [PREWARM] Context pre-warmed:', {
          userId: context.userId,
          workspaceId: context.workspaceId,
          recordId: currentRecord?.id,
          recordType,
          buildTime: `${buildTime}ms`
        });
      }
      
      return NextResponse.json({ 
        success: true, 
        cached: true,
        buildTime 
      });
      
    } catch (contextError) {
      console.warn('⚠️ [PREWARM] Context build failed:', contextError);
      // Don't fail the request - pre-warming is optional
      return NextResponse.json({ 
        success: true, 
        cached: false,
        error: 'Context build failed, will build on demand'
      });
    }

  } catch (error) {
    console.error('❌ [PREWARM] Error:', error);
    // Don't return error status - pre-warming failure shouldn't block the user
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

