const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function testAccountsData() {
  try {
    console.log('🔍 Testing accounts data from API...\n');
    
    const workspaceId = 'cmezxb1ez0001pc94yry3ntjk';
    const userId = '01K1VBYYV7TRPY04NW4TW4XWRB';
    
    // Create a JWT token
    const secret = process.env['NEXTAUTH_SECRET'] || 'dev-secret-key-change-in-production';
    const token = jwt.sign({
      userId: userId,
      workspaceId: workspaceId,
      email: 'test@adrata.com'
    }, secret);
    
    // Test the full API to get accounts data
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
    
    console.log('✅ API request successful!');
    console.log(`📊 Found ${data.data?.accounts?.length || 0} accounts`);
    
    if (data.data?.accounts?.length > 0) {
      console.log('\n📋 Sample accounts from API:');
      const sampleAccounts = data.data.accounts.slice(0, 10);
      sampleAccounts.forEach((account, index) => {
        console.log(`${index + 1}. ${account.name || 'No name'}`);
        console.log(`   State: "${account.state || 'null'}"`);
        console.log(`   Industry: "${account.industry || 'null'}"`);
        console.log(`   City: "${account.city || 'null'}"`);
        console.log(`   Country: "${account.country || 'null'}"`);
        console.log(`   ID: ${account.id || 'null'}`);
        console.log('');
      });
    }
    
    // Also test the accounts section specifically
    console.log('\n🔍 Testing accounts section specifically...');
    const sectionResponse = await fetch('http://localhost:3000/api/data/unified?currentSection=accounts&limit=10', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });
    
    if (sectionResponse.ok) {
      const sectionData = await sectionResponse.json();
      console.log('✅ Accounts section API successful!');
      console.log(`📊 Found ${sectionData.data?.accounts?.length || 0} accounts in section`);
      
      if (sectionData.data?.accounts?.length > 0) {
        console.log('\n📋 Sample accounts from section API:');
        const sectionAccounts = sectionData.data.accounts.slice(0, 5);
        sectionAccounts.forEach((account, index) => {
          console.log(`${index + 1}. ${account.name || 'No name'} - State: "${account.state || 'null'}"`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing accounts data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAccountsData();
