import { NextRequest, NextResponse } from 'next/server';
<parameter name="get">UnifiedAuthUser } from '@/platform/api-auth';
import { prisma } from '@/lib/prisma';

// Required for static export (desktop build)
export const dynamic = 'force-dynamic';

/**
 * DELETE /api/v1/emails/delete-templates
 * Delete template/demo emails for the current workspace
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUnifiedAuthUser(request);
    if (!user || !user.activeWorkspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Template email subjects to delete
    const templateSubjects = [
      'Welcome to Adrata - Getting Started Guide',
      'Quarterly Business Review - Q4 2024',
      'Re: Product Demo Follow-up'
    ];

    // Delete template emails
    const result = await prisma.email_messages.deleteMany({
      where: {
        workspaceId: user.activeWorkspaceId,
        OR: [
          // Delete by subject
          { subject: { in: templateSubjects } },
          // Delete by demo message ID prefix
          { messageId: { startsWith: 'demo-' } }
        ]
      }
    });

    console.log(`✅ Deleted ${result.count} template emails for workspace: ${user.activeWorkspaceId}`);

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `Deleted ${result.count} template emails`
    });
  } catch (error) {
    console.error('❌ Error deleting template emails:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete template emails',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

