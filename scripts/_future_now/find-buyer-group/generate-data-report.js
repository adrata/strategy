#!/usr/bin/env node

/**
 * Comprehensive Data Verification Report
 * 
 * Generates a detailed report on data completeness for client presentation
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const TOP_TEMP_WORKSPACE_ID = '01K9QAP09FHT6EAP1B4G2KP3D2';

async function generateDataReport() {
  const prisma = new PrismaClient();

  try {
    console.log('\n📊 Comprehensive Buyer Group Data Report\n');
    console.log('='.repeat(70));

    // Get all buyer groups
    const buyerGroups = await prisma.buyerGroups.findMany({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        companyId: { not: null }
      },
      select: {
        id: true,
        companyId: true,
        companyName: true,
        totalMembers: true,
        createdAt: true
      }
    });

    // Get all buyer group members
    const allMembers = await prisma.buyerGroupMembers.findMany({
      where: {
        buyerGroupId: { in: buyerGroups.map(bg => bg.id) }
      }
    });

    // Get all people records
    const allPeople = await prisma.people.findMany({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        isBuyerGroupMember: true
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        workEmail: true,
        personalEmail: true,
        phone: true,
        mobilePhone: true,
        workPhone: true,
        linkedinUrl: true,
        coresignalData: true,
        enrichedData: true,
        emailVerified: true,
        emailConfidence: true,
        phoneVerified: true,
        phoneConfidence: true,
        buyerGroupRole: true,
        tags: true,
        companyId: true
      }
    });

    console.log(`\n📈 Overall Statistics:`);
    console.log('='.repeat(70));
    console.log(`Total buyer groups: ${buyerGroups.length}`);
    console.log(`Total buyer group members: ${allMembers.length}`);
    console.log(`Total people records: ${allPeople.length}`);

    // Data completeness stats
    const stats = {
      withEmail: allPeople.filter(p => p.email || p.workEmail || p.personalEmail).length,
      withPhone: allPeople.filter(p => p.phone || p.mobilePhone || p.workPhone).length,
      withLinkedIn: allPeople.filter(p => p.linkedinUrl).length,
      withCoresignalData: allPeople.filter(p => p.coresignalData && typeof p.coresignalData === 'object').length,
      withEnrichedData: allPeople.filter(p => p.enrichedData && typeof p.enrichedData === 'object').length,
      withVerifiedEmail: allPeople.filter(p => p.emailVerified === true).length,
      withVerifiedPhone: allPeople.filter(p => p.phoneVerified === true).length,
      withBuyerGroupRole: allPeople.filter(p => p.buyerGroupRole).length,
      withInTag: allPeople.filter(p => p.tags && Array.isArray(p.tags) && p.tags.includes('in_buyer_group')).length
    };

    console.log(`\n📊 Data Completeness:`);
    console.log(`   ✅ With email: ${stats.withEmail}/${allPeople.length} (${((stats.withEmail / allPeople.length) * 100).toFixed(1)}%)`);
    console.log(`   ✅ With phone: ${stats.withPhone}/${allPeople.length} (${((stats.withPhone / allPeople.length) * 100).toFixed(1)}%)`);
    console.log(`   ✅ With LinkedIn: ${stats.withLinkedIn}/${allPeople.length} (${((stats.withLinkedIn / allPeople.length) * 100).toFixed(1)}%)`);
    console.log(`   ✅ With Coresignal data: ${stats.withCoresignalData}/${allPeople.length} (${((stats.withCoresignalData / allPeople.length) * 100).toFixed(1)}%)`);
    console.log(`   ✅ With enriched data: ${stats.withEnrichedData}/${allPeople.length} (${((stats.withEnrichedData / allPeople.length) * 100).toFixed(1)}%)`);
    console.log(`   ✅ With verified email: ${stats.withVerifiedEmail}/${allPeople.length} (${((stats.withVerifiedEmail / allPeople.length) * 100).toFixed(1)}%)`);
    console.log(`   ✅ With verified phone: ${stats.withVerifiedPhone}/${allPeople.length} (${((stats.withVerifiedPhone / allPeople.length) * 100).toFixed(1)}%)`);
    console.log(`   ✅ With buyer group role: ${stats.withBuyerGroupRole}/${allPeople.length} (${((stats.withBuyerGroupRole / allPeople.length) * 100).toFixed(1)}%)`);
    console.log(`   ✅ Tagged "in_buyer_group": ${stats.withInTag}/${allPeople.length} (${((stats.withInTag / allPeople.length) * 100).toFixed(1)}%)`);

    // Sample enriched data check
    const sampleWithEnriched = allPeople.filter(p => p.enrichedData && typeof p.enrichedData === 'object').slice(0, 5);
    if (sampleWithEnriched.length > 0) {
      console.log(`\n📋 Sample Enriched Data (first 5):`);
      sampleWithEnriched.forEach((p, i) => {
        const enriched = p.enrichedData || {};
        console.log(`\n   ${i + 1}. ${p.fullName}`);
        console.log(`      - Email source: ${enriched.emailSource || 'N/A'}`);
        console.log(`      - Phone source: ${enriched.phoneSource || 'N/A'}`);
        console.log(`      - Email verification details: ${enriched.emailVerificationDetails?.length || 0} sources`);
        console.log(`      - Phone verification details: ${enriched.phoneVerificationDetails?.length || 0} sources`);
        console.log(`      - Has Coresignal data: ${p.coresignalData ? 'Yes' : 'No'}`);
      });
    }

    // Check for missing data
    const missingEmail = allPeople.filter(p => !p.email && !p.workEmail && !p.personalEmail).length;
    const missingPhone = allPeople.filter(p => !p.phone && !p.mobilePhone && !p.workPhone).length;
    const missingCoresignal = allPeople.filter(p => !p.coresignalData || typeof p.coresignalData !== 'object').length;
    const missingEnriched = allPeople.filter(p => !p.enrichedData || typeof p.enrichedData !== 'object').length;

    console.log(`\n⚠️  Missing Data:`);
    console.log(`   - Missing email: ${missingEmail} people`);
    console.log(`   - Missing phone: ${missingPhone} people`);
    console.log(`   - Missing Coresignal data: ${missingCoresignal} people`);
    console.log(`   - Missing enriched data: ${missingEnriched} people`);

    // Buyer group coverage
    const companiesWithBuyerGroups = new Set(buyerGroups.map(bg => bg.companyId).filter(Boolean));
    const totalCompanies = await prisma.companies.count({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        deletedAt: null,
        OR: [
          { website: { not: null } },
          { linkedinUrl: { not: null } }
        ]
      }
    });

    console.log(`\n📈 Coverage:`);
    console.log(`   - Companies with buyer groups: ${companiesWithBuyerGroups.size}/${totalCompanies} (${((companiesWithBuyerGroups.size / totalCompanies) * 100).toFixed(1)}%)`);
    console.log(`   - Average members per buyer group: ${(allMembers.length / buyerGroups.length).toFixed(1)}`);

    console.log('\n' + '='.repeat(70) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  generateDataReport();
}

