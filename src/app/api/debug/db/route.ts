/**
 * Debug Database Connection
 * 
 * This endpoint tests the database connection and shows
 * basic database information.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/platform/database/prisma-client';

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [DB DEBUG] Testing database connection...");
    
    // Test basic database connection
    const startTime = Date.now();
    const userCount = await prisma.users.count();
    const connectionTime = Date.now() - startTime;
    
    console.log("🔍 [DB DEBUG] Database connection successful");
    console.log("🔍 [DB DEBUG] Connection time:", connectionTime + "ms");
    console.log("🔍 [DB DEBUG] User count:", userCount);
    
    // Test workspace query
    const workspaceCount = await prisma.workspaces.count();
    console.log("🔍 [DB DEBUG] Workspace count:", workspaceCount);
    
    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        connectionTime: connectionTime + "ms",
        userCount,
        workspaceCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ [DB DEBUG] Database connection failed:", error);
    
    return NextResponse.json({
      success: false,
      database: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
