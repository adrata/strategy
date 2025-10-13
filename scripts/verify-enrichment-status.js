#!/usr/bin/env node

/**
 * 🔍 VERIFY ENRICHMENT SCRIPT STATUS
 * 
 * Checks if the enrich-all-people-and-assign-sellers.js script ran successfully
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const WORKSPACE_ID = '01K7DNYR5VZ7JY36KGKKN76XZ1';
const MAIN_SELLER_NAME = 'Dano';
const SECONDARY_SELLER_NAME = 'Ryan';

async function verifyEnrichmentStatus() {
  console.log('🔍 VERIFYING ENRICHMENT SCRIPT STATUS');
  console.log('=' .repeat(60));
  
  try {
    // 1. Check if sellers exist
    console.log('\n👥 CHECKING SELLER USERS:');
    
    const mainSeller = await prisma.users.findFirst({
      where: {
        username: { contains: MAIN_SELLER_NAME, mode: 'insensitive' }
      },
      select: { id: true, username: true, email: true }
    });
    
    const secondarySeller = await prisma.users.findFirst({
      where: {
        username: { contains: SECONDARY_SELLER_NAME, mode: 'insensitive' }
      },
      select: { id: true, username: true, email: true }
    });
    
    if (mainSeller) {
      console.log(`✅ Main seller found: ${mainSeller.username} (ID: ${mainSeller.id})`);
    } else {
      console.log(`❌ Main seller "${MAIN_SELLER_NAME}" not found in users table`);
    }
    
    if (secondarySeller) {
      console.log(`✅ Secondary seller found: ${secondarySeller.username} (ID: ${secondarySeller.id})`);
    } else {
      console.log(`❌ Secondary seller "${SECONDARY_SELLER_NAME}" not found in users table`);
    }
    
    // 2. Check total people in workspace
    console.log('\n📊 CHECKING PEOPLE IN WORKSPACE:');
    
    const totalPeople = await prisma.people.count({
      where: {
        workspaceId: WORKSPACE_ID,
        deletedAt: null
      }
    });
    
    console.log(`   Total people: ${totalPeople}`);
    
    // 3. Check enrichment status
    console.log('\n🎯 CHECKING ENRICHMENT STATUS:');
    
    const peopleWithEnrichedData = await prisma.people.count({
      where: {
        workspaceId: WORKSPACE_ID,
        deletedAt: null,
        enrichedData: { not: null }
      }
    });
    
    const peopleWithEnrichmentStatus = await prisma.people.count({
      where: {
        workspaceId: WORKSPACE_ID,
        deletedAt: null,
        customFields: {
          path: ['enrichmentStatus'],
          equals: 'completed'
        }
      }
    });
    
    console.log(`   People with enrichedData: ${peopleWithEnrichedData}`);
    console.log(`   People with enrichmentStatus: ${peopleWithEnrichmentStatus}`);
    console.log(`   Enrichment rate: ${totalPeople > 0 ? ((peopleWithEnrichedData / totalPeople) * 100).toFixed(1) : 0}%`);
    
    // 4. Check seller assignments
    console.log('\n👨‍💼 CHECKING SELLER ASSIGNMENTS:');
    
    if (mainSeller) {
      const peopleWithMainSeller = await prisma.people.count({
        where: {
          workspaceId: WORKSPACE_ID,
          deletedAt: null,
          mainSellerId: mainSeller.id
        }
      });
      console.log(`   People assigned to main seller (${mainSeller.username}): ${peopleWithMainSeller}`);
    }
    
    if (secondarySeller) {
      const coSellerAssignments = await prisma.person_co_sellers.count({
        where: {
          userId: secondarySeller.id,
          person: {
            workspaceId: WORKSPACE_ID,
            deletedAt: null
          }
        }
      });
      console.log(`   People assigned to secondary seller (${secondarySeller.username}): ${coSellerAssignments}`);
    }
    
    // 5. Sample enriched data
    console.log('\n📋 SAMPLE ENRICHED DATA:');
    
    const sampleEnriched = await prisma.people.findFirst({
      where: {
        workspaceId: WORKSPACE_ID,
        deletedAt: null,
        enrichedData: { not: null }
      },
      select: {
        id: true,
        fullName: true,
        jobTitle: true,
        company: { select: { name: true } },
        enrichedData: true,
        mainSellerId: true,
        mainSeller: { select: { username: true } },
        customFields: true
      }
    });
    
    if (sampleEnriched) {
      console.log(`   Sample person: ${sampleEnriched.fullName}`);
      console.log(`   Title: ${sampleEnriched.jobTitle}`);
      console.log(`   Company: ${sampleEnriched.company?.name}`);
      console.log(`   Main seller: ${sampleEnriched.mainSeller?.username || 'Not assigned'}`);
      console.log(`   Industry: ${sampleEnriched.enrichedData?.industry || 'N/A'}`);
      console.log(`   Seniority: ${sampleEnriched.enrichedData?.seniorityLevel || 'N/A'}`);
      console.log(`   Decision role: ${sampleEnriched.enrichedData?.buyingBehavior?.decisionMakingRole || 'N/A'}`);
      console.log(`   Enrichment status: ${sampleEnriched.customFields?.enrichmentStatus || 'N/A'}`);
    } else {
      console.log('   No enriched data found');
    }
    
    // 6. Check for recent enrichment activity
    console.log('\n⏰ CHECKING RECENT ACTIVITY:');
    
    const recentEnrichments = await prisma.people.count({
      where: {
        workspaceId: WORKSPACE_ID,
        deletedAt: null,
        customFields: {
          path: ['enrichedAt'],
          not: null
        }
      }
    });
    
    console.log(`   People with enrichment timestamps: ${recentEnrichments}`);
    
    // 7. Summary and diagnosis
    console.log('\n' + '=' .repeat(60));
    console.log('📊 DIAGNOSIS SUMMARY');
    console.log('=' .repeat(60));
    
    const enrichmentSuccess = peopleWithEnrichedData > 0;
    const sellerAssignmentSuccess = mainSeller && secondarySeller;
    const partialSuccess = peopleWithEnrichedData > 0 && peopleWithEnrichedData < totalPeople;
    
    if (enrichmentSuccess && peopleWithEnrichedData === totalPeople) {
      console.log('✅ SCRIPT SUCCESS: All people enriched and sellers assigned');
      console.log(`   - ${peopleWithEnrichedData}/${totalPeople} people enriched (100%)`);
      if (mainSeller) {
        const mainSellerCount = await prisma.people.count({
          where: { workspaceId: WORKSPACE_ID, deletedAt: null, mainSellerId: mainSeller.id }
        });
        console.log(`   - ${mainSellerCount} people assigned to main seller`);
      }
      if (secondarySeller) {
        const coSellerCount = await prisma.person_co_sellers.count({
          where: {
            userId: secondarySeller.id,
            person: { workspaceId: WORKSPACE_ID, deletedAt: null }
          }
        });
        console.log(`   - ${coSellerCount} people assigned to secondary seller`);
      }
    } else if (partialSuccess) {
      console.log('⚠️  PARTIAL SUCCESS: Some people enriched, script may have been interrupted');
      console.log(`   - ${peopleWithEnrichedData}/${totalPeople} people enriched (${((peopleWithEnrichedData / totalPeople) * 100).toFixed(1)}%)`);
      console.log('   - Recommend re-running the script to complete enrichment');
    } else if (!sellerAssignmentSuccess) {
      console.log('❌ SELLER LOOKUP FAILED: Cannot find required sellers in database');
      console.log('   - Check if users "Dano" and "Ryan" exist in the users table');
      console.log('   - Verify username spelling and case sensitivity');
    } else {
      console.log('❌ SCRIPT FAILED: No enrichment data found');
      console.log('   - Script may have crashed or failed to start');
      console.log('   - Check database connection and permissions');
      console.log('   - Verify workspace ID is correct');
    }
    
    return {
      success: enrichmentSuccess && peopleWithEnrichedData === totalPeople,
      partial: partialSuccess,
      totalPeople,
      enrichedPeople: peopleWithEnrichedData,
      mainSellerFound: !!mainSeller,
      secondarySellerFound: !!secondarySeller
    };
    
  } catch (error) {
    console.error('\n❌ VERIFICATION FAILED:', error.message);
    console.error('   This indicates a database connection or query issue');
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification
verifyEnrichmentStatus()
  .then(result => {
    if (result.success) {
      console.log('\n🎉 VERIFICATION COMPLETE: Script ran successfully!');
      process.exit(0);
    } else if (result.partial) {
      console.log('\n⚠️  VERIFICATION COMPLETE: Partial success detected');
      process.exit(1);
    } else {
      console.log('\n❌ VERIFICATION COMPLETE: Script failed or did not run');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 VERIFICATION CRASHED:', error);
    process.exit(1);
  });
