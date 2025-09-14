const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function testSpeedrunAPI() {
  try {
    console.log('🔍 Testing speedrun API specifically...\n');
    
    const workspaceId = 'cmezxb1ez0001pc94yry3ntjk';
    const userId = '01K1VBYYV7TRPY04NW4TW4XWRB';
    
    // Create a JWT token
    const secret = process.env['NEXTAUTH_SECRET'] || 'dev-secret-key-change-in-production';
    const token = jwt.sign({
      userId: userId,
      workspaceId: workspaceId,
      email: 'test@adrata.com'
    }, secret);
    
    // Test speedrun section API
    const response = await fetch('http://localhost:3000/api/data/unified?currentSection=speedrun&limit=10', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      console.log('❌ Speedrun API request failed:', response.status);
      return;
    }
    
    const data = await response.json();
    
    console.log('✅ Speedrun API request successful!');
    console.log(`📊 Found ${data.data?.speedrunItems?.length || 0} speedrun items`);
    
    if (data.data?.speedrunItems?.length > 0) {
      console.log('\n📋 Sample speedrun items:');
      data.data.speedrunItems.slice(0, 5).forEach((item, index) => {
        console.log(`${index + 1}. ${item.name || 'No name'}`);
        console.log(`   Type: ${item.type || 'null'}`);
        console.log(`   Company: "${item.company || 'null'}"`);
        console.log(`   Status: ${item.status || 'null'}`);
        console.log(`   Priority: ${item.priority || 'null'}`);
        console.log(`   Urgency: ${item.urgency || 'null'}`);
        console.log('');
      });
    } else {
      console.log('❌ No speedrun items found in API response');
    }
    
    // Also test the full API to see if speedrunItems are there
    console.log('\n🔍 Testing full API for speedrun items...');
    const fullResponse = await fetch('http://localhost:3000/api/data/unified?cacheBust=' + Date.now(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });
    
    if (fullResponse.ok) {
      const fullData = await fullResponse.json();
      console.log('✅ Full API request successful!');
      console.log(`📊 Found ${fullData.data?.speedrunItems?.length || 0} speedrun items in full API`);
      
      if (fullData.data?.speedrunItems?.length > 0) {
        console.log('\n📋 Sample speedrun items from full API:');
        fullData.data.speedrunItems.slice(0, 3).forEach((item, index) => {
          console.log(`${index + 1}. ${item.name || 'No name'} - Company: "${item.company || 'null'}"`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing speedrun API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSpeedrunAPI();
