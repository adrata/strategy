import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getSecureApiContext } from '@/platform/services/secure-api-helper';

// Required for static export (desktop build)
export const dynamic = 'force-static';

export async function GET(request: NextRequest) {
  try {
    const authResult = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });
    
    const { context, response } = authResult;
    if (response) return response;
    if (!context) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

    // Get a few leads to test
    const leads = await prisma.people.findMany({
      where: {
        workspaceId: context.workspaceId,
        status: 'LEAD',
        deletedAt: null
      },
      take: 3,
      select: {
        id: true,
        fullName: true,
        lastAction: true,
        lastActionDate: true,
        nextAction: true,
        nextActionDate: true,
        createdAt: true,
        globalRank: true
      }
    });

    // Test the timing logic
    const { isMeaningfulAction } = await import('@/platform/utils/meaningfulActions');
    
    const results = await Promise.all(leads.map(async (lead) => {
      const lastAction = await prisma.actions.findFirst({
        where: { 
          personId: lead.id, 
          deletedAt: null,
          status: 'COMPLETED'
        },
        orderBy: { completedAt: 'desc' },
        select: { 
          subject: true, 
          completedAt: true, 
          type: true,
          createdAt: true
        }
      });

      // Calculate timing
      let lastActionTime = 'Never';
      let lastActionText = lead.lastAction;
      let lastActionDate = lead.lastActionDate;
      
      if (lastAction && isMeaningfulAction(lastAction.type)) {
        lastActionText = lastAction.subject || lastAction.type;
        lastActionDate = lastAction.completedAt || lastAction.createdAt;
      }
      
      if (lastActionDate && lastActionText && lastActionText !== 'No action taken') {
        const daysSince = Math.floor((new Date().getTime() - new Date(lastActionDate).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince === 0) lastActionTime = 'Today';
        else if (daysSince === 1) lastActionTime = 'Yesterday';
        else if (daysSince <= 7) lastActionTime = `${daysSince} days ago`;
        else if (daysSince <= 30) lastActionTime = `${Math.floor(daysSince / 7)} weeks ago`;
        else lastActionTime = `${Math.floor(daysSince / 30)} months ago`;
      } else if (lead.createdAt) {
        const daysSince = Math.floor((new Date().getTime() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince === 0) lastActionTime = 'Today';
        else if (daysSince === 1) lastActionTime = 'Yesterday';
        else if (daysSince <= 7) lastActionTime = `${daysSince} days ago`;
        else if (daysSince <= 30) lastActionTime = `${Math.floor(daysSince / 7)} weeks ago`;
        else lastActionTime = `${Math.floor(daysSince / 30)} months ago`;
      }

      return {
        id: lead.id,
        name: lead.fullName,
        originalLastAction: lead.lastAction,
        originalLastActionDate: lead.lastActionDate,
        computedLastAction: lastActionText,
        computedLastActionDate: lastActionDate,
        lastActionTime: lastActionTime,
        hasActionFromDB: !!lastAction,
        actionType: lastAction?.type,
        actionSubject: lastAction?.subject
      };
    }));

    return NextResponse.json({
      success: true,
      data: results,
      message: 'Timing test results'
    });

  } catch (error) {
    console.error('Test timing error:', error);
    return NextResponse.json({ error: 'Test failed' }, { status: 500 });
  }
}
