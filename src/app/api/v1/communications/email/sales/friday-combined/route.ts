import { NextRequest, NextResponse } from 'next/server';
import { sendFridayCombinedEmail, User, DailyProgress, WeeklySummary } from '@/platform/services/SalesEmailService';

// Required for static export (desktop build)
export const dynamic = 'force-static';

export async function POST(request: NextRequest) {
  try {
    const { user, dailyProgress, weeklySummary } = await request.json();
    
    if (!user || !user.email || !user.name) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required user data' 
      }, { status: 400 });
    }

    if (!dailyProgress) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing daily progress data' 
      }, { status: 400 });
    }

    if (!weeklySummary) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing weekly summary data' 
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

    const success = await sendFridayCombinedEmail(userData as any, dailyProgress, weeklySummary);
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Friday combined email sent successfully' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to send Friday combined email' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error sending Friday combined email:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
