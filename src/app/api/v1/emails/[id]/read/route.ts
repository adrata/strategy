// Required for static export (desktop build)
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;
    const body = await request.json();
    const { isRead } = body;
    
    if (typeof isRead !== 'boolean') {
      return NextResponse.json({ 
        error: 'isRead must be a boolean' 
      }, { status: 400 });
    }
    
    // Verify email exists and user has access
    const email = await prisma.email_messages.findFirst({
      where: {
        id,
        workspaceId: {
          in: await prisma.workspace_users.findMany({
            where: { userId: session.user.id },
            select: { workspaceId: true }
          }).then(workspaces => workspaces.map(w => w.workspaceId))
        }
      }
    });
    
    if (!email) {
      return NextResponse.json({ 
        error: 'Email not found or access denied' 
      }, { status: 404 });
    }
    
    // Update read status
    const updatedEmail = await prisma.email_messages.update({
      where: { id },
      data: { 
        isRead,
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json({
      success: true,
      email: {
        id: updatedEmail.id,
        isRead: updatedEmail.isRead
      }
    });
    
  } catch (error) {
    console.error('❌ Error updating email read status:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

