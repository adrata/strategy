import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedAuthUser } from '@/platform/api-auth';
import { prisma } from '@/platform/database/prisma-client';
import { Nango } from '@nangohq/node';

// Required for static export (desktop build)
export const dynamic = 'force-dynamic';

/**
 * Initialize Nango client with error handling
 * Priority: Use NANGO_SECRET_KEY for production, NANGO_SECRET_KEY_DEV for development
 */
function getNangoClient(): Nango {
  const secretKey = process.env.NANGO_SECRET_KEY || process.env.NANGO_SECRET_KEY_DEV;
  
  if (!secretKey) {
    throw new Error('NANGO_SECRET_KEY or NANGO_SECRET_KEY_DEV environment variable is not set');
  }

  const host = process.env.NANGO_HOST || 'https://api.nango.dev';
  
  return new Nango({
    secretKey,
    host
  });
}

/**
 * POST /api/grand-central/nango/execute
 * Execute an API operation via Nango proxy
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUnifiedAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { connectionId, operation, data, endpoint, method = 'GET', provider } = await request.json();

    if (!connectionId) {
      return NextResponse.json(
        { error: 'Connection ID is required' },
        { status: 400 }
      );
    }

    // Find the connection in database
    const connection = await prisma.grand_central_connections.findFirst({
      where: {
        id: connectionId,
        userId: user.id,
        status: 'active'
      }
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'Active connection not found' },
        { status: 404 }
      );
    }

    // Process endpoint with dynamic parameters
    let processedEndpoint = endpoint || '/';
    if (data) {
      // Replace placeholders in endpoint with actual values
      Object.keys(data).forEach(key => {
        const placeholder = `{${key}}`;
        if (processedEndpoint.includes(placeholder)) {
          processedEndpoint = processedEndpoint.replace(placeholder, data[key]);
        }
      });
    }

    // Transform data based on operation type
    let requestData = data;
    if (operation && data) {
      requestData = transformDataForOperation(operation, data, provider);
    }

    // Execute API call via Nango proxy
    const nango = getNangoClient();
    const response = await nango.proxy({
      providerConfigKey: connection.providerConfigKey,
      connectionId: connection.nangoConnectionId,
      endpoint: processedEndpoint,
      method: method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
      data: requestData
    });

    // Update last sync time
    await prisma.grand_central_connections.update({
      where: { id: connection.id },
      data: { lastSyncAt: new Date() }
    });

    return NextResponse.json({
      success: true,
      data: response.data,
      status: response.status
    });
  } catch (error) {
    console.error('Error executing operation:', error);
    return NextResponse.json(
      { 
        error: 'Failed to execute operation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Transform data based on operation type and provider
 */
function transformDataForOperation(operation: string, data: any, provider?: string): any {
  switch (operation) {
    case 'send_email':
      if (provider === 'google-mail') {
        // Gmail expects raw message format
        return {
          raw: btoa(createGmailMessage(data.to, data.subject, data.body, data.cc, data.bcc))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '')
        };
      } else if (provider === 'microsoft-outlook') {
        // Microsoft Graph expects message object
        return {
          message: {
            subject: data.subject,
            body: {
              contentType: 'Text',
              content: data.body
            },
            toRecipients: [{ emailAddress: { address: data.to } }],
            ...(data.cc && { ccRecipients: [{ emailAddress: { address: data.cc } }] }),
            ...(data.bcc && { bccRecipients: [{ emailAddress: { address: data.bcc } }] })
          }
        };
      }
      break;

    case 'create_calendar_event':
      if (provider === 'google-calendar') {
        return {
          summary: data.summary,
          start: data.start,
          end: data.end,
          description: data.description,
          attendees: data.attendees
        };
      } else if (provider === 'microsoft-calendar') {
        return {
          subject: data.subject,
          start: data.start,
          end: data.end,
          body: {
            contentType: 'Text',
            content: data.body
          },
          attendees: data.attendees
        };
      }
      break;

    case 'create_meeting':
      if (provider === 'zoom') {
        return {
          topic: data.topic,
          type: data.type || 2,
          start_time: data.start_time,
          duration: data.duration,
          password: data.password,
          agenda: data.agenda
        };
      }
      break;

    case 'read_emails':
      if (provider === 'google-mail') {
        return {
          maxResults: data.maxResults || 10,
          q: data.query,
          labelIds: data.labelIds
        };
      } else if (provider === 'microsoft-outlook') {
        return {
          $top: data.top || 10,
          $filter: data.filter,
          $orderby: 'receivedDateTime desc'
        };
      }
      break;

    case 'list_meetings':
      if (provider === 'zoom') {
        return {
          type: data.type || 'scheduled',
          page_size: data.page_size || 30
        };
      }
      break;
  }

  return data;
}

/**
 * Create Gmail message format
 */
function createGmailMessage(to: string, subject: string, body: string, cc?: string, bcc?: string): string {
  const headers = [
    `To: ${to}`,
    `Subject: ${subject}`,
    ...(cc ? [`Cc: ${cc}`] : []),
    ...(bcc ? [`Bcc: ${bcc}`] : []),
    'Content-Type: text/plain; charset=utf-8',
    ''
  ].join('\r\n');

  return headers + body;
}
