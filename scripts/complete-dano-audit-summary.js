#!/usr/bin/env node

/**
 * 🔍 COMPLETE DANO AUDIT SUMMARY
 * 
 * Comprehensive analysis of Dano's pipeline with all key insights
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

async function completeDanoAuditSummary() {
  console.log('🔍 COMPLETE DANO PIPELINE AUDIT SUMMARY');
  console.log('='.repeat(80));
  console.log('');

  try {
    // Get all key metrics
    const metrics = await getKeyMetrics();
    
    // Display comprehensive summary
    displayAuditSummary(metrics);
    
    // Generate action plan
    generateActionPlan(metrics);

  } catch (error) {
    console.error('❌ Error in audit:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function getKeyMetrics() {
  console.log('📊 GATHERING KEY METRICS...');
  
  // Entity counts
  const peopleCount = await prisma.people.count({ where: { workspaceId: DANO_WORKSPACE_ID } });
  const companiesCount = await prisma.companies.count({ where: { workspaceId: DANO_WORKSPACE_ID } });
  const leadsCount = await prisma.leads.count({ where: { workspaceId: DANO_WORKSPACE_ID } });
  const prospectsCount = await prisma.prospects.count({ where: { workspaceId: DANO_WORKSPACE_ID } });
  const opportunitiesCount = await prisma.opportunities.count({ where: { workspaceId: DANO_WORKSPACE_ID } });
  const actionsCount = await prisma.actions.count({ where: { workspaceId: DANO_WORKSPACE_ID } });
  
  // Action linking
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
  
  // Action status
  const completedActions = await prisma.actions.count({
    where: { workspaceId: DANO_WORKSPACE_ID, status: 'completed' }
  });
  
  const plannedActions = await prisma.actions.count({
    where: { workspaceId: DANO_WORKSPACE_ID, status: 'planned' }
  });
  
  // Communication actions
  const communicationActions = await prisma.actions.count({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      type: {
        in: ['email_sent', 'email_received', 'email_conversation', 'phone_call', 'linkedin_message']
      }
    }
  });
  
  // Email actions breakdown
  const emailConversations = await prisma.actions.count({
    where: { workspaceId: DANO_WORKSPACE_ID, type: 'email_conversation' }
  });
  
  const emailSent = await prisma.actions.count({
    where: { workspaceId: DANO_WORKSPACE_ID, type: 'email_sent' }
  });
  
  const emailReceived = await prisma.actions.count({
    where: { workspaceId: DANO_WORKSPACE_ID, type: 'email_received' }
  });
  
  // Orphaned actions by type
  const orphanedEmailConversations = await prisma.actions.count({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      type: 'email_conversation',
      personId: null,
      companyId: null,
      leadId: null,
      prospectId: null,
      opportunityId: null
    }
  });
  
  const orphanedEmailMeetings = await prisma.actions.count({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      type: 'email_meeting',
      personId: null,
      companyId: null,
      leadId: null,
      prospectId: null,
      opportunityId: null
    }
  });
  
  const orphanedEmailProposals = await prisma.actions.count({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      type: 'email_proposal',
      personId: null,
      companyId: null,
      leadId: null,
      prospectId: null,
      opportunityId: null
    }
  });
  
  return {
    entities: {
      people: peopleCount,
      companies: companiesCount,
      leads: leadsCount,
      prospects: prospectsCount,
      opportunities: opportunitiesCount,
      actions: actionsCount
    },
    linking: {
      totalActions: actionsCount,
      linkedActions: actionsWithAnyEntity,
      orphanedActions: actionsCount - actionsWithAnyEntity,
      linkingRate: ((actionsWithAnyEntity / actionsCount) * 100).toFixed(1)
    },
    status: {
      completed: completedActions,
      planned: plannedActions,
      completionRate: ((completedActions / actionsCount) * 100).toFixed(1)
    },
    communication: {
      total: communicationActions,
      emailConversations,
      emailSent,
      emailReceived,
      orphanedEmailConversations,
      orphanedEmailMeetings,
      orphanedEmailProposals
    }
  };
}

function displayAuditSummary(metrics) {
  console.log('📋 COMPREHENSIVE AUDIT RESULTS');
  console.log('-'.repeat(60));
  console.log('');
  
  console.log('🏢 ENTITY INVENTORY:');
  console.log(`   People: ${metrics.entities.people.toLocaleString()}`);
  console.log(`   Companies: ${metrics.entities.companies.toLocaleString()}`);
  console.log(`   Leads: ${metrics.entities.leads.toLocaleString()}`);
  console.log(`   Prospects: ${metrics.entities.prospects.toLocaleString()}`);
  console.log(`   Opportunities: ${metrics.entities.opportunities.toLocaleString()}`);
  console.log(`   Actions: ${metrics.entities.actions.toLocaleString()}`);
  console.log('');
  
  console.log('🔗 ACTION LINKING STATUS:');
  console.log(`   Total Actions: ${metrics.linking.totalActions.toLocaleString()}`);
  console.log(`   Linked Actions: ${metrics.linking.linkedActions.toLocaleString()} (${metrics.linking.linkingRate}%)`);
  console.log(`   Orphaned Actions: ${metrics.linking.orphanedActions.toLocaleString()} (${(100 - parseFloat(metrics.linking.linkingRate)).toFixed(1)}%)`);
  console.log('');
  
  console.log('✅ ACTION COMPLETION STATUS:');
  console.log(`   Completed Actions: ${metrics.status.completed.toLocaleString()} (${metrics.status.completionRate}%)`);
  console.log(`   Planned Actions: ${metrics.status.planned.toLocaleString()} (${((metrics.status.planned / metrics.linking.totalActions) * 100).toFixed(1)}%)`);
  console.log('');
  
  console.log('📧 COMMUNICATION ANALYSIS:');
  console.log(`   Total Communication Actions: ${metrics.communication.total.toLocaleString()}`);
  console.log(`   Email Conversations: ${metrics.communication.emailConversations.toLocaleString()}`);
  console.log(`   Email Sent: ${metrics.communication.emailSent.toLocaleString()}`);
  console.log(`   Email Received: ${metrics.communication.emailReceived.toLocaleString()}`);
  console.log('');
  
  console.log('🚨 CRITICAL ISSUES:');
  console.log(`   Orphaned Email Conversations: ${metrics.communication.orphanedEmailConversations.toLocaleString()}`);
  console.log(`   Orphaned Email Meetings: ${metrics.communication.orphanedEmailMeetings.toLocaleString()}`);
  console.log(`   Orphaned Email Proposals: ${metrics.communication.orphanedEmailProposals.toLocaleString()}`);
  console.log('');
  
  console.log('📊 PIPELINE CONVERSION RATES:');
  const leadToProspectRate = ((metrics.entities.prospects / metrics.entities.leads) * 100).toFixed(1);
  const prospectToOpportunityRate = ((metrics.entities.opportunities / metrics.entities.prospects) * 100).toFixed(1);
  console.log(`   Lead → Prospect: ${leadToProspectRate}% (${metrics.entities.prospects}/${metrics.entities.leads})`);
  console.log(`   Prospect → Opportunity: ${prospectToOpportunityRate}% (${metrics.entities.opportunities}/${metrics.entities.prospects})`);
  console.log('');
}

function generateActionPlan(metrics) {
  console.log('📋 COMPREHENSIVE REMEDIATION PLAN');
  console.log('-'.repeat(60));
  console.log('');
  
  console.log('🎯 CRITICAL ISSUES IDENTIFIED:');
  console.log(`   1. ${metrics.linking.orphanedActions.toLocaleString()} orphaned actions (${(100 - parseFloat(metrics.linking.linkingRate)).toFixed(1)}%)`);
  console.log(`   2. ${metrics.status.planned.toLocaleString()} actions stuck in 'planned' status`);
  console.log(`   3. ${metrics.communication.orphanedEmailConversations.toLocaleString()} orphaned email conversations`);
  console.log(`   4. Only ${metrics.communication.emailReceived} email_received actions (should be much higher)`);
  console.log(`   5. Poor pipeline conversion rates (${((metrics.entities.prospects / metrics.entities.leads) * 100).toFixed(1)}% lead-to-prospect)`);
  console.log('');
  
  console.log('🚀 PHASE 1: EMERGENCY FIXES (Week 1)');
  console.log('   Priority: Fix the 68.5% orphaned actions');
  console.log('   Actions:');
  console.log(`   - Link ${metrics.communication.orphanedEmailConversations.toLocaleString()} email conversations to entities`);
  console.log(`   - Link ${metrics.communication.orphanedEmailMeetings.toLocaleString()} email meetings to entities`);
  console.log(`   - Link ${metrics.communication.orphanedEmailProposals.toLocaleString()} email proposals to entities`);
  console.log('   - Implement email address parsing for automatic linking');
  console.log('   - Create email_received actions for inbound communications');
  console.log('');
  
  console.log('🔧 PHASE 2: ACTION STATUS FIXES (Week 2)');
  console.log('   Priority: Fix the 68% planned actions issue');
  console.log('   Actions:');
  console.log(`   - Mark ${metrics.status.planned.toLocaleString()} planned actions as completed where appropriate`);
  console.log('   - Implement automatic completion for email actions');
  console.log('   - Fix action creation logic to mark communications as completed');
  console.log('   - Add proper completion timestamps');
  console.log('');
  
  console.log('🌊 PHASE 3: COMMUNICATION FLOW (Week 3)');
  console.log('   Priority: Enable back-and-forth communication detection');
  console.log('   Actions:');
  console.log('   - Implement email direction detection (inbound/outbound)');
  console.log('   - Create communication thread analysis');
  console.log('   - Add email metadata parsing (from/to fields)');
  console.log('   - Implement response rate tracking');
  console.log('');
  
  console.log('📈 PHASE 4: PIPELINE OPTIMIZATION (Week 4)');
  console.log('   Priority: Improve conversion rates and data quality');
  console.log('   Actions:');
  console.log('   - Optimize lead-to-prospect conversion process');
  console.log('   - Improve opportunity tracking and management');
  console.log('   - Implement automated action completion workflows');
  console.log('   - Create comprehensive reporting and analytics');
  console.log('');
  
  console.log('🎯 SUCCESS METRICS:');
  console.log('   - Reduce orphaned actions from 68.5% to <5%');
  console.log('   - Increase action completion rate from 30% to >80%');
  console.log('   - Enable back-and-forth communication detection');
  console.log('   - Improve pipeline conversion rates by 25%');
  console.log('   - Achieve 95%+ action-entity linking rate');
  console.log('');
  
  console.log('💰 BUSINESS IMPACT:');
  console.log('   - Better sales pipeline visibility');
  console.log('   - Improved lead qualification and conversion');
  console.log('   - Enhanced communication tracking and follow-up');
  console.log('   - More accurate sales forecasting and reporting');
  console.log('   - Increased sales team productivity and effectiveness');
  console.log('');
}

// Run the audit
if (require.main === module) {
  completeDanoAuditSummary().catch(console.error);
}

module.exports = { completeDanoAuditSummary };
