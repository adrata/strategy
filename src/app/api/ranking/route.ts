/**
 * 🏆 RANKING API ENDPOINT
 * 
 * Unified API for the event-driven ranking system
 */

import { NextRequest, NextResponse } from 'next/server';
import { RankingSystem } from '@/platform/services/ranking-system';
import { RANKING_EVENT_TYPES } from '@/platform/services/ranking-system/event-types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const entityType = searchParams.get('entityType') || 'contact';
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const rankingSystem = RankingSystem.getInstance();
    const rankings = await rankingSystem.getSystemRankings(workspaceId, entityType, limit);

    return NextResponse.json({
      success: true,
      data: rankings
    });

  } catch (error) {
    console.error('❌ [RANKING API] Error getting rankings:', error);
    return NextResponse.json(
      { error: 'Failed to get rankings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, userId, eventType, entityType, entityId, eventData } = body;

    if (!workspaceId || !userId || !eventType || !entityType || !entityId) {
      return NextResponse.json(
        { error: 'Missing required fields: workspaceId, userId, eventType, entityType, entityId' },
        { status: 400 }
      );
    }

    // Validate event type
    if (!Object.values(RANKING_EVENT_TYPES).includes(eventType)) {
      return NextResponse.json(
        { error: `Invalid event type: ${eventType}` },
        { status: 400 }
      );
    }

    const rankingSystem = RankingSystem.getInstance();
    
    // Create ranking event
    const event = {
      workspaceId,
      userId,
      eventType,
      entityType,
      entityId,
      eventData: eventData || {},
      impactScore: 0, // Will be calculated
      timestamp: new Date(),
      processed: false
    };

    const updates = await rankingSystem.processRankingEvent(event);

    return NextResponse.json({
      success: true,
      data: {
        eventId: event.id,
        updates: updates,
        message: `Processed ${updates.length} ranking updates`
      }
    });

  } catch (error) {
    console.error('❌ [RANKING API] Error processing ranking event:', error);
    return NextResponse.json(
      { error: 'Failed to process ranking event' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    const rankingSystem = RankingSystem.getInstance();
    const metrics = await rankingSystem.processPendingEvents(workspaceId);

    return NextResponse.json({
      success: true,
      data: metrics,
      message: `Processed ${metrics.processedEvents} events`
    });

  } catch (error) {
    console.error('❌ [RANKING API] Error processing pending events:', error);
    return NextResponse.json(
      { error: 'Failed to process pending events' },
      { status: 500 }
    );
  }
}
