/**
 * USER PROFILE API ENDPOINT
 * 
 * Handles enhanced user profile management with role-based access control
 * SECURITY: Now properly authenticated and authorized
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
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

    // 2. Validate that user can access the requested profile
    const requestedUserId = params.userId;
    
    // Users can only access their own profile unless they have admin permissions
    if (requestedUserId !== context.userId && context.role !== 'admin') {
      return createErrorResponse('Access denied to user profile', 'ACCESS_DENIED', 403);
    }

    const user = await prisma.users.findUnique({
      where: { id: requestedUserId }
    });

    if (!user) {
      return createErrorResponse('User not found', 'USER_NOT_FOUND', 404);
    }

    // 3. Ensure user belongs to the same workspace (additional security check)
    if (user.workspaceId !== context.workspaceId) {
      return createErrorResponse('User not in your workspace', 'WORKSPACE_MISMATCH', 403);
    }

    console.log(`✅ [USER PROFILE] Retrieved profile for user ${requestedUserId} by ${context.userId}`);

    return createSuccessResponse(user, {
      requestedBy: context.userId,
      workspaceId: context.workspaceId,
      role: context.role
    });

  } catch (error) {
    console.error('❌ [USER PROFILE] Error fetching user profile:', error);
    return createErrorResponse(
      'Failed to fetch user profile',
      'FETCH_PROFILE_ERROR',
      500
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
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

    // 2. Validate that user can update the requested profile
    const requestedUserId = params.userId;
    
    // Users can only update their own profile unless they have admin permissions
    if (requestedUserId !== context.userId && context.role !== 'admin') {
      return createErrorResponse('Access denied to update user profile', 'ACCESS_DENIED', 403);
    }

    const body = await request.json();
    const { profile } = body;

    if (!profile) {
      return createErrorResponse('Profile data required', 'VALIDATION_ERROR', 400);
    }

    // Note: usersProfile model doesn't exist, user profile data is stored in users model

    // Also update basic user fields if provided
    if (profile.title || profile.department || profile.seniorityLevel || profile.territory) {
      await prisma.users.update({
        where: { id: params['userId'] },
        data: {
          title: profile.title,
          department: profile.department,
          seniorityLevel: profile.seniorityLevel,
          territory: profile.territory,
          phoneNumber: profile.phoneNumber,
          linkedinUrl: profile.linkedinUrl,
          profilePictureUrl: profile.profilePictureUrl,
          communicationStyle: profile.communicationStyle,
          preferredDetailLevel: profile.preferredDetailLevel,
          notificationPreferences: profile.notificationPreferences,
          dashboardConfig: profile.dashboardConfig,
          intelligenceFocus: profile.intelligenceFocus
        }
      });
    }

    console.log(`✅ [USER PROFILE] Updated profile for user ${requestedUserId} by ${context.userId}`);

    return createSuccessResponse({ 
      message: 'Profile updated successfully'
    }, {
      updatedBy: context.userId,
      workspaceId: context.workspaceId,
      role: context.role
    });

  } catch (error) {
    console.error('❌ [USER PROFILE] Error updating user profile:', error);
    return createErrorResponse(
      'Failed to update user profile',
      'UPDATE_PROFILE_ERROR',
      500
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // 1. Authenticate and authorize user
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true,
      requiredRole: 'admin' // Only admins can change user roles
    });

    if (response) {
      return response; // Return error response if authentication failed
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const body = await request.json();
    const { roleId, reason } = body;

    if (!roleId) {
      return createErrorResponse('Role ID required', 'VALIDATION_ERROR', 400);
    }

    // Note: workspaceMembership and usersRoleHistory models don't exist
    // User role management would need to be implemented with proper models

    console.log(`✅ [USER PROFILE] Role update attempted for user ${params.userId} by admin ${context.userId}`);

    return createSuccessResponse({ 
      message: 'Role update not implemented - models missing'
    }, {
      updatedBy: context.userId,
      workspaceId: context.workspaceId,
      role: context.role
    });

  } catch (error) {
    console.error('❌ [USER PROFILE] Error updating user role:', error);
    return createErrorResponse(
      'Failed to update user role',
      'UPDATE_ROLE_ERROR',
      500
    );
  }
}

// Helper function to check admin access
// Admin access checking is handled by the secure API helper and workspace access control
async function checkAdminAccess(userId: string, workspaceId: string): Promise<boolean> {
  // Note: workspaceMembership model doesn't exist
  // Admin access check would need to be implemented with proper models
  return false;
}
