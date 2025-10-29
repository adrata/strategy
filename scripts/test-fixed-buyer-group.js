const { PrismaClient } = require('@prisma/client');
const { SmartBuyerGroupPipeline } = require('../_future_now/find-buyer-group/index.js');

const prisma = new PrismaClient();

async function testFixedPipeline() {
  try {
    console.log('🧪 Testing fixed buyer group pipeline...\n');
    
    // Test with SketchUp (subdomain issue)
    console.log('🔍 Testing SketchUp (subdomain fallback)...');
    const sketchupResult = await testCompany('SketchUp');
    console.log(`✅ SketchUp result: ${sketchupResult.buyerGroup?.length || 0} buyer group members\n`);
    
    // Test with XMPro (filtering issue)
    console.log('🔍 Testing XMPro (filtering fallback)...');
    const xmproResult = await testCompany('XMPro');
    console.log(`✅ XMPro result: ${xmproResult.buyerGroup?.length || 0} buyer group members\n`);
    
    // Test with a working company for comparison
    console.log('🔍 Testing Openprise (working company)...');
    const openpriseResult = await testCompany('Openprise');
    console.log(`✅ Openprise result: ${openpriseResult.buyerGroup?.length || 0} buyer group members\n`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function testCompany(companyName) {
  try {
    // Find company in database
    const company = await prisma.companies.findFirst({
      where: {
        name: {
          contains: companyName,
          mode: 'insensitive'
        }
      }
    });
    
    if (!company) {
      console.log(`❌ Company ${companyName} not found in database`);
      return { success: false };
    }
    
    console.log(`📋 Found company: ${company.name} (${company.website})`);
    
    // Initialize pipeline
    const pipeline = new SmartBuyerGroupPipeline({
      workspaceId: '01K7464TNANHQXPCZT1FYX205V', // adrata workspace
      dealSize: 150000,
      productCategory: 'sales',
      prisma: prisma
    });
    
    // Run pipeline
    const result = await pipeline.run(company);
    
    if (result.success && result.buyerGroup && result.buyerGroup.length > 0) {
      console.log(`✅ Success! Found ${result.buyerGroup.length} buyer group members:`);
      result.buyerGroup.forEach((member, index) => {
        console.log(`  ${index + 1}. ${member.name} - ${member.title} (${member.buyerGroupRole})`);
      });
    } else {
      console.log(`❌ No buyer group found for ${companyName}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }
    
    return result;
    
  } catch (error) {
    console.error(`❌ Error testing ${companyName}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Run the test
testFixedPipeline();

