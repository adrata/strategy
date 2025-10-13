import { NextRequest, NextResponse } from 'next/server';
import { sendWeeklySummaryEmail, User, WeeklySummary } from '@/platform/services/SalesEmailService';

export async function POST(request: NextRequest) {
  try {
    const { user, summary } = await request.json();
    
    if (!user || !user.email || !user.name) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required user data' 
      }, { status: 400 });
    }

    if (!summary) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing summary data' 
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

    const success = await sendWeeklySummaryEmail(userData as any, summary);
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Weekly summary email sent successfully' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to send weekly summary email' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error sending weekly summary email:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
