const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function check() {
  const results = [];
  
  try {
    results.push('🔍 CHECKING INTELLIGENCE STATUS');
    results.push('================================================================================\n');
    
    const workspaceId = '01K75ZD7DWHG1XF16HAF2YVKCK';
    const INTELLIGENCE_VERSION = 'v2.0';
    
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        descriptionEnriched: true,
        customFields: true,
      },
      take: 10, // Just check first 10 for now
    });

    results.push(`📊 Checking ${companies.length} companies (sample)\n`);

    let fullyGenerated = 0;
    let outdated = 0;
    let notGenerated = 0;

    for (const company of companies) {
      const customFields = company.customFields || {};
      const hasIntelligence = !!customFields.intelligence;
      const intelligenceVersion = customFields.intelligenceVersion;

      if (hasIntelligence && intelligenceVersion === INTELLIGENCE_VERSION) {
        fullyGenerated++;
      } else if (hasIntelligence && intelligenceVersion !== INTELLIGENCE_VERSION) {
        outdated++;
      } else {
        notGenerated++;
      }
    }

    results.push('=== STATUS ===');
    results.push(`Total Checked: ${companies.length}`);
    results.push(`✅ Fully Generated (v${INTELLIGENCE_VERSION}): ${fullyGenerated}`);
    results.push(`⚠️  Outdated Version: ${outdated}`);
    results.push(`❌ Not Generated: ${notGenerated}`);

    // Check Southern Company specifically
    const southern = await prisma.companies.findUnique({
      where: { id: '01K9QD2ST0C0TTG34EMRD3M69H' },
      select: {
        name: true,
        customFields: true,
        descriptionEnriched: true,
      },
    });

    if (southern) {
      results.push('\n=== SOUTHERN COMPANY ===');
      const cf = southern.customFields || {};
      results.push(`Has Intelligence: ${cf.intelligence ? 'Yes' : 'No'}`);
      results.push(`Version: ${cf.intelligenceVersion || 'N/A'}`);
      results.push(`Generated At: ${cf.intelligenceGeneratedAt || 'N/A'}`);
      results.push(`Description Enriched: ${southern.descriptionEnriched ? 'Yes' : 'No'}`);
      
      if (cf.intelligence && cf.intelligenceVersion === INTELLIGENCE_VERSION) {
        results.push('✅ Intelligence is FULLY GENERATED');
      } else if (cf.intelligence) {
        results.push('⚠️  Intelligence is OUTDATED');
      } else {
        results.push('❌ Intelligence NOT GENERATED');
      }
    }

    const output = results.join('\n');
    console.log(output);
    fs.writeFileSync('intelligence-status.txt', output);
    results.push('\n\n✅ Results saved to intelligence-status.txt');
    
  } catch (error) {
    const errorMsg = `Error: ${error.message}\n${error.stack}`;
    console.error(errorMsg);
    fs.writeFileSync('intelligence-status.txt', errorMsg);
  } finally {
    await prisma.$disconnect();
  }
}

check();

