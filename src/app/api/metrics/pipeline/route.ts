import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const userId = searchParams.get("userId");

    if (!workspaceId || !userId) {
      return NextResponse.json({ error: "workspaceId and userId are required" }, { status: 400 });
    }

    console.log(`🔍 [METRICS PIPELINE] Fetching metrics for workspace: ${workspaceId}, userId: ${userId}`);

    // Return empty metrics for now to prevent 404 errors
    return NextResponse.json({
      success: true,
      metrics: {
        totalOpportunities: 0,
        openOpportunities: 0,
        closedWon: 0,
        closedLost: 0,
        totalValue: 0,
        openValue: 0,
        winRate: 0,
        averageDealSize: 0,
        salesCycle: 0
      },
      workspaceId: workspaceId,
      userId: userId
    });

  } catch (error) {
    console.error('❌ Error fetching pipeline metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipeline metrics', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}
