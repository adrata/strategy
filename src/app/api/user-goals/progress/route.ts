/**
 * User Goals Progress API
 * Get user progress toward goals
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserGoalsService } from '@/platform/services/UserGoalsService';

// GET /api/user-goals/progress - Get goal progress
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const workspaceId = searchParams.get('workspaceId');
    
    if (!userId || !workspaceId) {
      return NextResponse.json({
        success: false,
        error: 'userId and workspaceId required'
      }, { status: 400 });
    }
    
    const progress = await UserGoalsService.calculateProgress(userId, workspaceId);
    const onTrack = await UserGoalsService.checkOnTrack(userId, workspaceId);
    const recommendations = await UserGoalsService.getGoalRecommendations(userId, workspaceId);
    
    return NextResponse.json({
      success: true,
      data: {
        progress,
        onTrack,
        recommendations
      }
    });
    
  } catch (error) {
    console.error('Error calculating goal progress:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

