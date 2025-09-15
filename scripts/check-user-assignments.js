const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserAssignments() {
  try {
    console.log('🔍 Checking user assignments in Notary Everyday workspace...\n');
    
    const NOTARY_WORKSPACE_ID = '01K1VBYXHD0J895XAN0HGFBKJP';
    const DANO_USER_ID = '01K1VBYYV7TRPY04NW4TW4XWRB';
    
    // Get details about the users who have companies assigned
    const userIds = [
      '01K1VBYZMWTCT09FWEKBDMCXZM', // 378 companies
      '01K1VBYZG41K9QA0D9CF06KNRG', // 14 companies
      DANO_USER_ID // 0 companies
    ];
    
    for (const userId of userIds) {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true }
      });
      
      const companyCount = await prisma.companies.count({
        where: {
          workspaceId: NOTARY_WORKSPACE_ID,
          assignedUserId: userId,
          deletedAt: null
        }
      });
      
      if (user) {
        console.log(`👤 ${user.name} (${user.email})`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Companies assigned: ${companyCount}`);
      } else {
        console.log(`❌ User not found: ${userId}`);
        console.log(`   Companies assigned: ${companyCount}`);
      }
      console.log('');
    }
    
    // Check if Dano is a member of the Notary Everyday workspace
    const danoMembership = await prisma.workspaceMembers.findFirst({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        userId: DANO_USER_ID
      }
    });
    
    console.log(`🏢 Dano's membership in Notary Everyday workspace:`);
    if (danoMembership) {
      console.log(`   ✅ Dano is a member (role: ${danoMembership.role})`);
    } else {
      console.log(`   ❌ Dano is NOT a member of Notary Everyday workspace`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserAssignments();
