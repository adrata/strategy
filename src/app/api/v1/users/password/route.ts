import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
import bcrypt from 'bcryptjs';

// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

const prisma = new PrismaClient();

/**
 * Password Change API v1
 * POST /api/v1/users/password - Change user password
 */

// POST /api/v1/users/password - Change user password
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize user using unified auth system
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

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // Input validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return createErrorResponse(
        'Current password, new password, and confirmation are required',
        'MISSING_FIELDS',
        400
      );
    }

    // Password confirmation validation
    if (newPassword !== confirmPassword) {
      return createErrorResponse(
        'New password and confirmation do not match',
        'PASSWORD_MISMATCH',
        400
      );
    }

    // Password strength validation
    if (newPassword.length < 8) {
      return createErrorResponse(
        'New password must be at least 8 characters long',
        'PASSWORD_TOO_SHORT',
        400
      );
    }

    // Additional password complexity requirements
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      return createErrorResponse(
        'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'PASSWORD_WEAK',
        400
      );
    }

    // Get current user with password
    const user = await prisma.users.findUnique({
      where: { 
        id: context.userId,
        isActive: true
      },
      select: { 
        id: true,
        email: true,
        password: true,
        name: true
      }
    });

    if (!user) {
      return createErrorResponse(
        'User not found or inactive',
        'USER_NOT_FOUND',
        404
      );
    }

    if (!user.password) {
      return createErrorResponse(
        'No password set for this account',
        'NO_PASSWORD_SET',
        400
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return createErrorResponse(
        'Current password is incorrect',
        'INVALID_CURRENT_PASSWORD',
        400
      );
    }

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return createErrorResponse(
        'New password must be different from current password',
        'SAME_PASSWORD',
        400
      );
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update user password
    await prisma.users.update({
      where: { id: context.userId },
      data: {
        password: hashedNewPassword,
        updatedAt: new Date()
      }
    });

    // Log password change event for audit trail
    console.log(`🔐 [PASSWORD CHANGE] User ${user.email} (${user.id}) successfully changed password`);

    return createSuccessResponse(
      { message: 'Password changed successfully' },
      {
        message: 'Password updated successfully',
        userId: context.userId,
        workspaceId: context.workspaceId,
        timestamp: new Date().toISOString()
      }
    );

  } catch (error) {
    console.error('❌ [V1 PASSWORD API] Error:', error);
    
    // Handle specific Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2025') {
        return createErrorResponse(
          'User not found',
          'USER_NOT_FOUND',
          404
        );
      }
    }
    
    return createErrorResponse(
      'Internal server error',
      'INTERNAL_ERROR',
      500
    );
  }
}
