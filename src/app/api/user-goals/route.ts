/**
 * User Goals API
 * Manage user revenue and activity goals
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserGoalsService, type UserGoals } from '@/platform/services/UserGoalsService';

// GET /api/user-goals - Get user goals
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
    
    const goals = await UserGoalsService.getUserGoals(userId, workspaceId);
    
    return NextResponse.json({
      success: true,
      data: goals
    });
    
  } catch (error) {
    console.error('Error fetching user goals:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/user-goals - Set or update user goals
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, workspaceId, goals } = body;
    
    if (!userId || !workspaceId || !goals) {
      return NextResponse.json({
        success: false,
        error: 'userId, workspaceId, and goals required'
      }, { status: 400 });
    }
    
    const success = await UserGoalsService.setUserGoals(userId, workspaceId, goals as UserGoals);
    
    if (success) {
      // Calculate initial progress
      const progress = await UserGoalsService.calculateProgress(userId, workspaceId);
      
      return NextResponse.json({
        success: true,
        data: {
          goals,
          progress
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to save goals'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error saving user goals:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

