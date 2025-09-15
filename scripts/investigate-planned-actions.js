#!/usr/bin/env node

/**
 * 🔍 INVESTIGATE PLANNED ACTIONS ISSUE
 * 
 * Why are 70% of Dano's actions showing as "planned"?
 * This script investigates the status distribution and causes.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

const DANO_WORKSPACE_ID = '01K1VBYV8ETM2RCQA4GNN9EG72';

async function investigatePlannedActions() {
  console.log('🔍 INVESTIGATING PLANNED ACTIONS ISSUE');
  console.log('='.repeat(50));
  console.log('');

  try {
    // 1. STATUS DISTRIBUTION
    await analyzeStatusDistribution();
    
    // 2. PLANNED ACTIONS BY TYPE
    await analyzePlannedActionsByType();
    
    // 3. COMPLETED ACTIONS BY TYPE
    await analyzeCompletedActionsByType();
    
    // 4. SAMPLE PLANNED ACTIONS
    await showSamplePlannedActions();
    
    // 5. SAMPLE COMPLETED ACTIONS
    await showSampleCompletedActions();
    
    // 6. TIMING ANALYSIS
    await analyzeActionTiming();

  } catch (error) {
    console.error('❌ Error investigating planned actions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function analyzeStatusDistribution() {
  console.log('📊 STATUS DISTRIBUTION ANALYSIS');
  console.log('-'.repeat(40));
  
  const statusCounts = await prisma.actions.groupBy({
    by: ['status'],
    where: { workspaceId: DANO_WORKSPACE_ID },
    _count: { status: true },
    orderBy: { _count: { status: 'desc' } }
  });
  
  const total = statusCounts.reduce((sum, item) => sum + item._count.status, 0);
  
  statusCounts.forEach(status => {
    const percentage = ((status._count.status / total) * 100).toFixed(1);
    console.log(`   ${status.status}: ${status._count.status.toLocaleString()} (${percentage}%)`);
  });
  console.log('');
}

async function analyzePlannedActionsByType() {
  console.log('📋 PLANNED ACTIONS BY TYPE');
  console.log('-'.repeat(40));
  
  const plannedByType = await prisma.actions.groupBy({
    by: ['type'],
    where: { 
      workspaceId: DANO_WORKSPACE_ID,
      status: 'planned'
    },
    _count: { type: true },
    orderBy: { _count: { type: 'desc' } }
  });
  
  console.log(`   Top Planned Action Types:`);
  plannedByType.slice(0, 15).forEach(action => {
    console.log(`   ${action.type}: ${action._count.type.toLocaleString()}`);
  });
  console.log('');
}

async function analyzeCompletedActionsByType() {
  console.log('✅ COMPLETED ACTIONS BY TYPE');
  console.log('-'.repeat(40));
  
  const completedByType = await prisma.actions.groupBy({
    by: ['type'],
    where: { 
      workspaceId: DANO_WORKSPACE_ID,
      status: 'completed'
    },
    _count: { type: true },
    orderBy: { _count: { type: 'desc' } }
  });
  
  console.log(`   Top Completed Action Types:`);
  completedByType.slice(0, 15).forEach(action => {
    console.log(`   ${action.type}: ${action._count.type.toLocaleString()}`);
  });
  console.log('');
}

async function showSamplePlannedActions() {
  console.log('📋 SAMPLE PLANNED ACTIONS');
  console.log('-'.repeat(40));
  
  const samplePlanned = await prisma.actions.findMany({
    where: { 
      workspaceId: DANO_WORKSPACE_ID,
      status: 'planned'
    },
    select: {
      id: true,
      type: true,
      subject: true,
      scheduledAt: true,
      scheduledDate: true,
      createdAt: true,
      personId: true,
      companyId: true
    },
    take: 10,
    orderBy: { createdAt: 'desc' }
  });
  
  console.log(`   Sample Planned Actions:`);
  samplePlanned.forEach((action, index) => {
    console.log(`   ${index + 1}. [${action.type}] ${action.subject}`);
    console.log(`      Created: ${action.createdAt.toISOString().split('T')[0]}`);
    console.log(`      Scheduled At: ${action.scheduledAt ? action.scheduledAt.toISOString().split('T')[0] : 'none'}`);
    console.log(`      Scheduled Date: ${action.scheduledDate ? action.scheduledDate.toISOString().split('T')[0] : 'none'}`);
    console.log(`      Person: ${action.personId || 'none'}`);
    console.log(`      Company: ${action.companyId || 'none'}`);
    console.log('');
  });
}

async function showSampleCompletedActions() {
  console.log('✅ SAMPLE COMPLETED ACTIONS');
  console.log('-'.repeat(40));
  
  const sampleCompleted = await prisma.actions.findMany({
    where: { 
      workspaceId: DANO_WORKSPACE_ID,
      status: 'completed'
    },
    select: {
      id: true,
      type: true,
      subject: true,
      completedAt: true,
      createdAt: true,
      personId: true,
      companyId: true
    },
    take: 10,
    orderBy: { completedAt: 'desc' }
  });
  
  console.log(`   Sample Completed Actions:`);
  sampleCompleted.forEach((action, index) => {
    console.log(`   ${index + 1}. [${action.type}] ${action.subject}`);
    console.log(`      Created: ${action.createdAt.toISOString().split('T')[0]}`);
    console.log(`      Completed: ${action.completedAt ? action.completedAt.toISOString().split('T')[0] : 'none'}`);
    console.log(`      Person: ${action.personId || 'none'}`);
    console.log(`      Company: ${action.companyId || 'none'}`);
    console.log('');
  });
}

async function analyzeActionTiming() {
  console.log('⏰ ACTION TIMING ANALYSIS');
  console.log('-'.repeat(40));
  
  // Check for actions with scheduled dates in the past that are still planned
  const pastScheduledPlanned = await prisma.actions.count({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      status: 'planned',
      scheduledDate: {
        lt: new Date()
      }
    }
  });
  
  // Check for actions with scheduled dates in the future
  const futureScheduledPlanned = await prisma.actions.count({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      status: 'planned',
      scheduledDate: {
        gte: new Date()
      }
    }
  });
  
  // Check for planned actions without scheduled dates
  const plannedWithoutSchedule = await prisma.actions.count({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      status: 'planned',
      scheduledDate: null,
      scheduledAt: null
    }
  });
  
  console.log(`   Planned Actions with Past Scheduled Dates: ${pastScheduledPlanned.toLocaleString()}`);
  console.log(`   Planned Actions with Future Scheduled Dates: ${futureScheduledPlanned.toLocaleString()}`);
  console.log(`   Planned Actions without Scheduled Dates: ${plannedWithoutSchedule.toLocaleString()}`);
  console.log('');
  
  // Check completion patterns by type
  const completionRates = await prisma.actions.groupBy({
    by: ['type'],
    where: { workspaceId: DANO_WORKSPACE_ID },
    _count: { type: true }
  });
  
  console.log(`   Completion Rates by Action Type:`);
  for (const actionType of completionRates.slice(0, 10)) {
    const total = actionType._count.type;
    const completed = await prisma.actions.count({
      where: {
        workspaceId: DANO_WORKSPACE_ID,
        type: actionType.type,
        status: 'completed'
      }
    });
    const completionRate = ((completed / total) * 100).toFixed(1);
    
    console.log(`   ${actionType.type}: ${completed}/${total} (${completionRate}%)`);
  }
  console.log('');
}

// Run the investigation
if (require.main === module) {
  investigatePlannedActions().catch(console.error);
}

module.exports = { investigatePlannedActions };
