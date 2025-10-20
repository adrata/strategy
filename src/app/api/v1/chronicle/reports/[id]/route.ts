import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { sampleChronicleReports } from '@/lib/chronicle-sample-data';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check if this is Ryan Serrato in Notary Everyday
    const workspaceId = session.user.activeWorkspaceId;
    const isNotaryEveryday = workspaceId === '01K1VBYmf75hgmvmz06psnc9ug' || workspaceId === '01K7DNYR5VZ7JY36KGKKN76XZ1';
    const isRyanSerrato = session.user.id === 'cmf0kew2z0000pcsexylorpxp';
    
    if (!(isNotaryEveryday && isRyanSerrato)) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const { id } = params;

    // For now, return sample data. In production, this would query the database
    const report = sampleChronicleReports.find(r => r.id === id);
    
    if (!report) {
      return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...report,
        shares: [] // Mock shares for now
      }
    });

  } catch (error) {
    console.error('Error fetching chronicle report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chronicle report' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { title, content } = body;

    // Update chronicle report
    const report = await prisma.chronicle_reports.update({
      where: { id },
      data: {
        title,
        content,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Error updating chronicle report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update chronicle report' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Soft delete chronicle report
    const report = await prisma.chronicle_reports.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Error deleting chronicle report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete chronicle report' },
      { status: 500 }
    );
  }
}
