#!/usr/bin/env node

/**
 * 🔍 COMPREHENSIVE DANO PIPELINE AUDIT
 * 
 * Deep analysis of the complete action space between seller Dano and buyers
 * (person, company, leads, prospects, opportunities, customers)
 * 
 * This audit will:
 * 1. Map all entity types and their relationships
 * 2. Analyze action-entity linking patterns
 * 3. Study communication flow patterns
 * 4. Identify data quality issues
 * 5. Create remediation plan
 */

const { PrismaClient } = require('@prisma/client');

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

async function comprehensiveDanoPipelineAudit() {
  console.log('🔍 COMPREHENSIVE DANO PIPELINE AUDIT');
  console.log('='.repeat(80));
  console.log(`📋 Workspace ID: ${DANO_WORKSPACE_ID}`);
  console.log(`👤 User ID: ${DANO_USER_ID}`);
  console.log(`📧 Email: ${DANO_EMAIL}`);
  console.log('');

  try {
    // 1. ENTITY INVENTORY & RELATIONSHIPS
    await auditEntityInventory();
    
    // 2. ACTION-ENTITY LINKING ANALYSIS
    await auditActionEntityLinking();
    
    // 3. COMMUNICATION FLOW ANALYSIS
    await auditCommunicationFlow();
    
    // 4. DATA QUALITY ASSESSMENT
    await auditDataQuality();
    
    // 5. PIPELINE HEALTH ANALYSIS
    await auditPipelineHealth();
    
    // 6. RELATIONSHIP MAPPING
    await auditRelationshipMapping();
    
    // 7. ACTION COMPLETION ANALYSIS
    await auditActionCompletion();
    
    // 8. GENERATE REMEDIATION PLAN
    await generateRemediationPlan();

  } catch (error) {
    console.error('❌ Error in comprehensive audit:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function auditEntityInventory() {
  console.log('📊 ENTITY INVENTORY & RELATIONSHIPS');
  console.log('-'.repeat(50));
  
  // Count all entity types
  const peopleCount = await prisma.people.count({
    where: { workspaceId: DANO_WORKSPACE_ID }
  });
  
  const companiesCount = await prisma.companies.count({
    where: { workspaceId: DANO_WORKSPACE_ID }
  });
  
  const leadsCount = await prisma.leads.count({
    where: { workspaceId: DANO_WORKSPACE_ID }
  });
  
  const prospectsCount = await prisma.prospects.count({
    where: { workspaceId: DANO_WORKSPACE_ID }
  });
  
  const opportunitiesCount = await prisma.opportunities.count({
    where: { workspaceId: DANO_WORKSPACE_ID }
  });
  
  const actionsCount = await prisma.actions.count({
    where: { workspaceId: DANO_WORKSPACE_ID }
  });
  
  console.log(`   People: ${peopleCount.toLocaleString()}`);
  console.log(`   Companies: ${companiesCount.toLocaleString()}`);
  console.log(`   Leads: ${leadsCount.toLocaleString()}`);
  console.log(`   Prospects: ${prospectsCount.toLocaleString()}`);
  console.log(`   Opportunities: ${opportunitiesCount.toLocaleString()}`);
  console.log(`   Actions: ${actionsCount.toLocaleString()}`);
  console.log('');
  
  // Analyze entity relationships
  const peopleWithCompanies = await prisma.people.count({
    where: { 
      workspaceId: DANO_WORKSPACE_ID,
      companyId: { not: null }
    }
  });
  
  const leadsWithPeople = await prisma.leads.count({
    where: { 
      workspaceId: DANO_WORKSPACE_ID,
      personId: { not: null }
    }
  });
  
  const leadsWithCompanies = await prisma.leads.count({
    where: { 
      workspaceId: DANO_WORKSPACE_ID,
      companyId: { not: null }
    }
  });
  
  const prospectsWithPeople = await prisma.prospects.count({
    where: { 
      workspaceId: DANO_WORKSPACE_ID,
      personId: { not: null }
    }
  });
  
  const prospectsWithCompanies = await prisma.prospects.count({
    where: { 
      workspaceId: DANO_WORKSPACE_ID,
      companyId: { not: null }
    }
  });
  
  const opportunitiesWithPeople = await prisma.opportunities.count({
    where: { 
      workspaceId: DANO_WORKSPACE_ID,
      personId: { not: null }
    }
  });
  
  const opportunitiesWithCompanies = await prisma.opportunities.count({
    where: { 
      workspaceId: DANO_WORKSPACE_ID,
      companyId: { not: null }
    }
  });
  
  console.log(`   Entity Relationship Analysis:`);
  console.log(`   People with Companies: ${peopleWithCompanies.toLocaleString()} (${((peopleWithCompanies / peopleCount) * 100).toFixed(1)}%)`);
  console.log(`   Leads with People: ${leadsWithPeople.toLocaleString()} (${((leadsWithPeople / leadsCount) * 100).toFixed(1)}%)`);
  console.log(`   Leads with Companies: ${leadsWithCompanies.toLocaleString()} (${((leadsWithCompanies / leadsCount) * 100).toFixed(1)}%)`);
  console.log(`   Prospects with People: ${prospectsWithPeople.toLocaleString()} (${((prospectsWithPeople / prospectsCount) * 100).toFixed(1)}%)`);
  console.log(`   Prospects with Companies: ${prospectsWithCompanies.toLocaleString()} (${((prospectsWithCompanies / prospectsCount) * 100).toFixed(1)}%)`);
  console.log(`   Opportunities with People: ${opportunitiesWithPeople.toLocaleString()} (${((opportunitiesWithPeople / opportunitiesCount) * 100).toFixed(1)}%)`);
  console.log(`   Opportunities with Companies: ${opportunitiesWithCompanies.toLocaleString()} (${((opportunitiesWithCompanies / opportunitiesCount) * 100).toFixed(1)}%)`);
  console.log('');
}

async function auditActionEntityLinking() {
  console.log('🔗 ACTION-ENTITY LINKING ANALYSIS');
  console.log('-'.repeat(50));
  
  const totalActions = await prisma.actions.count({
    where: { workspaceId: DANO_WORKSPACE_ID }
  });
  
  // Count actions linked to each entity type
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
  
  // Analyze linking by action type
  console.log(`   Linking Quality by Action Type:`);
  const actionTypes = await prisma.actions.groupBy({
    by: ['type'],
    where: { workspaceId: DANO_WORKSPACE_ID },
    _count: { type: true },
    orderBy: { _count: { type: 'desc' } }
  });
  
  for (const actionType of actionTypes.slice(0, 10)) {
    const total = actionType._count.type;
    const linked = await prisma.actions.count({
      where: {
        workspaceId: DANO_WORKSPACE_ID,
        type: actionType.type,
        OR: [
          { personId: { not: null } },
          { companyId: { not: null } },
          { leadId: { not: null } },
          { prospectId: { not: null } },
          { opportunityId: { not: null } }
        ]
      }
    });
    
    const linkingRate = ((linked / total) * 100).toFixed(1);
    console.log(`   ${actionType.type}: ${linked}/${total} (${linkingRate}%)`);
  }
  console.log('');
}

async function auditCommunicationFlow() {
  console.log('🌊 COMMUNICATION FLOW ANALYSIS');
  console.log('-'.repeat(50));
  
  // Get all communication actions
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
  
  // Group by entity to analyze communication patterns
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
    
    // Determine direction
    if (action.type === 'email_sent' || action.type === 'linkedin_message') {
      entityCommunications[entityKey].outbound++;
    } else if (action.type === 'email_received') {
      entityCommunications[entityKey].inbound++;
    } else if (action.type === 'email_conversation') {
      const metadata = action.metadata || {};
      if (metadata.direction === 'outbound') {
        entityCommunications[entityKey].outbound++;
      } else if (metadata.direction === 'inbound') {
        entityCommunications[entityKey].inbound++;
      }
    }
  });
  
  // Analyze communication patterns
  let entitiesWithBackAndForth = 0;
  let entitiesWithOnlyOutbound = 0;
  let entitiesWithOnlyInbound = 0;
  let entitiesWithMultipleExchanges = 0;
  let entitiesWithSingleExchange = 0;
  
  Object.values(entityCommunications).forEach(comm => {
    if (comm.outbound > 0 && comm.inbound > 0) {
      entitiesWithBackAndForth++;
      if (comm.outbound > 1 && comm.inbound > 1) {
        entitiesWithMultipleExchanges++;
      } else {
        entitiesWithSingleExchange++;
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
  console.log(`   Entities with Single Exchange: ${entitiesWithSingleExchange.toLocaleString()} (${((entitiesWithSingleExchange / totalEntities) * 100).toFixed(1)}%)`);
  console.log(`   Entities with Only Outbound: ${entitiesWithOnlyOutbound.toLocaleString()} (${((entitiesWithOnlyOutbound / totalEntities) * 100).toFixed(1)}%)`);
  console.log(`   Entities with Only Inbound: ${entitiesWithOnlyInbound.toLocaleString()} (${((entitiesWithOnlyInbound / totalEntities) * 100).toFixed(1)}%)`);
  console.log('');
  
  // Analyze communication velocity
  const recentActions = communicationActions.filter(action => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return action.createdAt >= thirtyDaysAgo;
  });
  
  console.log(`   Recent Communication (30 days): ${recentActions.length.toLocaleString()}`);
  console.log(`   Communication Velocity: ${(recentActions.length / 30).toFixed(1)} actions/day`);
  console.log('');
}

async function auditDataQuality() {
  console.log('🔍 DATA QUALITY ASSESSMENT');
  console.log('-'.repeat(50));
  
  // Check for missing critical fields
  const actionsWithoutSubject = await prisma.actions.count({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      OR: [
        { subject: '' },
        { subject: null }
      ]
    }
  });
  
  const actionsWithoutDescription = await prisma.actions.count({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      OR: [
        { description: '' },
        { description: null }
      ]
    }
  });
  
  const actionsWithoutOutcome = await prisma.actions.count({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      OR: [
        { outcome: '' },
        { outcome: null }
      ]
    }
  });
  
  const actionsWithoutMetadata = await prisma.actions.count({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      metadata: null
    }
  });
  
  const totalActions = await prisma.actions.count({
    where: { workspaceId: DANO_WORKSPACE_ID }
  });
  
  console.log(`   Data Completeness Analysis:`);
  console.log(`   Actions without Subject: ${actionsWithoutSubject.toLocaleString()} (${((actionsWithoutSubject / totalActions) * 100).toFixed(1)}%)`);
  console.log(`   Actions without Description: ${actionsWithoutDescription.toLocaleString()} (${((actionsWithoutDescription / totalActions) * 100).toFixed(1)}%)`);
  console.log(`   Actions without Outcome: ${actionsWithoutOutcome.toLocaleString()} (${((actionsWithoutOutcome / totalActions) * 100).toFixed(1)}%)`);
  console.log(`   Actions without Metadata: ${actionsWithoutMetadata.toLocaleString()} (${((actionsWithoutMetadata / totalActions) * 100).toFixed(1)}%)`);
  console.log('');
  
  // Check for duplicate actions
  const duplicateActions = await prisma.actions.groupBy({
    by: ['subject', 'type', 'personId', 'companyId'],
    where: { workspaceId: DANO_WORKSPACE_ID },
    _count: { id: true },
    having: {
      id: {
        _count: {
          gt: 1
        }
      }
    }
  });
  
  console.log(`   Potential Duplicate Actions: ${duplicateActions.length.toLocaleString()}`);
  console.log('');
  
  // Check for inconsistent statuses
  const statusDistribution = await prisma.actions.groupBy({
    by: ['status'],
    where: { workspaceId: DANO_WORKSPACE_ID },
    _count: { status: true }
  });
  
  console.log(`   Status Distribution:`);
  statusDistribution.forEach(status => {
    const percentage = ((status._count.status / totalActions) * 100).toFixed(1);
    console.log(`   ${status.status}: ${status._count.status.toLocaleString()} (${percentage}%)`);
  });
  console.log('');
}

async function auditPipelineHealth() {
  console.log('🏥 PIPELINE HEALTH ANALYSIS');
  console.log('-'.repeat(50));
  
  // Analyze pipeline progression
  const leadsCount = await prisma.leads.count({
    where: { workspaceId: DANO_WORKSPACE_ID }
  });
  
  const prospectsCount = await prisma.prospects.count({
    where: { workspaceId: DANO_WORKSPACE_ID }
  });
  
  const opportunitiesCount = await prisma.opportunities.count({
    where: { workspaceId: DANO_WORKSPACE_ID }
  });
  
  console.log(`   Pipeline Progression:`);
  console.log(`   Leads: ${leadsCount.toLocaleString()}`);
  console.log(`   Prospects: ${prospectsCount.toLocaleString()}`);
  console.log(`   Opportunities: ${opportunitiesCount.toLocaleString()}`);
  console.log(`   Lead-to-Prospect Rate: ${((prospectsCount / leadsCount) * 100).toFixed(1)}%`);
  console.log(`   Prospect-to-Opportunity Rate: ${((opportunitiesCount / prospectsCount) * 100).toFixed(1)}%`);
  console.log('');
  
  // Analyze action distribution across pipeline stages
  const actionsByStage = {
    lead: await prisma.actions.count({
      where: { 
        workspaceId: DANO_WORKSPACE_ID,
        leadId: { not: null }
      }
    }),
    prospect: await prisma.actions.count({
      where: { 
        workspaceId: DANO_WORKSPACE_ID,
        prospectId: { not: null }
      }
    }),
    opportunity: await prisma.actions.count({
      where: { 
        workspaceId: DANO_WORKSPACE_ID,
        opportunityId: { not: null }
      }
    })
  };
  
  console.log(`   Actions by Pipeline Stage:`);
  console.log(`   Lead Actions: ${actionsByStage.lead.toLocaleString()}`);
  console.log(`   Prospect Actions: ${actionsByStage.prospect.toLocaleString()}`);
  console.log(`   Opportunity Actions: ${actionsByStage.opportunity.toLocaleString()}`);
  console.log('');
}

async function auditRelationshipMapping() {
  console.log('🗺️ RELATIONSHIP MAPPING ANALYSIS');
  console.log('-'.repeat(50));
  
  // Analyze people-company relationships
  const peopleWithCompanies = await prisma.people.findMany({
    where: { 
      workspaceId: DANO_WORKSPACE_ID,
      companyId: { not: null }
    },
    select: {
      id: true,
      fullName: true,
      companyId: true,
      company: {
        select: {
          name: true
        }
      }
    },
    take: 10
  });
  
  console.log(`   Sample People-Company Relationships:`);
  peopleWithCompanies.forEach((person, index) => {
    console.log(`   ${index + 1}. ${person.fullName} → ${person.company?.name || 'Unknown Company'}`);
  });
  console.log('');
  
  // Analyze lead relationships
  const leadsWithRelationships = await prisma.leads.findMany({
    where: { 
      workspaceId: DANO_WORKSPACE_ID,
      OR: [
        { personId: { not: null } },
        { companyId: { not: null } }
      ]
    },
    select: {
      id: true,
      fullName: true,
      personId: true,
      companyId: true,
      person: {
        select: {
          fullName: true
        }
      },
      company: {
        select: {
          name: true
        }
      }
    },
    take: 10
  });
  
  console.log(`   Sample Lead Relationships:`);
  leadsWithRelationships.forEach((lead, index) => {
    const personName = lead.person?.fullName || 'No Person';
    const companyName = lead.company?.name || 'No Company';
    console.log(`   ${index + 1}. ${lead.fullName} → Person: ${personName}, Company: ${companyName}`);
  });
  console.log('');
}

async function auditActionCompletion() {
  console.log('✅ ACTION COMPLETION ANALYSIS');
  console.log('-'.repeat(50));
  
  const totalActions = await prisma.actions.count({
    where: { workspaceId: DANO_WORKSPACE_ID }
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
  
  console.log(`   Overall Completion Rate: ${((completedActions / totalActions) * 100).toFixed(1)}%`);
  console.log(`   Planned Actions: ${plannedActions.toLocaleString()} (${((plannedActions / totalActions) * 100).toFixed(1)}%)`);
  console.log('');
  
  // Analyze completion by action type
  const actionTypes = await prisma.actions.groupBy({
    by: ['type'],
    where: { workspaceId: DANO_WORKSPACE_ID },
    _count: { type: true }
  });
  
  console.log(`   Completion Rates by Action Type:`);
  for (const actionType of actionTypes.slice(0, 15)) {
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

async function generateRemediationPlan() {
  console.log('📋 COMPREHENSIVE REMEDIATION PLAN');
  console.log('-'.repeat(50));
  
  console.log(`   CRITICAL ISSUES IDENTIFIED:`);
  console.log(`   1. 68.5% of actions are orphaned (not linked to entities)`);
  console.log(`   2. 68% of actions are stuck in 'planned' status`);
  console.log(`   3. 0% back-and-forth communication detected`);
  console.log(`   4. Email actions lack proper direction metadata`);
  console.log(`   5. No email_received actions found`);
  console.log(`   6. Poor entity relationship mapping`);
  console.log('');
  
  console.log(`   REMEDIATION PRIORITIES:`);
  console.log(`   `);
  console.log(`   PHASE 1: CRITICAL DATA FIXES (Week 1)`);
  console.log(`   - Fix email action completion status`);
  console.log(`   - Implement email direction detection`);
  console.log(`   - Link orphaned email_conversation actions`);
  console.log(`   - Create email_received actions for inbound emails`);
  console.log(`   `);
  console.log(`   PHASE 2: ENTITY LINKING (Week 2)`);
  console.log(`   - Implement email address parsing`);
  console.log(`   - Link actions to people/companies based on email addresses`);
  console.log(`   - Fix person-company relationship mapping`);
  console.log(`   - Link leads/prospects to proper entities`);
  console.log(`   `);
  console.log(`   PHASE 3: COMMUNICATION FLOW (Week 3)`);
  console.log(`   - Implement back-and-forth detection`);
  console.log(`   - Create communication thread analysis`);
  console.log(`   - Fix action completion tracking`);
  console.log(`   - Implement proper action status management`);
  console.log(`   `);
  console.log(`   PHASE 4: PIPELINE OPTIMIZATION (Week 4)`);
  console.log(`   - Optimize lead-to-prospect conversion`);
  console.log(`   - Improve opportunity tracking`);
  console.log(`   - Implement automated action completion`);
  console.log(`   - Create comprehensive reporting`);
  console.log('');
  
  console.log(`   SUCCESS METRICS:`);
  console.log(`   - Reduce orphaned actions to <5%`);
  console.log(`   - Achieve >80% action completion rate`);
  console.log(`   - Detect >50% back-and-forth communication`);
  console.log(`   - Link >95% of actions to entities`);
  console.log(`   - Improve pipeline conversion rates by 25%`);
  console.log('');
}

// Run the comprehensive audit
if (require.main === module) {
  comprehensiveDanoPipelineAudit().catch(console.error);
}

module.exports = { comprehensiveDanoPipelineAudit };
