const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function comprehensiveStatusCheck() {
  try {
    console.log('🔍 COMPREHENSIVE STATUS CHECK');
    console.log('============================');

    // Check all workspaces
    const workspaces = await prisma.companies.groupBy({
      by: ['workspaceId'],
      _count: { id: true }
    });

    console.log('📊 COMPANIES BY WORKSPACE:');
    workspaces.forEach(workspace => {
      console.log(`Workspace ${workspace.workspaceId}: ${workspace._count.id} companies`);
    });

    // Check the main workspace we've been working with
    const mainWorkspace = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    
    const total = await prisma.companies.count({
      where: { workspaceId: mainWorkspace }
    });

    const enriched = await prisma.companies.count({
      where: { 
        workspaceId: mainWorkspace,
        customFields: { not: null }
      }
    });

    const coresignal = await prisma.companies.count({
      where: {
        workspaceId: mainWorkspace,
        customFields: {
          path: ['coresignalData'],
          not: null
        }
      }
    });

    const withLinkedIn = await prisma.companies.count({
      where: {
        workspaceId: mainWorkspace,
        linkedinUrl: { not: null }
      }
    });

    const withDescription = await prisma.companies.count({
      where: {
        workspaceId: mainWorkspace,
        description: { not: null }
      }
    });

    console.log(`\n📊 MAIN WORKSPACE (${mainWorkspace}):`);
    console.log(`Total companies: ${total}`);
    console.log(`Enriched (customFields): ${enriched}`);
    console.log(`CoreSignal data: ${coresignal}`);
    console.log(`LinkedIn URLs: ${withLinkedIn}`);
    console.log(`Descriptions: ${withDescription}`);
    console.log(`Progress: ${Math.round((enriched/total)*100)}%`);

    // Check recent enrichment activity
    const recent = await prisma.companies.findMany({
      where: { 
        workspaceId: mainWorkspace,
        customFields: { not: null }
      },
      select: { 
        name: true, 
        customFields: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    });

    console.log('\n📋 RECENT ENRICHMENT ACTIVITY:');
    recent.forEach((company, i) => {
      const hasCoreSignal = company.customFields?.coresignalData ? '✅' : '❌';
      const lastEnriched = company.customFields?.lastEnrichedAt || 'Unknown';
      console.log(`${i+1}. ${company.name}`);
      console.log(`   CoreSignal: ${hasCoreSignal} | Last enriched: ${lastEnriched}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

comprehensiveStatusCheck();
