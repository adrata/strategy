import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';




import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
export async function GET(request: NextRequest) {
  try {
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

    // Use authenticated user's workspace and ID
    const workspaceId = context.workspaceId;
    const userId = context.userId;

    console.log(`📊 [CLIENTS API] Getting clients for workspace: ${workspaceId}, user: ${userId}`);

    // Get clients from database - using companies table with CLIENT status
    const clients = await prisma.companies.findMany({
      where: {
        workspaceId: workspaceId,
        status: 'CLIENT' // Just filter by workspace to match metrics count
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    console.log(`📊 Found ${clients.length} client accounts in database`);

    // Transform clients to include company name and proper kanban format
    const transformedClients = clients.map(client => ({
      id: client.id,
      name: client.company?.name || 'Client', // Use company name as primary display
      company: client.company?.name || 'Client', // Ensure company field exists
      contractValue: client.totalLifetimeValue, // For kanban display
      assignedTo: client.company?.assignedUserId,
      owner: 'Just Dano', // For kanban display
      // Include all original client data without duplication
      clientStatus: client.clientStatus,
      tier: client.tier,
      segment: client.segment,
      totalLifetimeValue: client.totalLifetimeValue,
      avgDealSize: client.avgDealSize,
      dealCount: client.dealCount,
      lastDealValue: client.lastDealValue,
      priority: client.priority,
      healthScore: client.healthScore,
      loyaltyScore: client.loyaltyScore,
      retentionProbability: client.retentionProbability,
      clientSince: client.clientSince,
      lastDealDate: client.lastDealDate,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt
    }));

    return createSuccessResponse(transformedClients, {
      userId: context.userId,
      workspaceId: context.workspaceId,
      role: context.role,
      count: transformedClients.length
    });

  } catch (error) {
    console.error('❌ [CLIENTS API] Error fetching clients:', error);
    return createErrorResponse(
      'Failed to fetch clients',
      'FETCH_CLIENTS_ERROR',
      500
    );
  }
}

// POST: Create new client
export async function POST(request: NextRequest) {
  try {
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

    // Use authenticated user's workspace and ID
    const workspaceId = context.workspaceId;
    const userId = context.userId;

    const { clientData } = await request.json();

    console.log(
      `📝 [CLIENTS API] Adding client for workspace: ${workspaceId}, user: ${userId}`,
    );

    if (!clientData || !clientData.accountId) {
      return createErrorResponse(
        "Account ID is required for client creation",
        "VALIDATION_ERROR",
        400
      );
    }

    await prisma.$connect();

    // Create client using companies table with CLIENT status
    const newClient = await prisma.companies.create({
      data: {
        id: `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        workspaceId: context.workspaceId,
        name: clientData.name || "New Client",
        status: 'CLIENT',
        priority: 'MEDIUM',
        description: clientData.description || '',
        website: clientData.website || '',
        email: clientData.email || '',
        phone: clientData.phone || '',
        updatedAt: new Date()
      }
    });

    // Transform to match expected structure
    const transformedClient = {
      id: newClient.id,
      name: newClient.accountId || 'Client',
      company: newClient.accountId || 'Client',
      accountId: newClient.accountId,
      clientStatus: newClient.clientStatus,
      tier: newClient.tier,
      healthScore: newClient.healthScore,
      totalLifetimeValue: newClient.totalLifetimeValue,
      contractEndDate: newClient.contractEndDate,
      created_at: newClient.clientSince.toISOString(),
      updated_at: newClient.clientSince.toISOString(),
    };

    console.log(
      `✅ [CLIENTS API] Client created: ${newClient.accountId} (ID: ${newClient.id})`,
    );return createSuccessResponse(transformedClient, {
      userId: context.userId,
      workspaceId: context.workspaceId,
      role: context.role
    });
  } catch (error) {
    console.error("❌ [CLIENTS API] Error creating client:", error);return createErrorResponse(
      "Failed to create client",
      "CREATE_CLIENT_ERROR",
      500
    );
  }
} 