/**
 * Run buyer group discovery for Dan's companies added in the past 3 hours
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { SmartBuyerGroupPipeline } = require('./_future_now/find-buyer-group/index.js');

const prisma = new PrismaClient();

const WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';
const DAN_ID = '01K7B327HWN9G6KGWA97S1TK43';

async function main() {
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
  
  // Find companies added in past 3 hours that need buyer groups
  const companies = await prisma.companies.findMany({
    where: {
      workspaceId: WORKSPACE_ID,
      mainSellerId: DAN_ID,
      deletedAt: null,
      createdAt: { gte: threeHoursAgo },
      people: { none: {} }
    },
    orderBy: { name: 'asc' }
  });

  console.log(`\n🚀 Found ${companies.length} recent companies needing buyer groups\n`);
  
  if (companies.length === 0) {
    console.log('✅ No companies need processing');
    await prisma.$disconnect();
    return;
  }

  let success = 0;
  let failed = 0;

  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    console.log(`\n📊 ${i + 1}/${companies.length}: ${company.name}`);
    
    try {
      const pipeline = new SmartBuyerGroupPipeline({
        workspaceId: WORKSPACE_ID,
        mainSellerId: DAN_ID,
        dealSize: 50000,
        productCategory: 'sales',
        usaOnly: true
      });

      const result = await pipeline.run({
        companyName: company.name,
        website: company.website,
        linkedinUrl: company.linkedinUrl
      });

      if (result.success) {
        console.log(`   ✅ Success: ${result.buyerGroup?.length || 0} buyer group members found`);
        success++;
      } else {
        console.log(`   ⚠️ No buyer group found: ${result.error || 'Unknown'}`);
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      failed++;
    }

    // Rate limit delay between companies
    if (i < companies.length - 1) {
      console.log('   ⏳ Waiting 10s before next company...');
      await new Promise(r => setTimeout(r, 10000));
    }
  }

  console.log(`\n📊 COMPLETE: ${success} succeeded, ${failed} failed out of ${companies.length}`);
  await prisma.$disconnect();
}

main().catch(console.error);
