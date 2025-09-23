const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function checkProgress() {
  try {
    await prisma.$connect();
    
    // Count companies with LinkedIn URLs (indicates enrichment)
    const enrichedCount = await prisma.companies.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        linkedinUrl: { not: null }
      }
    });
    
    // Count total companies
    const totalCount = await prisma.companies.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null
      }
    });
    
    // Count companies that still need enrichment
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
    
    console.log('📊 ENRICHMENT PROGRESS CHECK');
    console.log('============================');
    console.log(`Total companies: ${totalCount}`);
    console.log(`Companies with LinkedIn URLs: ${enrichedCount}`);
    console.log(`Companies still needing enrichment: ${needEnrichment}`);
    console.log(`Enrichment progress: ${Math.round((enrichedCount / totalCount) * 100)}%`);
    
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

checkProgress();
