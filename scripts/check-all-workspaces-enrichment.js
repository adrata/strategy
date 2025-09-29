const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAllWorkspacesEnrichment() {
  try {
    await prisma.$connect();
    console.log('🔍 ALL WORKSPACES ENRICHMENT ANALYSIS');
    console.log('======================================');
    console.log(`Analysis Time: ${new Date().toLocaleString()}`);
    console.log('');

    // Get all workspaces
    const workspaces = await prisma.people.groupBy({
      by: ['workspaceId'],
      _count: { id: true }
    });

    console.log(`📊 TOTAL WORKSPACES: ${workspaces.length}`);
    console.log('');

    for (const workspace of workspaces) {
      const workspaceId = workspace.workspaceId;
      const totalPeople = workspace._count.id;
      
      console.log(`🏢 WORKSPACE: ${workspaceId}`);
      console.log(`   Total People: ${totalPeople}`);
      
      // Check recent enrichment activity (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const recentEnrichment = await prisma.people.findMany({
        where: {
          workspaceId: workspaceId,
          OR: [
            { lastEnriched: { gte: sevenDaysAgo } },
            { updatedAt: { gte: sevenDaysAgo } }
          ]
        },
        select: {
          id: true,
          fullName: true,
          enrichmentSources: true,
          lastEnriched: true,
          updatedAt: true
        },
        orderBy: { updatedAt: 'desc' }
      });

      console.log(`   Recent Enrichment (7 days): ${recentEnrichment.length}`);
      
      if (recentEnrichment.length > 0) {
        // Group by day
        const enrichmentByDay = {};
        recentEnrichment.forEach(person => {
          const updateDate = new Date(person.updatedAt);
          const dayKey = updateDate.toISOString().split('T')[0];
          if (!enrichmentByDay[dayKey]) {
            enrichmentByDay[dayKey] = 0;
          }
          enrichmentByDay[dayKey]++;
        });

        console.log(`   📅 Enrichment by day:`);
        Object.entries(enrichmentByDay)
          .sort(([a], [b]) => b.localeCompare(a))
          .forEach(([day, count]) => {
            console.log(`      ${day}: ${count} people`);
          });

        // Check for today's activity
        const today = new Date().toISOString().split('T')[0];
        const todaysCount = enrichmentByDay[today] || 0;
        if (todaysCount > 0) {
          console.log(`   🚀 TODAY'S ENRICHMENT: ${todaysCount} people`);
        }

        // Show recent people
        console.log(`   👥 Recent people (last 5):`);
        recentEnrichment.slice(0, 5).forEach((person, index) => {
          const time = new Date(person.updatedAt).toLocaleString();
          const sources = person.enrichmentSources?.join(', ') || 'None';
          console.log(`      ${index + 1}. ${person.fullName} - ${time} - Sources: ${sources}`);
        });
      }
      
      console.log('');
    }

    // Also check if there are any people with very recent enrichment sources
    console.log('🔍 CHECKING FOR RECENT ENRICHMENT SOURCES:');
    console.log('==========================================');
    
    const recentSources = await prisma.people.findMany({
      where: {
        enrichmentSources: {
          hasSome: ['coresignal', 'coresignal-full', 'coresignal-production', 'coresignal-employee']
        }
      },
      select: {
        id: true,
        fullName: true,
        workspaceId: true,
        enrichmentSources: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 20
    });

    console.log(`📊 People with CoreSignal enrichment sources: ${recentSources.length}`);
    
    if (recentSources.length > 0) {
      console.log('👥 Most recent CoreSignal enrichments:');
      recentSources.forEach((person, index) => {
        const time = new Date(person.updatedAt).toLocaleString();
        const sources = person.enrichmentSources?.join(', ') || 'None';
        console.log(`   ${index + 1}. ${person.fullName} (${person.workspaceId}) - ${time} - Sources: ${sources}`);
      });
    }

    console.log('');
    console.log('✅ ALL WORKSPACES ENRICHMENT ANALYSIS COMPLETE');

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllWorkspacesEnrichment();
