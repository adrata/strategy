const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugDanoCompanies() {
  try {
    console.log('🔍 Debugging Dano\'s company assignments...\n');
    
    const NOTARY_WORKSPACE_ID = '01K1VBYXHD0J895XAN0HGFBKJP';
    const DANO_USER_ID = '01K1VBYYV7TRPY04NW4TW4XWRB';
    
    // Check total companies in Notary Everyday workspace
    const totalCompanies = await prisma.companies.count({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        deletedAt: null
      }
    });
    
    console.log(`📊 Total companies in Notary Everyday workspace: ${totalCompanies}`);
    
    // Check companies assigned to Dano specifically
    const danoCompanies = await prisma.companies.count({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: DANO_USER_ID,
        deletedAt: null
      }
    });
    
    console.log(`👤 Companies assigned to Dano: ${danoCompanies}`);
    
    // Check all assigned users in the workspace
    const assignedUsers = await prisma.companies.groupBy({
      by: ['assignedUserId'],
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        deletedAt: null,
        assignedUserId: { not: null }
      },
      _count: {
        id: true
      }
    });
    
    console.log(`\n📋 Companies by assigned user:`);
    for (const user of assignedUsers) {
      console.log(`   User ${user.assignedUserId}: ${user._count.id} companies`);
    }
    
    // Check unassigned companies
    const unassignedCount = await prisma.companies.count({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        deletedAt: null,
        assignedUserId: null
      }
    });
    
    console.log(`   Unassigned: ${unassignedCount} companies`);
    
    // Get a sample of companies to see their assignment status
    const sampleCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        assignedUserId: true
      },
      take: 10
    });
    
    console.log(`\n📝 Sample companies (first 10):`);
    sampleCompanies.forEach(company => {
      console.log(`   ${company.name} - Assigned to: ${company.assignedUserId || 'UNASSIGNED'}`);
    });
    
    // Check if Dano user exists
    const danoUser = await prisma.users.findUnique({
      where: { id: DANO_USER_ID },
      select: { id: true, email: true, name: true }
    });
    
    console.log(`\n👤 Dano user check:`);
    if (danoUser) {
      console.log(`   ✅ Found: ${danoUser.name} (${danoUser.email})`);
    } else {
      console.log(`   ❌ User not found with ID: ${DANO_USER_ID}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugDanoCompanies();
