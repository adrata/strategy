const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDirectQuery() {
  try {
    console.log('🔍 Testing direct database query...\n');
    
    const workspaceId = 'cmezxb1ez0001pc94yry3ntjk';
    const userId = '01K1VBYYV7TRPY04NW4TW4XWRB';
    
    console.log(`📊 Querying leads for workspace: ${workspaceId}, user: ${userId}`);
    
    // Test the exact query from loadAllData
    const leads = await prisma.leads.findMany({
      where: { 
        workspaceId, 
        deletedAt: null,
        assignedUserId: userId
      },
      select: {
        id: true, fullName: true, email: true, company: true,
        title: true, jobTitle: true, status: true, priority: true, updatedAt: true, state: true
      },
      orderBy: [{ updatedAt: 'desc' }],
      take: 500,
    });
    
    console.log(`✅ Found ${leads.length} leads`);
    
    if (leads.length > 0) {
      console.log('\n📋 Sample leads:');
      leads.slice(0, 3).forEach((lead, index) => {
        console.log(`${index + 1}. ${lead.fullName} (${lead.company}) - ${lead.jobTitle || lead.title || 'No title'}`);
      });
    }
    
    // Test the count query
    const leadCount = await prisma.leads.count({
      where: { 
        workspaceId, 
        deletedAt: null,
        assignedUserId: userId
      }
    });
    
    console.log(`\n📊 Total count: ${leadCount}`);
    
    // Test without assignedUserId filter
    const allLeadsInWorkspace = await prisma.leads.count({
      where: { 
        workspaceId, 
        deletedAt: null
      }
    });
    
    console.log(`📊 All leads in workspace: ${allLeadsInWorkspace}`);
    
  } catch (error) {
    console.error('❌ Error testing direct query:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDirectQuery();
