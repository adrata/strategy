/**
// Required for static export (desktop build)
export const dynamic = 'force-static';

 * 🗑️ DELETION API - 2025 Best Practices
 * 
 * Provides endpoints for:
 * - Soft delete (with restore capability)
 * - Hard delete (permanent removal)
 * - Deletion statistics and management
 */

import { NextRequest, NextResponse } from 'next/server';
import { deletionService } from '@/platform/services/deletion-service';
import { getV1AuthUser } from '../auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getV1AuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, entityType, entityId } = body;

    console.log(`🔍 [DELETION API] Request: ${action} ${entityType} ${entityId} by user ${user.id}`);

    if (!action || !entityType || !entityId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: action, entityType, entityId'
      }, { status: 400 });
    }

    let result;

    switch (action) {
      case 'soft_delete':
        result = await deletionService.softDelete(entityType, entityId, user.id);
        break;
        
      case 'restore':
        // For now, keep the old boolean return for restore and hard_delete
        const restoreResult = await deletionService.restore(entityType, entityId, user.id);
        result = { success: restoreResult };
        break;
        
      case 'hard_delete':
        // For now, keep the old boolean return for hard_delete
        const hardDeleteResult = await deletionService.hardDelete(entityType, entityId, user.id);
        result = { success: hardDeleteResult };
        break;
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Must be: soft_delete, restore, or hard_delete'
        }, { status: 400 });
    }

    if (result.success) {
      console.log(`✅ [DELETION API] Success: ${action} ${entityType} ${entityId}`);
      return NextResponse.json({
        success: true,
        message: `${action} completed successfully`,
        data: { entityType, entityId, action }
      });
    } else {
      console.error(`❌ [DELETION API] Failed: ${action} ${entityType} ${entityId}`, result);
      
      // Return appropriate HTTP status based on error code
      let status = 500;
      if (result.errorCode === 'USER_NOT_FOUND') {
        status = 401;
      } else if (result.errorCode === 'RECORD_NOT_FOUND') {
        status = 404;
      }
      
      return NextResponse.json({
        success: false,
        error: result.error || `Failed to ${action} ${entityType} ${entityId}`,
        errorCode: result.errorCode,
        details: process.env.NODE_ENV === 'development' ? result.details : undefined
      }, { status });
    }

  } catch (error) {
    console.error('❌ [DELETION API] Error:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      request: { url: request.url, method: request.method }
    });
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : error) : undefined
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getV1AuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        const stats = await deletionService.getDeletionStats();
        return NextResponse.json({
          success: true,
          data: stats
        });
        
      case 'cleanup':
        const dryRun = searchParams.get('dryRun') === 'true';
        const results = await deletionService.cleanupOldSoftDeletes();
        return NextResponse.json({
          success: true,
          data: {
            results,
            dryRun,
            timestamp: new Date().toISOString()
          }
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Must be: stats or cleanup'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [DELETION API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
