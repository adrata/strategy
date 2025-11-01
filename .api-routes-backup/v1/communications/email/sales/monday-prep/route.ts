import { NextRequest, NextResponse } from 'next/server';
import { sendMondayPrepEmail, Seller } from '@/platform/services/SalesEmailService';

export async function POST(request: NextRequest) {
  try {
    const { user } = await request.json();
    
    if (!user || !user.email || !user.name) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required user data' 
      }, { status: 400 });
    }

    const seller: Seller = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'seller',
      workspaceId: user.workspaceId || 'default',
      workspaceName: user.workspaceName || 'Adrata',
      managerId: user.managerId
    };

    const success = await sendMondayPrepEmail(seller);
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Monday prep email sent successfully' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to send Monday prep email' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error sending Monday prep email:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
