/**
 * 🎛️ ROLLOUT ADMIN API
 * 
 * Admin endpoints for managing OpenRouter gradual rollout
 */

import { NextRequest, NextResponse } from 'next/server';
import { gradualRolloutService } from '@/platform/services/GradualRolloutService';

export async function GET(request: NextRequest) {
  try {
    const status = gradualRolloutService.getStatus();
    
    return NextResponse.json({
      success: true,
      data: status
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, config } = body;

    switch (action) {
      case 'start':
        gradualRolloutService.startRollout(config);
        return NextResponse.json({
          success: true,
          message: 'Rollout started'
        });

      case 'stop':
        gradualRolloutService.stopRollout();
        return NextResponse.json({
          success: true,
          message: 'Rollout stopped'
        });

      case 'advance':
        gradualRolloutService.advancePhase();
        return NextResponse.json({
          success: true,
          message: 'Phase advanced'
        });

      case 'rollback':
        const { reason } = body;
        gradualRolloutService.forceRollback(reason || 'Manual rollback');
        return NextResponse.json({
          success: true,
          message: 'Rollback initiated'
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
