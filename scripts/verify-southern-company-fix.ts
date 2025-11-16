import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();
const output: string[] = [];

function log(message: string) {
  console.log(message);
  output.push(message);
}

async function verifyFix() {
  log('🔍 VERIFYING SOUTHERN COMPANY FIX');
  log('================================================================================\n');

  const SOUTHERN_COMPANY_ID = '01K9QD2ST0C0TTG34EMRD3M69H';

  // Check Southern Company
  const company = await prisma.companies.findUnique({
    where: { id: SOUTHERN_COMPANY_ID },
    select: {
      id: true,
      name: true,
      industry: true,
      description: true,
      descriptionEnriched: true,
      domain: true,
      website: true,
      customFields: true,
    },
  });

  if (!company) {
    log('❌ Southern Company not found');
    await prisma.$disconnect();
    return;
  }

  log('=== SOUTHERN COMPANY STATUS ===');
  log(`Name: ${company.name}`);
  log(`Industry: ${company.industry || 'N/A'}`);
  log(`Domain: ${company.domain || 'N/A'}`);
  log(`Website: ${company.website || 'N/A'}`);
  log(`\nDescription: ${company.description ? company.description.substring(0, 200) + '...' : 'NULL (cleared ✅)'}`);
  log(`Description Enriched: ${company.descriptionEnriched ? company.descriptionEnriched.substring(0, 200) + '...' : 'NULL (cleared ✅)'}`);

  // Check for Israeli/resort content
  const hasIsraeliContent = 
    (company.description && (company.description.includes('ישראל') || company.description.includes('כפר נופש') || company.description.toLowerCase().includes('israeli resort'))) ||
    (company.descriptionEnriched && (company.descriptionEnriched.includes('ישראל') || company.descriptionEnriched.includes('כפר נופש') || company.descriptionEnriched.toLowerCase().includes('israeli resort')));

  log(`\n=== VALIDATION ===`);
  if (hasIsraeliContent) {
    log('❌ ISSUE STILL EXISTS: Description contains Israeli/resort content');
  } else {
    log('✅ FIXED: No Israeli/resort content found in descriptions');
  }

  // Check cached intelligence
  const customFields = company.customFields as any || {};
  const hasCachedIntelligence = !!customFields.intelligence;
  const intelligenceVersion = customFields.intelligenceVersion;

  log(`\nCached Intelligence: ${hasCachedIntelligence ? 'Yes' : 'No'}`);
  if (hasCachedIntelligence) {
    log(`Intelligence Version: ${intelligenceVersion || 'unknown'}`);
    if (intelligenceVersion !== 'v2.0') {
      log('⚠️  Old cached intelligence - will regenerate on next view');
    }
  }

  // Check overall database stats
  log(`\n\n=== OVERALL DATABASE STATUS ===`);
  const total = await prisma.companies.count({
    where: { workspaceId: '01K75ZD7DWHG1XF16HAF2YVKCK', deletedAt: null },
  });

  const withBadContent = await prisma.companies.findMany({
    where: {
      workspaceId: '01K75ZD7DWHG1XF16HAF2YVKCK',
      deletedAt: null,
      OR: [
        { description: { contains: 'ישראל' } },
        { description: { contains: 'כפר נופש' } },
        { descriptionEnriched: { contains: 'ישראל' } },
        { descriptionEnriched: { contains: 'כפר נופש' } },
      ],
    },
    select: { id: true, name: true, industry: true },
  });

  log(`Total companies: ${total}`);
  log(`Companies with Israeli/resort content: ${withBadContent.length}`);

  if (withBadContent.length > 0) {
    log(`\n⚠️  Companies still with bad content:`);
    withBadContent.forEach(c => {
      log(`   - ${c.name} (${c.industry || 'N/A'})`);
    });
  } else {
    log(`\n✅ All companies cleaned - no Israeli/resort content found`);
  }

  // Write to file immediately
  try {
    fs.writeFileSync('verification-results.txt', output.join('\n'));
    log('\n\nResults saved to verification-results.txt');
  } catch (err) {
    log(`\n\nError saving file: ${err}`);
  }

  await prisma.$disconnect();
}

verifyFix().catch((error) => {
  const errorMsg = `Error: ${error.message}\n${error.stack}`;
  console.error(errorMsg);
  fs.writeFileSync('verification-results.txt', errorMsg);
  process.exit(1);
});

