import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

 * GET /api/particle/experiments/[id]
 * Get experiment details with all related data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const experimentId = params.id;

    const experiment = await prisma.particleExperiment.findUnique({
      where: { id: experimentId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        variants: {
          include: {
            testRuns: {
              orderBy: { createdAt: 'desc' },
              take: 10, // Latest 10 test runs per variant
            },
            metrics: {
              orderBy: { timestamp: 'desc' },
              take: 100, // Latest 100 metrics per variant
            },
          },
        },
        testRuns: {
          orderBy: { createdAt: 'desc' },
          take: 50, // Latest 50 test runs
          include: {
            variant: {
              select: {
                id: true,
                name: true,
                isControl: true,
              },
            },
            metrics: {
              orderBy: { timestamp: 'desc' },
            },
          },
        },
        results: {
          orderBy: { calculatedAt: 'desc' },
          take: 10, // Latest 10 results
        },
        assertions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!experiment) {
      return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });
    }

    return NextResponse.json({ experiment });
  } catch (error) {
    console.error('Error fetching experiment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch experiment' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/particle/experiments/[id]
 * Update experiment configuration
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const experimentId = params.id;
    const body = await request.json();

    // Check if experiment exists and user has access
    const existingExperiment = await prisma.particleExperiment.findUnique({
      where: { id: experimentId },
      select: { id: true, createdById: true, status: true },
    });

    if (!existingExperiment) {
      return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });
    }

    if (existingExperiment.createdById !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only allow updates to draft experiments
    if (existingExperiment.status !== 'draft') {
      return NextResponse.json(
        { error: 'Can only update draft experiments' },
        { status: 400 }
      );
    }

    // Allowed fields for update
    const allowedFields = [
      'name',
      'description',
      'hypothesis',
      'targetSampleSize',
      'confidenceLevel',
      'significanceLevel',
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const experiment = await prisma.particleExperiment.update({
      where: { id: experimentId },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        variants: true,
      },
    });

    return NextResponse.json({ experiment });
  } catch (error) {
    console.error('Error updating experiment:', error);
    return NextResponse.json(
      { error: 'Failed to update experiment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/particle/experiments/[id]
 * Archive experiment (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const experimentId = params.id;

    // Check if experiment exists and user has access
    const existingExperiment = await prisma.particleExperiment.findUnique({
      where: { id: experimentId },
      select: { id: true, createdById: true, status: true },
    });

    if (!existingExperiment) {
      return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });
    }

    if (existingExperiment.createdById !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only allow archiving of draft or completed experiments
    if (!['draft', 'completed'].includes(existingExperiment.status)) {
      return NextResponse.json(
        { error: 'Can only archive draft or completed experiments' },
        { status: 400 }
      );
    }

    // Archive the experiment
    const experiment = await prisma.particleExperiment.update({
      where: { id: experimentId },
      data: { status: 'archived' },
    });

    return NextResponse.json({ experiment });
  } catch (error) {
    console.error('Error archiving experiment:', error);
    return NextResponse.json(
      { error: 'Failed to archive experiment' },
      { status: 500 }
    );
  }
}
