import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function checkIntelligenceStatus() {
  const workspaceId = process.argv[2] || '01K75ZD7DWHG1XF16HAF2YVKCK';
  const companyId = process.argv[3]; // Optional: specific company ID
  
  const output: string[] = [];
  
  function log(msg: string) {
    console.log(msg);
    output.push(msg);
  }

  log('🔍 CHECKING INTELLIGENCE GENERATION STATUS');
  log('================================================================================\n');

  const INTELLIGENCE_VERSION = 'v2.0';

  try {
    if (companyId) {
      // Check specific company
      const company = await prisma.companies.findUnique({
        where: { id: companyId },
        select: {
          id: true,
          name: true,
          descriptionEnriched: true,
          customFields: true,
        },
      });

      if (!company) {
        log(`❌ Company not found: ${companyId}`);
        return;
      }

      log(`📊 Checking: ${company.name} (${company.id})\n`);
      
      const customFields = company.customFields as any || {};
      const hasIntelligence = !!customFields.intelligence;
      const intelligenceVersion = customFields.intelligenceVersion;
      const intelligenceGeneratedAt = customFields.intelligenceGeneratedAt;
      const hasDescriptionEnriched = !!company.descriptionEnriched;

      log('=== INTELLIGENCE STATUS ===');
      log(`Has Intelligence: ${hasIntelligence ? '✅ Yes' : '❌ No'}`);
      log(`Intelligence Version: ${intelligenceVersion || 'N/A'}`);
      log(`Generated At: ${intelligenceGeneratedAt || 'N/A'}`);
      log(`Has Description Enriched: ${hasDescriptionEnriched ? '✅ Yes' : '❌ No'}`);

      if (hasIntelligence && intelligenceVersion === INTELLIGENCE_VERSION) {
        log('\n✅ Intelligence is FULLY GENERATED and up-to-date');
        const intelligence = customFields.intelligence;
        if (intelligence) {
          log(`   - Industry: ${intelligence.industry || 'N/A'}`);
          log(`   - Strategic Wants: ${intelligence.strategicWants?.length || 0} items`);
          log(`   - Critical Needs: ${intelligence.criticalNeeds?.length || 0} items`);
          log(`   - Business Units: ${intelligence.businessUnits?.length || 0} units`);
        }
      } else if (hasIntelligence && intelligenceVersion !== INTELLIGENCE_VERSION) {
        log('\n⚠️  Intelligence exists but is OUTDATED');
        log(`   Current version: ${intelligenceVersion || 'unknown'}`);
        log(`   Required version: ${INTELLIGENCE_VERSION}`);
        log('   Will regenerate on next view');
      } else {
        log('\n❌ Intelligence NOT GENERATED');
        log('   Will generate on next view of intelligence tab');
      }

    } else {
      // Check all companies in workspace
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
      });

      log(`📊 Checking ${companies.length} companies in workspace\n`);

      let fullyGenerated = 0;
      let outdated = 0;
      let notGenerated = 0;
      let hasDescriptionEnriched = 0;

      for (const company of companies) {
        const customFields = company.customFields as any || {};
        const hasIntelligence = !!customFields.intelligence;
        const intelligenceVersion = customFields.intelligenceVersion;

        if (hasIntelligence && intelligenceVersion === INTELLIGENCE_VERSION) {
          fullyGenerated++;
        } else if (hasIntelligence && intelligenceVersion !== INTELLIGENCE_VERSION) {
          outdated++;
        } else {
          notGenerated++;
        }

        if (company.descriptionEnriched) {
          hasDescriptionEnriched++;
        }
      }

      log('=== OVERALL STATUS ===');
      log(`Total Companies: ${companies.length}`);
      log(`✅ Fully Generated (v${INTELLIGENCE_VERSION}): ${fullyGenerated} (${((fullyGenerated / companies.length) * 100).toFixed(1)}%)`);
      log(`⚠️  Outdated Version: ${outdated} (${((outdated / companies.length) * 100).toFixed(1)}%)`);
      log(`❌ Not Generated: ${notGenerated} (${((notGenerated / companies.length) * 100).toFixed(1)}%)`);
      log(`📝 Has Description Enriched: ${hasDescriptionEnriched} (${((hasDescriptionEnriched / companies.length) * 100).toFixed(1)}%)`);

      if (outdated > 0) {
        log(`\n⚠️  ${outdated} companies have outdated intelligence and will regenerate on next view`);
      }

      if (notGenerated > 0) {
        log(`\n❌ ${notGenerated} companies need intelligence generation`);
        log('   They will generate automatically when viewed in the intelligence tab');
      }

      // Show sample companies that need generation
      if (notGenerated > 0 && notGenerated <= 10) {
        log('\n📋 Companies needing intelligence generation:');
        const needsGeneration = companies.filter(c => {
          const cf = c.customFields as any || {};
          return !cf.intelligence || cf.intelligenceVersion !== INTELLIGENCE_VERSION;
        }).slice(0, 10);
        
        needsGeneration.forEach(c => {
          log(`   - ${c.name}`);
        });
      }
    }

    // Write to file immediately
    try {
      const filePath = 'intelligence-status.txt';
      fs.writeFileSync(filePath, output.join('\n'));
      log(`\n\n✅ Results saved to ${filePath}`);
      console.error('FILE_WRITTEN'); // Debug marker
    } catch (err) {
      log(`\n\n❌ Error saving file: ${err}`);
      console.error('FILE_ERROR', err);
    }

  } catch (error) {
    const errorMsg = `Error: ${error instanceof Error ? error.message : String(error)}`;
    log(`\n❌ ${errorMsg}`);
    fs.writeFileSync('intelligence-status.txt', output.join('\n') + '\n' + errorMsg);
  } finally {
    await prisma.$disconnect();
  }
}

checkIntelligenceStatus();
