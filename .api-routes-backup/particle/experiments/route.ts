import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * GET /api/particle/experiments
 * Get all experiments for the current workspace with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const experimentType = searchParams.get('type');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    // Build where clause
    const where: any = {
      workspaceId,
    };

    if (experimentType) {
      where.experimentType = experimentType;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { hypothesis: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get experiments with pagination
    const [experiments, total] = await Promise.all([
      prisma.particleExperiment.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          variants: {
            select: {
              id: true,
              name: true,
              isControl: true,
              weight: true,
            },
          },
          _count: {
            select: {
              testRuns: true,
              results: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.particleExperiment.count({ where }),
    ]);

    return NextResponse.json({
      experiments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching experiments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch experiments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/particle/experiments
 * Create a new experiment
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      workspaceId,
      name,
      description,
      hypothesis,
      experimentType,
      targetSampleSize,
      confidenceLevel,
      significanceLevel,
      variants,
    } = body;

    if (!workspaceId || !name || !hypothesis || !experimentType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!variants || variants.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 variants are required' },
        { status: 400 }
      );
    }

    // Validate that exactly one variant is marked as control
    const controlVariants = variants.filter((v: any) => v.isControl);
    if (controlVariants.length !== 1) {
      return NextResponse.json(
        { error: 'Exactly one variant must be marked as control' },
        { status: 400 }
      );
    }

    // Validate that weights sum to 1.0
    const totalWeight = variants.reduce((sum: number, v: any) => sum + v.weight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      return NextResponse.json(
        { error: 'Variant weights must sum to 1.0' },
        { status: 400 }
      );
    }

    // Create experiment with variants in a transaction
    const experiment = await prisma.$transaction(async (tx) => {
      // Create the experiment
      const newExperiment = await tx.particleExperiment.create({
        data: {
          workspaceId,
          name,
          description,
          hypothesis,
          experimentType,
          targetSampleSize,
          confidenceLevel: confidenceLevel || 0.95,
          significanceLevel: significanceLevel || 0.05,
          createdById: session.user.id,
        },
      });

      // Create variants
      const createdVariants = await Promise.all(
        variants.map((variant: any) =>
          tx.particleVariant.create({
            data: {
              experimentId: newExperiment.id,
              name: variant.name,
              description: variant.description,
              configuration: variant.configuration || {},
              isControl: variant.isControl,
              weight: variant.weight,
            },
          })
        )
      );

      // Set baseline variant ID
      const controlVariant = createdVariants.find(v => v.isControl);
      if (controlVariant) {
        await tx.particleExperiment.update({
          where: { id: newExperiment.id },
          data: { baselineVariantId: controlVariant.id },
        });
      }

      return {
        ...newExperiment,
        baselineVariantId: controlVariant?.id,
        variants: createdVariants,
      };
    });

    return NextResponse.json({ experiment }, { status: 201 });
  } catch (error) {
    console.error('Error creating experiment:', error);
    return NextResponse.json(
      { error: 'Failed to create experiment' },
      { status: 500 }
    );
  }
}
