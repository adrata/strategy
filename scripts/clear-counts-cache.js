const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearCountsCacheAndTest() {
  try {
    console.log('🧹 Clearing counts cache and testing...');
    
    const DEMO_WORKSPACE_ID = '01K1VBYX2YERMXBFJ60RC6J194';
    const USER_ID = '01K1VBYZMWTCT09FWEKBDMCXZM'; // Dan's user ID
    
    // Test direct database counts
    console.log('🔍 Testing direct database counts...');
    
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
    
    console.log('✅ [DIRECT DB COUNTS] Loaded counts:', counts);
    console.log('🔍 [SELLERS DEBUG] Sellers count specifically:', counts.sellers);
    
    // Test individual sellers queries
    const sellersTableCount = await prisma.sellers.count({
      where: {
        workspaceId: DEMO_WORKSPACE_ID,
        deletedAt: null
      }
    });
    
    const peopleTableCount = await prisma.people.count({
      where: {
        workspaceId: DEMO_WORKSPACE_ID,
        deletedAt: null,
        role: 'seller'
      }
    });
    
    console.log('📊 Sellers table count:', sellersTableCount);
    console.log('📊 People table (role=seller) count:', peopleTableCount);
    console.log('📊 Total sellers:', sellersTableCount + peopleTableCount);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  clearCountsCacheAndTest();
}
