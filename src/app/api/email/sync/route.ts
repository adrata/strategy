import { NextRequest, NextResponse } from "next/server";
import { EmailPlatformIntegrator } from "@/platform/services/email-platform-integrator";

export const dynamic = "force-dynamic";
export const maxDuration = 600; // 10 minutes timeout for large email sync

/**
 * Email Sync API - Manual and automatic email synchronization
 * 
 * POST: Trigger manual sync for specific account
 * GET: Get sync status for workspace accounts
 */

export async function POST(request: NextRequest) {
  try {
    const { accountId, platform, workspaceId } = await request.json();

    if (!accountId && !workspaceId) {
      return NextResponse.json(
        { success: false, error: "accountId or workspaceId is required" },
        { status: 400 }
      );
    }

    console.log(`📧 [EMAIL SYNC API] Manual sync requested for account: ${accountId}`);

    let syncResults = [];

    if (accountId) {
      // Get account details to determine platform if not provided
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      const account = await prisma.email_accounts.findUnique({
        where: { id: accountId },
        select: { platform: true, email: true }
      });
      
      if (!account) {
        return NextResponse.json(
          { success: false, error: "Account not found" },
          { status: 404 }
        );
      }
      
      const accountPlatform = platform || account.platform;
      console.log(`📧 [EMAIL SYNC API] Syncing ${account.email} (${accountPlatform})`);
      
      // Sync specific account
      if (accountPlatform === 'outlook') {
        const result = await EmailPlatformIntegrator.syncOutlookEmails(accountId);
        syncResults.push({ accountId, platform: accountPlatform, result });
      } else {
        return NextResponse.json(
          { success: false, error: `Platform ${accountPlatform} not supported` },
          { status: 400 }
        );
      }
      
      await prisma.$disconnect();
    } else if (workspaceId) {
      // Sync all accounts in workspace
      // TODO: Get all accounts for workspace and sync each
      console.log(`📧 Workspace sync not yet implemented for: ${workspaceId}`);
      return NextResponse.json(
        { success: false, error: "Workspace sync not yet implemented" },
        { status: 501 }
      );
    }

    console.log(`✅ [EMAIL SYNC API] Sync completed successfully`);

    return NextResponse.json({
      success: true,
      results: syncResults,
      message: `Synced ${syncResults.length} account(s)`
    });

  } catch (error) {
    console.error("❌ [EMAIL SYNC API] Sync failed:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Email sync failed",
        details: error instanceof Error ? error.message : "Unknown error"
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
        { success: false, error: "workspaceId is required" },
        { status: 400 }
      );
    }

    console.log(`📧 [EMAIL SYNC API] Getting sync status for workspace: ${workspaceId}`);

    // TODO: Get all email accounts for workspace and their sync status
    // This would typically fetch from the database
    const accounts = [
      // Mock data for now
      {
        id: "outlook_account_1",
        platform: "outlook",
        email: "dano@retail-products.com",
        syncStatus: "healthy",
        lastSyncAt: new Date().toISOString(),
        emailCount: 0
      }
    ];

    return NextResponse.json({
      success: true,
      workspaceId,
      accounts,
      summary: {
        totalAccounts: accounts.length,
        healthyAccounts: accounts.filter(a => a['syncStatus'] === 'healthy').length,
        lastSyncAt: accounts.length > 0 ? Math.max(...accounts.map(a => new Date(a.lastSyncAt).getTime())) : null
      }
    });

  } catch (error) {
    console.error("❌ [EMAIL SYNC API] Failed to get sync status:", error);
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