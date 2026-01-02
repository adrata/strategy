/**
 * Run buyer group discovery for Dan's companies that have people but no phone numbers
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { SmartBuyerGroupPipeline } = require('./_future_now/find-buyer-group/index.js');

const prisma = new PrismaClient();

const WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';
const DAN_ID = '01K7B327HWN9G6KGWA97S1TK43';

// Skip Cardinal Gray - they're signing!
const SKIP_COMPANIES = ['Cardinal Gray'];

async function main() {
  // Find companies with people but no phones
  const companies = await prisma.companies.findMany({
    where: {
      workspaceId: WORKSPACE_ID,
      mainSellerId: DAN_ID,
      deletedAt: null,
      name: { notIn: SKIP_COMPANIES }
    },
    include: {
      people: {
        where: { deletedAt: null },
        select: { phone: true, mobilePhone: true, workPhone: true }
      }
    }
  });

  const needsBuyerGroup = companies.filter(c => {
    if (c.people.length === 0) return false;
    return !c.people.some(p => p.phone || p.mobilePhone || p.workPhone);
  });

  console.log(`\n🚀 Found ${needsBuyerGroup.length} companies needing buyer groups with phones\n`);
  
  if (needsBuyerGroup.length === 0) {
    console.log('✅ No companies need processing');
    await prisma.$disconnect();
    return;
  }

  let success = 0;
  let failed = 0;

  for (let i = 0; i < needsBuyerGroup.length; i++) {
    const company = needsBuyerGroup[i];
    console.log(`\n📊 ${i + 1}/${needsBuyerGroup.length}: ${company.name}`);
    
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
    if (i < needsBuyerGroup.length - 1) {
      console.log('   ⏳ Waiting 10s before next company...');
      await new Promise(r => setTimeout(r, 10000));
    }
  }

  console.log(`\n📊 COMPLETE: ${success} succeeded, ${failed} failed out of ${needsBuyerGroup.length}`);
  await prisma.$disconnect();
}

main().catch(console.error);


