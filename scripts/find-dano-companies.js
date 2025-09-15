const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findDanoCompanies() {
  try {
    console.log('🔍 Finding companies that should be assigned to Dano...\n');
    
    const NOTARY_WORKSPACE_ID = '01K1VBYXHD0J895XAN0HGFBKJP';
    const DANO_USER_ID = '01K1VBYYV7TRPY04NW4TW4XWRB';
    const DANO_EMAIL = 'dano@retail-products.com';
    
    // Check 1: Companies directly assigned to Dano
    const directlyAssigned = await prisma.companies.count({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: DANO_USER_ID,
        deletedAt: null
      }
    });
    console.log(`1️⃣ Companies directly assigned to Dano: ${directlyAssigned}`);
    
    // Check 2: Companies that might be associated through other relationships
    // Check if there are companies with Dano's email in any field
    const emailAssociated = await prisma.companies.count({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        deletedAt: null,
        OR: [
          { email: { contains: 'dano' } },
          { email: { contains: 'retail-products' } }
        ]
      }
    });
    console.log(`2️⃣ Companies with Dano-related email: ${emailAssociated}`);
    
    // Check 3: Companies that might be in custom fields or notes
    const customFieldAssociated = await prisma.companies.count({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        deletedAt: null,
        OR: [
          { notes: { contains: 'dano' } },
          { notes: { contains: 'Dano' } },
          { customFields: { path: ['assignedTo'], string_contains: 'dano' } },
          { customFields: { path: ['assignedTo'], string_contains: 'Dano' } }
        ]
      }
    });
    console.log(`3️⃣ Companies with Dano in notes/custom fields: ${customFieldAssociated}`);
    
    // Check 4: Look for companies that might be assigned to a different Dano user ID
    // Maybe there's another user record for Dano
    const danoUsers = await prisma.users.findMany({
      where: {
        email: { contains: 'dano' }
      },
      select: { id: true, email: true, name: true }
    });
    
    console.log(`\n👥 All users with 'dano' in email:`);
    for (const user of danoUsers) {
      const companyCount = await prisma.companies.count({
        where: {
          workspaceId: NOTARY_WORKSPACE_ID,
          assignedUserId: user.id,
          deletedAt: null
        }
      });
      console.log(`   ${user.name} (${user.email}) - ID: ${user.id} - Companies: ${companyCount}`);
    }
    
    // Check 5: Look for companies that might be unassigned but should belong to Dano
    const unassignedCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: null,
        deletedAt: null
      },
      select: { id: true, name: true },
      take: 20
    });
    
    console.log(`\n📋 Sample unassigned companies (first 20):`);
    unassignedCompanies.forEach(company => {
      console.log(`   ${company.name}`);
    });
    
    // Check 6: Maybe companies are assigned to Dano but with a different workspace
    const danoInOtherWorkspaces = await prisma.companies.count({
      where: {
        assignedUserId: DANO_USER_ID,
        deletedAt: null,
        workspaceId: { not: NOTARY_WORKSPACE_ID }
      }
    });
    console.log(`\n🌐 Companies assigned to Dano in OTHER workspaces: ${danoInOtherWorkspaces}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findDanoCompanies();
