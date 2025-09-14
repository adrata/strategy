const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function testFixedData() {
  try {
    console.log('🔍 Testing fixed leads data...\n');
    
    const workspaceId = 'cmezxb1ez0001pc94yry3ntjk';
    const userId = '01K1VBYYV7TRPY04NW4TW4XWRB';
    
    // Create a JWT token
    const secret = process.env['NEXTAUTH_SECRET'] || 'dev-secret-key-change-in-production';
    const token = jwt.sign({
      userId: userId,
      workspaceId: workspaceId,
      email: 'test@adrata.com'
    }, secret);
    
    // Test the API
    const response = await fetch('http://localhost:3000/api/data/unified?currentSection=leads&limit=10', {
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
    
    console.log('✅ API request successful!');
    console.log(`📊 Found ${data.data?.leads?.length || 0} leads`);
    
    if (data.data?.leads?.length > 0) {
      console.log('\n📋 Sample leads with fixed data:');
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
    
    // Also test the full API to see if it works
    console.log('\n🔍 Testing full API...');
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
      console.log('✅ Full API successful!');
      console.log(`📊 Full API leads: ${fullData.data?.leads?.length || 0}`);
      
      if (fullData.data?.leads?.length > 0) {
        console.log('\n📋 Sample leads from full API:');
        const fullSampleLeads = fullData.data.leads.slice(0, 5);
        fullSampleLeads.forEach((lead, index) => {
          console.log(`${index + 1}. ${lead.fullName} - "${lead.company}" - "${lead.title}" - State: "${lead.state}"`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing fixed data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFixedData();
