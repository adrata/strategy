const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkLeadStatuses() {
  try {
    console.log('🔍 Checking lead statuses in database...\n');
    
    const workspaceId = 'cmezxb1ez0001pc94yry3ntjk';
    const userId = '01K1VBYYV7TRPY04NW4TW4XWRB';
    
    // Check all unique statuses
    const statusCounts = await prisma.leads.groupBy({
      by: ['status'],
      where: {
        workspaceId: workspaceId,
        assignedUserId: userId,
        deletedAt: null
      },
      _count: {
        status: true
      }
    });
    
    console.log('📊 Lead status counts:');
    statusCounts.forEach(status => {
      console.log(`   ${status.status}: ${status._count.status} leads`);
    });
    
    // Check leads that would qualify for speedrun
    const speedrunLeads = await prisma.leads.findMany({
      where: {
        workspaceId: workspaceId,
        assignedUserId: userId,
        status: { in: ['new', 'contacted', 'qualified', 'follow-up', 'active'] },
        deletedAt: null
      },
      take: 5,
      select: {
        id: true,
        fullName: true,
        status: true,
        priority: true,
        company: true
      }
    });
    
    console.log(`\n🏃‍♂️ Leads that qualify for speedrun: ${speedrunLeads.length}`);
    speedrunLeads.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.fullName} - Status: ${lead.status} - Priority: ${lead.priority} - Company: ${lead.company}`);
    });
    
    // Check prospects that would qualify for speedrun
    const speedrunProspects = await prisma.prospects.findMany({
      where: {
        workspaceId: workspaceId,
        assignedUserId: userId,
        status: { in: ['engaged', 'qualified', 'follow-up', 'active'] },
        deletedAt: null
      },
      take: 5,
      select: {
        id: true,
        fullName: true,
        status: true,
        priority: true,
        company: true
      }
    });
    
    console.log(`\n🏃‍♂️ Prospects that qualify for speedrun: ${speedrunProspects.length}`);
    speedrunProspects.forEach((prospect, index) => {
      console.log(`${index + 1}. ${prospect.fullName} - Status: ${prospect.status} - Priority: ${prospect.priority} - Company: ${prospect.company}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking lead statuses:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLeadStatuses();
