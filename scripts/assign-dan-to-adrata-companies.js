#!/usr/bin/env node

/**
 * 🔧 ASSIGN DAN TO ADRATA COMPANIES
 * 
 * Assign Dan Mirolli as mainSellerId for all companies in the Adrata workspace
 * so they appear in his companies list.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Key IDs from the codebase
const DAN_USER_ID = '01K7B327HWN9G6KGWA97S1TK43'; // Dan Mirolli (actual ID from database)
const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V'; // Adrata workspace (correct ID)

async function assignDanToAdrataCompanies() {
  try {
    console.log('🚀 ASSIGNING DAN TO ADRATA COMPANIES');
    console.log('====================================');
    console.log(`Dan's User ID: ${DAN_USER_ID}`);
    console.log(`Adrata Workspace ID: ${ADRATA_WORKSPACE_ID}`);
    console.log('');

    await prisma.$connect();
    console.log('✅ Connected to database!\n');

    // Step 1: Check current state
    console.log('📊 CHECKING CURRENT STATE:');
    console.log('==========================');
    
    const allCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        mainSellerId: true
      }
    });

    console.log(`Total companies in Adrata workspace: ${allCompanies.length}`);
    
    const danCompanies = allCompanies.filter(c => c.mainSellerId === DAN_USER_ID);
    const unassignedCompanies = allCompanies.filter(c => c.mainSellerId === null);
    const otherAssignedCompanies = allCompanies.filter(c => c.mainSellerId !== null && c.mainSellerId !== DAN_USER_ID);

    console.log(`   ✅ Already assigned to Dan: ${danCompanies.length}`);
    console.log(`   ❓ Unassigned (null): ${unassignedCompanies.length}`);
    console.log(`   ❌ Assigned to others: ${otherAssignedCompanies.length}`);
    console.log('');

    if (otherAssignedCompanies.length > 0) {
      console.log('🔍 COMPANIES ASSIGNED TO OTHER SELLERS:');
      otherAssignedCompanies.slice(0, 5).forEach((company, index) => {
        console.log(`   ${index + 1}. ${company.name} (assigned to: ${company.mainSellerId})`);
      });
      if (otherAssignedCompanies.length > 5) {
        console.log(`   ... and ${otherAssignedCompanies.length - 5} more`);
      }
      console.log('');
    }

    // Step 2: Update all companies to assign Dan as main seller
    console.log('🔄 UPDATING COMPANY ASSIGNMENTS:');
    console.log('================================');
    
    const companiesToUpdate = allCompanies.filter(c => c.mainSellerId !== DAN_USER_ID);
    
    if (companiesToUpdate.length === 0) {
      console.log('✅ All companies are already assigned to Dan!');
      return;
    }

    console.log(`Updating ${companiesToUpdate.length} companies...`);

    const updateResult = await prisma.companies.updateMany({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        deletedAt: null,
        mainSellerId: {
          not: DAN_USER_ID
        }
      },
      data: {
        mainSellerId: DAN_USER_ID,
        updatedAt: new Date()
      }
    });

    console.log(`✅ Updated ${updateResult.count} companies`);
    console.log('');

    // Step 3: Verify the update
    console.log('✅ VERIFICATION:');
    console.log('================');
    
    const updatedCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        mainSellerId: true
      }
    });

    const danCompaniesAfter = updatedCompanies.filter(c => c.mainSellerId === DAN_USER_ID);
    const unassignedAfter = updatedCompanies.filter(c => c.mainSellerId === null);
    const otherAssignedAfter = updatedCompanies.filter(c => c.mainSellerId !== null && c.mainSellerId !== DAN_USER_ID);

    console.log(`Total companies: ${updatedCompanies.length}`);
    console.log(`   ✅ Assigned to Dan: ${danCompaniesAfter.length}`);
    console.log(`   ❓ Unassigned: ${unassignedAfter.length}`);
    console.log(`   ❌ Assigned to others: ${otherAssignedAfter.length}`);
    console.log('');

    if (danCompaniesAfter.length === updatedCompanies.length) {
      console.log('🎉 SUCCESS! All companies are now assigned to Dan!');
      console.log('Dan should now see all companies in his companies list.');
    } else {
      console.log('⚠️  WARNING: Some companies are still not assigned to Dan');
    }

    console.log('');
    console.log('📝 NEXT STEPS:');
    console.log('==============');
    console.log('1. The API cache will clear automatically (30-second TTL)');
    console.log('2. Refresh the companies page in the browser');
    console.log('3. Dan should now see all companies in the list');

  } catch (error) {
    console.error('❌ ERROR:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the script
assignDanToAdrataCompanies();
