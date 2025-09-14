const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkLeadsData() {
  try {
    console.log('🔍 Checking leads data in database...\n');
    
    // Get a sample of leads
    const leads = await prisma.leads.findMany({
      take: 5,
      select: {
        id: true,
        fullName: true,
        email: true,
        company: true,
        title: true,
        jobTitle: true,
        department: true,
        state: true,
        accountId: true,
        personId: true,
        workspaceId: true,
        assignedUserId: true,
      }
    });
    
    console.log('📊 Sample leads data:');
    console.log(JSON.stringify(leads, null, 2));
    
    // Check if there are any leads with accountId
    const leadsWithAccounts = await prisma.leads.findMany({
      where: {
        accountId: { not: null }
      },
      take: 3,
      select: {
        id: true,
        fullName: true,
        accountId: true,
        company: true,
      }
    });
    
    console.log('\n🏢 Leads with accountId:');
    console.log(JSON.stringify(leadsWithAccounts, null, 2));
    
    // Check accounts table
    const accounts = await prisma.accounts.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        industry: true,
        state: true,
        workspaceId: true,
      }
    });
    
    console.log('\n🏢 Sample accounts data:');
    console.log(JSON.stringify(accounts, null, 2));
    
    // Check person table
    const persons = await prisma.person.findMany({
      take: 5,
      select: {
        id: true,
        fullName: true,
        title: true,
        department: true,
      }
    });
    
    console.log('\n👤 Sample person data:');
    console.log(JSON.stringify(persons, null, 2));
    
    // Check workspace_users to see what workspace we should use
    const workspaceUsers = await prisma.workspace_users.findMany({
      take: 3,
      select: {
        id: true,
        workspaceId: true,
        userId: true,
        workspaces: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      }
    });
    
    console.log('\n🏢 Sample workspace_users data:');
    console.log(JSON.stringify(workspaceUsers, null, 2));
    
  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLeadsData();
