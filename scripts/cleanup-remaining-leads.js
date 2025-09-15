#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const NOTARY_WORKSPACE_ID = '01K1VBYmf75hgmvmz06psnc9ug';

async function cleanupRemainingLeads() {
  try {
    console.log('🧹 Cleaning up remaining leads in Notary Everyday workspace...');
    
    // Get all remaining leads
    const remainingLeads = await prisma.leads.findMany({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        company: true,
        email: true,
        workEmail: true,
        personalEmail: true
      }
    });
    
    console.log(`📊 Found ${remainingLeads.length} remaining leads to clean up`);
    
    if (remainingLeads.length === 0) {
      console.log('✅ No leads to clean up');
      return;
    }
    
    let cleanedCount = 0;
    let skippedCount = 0;
    
    // Process leads in batches
    const batchSize = 50;
    for (let i = 0; i < remainingLeads.length; i += batchSize) {
      const batch = remainingLeads.slice(i, i + batchSize);
      
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(remainingLeads.length / batchSize)} (${batch.length} leads)`);
      
      for (const lead of batch) {
        try {
          // Check if prospect exists for this lead
          const emails = [lead.email, lead.workEmail, lead.personalEmail].filter(Boolean);
          let prospectExists = false;
          
          // Check by name first
          const prospectByName = await prisma.prospects.findFirst({
            where: {
              workspaceId: NOTARY_WORKSPACE_ID,
              fullName: lead.fullName,
              deletedAt: null
            }
          });
          
          if (prospectByName) {
            prospectExists = true;
          } else if (emails.length > 0) {
            // Check by email
            const prospectByEmail = await prisma.prospects.findFirst({
              where: {
                workspaceId: NOTARY_WORKSPACE_ID,
                OR: emails.map(email => ({ email: email }))
                  .concat(emails.map(email => ({ workEmail: email })))
                  .concat(emails.map(email => ({ personalEmail: email }))),
                deletedAt: null
              }
            });
            
            if (prospectByEmail) {
              prospectExists = true;
            }
          }
          
          if (prospectExists) {
            // Soft delete the lead since prospect exists
            await prisma.leads.update({
              where: { id: lead.id },
              data: { 
                deletedAt: new Date(),
                updatedAt: new Date()
              }
            });
            cleanedCount++;
          } else {
            console.log(`⚠️  No prospect found for lead: ${lead.fullName}`);
            skippedCount++;
          }
          
          if (cleanedCount % 50 === 0) {
            console.log(`✅ Cleaned up ${cleanedCount} leads so far...`);
          }
          
        } catch (error) {
          console.error(`❌ Error processing lead ${lead.fullName}:`, error.message);
        }
      }
      
      // Small delay between batches
      if (i + batchSize < remainingLeads.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`\n🎉 Cleanup complete!`);
    console.log(`✅ Soft-deleted leads: ${cleanedCount}`);
    console.log(`⚠️  Skipped leads: ${skippedCount}`);
    
    // Final verification
    const finalLeadCount = await prisma.leads.count({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        deletedAt: null
      }
    });
    
    const finalProspectCount = await prisma.prospects.count({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        deletedAt: null
      }
    });
    
    console.log(`\n📊 Final counts:`);
    console.log(`- Remaining leads: ${finalLeadCount}`);
    console.log(`- Total prospects: ${finalProspectCount}`);
    
  } catch (error) {
    console.error('❌ Fatal error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupRemainingLeads();
