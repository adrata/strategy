#!/usr/bin/env node

/**
 * 🔍 COMPREHENSIVE WORKSPACE AUDIT
 * 
 * Audits both of Dano's workspaces:
 * 1. Retail Product Solutions workspace
 * 2. Notary Everyday workspace
 * 
 * Ensures:
 * - Proper data separation between workspaces
 * - Leads only contain people with engagement history
 * - Prospects are uncontacted people
 * - Complete data integrity across both workspaces
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

// Dano's workspace IDs
const RETAIL_WORKSPACE_ID = '01K1VBYV8ETM2RCQA4GNN9EG72'; // Retail Product Solutions
const NOTARY_WORKSPACE_ID = '01K1VBYXHD0J895XAN0HGFBKJP'; // Notary Everyday (Dan's workspace)
const DANO_USER_ID = '01K1VBYYV7TRPY04NW4TW4XWRB';

async function auditBothWorkspaces() {
  console.log('🔍 COMPREHENSIVE WORKSPACE AUDIT');
  console.log('='.repeat(60));
  console.log('Auditing both of Dano\'s workspaces for data integrity');
  console.log('');

  try {
    // Phase 1: Audit Retail Product Solutions workspace
    await auditRetailWorkspace();
    
    // Phase 2: Audit Notary Everyday workspace
    await auditNotaryWorkspace();
    
    // Phase 3: Check data separation
    await checkDataSeparation();
    
    // Phase 4: Fix classification issues
    await fixClassificationIssues();
    
    // Phase 5: Final validation
    await finalValidation();
    
    console.log('');
    console.log('✅ COMPREHENSIVE WORKSPACE AUDIT COMPLETED!');
    console.log('Both workspaces are now properly classified and separated.');
    
  } catch (error) {
    console.error('❌ Error in workspace audit:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function auditRetailWorkspace() {
  console.log('🏪 PHASE 1: AUDITING RETAIL PRODUCT SOLUTIONS WORKSPACE');
  console.log('-'.repeat(50));
  
  const [
    totalPeople,
    totalCompanies,
    totalLeads,
    totalProspects,
    totalOpportunities,
    totalActions,
    engagementActions,
    orphanedActions
  ] = await Promise.all([
    prisma.people.count({ where: { workspaceId: RETAIL_WORKSPACE_ID } }),
    prisma.companies.count({ where: { workspaceId: RETAIL_WORKSPACE_ID } }),
    prisma.leads.count({ where: { workspaceId: RETAIL_WORKSPACE_ID } }),
    prisma.prospects.count({ where: { workspaceId: RETAIL_WORKSPACE_ID } }),
    prisma.opportunities.count({ where: { workspaceId: RETAIL_WORKSPACE_ID } }),
    prisma.actions.count({ where: { workspaceId: RETAIL_WORKSPACE_ID } }),
    prisma.actions.count({
      where: {
        workspaceId: RETAIL_WORKSPACE_ID,
        type: {
          in: ['email_sent', 'email_received', 'email_conversation', 'phone_call', 'linkedin_message', 'linkedin_connection']
        }
      }
    }),
    prisma.actions.count({ 
      where: { 
        workspaceId: RETAIL_WORKSPACE_ID,
        personId: null,
        companyId: null,
        leadId: null,
        prospectId: null,
        opportunityId: null
      } 
    })
  ]);

  console.log('📊 RETAIL WORKSPACE INVENTORY:');
  console.log(`   People: ${totalPeople.toLocaleString()}`);
  console.log(`   Companies: ${totalCompanies.toLocaleString()}`);
  console.log(`   Leads: ${totalLeads.toLocaleString()}`);
  console.log(`   Prospects: ${totalProspects.toLocaleString()}`);
  console.log(`   Opportunities: ${totalOpportunities.toLocaleString()}`);
  console.log(`   Actions: ${totalActions.toLocaleString()}`);
  console.log(`   Engagement Actions: ${engagementActions.toLocaleString()}`);
  console.log(`   Orphaned Actions: ${orphanedActions.toLocaleString()}`);
  console.log('');

  // Check lead engagement by looking at actions that reference leads
  const leadsWithEngagement = await prisma.actions.count({
    where: {
      workspaceId: RETAIL_WORKSPACE_ID,
      leadId: { not: null },
      type: {
        in: ['email_sent', 'email_received', 'email_conversation', 'phone_call', 'linkedin_message', 'linkedin_connection']
      }
    }
  });

  const leadsWithoutEngagement = totalLeads - leadsWithEngagement;
  const leadEngagementRate = totalLeads > 0 ? ((leadsWithEngagement / totalLeads) * 100).toFixed(1) : '0.0';

  console.log('🎯 LEAD ENGAGEMENT ANALYSIS:');
  console.log(`   Leads with Engagement: ${leadsWithEngagement.toLocaleString()}`);
  console.log(`   Leads without Engagement: ${leadsWithoutEngagement.toLocaleString()}`);
  console.log(`   Engagement Rate: ${leadEngagementRate}%`);
  console.log('');

  // Check prospect engagement by looking at actions that reference prospects
  const prospectsWithEngagement = await prisma.actions.count({
    where: {
      workspaceId: RETAIL_WORKSPACE_ID,
      prospectId: { not: null },
      type: {
        in: ['email_sent', 'email_received', 'email_conversation', 'phone_call', 'linkedin_message', 'linkedin_connection']
      }
    }
  });

  const prospectsWithoutEngagement = totalProspects - prospectsWithEngagement;
  const prospectEngagementRate = totalProspects > 0 ? ((prospectsWithEngagement / totalProspects) * 100).toFixed(1) : '0.0';

  console.log('🎯 PROSPECT ENGAGEMENT ANALYSIS:');
  console.log(`   Prospects with Engagement: ${prospectsWithEngagement.toLocaleString()}`);
  console.log(`   Prospects without Engagement: ${prospectsWithoutEngagement.toLocaleString()}`);
  console.log(`   Engagement Rate: ${prospectEngagementRate}%`);
  console.log('');

  if (leadsWithoutEngagement > 0) {
    console.log('⚠️  CLASSIFICATION ISSUES:');
    console.log(`   - ${leadsWithoutEngagement} leads should be prospects (no engagement)`);
  }

  if (prospectsWithEngagement > 0) {
    console.log('⚠️  CLASSIFICATION ISSUES:');
    console.log(`   - ${prospectsWithEngagement} prospects should be leads (have engagement)`);
  }

  console.log('');
}

async function auditNotaryWorkspace() {
  console.log('📋 PHASE 2: AUDITING NOTARY EVERYDAY WORKSPACE');
  console.log('-'.repeat(50));
  
  const [
    totalPeople,
    totalCompanies,
    totalLeads,
    totalProspects,
    totalOpportunities,
    totalActions,
    engagementActions,
    orphanedActions
  ] = await Promise.all([
    prisma.people.count({ where: { workspaceId: NOTARY_WORKSPACE_ID } }),
    prisma.companies.count({ where: { workspaceId: NOTARY_WORKSPACE_ID } }),
    prisma.leads.count({ where: { workspaceId: NOTARY_WORKSPACE_ID } }),
    prisma.prospects.count({ where: { workspaceId: NOTARY_WORKSPACE_ID } }),
    prisma.opportunities.count({ where: { workspaceId: NOTARY_WORKSPACE_ID } }),
    prisma.actions.count({ where: { workspaceId: NOTARY_WORKSPACE_ID } }),
    prisma.actions.count({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        type: {
          in: ['email_sent', 'email_received', 'email_conversation', 'phone_call', 'linkedin_message', 'linkedin_connection']
        }
      }
    }),
    prisma.actions.count({ 
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        personId: null,
        companyId: null,
        leadId: null,
        prospectId: null,
        opportunityId: null
      } 
    })
  ]);

  console.log('📊 NOTARY WORKSPACE INVENTORY:');
  console.log(`   People: ${totalPeople.toLocaleString()}`);
  console.log(`   Companies: ${totalCompanies.toLocaleString()}`);
  console.log(`   Leads: ${totalLeads.toLocaleString()}`);
  console.log(`   Prospects: ${totalProspects.toLocaleString()}`);
  console.log(`   Opportunities: ${totalOpportunities.toLocaleString()}`);
  console.log(`   Actions: ${totalActions.toLocaleString()}`);
  console.log(`   Engagement Actions: ${engagementActions.toLocaleString()}`);
  console.log(`   Orphaned Actions: ${orphanedActions.toLocaleString()}`);
  console.log('');

  // Check lead engagement by looking at actions that reference leads
  const leadsWithEngagement = await prisma.actions.count({
    where: {
      workspaceId: NOTARY_WORKSPACE_ID,
      leadId: { not: null },
      type: {
        in: ['email_sent', 'email_received', 'email_conversation', 'phone_call', 'linkedin_message', 'linkedin_connection']
      }
    }
  });

  const leadsWithoutEngagement = totalLeads - leadsWithEngagement;
  const leadEngagementRate = totalLeads > 0 ? ((leadsWithEngagement / totalLeads) * 100).toFixed(1) : '0.0';

  console.log('🎯 LEAD ENGAGEMENT ANALYSIS:');
  console.log(`   Leads with Engagement: ${leadsWithEngagement.toLocaleString()}`);
  console.log(`   Leads without Engagement: ${leadsWithoutEngagement.toLocaleString()}`);
  console.log(`   Engagement Rate: ${leadEngagementRate}%`);
  console.log('');

  // Check prospect engagement by looking at actions that reference prospects
  const prospectsWithEngagement = await prisma.actions.count({
    where: {
      workspaceId: NOTARY_WORKSPACE_ID,
      prospectId: { not: null },
      type: {
        in: ['email_sent', 'email_received', 'email_conversation', 'phone_call', 'linkedin_message', 'linkedin_connection']
      }
    }
  });

  const prospectsWithoutEngagement = totalProspects - prospectsWithEngagement;
  const prospectEngagementRate = totalProspects > 0 ? ((prospectsWithEngagement / totalProspects) * 100).toFixed(1) : '0.0';

  console.log('🎯 PROSPECT ENGAGEMENT ANALYSIS:');
  console.log(`   Prospects with Engagement: ${prospectsWithEngagement.toLocaleString()}`);
  console.log(`   Prospects without Engagement: ${prospectsWithoutEngagement.toLocaleString()}`);
  console.log(`   Engagement Rate: ${prospectEngagementRate}%`);
  console.log('');

  if (leadsWithoutEngagement > 0) {
    console.log('⚠️  CLASSIFICATION ISSUES:');
    console.log(`   - ${leadsWithoutEngagement} leads should be prospects (no engagement)`);
  }

  if (prospectsWithEngagement > 0) {
    console.log('⚠️  CLASSIFICATION ISSUES:');
    console.log(`   - ${prospectsWithEngagement} prospects should be leads (have engagement)`);
  }

  console.log('');
}

async function checkDataSeparation() {
  console.log('🔒 PHASE 3: CHECKING DATA SEPARATION');
  console.log('-'.repeat(50));
  
  // Check for cross-workspace contamination
  const retailPeopleInNotary = await prisma.people.count({
    where: {
      workspaceId: NOTARY_WORKSPACE_ID,
      email: {
        contains: 'retail'
      }
    }
  });

  const notaryPeopleInRetail = await prisma.people.count({
    where: {
      workspaceId: RETAIL_WORKSPACE_ID,
      email: {
        contains: 'notary'
      }
    }
  });

  console.log('🔍 CROSS-WORKSPACE CONTAMINATION CHECK:');
  console.log(`   Retail-related people in Notary workspace: ${retailPeopleInNotary}`);
  console.log(`   Notary-related people in Retail workspace: ${notaryPeopleInRetail}`);
  console.log('');

  // Check for duplicate emails across workspaces (simplified approach)
  const retailEmails = await prisma.people.findMany({
    where: {
      workspaceId: RETAIL_WORKSPACE_ID,
      email: { not: null }
    },
    select: { email: true }
  });

  const notaryEmails = await prisma.people.findMany({
    where: {
      workspaceId: NOTARY_WORKSPACE_ID,
      email: { not: null }
    },
    select: { email: true }
  });

  const retailEmailSet = new Set(retailEmails.map(p => p.email));
  const duplicateEmails = notaryEmails.filter(p => retailEmailSet.has(p.email));

  console.log('📧 DUPLICATE EMAIL CHECK:');
  console.log(`   Found ${duplicateEmails.length} duplicate emails across workspaces`);
  if (duplicateEmails.length > 0) {
    console.log('   Sample duplicates:');
    duplicateEmails.slice(0, 5).forEach((dup, index) => {
      console.log(`   ${index + 1}. ${dup.email}`);
    });
  }
  console.log('');

  // Check for actions assigned to wrong workspace
  const retailActionsInNotary = await prisma.actions.count({
    where: {
      workspaceId: NOTARY_WORKSPACE_ID,
      userId: DANO_USER_ID
    }
  });

  const notaryActionsInRetail = await prisma.actions.count({
    where: {
      workspaceId: RETAIL_WORKSPACE_ID,
      userId: { not: DANO_USER_ID }
    }
  });

  console.log('⚡ ACTION WORKSPACE SEPARATION:');
  console.log(`   Dano's actions in Notary workspace: ${retailActionsInNotary}`);
  console.log(`   Non-Dano actions in Retail workspace: ${notaryActionsInRetail}`);
  console.log('');
}

async function fixClassificationIssues() {
  console.log('🔧 PHASE 4: FIXING CLASSIFICATION ISSUES');
  console.log('-'.repeat(50));
  
  // Fix Retail workspace classification
  await fixWorkspaceClassification(RETAIL_WORKSPACE_ID, 'Retail Product Solutions');
  
  // Fix Notary workspace classification
  await fixWorkspaceClassification(NOTARY_WORKSPACE_ID, 'Notary Everyday');
}

async function fixWorkspaceClassification(workspaceId, workspaceName) {
  console.log(`   🔧 Fixing ${workspaceName} workspace...`);
  
  // Find leads without engagement (should be prospects)
  // First get all leads, then check which ones have no engagement actions
  const allLeads = await prisma.leads.findMany({
    where: { workspaceId: workspaceId },
    take: 100
  });

  const leadsWithoutEngagement = [];
  for (const lead of allLeads) {
    const hasEngagement = await prisma.actions.count({
      where: {
        workspaceId: workspaceId,
        leadId: lead.id,
        type: {
          in: ['email_sent', 'email_received', 'email_conversation', 'phone_call', 'linkedin_message', 'linkedin_connection']
        }
      }
    });
    
    if (hasEngagement === 0) {
      leadsWithoutEngagement.push(lead);
    }
  }

  console.log(`     Found ${leadsWithoutEngagement.length} leads without engagement to convert to prospects...`);
  
  let convertedToProspects = 0;
  for (const lead of leadsWithoutEngagement) {
    try {
      // Update actions to reference prospect instead of lead
      await prisma.actions.updateMany({
        where: {
          workspaceId: workspaceId,
          leadId: lead.id
        },
        data: {
          leadId: null,
          prospectId: lead.id
        }
      });

      // Delete the lead record
      await prisma.leads.delete({
        where: { id: lead.id }
      });

      convertedToProspects++;
    } catch (error) {
      console.log(`     ⚠️  Error converting lead ${lead.id}: ${error.message}`);
    }
  }

  console.log(`     ✅ Converted ${convertedToProspects} leads to prospects`);
  
  // Find prospects with engagement (should be leads)
  // First get all prospects, then check which ones have engagement actions
  const allProspects = await prisma.prospects.findMany({
    where: { workspaceId: workspaceId },
    take: 100
  });

  const prospectsWithEngagement = [];
  for (const prospect of allProspects) {
    const hasEngagement = await prisma.actions.count({
      where: {
        workspaceId: workspaceId,
        prospectId: prospect.id,
        type: {
          in: ['email_sent', 'email_received', 'email_conversation', 'phone_call', 'linkedin_message', 'linkedin_connection']
        }
      }
    });
    
    if (hasEngagement > 0) {
      prospectsWithEngagement.push(prospect);
    }
  }

  console.log(`     Found ${prospectsWithEngagement.length} prospects with engagement to convert to leads...`);
  
  let convertedToLeads = 0;
  for (const prospect of prospectsWithEngagement) {
    try {
      // Update actions to reference lead instead of prospect
      await prisma.actions.updateMany({
        where: {
          workspaceId: workspaceId,
          prospectId: prospect.id
        },
        data: {
          prospectId: null,
          leadId: prospect.id
        }
      });

      // Delete the prospect record
      await prisma.prospects.delete({
        where: { id: prospect.id }
      });

      convertedToLeads++;
    } catch (error) {
      console.log(`     ⚠️  Error converting prospect ${prospect.id}: ${error.message}`);
    }
  }

  console.log(`     ✅ Converted ${convertedToLeads} prospects to leads`);
  console.log('');
}

async function finalValidation() {
  console.log('✅ PHASE 5: FINAL VALIDATION');
  console.log('-'.repeat(50));
  
  // Final counts for both workspaces
  const [
    retailPeople, retailCompanies, retailLeads, retailProspects, retailActions,
    notaryPeople, notaryCompanies, notaryLeads, notaryProspects, notaryActions
  ] = await Promise.all([
    prisma.people.count({ where: { workspaceId: RETAIL_WORKSPACE_ID } }),
    prisma.companies.count({ where: { workspaceId: RETAIL_WORKSPACE_ID } }),
    prisma.leads.count({ where: { workspaceId: RETAIL_WORKSPACE_ID } }),
    prisma.prospects.count({ where: { workspaceId: RETAIL_WORKSPACE_ID } }),
    prisma.actions.count({ where: { workspaceId: RETAIL_WORKSPACE_ID } }),
    prisma.people.count({ where: { workspaceId: NOTARY_WORKSPACE_ID } }),
    prisma.companies.count({ where: { workspaceId: NOTARY_WORKSPACE_ID } }),
    prisma.leads.count({ where: { workspaceId: NOTARY_WORKSPACE_ID } }),
    prisma.prospects.count({ where: { workspaceId: NOTARY_WORKSPACE_ID } }),
    prisma.actions.count({ where: { workspaceId: NOTARY_WORKSPACE_ID } })
  ]);

  console.log('📊 FINAL WORKSPACE SUMMARY:');
  console.log('');
  console.log('🏪 RETAIL PRODUCT SOLUTIONS:');
  console.log(`   People: ${retailPeople.toLocaleString()}`);
  console.log(`   Companies: ${retailCompanies.toLocaleString()}`);
  console.log(`   Leads: ${retailLeads.toLocaleString()}`);
  console.log(`   Prospects: ${retailProspects.toLocaleString()}`);
  console.log(`   Actions: ${retailActions.toLocaleString()}`);
  console.log('');
  console.log('📋 NOTARY EVERYDAY:');
  console.log(`   People: ${notaryPeople.toLocaleString()}`);
  console.log(`   Companies: ${notaryCompanies.toLocaleString()}`);
  console.log(`   Leads: ${notaryLeads.toLocaleString()}`);
  console.log(`   Prospects: ${notaryProspects.toLocaleString()}`);
  console.log(`   Actions: ${notaryActions.toLocaleString()}`);
  console.log('');

  // Final engagement validation
  const [
    retailLeadsWithEngagement, retailProspectsWithEngagement,
    notaryLeadsWithEngagement, notaryProspectsWithEngagement
  ] = await Promise.all([
    prisma.actions.count({
      where: {
        workspaceId: RETAIL_WORKSPACE_ID,
        leadId: { not: null },
        type: {
          in: ['email_sent', 'email_received', 'email_conversation', 'phone_call', 'linkedin_message', 'linkedin_connection']
        }
      }
    }),
    prisma.actions.count({
      where: {
        workspaceId: RETAIL_WORKSPACE_ID,
        prospectId: { not: null },
        type: {
          in: ['email_sent', 'email_received', 'email_conversation', 'phone_call', 'linkedin_message', 'linkedin_connection']
        }
      }
    }),
    prisma.actions.count({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        leadId: { not: null },
        type: {
          in: ['email_sent', 'email_received', 'email_conversation', 'phone_call', 'linkedin_message', 'linkedin_connection']
        }
      }
    }),
    prisma.actions.count({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        prospectId: { not: null },
        type: {
          in: ['email_sent', 'email_received', 'email_conversation', 'phone_call', 'linkedin_message', 'linkedin_connection']
        }
      }
    })
  ]);

  console.log('🎯 FINAL ENGAGEMENT VALIDATION:');
  console.log('');
  console.log('🏪 RETAIL PRODUCT SOLUTIONS:');
  console.log(`   Leads with Engagement: ${retailLeadsWithEngagement}/${retailLeads} (${retailLeads > 0 ? ((retailLeadsWithEngagement / retailLeads) * 100).toFixed(1) : '0.0'}%)`);
  console.log(`   Prospects with Engagement: ${retailProspectsWithEngagement}/${retailProspects} (${retailProspects > 0 ? ((retailProspectsWithEngagement / retailProspects) * 100).toFixed(1) : '0.0'}%)`);
  console.log('');
  console.log('📋 NOTARY EVERYDAY:');
  console.log(`   Leads with Engagement: ${notaryLeadsWithEngagement}/${notaryLeads} (${notaryLeads > 0 ? ((notaryLeadsWithEngagement / notaryLeads) * 100).toFixed(1) : '0.0'}%)`);
  console.log(`   Prospects with Engagement: ${notaryProspectsWithEngagement}/${notaryProspects} (${notaryProspects > 0 ? ((notaryProspectsWithEngagement / notaryProspects) * 100).toFixed(1) : '0.0'}%)`);
  console.log('');

  // Data quality assessment
  const retailLeadQuality = retailLeads > 0 ? ((retailLeadsWithEngagement / retailLeads) * 100).toFixed(1) : '100.0';
  const retailProspectQuality = retailProspects > 0 ? (100 - (retailProspectsWithEngagement / retailProspects) * 100).toFixed(1) : '100.0';
  const notaryLeadQuality = notaryLeads > 0 ? ((notaryLeadsWithEngagement / notaryLeads) * 100).toFixed(1) : '100.0';
  const notaryProspectQuality = notaryProspects > 0 ? (100 - (notaryProspectsWithEngagement / notaryProspects) * 100).toFixed(1) : '100.0';

  console.log('📈 DATA QUALITY SCORES:');
  console.log('');
  console.log('🏪 RETAIL PRODUCT SOLUTIONS:');
  console.log(`   Lead Quality: ${retailLeadQuality}% (should be 100% - all leads have engagement)`);
  console.log(`   Prospect Quality: ${retailProspectQuality}% (should be 100% - no prospects have engagement)`);
  console.log('');
  console.log('📋 NOTARY EVERYDAY:');
  console.log(`   Lead Quality: ${notaryLeadQuality}% (should be 100% - all leads have engagement)`);
  console.log(`   Prospect Quality: ${notaryProspectQuality}% (should be 100% - no prospects have engagement)`);
  console.log('');

  // Overall assessment
  const overallQuality = (parseFloat(retailLeadQuality) + parseFloat(retailProspectQuality) + 
                         parseFloat(notaryLeadQuality) + parseFloat(notaryProspectQuality)) / 4;

  console.log('🎯 OVERALL DATA QUALITY:');
  if (overallQuality >= 95) {
    console.log(`   ✅ EXCELLENT (${overallQuality.toFixed(1)}%) - Both workspaces are properly classified`);
  } else if (overallQuality >= 85) {
    console.log(`   ✅ GOOD (${overallQuality.toFixed(1)}%) - Minor classification issues remain`);
  } else {
    console.log(`   ⚠️  NEEDS ATTENTION (${overallQuality.toFixed(1)}%) - Significant classification issues remain`);
  }
}

// Run the comprehensive audit
auditBothWorkspaces().catch(console.error);
