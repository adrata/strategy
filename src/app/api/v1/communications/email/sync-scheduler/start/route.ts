import { NextRequest, NextResponse } from "next/server";
import { emailSyncScheduler } from "@/platform/services/EmailSyncScheduler";

export const dynamic = "force-dynamic";

/**
 * Start Email Sync Scheduler API
 * 
 * POST: Start the automatic email sync scheduler
 * GET: Get scheduler status
 */

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting email sync scheduler...');
    
    emailSyncScheduler.startScheduler();
    
    return NextResponse.json({
      success: true,
      message: "Email sync scheduler started successfully",
      status: emailSyncScheduler.getStatus()
    });

  } catch (error) {
    console.error("❌ Failed to start email sync scheduler:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to start email sync scheduler",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const status = emailSyncScheduler.getStatus();
    
    return NextResponse.json({
      success: true,
      status: status
    });

  } catch (error) {
    console.error("❌ Failed to get scheduler status:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to get scheduler status",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
