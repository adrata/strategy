// Required for static export (desktop build)
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUnifiedAuthUser } from '@/platform/api-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const user = await getUnifiedAuthUser(request);
    if (!user || !user.activeWorkspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;
    
    // Verify email exists and user has access
    const email = await prisma.email_messages.findFirst({
      where: {
        id,
        workspaceId: user.activeWorkspaceId
      }
    });
    
    if (!email) {
      return NextResponse.json({ 
        error: 'Email not found or access denied' 
      }, { status: 404 });
    }
    
    // For now, we'll just delete the email (archive = soft delete)
    // In the future, we could add an 'archived' field to the schema
    await prisma.email_messages.delete({
      where: { id }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Email archived successfully'
    });
    
  } catch (error) {
    console.error('❌ Error archiving email:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

