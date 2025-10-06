const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCountsAPIComprehensive() {
  try {
    console.log('🧪 Testing counts API comprehensively...');
    
    const DEMO_WORKSPACE_ID = '01K1VBYX2YERMXBFJ60RC6J194';
    const DEMO_USER_ID = 'demo-user-2025';
    
    // Test the exact same logic that the counts API uses
    const startTime = Date.now();
    
    const [
      leadsCount,
      prospectsCount,
      opportunitiesCount,
      companiesCount,
      peopleCount,
      clientsCount,
      partnersCount,
      sellersCount,
      speedrunCount
    ] = await Promise.all([
      // Leads count
      prisma.leads.count({
        where: {
          workspaceId: DEMO_WORKSPACE_ID,
          deletedAt: null
        }
      }),
      
      // Prospects count
      prisma.prospects.count({
        where: {
          workspaceId: DEMO_WORKSPACE_ID,
          deletedAt: null
        }
      }),
      
      // Opportunities count
      prisma.opportunities.count({
        where: {
          workspaceId: DEMO_WORKSPACE_ID,
          deletedAt: null
        }
      }),
      
      // Companies count
      prisma.companies.count({
        where: {
          workspaceId: DEMO_WORKSPACE_ID,
          deletedAt: null
        }
      }),
      
      // People count
      prisma.people.count({
        where: {
          workspaceId: DEMO_WORKSPACE_ID,
          deletedAt: null
        }
      }),
      
      // Clients count (with fallback)
      prisma.clients.count({
        where: {
          workspaceId: DEMO_WORKSPACE_ID,
          deletedAt: null
        }
      }).catch(() => 0),
      
      // Partners count (with fallback)
      prisma.partners.count({
        where: {
          workspaceId: DEMO_WORKSPACE_ID,
          deletedAt: null
        }
      }).catch(() => 0),
      
      // Sellers count - count from both sellers table AND people table with role 'seller'
      Promise.all([
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
      ]).then(([sellersTableCount, peopleTableCount]) => sellersTableCount + peopleTableCount),
      
      // Speedrun count - count actual speedrun leads
      prisma.leads.count({
        where: {
          workspaceId: DEMO_WORKSPACE_ID,
          deletedAt: null,
          tags: { has: 'speedrun' }
        }
      }).catch(() => 0)
    ]);
    
    const responseTime = Date.now() - startTime;
    
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
    
    console.log('✅ [COUNTS API TEST] Direct database counts:', counts);
    console.log('⏱️ Response time:', responseTime + 'ms');
    
    // This should match what the API returns
    const expectedResponse = {
      success: true,
      data: counts,
      meta: {
        responseTime,
        workspaceId: DEMO_WORKSPACE_ID,
        userId: DEMO_USER_ID
      }
    };
    
    console.log('📊 Expected API response:');
    console.log(JSON.stringify(expectedResponse, null, 2));
    
    // Check if this matches what the frontend should see
    console.log('🎯 Frontend should see:');
    console.log(`  - Speedrun: ${counts.speedrun}`);
    console.log(`  - People: ${counts.people}`);
    console.log(`  - Companies: ${counts.companies}`);
    console.log(`  - Sellers: ${counts.sellers}`);
    console.log(`  - Leads: ${counts.leads}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testCountsAPIComprehensive();
}
