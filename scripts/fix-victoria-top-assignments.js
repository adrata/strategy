#!/usr/bin/env node

/**
 * Fix Victoria's Assignments in TOP Workspace
 * 
 * Reassigns all people and companies from temp-victoria to the real Victoria
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const TOP_WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';
const VICTORIA_EMAIL = 'vleland@topengineersplus.com';
const TEMP_VICTORIA_EMAIL = 'temp-victoria@top-temp.com';

async function fixVictoriaAssignments() {
  console.log('🔧 FIXING VICTORIA\'S ASSIGNMENTS IN TOP WORKSPACE');
  console.log('=================================================');
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
        email: true
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
        email: true
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
    console.log('');

    if (!tempVictoria) {
      console.log('✅ No temp-victoria user found - nothing to fix!');
      return;
    }

    console.log('⚠️  Found TEMP Victoria user:');
    console.log(`   ID: ${tempVictoria.id}`);
    console.log(`   Name: ${tempVictoria.name}`);
    console.log(`   Email: ${tempVictoria.email}`);
    console.log('');

    // Step 2: Count records to update
    console.log('📊 Step 2: Counting records to update...');
    const peopleToUpdate = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        mainSellerId: tempVictoria.id
      }
    });

    const companiesToUpdate = await prisma.companies.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        mainSellerId: tempVictoria.id
      }
    });

    console.log(`   People to reassign: ${peopleToUpdate}`);
    console.log(`   Companies to reassign: ${companiesToUpdate}`);
    console.log('');

    if (peopleToUpdate === 0 && companiesToUpdate === 0) {
      console.log('✅ No records to update!');
      return;
    }

    // Step 3: Update people
    if (peopleToUpdate > 0) {
      console.log('👥 Step 3: Reassigning people to Victoria...');
      const peopleResult = await prisma.people.updateMany({
        where: {
          workspaceId: TOP_WORKSPACE_ID,
          deletedAt: null,
          mainSellerId: tempVictoria.id
        },
        data: {
          mainSellerId: victoria.id,
          updatedAt: new Date()
        }
      });
      console.log(`✅ Updated ${peopleResult.count} people records`);
      console.log('');
    }

    // Step 4: Update companies
    if (companiesToUpdate > 0) {
      console.log('🏢 Step 4: Reassigning companies to Victoria...');
      const companiesResult = await prisma.companies.updateMany({
        where: {
          workspaceId: TOP_WORKSPACE_ID,
          deletedAt: null,
          mainSellerId: tempVictoria.id
        },
        data: {
          mainSellerId: victoria.id,
          updatedAt: new Date()
        }
      });
      console.log(`✅ Updated ${companiesResult.count} company records`);
      console.log('');
    }

    // Step 5: Verify the fix
    console.log('🔍 Step 5: Verifying the fix...');
    const peopleWithVictoria = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        mainSellerId: victoria.id
      }
    });

    const companiesWithVictoria = await prisma.companies.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        mainSellerId: victoria.id
      }
    });

    const peopleWithTempVictoria = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        mainSellerId: tempVictoria.id
      }
    });

    const companiesWithTempVictoria = await prisma.companies.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        mainSellerId: tempVictoria.id
      }
    });

    console.log(`✅ People with Victoria: ${peopleWithVictoria}`);
    console.log(`✅ Companies with Victoria: ${companiesWithVictoria}`);
    console.log(`   People still with temp-victoria: ${peopleWithTempVictoria}`);
    console.log(`   Companies still with temp-victoria: ${companiesWithTempVictoria}`);
    console.log('');

    // Summary
    console.log('🎉 FIX COMPLETED');
    console.log('================');
    console.log(`✅ Reassigned ${peopleToUpdate} people to Victoria`);
    console.log(`✅ Reassigned ${companiesToUpdate} companies to Victoria`);
    console.log(`✅ Total people with Victoria: ${peopleWithVictoria}`);
    console.log(`✅ Total companies with Victoria: ${companiesWithVictoria}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error during fix:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
if (require.main === module) {
  fixVictoriaAssignments().catch(console.error);
}

module.exports = { fixVictoriaAssignments };

