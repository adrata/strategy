import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/platform/database/prisma-client';

// GET: Batch retrieve chat sessions (for query parameters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const userId = searchParams.get('userId');
    const appTypesParam = searchParams.get('appTypes');
    
    if (!workspaceId || !userId) {
      return NextResponse.json({ error: "workspaceId and userId are required" }, { status: 400 });
    }

    // Parse appTypes from query parameter
    const appTypes = appTypesParam ? appTypesParam.split(',') : ['Speedrun'];

    // Check if prisma is available
    if (!prisma) {
      console.error('❌ [CHAT SESSIONS BATCH] Prisma client is not available');
      return NextResponse.json({ error: "Database connection not available" }, { status: 500 });
    }

    // For now, return empty sessions object to prevent 404 errors
    const sessions: Record<string, any[]> = {};
    
    appTypes.forEach((appType: string) => {
      sessions[appType] = [];
    });

    return NextResponse.json({
      success: true,
      sessions
    });

  } catch (error) {
    console.error('❌ [CHAT SESSIONS BATCH] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve batch chat sessions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST: Batch retrieve chat sessions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, userId, appTypes = ['Speedrun'] } = body;

    if (!workspaceId || !userId) {
      return NextResponse.json({ error: "workspaceId and userId are required" }, { status: 400 });
    }

    // Check if prisma is available
    if (!prisma) {
      console.error('❌ [CHAT SESSIONS BATCH] Prisma client is not available');
      return NextResponse.json({ error: "Database connection not available" }, { status: 500 });
    }

    // For now, return empty sessions object to prevent 404 errors
    const sessions: Record<string, any[]> = {};
    
    appTypes.forEach((appType: string) => {
      sessions[appType] = [];
    });

    return NextResponse.json({
      success: true,
      sessions
    });

  } catch (error) {
    console.error('❌ [CHAT SESSIONS BATCH] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve batch chat sessions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}