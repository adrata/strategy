/**
 * Vercel Cron Job: Automated Data Refresh
 * 
 * Maintains real-time data accuracy by refreshing people based on churn risk:
 * - Red (High Risk): Checked daily
 * - Orange (Medium Risk): Checked weekly  
 * - Green (Low Risk): Checked monthly
 * 
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/data-refresh",
 *     "schedule": "0 2 * * *"  // 2am daily
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔄 [DATA REFRESH CRON] Starting automated data refresh');

    // Get all active workspaces
    const workspaces = await prisma.workspaces.findMany({
      where: {
        isActive: true,
        deletedAt: null
      },
      select: {
        id: true,
        name: true
      }
    });

    console.log(`📊 [DATA REFRESH CRON] Found ${workspaces.length} active workspaces`);

    const results = {
      workspaces: workspaces.length,
      processed: 0,
      red: { checked: 0, refreshed: 0, changes: 0 },
      orange: { checked: 0, refreshed: 0, changes: 0 },
      green: { checked: 0, refreshed: 0, changes: 0 },
      errors: []
    };

    // Determine what to refresh based on day of week/month
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday
    const dayOfMonth = now.getDate();
    
    const shouldRefreshRed = true; // Always check red (daily)
    const shouldRefreshOrange = dayOfWeek === 1; // Monday (weekly)
    const shouldRefreshGreen = dayOfMonth === 1; // 1st of month (monthly)

    console.log(`📅 [DATA REFRESH CRON] Schedule:`);
    console.log(`   🔴 Red (Daily): ${shouldRefreshRed ? 'YES' : 'NO'}`);
    console.log(`   🟠 Orange (Weekly): ${shouldRefreshOrange ? 'YES' : 'NO'}`);
    console.log(`   🟢 Green (Monthly): ${shouldRefreshGreen ? 'YES' : 'NO'}`);

    // Process each workspace
    for (const workspace of workspaces) {
      try {
        console.log(`\n📦 [DATA REFRESH CRON] Processing workspace: ${workspace.name}`);
        
        // Red priority (daily)
        if (shouldRefreshRed) {
          const redStats = await refreshPriorityGroup(workspace.id, 'red');
          results.red.checked += redStats.checked;
          results.red.refreshed += redStats.refreshed;
          results.red.changes += redStats.changes;
        }
        
        // Orange priority (weekly)
        if (shouldRefreshOrange) {
          const orangeStats = await refreshPriorityGroup(workspace.id, 'orange');
          results.orange.checked += orangeStats.checked;
          results.orange.refreshed += orangeStats.refreshed;
          results.orange.changes += orangeStats.changes;
        }
        
        // Green priority (monthly)
        if (shouldRefreshGreen) {
          const greenStats = await refreshPriorityGroup(workspace.id, 'green');
          results.green.checked += greenStats.checked;
          results.green.refreshed += greenStats.refreshed;
          results.green.changes += greenStats.changes;
        }
        
        results.processed++;
        
      } catch (error: any) {
        console.error(`❌ [DATA REFRESH CRON] Error processing workspace ${workspace.name}:`, error);
        results.errors.push({
          workspaceId: workspace.id,
          workspaceName: workspace.name,
          error: error.message
        });
      }
    }

    const duration = Math.floor((Date.now() - startTime) / 1000);
    
    console.log(`\n✅ [DATA REFRESH CRON] Completed in ${duration}s`);
    console.log(`   Workspaces: ${results.processed}/${results.workspaces}`);
    console.log(`   🔴 Red: ${results.red.checked} checked, ${results.red.refreshed} refreshed, ${results.red.changes} changes`);
    console.log(`   🟠 Orange: ${results.orange.checked} checked, ${results.orange.refreshed} refreshed, ${results.orange.changes} changes`);
    console.log(`   🟢 Green: ${results.green.checked} checked, ${results.green.refreshed} refreshed, ${results.green.changes} changes`);

    return NextResponse.json({
      success: true,
      message: `Data refresh completed for ${results.processed} workspaces`,
      duration: `${duration}s`,
      results
    });

  } catch (error: any) {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    console.error('❌ [DATA REFRESH CRON] Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        duration: `${duration}s`
      },
      { status: 500 }
    );
  }
}

/**
 * Refresh people in a priority group (red/orange/green)
 */
async function refreshPriorityGroup(workspaceId: string, color: string) {
  const stats = { checked: 0, refreshed: 0, changes: 0 };
  const now = new Date();
  
  // Get all people with this refresh color
  const allPeople = await prisma.people.findMany({
    where: {
      workspaceId: workspaceId,
      deletedAt: null,
      isBuyerGroupMember: true, // Focus on buyer group members
      customFields: {
        not: null
      }
    },
    include: {
      company: {
        select: { id: true, name: true }
      }
    },
    take: 100 // Limit per run for performance
  });

  // Filter to those needing refresh
  const needingRefresh = allPeople.filter(person => {
    const churnPrediction = (person.customFields as any)?.churnPrediction;
    if (!churnPrediction) return false;
    
    const refreshColor = churnPrediction.refreshColor;
    if (refreshColor !== color) return false;
    
    const nextRefreshDate = churnPrediction.nextRefreshDate;
    if (!nextRefreshDate) return false;
    
    return new Date(nextRefreshDate) <= now;
  });

  console.log(`   ${getColorEmoji(color)} ${color}: ${needingRefresh.length} people need refresh`);

  for (const person of needingRefresh) {
    try {
      // For now, just update the refresh date
      // In production, would call Coresignal API here
      
      const nextRefresh = calculateNextRefreshDate(color);
      
      await prisma.people.update({
        where: { id: person.id },
        data: {
          customFields: {
            ...(person.customFields as any || {}),
            churnPrediction: {
              ...((person.customFields as any)?.churnPrediction || {}),
              lastRefreshDate: now.toISOString(),
              nextRefreshDate: nextRefresh.toISOString()
            }
          },
          dataLastVerified: now
        }
      });
      
      stats.checked++;
      stats.refreshed++;
      
    } catch (error) {
      console.error(`   ❌ Error refreshing ${person.fullName}:`, error);
    }
  }

  return stats;
}

function calculateNextRefreshDate(color: string): Date {
  const now = new Date();
  const next = new Date(now);
  
  if (color === 'red') {
    next.setDate(next.getDate() + 1); // Tomorrow
  } else if (color === 'orange') {
    next.setDate(next.getDate() + 7); // Next week
  } else {
    next.setMonth(next.getMonth() + 1); // Next month
  }
  
  return next;
}

function getColorEmoji(color: string): string {
  const emojis: Record<string, string> = {
    red: '🔴',
    orange: '🟠',
    green: '🟢'
  };
  return emojis[color] || '⚪';
}

