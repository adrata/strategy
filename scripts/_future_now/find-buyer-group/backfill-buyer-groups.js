#!/usr/bin/env node

/**
 * Backfill Buyer Groups - Link to Companies
 * 
 * Updates existing buyer groups that have NULL companyId
 * by matching them to companies using companyName
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const TOP_TEMP_WORKSPACE_ID = '01K9QAP09FHT6EAP1B4G2KP3D2';

async function backfillBuyerGroups() {
  const prisma = new PrismaClient();
  
  try {
    console.log('\n🔄 Backfilling Buyer Groups - Linking to Companies\n');
    console.log('='.repeat(60));
    
    // Get all buyer groups with NULL companyId
    const allBuyerGroups = await prisma.buyerGroups.findMany({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        companyId: null
      },
      select: {
        id: true,
        companyName: true,
        website: true,
        createdAt: true
      }
    });
    
    // Filter to only those with companyName
    const buyerGroupsToFix = allBuyerGroups.filter(bg => bg.companyName);
    
    console.log(`Found ${buyerGroupsToFix.length} buyer groups to backfill\n`);
    
    let updated = 0;
    let notFound = 0;
    const notFoundList = [];
    
    for (const bg of buyerGroupsToFix) {
      // Try to find company by name
      let company = await prisma.companies.findFirst({
        where: {
          workspaceId: TOP_TEMP_WORKSPACE_ID,
          name: { contains: bg.companyName, mode: 'insensitive' }
        }
      });
      
      // If not found by name, try by website
      if (!company && bg.website) {
        const domain = bg.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
        company = await prisma.companies.findFirst({
          where: {
            workspaceId: TOP_TEMP_WORKSPACE_ID,
            OR: [
              { website: { contains: domain } },
              { domain: domain }
            ]
          }
        });
      }
      
      if (company) {
        await prisma.buyerGroups.update({
          where: { id: bg.id },
          data: { companyId: company.id }
        });
        updated++;
        console.log(`✅ Linked: "${bg.companyName}" → ${company.name} (${company.id})`);
      } else {
        notFound++;
        notFoundList.push(bg.companyName);
        console.log(`⚠️  Not found: "${bg.companyName}"`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Backfill Summary:');
    console.log(`   - Updated: ${updated}`);
    console.log(`   - Not found: ${notFound}`);
    
    if (notFoundList.length > 0) {
      console.log(`\n⚠️  Companies not found (${notFoundList.length}):`);
      notFoundList.forEach((name, i) => {
        console.log(`   ${i + 1}. ${name}`);
      });
    }
    
    console.log('\n✅ Backfill complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

backfillBuyerGroups();

