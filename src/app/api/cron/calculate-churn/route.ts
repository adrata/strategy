/**
 * Vercel Cron Job: Calculate Churn Predictions
 * 
 * Calculates churn predictions (red/orange/green) for all people
 * Based on career history and time in current role
 * 
 * Runs weekly to keep predictions up-to-date
 * 
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/calculate-churn",
 *     "schedule": "0 3 * * 0"  // 3am every Sunday
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

    console.log('🎯 [CHURN CRON] Starting churn prediction calculation');

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

    console.log(`📊 [CHURN CRON] Found ${workspaces.length} active workspaces`);

    const results = {
      workspaces: workspaces.length,
      totalPeople: 0,
      calculated: 0,
      red: 0,
      orange: 0,
      green: 0,
      errors: []
    };

    // Process each workspace
    for (const workspace of workspaces) {
      try {
        console.log(`📦 [CHURN CRON] Processing: ${workspace.name}`);
        
        const workspaceResult = await calculateChurnForWorkspace(workspace.id);
        
        results.totalPeople += workspaceResult.totalPeople;
        results.calculated += workspaceResult.calculated;
        results.red += workspaceResult.red;
        results.orange += workspaceResult.orange;
        results.green += workspaceResult.green;
        
        console.log(`✅ [CHURN CRON] ${workspace.name}: ${workspaceResult.calculated} calculated`);
        
      } catch (error: any) {
        console.error(`❌ [CHURN CRON] Error in ${workspace.name}:`, error);
        results.errors.push({
          workspaceId: workspace.id,
          workspaceName: workspace.name,
          error: error.message
        });
      }
    }

    const duration = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    console.log(`\n✅ [CHURN CRON] Completed in ${minutes}m ${seconds}s`);
    console.log(`   Total: ${results.totalPeople}`);
    console.log(`   Calculated: ${results.calculated}`);
    console.log(`   🔴 Red: ${results.red}`);
    console.log(`   🟠 Orange: ${results.orange}`);
    console.log(`   🟢 Green: ${results.green}`);

    return NextResponse.json({
      success: true,
      message: `Churn predictions calculated for ${results.calculated} people across ${workspaces.length} workspaces`,
      duration: `${minutes}m ${seconds}s`,
      results
    });

  } catch (error: any) {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    console.error('❌ [CHURN CRON] Error:', error);
    
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
 * Calculate churn for all people in a workspace
 */
async function calculateChurnForWorkspace(workspaceId: string) {
  const stats = {
    totalPeople: 0,
    calculated: 0,
    red: 0,
    orange: 0,
    green: 0
  };

  // Get people with Coresignal data - prioritize buyer group members
  const people = await prisma.people.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      customFields: {
        not: null
      },
      // Prioritize buyer group members for churn prediction
      OR: [
        { isBuyerGroupMember: true },
        { customFields: { path: ['coresignalData'], not: null } }
      ]
    },
    orderBy: [
      { isBuyerGroupMember: 'desc' }, // Buyer group members first
      { dataLastVerified: 'asc' } // Then by last verification date
    ],
    take: 200 // Limit per workspace per cron run
  });

  stats.totalPeople = people.length;

  for (const person of people) {
    try {
      const customFields = person.customFields as any;
      const coresignalData = customFields?.coresignalData;
      
      if (!coresignalData?.experience) {
        continue;
      }

      // Calculate churn prediction
      const churnPrediction = calculateChurnPrediction(coresignalData.experience);
      
      // Update database
      await prisma.people.update({
        where: { id: person.id },
        data: {
          customFields: {
            ...customFields,
            churnPrediction: churnPrediction
          }
        }
      });

      stats.calculated++;
      
      if (churnPrediction.refreshColor === 'red') stats.red++;
      else if (churnPrediction.refreshColor === 'orange') stats.orange++;
      else if (churnPrediction.refreshColor === 'green') stats.green++;
      
    } catch (error) {
      console.error(`   ❌ Error calculating churn for ${person.fullName}:`, error);
    }
  }

  return stats;
}

/**
 * Calculate churn prediction from experience data
 */
function calculateChurnPrediction(experience: any[] = []) {
  const currentExperience = experience.find((exp: any) => exp.active_experience === 1) || experience[0];
  const currentMonthsInRole = currentExperience?.duration_months || 0;

  const completedRoles = experience.filter((exp: any) => 
    exp.active_experience === 0 && exp.duration_months && exp.duration_months > 0
  );

  if (completedRoles.length === 0) {
    const defaultAverageMonths = 24;
    const churnRiskScore = currentMonthsInRole >= defaultAverageMonths ? 70 : 30;
    
    return {
      averageTimeInRoleMonths: defaultAverageMonths,
      predictedDepartureMonths: Math.max(0, defaultAverageMonths - currentMonthsInRole),
      churnRiskScore,
      churnRiskLevel: churnRiskScore >= 60 ? 'high' : 'medium',
      refreshColor: churnRiskScore >= 60 ? 'red' : 'orange',
      refreshPriority: churnRiskScore >= 60 ? 'high' : 'medium',
      refreshFrequency: churnRiskScore >= 60 ? 'daily' : 'weekly',
      nextRefreshDate: calculateNextRefreshDate(churnRiskScore >= 60 ? 'red' : 'orange'),
      lastRefreshDate: new Date().toISOString()
    };
  }

  const totalMonths = completedRoles.reduce((sum: number, exp: any) => sum + (exp.duration_months || 0), 0);
  const averageTimeInRoleMonths = Math.round(totalMonths / completedRoles.length);
  const predictedDepartureMonths = Math.max(0, averageTimeInRoleMonths - currentMonthsInRole);

  let churnRiskScore = 50;
  
  if (currentMonthsInRole >= averageTimeInRoleMonths) {
    churnRiskScore = 70 + Math.min(20, (currentMonthsInRole - averageTimeInRoleMonths) / 2);
  } else if (currentMonthsInRole >= averageTimeInRoleMonths * 0.8) {
    churnRiskScore = 55 + ((currentMonthsInRole / averageTimeInRoleMonths) * 15);
  } else {
    churnRiskScore = 30 + ((currentMonthsInRole / averageTimeInRoleMonths) * 20);
  }

  if (completedRoles.length >= 5) churnRiskScore += 10;
  else if (completedRoles.length >= 3) churnRiskScore += 5;

  churnRiskScore = Math.max(0, Math.min(100, Math.round(churnRiskScore)));

  let churnRiskLevel = 'low';
  let refreshColor = 'green';
  let refreshPriority = 'low';
  let refreshFrequency = 'monthly';
  
  if (churnRiskScore >= 60 || predictedDepartureMonths <= 3) {
    churnRiskLevel = 'high';
    refreshColor = 'red';
    refreshPriority = 'high';
    refreshFrequency = 'daily';
  } else if (churnRiskScore >= 40 || predictedDepartureMonths <= 6) {
    churnRiskLevel = 'medium';
    refreshColor = 'orange';
    refreshPriority = 'medium';
    refreshFrequency = 'weekly';
  }

  return {
    averageTimeInRoleMonths,
    predictedDepartureMonths,
    churnRiskScore,
    churnRiskLevel,
    predictedDepartureDate: predictedDepartureMonths > 0
      ? new Date(Date.now() + predictedDepartureMonths * 30 * 24 * 60 * 60 * 1000).toISOString()
      : null,
    refreshColor,
    refreshPriority,
    refreshFrequency,
    refreshFrequencyDays: refreshFrequency === 'daily' ? 1 : refreshFrequency === 'weekly' ? 7 : 30,
    nextRefreshDate: calculateNextRefreshDate(refreshColor),
    lastRefreshDate: new Date().toISOString()
  };
}

function calculateNextRefreshDate(color: string): string {
  const now = new Date();
  const next = new Date(now);
  
  if (color === 'red') {
    next.setDate(next.getDate() + 1);
  } else if (color === 'orange') {
    next.setDate(next.getDate() + 7);
  } else {
    next.setMonth(next.getMonth() + 1);
  }
  
  return next.toISOString();
}

/**
 * POST: Manual trigger
 */
export async function POST(request: NextRequest) {
  return GET(request);
}

