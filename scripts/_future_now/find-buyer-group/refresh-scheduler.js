#!/usr/bin/env node

/**
 * Data Refresh Scheduler
 * 
 * Queries people records and identifies which ones need data refresh
 * based on their churn risk and refresh schedule.
 * 
 * Usage:
 *   node refresh-scheduler.js --workspace-id "xxx" --priority red
 *   node refresh-scheduler.js --workspace-id "xxx" --priority orange
 *   node refresh-scheduler.js --workspace-id "xxx" --priority green
 *   node refresh-scheduler.js --workspace-id "xxx" --all
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Get people who need data refresh based on their refresh schedule
 * @param {string} workspaceId - Workspace ID
 * @param {string} priority - Priority filter (red/orange/green/all)
 * @returns {Promise<Array>} People who need refresh
 */
async function getPeopleNeedingRefresh(workspaceId, priority = 'all') {
  const now = new Date();
  
  // Get all people with churn prediction data
  const people = await prisma.people.findMany({
    where: {
      workspaceId: workspaceId,
      deletedAt: null,
      customFields: {
        not: null
      }
    },
    select: {
      id: true,
      fullName: true,
      jobTitle: true,
      companyId: true,
      customFields: true,
      dataLastVerified: true,
      aiIntelligence: true,
      company: {
        select: {
          name: true
        }
      }
    }
  });

  // Filter to only those past their next refresh date and matching priority
  const needingRefresh = people.filter(person => {
    const customFields = person.customFields;
    if (!customFields || typeof customFields !== 'object') return false;
    
    const churnPrediction = customFields.churnPrediction;
    if (!churnPrediction || typeof churnPrediction !== 'object') return false;
    
    // Filter by priority if specified
    if (priority !== 'all') {
      const refreshColor = churnPrediction.refreshColor;
      if (refreshColor !== priority) return false;
    }
    
    // Check if refresh is needed (past next refresh date)
    const nextRefreshDate = churnPrediction.nextRefreshDate;
    if (!nextRefreshDate) return false;
    
    const nextRefresh = new Date(nextRefreshDate);
    return nextRefresh <= now;
  });

  return needingRefresh;
}

/**
 * Update refresh dates after data refresh
 * @param {string} personId - Person ID
 * @param {object} refreshSchedule - Refresh schedule from churn prediction
 */
async function updateRefreshDate(personId, refreshSchedule) {
  const now = new Date();
  const nextRefresh = new Date(now);
  
  // Calculate next refresh based on frequency
  if (refreshSchedule.frequency === 'daily') {
    nextRefresh.setDate(nextRefresh.getDate() + 1);
  } else if (refreshSchedule.frequency === 'weekly') {
    nextRefresh.setDate(nextRefresh.getDate() + 7);
  } else {
    nextRefresh.setMonth(nextRefresh.getMonth() + 1);
  }

  // Update customFields with new refresh dates
  const person = await prisma.people.findUnique({
    where: { id: personId },
    select: { customFields: true }
  });

  const customFields = person?.customFields && typeof person.customFields === 'object' 
    ? person.customFields 
    : {};

  await prisma.people.update({
    where: { id: personId },
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
}

async function main() {
  const args = process.argv.slice(2);
  let workspaceId = null;
  let priority = 'all';

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--workspace-id' && args[i + 1]) {
      workspaceId = args[++i];
    } else if (args[i] === '--priority' && args[i + 1]) {
      priority = args[++i].toLowerCase();
      if (!['red', 'orange', 'green', 'all'].includes(priority)) {
        console.error(`❌ Invalid priority: ${priority}. Must be red, orange, green, or all`);
        process.exit(1);
      }
    }
  }

  if (!workspaceId) {
    console.error('❌ Error: --workspace-id required');
    console.log('\nUsage:');
    console.log('  node refresh-scheduler.js --workspace-id "xxx" --priority red');
    console.log('  node refresh-scheduler.js --workspace-id "xxx" --priority orange');
    console.log('  node refresh-scheduler.js --workspace-id "xxx" --priority green');
    console.log('  node refresh-scheduler.js --workspace-id "xxx" --all');
    process.exit(1);
  }

  try {
    console.log(`🔍 Finding people needing refresh (priority: ${priority})...\n`);

    const people = await getPeopleNeedingRefresh(workspaceId, priority);

    if (people.length === 0) {
      console.log('✅ No people need refresh at this time');
      return;
    }

    // Group by priority/color
    const byColor = {
      red: people.filter(p => p.customFields?.churnPrediction?.refreshColor === 'red'),
      orange: people.filter(p => p.customFields?.churnPrediction?.refreshColor === 'orange'),
      green: people.filter(p => p.customFields?.churnPrediction?.refreshColor === 'green')
    };

    console.log(`📊 Refresh Summary:`);
    console.log(`   🔴 Red (Daily): ${byColor.red.length}`);
    console.log(`   🟠 Orange (Weekly): ${byColor.orange.length}`);
    console.log(`   🟢 Green (Monthly): ${byColor.green.length}`);
    console.log(`   Total: ${people.length}\n`);

    // Show details
    console.log('📋 People Needing Refresh:\n');
    people.forEach((person, i) => {
      const churn = person.customFields?.churnPrediction || {};
      const refreshColor = churn.refreshColor || 'unknown';
      const colorEmoji = refreshColor === 'red' ? '🔴' : refreshColor === 'orange' ? '🟠' : '🟢';
      
      console.log(`${i + 1}. ${colorEmoji} ${person.fullName} - ${person.jobTitle || 'N/A'}`);
      console.log(`   Company: ${person.company?.name || 'Unknown'}`);
      console.log(`   Risk: ${churn.churnRiskLevel || 'unknown'} (${churn.churnRiskScore || 'N/A'}/100)`);
      console.log(`   Frequency: ${churn.refreshFrequency || 'unknown'}`);
      console.log(`   Next Refresh: ${churn.nextRefreshDate ? new Date(churn.nextRefreshDate).toLocaleDateString() : 'N/A'}`);
      console.log(`   Last Refresh: ${churn.lastRefreshDate ? new Date(churn.lastRefreshDate).toLocaleDateString() : 'Never'}`);
      console.log('');
    });

    console.log(`\n💡 Next Steps:`);
    console.log(`   1. Refresh data for these ${people.length} people via Coresignal API`);
    console.log(`   2. Update their refresh dates using updateRefreshDate()`);
    console.log(`   3. Re-run churn prediction with fresh data`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { getPeopleNeedingRefresh, updateRefreshDate };

