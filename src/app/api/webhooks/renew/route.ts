import { NextRequest, NextResponse } from 'next/server';
import { webhookRenewalService } from '@/platform/services/webhook-renewal-service';

/**
 * Webhook Renewal API
 * Manually trigger webhook renewal and get status
 */
export async function POST(request: NextRequest) {
  try {
    const { workspaceId, force = false } = await request.json();

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    console.log(`🔄 [WEBHOOK RENEWAL] Manual renewal triggered for workspace: ${workspaceId}`);

    // Force renewal of all webhooks if requested
    if (force) {
      await webhookRenewalService.renewExpiringWebhooks();
    }

    // Get current status
    const webhookStatus = await webhookRenewalService.getWebhookStatus(workspaceId);

    return NextResponse.json({
      success: true,
      workspaceId,
      webhooks: webhookStatus,
      summary: {
        total: webhookStatus.length,
        active: webhookStatus.filter(w => w.isActive).length,
        needingRenewal: webhookStatus.filter(w => w.needsRenewal).length,
        expired: webhookStatus.filter(w => w.daysUntilExpiry !== null && w.daysUntilExpiry <= 0).length
      }
    });

  } catch (error) {
    console.error('❌ [WEBHOOK RENEWAL] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Webhook renewal failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    const webhookStatus = await webhookRenewalService.getWebhookStatus(workspaceId);

    return NextResponse.json({
      success: true,
      workspaceId,
      webhooks: webhookStatus,
      summary: {
        total: webhookStatus.length,
        active: webhookStatus.filter(w => w.isActive).length,
        needingRenewal: webhookStatus.filter(w => w.needsRenewal).length,
        expired: webhookStatus.filter(w => w.daysUntilExpiry !== null && w.daysUntilExpiry <= 0).length
      }
    });

  } catch (error) {
    console.error('❌ [WEBHOOK RENEWAL] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get webhook status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
