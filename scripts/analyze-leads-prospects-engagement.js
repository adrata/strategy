#!/usr/bin/env node

/**
 * 🔍 LEADS & PROSPECTS ENGAGEMENT ANALYSIS
 * 
 * Study the data to verify:
 * - Prospects should be uncontacted
 * - Leads should be engaged
 * 
 * Fix any misclassifications
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

async function analyzeLeadsProspectsEngagement() {
  console.log('🔍 LEADS & PROSPECTS ENGAGEMENT ANALYSIS');
  console.log('='.repeat(60));
  console.log('');

  try {
    // 1. ANALYZE PROSPECTS (should be uncontacted)
    await analyzeProspectsEngagement();
    
    // 2. ANALYZE LEADS (should be engaged)
    await analyzeLeadsEngagement();
    
    // 3. COMPARE ENGAGEMENT PATTERNS
    await compareEngagementPatterns();
    
    // 4. IDENTIFY MISCLASSIFICATIONS
    await identifyMisclassifications();
    
    // 5. GENERATE FIX RECOMMENDATIONS
    await generateFixRecommendations();

  } catch (error) {
    console.error('❌ Error in analysis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function analyzeProspectsEngagement() {
  console.log('👥 PROSPECTS ANALYSIS (Should be UNCONTACTED)');
  console.log('-'.repeat(50));
  
  const totalProspects = await prisma.prospects.count({
    where: { workspaceId: DANO_WORKSPACE_ID }
  });
  
  console.log(`   Total Prospects: ${totalProspects.toLocaleString()}`);
  
  // Check if prospects have any communication actions
  const prospectsWithActions = await prisma.prospects.findMany({
    where: { workspaceId: DANO_WORKSPACE_ID },
    select: {
      id: true,
      fullName: true,
      personId: true,
      companyId: true
    }
  });
  
  console.log(`   Prospects to analyze: ${prospectsWithActions.length.toLocaleString()}`);
  
  // Check communication actions for each prospect
  let contactedProspects = 0;
  let uncontactedProspects = 0;
  const contactedProspectDetails = [];
  
  for (const prospect of prospectsWithActions.slice(0, 100)) { // Sample first 100
    const communicationActions = await prisma.actions.count({
      where: {
        workspaceId: DANO_WORKSPACE_ID,
        OR: [
          { prospectId: prospect.id },
          { personId: prospect.personId },
          { companyId: prospect.companyId }
        ],
        type: {
          in: ['email_sent', 'email_received', 'email_conversation', 'phone_call', 'linkedin_message', 'linkedin_connection']
        }
      }
    });
    
    if (communicationActions > 0) {
      contactedProspects++;
      contactedProspectDetails.push({
        id: prospect.id,
        name: prospect.fullName,
        actions: communicationActions
      });
    } else {
      uncontactedProspects++;
    }
  }
  
  console.log(`   Sample Analysis (first 100 prospects):`);
  console.log(`   Contacted Prospects: ${contactedProspects} (${((contactedProspects / 100) * 100).toFixed(1)}%)`);
  console.log(`   Uncontacted Prospects: ${uncontactedProspects} (${((uncontactedProspects / 100) * 100).toFixed(1)}%)`);
  
  if (contactedProspectDetails.length > 0) {
    console.log(`   `);
    console.log(`   Sample Contacted Prospects (should be leads):`);
    contactedProspectDetails.slice(0, 10).forEach((prospect, index) => {
      console.log(`   ${index + 1}. ${prospect.name} (${prospect.actions} communication actions)`);
    });
  }
  console.log('');
}

async function analyzeLeadsEngagement() {
  console.log('🎯 LEADS ANALYSIS (Should be ENGAGED)');
  console.log('-'.repeat(50));
  
  const totalLeads = await prisma.leads.count({
    where: { workspaceId: DANO_WORKSPACE_ID }
  });
  
  console.log(`   Total Leads: ${totalLeads.toLocaleString()}`);
  
  // Check if leads have communication actions
  const leadsWithActions = await prisma.leads.findMany({
    where: { workspaceId: DANO_WORKSPACE_ID },
    select: {
      id: true,
      fullName: true,
      personId: true,
      companyId: true
    }
  });
  
  console.log(`   Leads to analyze: ${leadsWithActions.length.toLocaleString()}`);
  
  // Check communication actions for each lead
  let engagedLeads = 0;
  let unengagedLeads = 0;
  const unengagedLeadDetails = [];
  
  for (const lead of leadsWithActions.slice(0, 100)) { // Sample first 100
    const communicationActions = await prisma.actions.count({
      where: {
        workspaceId: DANO_WORKSPACE_ID,
        OR: [
          { leadId: lead.id },
          { personId: lead.personId },
          { companyId: lead.companyId }
        ],
        type: {
          in: ['email_sent', 'email_received', 'email_conversation', 'phone_call', 'linkedin_message', 'linkedin_connection']
        }
      }
    });
    
    if (communicationActions > 0) {
      engagedLeads++;
    } else {
      unengagedLeads++;
      unengagedLeadDetails.push({
        id: lead.id,
        name: lead.fullName,
        actions: communicationActions
      });
    }
  }
  
  console.log(`   Sample Analysis (first 100 leads):`);
  console.log(`   Engaged Leads: ${engagedLeads} (${((engagedLeads / 100) * 100).toFixed(1)}%)`);
  console.log(`   Unengaged Leads: ${unengagedLeads} (${((unengagedLeads / 100) * 100).toFixed(1)}%)`);
  
  if (unengagedLeadDetails.length > 0) {
    console.log(`   `);
    console.log(`   Sample Unengaged Leads (should be prospects):`);
    unengagedLeadDetails.slice(0, 10).forEach((lead, index) => {
      console.log(`   ${index + 1}. ${lead.name} (${lead.actions} communication actions)`);
    });
  }
  console.log('');
}

async function compareEngagementPatterns() {
  console.log('📊 ENGAGEMENT PATTERN COMPARISON');
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
      leadId: true,
      prospectId: true,
      personId: true,
      companyId: true,
      createdAt: true
    }
  });
  
  console.log(`   Total Communication Actions: ${communicationActions.length.toLocaleString()}`);
  
  // Analyze by entity type
  const leadActions = communicationActions.filter(action => action.leadId);
  const prospectActions = communicationActions.filter(action => action.prospectId);
  
  console.log(`   Actions linked to Leads: ${leadActions.length.toLocaleString()}`);
  console.log(`   Actions linked to Prospects: ${prospectActions.length.toLocaleString()}`);
  
  // Analyze communication types
  const leadActionTypes = leadActions.reduce((acc, action) => {
    acc[action.type] = (acc[action.type] || 0) + 1;
    return acc;
  }, {});
  
  const prospectActionTypes = prospectActions.reduce((acc, action) => {
    acc[action.type] = (acc[action.type] || 0) + 1;
    return acc;
  }, {});
  
  console.log(`   `);
  console.log(`   Lead Communication Types:`);
  Object.entries(leadActionTypes).forEach(([type, count]) => {
    console.log(`   ${type}: ${count.toLocaleString()}`);
  });
  
  console.log(`   `);
  console.log(`   Prospect Communication Types:`);
  Object.entries(prospectActionTypes).forEach(([type, count]) => {
    console.log(`   ${type}: ${count.toLocaleString()}`);
  });
  console.log('');
}

async function identifyMisclassifications() {
  console.log('🚨 MISCLASSIFICATION IDENTIFICATION');
  console.log('-'.repeat(50));
  
  // Find prospects that should be leads (have communication)
  const prospectsToCheck = await prisma.prospects.findMany({
    where: { workspaceId: DANO_WORKSPACE_ID },
    select: {
      id: true,
      fullName: true,
      personId: true,
      companyId: true
    },
    take: 200 // Check first 200
  });
  
  const prospectsToConvert = [];
  
  for (const prospect of prospectsToCheck) {
    const communicationCount = await prisma.actions.count({
      where: {
        workspaceId: DANO_WORKSPACE_ID,
        OR: [
          { prospectId: prospect.id },
          { personId: prospect.personId },
          { companyId: prospect.companyId }
        ],
        type: {
          in: ['email_sent', 'email_received', 'email_conversation', 'phone_call', 'linkedin_message', 'linkedin_connection']
        }
      }
    });
    
    if (communicationCount > 0) {
      prospectsToConvert.push({
        id: prospect.id,
        name: prospect.fullName,
        actions: communicationCount
      });
    }
  }
  
  // Find leads that should be prospects (no communication)
  const leadsToCheck = await prisma.leads.findMany({
    where: { workspaceId: DANO_WORKSPACE_ID },
    select: {
      id: true,
      fullName: true,
      personId: true,
      companyId: true
    },
    take: 200 // Check first 200
  });
  
  const leadsToConvert = [];
  
  for (const lead of leadsToCheck) {
    const communicationCount = await prisma.actions.count({
      where: {
        workspaceId: DANO_WORKSPACE_ID,
        OR: [
          { leadId: lead.id },
          { personId: lead.personId },
          { companyId: lead.companyId }
        ],
        type: {
          in: ['email_sent', 'email_received', 'email_conversation', 'phone_call', 'linkedin_message', 'linkedin_connection']
        }
      }
    });
    
    if (communicationCount === 0) {
      leadsToConvert.push({
        id: lead.id,
        name: lead.fullName,
        actions: communicationCount
      });
    }
  }
  
  console.log(`   Prospects that should be Leads (have communication): ${prospectsToConvert.length.toLocaleString()}`);
  if (prospectsToConvert.length > 0) {
    console.log(`   Sample prospects to convert:`);
    prospectsToConvert.slice(0, 10).forEach((prospect, index) => {
      console.log(`   ${index + 1}. ${prospect.name} (${prospect.actions} actions)`);
    });
  }
  
  console.log(`   `);
  console.log(`   Leads that should be Prospects (no communication): ${leadsToConvert.length.toLocaleString()}`);
  if (leadsToConvert.length > 0) {
    console.log(`   Sample leads to convert:`);
    leadsToConvert.slice(0, 10).forEach((lead, index) => {
      console.log(`   ${index + 1}. ${lead.name} (${lead.actions} actions)`);
    });
  }
  console.log('');
}

async function generateFixRecommendations() {
  console.log('🔧 FIX RECOMMENDATIONS');
  console.log('-'.repeat(50));
  
  console.log(`   RECOMMENDED ACTIONS:`);
  console.log(`   `);
  console.log(`   1. Convert engaged prospects to leads`);
  console.log(`   2. Convert unengaged leads to prospects`);
  console.log(`   3. Update action references (leadId → prospectId and vice versa)`);
  console.log(`   4. Implement engagement tracking for future classifications`);
  console.log(`   `);
  console.log(`   CRITERIA FOR CONVERSION:`);
  console.log(`   - Prospects → Leads: Have any communication actions`);
  console.log(`   - Leads → Prospects: Have zero communication actions`);
  console.log(`   `);
  console.log(`   IMPLEMENTATION STRATEGY:`);
  console.log(`   - Use parallel processing for speed`);
  console.log(`   - Batch operations to avoid timeouts`);
  console.log(`   - Update all related actions and references`);
  console.log(`   - Validate data integrity after conversion`);
  console.log('');
}

// Run the analysis
if (require.main === module) {
  analyzeLeadsProspectsEngagement().catch(console.error);
}

module.exports = { analyzeLeadsProspectsEngagement };

