const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProgress() {
  try {
    console.log('🔍 CHECKING ENRICHMENT PROGRESS...');
    console.log('=====================================');
    
    // Get total companies in TOP workspace
    const total = await prisma.companies.count({
      where: { workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP' }
    });
    
    // Get enriched companies (those with LinkedIn URL)
    const enriched = await prisma.companies.count({
      where: { 
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
        linkedinUrl: { not: null }
      }
    });
    
    // Get companies with descriptions
    const withDescriptions = await prisma.companies.count({
      where: { 
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
        description: { not: null }
      }
    });
    
    // Get companies with employee count
    const withEmployeeCount = await prisma.companies.count({
      where: { 
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
        employeeCount: { not: null }
      }
    });
    
    console.log(`📊 TOTAL COMPANIES: ${total}`);
    console.log(`✅ ENRICHED (LinkedIn): ${enriched}`);
    console.log(`📝 WITH DESCRIPTIONS: ${withDescriptions}`);
    console.log(`👥 WITH EMPLOYEE COUNT: ${withEmployeeCount}`);
    console.log(`📈 PROGRESS: ${Math.round((enriched/total)*100)}%`);
    
    if (enriched < total) {
      console.log(`\n🚀 READY FOR NEXT BATCH: ${total - enriched} companies remaining`);
    } else {
      console.log(`\n🎉 ALL COMPANIES ENRICHED!`);
    }
    
  } catch (error) {
    console.error('❌ Error checking progress:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkProgress();
