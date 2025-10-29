const { PrismaClient } = require('@prisma/client');
const { SmartBuyerGroupPipeline } = require('../_future_now/find-buyer-group/index.js');

const prisma = new PrismaClient();

async function fixZeroBuyerGroups() {
  try {
    console.log('🔧 Fixing companies with 0 buyer groups...\n');
    
    const workspaceId = '01K7464TNANHQXPCZT1FYX205V'; // adrata workspace
    
    // Companies that had 0 buyer groups
    const problemCompanies = [
      'SketchUp',
      'XMPro', 
      'Booksy'
    ];
    
    for (const companyName of problemCompanies) {
      console.log(`\n🔍 Processing ${companyName}...`);
      
      try {
        // Find company
        const company = await prisma.companies.findFirst({
          where: {
            name: {
              contains: companyName,
              mode: 'insensitive'
            }
          }
        });
        
        if (!company) {
          console.log(`❌ Company ${companyName} not found`);
          continue;
        }
        
        console.log(`📋 Found: ${company.name} (${company.website})`);
        
        // Initialize pipeline with improved logic
        const pipeline = new SmartBuyerGroupPipeline({
          workspaceId,
          dealSize: 150000,
          productCategory: 'sales',
          prisma: prisma
        });
        
        // Run pipeline
        console.log(`🚀 Running improved pipeline for ${company.name}...`);
        const result = await pipeline.run(company);
        
        if (result.success && result.buyerGroup && result.buyerGroup.length > 0) {
          console.log(`✅ SUCCESS! Found ${result.buyerGroup.length} buyer group members:`);
          result.buyerGroup.forEach((member, index) => {
            console.log(`  ${index + 1}. ${member.name} - ${member.title} (${member.buyerGroupRole}) - Rank: ${member.globalRank || 'N/A'}`);
          });
        } else {
          console.log(`❌ Still no buyer group found for ${companyName}`);
          if (result.error) {
            console.log(`   Error: ${result.error}`);
          }
        }
        
        // Small delay between companies
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Error processing ${companyName}:`, error.message);
      }
    }
    
    // Final summary
    console.log(`\n📊 Final Summary:`);
    
    const totalBuyerGroups = await prisma.buyerGroups.count({
      where: { workspaceId }
    });
    
    const totalBuyerGroupMembers = await prisma.people.count({
      where: {
        workspaceId,
        isBuyerGroupMember: true
      }
    });
    
    const peopleWithRanks = await prisma.people.count({
      where: {
        workspaceId,
        globalRank: { not: null }
      }
    });
    
    console.log(`🎯 Total buyer groups: ${totalBuyerGroups}`);
    console.log(`👥 Total buyer group members: ${totalBuyerGroupMembers}`);
    console.log(`📊 People with globalRank: ${peopleWithRanks}`);
    
  } catch (error) {
    console.error('❌ Error fixing zero buyer groups:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixZeroBuyerGroups();

