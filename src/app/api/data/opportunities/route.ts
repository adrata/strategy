import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const userId = searchParams.get("userId");
    const includeClosed = searchParams.get("includeClosed") === "true";

    if (!workspaceId || !userId) {
      return NextResponse.json({ error: "workspaceId and userId are required" }, { status: 400 });
    }

    console.log(`🔍 [DATA OPPORTUNITIES] Fetching opportunities for workspace: ${workspaceId}, userId: ${userId}, includeClosed: ${includeClosed}`);

    // Return empty opportunities for now to prevent 404 errors
    return NextResponse.json({
      success: true,
      opportunities: [],
      count: 0,
      workspaceId: workspaceId,
      userId: userId,
      includeClosed: includeClosed
    });

  } catch (error) {
    console.error('❌ Error fetching opportunities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opportunities', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}
