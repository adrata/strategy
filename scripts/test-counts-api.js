const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCountsAPI() {
  try {
    console.log('🧪 Testing counts API directly...');
    
    const DEMO_WORKSPACE_ID = '01K1VBYX2YERMXBFJ60RC6J194';
    
    // Test the exact same query that the API uses
    console.log('🔍 Testing sellers count query...');
    
    const sellersCount = await Promise.all([
      prisma.sellers.count({
        where: {
          workspaceId: DEMO_WORKSPACE_ID,
          deletedAt: null
        }
      }).catch(() => 0),
      prisma.people.count({
        where: {
          workspaceId: DEMO_WORKSPACE_ID,
          deletedAt: null,
          role: 'seller'
        }
      }).catch(() => 0)
    ]).then(([sellersTableCount, peopleTableCount]) => sellersTableCount + peopleTableCount);
    
    console.log('📊 Sellers count result:', sellersCount);
    
    // Test all counts like the API does
    const [
      leadsCount,
      prospectsCount,
      opportunitiesCount,
      companiesCount,
      peopleCount,
      clientsCount,
      partnersCount,
      speedrunCount
    ] = await Promise.all([
      prisma.leads.count({
        where: {
          workspaceId: DEMO_WORKSPACE_ID,
          deletedAt: null
        }
      }),
      prisma.prospects.count({
        where: {
          workspaceId: DEMO_WORKSPACE_ID,
          deletedAt: null
        }
      }),
      prisma.opportunities.count({
        where: {
          workspaceId: DEMO_WORKSPACE_ID,
          deletedAt: null
        }
      }),
      prisma.companies.count({
        where: {
          workspaceId: DEMO_WORKSPACE_ID,
          deletedAt: null
        }
      }),
      prisma.people.count({
        where: {
          workspaceId: DEMO_WORKSPACE_ID,
          deletedAt: null
        }
      }),
      prisma.clients.count({
        where: {
          workspaceId: DEMO_WORKSPACE_ID,
          deletedAt: null
        }
      }).catch(() => 0),
      prisma.partners.count({
        where: {
          workspaceId: DEMO_WORKSPACE_ID,
          deletedAt: null
        }
      }).catch(() => 0),
      prisma.leads.count({
        where: {
          workspaceId: DEMO_WORKSPACE_ID,
          deletedAt: null,
          tags: { has: 'speedrun' }
        }
      }).catch(() => 0)
    ]);
    
    const counts = {
      leads: leadsCount,
      prospects: prospectsCount,
      opportunities: opportunitiesCount,
      companies: companiesCount,
      people: peopleCount,
      clients: clientsCount,
      partners: partnersCount,
      sellers: sellersCount,
      speedrun: speedrunCount
    };
    
    console.log('✅ [COUNTS API TEST] All counts:', counts);
    console.log('🔍 [SELLERS DEBUG] Sellers count specifically:', counts.sellers);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testCountsAPI();
}
