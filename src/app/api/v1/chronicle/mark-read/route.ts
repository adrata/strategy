import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { reportId } = await request.json();
    
    if (!reportId) {
      return NextResponse.json({ success: false, message: 'Report ID is required' }, { status: 400 });
    }

    // Check if report exists
    const report = await prisma.chronicleReport.findUnique({
      where: { id: reportId }
    });

    if (!report) {
      return NextResponse.json({ success: false, message: 'Report not found' }, { status: 404 });
    }

    // Create or update read status for this user and report
    const readStatus = await prisma.chronicleReadStatus.upsert({
      where: {
        reportId_userId: {
          reportId: reportId,
          userId: session.user.id
        }
      },
      update: {
        readAt: new Date()
      },
      create: {
        reportId: reportId,
        userId: session.user.id,
        workspaceId: report.workspaceId,
        readAt: new Date()
      }
    });

    console.log(`📖 [CHRONICLE] Report ${reportId} marked as read by user ${session.user.id} at ${readStatus.readAt}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Report marked as read',
      data: { reportId, readAt: readStatus.readAt.toISOString() }
    });

  } catch (error) {
    console.error('Error marking Chronicle report as read:', error);
    return NextResponse.json({ success: false, message: 'Failed to mark report as read' }, { status: 500 });
  }
}
