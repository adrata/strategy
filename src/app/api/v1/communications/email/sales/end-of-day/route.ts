import { NextRequest, NextResponse } from 'next/server';
import { sendEndOfDayEmail, sendManagerRollupEmail, User, DailyProgress } from '@/platform/services/SalesEmailService';

// Required for static export (desktop build)
export const dynamic = 'force-static';

export async function POST(request: NextRequest) {
  try {
    const { user, progress, teamProgress } = await request.json();
    
    if (!user || !user.email || !user.name) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required user data' 
      }, { status: 400 });
    }

    if (!progress) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing progress data' 
      }, { status: 400 });
    }

    const userData: User = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'seller',
      workspaceId: user.workspaceId || 'default',
      workspaceName: user.workspaceName || 'Adrata'
    };

    let success = false;

    if (userData['role'] === 'manager' && teamProgress) {
      // Send manager rollup email
      success = await sendManagerRollupEmail(userData as any, teamProgress);
    } else {
      // Send individual end of day email
      success = await sendEndOfDayEmail(userData as any, progress);
    }
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'End of day email sent successfully' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to send end of day email' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error sending end of day email:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
