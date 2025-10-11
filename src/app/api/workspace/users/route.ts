import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/platform/database/prisma-client";


import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
// 🚀 PERFORMANCE: Add caching for workspace users
const workspaceUsersCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

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

    // 🚀 PERFORMANCE: Check cache first
    const cacheKey = `workspace_users:${workspaceId}`;
    const cached = workspaceUsersCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('⚡ [CACHE HIT] Workspace users:', workspaceId);
      return createSuccessResponse(cached.data.data, {
        ...cached.data.meta,
        cacheHit: true,
        userId: context.userId,
        workspaceId: context.workspaceId,
        role: context.role
      });
    }

    console.log('🔍 [API] Fetching users for workspace:', workspaceId);

    // Get all users in the workspace by joining manually
    const workspaceUsers = await prisma.workspace_users.findMany({
      where: {
        workspaceId: workspaceId
      },
      select: {
        id: true,
        userId: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Get user details for each workspace user
    const userIds = workspaceUsers.map(wu => wu.userId);
    const users = await prisma.users.findMany({
      where: {
        id: { in: userIds }
      },
      select: {
        id: true,
        name: true,
        email: true,
        firstName: true,
        lastName: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log('🔍 [API] Found workspace users:', {
      count: users.length,
      totalWorkspaceUsers: workspaceUsers.length,
      users: users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email
      }))
    });

    // Log any missing users for debugging
    const foundUserIds = users.map(u => u.id);
    const missingUserIds = userIds.filter(id => !foundUserIds.includes(id));
    if (missingUserIds.length > 0) {
      console.warn('⚠️ [API] Some workspace users not found in users table:', missingUserIds);
    }

    // Map users with their workspace role
    let usersWithRole = users.map(user => {
      const workspaceUser = workspaceUsers.find(wu => wu['userId'] === user.id);
      return {
        id: user.id,
        name: user.name || user.email || 'Unknown User',
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: workspaceUser?.role || 'member'
      };
    });

    // If no users found, try to get the current user as a fallback
    if (usersWithRole.length === 0) {
      console.warn('⚠️ [API] No users found in workspace, attempting to get current user as fallback');
      try {
        const currentUser = await prisma.users.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true,
          }
        });
        
        if (currentUser) {
          usersWithRole = [{
            id: currentUser.id,
            name: currentUser.name || currentUser.email || 'Current User',
            email: currentUser.email,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            role: 'admin' // Default to admin for current user
          }];
          console.log('✅ [API] Added current user as fallback');
        }
      } catch (fallbackError) {
        console.error('❌ [API] Failed to get current user as fallback:', fallbackError);
      }
    }

    const responseData = {
      users: usersWithRole,
      count: usersWithRole.length,
      workspaceId
    };

    // 🚀 PERFORMANCE: Cache the response
    workspaceUsersCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    return createSuccessResponse(responseData, {
      cacheHit: false,
      userId: context.userId,
      workspaceId: context.workspaceId,
      role: context.role
    });

  } catch (error) {
    console.error("Error fetching workspace users:", error);
    return createErrorResponse(
      "Failed to fetch workspace users",
      "FETCH_WORKSPACE_USERS_ERROR",
      500
    );
  }
}
