/**
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

    if (!action || !entityType || !entityId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: action, entityType, entityId'
      }, { status: 400 });
    }

    let result = false;

    switch (action) {
      case 'soft_delete':
        result = await deletionService.softDelete(entityType, entityId, user.id);
        break;
        
      case 'restore':
        result = await deletionService.restore(entityType, entityId, user.id);
        break;
        
      case 'hard_delete':
        result = await deletionService.hardDelete(entityType, entityId, user.id);
        break;
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Must be: soft_delete, restore, or hard_delete'
        }, { status: 400 });
    }

    if (result) {
      return NextResponse.json({
        success: true,
        message: `${action} completed successfully`,
        data: { entityType, entityId, action }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: `Failed to ${action} ${entityType} ${entityId}`
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ [DELETION API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
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
