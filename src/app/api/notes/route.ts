import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';

/**
 * 📝 NOTES API - Create and manage notes
 * 
 * This API handles creating notes that are linked to specific records
 * and will appear in the timeline
 */

// POST: Create a new note
export async function POST(request: NextRequest) {
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
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: content, workspaceId, userId'
      }, { status: 400 });
    }

    // Validate that at least one record is linked
    if (!leadId && !opportunityId && !accountId && !contactId && !personId && !companyId) {
      return NextResponse.json({
        success: false,
        error: 'At least one record must be linked (leadId, opportunityId, accountId, contactId, personId, or companyId)'
      }, { status: 400 });
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

    return NextResponse.json({
      success: true,
      note,
      message: 'Note created successfully'
    });

  } catch (error) {
    console.error('❌ [NOTES API] Error creating note:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create note',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET: Retrieve notes for a specific record
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get('recordId');
    const recordType = searchParams.get('recordType');
    const workspaceId = searchParams.get('workspaceId');

    if (!recordId || !recordType || !workspaceId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: recordId, recordType, workspaceId'
      }, { status: 400 });
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
      take: 100 // Limit to 100 most recent notes
    });

    console.log(`✅ [NOTES API] Retrieved ${notes.length} notes for ${recordType} ${recordId}`);

    return NextResponse.json({
      success: true,
      notes,
      count: notes.length
    });

  } catch (error) {
    console.error('❌ [NOTES API] Error retrieving notes:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve notes',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
