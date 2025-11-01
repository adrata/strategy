import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

/**
// Required for static export (desktop build)
export const dynamic = 'force-static';

 * Email API Endpoint
 * 
 * Provides access to email messages with filtering by person, company, or workspace.
 * Supports pagination and sorting for efficient data retrieval.
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const personId = searchParams.get('personId');
    const workspaceId = searchParams.get('workspaceId');
    const provider = searchParams.get('provider');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'receivedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Validate limit
    if (limit > 100) {
      return Response.json({ error: 'Limit cannot exceed 100' }, { status: 400 });
    }
    
    // Build where clause
    const where: any = {};
    
    if (companyId) {
      where.companyId = companyId;
    }
    
    if (personId) {
      where.personId = personId;
    }
    
    if (workspaceId) {
      where.workspaceId = workspaceId;
    } else {
      // If no workspace specified, get user's active workspace
      const user = await prisma.users.findUnique({
        where: { id: session.user.id },
        select: { activeWorkspaceId: true }
      });
      
      if (user?.activeWorkspaceId) {
        where.workspaceId = user.activeWorkspaceId;
      } else {
        return Response.json({ error: 'No active workspace found' }, { status: 400 });
      }
    }
    
    if (provider && ['outlook', 'gmail'].includes(provider)) {
      where.provider = provider;
    }
    
    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;
    
    // Fetch emails with pagination
    const [emails, total] = await Promise.all([
      prisma.email_messages.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
        include: {
          person: {
            select: {
              id: true,
              fullName: true,
              email: true,
              jobTitle: true
            }
          },
          company: {
            select: {
              id: true,
              name: true,
              domain: true
            }
          }
        }
      }),
      prisma.email_messages.count({ where })
    ]);
    
    // Transform emails for API response
    const transformedEmails = emails.map(email => ({
      id: email.id,
      provider: email.provider,
      messageId: email.messageId,
      threadId: email.threadId,
      subject: email.subject,
      body: email.body,
      bodyHtml: email.bodyHtml,
      from: email.from,
      to: email.to,
      cc: email.cc,
      bcc: email.bcc,
      sentAt: email.sentAt,
      receivedAt: email.receivedAt,
      isRead: email.isRead,
      isImportant: email.isImportant,
      attachments: email.attachments,
      labels: email.labels,
      person: email.person,
      company: email.company,
      createdAt: email.createdAt,
      updatedAt: email.updatedAt
    }));
    
    return Response.json({
      emails: transformedEmails,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      filters: {
        companyId,
        personId,
        workspaceId,
        provider
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching emails:', error);
    
    return Response.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Create a new email message (for testing or manual entry)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const {
      workspaceId,
      provider,
      messageId,
      subject,
      body: emailBody,
      from,
      to,
      sentAt,
      receivedAt,
      companyId,
      personId
    } = body;
    
    // Validate required fields
    if (!workspaceId || !provider || !messageId || !subject || !from || !to) {
      return Response.json({ 
        error: 'Missing required fields: workspaceId, provider, messageId, subject, from, to' 
      }, { status: 400 });
    }
    
    // Create email message
    const email = await prisma.email_messages.create({
      data: {
        workspaceId,
        provider,
        messageId,
        subject,
        body: emailBody || '',
        from,
        to: Array.isArray(to) ? to : [to],
        cc: body.cc || [],
        bcc: body.bcc || [],
        sentAt: sentAt ? new Date(sentAt) : new Date(),
        receivedAt: receivedAt ? new Date(receivedAt) : new Date(),
        companyId,
        personId,
        attachments: body.attachments || [],
        labels: body.labels || []
      },
      include: {
        person: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    return Response.json({
      success: true,
      email
    });
    
  } catch (error) {
    console.error('❌ Error creating email:', error);
    
    return Response.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
