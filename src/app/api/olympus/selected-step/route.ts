import { NextRequest, NextResponse } from 'next/server';

// Check if KV is available
// Required for static export (desktop build)
export const dynamic = 'force-static';

let kv: any = null;
try {
  const { kv: kvClient } = require('@vercel/kv');
  kv = kvClient;
} catch (error) {
  console.log('KV not available, using fallback');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    // If KV is not available, return null (no persistence)
    if (!kv) {
      return NextResponse.json({ selectedStep: null });
    }

    const key = `olympus:selected-step:${workspaceId}`;
    const selectedStep = await kv.get(key);
    
    return NextResponse.json({ selectedStep });
  } catch (error) {
    console.error('Error getting selected step:', error);
    // Return null instead of error to allow app to continue working
    return NextResponse.json({ selectedStep: null });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { workspaceId, selectedStep } = await request.json();
    
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    // If KV is not available, just return success (no persistence)
    if (!kv) {
      return NextResponse.json({ success: true });
    }

    const key = `olympus:selected-step:${workspaceId}`;
    
    if (selectedStep) {
      await kv.set(key, selectedStep, { ex: 86400 }); // 24 hours TTL
    } else {
      await kv.del(key);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving selected step:', error);
    // Return success instead of error to allow app to continue working
    return NextResponse.json({ success: true });
  }
}
