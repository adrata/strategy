import { NextRequest, NextResponse } from 'next/server';
import { WorkspaceDataRouter } from '@/platform/services/workspace-data-router';
import { prisma } from '@/platform/database/prisma-client';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const { workspaceId, userId } = await WorkspaceDataRouter.getWorkspaceContext(request);
    
    // Get user with profile information
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        title: true,
        department: true,
        phoneNumber: true,
        linkedinUrl: true,
        timezone: true,
        communicationStyle: true,
        preferredDetailLevel: true,
        quota: true,
        territory: true,
        dashboardConfig: true
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

    const dashboardConfig = user.dashboardConfig as any || {};

    const userSettings = {
      // Profile Information
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      title: user.title || '',
      department: user.department || '',
      phoneNumber: user.phoneNumber || '',
      linkedinUrl: user.linkedinUrl || '',
      
      // AI Context Preferences
      timezone: user.timezone || 'America/New_York',
      communicationStyle: user.communicationStyle || 'consultative',
      preferredDetailLevel: user.preferredDetailLevel || 'detailed',
      
      // Performance Settings
      quota: Number(user.quota) || 1000000,
      territory: user.territory || '',
      dailyActivityTarget: dashboardConfig.dailyActivityTarget || 25
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

    // Update user table
    await prisma.users.update({
      where: { id: userId },
      data: {
        firstName: settings.firstName,
        lastName: settings.lastName,
        name: `${settings.firstName} ${settings.lastName}`.trim(),
        title: settings.title,
        department: settings.department,
        phoneNumber: settings.phoneNumber,
        linkedinUrl: settings.linkedinUrl,
        timezone: settings.timezone,
        communicationStyle: settings.communicationStyle,
        preferredDetailLevel: settings.preferredDetailLevel,
        quota: settings.quota ? String(settings.quota) : null,
        territory: settings.territory,
        dashboardConfig: {
          dailyActivityTarget: settings.dailyActivityTarget
        },
        updatedAt: new Date()
      }
    });

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
