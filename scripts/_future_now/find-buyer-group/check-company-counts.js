#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const TOP_TEMP_WORKSPACE_ID = '01K9QAP09FHT6EAP1B4G2KP3D2';

async function checkCompanyCounts() {
  const prisma = new PrismaClient();

  try {
    // Total companies
    const total = await prisma.companies.count({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        deletedAt: null
      }
    });

    // Companies with website OR LinkedIn
    const withWebsiteOrLinkedIn = await prisma.companies.count({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        deletedAt: null,
        OR: [
          { website: { not: null } },
          { linkedinUrl: { not: null } }
        ]
      }
    });

    // Companies without both
    const withoutBoth = await prisma.companies.count({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        deletedAt: null,
        website: null,
        linkedinUrl: null
      }
    });

    // Companies with buyer groups
    const buyerGroups = await prisma.buyerGroups.findMany({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        companyId: { not: null }
      },
      select: {
        companyId: true
      }
    });
    
    const uniqueCompaniesWithBuyerGroups = new Set(
      buyerGroups.map(bg => bg.companyId).filter(Boolean)
    );

    // Companies that should be processed
    const shouldProcess = withWebsiteOrLinkedIn - uniqueCompaniesWithBuyerGroups.size;

    // Check buyer groups without companyId
    const buyerGroupsWithoutCompanyId = buyerGroups.filter(bg => !bg.companyId);
    const buyerGroupsWithCompanyId = buyerGroups.filter(bg => bg.companyId);

    console.log('\n📊 Company Count Analysis\n');
    console.log('='.repeat(60));
    console.log(`Total companies in top-temp: ${total}`);
    console.log(`Companies with website OR LinkedIn: ${withWebsiteOrLinkedIn}`);
    console.log(`Companies without both: ${withoutBoth}`);
    console.log(`\nBuyer Groups:`);
    console.log(`   Total buyer groups: ${buyerGroups.length}`);
    console.log(`   With companyId: ${buyerGroupsWithCompanyId.length}`);
    console.log(`   Without companyId: ${buyerGroupsWithoutCompanyId.length}`);
    console.log(`\nCompanies already processed (have buyer groups with companyId): ${uniqueCompaniesWithBuyerGroups.size}`);
    console.log(`\n🎯 Companies that SHOULD be processed: ${shouldProcess}`);
    console.log(`\n⚠️  Note: Companies without website AND LinkedIn are excluded`);
    console.log(`   (Script requires at least one identifier to run)`);
    
    if (buyerGroupsWithoutCompanyId.length > 0) {
      console.log(`\n⚠️  WARNING: ${buyerGroupsWithoutCompanyId.length} buyer groups don't have companyId`);
      console.log(`   These won't be counted as "processed" and may cause duplicates`);
      console.log(`   Consider running backfill-buyer-groups.js to fix this`);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');

    // Check if there are companies without mainSellerId
    const withoutMainSeller = await prisma.companies.count({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        deletedAt: null,
        OR: [
          { website: { not: null } },
          { linkedinUrl: { not: null } }
        ],
        mainSellerId: null
      }
    });

    if (withoutMainSeller > 0) {
      console.log(`⚠️  ${withoutMainSeller} companies don't have mainSellerId assigned`);
      console.log(`   These will still be processed, but people won't get assigned to a seller\n`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkCompanyCounts();
}

