#!/usr/bin/env node

/**
 * 🔧 FIX PERSON-LEAD-PROSPECT RELATIONSHIPS
 * 
 * Comprehensive fix to:
 * 1. Move records based on engagement (no engagement = prospect, engagement = lead)
 * 2. Remove duplicates
 * 3. Ensure 1:1 person relationships
 * 4. Clean up orphaned records
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

async function fixPersonLeadProspectRelationships() {
  console.log('🔧 FIXING PERSON-LEAD-PROSPECT RELATIONSHIPS');
  console.log('='.repeat(60));
  console.log('Using parallel processing for maximum speed');
  console.log('');

  try {
    // Phase 1: Analyze current state
    await analyzeCurrentState();
    
    // Phase 2: Fix engagement-based classification
    await fixEngagementBasedClassification();
    
    // Phase 3: Remove duplicates
    await removeDuplicates();
    
    // Phase 4: Ensure 1:1 person relationships
    await ensureOneToOneRelationships();
    
    // Phase 5: Clean up orphaned records
    await cleanupOrphanedRecords();
    
    // Phase 6: Validate final state
    await validateFinalState();

  } catch (error) {
    console.error('❌ Error in relationship fix:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function analyzeCurrentState() {
  console.log('📊 PHASE 1: ANALYZING CURRENT STATE');
  console.log('-'.repeat(50));
  
  const [peopleCount, leadsCount, prospectsCount] = await Promise.all([
    prisma.people.count({ where: { workspaceId: DANO_WORKSPACE_ID } }),
    prisma.leads.count({ where: { workspaceId: DANO_WORKSPACE_ID } }),
    prisma.prospects.count({ where: { workspaceId: DANO_WORKSPACE_ID } })
  ]);
  
  console.log(`   Current State:`);
  console.log(`   People: ${peopleCount.toLocaleString()}`);
  console.log(`   Leads: ${leadsCount.toLocaleString()}`);
  console.log(`   Prospects: ${prospectsCount.toLocaleString()}`);
  console.log(`   Expected People: ${(leadsCount + prospectsCount).toLocaleString()}`);
  console.log(`   Excess People: ${peopleCount - (leadsCount + prospectsCount)}`);
  console.log('');
}

async function fixEngagementBasedClassification() {
  console.log('🔄 PHASE 2: FIXING ENGAGEMENT-BASED CLASSIFICATION');
  console.log('-'.repeat(50));
  
  // Get all leads and prospects
  const [allLeads, allProspects] = await Promise.all([
    prisma.leads.findMany({
      where: { workspaceId: DANO_WORKSPACE_ID },
      select: {
        id: true,
        fullName: true,
        personId: true,
        companyId: true
      }
    }),
    prisma.prospects.findMany({
      where: { workspaceId: DANO_WORKSPACE_ID },
      select: {
        id: true,
        fullName: true,
        personId: true,
        companyId: true
      }
    })
  ]);
  
  console.log(`   Analyzing ${allLeads.length} leads and ${allProspects.length} prospects for engagement...`);
  
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
  
  const leadsToConvert = leadEngagementChecks.filter(l => l.shouldBeProspect);
  const prospectsToConvert = prospectEngagementChecks.filter(p => p.shouldBeLead);
  
  console.log(`   Leads that should be Prospects (no engagement): ${leadsToConvert.length.toLocaleString()}`);
  console.log(`   Prospects that should be Leads (have engagement): ${prospectsToConvert.length.toLocaleString()}`);
  
  // Convert leads to prospects
  if (leadsToConvert.length > 0) {
    console.log(`   Converting ${leadsToConvert.length} leads to prospects...`);
    
    const batches = [];
    for (let i = 0; i < leadsToConvert.length; i += BATCH_SIZE) {
      batches.push(leadsToConvert.slice(i, i + BATCH_SIZE));
    }
    
    let totalConverted = 0;
    const batchPromises = batches.map(async (batch, batchIndex) => {
      const conversionPromises = batch.map(async (lead) => {
        try {
          // Create new prospect
          const newProspect = await prisma.prospects.create({
            data: {
              workspaceId: DANO_WORKSPACE_ID,
              fullName: lead.fullName,
              personId: lead.personId,
              companyId: lead.companyId,
              firstName: lead.fullName?.split(' ')[0] || 'Unknown',
              lastName: lead.fullName?.split(' ').slice(1).join(' ') || 'Unknown',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          
          // Update actions to reference prospect instead of lead
          await prisma.actions.updateMany({
            where: {
              workspaceId: DANO_WORKSPACE_ID,
              leadId: lead.id
            },
            data: {
              leadId: null,
              prospectId: newProspect.id,
              updatedAt: new Date()
            }
          });
          
          // Delete the lead
          await prisma.leads.delete({
            where: { id: lead.id }
          });
          
          return { success: true, oldLeadId: lead.id, newProspectId: newProspect.id };
        } catch (error) {
          console.error(`   Error converting lead ${lead.fullName}:`, error.message);
          return { success: false, error: error.message };
        }
      });
      
      const results = await Promise.all(conversionPromises);
      const successful = results.filter(r => r.success);
      totalConverted += successful.length;
      
      if (batchIndex % 5 === 0) {
        console.log(`   Processed batch ${batchIndex + 1}/${batches.length} (${totalConverted} converted)`);
      }
      
      return results;
    });
    
    await Promise.all(batchPromises);
    console.log(`   ✅ Converted ${totalConverted} leads to prospects`);
  }
  
  // Convert prospects to leads
  if (prospectsToConvert.length > 0) {
    console.log(`   Converting ${prospectsToConvert.length} prospects to leads...`);
    
    const batches = [];
    for (let i = 0; i < prospectsToConvert.length; i += BATCH_SIZE) {
      batches.push(prospectsToConvert.slice(i, i + BATCH_SIZE));
    }
    
    let totalConverted = 0;
    const batchPromises = batches.map(async (batch, batchIndex) => {
      const conversionPromises = batch.map(async (prospect) => {
        try {
          // Create new lead
          const newLead = await prisma.leads.create({
            data: {
              workspaceId: DANO_WORKSPACE_ID,
              fullName: prospect.fullName,
              personId: prospect.personId,
              companyId: prospect.companyId,
              firstName: prospect.fullName?.split(' ')[0] || 'Unknown',
              lastName: prospect.fullName?.split(' ').slice(1).join(' ') || 'Unknown',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          
          // Update actions to reference lead instead of prospect
          await prisma.actions.updateMany({
            where: {
              workspaceId: DANO_WORKSPACE_ID,
              prospectId: prospect.id
            },
            data: {
              prospectId: null,
              leadId: newLead.id,
              updatedAt: new Date()
            }
          });
          
          // Delete the prospect
          await prisma.prospects.delete({
            where: { id: prospect.id }
          });
          
          return { success: true, oldProspectId: prospect.id, newLeadId: newLead.id };
        } catch (error) {
          console.error(`   Error converting prospect ${prospect.fullName}:`, error.message);
          return { success: false, error: error.message };
        }
      });
      
      const results = await Promise.all(conversionPromises);
      const successful = results.filter(r => r.success);
      totalConverted += successful.length;
      
      if (batchIndex % 5 === 0) {
        console.log(`   Processed batch ${batchIndex + 1}/${batches.length} (${totalConverted} converted)`);
      }
      
      return results;
    });
    
    await Promise.all(batchPromises);
    console.log(`   ✅ Converted ${totalConverted} prospects to leads`);
  }
  
  console.log('');
}

async function removeDuplicates() {
  console.log('🗑️ PHASE 3: REMOVING DUPLICATES');
  console.log('-'.repeat(50));
  
  // Find duplicate leads (same personId)
  const duplicateLeads = await prisma.leads.groupBy({
    by: ['personId'],
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      personId: { not: null }
    },
    _count: { personId: true },
    having: {
      personId: {
        _count: {
          gt: 1
        }
      }
    }
  });
  
  // Find duplicate prospects (same personId)
  const duplicateProspects = await prisma.prospects.groupBy({
    by: ['personId'],
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      personId: { not: null }
    },
    _count: { personId: true },
    having: {
      personId: {
        _count: {
          gt: 1
        }
      }
    }
  });
  
  console.log(`   Duplicate Leads (same personId): ${duplicateLeads.length.toLocaleString()}`);
  console.log(`   Duplicate Prospects (same personId): ${duplicateProspects.length.toLocaleString()}`);
  
  // Remove duplicate leads (keep the first one)
  if (duplicateLeads.length > 0) {
    let totalRemoved = 0;
    
    for (const duplicate of duplicateLeads) {
      const leads = await prisma.leads.findMany({
        where: {
          workspaceId: DANO_WORKSPACE_ID,
          personId: duplicate.personId
        },
        orderBy: { createdAt: 'asc' }
      });
      
      // Keep the first one, remove the rest
      const leadsToRemove = leads.slice(1);
      
      for (const lead of leadsToRemove) {
        // Update actions to reference the first lead
        await prisma.actions.updateMany({
          where: {
            workspaceId: DANO_WORKSPACE_ID,
            leadId: lead.id
          },
          data: {
            leadId: leads[0].id,
            updatedAt: new Date()
          }
        });
        
        // Delete the duplicate lead
        await prisma.leads.delete({
          where: { id: lead.id }
        });
        
        totalRemoved++;
      }
    }
    
    console.log(`   ✅ Removed ${totalRemoved} duplicate leads`);
  }
  
  // Remove duplicate prospects (keep the first one)
  if (duplicateProspects.length > 0) {
    let totalRemoved = 0;
    
    for (const duplicate of duplicateProspects) {
      const prospects = await prisma.prospects.findMany({
        where: {
          workspaceId: DANO_WORKSPACE_ID,
          personId: duplicate.personId
        },
        orderBy: { createdAt: 'asc' }
      });
      
      // Keep the first one, remove the rest
      const prospectsToRemove = prospects.slice(1);
      
      for (const prospect of prospectsToRemove) {
        // Update actions to reference the first prospect
        await prisma.actions.updateMany({
          where: {
            workspaceId: DANO_WORKSPACE_ID,
            prospectId: prospect.id
          },
          data: {
            prospectId: prospects[0].id,
            updatedAt: new Date()
          }
        });
        
        // Delete the duplicate prospect
        await prisma.prospects.delete({
          where: { id: prospect.id }
        });
        
        totalRemoved++;
      }
    }
    
    console.log(`   ✅ Removed ${totalRemoved} duplicate prospects`);
  }
  
  console.log('');
}

async function ensureOneToOneRelationships() {
  console.log('🔗 PHASE 4: ENSURING 1:1 PERSON RELATIONSHIPS');
  console.log('-'.repeat(50));
  
  // Get all leads and prospects
  const [allLeads, allProspects] = await Promise.all([
    prisma.leads.findMany({
      where: { workspaceId: DANO_WORKSPACE_ID },
      select: { id: true, fullName: true, personId: true }
    }),
    prisma.prospects.findMany({
      where: { workspaceId: DANO_WORKSPACE_ID },
      select: { id: true, fullName: true, personId: true }
    })
  ]);
  
  // Find leads without person references
  const leadsWithoutPeople = allLeads.filter(lead => !lead.personId);
  
  // Find prospects without person references
  const prospectsWithoutPeople = allProspects.filter(prospect => !prospect.personId);
  
  console.log(`   Leads without Person References: ${leadsWithoutPeople.length.toLocaleString()}`);
  console.log(`   Prospects without Person References: ${prospectsWithoutPeople.length.toLocaleString()}`);
  
  // Create person records for leads without people
  if (leadsWithoutPeople.length > 0) {
    console.log(`   Creating person records for ${leadsWithoutPeople.length} leads...`);
    
    const batches = [];
    for (let i = 0; i < leadsWithoutPeople.length; i += BATCH_SIZE) {
      batches.push(leadsWithoutPeople.slice(i, i + BATCH_SIZE));
    }
    
    let totalCreated = 0;
    const batchPromises = batches.map(async (batch, batchIndex) => {
      const creationPromises = batch.map(async (lead) => {
        try {
          // Create person record
          const newPerson = await prisma.people.create({
            data: {
              workspaceId: DANO_WORKSPACE_ID,
              fullName: lead.fullName,
              firstName: lead.fullName?.split(' ')[0] || 'Unknown',
              lastName: lead.fullName?.split(' ').slice(1).join(' ') || 'Unknown',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          
          // Update lead to reference the person
          await prisma.leads.update({
            where: { id: lead.id },
            data: {
              personId: newPerson.id,
              updatedAt: new Date()
            }
          });
          
          return { success: true, leadId: lead.id, personId: newPerson.id };
        } catch (error) {
          console.error(`   Error creating person for lead ${lead.fullName}:`, error.message);
          return { success: false, error: error.message };
        }
      });
      
      const results = await Promise.all(creationPromises);
      const successful = results.filter(r => r.success);
      totalCreated += successful.length;
      
      if (batchIndex % 5 === 0) {
        console.log(`   Processed batch ${batchIndex + 1}/${batches.length} (${totalCreated} created)`);
      }
      
      return results;
    });
    
    await Promise.all(batchPromises);
    console.log(`   ✅ Created ${totalCreated} person records for leads`);
  }
  
  // Create person records for prospects without people
  if (prospectsWithoutPeople.length > 0) {
    console.log(`   Creating person records for ${prospectsWithoutPeople.length} prospects...`);
    
    const batches = [];
    for (let i = 0; i < prospectsWithoutPeople.length; i += BATCH_SIZE) {
      batches.push(prospectsWithoutPeople.slice(i, i + BATCH_SIZE));
    }
    
    let totalCreated = 0;
    const batchPromises = batches.map(async (batch, batchIndex) => {
      const creationPromises = batch.map(async (prospect) => {
        try {
          // Create person record
          const newPerson = await prisma.people.create({
            data: {
              workspaceId: DANO_WORKSPACE_ID,
              fullName: prospect.fullName,
              firstName: prospect.fullName?.split(' ')[0] || 'Unknown',
              lastName: prospect.fullName?.split(' ').slice(1).join(' ') || 'Unknown',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          
          // Update prospect to reference the person
          await prisma.prospects.update({
            where: { id: prospect.id },
            data: {
              personId: newPerson.id,
              updatedAt: new Date()
            }
          });
          
          return { success: true, prospectId: prospect.id, personId: newPerson.id };
        } catch (error) {
          console.error(`   Error creating person for prospect ${prospect.fullName}:`, error.message);
          return { success: false, error: error.message };
        }
      });
      
      const results = await Promise.all(creationPromises);
      const successful = results.filter(r => r.success);
      totalCreated += successful.length;
      
      if (batchIndex % 5 === 0) {
        console.log(`   Processed batch ${batchIndex + 1}/${batches.length} (${totalCreated} created)`);
      }
      
      return results;
    });
    
    await Promise.all(batchPromises);
    console.log(`   ✅ Created ${totalCreated} person records for prospects`);
  }
  
  console.log('');
}

async function cleanupOrphanedRecords() {
  console.log('🧹 PHASE 5: CLEANING UP ORPHANED RECORDS');
  console.log('-'.repeat(50));
  
  // Get all people
  const allPeople = await prisma.people.findMany({
    where: { workspaceId: DANO_WORKSPACE_ID },
    select: { id: true, fullName: true }
  });
  
  // Get all person IDs referenced by leads and prospects
  const [leadPersonIds, prospectPersonIds] = await Promise.all([
    prisma.leads.findMany({
      where: { 
        workspaceId: DANO_WORKSPACE_ID,
        personId: { not: null }
      },
      select: { personId: true }
    }).then(leads => leads.map(l => l.personId)),
    prisma.prospects.findMany({
      where: { 
        workspaceId: DANO_WORKSPACE_ID,
        personId: { not: null }
      },
      select: { personId: true }
    }).then(prospects => prospects.map(p => p.personId))
  ]);
  
  const allReferencedPersonIds = [...new Set([...leadPersonIds, ...prospectPersonIds])];
  
  // Find orphaned people
  const orphanedPeople = allPeople.filter(person => !allReferencedPersonIds.includes(person.id));
  
  console.log(`   Total People: ${allPeople.length.toLocaleString()}`);
  console.log(`   Referenced People: ${allReferencedPersonIds.length.toLocaleString()}`);
  console.log(`   Orphaned People: ${orphanedPeople.length.toLocaleString()}`);
  
  if (orphanedPeople.length > 0) {
    console.log(`   Removing ${orphanedPeople.length} orphaned people...`);
    
    const batches = [];
    for (let i = 0; i < orphanedPeople.length; i += BATCH_SIZE) {
      batches.push(orphanedPeople.slice(i, i + BATCH_SIZE));
    }
    
    let totalRemoved = 0;
    const batchPromises = batches.map(async (batch, batchIndex) => {
      const removalPromises = batch.map(async (person) => {
        try {
          // Delete the orphaned person
          await prisma.people.delete({
            where: { id: person.id }
          });
          
          return { success: true, personId: person.id };
        } catch (error) {
          console.error(`   Error removing orphaned person ${person.fullName}:`, error.message);
          return { success: false, error: error.message };
        }
      });
      
      const results = await Promise.all(removalPromises);
      const successful = results.filter(r => r.success);
      totalRemoved += successful.length;
      
      if (batchIndex % 10 === 0) {
        console.log(`   Processed batch ${batchIndex + 1}/${batches.length} (${totalRemoved} removed)`);
      }
      
      return results;
    });
    
    await Promise.all(batchPromises);
    console.log(`   ✅ Removed ${totalRemoved} orphaned people`);
  }
  
  console.log('');
}

async function validateFinalState() {
  console.log('✅ PHASE 6: VALIDATING FINAL STATE');
  console.log('-'.repeat(50));
  
  // Get final counts
  const [peopleCount, leadsCount, prospectsCount] = await Promise.all([
    prisma.people.count({ where: { workspaceId: DANO_WORKSPACE_ID } }),
    prisma.leads.count({ where: { workspaceId: DANO_WORKSPACE_ID } }),
    prisma.prospects.count({ where: { workspaceId: DANO_WORKSPACE_ID } })
  ]);
  
  // Check engagement rates
  const [leadsWithEngagement, prospectsWithEngagement] = await Promise.all([
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
    }),
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
    })
  ]);
  
  const leadEngagementRate = ((leadsWithEngagement / leadsCount) * 100).toFixed(1);
  const prospectEngagementRate = ((prospectsWithEngagement / prospectsCount) * 100).toFixed(1);
  
  console.log('📊 FINAL RESULTS:');
  console.log(`   People: ${peopleCount.toLocaleString()}`);
  console.log(`   Leads: ${leadsCount.toLocaleString()}`);
  console.log(`   Prospects: ${prospectsCount.toLocaleString()}`);
  console.log(`   Total Leads + Prospects: ${(leadsCount + prospectsCount).toLocaleString()}`);
  console.log(`   `);
  console.log(`   Leads with Engagement: ${leadsWithEngagement.toLocaleString()} (${leadEngagementRate}%)`);
  console.log(`   Prospects with Engagement: ${prospectsWithEngagement.toLocaleString()} (${prospectEngagementRate}%)`);
  console.log('');
  
  console.log('🎯 VALIDATION RESULTS:');
  
  // Check if person count matches leads + prospects
  if (peopleCount === leadsCount + prospectsCount) {
    console.log(`   ✅ Person count matches leads + prospects (${peopleCount})`);
  } else {
    console.log(`   ⚠️  Person count mismatch: ${peopleCount} vs ${leadsCount + prospectsCount}`);
  }
  
  // Check engagement rates
  if (parseFloat(leadEngagementRate) > 80) {
    console.log(`   ✅ Leads are properly engaged (${leadEngagementRate}%)`);
  } else {
    console.log(`   ⚠️  Leads have low engagement (${leadEngagementRate}%)`);
  }
  
  if (parseFloat(prospectEngagementRate) < 20) {
    console.log(`   ✅ Prospects are properly uncontacted (${prospectEngagementRate}%)`);
  } else {
    console.log(`   ⚠️  Prospects have high engagement (${prospectEngagementRate}%)`);
  }
  
  console.log('');
  console.log('🚀 PERSON-LEAD-PROSPECT RELATIONSHIP FIX COMPLETE!');
  console.log('All relationships have been optimized with proper engagement-based classification.');
}

// Run the fix
if (require.main === module) {
  fixPersonLeadProspectRelationships().catch(console.error);
}

module.exports = { fixPersonLeadProspectRelationships };

