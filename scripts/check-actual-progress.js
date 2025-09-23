const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkActualProgress() {
  try {
    console.log('🔍 CHECKING ACTUAL ENRICHMENT PROGRESS...');
    console.log('==========================================');
    
    // Get total companies
    const total = await prisma.companies.count({
      where: { workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP' }
    });
    
    // Check different enrichment indicators
    const withLinkedIn = await prisma.companies.count({
      where: { 
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
        linkedinUrl: { not: null }
      }
    });
    
    const withDescription = await prisma.companies.count({
      where: { 
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
        description: { not: null }
      }
    });
    
    const withEmployeeCount = await prisma.companies.count({
      where: { 
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
        employeeCount: { not: null }
      }
    });
    
    const withCustomFields = await prisma.companies.count({
      where: { 
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
        customFields: { not: null }
      }
    });
    
    console.log(`📊 TOTAL COMPANIES: ${total}`);
    console.log(`🔗 WITH LINKEDIN URL: ${withLinkedIn}`);
    console.log(`📝 WITH DESCRIPTION: ${withDescription}`);
    console.log(`👥 WITH EMPLOYEE COUNT: ${withEmployeeCount}`);
    console.log(`📋 WITH CUSTOM FIELDS: ${withCustomFields}`);
    
    // Check a few sample companies
    const samples = await prisma.companies.findMany({
      where: { workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP' },
      select: {
        name: true,
        linkedinUrl: true,
        description: true,
        employeeCount: true,
        customFields: true
      },
      take: 5
    });
    
    console.log('\n📋 SAMPLE COMPANIES:');
    samples.forEach((company, i) => {
      console.log(`${i+1}. ${company.name}`);
      console.log(`   LinkedIn: ${company.linkedinUrl ? '✅' : '❌'}`);
      console.log(`   Description: ${company.description ? '✅' : '❌'}`);
      console.log(`   Employee Count: ${company.employeeCount ? '✅' : '❌'}`);
      console.log(`   Custom Fields: ${company.customFields ? '✅' : '❌'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkActualProgress();
