import { NextRequest, NextResponse } from 'next/server';
import { TokenRefreshScheduler } from '@/platform/services/TokenRefreshScheduler';

export const dynamic = "force-dynamic";

/**
 * POST: Start the token refresh scheduler
 */
export async function POST(request: NextRequest) {
  try {
    console.log("🔄 [TOKEN REFRESH] Starting token refresh scheduler...");
    
    const scheduler = TokenRefreshScheduler.getInstance();
    scheduler.start();
    
    const status = scheduler.getStatus();
    
    return NextResponse.json({
      success: true,
      message: "Token refresh scheduler started",
      status: status
    });

  } catch (error) {
    console.error("❌ [TOKEN REFRESH] Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to start token refresh scheduler",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Get token refresh scheduler status
 */
export async function GET(request: NextRequest) {
  try {
    const scheduler = TokenRefreshScheduler.getInstance();
    const status = scheduler.getStatus();
    
    return NextResponse.json({
      success: true,
      status: status
    });

  } catch (error) {
    console.error("❌ [TOKEN REFRESH] Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to get token refresh scheduler status",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
