const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function testUnifiedAPI() {
  try {
    console.log('🔍 Testing unified API with authentication...\n');
    
    // Get the user with the most leads (390 leads)
    const workspaceUser = await prisma.workspace_users.findFirst({
      where: {
        userId: '01K1VBYYV7TRPY04NW4TW4XWRB',
        workspaceId: 'cmezxb1ez0001pc94yry3ntjk'
      }
    });
    
    if (!workspaceUser) {
      console.log('❌ No workspace users found');
      return;
    }
    
    // Get workspace details
    const workspace = await prisma.workspaces.findUnique({
      where: { id: workspaceUser.workspaceId }
    });
    
    console.log('📊 Using workspace:', workspace?.name || workspaceUser.workspaceId);
    console.log('👤 Using user:', workspaceUser.userId);
    
    // Create a JWT token
    const secret = process.env['NEXTAUTH_SECRET'] || 'dev-secret-key-change-in-production';
    const token = jwt.sign({
      userId: workspaceUser.userId,
      workspaceId: workspaceUser.workspaceId,
      email: 'test@adrata.com'
    }, secret);
    
    console.log('🔐 Created JWT token');
    
    // Test the API
    const response = await fetch('http://localhost:3000/api/data/unified', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      console.log('❌ API request failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error response:', errorText);
      return;
    }
    
    const data = await response.json();
    
    console.log('✅ API request successful!');
    console.log('📊 Response structure:', {
      success: data.success,
      hasData: !!data.data,
      dataKeys: data.data ? Object.keys(data.data) : [],
      leadsCount: data.data?.leads?.length || 0,
      accountsCount: data.data?.accounts?.length || 0,
    });
    
    if (data.data?.leads?.length > 0) {
      console.log('\n📋 Sample leads data:');
      const sampleLeads = data.data.leads.slice(0, 3);
      sampleLeads.forEach((lead, index) => {
        console.log(`Lead ${index + 1}:`, {
          id: lead.id,
          fullName: lead.fullName,
          title: lead.title,
          jobTitle: lead.jobTitle,
          company: lead.company,
          state: lead.state,
          accountId: lead.accountId,
        });
      });
    } else {
      console.log('\n❌ No leads returned from API');
      console.log('Full response data:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUnifiedAPI();
