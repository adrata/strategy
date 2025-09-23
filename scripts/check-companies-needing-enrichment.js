const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function checkCompaniesNeedingEnrichment() {
  console.log('🔍 CHECKING COMPANIES THAT NEED ENRICHMENT');
  console.log('==========================================\n');

  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Get companies that need enrichment
    const companies = await prisma.$queryRawUnsafe(`
      SELECT id, name, website, description, size, industry, "linkedinUrl"
      FROM companies
      WHERE "workspaceId" = $1
        AND "deletedAt" IS NULL
        AND (description IS NULL OR size IS NULL OR "linkedinUrl" IS NULL)
      ORDER BY 
        CASE WHEN website IS NOT NULL AND website != '' THEN 0 ELSE 1 END,
        name
      LIMIT 10
    `, TOP_WORKSPACE_ID);

    console.log(`📊 Found ${companies.length} companies that need enrichment:\n`);

    companies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name}`);
      console.log(`   Website: ${company.website || 'N/A'}`);
      console.log(`   Description: ${company.description ? 'Has description' : 'No description'}`);
      console.log(`   Size: ${company.size || 'No size'}`);
      console.log(`   LinkedIn: ${company.linkedinUrl || 'No LinkedIn'}`);
      console.log(`   Industry: ${company.industry || 'No industry'}`);
      console.log('');
    });

    // Also check total companies in workspace
    const totalCompanies = await prisma.companies.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null
      }
    });

    console.log(`📊 Total companies in TOP workspace: ${totalCompanies}`);
    console.log(`📊 Companies needing enrichment: ${companies.length}`);
    console.log(`📊 Companies already enriched: ${totalCompanies - companies.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCompaniesNeedingEnrichment();
