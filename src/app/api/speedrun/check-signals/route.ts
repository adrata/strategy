import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/platform/database/prisma-client';

// GET: Check for speedrun signals
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }

    // Check if prisma is available
    if (!prisma) {
      console.error('❌ [SPEEDRUN CHECK SIGNALS] Prisma client is not available');
      return NextResponse.json({ error: "Database connection not available" }, { status: 500 });
    }

    // For now, return empty signals array to prevent 404 errors
    return NextResponse.json({
      success: true,
      signals: [],
      hasNewSignals: false
    });

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
