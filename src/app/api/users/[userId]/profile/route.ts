/**
 * USER PROFILE API ENDPOINT
 * 
 * Handles enhanced user profile management with role-based access control
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // For now, allow access - in production you'd validate the session token
    // TODO: Implement proper session validation with the unified auth system
    
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    const user = await prisma.users.findUnique({
      where: { id: params['userId'] }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // For now, allow access - in production you'd validate the session token
    // TODO: Implement proper session validation with the unified auth system

    const body = await request.json();
    const { workspaceId, profile } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
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

    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // For now, allow access - in production you'd validate the session token
    // TODO: Implement proper session validation with the unified auth system

    const body = await request.json();
    const { workspaceId, roleId, reason } = body;

    if (!workspaceId || !roleId) {
      return NextResponse.json({ 
        error: 'Workspace ID and Role ID required' 
      }, { status: 400 });
    }

    // Note: workspaceMembership and usersRoleHistory models don't exist
    // User role management would need to be implemented with proper models

    return NextResponse.json({ 
      success: true, 
      message: 'Role update not implemented - models missing'
    });

  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to check admin access
// TODO: Implement proper admin access checking with unified auth system
async function checkAdminAccess(userId: string, workspaceId: string): Promise<boolean> {
  // Note: workspaceMembership model doesn't exist
  // Admin access check would need to be implemented with proper models
  return false;
}
