const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserLeads() {
  try {
    console.log('🔍 Checking leads for different users...\n');
    
    // Get all workspace users
    const workspaceUsers = await prisma.workspace_users.findMany({
      take: 5
    });
    
    console.log('👥 Workspace users:');
    workspaceUsers.forEach((wu, index) => {
      console.log(`${index + 1}. User: ${wu.userId}, Workspace: ${wu.workspaceId}, Role: ${wu.role}`);
    });
    
    // Check leads for each user
    for (const wu of workspaceUsers) {
      const leadCount = await prisma.leads.count({
        where: {
          workspaceId: wu.workspaceId,
          assignedUserId: wu.userId,
          deletedAt: null
        }
      });
      
      console.log(`\n📊 User ${wu.userId} in workspace ${wu.workspaceId}: ${leadCount} leads`);
      
      if (leadCount > 0) {
        const sampleLeads = await prisma.leads.findMany({
          where: {
            workspaceId: wu.workspaceId,
            assignedUserId: wu.userId,
            deletedAt: null
          },
          take: 3,
          select: {
            id: true,
            fullName: true,
            company: true,
            jobTitle: true,
            title: true,
            state: true,
            accountId: true
          }
        });
        
        console.log('Sample leads:');
        sampleLeads.forEach(lead => {
          console.log(`  - ${lead.fullName} (${lead.company}) - ${lead.jobTitle || lead.title || 'No title'}`);
        });
      }
    }
    
    // Also check total leads in the database
    const totalLeads = await prisma.leads.count({
      where: { deletedAt: null }
    });
    
    console.log(`\n📊 Total leads in database: ${totalLeads}`);
    
    // Check leads without assignedUserId
    const unassignedLeads = await prisma.leads.count({
      where: { 
        deletedAt: null,
        assignedUserId: null
      }
    });
    
    console.log(`📊 Unassigned leads: ${unassignedLeads}`);
    
  } catch (error) {
    console.error('❌ Error checking leads:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserLeads();
