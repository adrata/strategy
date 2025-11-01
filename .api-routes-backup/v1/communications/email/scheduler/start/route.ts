import { NextRequest, NextResponse } from 'next/server';
import { EmailScheduler } from '@/platform/services/EmailScheduler';

export async function POST(request: NextRequest) {
  try {
    const scheduler = EmailScheduler.getInstance();
    scheduler.startScheduler();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Email scheduler started successfully' 
    });
  } catch (error) {
    console.error('Error starting email scheduler:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to start email scheduler' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const scheduler = EmailScheduler.getInstance();
    const users = await scheduler.getActiveUsers();
    
    return NextResponse.json({ 
      success: true, 
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        timezone: user.timezone,
        role: user.role,
        workspace: user.workspaceName
      }))
    });
  } catch (error) {
    console.error('Error getting scheduler status:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to get scheduler status' 
    }, { status: 500 });
  }
}
