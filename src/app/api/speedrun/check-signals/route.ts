import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/platform/database/prisma-client';

// 🚀 PERFORMANCE: Optimized speedrun signals check with caching
const signalsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30 * 1000; // 30 seconds cache

// GET: Check for speedrun signals
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }

    // 🚀 PERFORMANCE: Check cache first
    const cacheKey = `signals:${workspaceId}`;
    const cached = signalsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('⚡ [SPEEDRUN SIGNALS] Cache hit for workspace:', workspaceId);
      return NextResponse.json(cached.data);
    }

    // Check if prisma is available
    if (!prisma) {
      console.error('❌ [SPEEDRUN CHECK SIGNALS] Prisma client is not available');
      return NextResponse.json({ error: "Database connection not available" }, { status: 500 });
    }

    // 🚀 PERFORMANCE: Fast response - return empty signals immediately
    // In the future, this could check for actual signals, but for now we return empty
    const response = {
      success: true,
      signals: [],
      hasNewSignals: false,
      timestamp: new Date().toISOString()
    };

    // 🚀 PERFORMANCE: Cache the response
    signalsCache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });

    const duration = Date.now() - startTime;
    console.log(`⚡ [SPEEDRUN SIGNALS] Response generated in ${duration}ms for workspace: ${workspaceId}`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [SPEEDRUN CHECK SIGNALS] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check speedrun signals',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
