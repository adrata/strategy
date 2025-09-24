const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCompaniesNeedingEnrichment() {
  try {
    console.log('🔍 CHECKING COMPANIES THAT NEED ENRICHMENT');
    console.log('==========================================');

    const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

    // Use the same logic as the working script
    const companies = await prisma.$queryRawUnsafe(`
      SELECT id, name, website, description, size, industry, "linkedinUrl"
      FROM companies
      WHERE "workspaceId" = $1
        AND "deletedAt" IS NULL
        AND (description IS NULL OR size IS NULL OR "linkedinUrl" IS NULL)
      ORDER BY 
        CASE WHEN website IS NOT NULL AND website != '' THEN 0 ELSE 1 END,
        name
      LIMIT 50
    `, TOP_WORKSPACE_ID);

    console.log(`📊 Companies needing enrichment: ${companies.length}`);
    
    if (companies.length > 0) {
      console.log('\n📋 Sample companies needing enrichment:');
      companies.slice(0, 10).forEach((company, i) => {
        console.log(`${i+1}. ${company.name}`);
        console.log(`   Description: ${company.description ? '✅' : '❌'}`);
        console.log(`   Size: ${company.size ? '✅' : '❌'}`);
        console.log(`   LinkedIn: ${company.linkedinUrl ? '✅' : '❌'}`);
        console.log(`   Website: ${company.website || 'None'}`);
      });
    } else {
      console.log('\n🎉 NO COMPANIES NEED ENRICHMENT!');
      console.log('All companies that can be enriched have been enriched.');
    }

    // Also check total companies with CoreSignal data
    const coresignalCount = await prisma.companies.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          path: ['coresignalData'],
          not: null
        }
      }
    });

    console.log(`\n📊 Total companies with CoreSignal data: ${coresignalCount}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCompaniesNeedingEnrichment();