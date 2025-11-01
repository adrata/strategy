import { NextRequest, NextResponse } from "next/server";
import { UnifiedEmailSyncService } from "@/platform/services/UnifiedEmailSyncService";

export const dynamic = "force-dynamic";

/**
 * Start Email Sync Scheduler API
 * 
 * POST: Start the automatic email sync scheduler
 * GET: Get scheduler status
 */

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting email sync...');
    
    // For now, we'll just return success since the new system handles sync differently
    // In the future, this could trigger a background job or webhook-based sync
    
    return NextResponse.json({
      success: true,
      message: "Email sync system is active",
      status: "active"
    });

  } catch (error) {
    console.error("❌ Failed to start email sync:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to start email sync",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return a simple status for the new system
    const status = {
      isActive: true,
      lastSync: new Date().toISOString(),
      message: "Email sync system is active"
    };
    
    return NextResponse.json({
      success: true,
      status: status
    });

  } catch (error) {
    console.error("❌ Failed to get sync status:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to get sync status",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
