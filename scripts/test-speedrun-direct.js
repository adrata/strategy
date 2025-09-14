const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSpeedrunDirect() {
  try {
    console.log('🔍 Testing speedrun data directly from database...\n');
    
    const workspaceId = 'cmezxb1ez0001pc94yry3ntjk';
    const userId = '01K1VBYYV7TRPY04NW4TW4XWRB';
    
    // Test the exact speedrun query
    const leads = await prisma.leads.findMany({
      where: {
        workspaceId,
        assignedUserId: userId,
        status: { in: ['new', 'contacted', 'qualified', 'follow-up', 'active'] },
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        company: true,
        jobTitle: true,
        title: true,
        status: true,
        priority: true,
        estimatedValue: true,
        lastActionDate: true,
        nextActionDate: true,
        updatedAt: true,
        accountId: true
      },
      orderBy: [
        { priority: 'asc' },
        { updatedAt: 'desc' }
      ],
      take: 50
    });
    
    console.log(`📊 Found ${leads.length} leads for speedrun`);
    
    if (leads.length > 0) {
      console.log('\n📋 Sample speedrun leads:');
      leads.slice(0, 5).forEach((lead, index) => {
        console.log(`${index + 1}. ${lead.fullName}`);
        console.log(`   Status: ${lead.status}`);
        console.log(`   Priority: ${lead.priority}`);
        console.log(`   Company: ${lead.company}`);
        console.log(`   AccountId: ${lead.accountId}`);
        console.log(`   LastAction: ${lead.lastActionDate}`);
        console.log(`   NextAction: ${lead.nextActionDate}`);
        console.log('');
      });
    }
    
    // Test prospects query
    const prospects = await prisma.prospects.findMany({
      where: {
        workspaceId,
        assignedUserId: userId,
        status: { in: ['engaged', 'qualified', 'follow-up', 'active'] },
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        company: true,
        jobTitle: true,
        title: true,
        status: true,
        priority: true,
        estimatedValue: true,
        lastActionDate: true,
        nextActionDate: true,
        updatedAt: true
      },
      orderBy: [
        { priority: 'asc' },
        { updatedAt: 'desc' }
      ],
      take: 50
    });
    
    console.log(`📊 Found ${prospects.length} prospects for speedrun`);
    
    if (prospects.length > 0) {
      console.log('\n📋 Sample speedrun prospects:');
      prospects.slice(0, 3).forEach((prospect, index) => {
        console.log(`${index + 1}. ${prospect.fullName} - Status: ${prospect.status} - Company: ${prospect.company}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing speedrun data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSpeedrunDirect();
