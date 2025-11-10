const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSchema() {
  try {
    // Test if mainSellerId exists
    const company = await prisma.companies.findFirst({
      where: { workspaceId: '01K9QAP09FHT6EAP1B4G2KP3D2' },
      select: {
        id: true,
        name: true,
        mainSellerId: true,
        companyIntelligence: true
      }
    });
    
    console.log('✅ Schema test passed');
    console.log('Company:', company?.name);
    console.log('mainSellerId:', company?.mainSellerId);
    console.log('companyIntelligence:', company?.companyIntelligence ? 'exists' : 'null');
    
  } catch (error) {
    console.error('❌ Schema test failed:', error.message);
    if (error.message.includes('mainSellerId')) {
      console.error('   → mainSellerId column issue');
    }
    if (error.message.includes('companyIntelligence')) {
      console.error('   → companyIntelligence column issue');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testSchema();

