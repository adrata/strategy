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
      stats.checked++;
      
      // Get Coresignal ID from person data
      const customFields = (person.customFields as any) || {};
      const coresignalId = customFields.coresignalId || customFields.coresignalData?.id;
      
      if (!coresignalId) {
        console.log(`   ⚠️ No Coresignal ID for ${person.fullName}, skipping refresh`);
        continue;
      }
      
      // Fetch fresh data from Coresignal
      const freshData = await fetchFreshCoresignalData(coresignalId);
      
      if (!freshData) {
        console.log(`   ⚠️ Could not fetch fresh data for ${person.fullName}`);
        // Still update refresh date to avoid retrying immediately
        const nextRefresh = calculateNextRefreshDate(color);
        await prisma.people.update({
          where: { id: person.id },
          data: {
            customFields: {
              ...customFields,
              churnPrediction: {
                ...(customFields.churnPrediction || {}),
                lastRefreshDate: now.toISOString(),
                nextRefreshDate: nextRefresh.toISOString()
              }
            },
            dataLastVerified: now
          }
        });
        continue;
      }
      
      // Detect changes
      const changes = detectDataChanges(person, freshData);
      
      // Update person with fresh data
      const updatedCustomFields = {
        ...customFields,
        coresignalData: freshData,
        churnPrediction: {
          ...(customFields.churnPrediction || {}),
          lastRefreshDate: now.toISOString(),
          nextRefreshDate: calculateNextRefreshDate(color).toISOString()
        },
        changeHistory: [
          ...(customFields.changeHistory || []),
          ...changes.map(c => ({
            ...c,
            detectedAt: now.toISOString()
          }))
        ],
        lastChangeDetected: changes.length > 0 ? now.toISOString() : customFields.lastChangeDetected,
        hasUnnotifiedChanges: changes.length > 0 ? true : (customFields.hasUnnotifiedChanges || false)
      };
      
      // Check for critical changes (company/title change)
      const criticalChange = changes.some(c => c.critical === true);
      
      if (criticalChange) {
        console.log(`   🚨 CRITICAL CHANGE detected for ${person.fullName}`);
        // Update churn prediction to RED for critical changes
        updatedCustomFields.churnPrediction = {
          ...updatedCustomFields.churnPrediction,
          refreshColor: 'red',
          refreshPriority: 'high',
          refreshFrequency: 'daily',
          nextRefreshDate: calculateNextRefreshDate('red').toISOString()
        };
      }
      
      // Update person record
      await prisma.people.update({
        where: { id: person.id },
        data: {
          customFields: updatedCustomFields,
          dataLastVerified: now,
          // Update experience fields if changed
          ...(getUpdatedPersonFields(person, freshData, changes))
        }
      });
      
      stats.refreshed++;
      if (changes.length > 0) {
        stats.changes += changes.length;
        console.log(`   ✅ Refreshed ${person.fullName}: ${changes.length} changes detected`);
      } else {
        console.log(`   ✅ Refreshed ${person.fullName}: No changes`);
      }
      
    } catch (error: any) {
      console.error(`   ❌ Error refreshing ${person.fullName}:`, error.message);
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

/**
 * Fetch fresh data from Coresignal API
 */
async function fetchFreshCoresignalData(coresignalId: string) {
  const apiKey = process.env.CORESIGNAL_API_KEY;
  if (!apiKey) {
    console.error('   ❌ CORESIGNAL_API_KEY not found');
    return null;
  }

  try {
    // Try person_multi_source/collect first
    let response = await fetch(`https://api.coresignal.com/cdapi/v2/person_multi_source/collect/${coresignalId}`, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      return await response.json();
    }

    // Try employee_multi_source/collect as fallback
    if (response.status === 404) {
      response = await fetch(`https://api.coresignal.com/cdapi/v2/employee_multi_source/collect/${coresignalId}`, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        return await response.json();
      }
    }

    return null;
  } catch (error: any) {
    console.error(`   ❌ Coresignal API error: ${error.message}`);
    return null;
  }
}

/**
 * Detect changes between existing and fresh data
 */
function detectDataChanges(person: any, freshData: any): any[] {
  const changes: any[] = [];
  const customFields = (person.customFields as any) || {};
  const oldData = customFields.coresignalData || {};
  const oldExperience = oldData.experience?.find((exp: any) => exp.active_experience === 1) || oldData.experience?.[0];
  const newExperience = freshData.experience?.find((exp: any) => exp.active_experience === 1) || freshData.experience?.[0];

  if (!newExperience) return changes;

  // Company change (CRITICAL)
  if (oldExperience?.company_name && newExperience.company_name && 
      oldExperience.company_name !== newExperience.company_name) {
    changes.push({
      field: 'company',
      oldValue: oldExperience.company_name,
      newValue: newExperience.company_name,
      critical: true
    });
  }

  // Title change (CRITICAL)
  if (oldExperience?.position_title && newExperience.position_title &&
      oldExperience.position_title !== newExperience.position_title) {
    changes.push({
      field: 'title',
      oldValue: oldExperience.position_title,
      newValue: newExperience.position_title,
      critical: true
    });
  }

  // Active status change (CRITICAL)
  if (oldExperience?.active_experience === 1 && newExperience.active_experience === 0) {
    changes.push({
      field: 'active_experience',
      oldValue: 'Active',
      newValue: 'Inactive',
      critical: true
    });
  }

  // Email change
  if (freshData.email && person.email && freshData.email !== person.email) {
    changes.push({
      field: 'email',
      oldValue: person.email,
      newValue: freshData.email,
      critical: false
    });
  }

  // LinkedIn connections change (engagement signal)
  const oldConnections = oldData.connections_count;
  if (freshData.connections_count && oldConnections && 
      Math.abs(freshData.connections_count - oldConnections) > 100) {
    changes.push({
      field: 'connections',
      oldValue: oldConnections,
      newValue: freshData.connections_count,
      critical: false
    });
  }

  return changes;
}

/**
 * Get updated person fields based on fresh data
 */
function getUpdatedPersonFields(person: any, freshData: any, changes: any[]): any {
  const updates: any = {};
  const newExperience = freshData.experience?.find((exp: any) => exp.active_experience === 1) || freshData.experience?.[0];

  // Update title if changed
  const titleChange = changes.find(c => c.field === 'title');
  if (titleChange && newExperience?.position_title) {
    updates.jobTitle = newExperience.position_title;
    updates.currentRole = newExperience.position_title;
  }

  // Update email if changed
  const emailChange = changes.find(c => c.field === 'email');
  if (emailChange && freshData.email) {
    updates.email = freshData.email;
  }

  // Update LinkedIn connections
  if (freshData.connections_count) {
    updates.linkedinConnections = freshData.connections_count;
  }

  if (freshData.followers_count) {
    updates.linkedinFollowers = freshData.followers_count;
  }

  // Update experience months if available
  if (newExperience?.duration_months) {
    updates.yearsInRole = Math.floor(newExperience.duration_months / 12);
  }

  if (freshData.total_experience_duration_months) {
    updates.totalExperienceMonths = freshData.total_experience_duration_months;
    updates.yearsExperience = Math.floor(freshData.total_experience_duration_months / 12);
  }

  return updates;
}

