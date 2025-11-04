/**
 * Oasis Messages API
 * 
 * Handles message sending and fetching
 */
// Required for static export (desktop build)
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedAuthUser } from '@/platform/api-auth';
import { prisma } from '@/lib/prisma';
import { OasisRealtimeService } from '@/platform/services/oasis-realtime-service';

// GET /api/oasis/messages - Get messages for channel or DM
export async function GET(request: NextRequest) {
  // Step 1: Early error logging - log that request was received
  console.log('📥 [OASIS MESSAGES] GET request received:', request.url);
  
  try {
    // Step 1: Parse parameters with error handling
    let channelId: string | null = null;
    let dmId: string | null = null;
    let workspaceId: string | null = null;
    let limit = 50;
    let offset = 0;
    
    try {
      const url = new URL(request.url);
      const { searchParams } = url;
      channelId = searchParams.get('channelId');
      dmId = searchParams.get('dmId');
      workspaceId = searchParams.get('workspaceId');
      limit = parseInt(searchParams.get('limit') || '50', 10);
      offset = parseInt(searchParams.get('offset') || '0', 10);
      
      console.log('📋 [OASIS MESSAGES] Parsed parameters:', {
        channelId,
        dmId,
        workspaceId,
        limit,
        offset
      });
    } catch (urlError) {
      console.error('❌ [OASIS MESSAGES] URL parsing error:', urlError);
      return NextResponse.json(
        { error: 'Invalid request URL', details: urlError instanceof Error ? urlError.message : String(urlError) },
        { status: 400 }
      );
    }

    // Authenticate user
    const authUser = await getUnifiedAuthUser(request);
    if (!authUser) {
      console.error('❌ [OASIS MESSAGES] Authentication failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Validate userId exists
    if (!authUser.id) {
      console.error('❌ [OASIS MESSAGES] User ID missing from auth user');
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 401 });
    }

    const userId = authUser.id;
    const userEmail = authUser.email || undefined; // Safe email access
    
    console.log('✅ [OASIS MESSAGES] User authenticated:', { userId, userEmail });

    // Check if this is Ross (special user who sees all DMs)
    const ROSS_USER_ID = '01K1VBYZG41K9QA0D9CF06KNRG';
    const ROSS_EMAIL = 'ross@adrata.com';
    const isRoss = userId === ROSS_USER_ID || userEmail === ROSS_EMAIL;

    // Validate required parameters upfront
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID required' },
        { status: 400 }
      );
    }

    if (!channelId && !dmId) {
      return NextResponse.json(
        { error: 'Channel ID or DM ID required' },
        { status: 400 }
      );
    }

    // Verify access to channel or DM
    if (channelId) {
      const channelWhereClause: any = {
        id: channelId,
        members: {
          some: { userId: userId }
        }
      };
      
      // Only filter by workspace if NOT Ross
      if (!isRoss) {
        channelWhereClause.workspaceId = workspaceId;
      }

      const channel = await prisma.oasisChannel.findFirst({
        where: channelWhereClause
      });

      if (!channel) {
        console.error('❌ [OASIS MESSAGES] Channel access denied:', { channelId, userId, workspaceId });
        return NextResponse.json({ error: 'Access denied or channel not found' }, { status: 403 });
      }
    }

    if (dmId) {
      console.log('🔍 [OASIS MESSAGES] Looking up DM:', { dmId, userId, workspaceId, isRoss });
      
      const dmWhereClause: any = {
        id: dmId,
        participants: {
          some: { userId: userId }
        }
      };
      
      // Only filter by workspace if NOT Ross
      if (!isRoss) {
        dmWhereClause.workspaceId = workspaceId;
      }

      const dm = await prisma.oasisDirectMessage.findFirst({
        where: dmWhereClause,
        select: {
          id: true,
          workspaceId: true,
          participants: {
            select: {
              userId: true
            }
          }
        }
      });

      if (!dm) {
        console.error('❌ [OASIS MESSAGES] DM access denied:', { dmId, userId, workspaceId, isRoss });
        return NextResponse.json({ error: 'Access denied or DM not found' }, { status: 403 });
      }

      console.log('✅ [OASIS MESSAGES] DM found:', { 
        dmId: dm.id, 
        dmWorkspaceId: dm.workspaceId, 
        requestedWorkspaceId: workspaceId,
        isRoss,
        workspaceMatch: dm.workspaceId === workspaceId
      });

      // For non-Ross users: Verify the workspaceId parameter matches the DM's actual workspaceId
      if (!isRoss && dm.workspaceId !== workspaceId) {
        console.error('❌ [OASIS MESSAGES] Workspace mismatch for non-Ross user:', {
          dmId: dm.id,
          dmWorkspaceId: dm.workspaceId,
          requestedWorkspaceId: workspaceId,
          userId
        });
        return NextResponse.json(
          { error: 'Workspace access denied' },
          { status: 403 }
        );
      }

      // For Ross: Allow cross-workspace access (workspaceId parameter can differ from DM's workspaceId)
      if (isRoss && dm.workspaceId !== workspaceId) {
        console.log('🌐 [OASIS MESSAGES] Ross viewing cross-workspace DM:', {
          dmId: dm.id,
          dmWorkspaceId: dm.workspaceId,
          requestedWorkspaceId: workspaceId
        });
      }
    }

    // Step 2: Validate dmId or channelId exists before querying (with try-catch)
    if (dmId && !channelId) {
      try {
        console.log('🔍 [OASIS MESSAGES] Verifying DM exists before query:', { dmId });
        const dmExists = await prisma.oasisDirectMessage.findUnique({
          where: { id: dmId },
          select: { id: true }
        });
        if (!dmExists) {
          console.error('❌ [OASIS MESSAGES] DM not found before message query:', { dmId });
          return NextResponse.json(
            { 
              error: 'DM not found',
              dmId,
              workspaceId,
              userId
            },
            { status: 404 }
          );
        }
        console.log('✅ [OASIS MESSAGES] DM verified:', { dmId });
      } catch (dmCheckError) {
        console.error('❌ [OASIS MESSAGES] Error checking DM existence:', dmCheckError);
        if (dmCheckError instanceof Error) {
          console.error('❌ [OASIS MESSAGES] DM check error details:', {
            message: dmCheckError.message,
            stack: dmCheckError.stack,
            name: dmCheckError.name
          });
        }
        return NextResponse.json(
          { 
            error: 'Failed to verify DM',
            details: dmCheckError instanceof Error ? dmCheckError.message : String(dmCheckError),
            dmId,
            workspaceId,
            userId
          },
          { status: 500 }
        );
      }
    }

    if (channelId && !dmId) {
      try {
        console.log('🔍 [OASIS MESSAGES] Verifying channel exists before query:', { channelId });
        const channelExists = await prisma.oasisChannel.findUnique({
          where: { id: channelId },
          select: { id: true }
        });
        if (!channelExists) {
          console.error('❌ [OASIS MESSAGES] Channel not found before message query:', { channelId });
          return NextResponse.json(
            { 
              error: 'Channel not found',
              channelId,
              workspaceId,
              userId
            },
            { status: 404 }
          );
        }
        console.log('✅ [OASIS MESSAGES] Channel verified:', { channelId });
      } catch (channelCheckError) {
        console.error('❌ [OASIS MESSAGES] Error checking channel existence:', channelCheckError);
        if (channelCheckError instanceof Error) {
          console.error('❌ [OASIS MESSAGES] Channel check error details:', {
            message: channelCheckError.message,
            stack: channelCheckError.stack,
            name: channelCheckError.name
          });
        }
        return NextResponse.json(
          { 
            error: 'Failed to verify channel',
            details: channelCheckError instanceof Error ? channelCheckError.message : String(channelCheckError),
            channelId,
            workspaceId,
            userId
          },
          { status: 500 }
        );
      }
    }

    // Step 4 & 5: Get messages with comprehensive error handling and validation
    let messages: any[] = [];
    try {
      console.log('📡 [OASIS MESSAGES] Fetching messages from DB:', { 
        channelId, 
        dmId, 
        workspaceId, 
        userId, 
        isRoss,
        limit, 
        offset 
      });
      
      // Build where clause explicitly to avoid Prisma validation errors
      const whereClause: any = {
        parentMessageId: null // Only top-level messages, not thread replies
      };
      
      if (channelId) {
        whereClause.channelId = channelId;
      }
      
      if (dmId) {
        whereClause.dmId = dmId;
      }
      
      console.log('🔍 [OASIS MESSAGES] Prisma where clause:', JSON.stringify(whereClause, null, 2));
      
      const queryResult = await prisma.oasisMessage.findMany({
        where: whereClause,
        include: {
          sender: {
            select: { id: true, name: true, username: true, email: true }
          },
          reactions: {
            include: {
              user: {
                select: { id: true, name: true, username: true, email: true }
              }
            }
          },
          // Using other_OasisMessage as defined in schema-streamlined.prisma
          other_OasisMessage: {
            take: 3,
            orderBy: { createdAt: 'asc' },
            include: {
              sender: {
                select: { id: true, name: true, username: true, email: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });
      
      // Step 4: Validate query results
      if (!Array.isArray(queryResult)) {
        console.error('❌ [OASIS MESSAGES] Query returned non-array result:', typeof queryResult, queryResult);
        messages = [];
      } else {
        messages = queryResult;
      }
      
      console.log('✅ [OASIS MESSAGES] Fetched messages from DB:', { 
        count: messages.length,
        channelId,
        dmId,
        workspaceId,
        isArray: Array.isArray(messages)
      });
    } catch (dbError) {
      console.error('❌ [OASIS MESSAGES] Database query error:', dbError);
      if (dbError instanceof Error) {
        console.error('❌ [OASIS MESSAGES] DB Error details:', {
          message: dbError.message,
          stack: dbError.stack,
          name: dbError.name,
          channelId,
          dmId,
          workspaceId,
          userId,
          isRoss
        });
      } else {
        console.error('❌ [OASIS MESSAGES] Unknown DB error type:', typeof dbError, dbError);
      }
      // Initialize messages as empty array if query fails
      messages = [];
      // Re-throw to be caught by outer catch for proper error response
      throw dbError;
    }

    // Step 4: Validate messages array before formatting
    if (!Array.isArray(messages)) {
      console.error('❌ [OASIS MESSAGES] Messages is not an array:', typeof messages);
      messages = [];
    }

    console.log('🔄 [OASIS MESSAGES] Formatting messages:', { messageCount: messages.length });
    
    // Format messages with defensive null checks
    const formattedMessages = messages.map(message => {
      // Safely access sender
      const sender = message.sender || { name: null, username: null, email: null };
      const senderName = sender.name || sender.username || sender.email?.split('@')[0] || 'Unknown';
      
      // Safely map reactions
      const reactions = (message.reactions || []).map(reaction => {
        const reactionUser = reaction.user || { name: null, username: null, email: null };
        return {
          id: reaction.id,
          emoji: reaction.emoji,
          userId: reaction.userId,
          userName: reactionUser.name || reactionUser.username || reactionUser.email?.split('@')[0] || 'Unknown',
          createdAt: reaction.createdAt
        };
      });
      
      // Safely map thread messages (using other_OasisMessage from schema-streamlined.prisma)
      const threadMessages = (message.other_OasisMessage || []).map(threadMessage => {
        const threadSender = threadMessage.sender || { name: null, username: null, email: null };
        return {
          id: threadMessage.id,
          content: threadMessage.content,
          senderId: threadMessage.senderId,
          senderName: threadSender.name || threadSender.username || threadSender.email?.split('@')[0] || 'Unknown',
          senderUsername: threadSender.username,
          createdAt: threadMessage.createdAt
        };
      });
      
      return {
        id: message.id,
        content: message.content,
        channelId: message.channelId,
        dmId: message.dmId,
        senderId: message.senderId,
        senderName,
        senderUsername: sender.username,
        parentMessageId: message.parentMessageId,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        reactions,
        threadCount: threadMessages.length,
        threadMessages
      };
    });

    console.log('✅ [OASIS MESSAGES] Formatting complete, returning response:', {
      formattedCount: formattedMessages.length,
      hasMore: messages.length === limit,
      channelId,
      dmId,
      workspaceId
    });

    return NextResponse.json({ 
      messages: formattedMessages.reverse(), // Reverse to show oldest first
      hasMore: messages.length === limit
    });

  } catch (error) {
    // Step 3 & 5: Comprehensive error logging with full context
    console.error('❌ [OASIS MESSAGES] GET error caught in outer catch:', error);
    
    // Get request context for better error logging
    let authUser: any = null;
    let channelId: string | null = null;
    let dmId: string | null = null;
    let workspaceId: string | null = null;
    
    try {
      authUser = await getUnifiedAuthUser(request);
    } catch (authError) {
      console.error('❌ [OASIS MESSAGES] Failed to get auth user for error logging:', authError);
    }
    
    try {
      const url = new URL(request.url);
      channelId = url.searchParams.get('channelId');
      dmId = url.searchParams.get('dmId');
      workspaceId = url.searchParams.get('workspaceId');
    } catch (urlError) {
      console.error('❌ [OASIS MESSAGES] Failed to parse URL for error logging:', urlError);
    }

    console.error('❌ [OASIS MESSAGES] Request context:', {
      channelId,
      dmId,
      workspaceId,
      userId: authUser?.id,
      userEmail: authUser?.email,
      url: request.url
    });

    // Log full error details for debugging
    if (error instanceof Error) {
      console.error('❌ [OASIS MESSAGES] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        cause: error.cause
      });
    } else {
      console.error('❌ [OASIS MESSAGES] Unknown error type:', typeof error, error);
    }
    
    // Step 3: Return more descriptive error with full context
    const isDevelopment = process.env.NODE_ENV === 'development';
    const errorResponse: any = {
      error: 'Failed to fetch messages',
      context: {
        channelId,
        dmId,
        workspaceId,
        userId: authUser?.id
      }
    };
    
    if (isDevelopment && error instanceof Error) {
      errorResponse.details = error.message;
      errorResponse.type = error.name;
      if (error.stack) {
        errorResponse.stack = error.stack.split('\n').slice(0, 10).join('\n'); // First 10 lines of stack
      }
    } else if (error instanceof Error) {
      errorResponse.details = 'Internal server error';
      // Still include error type even in production for debugging
      errorResponse.type = error.name;
    } else {
      errorResponse.details = String(error);
      errorResponse.errorType = typeof error;
    }
    
    console.error('❌ [OASIS MESSAGES] Returning error response:', JSON.stringify(errorResponse, null, 2));
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// POST /api/oasis/messages - Send message
export async function POST(request: NextRequest) {
  try {
    const authUser = await getUnifiedAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = authUser.id;

    const body = await request.json();
    const { channelId, dmId, content, parentMessageId } = body;

    if (!content || (!channelId && !dmId)) {
      return NextResponse.json(
        { error: 'Content and channel ID or DM ID required' },
        { status: 400 }
      );
    }

    // Verify access to channel or DM
    let workspaceId: string;

    if (channelId) {
      const channel = await prisma.oasisChannel.findFirst({
        where: {
          id: channelId,
          members: {
            some: { userId: userId }
          }
        },
        include: { workspace: true }
      });

      if (!channel) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      workspaceId = channel.workspaceId;
    } else {
      const dm = await prisma.oasisDirectMessage.findFirst({
        where: {
          id: dmId,
          participants: {
            some: { userId: userId }
          }
        },
        include: { workspace: true }
      });

      if (!dm) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      workspaceId = dm.workspaceId;
    }

    // Create message
    const message = await prisma.oasisMessage.create({
      data: {
        content,
        channelId: channelId || null,
        dmId: dmId || null,
        senderId: userId,
        parentMessageId: parentMessageId || null
      },
      include: {
        sender: {
          select: { id: true, name: true, username: true }
        }
      }
    });

    // Update DM updatedAt if it's a DM
    if (dmId) {
      await prisma.oasisDirectMessage.update({
        where: { id: dmId },
        data: { updatedAt: new Date() }
      });
    }

    // Broadcast message
    await OasisRealtimeService.broadcastMessage(workspaceId, message);

    return NextResponse.json({
      message: {
        id: message.id,
        content: message.content,
        channelId: message.channelId,
        dmId: message.dmId,
        senderId: message.senderId,
        senderName: message.sender.name,
        senderUsername: message.sender.username,
        parentMessageId: message.parentMessageId,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        reactions: [],
        threadCount: 0,
        threadMessages: []
      }
    });

  } catch (error) {
    console.error('❌ [OASIS MESSAGES] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
