/**
 * Regenerate all company intelligence with new data source prioritization logic
 * 
 * This script clears cached intelligence for all companies so they regenerate
 * with the improved logic that uses:
 * - Contact email domains (most reliable)
 * - Core company data (global canonical)
 * - CoreSignal data
 * - Override fields
 * - Better validation
 * 
 * Usage:
 *   npx tsx scripts/regenerate-all-company-intelligence.ts [--workspace-id=WORKSPACE_ID] [--limit=N]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RegenerationStats {
  totalCompanies: number;
  companiesWithCachedIntelligence: number;
  companiesCleared: number;
  errors: number;
}

async function regenerateAllIntelligence(workspaceId?: string, limit?: number) {
  console.log('🔄 REGENERATING ALL COMPANY INTELLIGENCE');
  console.log('='.repeat(80));
  console.log('\n📋 This will clear cached intelligence so companies regenerate with:');
  console.log('   ✅ Contact email domain detection (most reliable)');
  console.log('   ✅ Core company data (global canonical)');
  console.log('   ✅ CoreSignal enrichment data');
  console.log('   ✅ Override fields (manual corrections)');
  console.log('   ✅ Better data validation\n');

  if (workspaceId) {
    console.log(`🎯 Workspace: ${workspaceId}\n`);
  }
  if (limit) {
    console.log(`📊 Limit: ${limit} companies\n`);
  }

  const stats: RegenerationStats = {
    totalCompanies: 0,
    companiesWithCachedIntelligence: 0,
    companiesCleared: 0,
    errors: 0
  };

  try {
    // Get all companies with cached intelligence
    console.log('📊 Fetching companies with cached intelligence...\n');
    const companies = await prisma.companies.findMany({
      where: {
        deletedAt: null,
        ...(workspaceId ? { workspaceId } : {}),
        customFields: {
          path: ['intelligence'],
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        customFields: true,
        descriptionEnriched: true
      },
      ...(limit ? { take: limit } : {})
    });

    stats.totalCompanies = companies.length;
    stats.companiesWithCachedIntelligence = companies.length;
    console.log(`✅ Found ${stats.companiesWithCachedIntelligence} companies with cached intelligence\n`);

    if (companies.length === 0) {
      console.log('✅ No companies have cached intelligence to regenerate!\n');
      return;
    }

    // Clear cached intelligence for all companies
    console.log('🧹 Clearing cached intelligence...\n');
    let processed = 0;
    const batchSize = 50;

    for (let i = 0; i < companies.length; i += batchSize) {
      const batch = companies.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (company) => {
          try {
            const customFields = (company.customFields as any) || {};
            
            // Remove intelligence cache but keep other customFields data
            if (customFields.intelligence) {
              delete customFields.intelligence;
              delete customFields.intelligenceVersion;
              delete customFields.intelligenceGeneratedAt;
            }

            await prisma.companies.update({
              where: { id: company.id },
              data: {
                customFields: customFields,
                descriptionEnriched: null, // Clear so it regenerates
                updatedAt: new Date()
              }
            });

            processed++;
            if (processed % 10 === 0) {
              process.stdout.write(`\r   Processed: ${processed}/${companies.length}`);
            }

            stats.companiesCleared++;
          } catch (error) {
            console.error(`\n   ❌ Error clearing cache for ${company.name}:`, error);
            stats.errors++;
          }
        })
      );
    }

    console.log(`\n\n✅ Successfully cleared cached intelligence for ${stats.companiesCleared} companies`);
    console.log(`   Errors: ${stats.errors}\n`);

    console.log('📝 Next Steps:');
    console.log('   • Companies will regenerate intelligence automatically when viewed');
    console.log('   • Or use POST /api/v1/companies/[id]/intelligence to force regenerate\n');

  } catch (error) {
    console.error('❌ Error during regeneration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }

  return stats;
}

// Main execution
const args = process.argv.slice(2);
const workspaceIdArg = args.find(arg => arg.startsWith('--workspace-id='))?.split('=')[1];
const limitArg = args.find(arg => arg.startsWith('--limit='))?.split('=')[1];
const limit = limitArg ? parseInt(limitArg, 10) : undefined;

regenerateAllIntelligence(workspaceIdArg, limit)
  .then((stats) => {
    if (stats) {
      console.log('\n📊 Final Statistics:');
      console.log(`   Total companies: ${stats.totalCompanies}`);
      console.log(`   Companies with cached intelligence: ${stats.companiesWithCachedIntelligence}`);
      console.log(`   Companies cleared: ${stats.companiesCleared}`);
      console.log(`   Errors: ${stats.errors}\n`);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

