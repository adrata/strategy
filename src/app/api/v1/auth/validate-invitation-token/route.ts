import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';

/**
// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

 * GET /api/v1/auth/validate-invitation-token
 * Validate an invitation token and return user details for pre-filling form
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return createErrorResponse(
        'Token is required',
        'TOKEN_REQUIRED',
        400
      );
    }

    console.log('🔐 [VALIDATE INVITATION TOKEN] Validating token:', token);

    // Find and validate the invitation token
    const tokenRecord = await prisma.reset_tokens.findFirst({
      where: {
        token: token,
        used: false,
        expiresAt: {
          gt: new Date(), // Token must not be expired
        },
        metadata: {
          path: ['type'],
          equals: 'invitation'
        }
      },
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
      }
    });

    if (!tokenRecord) {
      console.log('❌ [VALIDATE INVITATION TOKEN] Invalid or expired token');
      return createErrorResponse(
        'Invalid or expired invitation token',
        'INVALID_TOKEN',
        400
      );
    }

    const metadata = tokenRecord.metadata as any;
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

    console.log('✅ [VALIDATE INVITATION TOKEN] Valid token found for user:', tokenRecord.user.email);

    return createSuccessResponse({
      token: tokenRecord.token,
      user: {
        id: tokenRecord.user.id,
        email: tokenRecord.user.email,
        name: tokenRecord.user.name,
        firstName: tokenRecord.user.firstName,
        lastName: tokenRecord.user.lastName,
      },
      workspace: workspace,
      role: metadata?.role || 'VIEWER',
      expiresAt: tokenRecord.expiresAt,
      inviter: inviter,
      invitedAt: metadata?.invitedAt ? new Date(metadata.invitedAt) : tokenRecord.createdAt,
    }, {
      message: 'Invitation token is valid',
      userId: tokenRecord.user.id,
      workspaceId: workspaceId,
    });

  } catch (error) {
    console.error('❌ [VALIDATE INVITATION TOKEN] Error:', error);
    return createErrorResponse(
      'Failed to validate invitation token',
      'VALIDATE_TOKEN_ERROR',
      500
    );
  }
}
