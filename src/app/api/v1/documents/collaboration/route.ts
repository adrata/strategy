import { NextRequest } from 'next/server';
import { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { parse } from 'url';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// WebSocket server instance
let wss: WebSocketServer | null = null;

// Room management
interface CollaborationRoom {
  id: string;
  documentId: string;
  workspaceId: string;
  clients: Map<string, CollaborationClient>;
  createdAt: Date;
  lastActivity: Date;
}

interface CollaborationClient {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  ws: any;
  roomId: string;
  joinedAt: Date;
  lastSeen: Date;
}

const rooms = new Map<string, CollaborationRoom>();

export async function GET(request: NextRequest) {
  try {
    // Check if WebSocket server is already running
    if (!wss) {
      // This is a placeholder - in a real implementation, you'd set up the WebSocket server
      // at application startup, not in the API route
      return new Response('WebSocket server not initialized', { status: 500 });
    }

    // Get the WebSocket upgrade request
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    const workspaceId = searchParams.get('workspaceId');

    if (!documentId || !workspaceId) {
      return new Response('Missing documentId or workspaceId', { status: 400 });
    }

    // Verify user authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return new Response('Unauthorized', { status: 401 });
    }

    const user = authResult.user;

    // Verify user has access to the document
    const document = await prisma.atriumDocument.findFirst({
      where: {
        id: documentId,
        workspaceId,
        OR: [
          { ownerId: user.id },
          {
            shares: {
              some: {
                userId: user.id,
                permission: { in: ['view', 'comment', 'edit', 'admin'] },
                expiresAt: { gt: new Date() },
              },
            },
          },
        ],
      },
    });

    if (!document) {
      return new Response('Document not found or access denied', { status: 404 });
    }

    // Return WebSocket connection info
    return new Response(JSON.stringify({
      message: 'WebSocket connection established',
      documentId,
      workspaceId,
      userId: user.id,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error in collaboration endpoint:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

// WebSocket server setup (this would typically be in a separate server file)
export function initializeWebSocketServer(server: any) {
  if (wss) {
    return wss;
  }

  wss = new WebSocketServer({ 
    server,
    path: '/api/atrium/collaboration',
  });

  wss.on('connection', async (ws: any, request: IncomingMessage) => {
    try {
      const { query } = parse(request.url || '', true);
      const documentId = query.documentId as string;
      const workspaceId = query.workspaceId as string;
      const token = query.token as string;

      if (!documentId || !workspaceId || !token) {
        ws.close(1008, 'Missing required parameters');
        return;
      }

      // Verify authentication
      const authResult = await verifyAuthFromToken(token);
      if (!authResult.success) {
        ws.close(1008, 'Unauthorized');
        return;
      }

      const user = authResult.user;

      // Verify document access
      const document = await prisma.atriumDocument.findFirst({
        where: {
          id: documentId,
          workspaceId,
          OR: [
            { ownerId: user.id },
            {
              shares: {
                some: {
                  userId: user.id,
                  permission: { in: ['view', 'comment', 'edit', 'admin'] },
                  expiresAt: { gt: new Date() },
                },
              },
            },
          ],
        },
      });

      if (!document) {
        ws.close(1008, 'Document not found or access denied');
        return;
      }

      // Get or create room
      const roomId = `doc-${documentId}`;
      let room = rooms.get(roomId);
      
      if (!room) {
        room = {
          id: roomId,
          documentId,
          workspaceId,
          clients: new Map(),
          createdAt: new Date(),
          lastActivity: new Date(),
        };
        rooms.set(roomId, room);
      }

      // Create client
      const clientId = `${user.id}-${Date.now()}`;
      const client: CollaborationClient = {
        id: clientId,
        userId: user.id,
        user: {
          id: user.id,
          name: user.name || 'Unknown User',
          email: user.email,
          avatar: user.avatar,
        },
        ws,
        roomId,
        joinedAt: new Date(),
        lastSeen: new Date(),
      };

      // Add client to room
      room.clients.set(clientId, client);
      room.lastActivity = new Date();

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'welcome',
        clientId,
        roomId,
        documentId,
        users: Array.from(room.clients.values()).map(c => c.user),
      }));

      // Broadcast user joined
      broadcastToRoom(roomId, {
        type: 'user-joined',
        user: client.user,
        clientId,
      }, clientId);

      // Handle messages
      ws.on('message', async (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          await handleMessage(roomId, clientId, data);
        } catch (error) {
          console.error('Error handling message:', error);
        }
      });

      // Handle disconnect
      ws.on('close', () => {
        handleDisconnect(roomId, clientId);
      });

      // Handle errors
      ws.on('error', (error: Error) => {
        console.error('WebSocket error:', error);
        handleDisconnect(roomId, clientId);
      });

      // Send ping every 30 seconds
      const pingInterval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
          ws.ping();
        } else {
          clearInterval(pingInterval);
        }
      }, 30000);

    } catch (error) {
      console.error('Error in WebSocket connection:', error);
      ws.close(1008, 'Internal server error');
    }
  });

  // Clean up empty rooms every 5 minutes
  setInterval(() => {
    const now = new Date();
    for (const [roomId, room] of rooms.entries()) {
      if (room.clients.size === 0 && now.getTime() - room.lastActivity.getTime() > 300000) {
        rooms.delete(roomId);
      }
    }
  }, 300000);

  return wss;
}

async function handleMessage(roomId: string, clientId: string, data: any) {
  const room = rooms.get(roomId);
  if (!room) return;

  const client = room.clients.get(clientId);
  if (!client) return;

  client.lastSeen = new Date();
  room.lastActivity = new Date();

  switch (data.type) {
    case 'yjs-update':
      // Broadcast Y.js update to other clients
      broadcastToRoom(roomId, {
        type: 'yjs-update',
        update: data.update,
        clientId,
      }, clientId);
      break;

    case 'cursor-update':
      // Broadcast cursor position
      broadcastToRoom(roomId, {
        type: 'cursor-update',
        cursor: data.cursor,
        clientId,
      }, clientId);
      break;

    case 'selection-update':
      // Broadcast selection
      broadcastToRoom(roomId, {
        type: 'selection-update',
        selection: data.selection,
        clientId,
      }, clientId);
      break;

    case 'ping':
      // Respond to ping
      client.ws.send(JSON.stringify({ type: 'pong' }));
      break;

    default:
      console.warn('Unknown message type:', data.type);
  }
}

function handleDisconnect(roomId: string, clientId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  const client = room.clients.get(clientId);
  if (!client) return;

  // Remove client from room
  room.clients.delete(clientId);
  room.lastActivity = new Date();

  // Broadcast user left
  broadcastToRoom(roomId, {
    type: 'user-left',
    user: client.user,
    clientId,
  }, clientId);

  // Clean up empty room
  if (room.clients.size === 0) {
    rooms.delete(roomId);
  }
}

function broadcastToRoom(roomId: string, message: any, excludeClientId?: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  const messageStr = JSON.stringify(message);
  
  for (const [clientId, client] of room.clients.entries()) {
    if (clientId !== excludeClientId && client.ws.readyState === client.ws.OPEN) {
      try {
        client.ws.send(messageStr);
      } catch (error) {
        console.error('Error sending message to client:', error);
        // Remove disconnected client
        room.clients.delete(clientId);
      }
    }
  }
}

async function verifyAuthFromToken(token: string) {
  try {
    // This is a simplified auth verification
    // In a real implementation, you'd verify the JWT token
    // For now, we'll return a mock success
    return {
      success: true,
      user: {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      },
    };
  } catch (error) {
    return { success: false };
  }
}

// Export the WebSocket server for use in the main server
export { wss };
