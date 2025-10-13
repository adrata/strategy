import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
import crypto from 'crypto';
import { sendInvitationEmail } from '@/platform/services/InvitationEmailService';

/**
 * POST /api/v1/admin/invite-user
 * Invite a user to join a workspace
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize admin user
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true,
      requiredRole: 'admin' // Only admins can invite users
    });

    if (response) {
      return response; // Return error response if authentication failed
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const body = await request.json();
    const { email, firstName, lastName, workspaceId, role = 'VIEWER' } = body;

    // Validate required fields
    if (!email || !workspaceId) {
      return createErrorResponse(
        'Email and workspace ID are required',
        'MISSING_REQUIRED_FIELDS',
        400
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return createErrorResponse(
        'Invalid email format',
        'INVALID_EMAIL',
        400
      );
    }

    // Validate role
    const validRoles = ['VIEWER', 'SELLER', 'MANAGER', 'WORKSPACE_ADMIN'];
    if (!validRoles.includes(role)) {
      return createErrorResponse(
        'Invalid role. Must be one of: VIEWER, SELLER, MANAGER, WORKSPACE_ADMIN',
        'INVALID_ROLE',
        400
      );
    }

    // Verify workspace exists and user has access to it
    const workspace = await prisma.workspaces.findFirst({
      where: {
        id: workspaceId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      }
    });

    if (!workspace) {
      return createErrorResponse(
        'Workspace not found or access denied',
        'WORKSPACE_NOT_FOUND',
        404
      );
    }

    // Check if user already exists
    let user = await prisma.users.findFirst({
      where: {
        email: email.toLowerCase(),
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
      }
    });

    // If user doesn't exist, create them
    if (!user) {
      const fullName = firstName && lastName 
        ? `${firstName} ${lastName}`.trim()
        : email.split('@')[0];

      user = await prisma.users.create({
        data: {
          email: email.toLowerCase(),
          name: fullName,
          firstName: firstName || null,
          lastName: lastName || null,
          isActive: true,
          activeWorkspaceId: workspaceId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          name: true,
          firstName: true,
          lastName: true,
        }
      });

      console.log(`✅ [INVITE USER] Created new user: ${user.email}`);
    } else {
      console.log(`✅ [INVITE USER] Found existing user: ${user.email}`);
    }

    // Check if user is already a member of this workspace
    const existingMembership = await prisma.workspace_users.findFirst({
      where: {
        workspaceId: workspaceId,
        userId: user.id,
        isActive: true,
      }
    });

    if (existingMembership) {
      return createErrorResponse(
        'User is already a member of this workspace',
        'USER_ALREADY_MEMBER',
        409
      );
    }

    // Generate secure invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours from now

    // Store invitation token with metadata
    await prisma.reset_tokens.create({
      data: {
        token: invitationToken,
        userId: user.id,
        expiresAt: expiresAt,
        used: false,
        metadata: {
          type: 'invitation',
          workspaceId: workspaceId,
          role: role,
          invitedBy: context.userId,
          invitedAt: new Date().toISOString(),
        }
      }
    });

    console.log(`✅ [INVITE USER] Generated invitation token for user: ${user.email}`);

    // Create invitation link
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const invitationLink = `${baseUrl}/setup-account?token=${invitationToken}`;

    // Get inviter details for email
    const inviter = await prisma.users.findUnique({
      where: { id: context.userId },
      select: { name: true, email: true }
    });

    if (!inviter) {
      return createErrorResponse(
        'Inviter not found',
        'INVITER_NOT_FOUND',
        404
      );
    }

    // Send invitation email
    const emailResult = await sendInvitationEmail({
      to: user.email,
      inviterName: inviter.name,
      inviterEmail: inviter.email,
      workspaceName: workspace.name,
      invitationLink: invitationLink,
      expiresAt: expiresAt,
      userEmail: user.email,
      userName: user.name,
    });

    if (!emailResult.success) {
      console.error(`❌ [INVITE USER] Failed to send email:`, emailResult.error);
      return createErrorResponse(
        'Failed to send invitation email',
        'EMAIL_SEND_FAILED',
        500
      );
    }

    // Add user to workspace (but they won't be able to access until they set password)
    await prisma.workspace_users.create({
      data: {
        workspaceId: workspaceId,
        userId: user.id,
        role: role as any, // Type assertion for enum
        isActive: true,
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    console.log(`✅ [INVITE USER] Added user to workspace: ${user.email} -> ${workspace.name}`);

    return createSuccessResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
      },
      invitation: {
        token: invitationToken,
        expiresAt: expiresAt,
        role: role,
      }
    }, {
      message: 'User invitation sent successfully',
      userId: user.id,
      workspaceId: workspaceId,
      inviterId: context.userId,
    });

  } catch (error) {
    console.error('❌ [INVITE USER] Error:', error);
    return createErrorResponse(
      'Failed to send user invitation',
      'INVITE_USER_ERROR',
      500
    );
  }
}
