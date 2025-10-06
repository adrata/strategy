const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCacheClear() {
  try {
    console.log('🧪 Testing cache clear functionality...');
    
    const DEMO_WORKSPACE_ID = '01K1VBYX2YERMXBFJ60RC6J194';
    
    // Test the counts query
    console.log('🔍 Testing counts query...');
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
    
    console.log('📊 Sellers count:', sellersCount);
    
    // Test API endpoint (if server is running)
    console.log('🌐 Testing API endpoint...');
    try {
      const response = await fetch('http://localhost:3000/api/data/counts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Cache clear API response:', result);
      } else {
        console.log('⚠️ Cache clear API failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.log('⚠️ API test failed (server not running?):', error.message);
    }
    
    // Test GET with cache busting
    console.log('🔄 Testing GET with cache busting...');
    try {
      const response = await fetch('http://localhost:3000/api/data/counts?t=' + Date.now(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Cache busting API response:', result);
      } else {
        console.log('⚠️ Cache busting API failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.log('⚠️ Cache busting API test failed (server not running?):', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testCacheClear();
}
