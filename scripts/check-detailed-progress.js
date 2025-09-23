const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function checkDetailedProgress() {
  try {
    await prisma.$connect();
    
    // Count companies with different enrichment indicators
    const withLinkedIn = await prisma.companies.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        linkedinUrl: { not: null }
      }
    });
    
    const withDescription = await prisma.companies.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        description: { not: null }
      }
    });
    
    const withSize = await prisma.companies.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        size: { not: null }
      }
    });
    
    const withWebsite = await prisma.companies.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        website: { not: null }
      }
    });
    
    const withEmployeeCount = await prisma.companies.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        employeeCount: { not: null }
      }
    });
    
    // Count total companies
    const totalCount = await prisma.companies.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null
      }
    });
    
    // Count companies that still need enrichment (any of the key fields missing)
    const needEnrichment = await prisma.companies.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        OR: [
          { description: null },
          { size: null },
          { linkedinUrl: null },
          { employeeCount: null }
        ]
      }
    });
    
    console.log('📊 DETAILED ENRICHMENT PROGRESS');
    console.log('================================');
    console.log(`Total companies: ${totalCount}`);
    console.log(`Companies with LinkedIn URLs: ${withLinkedIn}`);
    console.log(`Companies with descriptions: ${withDescription}`);
    console.log(`Companies with size info: ${withSize}`);
    console.log(`Companies with websites: ${withWebsite}`);
    console.log(`Companies with employee count: ${withEmployeeCount}`);
    console.log(`Companies still needing enrichment: ${needEnrichment}`);
    console.log(`Enrichment progress: ${Math.round(((totalCount - needEnrichment) / totalCount) * 100)}%`);
    
    if (needEnrichment === 0) {
      console.log('🎉 ALL COMPANIES ENRICHED!');
    } else {
      console.log(`⏳ Still processing ${needEnrichment} companies...`);
    }
    
  } catch (error) {
    console.error('❌ Error checking progress:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDetailedProgress();
