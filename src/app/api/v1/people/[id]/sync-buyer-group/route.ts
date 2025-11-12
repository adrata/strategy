import { NextRequest, NextResponse } from 'next/server';
import { getV1AuthUser } from '../../../auth';
import { BuyerGroupSyncService } from '@/platform/services/buyer-group-sync-service';

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/people/[id]/sync-buyer-group
 * Sync buyer group data for a specific person
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const personId = resolvedParams.id;
    
    // Simple authentication check
    const authUser = await getV1AuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Sync buyer group data
    const result = await BuyerGroupSyncService.syncPersonBuyerGroupData(personId);
    
    return NextResponse.json({
      success: true,
      updated: result.updated,
      changes: result.changes,
    });
  } catch (error) {
    console.error('❌ [PEOPLE SYNC API] Error syncing buyer group data:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to sync buyer group data';
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to sync buyer group data',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

