#!/usr/bin/env node

/**
 * Cleanup Unassigned Records in Notary Everyday Workspace
 * 
 * This script assigns all records with NULL mainSellerId to Dano in the Notary Everyday workspace.
 * This fixes the issue where records created before the mainSellerId fix weren't showing up.
 * 
 * Usage: node scripts/cleanup-notary-unassigned-records.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Dano's user ID in Notary Everyday workspace
const DANO_USER_ID = '01K7DP7QHQ7WATZAJAXCGANBYJ';

async function findNotaryEverydayWorkspace() {
  console.log('🔍 Finding Notary Everyday workspace...');
  
  const workspace = await prisma.workspaces.findFirst({
    where: {
      OR: [
        { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
        { name: { contains: 'NotaryEveryday', mode: 'insensitive' } },
        { slug: { contains: 'notary-everyday', mode: 'insensitive' } },
        { slug: { contains: 'notaryeveryday', mode: 'insensitive' } },
        { slug: 'ne' }
      ]
    }
  });
  
  if (!workspace) {
    throw new Error('❌ Notary Everyday workspace not found!');
  }

  console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})`);
  return workspace;
}

async function verifyDanoUser() {
  console.log('\n👤 Verifying Dano user...');
  
  const user = await prisma.users.findUnique({
    where: { id: DANO_USER_ID },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      name: true
    }
  });
  
  if (!user) {
    throw new Error(`❌ User with ID ${DANO_USER_ID} not found!`);
  }
  
  console.log(`✅ Found user: ${user.name || user.email} (${user.id})`);
  return user;
}

async function cleanupUnassignedPeople(workspaceId) {
  console.log('\n👥 Cleaning up unassigned people...');
  
  // Find people with NULL mainSellerId
  const unassignedPeople = await prisma.people.findMany({
    where: {
      workspaceId: workspaceId,
      mainSellerId: null,
      deletedAt: null
    },
    select: {
      id: true,
      fullName: true,
      status: true,
      createdAt: true
    }
  });
  
  console.log(`📊 Found ${unassignedPeople.length} unassigned people`);
  
  if (unassignedPeople.length > 0) {
    console.log('📝 Sample records:');
    unassignedPeople.slice(0, 5).forEach(person => {
      console.log(`  - ${person.fullName} (${person.status}) - Created: ${person.createdAt.toISOString()}`);
    });
    
    // Update all unassigned people to Dano
    const result = await prisma.people.updateMany({
      where: {
        workspaceId: workspaceId,
        mainSellerId: null,
        deletedAt: null
      },
      data: {
        mainSellerId: DANO_USER_ID,
        updatedAt: new Date()
      }
    });
    
    console.log(`✅ Assigned ${result.count} people to Dano`);
  } else {
    console.log('✅ No unassigned people found');
  }
  
  return unassignedPeople.length;
}

async function cleanupUnassignedCompanies(workspaceId) {
  console.log('\n🏢 Cleaning up unassigned companies...');
  
  // Find companies with NULL mainSellerId
  const unassignedCompanies = await prisma.companies.findMany({
    where: {
      workspaceId: workspaceId,
      mainSellerId: null,
      deletedAt: null
    },
    select: {
      id: true,
      name: true,
      status: true,
      createdAt: true
    }
  });
  
  console.log(`📊 Found ${unassignedCompanies.length} unassigned companies`);
  
  if (unassignedCompanies.length > 0) {
    console.log('📝 Sample records:');
    unassignedCompanies.slice(0, 5).forEach(company => {
      console.log(`  - ${company.name} (${company.status || 'ACTIVE'}) - Created: ${company.createdAt.toISOString()}`);
    });
    
    // Update all unassigned companies to Dano
    const result = await prisma.companies.updateMany({
      where: {
        workspaceId: workspaceId,
        mainSellerId: null,
        deletedAt: null
      },
      data: {
        mainSellerId: DANO_USER_ID,
        updatedAt: new Date()
      }
    });
    
    console.log(`✅ Assigned ${result.count} companies to Dano`);
  } else {
    console.log('✅ No unassigned companies found');
  }
  
  return unassignedCompanies.length;
}

async function verifyCleanup(workspaceId) {
  console.log('\n🔍 Verifying cleanup...');
  
  const stats = await prisma.$transaction([
    // Count people by status
    prisma.people.groupBy({
      by: ['status'],
      where: {
        workspaceId: workspaceId,
        mainSellerId: DANO_USER_ID,
        deletedAt: null
      },
      _count: { id: true }
    }),
    // Count companies by status
    prisma.companies.groupBy({
      by: ['status'],
      where: {
        workspaceId: workspaceId,
        mainSellerId: DANO_USER_ID,
        deletedAt: null
      },
      _count: { id: true }
    }),
    // Count any remaining unassigned people
    prisma.people.count({
      where: {
        workspaceId: workspaceId,
        mainSellerId: null,
        deletedAt: null
      }
    }),
    // Count any remaining unassigned companies
    prisma.companies.count({
      where: {
        workspaceId: workspaceId,
        mainSellerId: null,
        deletedAt: null
      }
    })
  ]);
  
  const [peopleByStatus, companiesByStatus, remainingUnassignedPeople, remainingUnassignedCompanies] = stats;
  
  console.log('\n📊 Final Stats:');
  console.log('\nPeople assigned to Dano:');
  peopleByStatus.forEach(stat => {
    console.log(`  ${stat.status}: ${stat._count.id}`);
  });
  const totalPeople = peopleByStatus.reduce((sum, stat) => sum + stat._count.id, 0);
  console.log(`  TOTAL: ${totalPeople}`);
  
  console.log('\nCompanies assigned to Dano:');
  companiesByStatus.forEach(stat => {
    console.log(`  ${stat.status || 'ACTIVE'}: ${stat._count.id}`);
  });
  const totalCompanies = companiesByStatus.reduce((sum, stat) => sum + stat._count.id, 0);
  console.log(`  TOTAL: ${totalCompanies}`);
  
  console.log('\n🔍 Remaining unassigned records:');
  console.log(`  People: ${remainingUnassignedPeople}`);
  console.log(`  Companies: ${remainingUnassignedCompanies}`);
  
  if (remainingUnassignedPeople === 0 && remainingUnassignedCompanies === 0) {
    console.log('\n✅ All records are now properly assigned!');
  } else {
    console.log('\n⚠️  Some records are still unassigned');
  }
}

async function main() {
  console.log('🧹 Starting cleanup of unassigned records in Notary Everyday workspace...\n');
  
  try {
    // Find workspace and verify user
    const workspace = await findNotaryEverydayWorkspace();
    await verifyDanoUser();
    
    // Cleanup unassigned records
    const peopleCount = await cleanupUnassignedPeople(workspace.id);
    const companiesCount = await cleanupUnassignedCompanies(workspace.id);
    
    // Verify cleanup
    await verifyCleanup(workspace.id);
    
    console.log('\n✅ Cleanup completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`  - ${peopleCount} people assigned to Dano`);
    console.log(`  - ${companiesCount} companies assigned to Dano`);
    console.log(`  - All records should now be visible in the UI`);
    
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

