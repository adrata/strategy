const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function testAccountsCount() {
  try {
    console.log('🔍 Testing accounts count...\n');
    
    const workspaceId = 'cmezxb1ez0001pc94yry3ntjk';
    const userId = '01K1VBYYV7TRPY04NW4TW4XWRB';
    
    // Test direct database count
    const directCount = await prisma.accounts.count({ 
      where: { 
        workspaceId, 
        deletedAt: null, 
        assignedUserId: userId 
      } 
    });
    
    console.log(`📊 Direct database count (assigned to user): ${directCount}`);
    
    // Test all accounts in workspace
    const allAccountsCount = await prisma.accounts.count({ 
      where: { 
        workspaceId, 
        deletedAt: null 
      } 
    });
    
    console.log(`📊 All accounts in workspace: ${allAccountsCount}`);
    
    // Create a JWT token
    const secret = process.env['NEXTAUTH_SECRET'] || 'dev-secret-key-change-in-production';
    const token = jwt.sign({
      userId: userId,
      workspaceId: workspaceId,
      email: 'test@adrata.com'
    }, secret);
    
    // Test API counts
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
    
    console.log('\n✅ API request successful!');
    console.log(`📊 API counts:`);
    console.log(`   Leads: ${data.data?.counts?.leads || 0}`);
    console.log(`   Accounts: ${data.data?.counts?.accounts || 0}`);
    console.log(`   Contacts: ${data.data?.counts?.contacts || 0}`);
    console.log(`   Prospects: ${data.data?.counts?.prospects || 0}`);
    console.log(`   Opportunities: ${data.data?.counts?.opportunities || 0}`);
    
  } catch (error) {
    console.error('❌ Error testing accounts count:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAccountsCount();
