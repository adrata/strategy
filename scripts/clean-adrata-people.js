#!/usr/bin/env node

/**
 * 🧹 CLEAN ADRATA PEOPLE RECORDS
 * 
 * Remove all people records from adrata workspace except those associated with Winning Variant
 * This provides a clean slate for fresh buyer group discovery
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Key IDs
const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';

async function cleanAdrataPeople() {
  try {
    console.log('🧹 CLEANING ADRATA PEOPLE RECORDS');
    console.log('==================================');
    console.log(`Workspace ID: ${ADRATA_WORKSPACE_ID}`);
    console.log('');

    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Step 1: Find Winning Variant company
    console.log('🔍 Finding Winning Variant company...');
    const winningVariantCompany = await prisma.companies.findFirst({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        name: {
          contains: 'Winning Variant',
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        name: true
      }
    });

    if (!winningVariantCompany) {
      console.log('⚠️  Winning Variant company not found - will delete ALL people');
    } else {
      console.log(`✅ Found Winning Variant: ${winningVariantCompany.name} (${winningVariantCompany.id})`);
    }
    console.log('');

    // Step 2: Count current people records
    console.log('📊 Counting current people records...');
    const totalPeople = await prisma.people.count({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID
      }
    });

    const winningVariantPeople = winningVariantCompany ? await prisma.people.count({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        companyId: winningVariantCompany.id
      }
    }) : 0;

    const peopleToDelete = totalPeople - winningVariantPeople;

    console.log(`   Total people in workspace: ${totalPeople}`);
    console.log(`   Winning Variant people: ${winningVariantPeople}`);
    console.log(`   People to delete: ${peopleToDelete}`);
    console.log('');

    if (peopleToDelete === 0) {
      console.log('✅ No people to delete - workspace is already clean');
      return;
    }

    // Step 3: Safety confirmation
    const args = process.argv.slice(2);
    const forceFlag = args.includes('--force');

    if (!forceFlag) {
      console.log('⚠️  SAFETY CHECK REQUIRED');
      console.log('========================');
      console.log(`This will delete ${peopleToDelete} people records from the adrata workspace.`);
      console.log(`Winning Variant people (${winningVariantPeople}) will be preserved.`);
      console.log('');
      console.log('To proceed, run with --force flag:');
      console.log('node scripts/clean-adrata-people.js --force');
      console.log('');
      console.log('❌ Operation cancelled for safety');
      return;
    }

    // Step 4: Get people to delete (for logging)
    console.log('📋 Getting people to delete...');
    const peopleToDeleteRecords = await prisma.people.findMany({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        ...(winningVariantCompany && {
          companyId: {
            not: winningVariantCompany.id
          }
        })
      },
      select: {
        id: true,
        fullName: true,
        company: {
          select: {
            name: true
          }
        }
      }
    });

    console.log(`   Found ${peopleToDeleteRecords.length} people to delete:`);
    peopleToDeleteRecords.forEach((person, index) => {
      console.log(`   ${index + 1}. ${person.fullName} (${person.company?.name || 'No Company'}) - ${person.id}`);
    });
    console.log('');

    // Step 5: Delete people records
    console.log('🗑️  Deleting people records...');
    
    const deleteResult = await prisma.people.deleteMany({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        ...(winningVariantCompany && {
          companyId: {
            not: winningVariantCompany.id
          }
        })
      }
    });

    console.log(`✅ Deleted ${deleteResult.count} people records`);

    // Step 6: Verify results
    console.log('');
    console.log('🔍 Verifying cleanup...');
    const remainingPeople = await prisma.people.count({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID
      }
    });

    const remainingWinningVariant = winningVariantCompany ? await prisma.people.count({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        companyId: winningVariantCompany.id
      }
    }) : 0;

    console.log(`   Remaining people: ${remainingPeople}`);
    console.log(`   Winning Variant people preserved: ${remainingWinningVariant}`);

    // Step 7: Summary
    console.log('');
    console.log('📊 CLEANUP SUMMARY');
    console.log('==================');
    console.log(`✅ People deleted: ${deleteResult.count}`);
    console.log(`✅ Winning Variant people preserved: ${remainingWinningVariant}`);
    console.log(`✅ Total remaining: ${remainingPeople}`);
    console.log('');
    console.log('🎉 Cleanup completed successfully!');
    console.log('Ready for fresh buyer group discovery across all 19 companies.');

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('');
    console.log('🔌 Database disconnected');
  }
}

// Run the cleanup
if (require.main === module) {
  cleanAdrataPeople().catch(console.error);
}

module.exports = cleanAdrataPeople;
