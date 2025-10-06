const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCountsAPIDirect() {
  try {
    console.log('🧪 Testing counts API directly...');
    
    const DEMO_WORKSPACE_ID = '01K1VBYX2YERMXBFJ60RC6J194';
    
    // Test the exact same query that the API uses
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
    
    // This should match what the API returns
    const expectedResponse = {
      success: true,
      data: counts
    };
    
    console.log('📊 Expected API response:');
    console.log(JSON.stringify(expectedResponse, null, 2));
    
    // Check if any counts are 0 when they shouldn't be
    const issues = [];
    if (counts.leads === 0) issues.push('Leads count is 0');
    if (counts.companies === 0) issues.push('Companies count is 0');
    if (counts.people === 0) issues.push('People count is 0');
    if (counts.sellers === 0) issues.push('Sellers count is 0');
    if (counts.speedrun === 0) issues.push('Speedrun count is 0');
    
    if (issues.length > 0) {
      console.log('⚠️ Potential issues found:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    } else {
      console.log('✅ All counts look good!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testCountsAPIDirect();
}
