import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';

/**
 * GET /api/v1/admin/invitations
 * List all pending and recent invitations
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize admin user
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true,
      requiredRole: 'admin' // Only admins can view invitations
    });

    if (response) {
      return response; // Return error response if authentication failed
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const status = searchParams.get('status'); // 'pending', 'accepted', 'expired', 'all'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build where clause for filtering
    const whereClause: any = {
      metadata: {
        path: ['type'],
        equals: 'invitation'
      }
    };

    // Filter by workspace if specified
    if (workspaceId) {
      whereClause.metadata = {
        path: ['workspaceId'],
        equals: workspaceId
      };
    }

    // Get invitation tokens with user and workspace details
    const invitations = await prisma.reset_tokens.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await prisma.reset_tokens.count({
      where: whereClause
    });

    // Process invitations to include status and workspace info
    const processedInvitations = await Promise.all(
      invitations.map(async (invitation) => {
        const metadata = invitation.metadata as any;
        const workspaceId = metadata?.workspaceId;
        
        // Get workspace details
        let workspace = null;
        if (workspaceId) {
          workspace = await prisma.workspaces.findUnique({
            where: { id: workspaceId },
            select: {
              id: true,
              name: true,
              slug: true,
            }
          });
        }

        // Determine invitation status
        let invitationStatus = 'pending';
        if (invitation.used) {
          invitationStatus = 'accepted';
        } else if (invitation.expiresAt < new Date()) {
          invitationStatus = 'expired';
        }

        // Get inviter details
        let inviter = null;
        if (metadata?.invitedBy) {
          inviter = await prisma.users.findUnique({
            where: { id: metadata.invitedBy },
            select: {
              id: true,
              name: true,
              email: true,
            }
          });
        }

        return {
          id: invitation.id,
          token: invitation.token,
          user: invitation.user,
          workspace: workspace,
          role: metadata?.role || 'VIEWER',
          status: invitationStatus,
          expiresAt: invitation.expiresAt,
          createdAt: invitation.createdAt,
          used: invitation.used,
          inviter: inviter,
          invitedAt: metadata?.invitedAt ? new Date(metadata.invitedAt) : invitation.createdAt,
        };
      })
    );

    // Apply status filter if specified
    let filteredInvitations = processedInvitations;
    if (status && status !== 'all') {
      filteredInvitations = processedInvitations.filter(inv => inv.status === status);
    }

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return createSuccessResponse({
      invitations: filteredInvitations,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
      }
    }, {
      message: 'Invitations retrieved successfully',
      count: filteredInvitations.length,
    });

  } catch (error) {
    console.error('❌ [GET INVITATIONS] Error:', error);
    return createErrorResponse(
      'Failed to retrieve invitations',
      'GET_INVITATIONS_ERROR',
      500
    );
  }
}
