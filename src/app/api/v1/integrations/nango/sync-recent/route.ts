import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedAuthUser } from '@/platform/api-auth';
import { UnifiedEmailSyncService } from '@/platform/services/UnifiedEmailSyncService';

// Required for static export (desktop build)
export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/integrations/nango/sync-recent
 * Sync emails from the last 24 hours (more reliable for catching new emails)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUnifiedAuthUser(request);
    if (!user || !user.activeWorkspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`🔄 [SYNC RECENT] Triggering recent email sync for workspace: ${user.activeWorkspaceId}, user: ${user.id}`);

    // Trigger email sync (will fetch last 24 hours or since last sync, whichever is more recent)
    const result = await UnifiedEmailSyncService.syncWorkspaceEmails(
      user.activeWorkspaceId,
      user.id
    );

    console.log(`✅ [SYNC RECENT] Sync completed:`, JSON.stringify(result, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Recent email sync completed',
      results: result,
      summary: {
        totalConnections: result.length,
        successful: result.filter((r: any) => r.success !== false).length,
        failed: result.filter((r: any) => r.success === false).length,
        totalEmailsProcessed: result.reduce((sum: number, r: any) => sum + (r.count || 0), 0)
      }
    });
  } catch (error) {
    console.error('❌ [SYNC RECENT] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to sync recent emails',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

