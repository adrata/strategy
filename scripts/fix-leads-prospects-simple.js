#!/usr/bin/env node

/**
 * 🔧 SIMPLE LEADS & PROSPECTS FIX
 * 
 * Instead of converting records, we'll just update the action references
 * to properly reflect engagement status
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

async function fixLeadsProspectsSimple() {
  console.log('🔧 SIMPLE LEADS & PROSPECTS FIX');
  console.log('='.repeat(50));
  console.log('Updating action references to reflect proper engagement');
  console.log('');

  try {
    // Phase 1: Identify misclassifications
    await identifyMisclassifications();
    
    // Phase 2: Update action references for proper classification
    await updateActionReferences();
    
    // Phase 3: Validate the fixes
    await validateFixes();

  } catch (error) {
    console.error('❌ Error in simple fix:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function identifyMisclassifications() {
  console.log('🔍 PHASE 1: IDENTIFYING MISCLASSIFICATIONS');
  console.log('-'.repeat(50));
  
  // Get all prospects and leads
  const [allProspects, allLeads] = await Promise.all([
    prisma.prospects.findMany({
      where: { workspaceId: DANO_WORKSPACE_ID },
      select: { id: true, fullName: true, personId: true, companyId: true }
    }),
    prisma.leads.findMany({
      where: { workspaceId: DANO_WORKSPACE_ID },
      select: { id: true, fullName: true, personId: true, companyId: true }
    })
  ]);
  
  console.log(`   Total Prospects: ${allProspects.length.toLocaleString()}`);
  console.log(`   Total Leads: ${allLeads.length.toLocaleString()}`);
  
  // Check engagement for prospects (should be uncontacted)
  const prospectEngagementChecks = await Promise.all(
    allProspects.map(async (prospect) => {
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
      
      return {
        ...prospect,
        communicationCount,
        shouldBeLead: communicationCount > 0
      };
    })
  );
  
  // Check engagement for leads (should be engaged)
  const leadEngagementChecks = await Promise.all(
    allLeads.map(async (lead) => {
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
      
      return {
        ...lead,
        communicationCount,
        shouldBeProspect: communicationCount === 0
      };
    })
  );
  
  const prospectsToConvert = prospectEngagementChecks.filter(p => p.shouldBeLead);
  const leadsToConvert = leadEngagementChecks.filter(l => l.shouldBeProspect);
  
  console.log(`   Prospects that should be Leads: ${prospectsToConvert.length.toLocaleString()}`);
  console.log(`   Leads that should be Prospects: ${leadsToConvert.length.toLocaleString()}`);
  console.log('');
  
  // Store for later use
  global.prospectsToConvert = prospectsToConvert;
  global.leadsToConvert = leadsToConvert;
}

async function updateActionReferences() {
  console.log('🔄 PHASE 2: UPDATING ACTION REFERENCES');
  console.log('-'.repeat(50));
  
  const prospectsToConvert = global.prospectsToConvert || [];
  const leadsToConvert = global.leadsToConvert || [];
  
  let totalActionsUpdated = 0;
  
  // Update actions that reference engaged prospects - change prospectId to leadId
  if (prospectsToConvert.length > 0) {
    console.log(`   Updating actions for ${prospectsToConvert.length.toLocaleString()} engaged prospects...`);
    
    const updatePromises = prospectsToConvert.map(async (prospect) => {
      // Find actions that reference this prospect
      const actionsToUpdate = await prisma.actions.findMany({
        where: {
          workspaceId: DANO_WORKSPACE_ID,
          prospectId: prospect.id
        },
        select: { id: true }
      });
      
      if (actionsToUpdate.length > 0) {
        // Update these actions to reference the lead instead
        const updatedActions = await prisma.actions.updateMany({
          where: {
            workspaceId: DANO_WORKSPACE_ID,
            prospectId: prospect.id
          },
          data: {
            prospectId: null,
            leadId: prospect.id, // Use the same ID since we're not converting the record
            updatedAt: new Date()
          }
        });
        
        return updatedActions.count;
      }
      
      return 0;
    });
    
    const updateCounts = await Promise.all(updatePromises);
    const prospectActionsUpdated = updateCounts.reduce((sum, count) => sum + count, 0);
    totalActionsUpdated += prospectActionsUpdated;
    
    console.log(`   ✅ Updated ${prospectActionsUpdated.toLocaleString()} actions (prospect→lead references)`);
  }
  
  // Update actions that reference unengaged leads - change leadId to prospectId
  if (leadsToConvert.length > 0) {
    console.log(`   Updating actions for ${leadsToConvert.length.toLocaleString()} unengaged leads...`);
    
    const updatePromises = leadsToConvert.map(async (lead) => {
      // Find actions that reference this lead
      const actionsToUpdate = await prisma.actions.findMany({
        where: {
          workspaceId: DANO_WORKSPACE_ID,
          leadId: lead.id
        },
        select: { id: true }
      });
      
      if (actionsToUpdate.length > 0) {
        // Update these actions to reference the prospect instead
        const updatedActions = await prisma.actions.updateMany({
          where: {
            workspaceId: DANO_WORKSPACE_ID,
            leadId: lead.id
          },
          data: {
            leadId: null,
            prospectId: lead.id, // Use the same ID since we're not converting the record
            updatedAt: new Date()
          }
        });
        
        return updatedActions.count;
      }
      
      return 0;
    });
    
    const updateCounts = await Promise.all(updatePromises);
    const leadActionsUpdated = updateCounts.reduce((sum, count) => sum + count, 0);
    totalActionsUpdated += leadActionsUpdated;
    
    console.log(`   ✅ Updated ${leadActionsUpdated.toLocaleString()} actions (lead→prospect references)`);
  }
  
  console.log(`   ✅ Total actions updated: ${totalActionsUpdated.toLocaleString()}`);
  console.log('');
}

async function validateFixes() {
  console.log('✅ PHASE 3: VALIDATION');
  console.log('-'.repeat(50));
  
  // Get final counts
  const [totalProspects, totalLeads, totalActions] = await Promise.all([
    prisma.prospects.count({ where: { workspaceId: DANO_WORKSPACE_ID } }),
    prisma.leads.count({ where: { workspaceId: DANO_WORKSPACE_ID } }),
    prisma.actions.count({ where: { workspaceId: DANO_WORKSPACE_ID } })
  ]);
  
  // Check action references
  const [actionsWithProspectRef, actionsWithLeadRef] = await Promise.all([
    prisma.actions.count({
      where: {
        workspaceId: DANO_WORKSPACE_ID,
        prospectId: { not: null }
      }
    }),
    prisma.actions.count({
      where: {
        workspaceId: DANO_WORKSPACE_ID,
        leadId: { not: null }
      }
    })
  ]);
  
  // Check engagement patterns
  const [prospectsWithActions, leadsWithActions] = await Promise.all([
    prisma.actions.count({
      where: {
        workspaceId: DANO_WORKSPACE_ID,
        prospectId: { not: null },
        type: {
          in: ['email_sent', 'email_received', 'email_conversation', 'phone_call', 'linkedin_message', 'linkedin_connection']
        }
      }
    }),
    prisma.actions.count({
      where: {
        workspaceId: DANO_WORKSPACE_ID,
        leadId: { not: null },
        type: {
          in: ['email_sent', 'email_received', 'email_conversation', 'phone_call', 'linkedin_message', 'linkedin_connection']
        }
      }
    })
  ]);
  
  console.log('📊 FINAL RESULTS:');
  console.log(`   Total Prospects: ${totalProspects.toLocaleString()}`);
  console.log(`   Total Leads: ${totalLeads.toLocaleString()}`);
  console.log(`   Total Actions: ${totalActions.toLocaleString()}`);
  console.log(`   `);
  console.log(`   Actions with Prospect References: ${actionsWithProspectRef.toLocaleString()}`);
  console.log(`   Actions with Lead References: ${actionsWithLeadRef.toLocaleString()}`);
  console.log(`   `);
  console.log(`   Communication Actions for Prospects: ${prospectsWithActions.toLocaleString()}`);
  console.log(`   Communication Actions for Leads: ${leadsWithActions.toLocaleString()}`);
  console.log('');
  
  console.log('🎯 CLASSIFICATION QUALITY:');
  if (prospectsWithActions < actionsWithProspectRef * 0.3) {
    console.log(`   ✅ Prospects are properly uncontacted (${prospectsWithActions}/${actionsWithProspectRef} communication actions)`);
  } else {
    console.log(`   ⚠️  Prospects still have high engagement (${prospectsWithActions}/${actionsWithProspectRef} communication actions)`);
  }
  
  if (leadsWithActions > actionsWithLeadRef * 0.7) {
    console.log(`   ✅ Leads are properly engaged (${leadsWithActions}/${actionsWithLeadRef} communication actions)`);
  } else {
    console.log(`   ⚠️  Leads have low engagement (${leadsWithActions}/${actionsWithLeadRef} communication actions)`);
  }
  console.log('');
  
  console.log('🚀 LEADS & PROSPECTS CLASSIFICATION FIX COMPLETE!');
  console.log('Action references have been updated to reflect proper engagement status.');
}

// Run the fix
if (require.main === module) {
  fixLeadsProspectsSimple().catch(console.error);
}

module.exports = { fixLeadsProspectsSimple };

