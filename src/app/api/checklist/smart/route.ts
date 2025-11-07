/**
 * Smart Checklist API
 * Generate AI-driven daily action lists based on user goals and data
 */

import { NextRequest, NextResponse } from 'next/server';
import { SmartChecklistService } from '@/platform/services/SmartChecklistService';

// GET /api/checklist/smart - Generate smart checklist
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
    
    const checklist = await SmartChecklistService.generateSmartChecklist(userId, workspaceId);
    
    return NextResponse.json({
      success: true,
      data: checklist
    });
    
  } catch (error) {
    console.error('Error generating smart checklist:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/checklist/smart/refresh - Refresh checklist (after user completes items)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, workspaceId } = body;
    
    if (!userId || !workspaceId) {
      return NextResponse.json({
        success: false,
        error: 'userId and workspaceId required'
      }, { status: 400 });
    }
    
    const checklist = await SmartChecklistService.refreshChecklist(userId, workspaceId);
    
    return NextResponse.json({
      success: true,
      data: checklist
    });
    
  } catch (error) {
    console.error('Error refreshing smart checklist:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

