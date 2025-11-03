import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

/**
// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

 * POST /api/v1/auth/setup-account
 * Complete account setup with password using invitation token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, username, email, password, confirmPassword } = body;

    if (!token || !password || !confirmPassword) {
      return createErrorResponse(
        'Token, password, and password confirmation are required',
        'MISSING_REQUIRED_FIELDS',
        400
      );
    }

    if (!username || !email) {
      return createErrorResponse(
        'Username and email are required',
        'MISSING_REQUIRED_FIELDS',
        400
      );
    }

    if (password !== confirmPassword) {
      return createErrorResponse(
        'Passwords do not match',
        'PASSWORDS_DONT_MATCH',
        400
      );
    }

    if (password.length < 8) {
      return createErrorResponse(
        'Password must be at least 8 characters long',
        'PASSWORD_TOO_SHORT',
        400
      );
    }

    console.log('🔐 [SETUP ACCOUNT] Account setup attempt with token:', token);

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
            activeWorkspaceId: true,
          }
        }
      }
    });

    if (!tokenRecord) {
      console.log('❌ [SETUP ACCOUNT] Invalid or expired token');
      return createErrorResponse(
        'Invalid or expired invitation token',
        'INVALID_TOKEN',
        400
      );
    }

    const metadata = tokenRecord.metadata as any;
    const workspaceId = metadata?.workspaceId;
    const role = metadata?.role || 'VIEWER';

    console.log('✅ [SETUP ACCOUNT] Valid token found for user:', tokenRecord.user.email);

    // Ensure workspace membership exists
    if (workspaceId) {
      const existingMembership = await prisma.workspace_users.findFirst({
        where: {
          workspaceId: workspaceId,
          userId: tokenRecord.user.id,
          isActive: true,
        }
      });

      if (!existingMembership) {
        console.log('🔗 [SETUP ACCOUNT] Creating workspace membership for user');
        await prisma.workspace_users.create({
          data: {
            workspaceId: workspaceId,
            userId: tokenRecord.user.id,
            role: role as any,
            isActive: true,
            joinedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        });
        console.log('✅ [SETUP ACCOUNT] Workspace membership created');
      }
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Update the user's password and account details in the database
    await prisma.users.update({
      where: { id: tokenRecord.user.id },
      data: { 
        name: username,
        email: email.toLowerCase(),
        password: hashedPassword,
        updatedAt: new Date(),
        // Set active workspace if not already set
        activeWorkspaceId: tokenRecord.user.activeWorkspaceId || workspaceId,
      }
    });

    // Mark the token as used to prevent reuse
    await prisma.reset_tokens.update({
      where: { id: tokenRecord.id },
      data: { used: true }
    });

    // Get workspace details for response
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

    // Generate JWT token for immediate login
    const jwtToken = jwt.sign(
      { 
        userId: tokenRecord.user.id, 
        email: tokenRecord.user.email, 
        workspaceId: workspaceId || tokenRecord.user.activeWorkspaceId,
        rememberMe: false
      },
      process.env.NEXTAUTH_SECRET || "dev-secret-key-change-in-production",
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { userId: tokenRecord.user.id, type: 'refresh', rememberMe: false },
      process.env.NEXTAUTH_SECRET || "dev-secret-key-change-in-production",
      { expiresIn: '7d' }
    );

    console.log('✅ [SETUP ACCOUNT] Account setup completed successfully for:', tokenRecord.user.email);

    return createSuccessResponse({
      user: {
        id: tokenRecord.user.id,
        email: tokenRecord.user.email,
        name: tokenRecord.user.name,
        firstName: tokenRecord.user.firstName,
        lastName: tokenRecord.user.lastName,
      },
      workspace: workspace,
      role: role,
      tokens: {
        accessToken: jwtToken,
        refreshToken: refreshToken,
        expiresIn: 3600, // 1 hour
      }
    }, {
      message: 'Account setup completed successfully',
      userId: tokenRecord.user.id,
      workspaceId: workspaceId,
    });

  } catch (error) {
    console.error('❌ [SETUP ACCOUNT] Error:', error);
    return createErrorResponse(
      'Failed to complete account setup',
      'SETUP_ACCOUNT_ERROR',
      500
    );
  }
}
