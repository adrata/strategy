import { NextRequest, NextResponse } from "next/server";
import { emailLinkingService } from "@/platform/services/EmailLinkingService";

export const dynamic = "force-dynamic";
export const maxDuration = 600; // 10 minutes timeout for large linking operations

/**
 * Email Linking API
 * 
 * POST: Link emails to contacts, leads, accounts, and prospects
 */

export async function POST(request: NextRequest) {
  try {
    const { workspaceId, dateRange, linkAll } = await request.json();

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: "workspaceId is required" },
        { status: 400 }
      );
    }

    console.log(`🔗 [EMAIL LINKING API] Linking emails for workspace: ${workspaceId}`);

    let result;

    if (linkAll) {
      // Link all unlinked emails
      result = await emailLinkingService.linkAllUnlinkedEmails(workspaceId);
    } else if (dateRange && dateRange['start'] && dateRange.end) {
      // Link emails in specific date range
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      result = await emailLinkingService.linkEmailsInDateRange(workspaceId, startDate, endDate);
    } else {
      return NextResponse.json(
        { success: false, error: "Either linkAll=true or dateRange is required" },
        { status: 400 }
      );
    }

    console.log(`✅ [EMAIL LINKING API] Linking completed successfully`);

    return NextResponse.json({
      success: true,
      result,
      message: `Linked ${result.linkedEmails} emails to entities`
    });

  } catch (error) {
    console.error("❌ [EMAIL LINKING API] Linking failed:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Email linking failed",
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

    console.log(`📊 [EMAIL LINKING API] Getting linking status for workspace: ${workspaceId}`);

    // Get linking statistics
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // Get total emails
    const totalEmails = await prisma.email_messages.count({
      where: {
        accountId: {
          in: await prisma.email_accounts.findMany({
            where: { workspaceId },
            select: { id: true }
          }).then(accounts => accounts.map(a => a.id))
        }
      }
    });

    // Get linked emails
    const linkedEmails = await prisma.emailToContact.count({
      where: {
        A: {
          in: await prisma.email_messages.findMany({
            where: {
              accountId: {
                in: await prisma.email_accounts.findMany({
                  where: { workspaceId },
                  select: { id: true }
                }).then(accounts => accounts.map(a => a.id))
              }
            },
            select: { id: true }
          }).then(emails => emails.map(e => e.id))
        }
      }
    });

    const linkingPercentage = totalEmails > 0 ? Math.round((linkedEmails / totalEmails) * 100) : 0;

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      workspaceId,
      statistics: {
        totalEmails,
        linkedEmails,
        unlinkedEmails: totalEmails - linkedEmails,
        linkingPercentage
      }
    });

  } catch (error) {
    console.error("❌ [EMAIL LINKING API] Failed to get linking status:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to get linking status",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
