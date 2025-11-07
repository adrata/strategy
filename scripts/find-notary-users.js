#!/usr/bin/env node

/**
 * Find all users in Notary Everyday workspace
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Finding Notary Everyday workspace and users...\n');
  
  // Find workspace
  const workspace = await prisma.workspaces.findFirst({
    where: {
      OR: [
        { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
        { slug: 'ne' }
      ]
    }
  });
  
  if (!workspace) {
    console.log('❌ Notary Everyday workspace not found');
    return;
  }
  
  console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})\n`);
  
  // Find users with access to this workspace
  const users = await prisma.users.findMany({
    where: {
      OR: [
        { activeWorkspaceId: workspace.id },
        {
          workspaces: {
            some: {
              id: workspace.id
            }
          }
        }
      ]
    },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      activeWorkspaceId: true
    }
  });
  
  console.log(`👥 Found ${users.length} users with access to this workspace:\n`);
  users.forEach(user => {
    console.log(`  - ${user.name || `${user.firstName} ${user.lastName}`} (${user.email})`);
    console.log(`    ID: ${user.id}`);
    console.log(`    Active Workspace: ${user.activeWorkspaceId}\n`);
  });
  
  // Also check for records created in this workspace
  const [peopleCreators, companyCreators] = await Promise.all([
    prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null
      },
      select: {
        mainSellerId: true,
        mainSeller: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      distinct: ['mainSellerId']
    }),
    prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null
      },
      select: {
        mainSellerId: true,
        mainSeller: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      distinct: ['mainSellerId']
    })
  ]);
  
  const allSellerIds = new Set([
    ...peopleCreators.map(p => p.mainSellerId).filter(Boolean),
    ...companyCreators.map(c => c.mainSellerId).filter(Boolean)
  ]);
  
  console.log(`📊 Users who have records in this workspace:\n`);
  allSellerIds.forEach(sellerId => {
    const seller = [...peopleCreators, ...companyCreators]
      .find(p => p.mainSellerId === sellerId)?.mainSeller;
    
    if (seller) {
      console.log(`  - ${seller.name || seller.email} (${seller.id})`);
    } else if (sellerId) {
      console.log(`  - Unknown user (${sellerId})`);
    }
  });
  
  // Check for unassigned records
  const [unassignedPeople, unassignedCompanies] = await Promise.all([
    prisma.people.count({
      where: {
        workspaceId: workspace.id,
        mainSellerId: null,
        deletedAt: null
      }
    }),
    prisma.companies.count({
      where: {
        workspaceId: workspace.id,
        mainSellerId: null,
        deletedAt: null
      }
    })
  ]);
  
  console.log(`\n📊 Unassigned records:`);
  console.log(`  - People: ${unassignedPeople}`);
  console.log(`  - Companies: ${unassignedCompanies}`);
  
  await prisma.$disconnect();
}

main().catch(console.error);

