import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';

/**
 * 📅 TIMELINE API - Get timeline events for any entity
 * 
 * This API provides timeline data for leads, prospects, opportunities, accounts, contacts
 * It combines record creation, notes, activities, and other events
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { entityType: string; entityId: string } }
) {
  try {
    const { entityType, entityId } = params;
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter: workspaceId'
      }, { status: 400 });
    }

    console.log(`🔍 [TIMELINE API] Fetching timeline for ${entityType} ${entityId} in workspace ${workspaceId}`);

    const timelineEvents: any[] = [];

    // 1. Add record creation event
    const recordCreationEvent = await getRecordCreationEvent(entityType, entityId, workspaceId);
    if (recordCreationEvent) {
      timelineEvents.push(recordCreationEvent);
    }

    // 2. Get notes for this entity
    const notes = await getNotesForEntity(entityType, entityId, workspaceId);
    timelineEvents.push(...notes);

    // 3. Get activities/actions for this entity
    const activities = await getActivitiesForEntity(entityType, entityId, workspaceId);
    timelineEvents.push(...activities);

    // 4. Get status changes (if any)
    const statusChanges = await getStatusChangesForEntity(entityType, entityId, workspaceId);
    timelineEvents.push(...statusChanges);

    // Sort by date (newest first)
    timelineEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    console.log(`✅ [TIMELINE API] Found ${timelineEvents.length} timeline events for ${entityType} ${entityId}`);

    return NextResponse.json({
      success: true,
      timeline: timelineEvents,
      count: timelineEvents.length
    });

  } catch (error) {
    console.error('❌ [TIMELINE API] Error fetching timeline:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch timeline',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getRecordCreationEvent(entityType: string, entityId: string, workspaceId: string) {
  try {
    let record: any = null;
    
    // Get the record based on entity type
    switch (entityType) {
      case 'account':
      case 'companies':
        record = await prisma.companies.findFirst({
          where: { id: entityId, workspaceId }
        });
        break;
      case 'lead':
      case 'leads':
        record = await prisma.leads.findFirst({
          where: { id: entityId, workspaceId }
        });
        break;
      case 'prospect':
      case 'prospects':
        record = await prisma.prospects.findFirst({
          where: { id: entityId, workspaceId }
        });
        break;
      case 'opportunity':
      case 'opportunities':
        record = await prisma.opportunities.findFirst({
          where: { id: entityId, workspaceId }
        });
        break;
      case 'contact':
      case 'people':
        record = await prisma.people.findFirst({
          where: { id: entityId, workspaceId }
        });
        break;
    }

    if (record && record.createdAt) {
      const entityName = entityType === 'account' ? 'company' : 
                        entityType === 'people' ? 'person' : 
                        entityType.slice(0, -1);
      return {
        id: 'record_created',
        type: 'record_created',
        date: record.createdAt.toISOString(),
        title: `${entityName.charAt(0).toUpperCase() + entityName.slice(1)} added to pipeline`,
        description: `New ${entityName} record created in system`,
        user: record.assignedUserId || record.createdBy || 'System',
        source: 'system',
        priority: 'normal'
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting record creation event:', error);
    return null;
  }
}

async function getNotesForEntity(entityType: string, entityId: string, workspaceId: string) {
  try {
    // Build where clause based on entity type
    let whereClause: any = {
      workspaceId,
      isPrivate: false
    };

    switch (entityType) {
      case 'account':
      case 'companies':
        whereClause.OR = [
          { accountId: entityId },
          { companyId: entityId }
        ];
        break;
      case 'lead':
      case 'leads':
        whereClause.leadId = entityId;
        break;
      case 'prospect':
      case 'prospects':
        whereClause.personId = entityId;
        break;
      case 'opportunity':
      case 'opportunities':
        whereClause.opportunityId = entityId;
        break;
      case 'contact':
      case 'people':
        whereClause.contactId = entityId;
        break;
    }

    const notes = await prisma.notes.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return notes.map(note => ({
      id: note.id,
      type: 'note',
      date: note.createdAt.toISOString(),
      title: note.title || 'Note added',
      description: note.content ? note.content.substring(0, 100) + (note.content.length > 100 ? '...' : '') : '',
      user: note.authorId || 'System',
      source: 'note',
      priority: note.priority || 'normal',
      metadata: {
        content: note.content,
        type: note.type,
        isPrivate: note.isPrivate
      }
    }));
  } catch (error) {
    console.error('Error getting notes for entity:', error);
    return [];
  }
}

async function getActivitiesForEntity(entityType: string, entityId: string, workspaceId: string) {
  try {
    // Build where clause based on entity type
    let whereClause: any = {
      workspaceId
    };

    switch (entityType) {
      case 'account':
      case 'companies':
        whereClause.accountId = entityId;
        break;
      case 'lead':
      case 'leads':
        whereClause.leadId = entityId;
        break;
      case 'prospect':
      case 'prospects':
        whereClause.personId = entityId;
        break;
      case 'opportunity':
      case 'opportunities':
        whereClause.opportunityId = entityId;
        break;
      case 'contact':
      case 'people':
        whereClause.contactId = entityId;
        break;
    }

    const activities = await prisma.actions.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return activities.map(activity => ({
      id: activity.id,
      type: 'activity',
      date: activity.createdAt.toISOString(),
      title: activity.subject || 'Activity',
      description: activity.description || '',
      user: activity.userId || 'System',
      source: 'activity',
      priority: activity.priority || 'normal',
      metadata: {
        type: activity.type,
        status: activity.status,
        scheduledAt: activity.scheduledAt?.toISOString()
      }
    }));
  } catch (error) {
    console.error('Error getting activities for entity:', error);
    return [];
  }
}

async function getStatusChangesForEntity(entityType: string, entityId: string, workspaceId: string) {
  // For now, return empty array - status changes could be tracked in the future
  // This would require additional tracking of status changes over time
  return [];
}
