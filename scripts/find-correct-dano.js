const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findCorrectDano() {
  try {
    console.log('🔍 Finding the correct Dano user and his companies...\n');
    
    const NOTARY_WORKSPACE_ID = '01K1VBYXHD0J895XAN0HGFBKJP';
    const DANO_EMAIL = 'dano@retail-products.com';
    
    // First, find ALL users with dano@retail-products.com email
    const danoUsers = await prisma.users.findMany({
      where: {
        email: DANO_EMAIL
      },
      select: { id: true, email: true, name: true }
    });
    
    console.log(`👥 All users with email ${DANO_EMAIL}:`);
    for (const user of danoUsers) {
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      
      // Check companies assigned to this user in Notary Everyday workspace
      const companyCount = await prisma.companies.count({
        where: {
          workspaceId: NOTARY_WORKSPACE_ID,
          assignedUserId: user.id,
          deletedAt: null
        }
      });
      console.log(`   Companies in Notary Everyday: ${companyCount}`);
      console.log('');
    }
    
    // Also check if there are any users with similar names/emails
    const similarUsers = await prisma.users.findMany({
      where: {
        OR: [
          { email: { contains: 'dano' } },
          { name: { contains: 'Dano' } },
          { name: { contains: 'dano' } }
        ]
      },
      select: { id: true, email: true, name: true }
    });
    
    console.log(`🔍 Users with 'dano' in name or email:`);
    for (const user of similarUsers) {
      const companyCount = await prisma.companies.count({
        where: {
          workspaceId: NOTARY_WORKSPACE_ID,
          assignedUserId: user.id,
          deletedAt: null
        }
      });
      console.log(`   ${user.name} (${user.email}) - ID: ${user.id} - Companies: ${companyCount}`);
    }
    
    // Check if Dano is a member of the Notary Everyday workspace
    console.log(`\n🏢 Checking workspace memberships:`);
    for (const user of danoUsers) {
      const membership = await prisma.workspaceMembers.findFirst({
        where: {
          workspaceId: NOTARY_WORKSPACE_ID,
          userId: user.id
        }
      });
      
      if (membership) {
        console.log(`   ✅ ${user.name} is a member of Notary Everyday (role: ${membership.role})`);
      } else {
        console.log(`   ❌ ${user.name} is NOT a member of Notary Everyday`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findCorrectDano();
