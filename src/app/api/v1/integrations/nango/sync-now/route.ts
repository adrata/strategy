import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedAuthUser } from '@/platform/api-auth';
import { UnifiedEmailSyncService } from '@/platform/services/UnifiedEmailSyncService';

// Required for static export (desktop build)
export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/integrations/nango/sync-now
 * Manually trigger email sync for the current workspace
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUnifiedAuthUser(request);
    if (!user || !user.activeWorkspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`🔄 [MANUAL SYNC] Triggering email sync for workspace: ${user.activeWorkspaceId}, user: ${user.id}`);

    // Trigger email sync
    const result = await UnifiedEmailSyncService.syncWorkspaceEmails(
      user.activeWorkspaceId,
      user.id
    );

    console.log(`✅ [MANUAL SYNC] Sync completed:`, result);

    return NextResponse.json({
      success: true,
      message: 'Email sync triggered successfully',
      results: result
    });
  } catch (error) {
    console.error('❌ [MANUAL SYNC] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to trigger email sync',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

