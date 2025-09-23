const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugCustomFields() {
  try {
    console.log('🔍 DEBUGGING CUSTOM FIELDS STRUCTURE');
    console.log('====================================');

    // Get a few companies with custom fields
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
        customFields: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        customFields: true
      },
      take: 3
    });

    console.log(`📊 Found ${companies.length} companies with custom fields`);

    companies.forEach((company, i) => {
      console.log(`\n${i + 1}. ${company.name}:`);
      console.log('Custom Fields Structure:');
      console.log(JSON.stringify(company.customFields, null, 2));
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugCustomFields();
