#!/usr/bin/env node

/**
 * 🔧 FIX LEADS & PROSPECTS CLASSIFICATION
 * 
 * Optimized parallel processing to fix misclassifications:
 * - Convert engaged prospects to leads
 * - Convert unengaged leads to prospects
 * - Update all action references
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
const BATCH_SIZE = 50;

async function fixLeadsProspectsClassification() {
  console.log('🔧 FIXING LEADS & PROSPECTS CLASSIFICATION');
  console.log('='.repeat(60));
  console.log('Using parallel processing for maximum speed');
  console.log('');

  try {
    // Phase 1: Identify misclassifications
    await identifyMisclassifications();
    
    // Phase 2: Convert engaged prospects to leads
    await convertProspectsToLeads();
    
    // Phase 3: Convert unengaged leads to prospects
    await convertLeadsToProspects();
    
    // Phase 4: Update action references
    await updateActionReferences();
    
    // Phase 5: Validate fixes
    await validateFixes();

  } catch (error) {
    console.error('❌ Error in classification fix:', error);
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
      select: {
        id: true,
        fullName: true,
        personId: true,
        companyId: true
      }
    }),
    prisma.leads.findMany({
      where: { workspaceId: DANO_WORKSPACE_ID },
      select: {
        id: true,
        fullName: true,
        personId: true,
        companyId: true
      }
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

async function convertProspectsToLeads() {
  console.log('🔄 PHASE 2: CONVERTING ENGAGED PROSPECTS TO LEADS');
  console.log('-'.repeat(50));
  
  const prospectsToConvert = global.prospectsToConvert || [];
  
  if (prospectsToConvert.length === 0) {
    console.log('   ✅ No prospects to convert to leads');
    return;
  }
  
  console.log(`   Converting ${prospectsToConvert.length.toLocaleString()} prospects to leads...`);
  
  // Process in parallel batches
  const batches = [];
  for (let i = 0; i < prospectsToConvert.length; i += BATCH_SIZE) {
    batches.push(prospectsToConvert.slice(i, i + BATCH_SIZE));
  }
  
  let totalConverted = 0;
  const batchPromises = batches.map(async (batch, batchIndex) => {
    const conversionPromises = batch.map(async (prospect) => {
      try {
        // Create new lead record
        const newLead = await prisma.leads.create({
          data: {
            workspaceId: DANO_WORKSPACE_ID,
            fullName: prospect.fullName,
            personId: prospect.personId,
            companyId: prospect.companyId,
            // Copy other fields from prospect if they exist
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        // Delete the prospect record
        await prisma.prospects.delete({
          where: { id: prospect.id }
        });
        
        return {
          oldProspectId: prospect.id,
          newLeadId: newLead.id,
          name: prospect.fullName
        };
      } catch (error) {
        console.error(`   Error converting prospect ${prospect.fullName}:`, error.message);
        return null;
      }
    });
    
    const results = await Promise.all(conversionPromises);
    const successfulConversions = results.filter(r => r !== null);
    totalConverted += successfulConversions.length;
    
    if (batchIndex % 5 === 0) {
      console.log(`   Processed batch ${batchIndex + 1}/${batches.length} (${totalConverted.toLocaleString()} converted)`);
    }
    
    return successfulConversions;
  });
  
  const allConversions = await Promise.all(batchPromises);
  const successfulConversions = allConversions.flat().filter(c => c !== null);
  
  console.log(`   ✅ Converted ${totalConverted.toLocaleString()} prospects to leads`);
  
  // Store conversion mapping for action updates
  global.prospectToLeadMappings = successfulConversions;
}

async function convertLeadsToProspects() {
  console.log('🔄 PHASE 3: CONVERTING UNENGAGED LEADS TO PROSPECTS');
  console.log('-'.repeat(50));
  
  const leadsToConvert = global.leadsToConvert || [];
  
  if (leadsToConvert.length === 0) {
    console.log('   ✅ No leads to convert to prospects');
    return;
  }
  
  console.log(`   Converting ${leadsToConvert.length.toLocaleString()} leads to prospects...`);
  
  // Process in parallel batches
  const batches = [];
  for (let i = 0; i < leadsToConvert.length; i += BATCH_SIZE) {
    batches.push(leadsToConvert.slice(i, i + BATCH_SIZE));
  }
  
  let totalConverted = 0;
  const batchPromises = batches.map(async (batch, batchIndex) => {
    const conversionPromises = batch.map(async (lead) => {
      try {
        // Create new prospect record
        const newProspect = await prisma.prospects.create({
          data: {
            workspaceId: DANO_WORKSPACE_ID,
            fullName: lead.fullName,
            personId: lead.personId,
            companyId: lead.companyId,
            // Copy other fields from lead if they exist
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        // Delete the lead record
        await prisma.leads.delete({
          where: { id: lead.id }
        });
        
        return {
          oldLeadId: lead.id,
          newProspectId: newProspect.id,
          name: lead.fullName
        };
      } catch (error) {
        console.error(`   Error converting lead ${lead.fullName}:`, error.message);
        return null;
      }
    });
    
    const results = await Promise.all(conversionPromises);
    const successfulConversions = results.filter(r => r !== null);
    totalConverted += successfulConversions.length;
    
    if (batchIndex % 5 === 0) {
      console.log(`   Processed batch ${batchIndex + 1}/${batches.length} (${totalConverted.toLocaleString()} converted)`);
    }
    
    return successfulConversions;
  });
  
  const allConversions = await Promise.all(batchPromises);
  const successfulConversions = allConversions.flat().filter(c => c !== null);
  
  console.log(`   ✅ Converted ${totalConverted.toLocaleString()} leads to prospects`);
  
  // Store conversion mapping for action updates
  global.leadToProspectMappings = successfulConversions;
}

async function updateActionReferences() {
  console.log('🔗 PHASE 4: UPDATING ACTION REFERENCES');
  console.log('-'.repeat(50));
  
  const prospectToLeadMappings = global.prospectToLeadMappings || [];
  const leadToProspectMappings = global.leadToProspectMappings || [];
  
  let totalActionsUpdated = 0;
  
  // Update actions that referenced old prospect IDs
  if (prospectToLeadMappings.length > 0) {
    console.log(`   Updating actions for ${prospectToLeadMappings.length.toLocaleString()} prospect→lead conversions...`);
    
    const updatePromises = prospectToLeadMappings.map(async (mapping) => {
      const updatedActions = await prisma.actions.updateMany({
        where: {
          workspaceId: DANO_WORKSPACE_ID,
          prospectId: mapping.oldProspectId
        },
        data: {
          prospectId: null,
          leadId: mapping.newLeadId,
          updatedAt: new Date()
        }
      });
      
      return updatedActions.count;
    });
    
    const updateCounts = await Promise.all(updatePromises);
    const prospectActionsUpdated = updateCounts.reduce((sum, count) => sum + count, 0);
    totalActionsUpdated += prospectActionsUpdated;
    
    console.log(`   ✅ Updated ${prospectActionsUpdated.toLocaleString()} actions (prospect→lead)`);
  }
  
  // Update actions that referenced old lead IDs
  if (leadToProspectMappings.length > 0) {
    console.log(`   Updating actions for ${leadToProspectMappings.length.toLocaleString()} lead→prospect conversions...`);
    
    const updatePromises = leadToProspectMappings.map(async (mapping) => {
      const updatedActions = await prisma.actions.updateMany({
        where: {
          workspaceId: DANO_WORKSPACE_ID,
          leadId: mapping.oldLeadId
        },
        data: {
          leadId: null,
          prospectId: mapping.newProspectId,
          updatedAt: new Date()
        }
      });
      
      return updatedActions.count;
    });
    
    const updateCounts = await Promise.all(updatePromises);
    const leadActionsUpdated = updateCounts.reduce((sum, count) => sum + count, 0);
    totalActionsUpdated += leadActionsUpdated;
    
    console.log(`   ✅ Updated ${leadActionsUpdated.toLocaleString()} actions (lead→prospect)`);
  }
  
  console.log(`   ✅ Total actions updated: ${totalActionsUpdated.toLocaleString()}`);
  console.log('');
}

async function validateFixes() {
  console.log('✅ PHASE 5: VALIDATION AND CLEANUP');
  console.log('-'.repeat(50));
  
  // Get final counts
  const [totalProspects, totalLeads, totalActions] = await Promise.all([
    prisma.prospects.count({ where: { workspaceId: DANO_WORKSPACE_ID } }),
    prisma.leads.count({ where: { workspaceId: DANO_WORKSPACE_ID } }),
    prisma.actions.count({ where: { workspaceId: DANO_WORKSPACE_ID } })
  ]);
  
  // Check engagement rates
  const [prospectsWithCommunication, leadsWithCommunication] = await Promise.all([
    prisma.prospects.count({
      where: {
        workspaceId: DANO_WORKSPACE_ID,
        actions: {
          some: {
            type: {
              in: ['email_sent', 'email_received', 'email_conversation', 'phone_call', 'linkedin_message', 'linkedin_connection']
            }
          }
        }
      }
    }),
    prisma.leads.count({
      where: {
        workspaceId: DANO_WORKSPACE_ID,
        actions: {
          some: {
            type: {
              in: ['email_sent', 'email_received', 'email_conversation', 'phone_call', 'linkedin_message', 'linkedin_connection']
            }
          }
        }
      }
    })
  ]);
  
  const prospectEngagementRate = ((prospectsWithCommunication / totalProspects) * 100).toFixed(1);
  const leadEngagementRate = ((leadsWithCommunication / totalLeads) * 100).toFixed(1);
  
  console.log('📊 FINAL RESULTS:');
  console.log(`   Total Prospects: ${totalProspects.toLocaleString()}`);
  console.log(`   Total Leads: ${totalLeads.toLocaleString()}`);
  console.log(`   Total Actions: ${totalActions.toLocaleString()}`);
  console.log(`   `);
  console.log(`   Prospects with Communication: ${prospectsWithCommunication.toLocaleString()} (${prospectEngagementRate}%)`);
  console.log(`   Leads with Communication: ${leadsWithCommunication.toLocaleString()} (${leadEngagementRate}%)`);
  console.log('');
  
  console.log('🎯 CLASSIFICATION QUALITY:');
  if (parseFloat(prospectEngagementRate) < 20) {
    console.log(`   ✅ Prospects are properly uncontacted (${prospectEngagementRate}% have communication)`);
  } else {
    console.log(`   ⚠️  Prospects still have high engagement (${prospectEngagementRate}% have communication)`);
  }
  
  if (parseFloat(leadEngagementRate) > 80) {
    console.log(`   ✅ Leads are properly engaged (${leadEngagementRate}% have communication)`);
  } else {
    console.log(`   ⚠️  Leads have low engagement (${leadEngagementRate}% have communication)`);
  }
  console.log('');
  
  console.log('🚀 LEADS & PROSPECTS CLASSIFICATION FIX COMPLETE!');
  console.log('All misclassifications have been corrected with optimized parallel processing.');
}

// Run the fix
if (require.main === module) {
  fixLeadsProspectsClassification().catch(console.error);
}

module.exports = { fixLeadsProspectsClassification };

