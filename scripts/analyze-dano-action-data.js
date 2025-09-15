#!/usr/bin/env node

/**
 * 🔍 COMPREHENSIVE DANO ACTION DATA ANALYSIS
 * 
 * This script analyzes Dano's action data to understand:
 * 1. Back-and-forth communication patterns (seller to buyer)
 * 2. Action type distribution and linking completeness
 * 3. Entity relationship robustness (person, company, prospect, lead)
 * 4. Communication flow analysis
 */

const { PrismaClient, Prisma } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

// Dano's workspace and user details
const DANO_WORKSPACE_ID = '01K1VBYV8ETM2RCQA4GNN9EG72';
const DANO_USER_ID = '01K1VBYYV7TRPY04NW4TW4XWRB';
const DANO_EMAIL = 'dano@retail-products.com';

async function analyzeDanoActionData() {
  console.log('🔍 COMPREHENSIVE DANO ACTION DATA ANALYSIS');
  console.log('='.repeat(60));
  console.log(`📋 Workspace ID: ${DANO_WORKSPACE_ID}`);
  console.log(`👤 User ID: ${DANO_USER_ID}`);
  console.log(`📧 Email: ${DANO_EMAIL}`);
  console.log('');

  try {
    // 1. OVERALL ACTION STATISTICS
    await analyzeOverallActionStats();
    
    // 2. ACTION TYPE DISTRIBUTION
    await analyzeActionTypeDistribution();
    
    // 3. ENTITY LINKING ANALYSIS
    await analyzeEntityLinking();
    
    // 4. BACK-AND-FORTH COMMUNICATION ANALYSIS
    await analyzeBackAndForthCommunication();
    
    // 5. EMAIL ACTION ANALYSIS
    await analyzeEmailActions();
    
    // 6. COMMUNICATION FLOW PATTERNS
    await analyzeCommunicationFlow();
    
    // 7. ORPHANED ACTIONS ANALYSIS
    await analyzeOrphanedActions();
    
    // 8. ACTION COMPLETENESS ANALYSIS
    await analyzeActionCompleteness();

  } catch (error) {
    console.error('❌ Error analyzing Dano action data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function analyzeOverallActionStats() {
  console.log('📊 OVERALL ACTION STATISTICS');
  console.log('-'.repeat(40));
  
  const totalActions = await prisma.actions.count({
    where: { workspaceId: DANO_WORKSPACE_ID }
  });
  
  const actionsByUser = await prisma.actions.count({
    where: { 
      workspaceId: DANO_WORKSPACE_ID,
      userId: DANO_USER_ID
    }
  });
  
  const actionsByAssignedUser = await prisma.actions.count({
    where: { 
      workspaceId: DANO_WORKSPACE_ID,
      assignedUserId: DANO_USER_ID
    }
  });
  
  const completedActions = await prisma.actions.count({
    where: { 
      workspaceId: DANO_WORKSPACE_ID,
      status: 'completed'
    }
  });
  
  const plannedActions = await prisma.actions.count({
    where: { 
      workspaceId: DANO_WORKSPACE_ID,
      status: 'planned'
    }
  });
  
  console.log(`   Total Actions: ${totalActions.toLocaleString()}`);
  console.log(`   Actions by Dano (userId): ${actionsByUser.toLocaleString()}`);
  console.log(`   Actions assigned to Dano: ${actionsByAssignedUser.toLocaleString()}`);
  console.log(`   Completed Actions: ${completedActions.toLocaleString()}`);
  console.log(`   Planned Actions: ${plannedActions.toLocaleString()}`);
  console.log(`   Completion Rate: ${((completedActions / totalActions) * 100).toFixed(1)}%`);
  console.log('');
}

async function analyzeActionTypeDistribution() {
  console.log('🎯 ACTION TYPE DISTRIBUTION');
  console.log('-'.repeat(40));
  
  const actionTypes = await prisma.actions.groupBy({
    by: ['type'],
    where: { workspaceId: DANO_WORKSPACE_ID },
    _count: { type: true },
    orderBy: { _count: { type: 'desc' } }
  });
  
  actionTypes.forEach(action => {
    console.log(`   ${action.type}: ${action._count.type.toLocaleString()}`);
  });
  console.log('');
}

async function analyzeEntityLinking() {
  console.log('🔗 ENTITY LINKING ANALYSIS');
  console.log('-'.repeat(40));
  
  const totalActions = await prisma.actions.count({
    where: { workspaceId: DANO_WORKSPACE_ID }
  });
  
  const actionsWithPerson = await prisma.actions.count({
    where: { 
      workspaceId: DANO_WORKSPACE_ID,
      personId: { not: null }
    }
  });
  
  const actionsWithCompany = await prisma.actions.count({
    where: { 
      workspaceId: DANO_WORKSPACE_ID,
      companyId: { not: null }
    }
  });
  
  const actionsWithLead = await prisma.actions.count({
    where: { 
      workspaceId: DANO_WORKSPACE_ID,
      leadId: { not: null }
    }
  });
  
  const actionsWithProspect = await prisma.actions.count({
    where: { 
      workspaceId: DANO_WORKSPACE_ID,
      prospectId: { not: null }
    }
  });
  
  const actionsWithOpportunity = await prisma.actions.count({
    where: { 
      workspaceId: DANO_WORKSPACE_ID,
      opportunityId: { not: null }
    }
  });
  
  const actionsWithAnyEntity = await prisma.actions.count({
    where: { 
      workspaceId: DANO_WORKSPACE_ID,
      OR: [
        { personId: { not: null } },
        { companyId: { not: null } },
        { leadId: { not: null } },
        { prospectId: { not: null } },
        { opportunityId: { not: null } }
      ]
    }
  });
  
  const orphanedActions = totalActions - actionsWithAnyEntity;
  
  console.log(`   Total Actions: ${totalActions.toLocaleString()}`);
  console.log(`   Actions with Person: ${actionsWithPerson.toLocaleString()} (${((actionsWithPerson / totalActions) * 100).toFixed(1)}%)`);
  console.log(`   Actions with Company: ${actionsWithCompany.toLocaleString()} (${((actionsWithCompany / totalActions) * 100).toFixed(1)}%)`);
  console.log(`   Actions with Lead: ${actionsWithLead.toLocaleString()} (${((actionsWithLead / totalActions) * 100).toFixed(1)}%)`);
  console.log(`   Actions with Prospect: ${actionsWithProspect.toLocaleString()} (${((actionsWithProspect / totalActions) * 100).toFixed(1)}%)`);
  console.log(`   Actions with Opportunity: ${actionsWithOpportunity.toLocaleString()} (${((actionsWithOpportunity / totalActions) * 100).toFixed(1)}%)`);
  console.log(`   Actions with Any Entity: ${actionsWithAnyEntity.toLocaleString()} (${((actionsWithAnyEntity / totalActions) * 100).toFixed(1)}%)`);
  console.log(`   Orphaned Actions: ${orphanedActions.toLocaleString()} (${((orphanedActions / totalActions) * 100).toFixed(1)}%)`);
  console.log('');
}

async function analyzeBackAndForthCommunication() {
  console.log('🔄 BACK-AND-FORTH COMMUNICATION ANALYSIS');
  console.log('-'.repeat(40));
  
  // Find actions that represent communication
  const communicationActions = await prisma.actions.findMany({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      type: {
        in: ['email_sent', 'email_received', 'email_conversation', 'phone_call', 'linkedin_message', 'linkedin_connection']
      }
    },
    select: {
      id: true,
      type: true,
      subject: true,
      personId: true,
      companyId: true,
      leadId: true,
      prospectId: true,
      createdAt: true,
      metadata: true
    },
    orderBy: { createdAt: 'asc' }
  });
  
  console.log(`   Total Communication Actions: ${communicationActions.length.toLocaleString()}`);
  
  // Group by entity to find back-and-forth patterns
  const entityCommunications = {};
  
  communicationActions.forEach(action => {
    const entityKey = action.personId || action.companyId || action.leadId || action.prospectId || 'orphaned';
    
    if (!entityCommunications[entityKey]) {
      entityCommunications[entityKey] = {
        actions: [],
        outbound: 0,
        inbound: 0,
        types: new Set()
      };
    }
    
    entityCommunications[entityKey].actions.push(action);
    entityCommunications[entityKey].types.add(action.type);
    
    // Determine direction based on type and metadata
    if (action.type === 'email_sent' || action.type === 'linkedin_message') {
      entityCommunications[entityKey].outbound++;
    } else if (action.type === 'email_received') {
      entityCommunications[entityKey].inbound++;
    } else if (action.type === 'email_conversation') {
      // Check metadata for direction
      const metadata = action.metadata || {};
      if (metadata.direction === 'outbound') {
        entityCommunications[entityKey].outbound++;
      } else if (metadata.direction === 'inbound') {
        entityCommunications[entityKey].inbound++;
      }
    }
  });
  
  // Analyze back-and-forth patterns
  let entitiesWithBackAndForth = 0;
  let entitiesWithOnlyOutbound = 0;
  let entitiesWithOnlyInbound = 0;
  let entitiesWithMultipleExchanges = 0;
  
  Object.values(entityCommunications).forEach(comm => {
    if (comm.outbound > 0 && comm.inbound > 0) {
      entitiesWithBackAndForth++;
      if (comm.outbound > 1 && comm.inbound > 1) {
        entitiesWithMultipleExchanges++;
      }
    } else if (comm.outbound > 0 && comm.inbound === 0) {
      entitiesWithOnlyOutbound++;
    } else if (comm.outbound === 0 && comm.inbound > 0) {
      entitiesWithOnlyInbound++;
    }
  });
  
  const totalEntities = Object.keys(entityCommunications).length;
  
  console.log(`   Entities with Communication: ${totalEntities.toLocaleString()}`);
  console.log(`   Entities with Back-and-Forth: ${entitiesWithBackAndForth.toLocaleString()} (${((entitiesWithBackAndForth / totalEntities) * 100).toFixed(1)}%)`);
  console.log(`   Entities with Multiple Exchanges: ${entitiesWithMultipleExchanges.toLocaleString()} (${((entitiesWithMultipleExchanges / totalEntities) * 100).toFixed(1)}%)`);
  console.log(`   Entities with Only Outbound: ${entitiesWithOnlyOutbound.toLocaleString()} (${((entitiesWithOnlyOutbound / totalEntities) * 100).toFixed(1)}%)`);
  console.log(`   Entities with Only Inbound: ${entitiesWithOnlyInbound.toLocaleString()} (${((entitiesWithOnlyInbound / totalEntities) * 100).toFixed(1)}%)`);
  console.log('');
}

async function analyzeEmailActions() {
  console.log('📧 EMAIL ACTION ANALYSIS');
  console.log('-'.repeat(40));
  
  const emailActions = await prisma.actions.findMany({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      type: {
        in: ['email_sent', 'email_received', 'email_conversation']
      }
    },
    select: {
      id: true,
      type: true,
      subject: true,
      metadata: true,
      personId: true,
      companyId: true,
      createdAt: true
    }
  });
  
  console.log(`   Total Email Actions: ${emailActions.length.toLocaleString()}`);
  
  const emailTypes = emailActions.reduce((acc, action) => {
    acc[action.type] = (acc[action.type] || 0) + 1;
    return acc;
  }, {});
  
  Object.entries(emailTypes).forEach(([type, count]) => {
    console.log(`   ${type}: ${count.toLocaleString()}`);
  });
  
  // Analyze email direction
  let outboundEmails = 0;
  let inboundEmails = 0;
  let conversationEmails = 0;
  
  emailActions.forEach(action => {
    if (action.type === 'email_sent') {
      outboundEmails++;
    } else if (action.type === 'email_received') {
      inboundEmails++;
    } else if (action.type === 'email_conversation') {
      conversationEmails++;
      const metadata = action.metadata || {};
      if (metadata.direction === 'outbound') {
        outboundEmails++;
      } else if (metadata.direction === 'inbound') {
        inboundEmails++;
      }
    }
  });
  
  console.log(`   Outbound Emails: ${outboundEmails.toLocaleString()}`);
  console.log(`   Inbound Emails: ${inboundEmails.toLocaleString()}`);
  console.log(`   Email Conversations: ${conversationEmails.toLocaleString()}`);
  console.log(`   Response Rate: ${inboundEmails > 0 ? ((inboundEmails / outboundEmails) * 100).toFixed(1) : 0}%`);
  console.log('');
}

async function analyzeCommunicationFlow() {
  console.log('🌊 COMMUNICATION FLOW PATTERNS');
  console.log('-'.repeat(40));
  
  // Get recent communication actions (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentActions = await prisma.actions.findMany({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      createdAt: { gte: thirtyDaysAgo },
      type: {
        in: ['email_sent', 'email_received', 'email_conversation', 'phone_call', 'linkedin_message']
      }
    },
    select: {
      id: true,
      type: true,
      subject: true,
      personId: true,
      companyId: true,
      createdAt: true,
      metadata: true
    },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
  
  console.log(`   Recent Communication Actions (30 days): ${recentActions.length.toLocaleString()}`);
  
  // Analyze communication velocity
  const actionsByDay = {};
  recentActions.forEach(action => {
    const day = action.createdAt.toISOString().split('T')[0];
    actionsByDay[day] = (actionsByDay[day] || 0) + 1;
  });
  
  const daysWithActivity = Object.keys(actionsByDay).length;
  const avgActionsPerDay = recentActions.length / 30;
  const maxActionsInDay = Math.max(...Object.values(actionsByDay));
  
  console.log(`   Days with Activity: ${daysWithActivity}`);
  console.log(`   Average Actions per Day: ${avgActionsPerDay.toFixed(1)}`);
  console.log(`   Max Actions in Single Day: ${maxActionsInDay}`);
  console.log('');
}

async function analyzeOrphanedActions() {
  console.log('🔍 ORPHANED ACTIONS ANALYSIS');
  console.log('-'.repeat(40));
  
  const orphanedActions = await prisma.actions.findMany({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      personId: null,
      companyId: null,
      leadId: null,
      prospectId: null,
      opportunityId: null
    },
    select: {
      id: true,
      type: true,
      subject: true,
      createdAt: true,
      metadata: true
    },
    take: 20
  });
  
  console.log(`   Sample Orphaned Actions (showing first 20):`);
  orphanedActions.forEach((action, index) => {
    console.log(`   ${index + 1}. [${action.type}] ${action.subject} (${action.createdAt.toISOString().split('T')[0]})`);
  });
  
  if (orphanedActions.length === 0) {
    console.log('   ✅ No orphaned actions found!');
  }
  console.log('');
}

async function analyzeActionCompleteness() {
  console.log('✅ ACTION COMPLETENESS ANALYSIS');
  console.log('-'.repeat(40));
  
  const totalActions = await prisma.actions.count({
    where: { workspaceId: DANO_WORKSPACE_ID }
  });
  
  const actionsWithSubject = await prisma.actions.count({
    where: { 
      workspaceId: DANO_WORKSPACE_ID,
      subject: { not: '' }
    }
  });
  
  const actionsWithDescription = await prisma.actions.count({
    where: { 
      workspaceId: DANO_WORKSPACE_ID,
      description: { not: '' }
    }
  });
  
  const actionsWithOutcome = await prisma.actions.count({
    where: { 
      workspaceId: DANO_WORKSPACE_ID,
      outcome: { not: '' }
    }
  });
  
  const actionsWithMetadata = await prisma.actions.count({
    where: { 
      workspaceId: DANO_WORKSPACE_ID,
      metadata: { not: Prisma.JsonNull }
    }
  });
  
  console.log(`   Total Actions: ${totalActions.toLocaleString()}`);
  console.log(`   Actions with Subject: ${actionsWithSubject.toLocaleString()} (${((actionsWithSubject / totalActions) * 100).toFixed(1)}%)`);
  console.log(`   Actions with Description: ${actionsWithDescription.toLocaleString()} (${((actionsWithDescription / totalActions) * 100).toFixed(1)}%)`);
  console.log(`   Actions with Outcome: ${actionsWithOutcome.toLocaleString()} (${((actionsWithOutcome / totalActions) * 100).toFixed(1)}%)`);
  console.log(`   Actions with Metadata: ${actionsWithMetadata.toLocaleString()} (${((actionsWithMetadata / totalActions) * 100).toFixed(1)}%)`);
  console.log('');
}

// Run the analysis
if (require.main === module) {
  analyzeDanoActionData().catch(console.error);
}

module.exports = { analyzeDanoActionData };
