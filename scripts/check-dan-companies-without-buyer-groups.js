#!/usr/bin/env node

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DAN_USER_ID = '01K7B327HWN9G6KGWA97S1TK43';
const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';

async function checkCompanies() {
  console.log('🔍 Checking Dan\'s Recently Added Companies');
  console.log('═'.repeat(60));
  console.log('');

  try {
    await prisma.$connect();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get companies added today
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        mainSellerId: DAN_USER_ID,
        deletedAt: null,
        createdAt: { gte: today }
      },
      select: {
        id: true,
        name: true,
        website: true,
        createdAt: true
      },
      orderBy: { name: 'asc' }
    });

    console.log(`📊 Total companies added today: ${companies.length}\n`);

    const companiesWithoutBuyerGroups = [];
    const companiesWithBuyerGroups = [];

    // Check buyer groups for each company
    for (const company of companies) {
      const buyerGroup = await prisma.buyerGroups.findFirst({
        where: {
          companyName: company.name,
          workspaceId: ADRATA_WORKSPACE_ID
        },
        select: {
          id: true,
          totalMembers: true
        }
      });

      if (buyerGroup && buyerGroup.totalMembers > 0) {
        companiesWithBuyerGroups.push({
          ...company,
          buyerGroupId: buyerGroup.id,
          totalMembers: buyerGroup.totalMembers
        });
        console.log(`✅ ${company.name} - (${buyerGroup.totalMembers} members)`);
      } else {
        companiesWithoutBuyerGroups.push(company);
        console.log(`❌ ${company.name} - (no buyer group)`);
      }
      console.log(`   ID: ${company.id}`);
      console.log('');
    }

    console.log('\n📈 SUMMARY');
    console.log('═'.repeat(60));
    console.log(`Total companies: ${companies.length}`);
    console.log(`✅ With buyer groups: ${companiesWithBuyerGroups.length}`);
    console.log(`❌ Without buyer groups: ${companiesWithoutBuyerGroups.length}`);

    if (companiesWithoutBuyerGroups.length > 0) {
      console.log('\n🗑️  Companies to Remove (no buyer groups):');
      console.log('═'.repeat(60));
      companiesWithoutBuyerGroups.forEach((company, idx) => {
        console.log(`${idx + 1}. ${company.name}`);
        console.log(`   ID: ${company.id}`);
        console.log(`   Website: ${company.website || 'N/A'}`);
        console.log('');
      });

      // Export IDs for deletion
      const idsToDelete = companiesWithoutBuyerGroups.map(c => c.id);
      console.log('\n📋 Company IDs to delete:');
      console.log(JSON.stringify(idsToDelete, null, 2));
    }

    await prisma.$disconnect();
    
    return {
      total: companies.length,
      withBuyerGroups: companiesWithBuyerGroups.length,
      withoutBuyerGroups: companiesWithoutBuyerGroups.length,
      toDelete: companiesWithoutBuyerGroups
    };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkCompanies();

