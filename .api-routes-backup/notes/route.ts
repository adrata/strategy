import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';


import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
/**
 * 📝 NOTES API - Create and manage notes
 * 
 * This API handles creating notes that are linked to specific records
 * and will appear in the timeline
 */

// POST: Create a new note
export async function POST(request: NextRequest) {
  // 1. Authenticate and authorize user
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response; // Return error response if authentication failed
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const { searchParams } = new URL(request.url);
    
    // Use authenticated user's workspace and ID
    const workspaceId = context.workspaceId;
    const userId = context.userId;

    try {
    const body = await request.json();
    const {
      content,
      title,
      type = 'general',
      priority = 'normal',
      isPrivate = false,
      workspaceId,
      userId,
      // Record linking fields - at least one should be provided
      leadId,
      opportunityId,
      accountId,
      contactId,
      personId,
      companyId
    } = body;

    // Validate required fields
    if (!content || !workspaceId || !userId) {
      return createErrorResponse('$1', '$2', $3);
    }

    // Validate that at least one record is linked
    if (!leadId && !opportunityId && !accountId && !contactId && !personId && !companyId) {
      return createErrorResponse('$1', '$2', $3);
    }

    // Create the note
    const note = await prisma.notes.create({
      data: {
        id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        workspaceId,
        authorId: userId,
        content: content.trim(),
        title: title?.trim() || null,
        type,
        priority,
        isPrivate,
        leadId: leadId || null,
        opportunityId: opportunityId || null,
        accountId: accountId || null,
        contactId: contactId || null,
        personId: personId || null,
        companyId: companyId || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('✅ [NOTES API] Created note:', {
      id: note.id,
      title: note.title,
      type: note.type,
      workspaceId: note.workspaceId,
      linkedRecords: {
        leadId: note.leadId,
        opportunityId: note.opportunityId,
        accountId: note.accountId,
        contactId: note.contactId,
        personId: note.personId,
        companyId: note.companyId
      }
    });

    return createSuccessResponse(data, meta);

  } catch (error) {
    console.error('❌ [NOTES API] Error creating note:', error);
    return createErrorResponse(
      'Failed to create note',
      'CREATE_NOTE_ERROR',
      500
    );
  }
}

// GET: Retrieve notes for a specific record
export async function GET(request: NextRequest) {
  // 1. Authenticate and authorize user
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response; // Return error response if authentication failed
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const { searchParams } = new URL(request.url);
    
    // Use authenticated user's workspace and ID
    const workspaceId = context.workspaceId;
    const userId = context.userId;

    try {
    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get('recordId');
    const recordType = searchParams.get('recordType');
    // Use secure context instead of query parameters
    const workspaceId = context.workspaceId;

    if (!recordId || !recordType || !workspaceId) {
      return createErrorResponse('Record ID, record type, and workspace are required', 'VALIDATION_ERROR', 400);
    }

    // Build the where clause based on record type
    let whereClause: any = {
      workspaceId,
      isPrivate: false // Only get public notes by default
    };

    // Add the appropriate record ID field based on type
    switch (recordType) {
      case 'leads':
        whereClause.leadId = recordId;
        break;
      case 'opportunities':
        whereClause.opportunityId = recordId;
        break;
      case 'companies':
        whereClause.accountId = recordId;
        break;
      case 'people':
        whereClause.contactId = recordId;
        break;
      case 'prospects':
        whereClause.personId = recordId;
        break;
      default:
        // For companies, also check companyId field
        if (recordType === 'companies') {
          whereClause = {
            ...whereClause,
            OR: [
              { accountId: recordId },
              { companyId: recordId }
            ]
          };
        }
    }

    const notes = await prisma.notes.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 2000 // Increased limit to prevent pagination issues
    });

    console.log(`✅ [NOTES API] Retrieved ${notes.length} notes for ${recordType} ${recordId}`);

    return createSuccessResponse(notes, meta);

  } catch (error) {
    console.error('❌ [NOTES API] Error retrieving notes:', error);
    return createErrorResponse(
      'Failed to retrieve notes',
      'RETRIEVE_NOTES_ERROR',
      500
    );
  }
}
