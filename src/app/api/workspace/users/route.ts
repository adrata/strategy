import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/platform/database/prisma-client";

// 🚀 PERFORMANCE: Add caching for workspace users
const workspaceUsersCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: "workspaceId is required" },
        { status: 400 }
      );
    }

    // 🚀 PERFORMANCE: Check cache first
    const cacheKey = `workspace_users:${workspaceId}`;
    const cached = workspaceUsersCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('⚡ [CACHE HIT] Workspace users:', workspaceId);
      return NextResponse.json(cached.data);
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
        lastName: true,
        displayName: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log('🔍 [API] Found workspace users:', {
      count: users.length,
      users: users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email
      }))
    });

    // Map users with their workspace role
    const usersWithRole = users.map(user => {
      const workspaceUser = workspaceUsers.find(wu => wu['userId'] === user.id);
      return {
        id: user.id,
        name: user.name || user.displayName || user.email || 'Unknown User',
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        role: workspaceUser?.role || 'member'
      };
    });

    const response = {
      success: true,
      users: usersWithRole,
      count: usersWithRole.length,
      workspaceId
    };

    // 🚀 PERFORMANCE: Cache the response
    workspaceUsersCache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error("Error fetching workspace users:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch workspace users",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
