const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const RETAIL_WORKSPACE_ID = '01K1VBYV8ETM2RCQA4GNN9EG72';
const BATCH_SIZE = 50;

async function fixLeadProspectOverlap() {
  try {
    console.log('🔧 FIXING LEAD-PROSPECT OVERLAP');
    console.log('='.repeat(50));
    console.log('📋 Ensuring leads + prospects = people (no overlaps)');
    console.log('='.repeat(50));
    
    // Step 1: Get current counts
    console.log('\n📊 CURRENT COUNTS');
    console.log('='.repeat(30));
    
    const [totalPeople, totalLeads, totalProspects] = await Promise.all([
      prisma.people.count({ where: { workspaceId: RETAIL_WORKSPACE_ID } }),
      prisma.leads.count({ where: { workspaceId: RETAIL_WORKSPACE_ID } }),
      prisma.prospects.count({ where: { workspaceId: RETAIL_WORKSPACE_ID } })
    ]);
    
    console.log(`👥 Total People: ${totalPeople}`);
    console.log(`🎯 Total Leads: ${totalLeads}`);
    console.log(`🔍 Total Prospects: ${totalProspects}`);
    console.log(`📊 Current Total: ${totalLeads + totalProspects}`);
    console.log(`⚠️  Overlap: ${(totalLeads + totalProspects) - totalPeople} records`);
    
    // Step 2: Find overlaps (people who are both leads and prospects)
    console.log('\n🔍 FINDING OVERLAPS');
    console.log('='.repeat(30));
    
    const overlaps = await prisma.$queryRaw`
      SELECT DISTINCT l."personId"
      FROM leads l
      JOIN prospects p ON l."personId" = p."personId"
      WHERE l."workspaceId" = ${RETAIL_WORKSPACE_ID}
      AND p."workspaceId" = ${RETAIL_WORKSPACE_ID}
    `;
    
    console.log(`⚠️  Found ${overlaps.length} people who are both leads and prospects`);
    
    if (overlaps.length === 0) {
      console.log('🎉 No overlaps found! Data is already clean.');
      return;
    }
    
    // Step 3: Strategy - Keep leads, remove overlapping prospects
    console.log('\n🎯 STRATEGY: Keep leads, remove overlapping prospects');
    console.log('='.repeat(50));
    console.log('This will ensure each person is either a lead OR a prospect, not both.');
    
    // Step 4: Remove overlapping prospects in batches
    console.log('\n🗑️  REMOVING OVERLAPPING PROSPECTS');
    console.log('='.repeat(40));
    
    let removedCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < overlaps.length; i += BATCH_SIZE) {
      const batch = overlaps.slice(i, i + BATCH_SIZE);
      const personIds = batch.map(overlap => overlap.personId);
      
      console.log(`\n📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(overlaps.length / BATCH_SIZE)} (${batch.length} records)`);
      
      try {
        const result = await prisma.prospects.deleteMany({
          where: {
            workspaceId: RETAIL_WORKSPACE_ID,
            personId: { in: personIds }
          }
        });
        
        removedCount += result.count;
        console.log(`✅ Removed ${result.count} overlapping prospects`);
        
      } catch (error) {
        console.error(`❌ Error removing prospects:`, error.message);
        errorCount += batch.length;
      }
    }
    
    // Step 5: Final verification
    console.log('\n🎯 FINAL VERIFICATION');
    console.log('='.repeat(40));
    
    const [finalPeople, finalLeads, finalProspects] = await Promise.all([
      prisma.people.count({ where: { workspaceId: RETAIL_WORKSPACE_ID } }),
      prisma.leads.count({ where: { workspaceId: RETAIL_WORKSPACE_ID } }),
      prisma.prospects.count({ where: { workspaceId: RETAIL_WORKSPACE_ID } })
    ]);
    
    console.log('\n📊 FINAL RESULTS');
    console.log('='.repeat(30));
    console.log(`👥 Total People: ${finalPeople}`);
    console.log(`🎯 Total Leads: ${finalLeads}`);
    console.log(`🔍 Total Prospects: ${finalProspects}`);
    console.log(`📊 Total Leads + Prospects: ${finalLeads + finalProspects}`);
    
    console.log('\n🎉 CLEANUP SUMMARY');
    console.log('='.repeat(30));
    console.log(`✅ Overlapping prospects removed: ${removedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
    // Check if we achieved the goal
    if (finalLeads + finalProspects === finalPeople) {
      console.log('\n🎉 PERFECT! Leads + Prospects = People');
      console.log(`✅ ${finalLeads} leads + ${finalProspects} prospects = ${finalPeople} people`);
      console.log('✅ No overlaps remaining!');
    } else {
      console.log(`\n⚠️  Still have ${(finalLeads + finalProspects) - finalPeople} extra records`);
    }
    
    // Show the distribution
    const leadPercentage = ((finalLeads / finalPeople) * 100).toFixed(1);
    const prospectPercentage = ((finalProspects / finalPeople) * 100).toFixed(1);
    
    console.log('\n📊 DISTRIBUTION');
    console.log('='.repeat(20));
    console.log(`🎯 Leads: ${finalLeads} (${leadPercentage}%)`);
    console.log(`🔍 Prospects: ${finalProspects} (${prospectPercentage}%)`);
    console.log(`👥 Total People: ${finalPeople} (100%)`);
    
  } catch (error) {
    console.error('❌ Error fixing lead-prospect overlap:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixLeadProspectOverlap();
