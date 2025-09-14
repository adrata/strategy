const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkLeadAccountIds() {
  try {
    console.log('🔍 Checking lead accountIds in database...\n');
    
    const workspaceId = 'cmezxb1ez0001pc94yry3ntjk';
    const userId = '01K1VBYYV7TRPY04NW4TW4XWRB';
    
    // Check leads with accountId
    const leadsWithAccountId = await prisma.leads.findMany({
      where: {
        workspaceId: workspaceId,
        assignedUserId: userId,
        accountId: { not: null },
        deletedAt: null
      },
      take: 10,
      select: {
        id: true,
        fullName: true,
        company: true,
        accountId: true,
        jobTitle: true
      }
    });
    
    console.log('👥 Leads WITH accountId in database:');
    leadsWithAccountId.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.fullName} - Company: "${lead.company}" - AccountId: ${lead.accountId}`);
    });
    
    // Check leads without accountId
    const leadsWithoutAccountId = await prisma.leads.findMany({
      where: {
        workspaceId: workspaceId,
        assignedUserId: userId,
        accountId: null,
        deletedAt: null
      },
      take: 10,
      select: {
        id: true,
        fullName: true,
        company: true,
        accountId: true,
        jobTitle: true
      }
    });
    
    console.log('\n👥 Leads WITHOUT accountId in database:');
    leadsWithoutAccountId.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.fullName} - Company: "${lead.company}" - AccountId: ${lead.accountId}`);
    });
    
    // Count totals
    const totalWithAccountId = await prisma.leads.count({
      where: {
        workspaceId: workspaceId,
        assignedUserId: userId,
        accountId: { not: null },
        deletedAt: null
      }
    });
    
    const totalWithoutAccountId = await prisma.leads.count({
      where: {
        workspaceId: workspaceId,
        assignedUserId: userId,
        accountId: null,
        deletedAt: null
      }
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`   Leads WITH accountId: ${totalWithAccountId}`);
    console.log(`   Leads WITHOUT accountId: ${totalWithoutAccountId}`);
    console.log(`   Total leads: ${totalWithAccountId + totalWithoutAccountId}`);
    
  } catch (error) {
    console.error('❌ Error checking lead accountIds:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLeadAccountIds();
