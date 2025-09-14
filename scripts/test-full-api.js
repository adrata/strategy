const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function testFullAPI() {
  try {
    console.log('🔍 Testing full API (no section parameter)...\n');
    
    const workspaceId = 'cmezxb1ez0001pc94yry3ntjk';
    const userId = '01K1VBYYV7TRPY04NW4TW4XWRB';
    
    // Create a JWT token
    const secret = process.env['NEXTAUTH_SECRET'] || 'dev-secret-key-change-in-production';
    const token = jwt.sign({
      userId: userId,
      workspaceId: workspaceId,
      email: 'test@adrata.com'
    }, secret);
    
    // Test the full API (no section parameter)
    const response = await fetch('http://localhost:3000/api/data/unified?cacheBust=' + Date.now(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      console.log('❌ API request failed:', response.status);
      return;
    }
    
    const data = await response.json();
    
    console.log('✅ Full API request successful!');
    console.log(`📊 Found ${data.data?.leads?.length || 0} leads`);
    
    if (data.data?.leads?.length > 0) {
      console.log('\n📋 Sample leads from FULL API:');
      const sampleLeads = data.data.leads.slice(0, 10);
      sampleLeads.forEach((lead, index) => {
        console.log(`${index + 1}. ${lead.fullName}`);
        console.log(`   Company: "${lead.company}"`);
        console.log(`   Title: "${lead.title}"`);
        console.log(`   State: "${lead.state}"`);
        console.log(`   AccountId: ${lead.accountId || 'null'}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing full API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFullAPI();
