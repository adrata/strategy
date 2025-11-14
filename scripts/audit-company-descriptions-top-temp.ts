#!/usr/bin/env tsx

/**
 * Audit Company Descriptions for Top-Temp
 * 
 * Checks which companies are missing description or descriptionEnriched fields
 * and provides a detailed report
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TOP_TEMP_WORKSPACE_ID = '01K9QAP09FHT6EAP1B4G2KP3D2';

async function main() {
  console.log('\n📊 AUDITING COMPANY DESCRIPTIONS - TOP-TEMP');
  console.log('='.repeat(60));

  // Get all companies in top-temp
  const allCompanies = await prisma.companies.findMany({
    where: {
      workspaceId: TOP_TEMP_WORKSPACE_ID,
      deletedAt: null
    },
    select: {
      id: true,
      name: true,
      description: true,
      descriptionEnriched: true,
      industry: true,
      website: true
    },
    orderBy: { name: 'asc' }
  });

  console.log(`Total companies in top-temp: ${allCompanies.length}\n`);

  // Categorize companies
  const withBoth = allCompanies.filter(c => c.description && c.descriptionEnriched);
  const withDescription = allCompanies.filter(c => c.description && !c.descriptionEnriched);
  const withEnriched = allCompanies.filter(c => !c.description && c.descriptionEnriched);
  const withNeither = allCompanies.filter(c => !c.description && !c.descriptionEnriched);

  console.log('📈 Summary:');
  console.log(`   ✅ With both fields: ${withBoth.length}`);
  console.log(`   ⚠️  Description only: ${withDescription.length}`);
  console.log(`   ⚠️  Enriched only: ${withEnriched.length}`);
  console.log(`   ❌ Missing both: ${withNeither.length}`);

  console.log('\n' + '='.repeat(60));
  console.log('📋 COMPANIES MISSING SUMMARIES');
  console.log('='.repeat(60));

  const needsSummary = [...withNeither, ...withDescription];
  console.log(`\nTotal needing summaries: ${needsSummary.length}\n`);

  if (needsSummary.length > 0) {
    console.log('First 20 companies missing summaries:\n');
    needsSummary.slice(0, 20).forEach((company, index) => {
      console.log(`${index + 1}. ${company.name}`);
      console.log(`   ID: ${company.id}`);
      console.log(`   Industry: ${company.industry || 'Unknown'}`);
      console.log(`   Has description: ${!!company.description}`);
      console.log(`   Has enriched: ${!!company.descriptionEnriched}`);
      console.log(`   Website: ${company.website || 'None'}`);
      console.log('');
    });

    if (needsSummary.length > 20) {
      console.log(`... and ${needsSummary.length - 20} more\n`);
    }
  }

  console.log('='.repeat(60));
  console.log('\n💡 To generate missing summaries, run:');
  console.log('   node scripts/generate-company-summaries.js --workspace=01K9QAP09FHT6EAP1B4G2KP3D2');
  console.log('\n✅ Audit complete\n');

  await prisma.$disconnect();
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

