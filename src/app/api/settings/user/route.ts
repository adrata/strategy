import { NextRequest, NextResponse } from 'next/server';
import { WorkspaceDataRouter } from '@/platform/services/workspace-data-router';
import { prisma } from '@/platform/database/prisma-client';
import bcrypt from 'bcryptjs';

// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

export async function GET(request: NextRequest) {
  try {
    const { workspaceId, userId } = await WorkspaceDataRouter.getWorkspaceContext(request);
    if (!userId || !workspaceId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }
    
    // Get user with profile information (streamlined schema only has basic fields)
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        timezone: true
      }
    });

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Get workspace context for AI
    const workspace = await prisma.workspaces.findUnique({
      where: { id: workspaceId },
      select: {
        productPortfolio: true,
        targetIndustries: true,
        valuePropositions: true,
        businessModel: true,
        industry: true
      }
    });

    // Streamlined schema doesn't have these fields, return defaults
    const userSettings = {
      // Profile Information
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      title: '', // Not in streamlined schema
      department: '', // Not in streamlined schema
      phoneNumber: '', // Not in streamlined schema
      linkedinUrl: '', // Not in streamlined schema
      
      // AI Context Preferences
      timezone: user.timezone || 'America/New_York',
      communicationStyle: 'consultative', // Not in streamlined schema
      preferredDetailLevel: 'detailed', // Not in streamlined schema
      
      // Performance Settings
      quota: 1000000, // Not in streamlined schema
      territory: '', // Not in streamlined schema
      dailyActivityTarget: 25 // Not in streamlined schema
    };

    const workspaceContext = {
      productPortfolio: workspace?.productPortfolio || [],
      targetIndustries: workspace?.targetIndustries || [],
      valuePropositions: workspace?.valuePropositions || [],
      businessModel: workspace?.businessModel || '',
      industry: workspace?.industry || ''
    };

    return NextResponse.json({
      success: true,
      settings: userSettings,
      workspaceContext,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch user settings' 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { workspaceId, userId } = await WorkspaceDataRouter.getWorkspaceContext(request);
    const settings = await request.json();

    // Update user table (streamlined schema only supports basic fields)
    await prisma.users.update({
      where: { id: userId },
      data: {
        firstName: settings.firstName,
        lastName: settings.lastName,
        name: `${settings.firstName} ${settings.lastName}`.trim(),
        timezone: settings.timezone,
        updatedAt: new Date()
      }
    });
    
    // Note: title, department, phoneNumber, linkedinUrl, communicationStyle, 
    // preferredDetailLevel, quota, territory, and dashboardConfig are not 
    // supported in the streamlined schema and are ignored

    return NextResponse.json({
      success: true,
      message: 'User settings updated successfully'
    });

  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update user settings' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await WorkspaceDataRouter.getWorkspaceContext(request);
    const { action, currentPassword, newPassword } = await request.json();

    if (action === 'change_password') {
      // Get current user
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { password: true }
      });

      if (!user?.password) {
        return NextResponse.json({ 
          success: false, 
          error: 'Current password not found' 
        }, { status: 400 });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return NextResponse.json({ 
          success: false, 
          error: 'Current password is incorrect' 
        }, { status: 400 });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await prisma.users.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          updatedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Password updated successfully'
      });

    } else if (action === 'delete_account') {
      // Soft delete user account
      await prisma.users.update({
        where: { id: userId },
        data: {
          isActive: false,
          email: `deleted_${Date.now()}_${userId}`, // Prevent email conflicts
          updatedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Account deletion initiated'
      });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Invalid action' 
    }, { status: 400 });

  } catch (error) {
    console.error('Error processing user action:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process request' 
    }, { status: 500 });
  }
}
