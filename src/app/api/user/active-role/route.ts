import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getActiveRole, getUserRoles, canSwitchToRole, setActiveRole } from '@/platform/services/role-switching-service';

/**
 * GET /api/user/active-role
 * Returns the current active role for the user in the workspace
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    const activeRole = await getActiveRole(session.user.id, workspaceId);
    const allRoles = await getUserRoles(session.user.id, workspaceId);

    return NextResponse.json({
      success: true,
      activeRole: activeRole || null,
      availableRoles: allRoles.map(r => r.roleName.toLowerCase())
    });
  } catch (error) {
    console.error('Error getting active role:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/active-role
 * Updates the active role preference for the user in the workspace
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { workspaceId, roleName } = body;

    if (!workspaceId || !roleName) {
      return NextResponse.json(
        { success: false, error: 'workspaceId and roleName are required' },
        { status: 400 }
      );
    }

    // Validate that user can switch to this role
    const canSwitch = await canSwitchToRole(session.user.id, workspaceId, roleName);
    if (!canSwitch) {
      return NextResponse.json(
        { success: false, error: 'User does not have access to this role' },
        { status: 403 }
      );
    }

    // Set active role in database
    const success = await setActiveRole(session.user.id, workspaceId, roleName);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to update active role' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      activeRole: roleName.toLowerCase(),
      message: 'Active role updated successfully'
    });
  } catch (error) {
    console.error('Error updating active role:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

