#!/usr/bin/env node

/**
 * Audit Victoria's Assignments in TOP Workspace
 * 
 * Checks:
 * 1. How many people/companies are assigned to Victoria (vleland@topengineersplus.com)
 * 2. If there's a duplicate temp-victoria user
 * 3. How many people/companies are assigned to temp-victoria
 * 4. Total people/companies in the workspace
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const TOP_WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';
const VICTORIA_EMAIL = 'vleland@topengineersplus.com';
const TEMP_VICTORIA_EMAIL = 'temp-victoria@top-temp.com';

async function auditVictoriaAssignments() {
  console.log('🔍 AUDITING VICTORIA\'S ASSIGNMENTS IN TOP WORKSPACE');
  console.log('==================================================');
  console.log('');

  try {
    await prisma.$connect();
    console.log('✅ Connected to database');
    console.log('');

    // Step 1: Find Victoria users
    console.log('👤 Step 1: Finding Victoria users...');
    const victoria = await prisma.users.findFirst({
      where: { email: VICTORIA_EMAIL },
      select: {
        id: true,
        name: true,
        email: true,
        username: true
      }
    });

    const tempVictoria = await prisma.users.findFirst({
      where: {
        OR: [
          { email: TEMP_VICTORIA_EMAIL },
          { username: 'temp-victoria' }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true
      }
    });

    if (!victoria) {
      console.log('❌ Victoria (vleland@topengineersplus.com) not found!');
      return;
    }

    console.log('✅ Found Victoria:');
    console.log(`   ID: ${victoria.id}`);
    console.log(`   Name: ${victoria.name}`);
    console.log(`   Email: ${victoria.email}`);
    console.log(`   Username: ${victoria.username || 'N/A'}`);
    console.log('');

    if (tempVictoria) {
      console.log('⚠️  Found TEMP Victoria user:');
      console.log(`   ID: ${tempVictoria.id}`);
      console.log(`   Name: ${tempVictoria.name}`);
      console.log(`   Email: ${tempVictoria.email}`);
      console.log(`   Username: ${tempVictoria.username || 'N/A'}`);
      console.log('');
    } else {
      console.log('✅ No temp-victoria user found (good!)');
      console.log('');
    }

    // Step 2: Get workspace info
    console.log('🏢 Step 2: Getting workspace info...');
    const workspace = await prisma.workspaces.findUnique({
      where: { id: TOP_WORKSPACE_ID },
      select: {
        id: true,
        name: true,
        slug: true
      }
    });

    if (!workspace) {
      console.log('❌ TOP workspace not found!');
      return;
    }

    console.log(`✅ Workspace: ${workspace.name} (${workspace.slug})`);
    console.log('');

    // Step 3: Count people assigned to Victoria
    console.log('👥 Step 3: Counting people assignments...');
    const totalPeople = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null
      }
    });

    const peopleWithVictoria = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        mainSellerId: victoria.id
      }
    });

    const peopleWithTempVictoria = tempVictoria ? await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        mainSellerId: tempVictoria.id
      }
    }) : 0;

    const peopleWithNoSeller = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        mainSellerId: null
      }
    });

    const peopleWithOtherSeller = totalPeople - peopleWithVictoria - peopleWithTempVictoria - peopleWithNoSeller;

    console.log(`   Total people: ${totalPeople}`);
    console.log(`   ✅ Assigned to Victoria: ${peopleWithVictoria} (${((peopleWithVictoria / totalPeople) * 100).toFixed(1)}%)`);
    if (tempVictoria) {
      console.log(`   ⚠️  Assigned to temp-victoria: ${peopleWithTempVictoria} (${((peopleWithTempVictoria / totalPeople) * 100).toFixed(1)}%)`);
    }
    console.log(`   ❌ No seller assigned: ${peopleWithNoSeller} (${((peopleWithNoSeller / totalPeople) * 100).toFixed(1)}%)`);
    console.log(`   ⚠️  Assigned to other sellers: ${peopleWithOtherSeller} (${((peopleWithOtherSeller / totalPeople) * 100).toFixed(1)}%)`);
    console.log('');

    // Step 4: Count companies assigned to Victoria
    console.log('🏢 Step 4: Counting company assignments...');
    const totalCompanies = await prisma.companies.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null
      }
    });

    const companiesWithVictoria = await prisma.companies.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        mainSellerId: victoria.id
      }
    });

    const companiesWithTempVictoria = tempVictoria ? await prisma.companies.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        mainSellerId: tempVictoria.id
      }
    }) : 0;

    const companiesWithNoSeller = await prisma.companies.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        mainSellerId: null
      }
    });

    const companiesWithOtherSeller = totalCompanies - companiesWithVictoria - companiesWithTempVictoria - companiesWithNoSeller;

    console.log(`   Total companies: ${totalCompanies}`);
    console.log(`   ✅ Assigned to Victoria: ${companiesWithVictoria} (${((companiesWithVictoria / totalCompanies) * 100).toFixed(1)}%)`);
    if (tempVictoria) {
      console.log(`   ⚠️  Assigned to temp-victoria: ${companiesWithTempVictoria} (${((companiesWithTempVictoria / totalCompanies) * 100).toFixed(1)}%)`);
    }
    console.log(`   ❌ No seller assigned: ${companiesWithNoSeller} (${((companiesWithNoSeller / totalCompanies) * 100).toFixed(1)}%)`);
    console.log(`   ⚠️  Assigned to other sellers: ${companiesWithOtherSeller} (${((companiesWithOtherSeller / totalCompanies) * 100).toFixed(1)}%)`);
    console.log('');

    // Step 5: Find other sellers in the workspace
    console.log('👥 Step 5: Finding other sellers in workspace...');
    const otherSellers = await prisma.people.groupBy({
      by: ['mainSellerId'],
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        mainSellerId: {
          not: null,
          notIn: tempVictoria ? [victoria.id, tempVictoria.id] : [victoria.id]
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });

    if (otherSellers.length > 0) {
      console.log(`   Found ${otherSellers.length} other sellers with assignments:`);
      for (const seller of otherSellers) {
        const sellerUser = await prisma.users.findUnique({
          where: { id: seller.mainSellerId },
          select: { name: true, email: true, username: true }
        });
        console.log(`   - ${sellerUser?.name || 'Unknown'} (${sellerUser?.email || seller.mainSellerId}): ${seller._count.id} people`);
      }
    } else {
      console.log('   ✅ No other sellers found');
    }
    console.log('');

    // Step 6: Check workspace_users for Victoria
    console.log('🔐 Step 6: Checking workspace membership...');
    const victoriaWorkspaceMembership = await prisma.workspace_users.findFirst({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        userId: victoria.id
      },
      select: {
        id: true,
        role: true,
        isActive: true
      }
    });

    if (victoriaWorkspaceMembership) {
      console.log('✅ Victoria is a member of the workspace:');
      console.log(`   Role: ${victoriaWorkspaceMembership.role}`);
      console.log(`   Active: ${victoriaWorkspaceMembership.isActive}`);
    } else {
      console.log('❌ Victoria is NOT a member of the workspace!');
    }
    console.log('');

    // Summary
    console.log('📊 SUMMARY');
    console.log('==========');
    console.log(`Victoria (${victoria.email}):`);
    console.log(`   People: ${peopleWithVictoria}/${totalPeople} (${((peopleWithVictoria / totalPeople) * 100).toFixed(1)}%)`);
    console.log(`   Companies: ${companiesWithVictoria}/${totalCompanies} (${((companiesWithVictoria / totalCompanies) * 100).toFixed(1)}%)`);
    console.log('');

    if (tempVictoria) {
      console.log(`⚠️  ISSUE FOUND: Duplicate temp-victoria user exists!`);
      console.log(`   People assigned to temp-victoria: ${peopleWithTempVictoria}`);
      console.log(`   Companies assigned to temp-victoria: ${companiesWithTempVictoria}`);
      console.log('');
      console.log('💡 RECOMMENDATION: Run fix script to reassign temp-victoria records to Victoria');
    }

    if (peopleWithNoSeller > 0 || companiesWithNoSeller > 0) {
      console.log(`⚠️  ISSUE FOUND: ${peopleWithNoSeller} people and ${companiesWithNoSeller} companies have no seller assigned`);
      console.log('💡 RECOMMENDATION: Run set-victoria-main-seller-top.js to assign them to Victoria');
    }

    if (peopleWithOtherSeller > 0 || companiesWithOtherSeller > 0) {
      console.log(`⚠️  ISSUE FOUND: ${peopleWithOtherSeller} people and ${companiesWithOtherSeller} companies assigned to other sellers`);
      console.log('💡 RECOMMENDATION: Review if these should be reassigned to Victoria');
    }

  } catch (error) {
    console.error('❌ Error during audit:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit
if (require.main === module) {
  auditVictoriaAssignments().catch(console.error);
}

module.exports = { auditVictoriaAssignments };

