const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function debugEnrichmentQuery() {
  try {
    await prisma.$connect();
    
    // This is the exact query from the enrichment script
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

    console.log('🔍 COMPANIES THE ENRICHMENT SCRIPT IS PROCESSING:');
    console.log('================================================');
    console.log(`Found ${companies.length} companies that need enrichment:\n`);

    companies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name}`);
      console.log(`   Website: ${company.website || 'N/A'}`);
      console.log(`   Description: ${company.description ? 'HAS' : 'MISSING'}`);
      console.log(`   Size: ${company.size || 'MISSING'}`);
      console.log(`   LinkedIn: ${company.linkedinUrl || 'MISSING'}`);
      console.log('');
    });

    // Also check the counts
    const totalCompanies = await prisma.companies.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null
      }
    });

    const needEnrichment = await prisma.companies.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        OR: [
          { description: null },
          { size: null },
          { linkedinUrl: null }
        ]
      }
    });

    console.log(`📊 SUMMARY:`);
    console.log(`Total companies: ${totalCompanies}`);
    console.log(`Companies needing enrichment: ${needEnrichment}`);
    console.log(`Companies already enriched: ${totalCompanies - needEnrichment}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugEnrichmentQuery();
