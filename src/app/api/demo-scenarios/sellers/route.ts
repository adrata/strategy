import { NextRequest, NextResponse } from 'next/server';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';

// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scenario = searchParams.get('scenario') || 'winning-variant';
    
    console.log(`🎯 [DEMO SELLERS API] Loading sellers for scenario: ${scenario}`);
    
    // 🔐 AUTH: Get authenticated user context
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response; // Return error response if authentication failed
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    // Use authenticated user's workspace
    const workspaceId = context.workspaceId;
    const userId = context.userId;
    
    console.log(`🔍 [DEMO SELLERS API] Using workspace: ${workspaceId}, user: ${userId}`);
    
    // Generate scenario-specific sellers data
    const sellers = await generateScenarioSellers(scenario, workspaceId);
    
    console.log(`✅ [DEMO SELLERS API] Generated ${sellers.length} sellers for scenario: ${scenario}`);
    
    return NextResponse.json({
      success: true,
      sellers: sellers,
      scenario: scenario,
      count: sellers.length
    });
    
  } catch (error) {
    console.error('❌ [DEMO SELLERS API] Error loading sellers:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load demo sellers',
        sellers: []
      },
      { status: 500 }
    );
  }
}

async function generateScenarioSellers(scenario: string, workspaceId: string) {
  // 🆕 FIX: Use authenticated user's workspace instead of hardcoded demo workspace
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    console.log(`🔍 [DEMO SELLERS API] Querying sellers for workspace: ${workspaceId}`);
    
    const sellers = await prisma.sellers.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null
      },
      orderBy: [
        { updatedAt: 'desc' }
      ]
    });
    
    console.log(`✅ [DEMO SELLERS API] Loaded ${sellers.length} sellers from database for workspace: ${workspaceId}`);
    return sellers;
  } catch (error) {
    console.error('❌ [DEMO SELLERS API] Error loading sellers:', error);
    return [];
  }}
