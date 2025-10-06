const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearCacheAndTest() {
  try {
    console.log('🧹 Clearing cache and testing API...');
    
    // Clear the counts cache manually
    const { clearCountsCache } = await import('../src/app/api/data/counts/route.js');
    
    const DEMO_WORKSPACE_ID = '01K1VBYX2YERMXBFJ60RC6J194';
    const USER_ID = '01K1VBYZMWTCT09FWEKBDMCXZM'; // Dan's user ID
    
    console.log('🧹 Clearing counts cache...');
    clearCountsCache(DEMO_WORKSPACE_ID, USER_ID);
    clearCountsCache(DEMO_WORKSPACE_ID, 'any'); // Clear for any user
    
    console.log('✅ Cache cleared successfully');
    
    // Test the database query directly
    console.log('🔍 Testing database query...');
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
    
    console.log('📊 Direct database sellers count:', sellersCount);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  clearCacheAndTest();
}
