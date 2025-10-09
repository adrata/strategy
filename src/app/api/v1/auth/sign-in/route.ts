import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

/**
 * V1 Sign-in API
 * POST /api/v1/auth/sign-in - Authenticate user and return JWT token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email or username
    const user = await prisma.users.findFirst({
      where: {
        OR: [
          { email: email },
          { username: email }
        ],
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        password: true,
        isActive: true,
        activeWorkspaceId: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Get workspace details
    const workspace = user.activeWorkspaceId ? await prisma.workspaces.findUnique({
      where: { id: user.activeWorkspaceId },
      select: { id: true, name: true, slug: true }
    }) : null;

    // Generate JWT token
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        workspaceId: user.activeWorkspaceId,
        workspaceName: workspace?.name,
        workspaceSlug: workspace?.slug,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      },
      secret
    );

    // Update last login
    await prisma.users.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          workspaceId: user.activeWorkspaceId,
          workspaceName: workspace?.name,
          workspaceSlug: workspace?.slug,
        }
      },
      meta: {
        message: 'Authentication successful'
      }
    });

  } catch (error) {
    console.error('❌ [V1 AUTH] Sign-in error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
