#!/usr/bin/env node

/**
 * Backfill Company Last Actions
 * 
 * Updates all company lastAction fields using the shared utility that checks
 * both company-level actions AND actions from associated people.
 * 
 * This ensures all companies have accurate lastAction data after the transfer.
 * 
 * Usage:
 *   node scripts/backfill-company-last-actions.js [--workspace-id=WORKSPACE_ID] [--dry-run]
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Import the shared utility
const { computeCompanyLastActionsBatch } = require('../src/platform/utils/company-last-action');

async function backfillCompanyLastActions(options = {}) {
  const { workspaceId, dryRun = false } = options;
  
  console.log('🔄 Backfilling Company Last Actions');
  console.log('='.repeat(70));
  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be made');
  }
  console.log('');

  try {
    // Build where clause
    const where = {
      deletedAt: null
    };
    
    if (workspaceId) {
      where.workspaceId = workspaceId;
      console.log(`📋 Filtering by workspace: ${workspaceId}`);
    }

    // Get all companies
    console.log('📊 Fetching companies...');
    const companies = await prisma.companies.findMany({
      where,
      select: {
        id: true,
        name: true,
        lastAction: true,
        lastActionDate: true,
        workspaceId: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`✅ Found ${companies.length} companies to process`);
    console.log('');

    if (companies.length === 0) {
      console.log('No companies found. Exiting.');
      await prisma.$disconnect();
      return;
    }

    // Process in batches for performance
    const BATCH_SIZE = 100;
    let processed = 0;
    let updated = 0;
    let unchanged = 0;
    let errors = 0;

    for (let i = 0; i < companies.length; i += BATCH_SIZE) {
      const batch = companies.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(companies.length / BATCH_SIZE);
      
      console.log(`📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} companies)...`);

      try {
        // Use batch utility to compute lastActions
        const lastActionResults = await computeCompanyLastActionsBatch(
          batch.map(c => ({ 
            id: c.id, 
            lastAction: c.lastAction, 
            lastActionDate: c.lastActionDate 
          }))
        );

        // Update each company
        for (const company of batch) {
          try {
            const result = lastActionResults.get(company.id);
            
            if (!result) {
              console.log(`  ⚠️  No result for ${company.name} (${company.id})`);
              errors++;
              continue;
            }

            const newLastAction = result.lastAction;
            const newLastActionDate = result.lastActionDate;
            
            // Check if update is needed
            const needsUpdate = 
              (company.lastAction !== newLastAction) ||
              (company.lastActionDate?.getTime() !== newLastActionDate?.getTime());

            if (needsUpdate) {
              if (dryRun) {
                console.log(`  [DRY RUN] Would update ${company.name}:`);
                console.log(`    Old: ${company.lastAction || '(empty)'} (${company.lastActionDate || 'no date'})`);
                console.log(`    New: ${newLastAction || '(empty)'} (${newLastActionDate || 'no date'})`);
                updated++;
              } else {
                await prisma.companies.update({
                  where: { id: company.id },
                  data: {
                    lastAction: newLastAction,
                    lastActionDate: newLastActionDate,
                    updatedAt: new Date()
                  }
                });
                updated++;
                
                if (updated % 50 === 0) {
                  console.log(`  ✅ Updated ${updated} companies so far...`);
                }
              }
            } else {
              unchanged++;
            }

            processed++;
          } catch (error) {
            console.error(`  ❌ Error processing ${company.name} (${company.id}):`, error.message);
            errors++;
          }
        }

        console.log(`  ✅ Batch ${batchNum} complete: ${updated} updated, ${unchanged} unchanged, ${errors} errors`);
        console.log('');
      } catch (error) {
        console.error(`  ❌ Error processing batch ${batchNum}:`, error);
        errors += batch.length;
      }
    }

    console.log('='.repeat(70));
    console.log('📊 SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total companies processed: ${processed}`);
    console.log(`Companies updated: ${updated}`);
    console.log(`Companies unchanged: ${unchanged}`);
    console.log(`Errors: ${errors}`);
    console.log('');

    if (dryRun) {
      console.log('⚠️  DRY RUN - No changes were made');
      console.log('Run without --dry-run to apply changes');
    } else {
      console.log('✅ Backfill complete!');
    }

  } catch (error) {
    console.error('❌ Error during backfill:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  workspaceId: args.find(arg => arg.startsWith('--workspace-id='))?.split('=')[1] || 
               (process.argv.includes('--workspace-id') ? process.argv[process.argv.indexOf('--workspace-id') + 1] : null)
};

// Run the backfill
if (require.main === module) {
  backfillCompanyLastActions(options)
    .then(() => {
      console.log('');
      console.log('✅ Script complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { backfillCompanyLastActions };

