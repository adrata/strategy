const { PrismaClient } = require('@prisma/client');
const { SmartBuyerGroupPipeline } = require('../_future_now/find-buyer-group/index.js');

const prisma = new PrismaClient();

async function testSketchUpFix() {
  try {
    console.log('🔧 Testing SketchUp fix...\n');
    
    const workspaceId = '01K7464TNANHQXPCZT1FYX205V';
    
    // Find SketchUp company
    const company = await prisma.companies.findFirst({
      where: {
        name: {
          contains: 'SketchUp',
          mode: 'insensitive'
        }
      }
    });
    
    if (!company) {
      console.log('❌ SketchUp company not found');
      return;
    }
    
    console.log(`📋 Found: ${company.name} (${company.website})`);
    console.log(`   LinkedIn: ${company.linkedinUrl}`);
    
    // Initialize pipeline
    const pipeline = new SmartBuyerGroupPipeline({
      workspaceId,
      dealSize: 150000,
      productCategory: 'sales',
      prisma: prisma
    });
    
    // Run pipeline with company object
    console.log(`🚀 Running pipeline for ${company.name}...`);
    const result = await pipeline.run(company);
    
    if (result && result.buyerGroup && result.buyerGroup.length > 0) {
      console.log(`\n✅ SUCCESS! Found ${result.buyerGroup.length} buyer group members:`);
      result.buyerGroup.forEach((member, index) => {
        console.log(`  ${index + 1}. ${member.name} - ${member.title} (${member.buyerGroupRole}) - Rank: ${member.globalRank || 'N/A'}`);
      });
    } else {
      console.log(`\n❌ No buyer group found for ${company.name}`);
      console.log(`   Result:`, result);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSketchUpFix();
