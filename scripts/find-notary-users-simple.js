#!/usr/bin/env node

/**
 * Find users in Notary Everyday workspace
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
  
  // Find all users (simple approach)
  const allUsers = await prisma.users.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true
    }
  });
  
  console.log(`👥 All users in system:\n`);
  allUsers.forEach(user => {
    const displayName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
    console.log(`  - ${displayName} (${user.email})`);
    console.log(`    ID: ${user.id}\n`);
  });
  
  // Check for unassigned records in Notary Everyday
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
  
  console.log(`\n📊 Unassigned records in Notary Everyday:`);
  console.log(`  - People: ${unassignedPeople}`);
  console.log(`  - Companies: ${unassignedCompanies}`);
  
  // Find records with sellers assigned
  const peopleWithSellers = await prisma.people.findMany({
    where: {
      workspaceId: workspace.id,
      mainSellerId: { not: null },
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
    take: 5
  });
  
  console.log(`\n📊 Sample assigned records:`);
  peopleWithSellers.forEach(p => {
    if (p.mainSeller) {
      console.log(`  - ${p.mainSeller.name || p.mainSeller.email} (${p.mainSeller.id})`);
    }
  });
  
  await prisma.$disconnect();
}

main().catch(console.error);

