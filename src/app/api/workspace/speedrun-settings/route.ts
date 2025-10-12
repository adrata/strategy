import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    // Get workspace with speedrun settings
    const workspace = await prisma.workspaces.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        name: true,
        speedrunDailyTarget: true,
        speedrunWeeklyTarget: true,
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Return settings with defaults if not set
    const settings = {
      dailyTarget: workspace.speedrunDailyTarget ?? 50,
      weeklyTarget: workspace.speedrunWeeklyTarget ?? 250,
    };

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error fetching speedrun settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch speedrun settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workspaceId, dailyTarget, weeklyTarget } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    if (typeof dailyTarget !== 'number' || typeof weeklyTarget !== 'number') {
      return NextResponse.json(
        { error: 'Daily and weekly targets must be numbers' },
        { status: 400 }
      );
    }

    if (dailyTarget < 1 || dailyTarget > 1000 || weeklyTarget < 1 || weeklyTarget > 5000) {
      return NextResponse.json(
        { error: 'Targets must be between 1-1000 (daily) and 1-5000 (weekly)' },
        { status: 400 }
      );
    }

    // Update workspace settings
    const updatedWorkspace = await prisma.workspaces.update({
      where: { id: workspaceId },
      data: {
        speedrunDailyTarget: dailyTarget,
        speedrunWeeklyTarget: weeklyTarget,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        speedrunDailyTarget: true,
        speedrunWeeklyTarget: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        dailyTarget: updatedWorkspace.speedrunDailyTarget,
        weeklyTarget: updatedWorkspace.speedrunWeeklyTarget,
      },
    });
  } catch (error) {
    console.error('Error updating speedrun settings:', error);
    return NextResponse.json(
      { error: 'Failed to update speedrun settings' },
      { status: 500 }
    );
  }
}
