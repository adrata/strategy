#!/usr/bin/env node

/**
 * Generate Weekly Chronicle Reports Script
 * 
 * This script generates real Chronicle reports for each day this week
 * and today's weekly report using actual workspace data.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Notary Everyday workspace IDs
const NOTARY_EVERYDAY_WORKSPACE_IDS = [
  '01K1VBYmf75hgmvmz06psnc9ug',
  '01K7DNYR5VZ7JY36KGKKN76XZ1', 
  'cmezxb1ez0001pc94yry3ntjk'
];

async function generateChronicleReport(reportType, workspaceId, userId, targetDate) {
  try {
    console.log(`🚀 Generating ${reportType} report for ${targetDate.toISOString().split('T')[0]}...`);
    
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/v1/chronicle/generate-enhanced`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reportType,
        workspaceId,
        userId,
        targetDate: targetDate.toISOString()
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API call failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`✅ Generated ${reportType} report: ${result.data?.id || 'Unknown ID'}`);
    return result.data;

  } catch (error) {
    console.error(`❌ Failed to generate ${reportType} report:`, error.message);
    throw error;
  }
}

async function getNotaryEverydayUser(workspaceId) {
  const user = await prisma.users.findFirst({
    where: {
      activeWorkspaceId: workspaceId,
      email: {
        contains: 'ryan' // Assuming Ryan Serrato is the main user
      }
    },
    select: {
      id: true,
      name: true,
      email: true
    }
  });

  if (!user) {
    // Fallback to any user in the workspace
    const fallbackUser = await prisma.users.findFirst({
      where: {
        activeWorkspaceId: workspaceId
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });
    return fallbackUser;
  }

  return user;
}

async function generateWeeklyChronicleReports() {
  try {
    console.log('📅 Chronicle Reports Generator');
    console.log('=============================\n');

    // Find Notary Everyday workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: NOTARY_EVERYDAY_WORKSPACE_IDS.map(id => ({ id }))
      },
      select: {
        id: true,
        name: true,
        slug: true
      }
    });

    if (!workspace) {
      console.log('❌ Notary Everyday workspace not found');
      return;
    }

    console.log(`📁 Workspace: ${workspace.name} (${workspace.slug})`);
    console.log(`🆔 ID: ${workspace.id}\n`);

    // Get user for report generation
    const user = await getNotaryEverydayUser(workspace.id);
    if (!user) {
      console.log('❌ No user found in workspace');
      return;
    }

    console.log(`👤 User: ${user.name} (${user.email})`);
    console.log(`🆔 User ID: ${user.id}\n`);

    // Calculate this week's dates
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
    endOfWeek.setHours(23, 59, 59, 999);

    console.log(`📅 Week period: ${startOfWeek.toISOString().split('T')[0]} to ${endOfWeek.toISOString().split('T')[0]}`);
    console.log(`📅 Today: ${now.toISOString().split('T')[0]}\n`);

    const results = {
      daily: [],
      weekly: null,
      errors: []
    };

    // Generate daily reports for each day this week up to today
    console.log('📆 Generating Daily Reports:');
    console.log('-----------------------------');
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      
      // Only generate for days up to today
      if (day > now) {
        console.log(`⏭️  Skipping ${day.toISOString().split('T')[0]} (future date)`);
        continue;
      }
      
      const dayName = day.toLocaleDateString('en-US', { weekday: 'long' });
      const dayStr = day.toISOString().split('T')[0];
      
      try {
        const report = await generateChronicleReport('DAILY', workspace.id, user.id, day);
        results.daily.push({
          date: dayStr,
          dayName,
          reportId: report?.id,
          success: true
        });
        console.log(`✅ ${dayName} (${dayStr}): Generated successfully`);
        
        // Add small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        results.errors.push({
          type: 'DAILY',
          date: dayStr,
          error: error.message
        });
        console.log(`❌ ${dayName} (${dayStr}): Failed - ${error.message}`);
      }
    }

    // Generate weekly report for this week
    console.log('\n📊 Generating Weekly Report:');
    console.log('-----------------------------');
    
    try {
      const weeklyReport = await generateChronicleReport('WEEKLY', workspace.id, user.id, now);
      results.weekly = {
        reportId: weeklyReport?.id,
        success: true
      };
      console.log(`✅ Weekly report: Generated successfully`);
      
    } catch (error) {
      results.errors.push({
        type: 'WEEKLY',
        error: error.message
      });
      console.log(`❌ Weekly report: Failed - ${error.message}`);
    }

    // Generate bi-weekly presentation report (every other Friday)
    console.log('\n🎯 Generating Bi-weekly Presentation Report:');
    console.log('---------------------------------------------');
    
    const isEvenWeek = Math.floor((now.getTime() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000)) % 2 === 0;
    const isFriday = now.getDay() === 5; // Friday
    
    if (isFriday && isEvenWeek) {
      try {
        const presentationReport = await generateChronicleReport('BIWEEKLY', workspace.id, user.id, now);
        results.presentation = {
          reportId: presentationReport?.id,
          success: true
        };
        console.log(`✅ Bi-weekly presentation: Generated successfully`);
        
      } catch (error) {
        results.errors.push({
          type: 'BIWEEKLY',
          error: error.message
        });
        console.log(`❌ Bi-weekly presentation: Failed - ${error.message}`);
      }
    } else {
      console.log(`⏭️  Skipping bi-weekly presentation (not Friday or not even week)`);
    }

    // Summary
    console.log('\n📈 Generation Summary:');
    console.log('======================');
    console.log(`✅ Daily reports generated: ${results.daily.filter(r => r.success).length}`);
    console.log(`✅ Weekly report generated: ${results.weekly?.success ? 'Yes' : 'No'}`);
    console.log(`✅ Presentation report generated: ${results.presentation?.success ? 'Yes' : 'No'}`);
    console.log(`❌ Errors: ${results.errors.length}`);

    if (results.errors.length > 0) {
      console.log('\n❌ Error Details:');
      results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.type} ${error.date || ''}: ${error.error}`);
      });
    }

    // Verify reports were created in database
    console.log('\n🔍 Verifying Database Records:');
    console.log('-------------------------------');
    
    const chronicleReports = await prisma.chronicleReport.findMany({
      where: {
        workspaceId: workspace.id,
        createdAt: {
          gte: startOfWeek,
          lte: endOfWeek
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const atriumDocs = await prisma.atriumDocument.findMany({
      where: {
        workspaceId: workspace.id,
        sourceRecordType: 'CHRONICLE',
        createdAt: {
          gte: startOfWeek,
          lte: endOfWeek
        },
        deletedAt: null
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 ChronicleReport table: ${chronicleReports.length} reports`);
    console.log(`📄 Atrium documents: ${atriumDocs.length} documents`);

    if (chronicleReports.length > 0) {
      console.log('\n📋 Generated Reports:');
      chronicleReports.forEach((report, index) => {
        console.log(`  ${index + 1}. ${report.title} (${report.reportType})`);
        console.log(`     - Created: ${report.createdAt.toISOString()}`);
        console.log(`     - ID: ${report.id}`);
      });
    }

    console.log('\n✅ Chronicle reports generation completed!');

  } catch (error) {
    console.error('❌ Error during report generation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the generator
if (require.main === module) {
  generateWeeklyChronicleReports();
}

module.exports = { generateWeeklyChronicleReports };
