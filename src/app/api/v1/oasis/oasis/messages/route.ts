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
import { sendEmail } from '@/platform/services/ResendService';

// GET /api/oasis/messages - Get messages for channel or DM
export async function GET(request: NextRequest) {
  try {
    // Parse parameters with error handling
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
    const userEmail = authUser.email || undefined;

    // Check if this is Ross (special user who sees all DMs)
    const ROSS_USER_ID = '01K1VBYZG41K9QA0D9CF06KNRG';
    const ROSS_EMAIL = 'ross@adrata.com';
    const isRoss = userId === ROSS_USER_ID || userEmail === ROSS_EMAIL;

    // Validate required parameters upfront with detailed error messages
    if (!workspaceId || workspaceId.trim() === '') {
      console.error('❌ [OASIS MESSAGES] Missing workspaceId in request:', {
        url: request.url,
        userId,
        channelId,
        dmId
      });
      return NextResponse.json(
        { 
          error: 'Workspace ID required',
          details: 'The workspaceId parameter is missing or empty. Please provide a valid workspace ID.'
        },
        { status: 400 }
      );
    }

    if (!channelId && !dmId) {
      console.error('❌ [OASIS MESSAGES] Missing conversation ID in request:', {
        url: request.url,
        userId,
        workspaceId,
        channelId,
        dmId
      });
      return NextResponse.json(
        { 
          error: 'Channel ID or DM ID required',
          details: 'Either channelId or dmId parameter must be provided to fetch messages.'
        },
        { status: 400 }
      );
    }

    if (channelId && dmId) {
      console.error('❌ [OASIS MESSAGES] Both channelId and dmId provided:', {
        url: request.url,
        userId,
        workspaceId,
        channelId,
        dmId
      });
      return NextResponse.json(
        { 
          error: 'Invalid request',
          details: 'Cannot specify both channelId and dmId. Please provide only one.'
        },
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
      // Allow access to DMs where user is a participant, regardless of workspace
      // This enables cross-workspace conversations (e.g., Ross in Adrata messaging Ryan in Notary Everyday)
      const dm = await prisma.oasisDirectMessage.findFirst({
        where: {
          id: dmId,
          participants: {
            some: { userId: userId }
          }
        },
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

      // Allow cross-workspace access - if user is a participant, they can view messages
      // The workspaceId parameter is used for real-time channel subscriptions, but shouldn't block access
      // Note: We still use the requested workspaceId for real-time updates, but allow message access
    }

    // Validate dmId or channelId exists before querying (with try-catch)
    if (dmId && !channelId) {
      try {
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
      } catch (dmCheckError: any) {
        console.error('❌ [OASIS MESSAGES] Error checking DM existence:', dmCheckError);
        
        // Handle Prisma errors
        if (dmCheckError.code === 'P2021') {
          return NextResponse.json(
            { 
              error: 'Database migration required',
              code: 'MIGRATION_REQUIRED',
              details: 'OasisDirectMessage table does not exist'
            },
            { status: 503 }
          );
        }
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
      } catch (channelCheckError: any) {
        console.error('❌ [OASIS MESSAGES] Error checking channel existence:', channelCheckError);
        
        // Handle Prisma errors
        if (channelCheckError.code === 'P2021') {
          return NextResponse.json(
            { 
              error: 'Database migration required',
              code: 'MIGRATION_REQUIRED',
              details: 'OasisChannel table does not exist'
            },
            { status: 503 }
          );
        }
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

    // Get messages with comprehensive error handling and validation
    let messages: any[] = [];
    try {
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
      
      // Validate query results
      if (!Array.isArray(queryResult)) {
        console.error('❌ [OASIS MESSAGES] Query returned non-array result:', typeof queryResult, queryResult);
        messages = [];
      } else {
        messages = queryResult;
      }
    } catch (dbError: any) {
      console.error('❌ [OASIS MESSAGES] Database query error:', dbError);
      
      // Handle Prisma errors
      if (dbError.code === 'P2021') {
        return NextResponse.json(
          { 
            error: 'Database migration required',
            code: 'MIGRATION_REQUIRED',
            details: 'OasisMessage table does not exist'
          },
          { status: 503 }
        );
      }
      
      // Initialize messages as empty array if query fails
      messages = [];
      // Re-throw to be caught by outer catch for proper error response
      throw dbError;
    }

    // Validate messages array before formatting
    if (!Array.isArray(messages)) {
      console.error('❌ [OASIS MESSAGES] Messages is not an array:', typeof messages);
      messages = [];
    }

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

    return NextResponse.json({ 
      messages: formattedMessages.reverse(), // Reverse to show oldest first
      hasMore: messages.length === limit
    });

  } catch (error: any) {
    console.error('❌ [OASIS MESSAGES] GET error:', error);
    
    // Handle Prisma errors
    if (error.code === 'P2021') {
      return NextResponse.json(
        { 
          error: 'Database migration required',
          code: 'MIGRATION_REQUIRED',
          details: 'Oasis table does not exist'
        },
        { status: 503 }
      );
    } else if (error.code === 'P2002') {
      return NextResponse.json(
        { 
          error: 'Unique constraint violation',
          code: 'DUPLICATE_ENTRY',
          details: error.message
        },
        { status: 409 }
      );
    } else if (error.code === 'P2003') {
      return NextResponse.json(
        { 
          error: 'Foreign key constraint violation',
          code: 'INVALID_REFERENCE',
          details: error.message
        },
        { status: 400 }
      );
    } else if (error.code === 'P2025') {
      return NextResponse.json(
        { 
          error: 'Record not found',
          code: 'NOT_FOUND',
          details: error.message
        },
        { status: 404 }
      );
    }
    
    // Generic error fallback
    const isDevelopment = process.env.NODE_ENV === 'development';
    const errorResponse: any = {
      error: 'Failed to fetch messages',
      details: error instanceof Error ? error.message : String(error)
    };
    
    if (isDevelopment && error instanceof Error && error.stack) {
      errorResponse.stack = error.stack.split('\n').slice(0, 5).join('\n');
    }
    
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

    // Send email notification if Ross sends a message to Ryan in a DM
    if (dmId) {
      try {
        const sender = await prisma.users.findUnique({
          where: { id: userId },
          select: { email: true, name: true }
        });

        // Check if sender is Ross
        if (sender?.email === 'ross@adrata.com') {
          // Get the DM to find the recipient
          const dm = await prisma.oasisDirectMessage.findUnique({
            where: { id: dmId },
            include: {
              participants: {
                include: {
                  user: {
                    select: { email: true, name: true }
                  }
                }
              },
              workspace: {
                select: { slug: true, name: true }
              }
            }
          });

          if (dm) {
            // Find Ryan as the recipient
            const ryanParticipant = dm.participants.find(
              p => p.user.email === 'ryan@notaryeveryday.com'
            );

            if (ryanParticipant) {
              // Send email notification to Ryan
              const workspaceSlug = dm.workspace.slug || 'workspace';
              const oasisUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.adrata.com'}/${workspaceSlug}/oasis`;
              
              await sendEmail({
                to: 'ryan@notaryeveryday.com',
                subject: 'Ross sent you a message on Oasis',
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #0066cc;">New Message from Ross</h2>
                    <p>Hi Ryan,</p>
                    <p>Ross sent you a message on Oasis:</p>
                    <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0066cc;">
                      <p style="margin: 0; white-space: pre-wrap;">${content}</p>
                    </div>
                    <div style="margin: 30px 0; text-align: center;">
                      <a href="${oasisUrl}" 
                         style="display: inline-block; background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        View Message on Oasis
                      </a>
                    </div>
                    <p style="color: #666; font-size: 14px; margin-top: 30px;">
                      You're receiving this because Ross sent you a direct message on Oasis.
                    </p>
                  </div>
                `,
                text: `Ross sent you a message on Oasis:\n\n${content}\n\nView it here: ${oasisUrl}`
              });

              console.log('✅ [OASIS EMAIL] Sent notification to Ryan for message from Ross');
            }
          }
        }
      } catch (emailError) {
        // Don't fail the message send if email fails
        console.error('❌ [OASIS EMAIL] Failed to send notification:', emailError);
      }
    }

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

  } catch (error: any) {
    console.error('❌ [OASIS MESSAGES] POST error:', error);
    
    // Handle Prisma errors
    if (error.code === 'P2021') {
      return NextResponse.json(
        { 
          error: 'Database migration required',
          code: 'MIGRATION_REQUIRED',
          details: 'Oasis table does not exist'
        },
        { status: 503 }
      );
    } else if (error.code === 'P2002') {
      return NextResponse.json(
        { 
          error: 'Unique constraint violation',
          code: 'DUPLICATE_ENTRY',
          details: error.message
        },
        { status: 409 }
      );
    } else if (error.code === 'P2003') {
      return NextResponse.json(
        { 
          error: 'Foreign key constraint violation',
          code: 'INVALID_REFERENCE',
          details: error.message
        },
        { status: 400 }
      );
    } else if (error.code === 'P2025') {
      return NextResponse.json(
        { 
          error: 'Record not found',
          code: 'NOT_FOUND',
          details: error.message
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
