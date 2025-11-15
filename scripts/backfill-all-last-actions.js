#!/usr/bin/env node

/**
 * Backfill All Last Actions
 * 
 * This script merges lastContact data from customFields into lastAction fields:
 * 1. Checks for lastContact data in customFields for people
 * 2. Updates people's lastAction/lastActionDate from lastContact if it's missing or more recent
 * 3. Creates actions from lastContact data if they don't exist (optional)
 * 4. Updates all company lastAction fields using the shared utility (checks both company and person actions)
 * 
 * Note: lastContact and lastAction are the same concept - this script ensures lastContact
 * data from customFields is properly reflected in lastAction fields.
 * 
 * Usage:
 *   node scripts/backfill-all-last-actions.js [--workspace-id=WORKSPACE_ID] [--dry-run] [--skip-action-creation]
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

// Import the shared utility (TypeScript file - requires tsx or ts-node)
// If running with node directly, you may need to use: tsx scripts/backfill-all-last-actions.js
const { computeCompanyLastActionsBatch } = require('../src/platform/utils/company-last-action.ts');

/**
 * Parse date from various formats
 */
function parseDate(dateValue) {
  if (!dateValue) return null;
  
  // If it's already a Date object
  if (dateValue instanceof Date) {
    return isNaN(dateValue.getTime()) ? null : dateValue;
  }
  
  // If it's a string, try to parse it
  if (typeof dateValue === 'string') {
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  
  // If it's a number (timestamp)
  if (typeof dateValue === 'number') {
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  
  return null;
}

/**
 * Check if an action already exists for a person/company with this date
 */
async function actionExistsForDate(personId, companyId, date) {
  if (!date) return false;
  
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const existing = await prisma.actions.findFirst({
    where: {
      personId: personId || undefined,
      companyId: companyId || undefined,
      completedAt: {
        gte: startOfDay,
        lte: endOfDay
      },
      deletedAt: null
    }
  });
  
  return !!existing;
}

/**
 * Create action record from lastContact data
 * This ensures the lastContact is tracked in the actions table for historical purposes
 */
async function createActionFromLastContact(person, lastContactDate, lastContactDescription, dryRun) {
  if (!lastContactDate) return null;
  
  const parsedDate = parseDate(lastContactDate);
  if (!parsedDate) {
    return null; // Already validated above
  }
  
  // Check if action already exists for this date
  const exists = await actionExistsForDate(person.id, person.companyId, parsedDate);
  if (exists) {
    return null; // Action already exists, skip
  }
  
  if (dryRun) {
    console.log(`    [DRY RUN] Would also create action record for tracking:`);
    console.log(`      Type: CALL`);
    console.log(`      Subject: ${lastContactDescription}`);
    console.log(`      Completed: ${parsedDate.toISOString()}`);
    return { id: 'dry-run-action-id' };
  }
  
  try {
    const action = await prisma.actions.create({
      data: {
        workspaceId: person.workspaceId,
        userId: person.mainSellerId || null,
        personId: person.id,
        companyId: person.companyId,
        type: 'CALL',
        subject: lastContactDescription,
        description: `Last contact merged from customFields.lastContact: ${parsedDate.toISOString()}`,
        status: 'COMPLETED',
        completedAt: parsedDate,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    return action;
  } catch (error) {
    console.error(`  ❌ Error creating action record for ${person.id}:`, error.message);
    return null;
  }
}

/**
 * Process people with lastContact data in customFields OR with lastActionDate but empty lastAction
 * Merges lastContact into lastAction/lastActionDate fields
 * Also handles cases where Last Contacted was imported directly into lastActionDate
 */
async function processPeopleLastContact(options = {}) {
  const { workspaceId, dryRun = false, skipActionCreation = false } = options;
  
  console.log('📋 Merging Last Contact Data into Last Action Fields');
  console.log('='.repeat(70));
  console.log('Note: lastContact and lastAction are the same concept');
  console.log('This script ensures lastContact data is reflected in lastAction fields');
  console.log('Also handles people with lastActionDate but empty lastAction (imported Last Contacted data)');
  console.log('');
  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be made');
  }
  if (skipActionCreation) {
    console.log('⏭️  SKIPPING ACTION CREATION - Only updating lastAction/lastActionDate');
  }
  console.log('');

  try {
    // Phase 1: Process people with lastContact in customFields
    const whereCustomFields = {
      deletedAt: null,
      customFields: {
        not: null
      }
    };
    
    if (workspaceId) {
      whereCustomFields.workspaceId = workspaceId;
    }

    const peopleWithCustomFields = await prisma.people.findMany({
      where: whereCustomFields,
      select: {
        id: true,
        fullName: true,
        email: true,
        workspaceId: true,
        companyId: true,
        mainSellerId: true,
        lastAction: true,
        lastActionDate: true,
        customFields: true
      }
    });

    console.log(`✅ Found ${peopleWithCustomFields.length} people with customFields`);
    
    // Phase 2: Process people with lastActionDate but empty lastAction (imported Last Contacted data)
    const whereLastActionDate = {
      deletedAt: null,
      lastActionDate: { not: null },
      OR: [
        { lastAction: null },
        { lastAction: '' }
      ]
    };
    
    if (workspaceId) {
      whereLastActionDate.workspaceId = workspaceId;
    }

    const peopleWithLastActionDate = await prisma.people.findMany({
      where: whereLastActionDate,
      select: {
        id: true,
        fullName: true,
        email: true,
        workspaceId: true,
        companyId: true,
        mainSellerId: true,
        lastAction: true,
        lastActionDate: true,
        customFields: true
      }
    });

    console.log(`✅ Found ${peopleWithLastActionDate.length} people with lastActionDate but empty lastAction`);
    console.log('');

    // Combine and deduplicate by ID
    const allPeopleMap = new Map();
    for (const person of [...peopleWithCustomFields, ...peopleWithLastActionDate]) {
      if (!allPeopleMap.has(person.id)) {
        allPeopleMap.set(person.id, person);
      } else {
        // Merge customFields if both exist
        const existing = allPeopleMap.get(person.id);
        if (person.customFields && existing.customFields) {
          existing.customFields = { ...existing.customFields, ...person.customFields };
        } else if (person.customFields) {
          existing.customFields = person.customFields;
        }
      }
    }
    
    const people = Array.from(allPeopleMap.values());
    console.log(`📊 Processing ${people.length} unique people...\n`);

    let processed = 0;
    let actionsCreated = 0;
    let lastActionUpdated = 0;
    let skipped = 0;
    let errors = 0;
    let fromCustomFields = 0;
    let fromLastActionDate = 0;

    for (const person of people) {
      try {
        const customFields = person.customFields || {};
        const lastContact = customFields.lastContact || customFields.lastContactDate;
        const hasLastActionDate = person.lastActionDate && !person.lastAction;
        
        // Skip if no lastContact in customFields AND no lastActionDate with empty lastAction
        if (!lastContact && !hasLastActionDate) {
          skipped++;
          continue;
        }

        processed++;
        
        let lastContactDate;
        let lastContactDescription;
        let source = '';
        
        if (lastContact) {
          // Case 1: lastContact in customFields
          lastContactDate = parseDate(lastContact);
          lastContactDescription = customFields.lastContactDescription || 
                                  customFields.lastContactType || 
                                  customFields.lastContactSubject ||
                                  person.lastAction || 
                                  'Last contact';
          source = 'customFields';
          fromCustomFields++;
        } else if (hasLastActionDate) {
          // Case 2: lastActionDate exists but lastAction is empty (imported Last Contacted data)
          lastContactDate = parseDate(person.lastActionDate);
          lastContactDescription = person.lastAction || 'Last contact';
          source = 'lastActionDate';
          fromLastActionDate++;
        } else {
          skipped++;
          continue;
        }

        if (!lastContactDate) {
          console.log(`  ⚠️  Invalid date for ${person.fullName || person.email}: ${lastContact || person.lastActionDate}`);
          errors++;
          continue;
        }

        // Determine if we should update lastAction
        // Update if: lastAction is empty/null, or lastContact is more recent
        const currentLastActionDate = person.lastActionDate ? new Date(person.lastActionDate) : null;
        const shouldUpdate = !person.lastAction || 
                            !person.lastAction.trim() ||
                            (lastContactDate && currentLastActionDate && lastContactDate > currentLastActionDate);

        if (shouldUpdate) {
          if (dryRun) {
            console.log(`  [DRY RUN] Would update lastAction for ${person.fullName || person.email} (source: ${source}):`);
            console.log(`    Current lastAction: ${person.lastAction || '(empty)'}`);
            console.log(`    Current lastActionDate: ${person.lastActionDate || '(empty)'}`);
            console.log(`    New lastAction: ${lastContactDescription}`);
            if (source === 'customFields') {
              console.log(`    New lastActionDate: ${lastContactDate.toISOString()}`);
            }
            lastActionUpdated++;
          } else {
            const updateData = {
              lastAction: lastContactDescription,
              updatedAt: new Date()
            };
            
            // Only update lastActionDate if it's from customFields (might be more recent)
            if (source === 'customFields') {
              updateData.lastActionDate = lastContactDate;
            }
            
            await prisma.people.update({
              where: { id: person.id },
              data: updateData
            });
            lastActionUpdated++;
          }
        }

        // Optionally create an action record from lastContact data
        // This ensures the action exists in the actions table for historical tracking
        if (!skipActionCreation) {
          const action = await createActionFromLastContact(
            person,
            lastContactDate,
            lastContactDescription,
            dryRun
          );
          
          if (action) {
            actionsCreated++;
          }
        }

      } catch (error) {
        console.error(`  ❌ Error processing person ${person.id}:`, error.message);
        errors++;
      }
    }

    console.log('');
    console.log('='.repeat(70));
    console.log('📊 PEOPLE LAST ACTION MERGE SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total people processed: ${processed}`);
    console.log(`  - From customFields.lastContact: ${fromCustomFields}`);
    console.log(`  - From lastActionDate (empty lastAction): ${fromLastActionDate}`);
    console.log(`People lastAction/lastActionDate updated: ${lastActionUpdated}`);
    if (!skipActionCreation) {
      console.log(`Actions created from lastContact: ${actionsCreated}`);
    }
    console.log(`People skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);
    console.log('');

    return { processed, actionsCreated, lastActionUpdated, skipped, errors, fromCustomFields, fromLastActionDate };
  } catch (error) {
    console.error('❌ Error processing people lastContact:', error);
    throw error;
  }
}

/**
 * Backfill company lastActions using shared utility
 */
async function backfillCompanyLastActions(options = {}) {
  const { workspaceId, dryRun = false } = options;
  
  console.log('🔄 Backfilling Company Last Actions');
  console.log('='.repeat(70));
  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be made');
  }
  console.log('');

  try {
    const where = {
      deletedAt: null
    };
    
    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

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
      console.log('No companies found.');
      return { processed: 0, updated: 0, unchanged: 0, errors: 0 };
    }

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
        const lastActionResults = await computeCompanyLastActionsBatch(
          batch.map(c => ({ 
            id: c.id, 
            lastAction: c.lastAction, 
            lastActionDate: c.lastActionDate 
          }))
        );

        for (const company of batch) {
          try {
            const result = lastActionResults.get(company.id);
            
            if (!result) {
              errors++;
              continue;
            }

            const newLastAction = result.lastAction;
            const newLastActionDate = result.lastActionDate;
            
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
    console.log('📊 COMPANY LAST ACTION SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total companies processed: ${processed}`);
    console.log(`Companies updated: ${updated}`);
    console.log(`Companies unchanged: ${unchanged}`);
    console.log(`Errors: ${errors}`);
    console.log('');

    return { processed, updated, unchanged, errors };
  } catch (error) {
    console.error('❌ Error during company backfill:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main(options = {}) {
  const { dryRun = false, skipActionCreation = false } = options;
  
  console.log('');
  console.log('🚀 BACKFILL ALL LAST ACTIONS');
  console.log('='.repeat(70));
  console.log('');

  try {
    // Step 1: Process people with lastContact in customFields
    const peopleResult = await processPeopleLastContact(options);
    
    // Step 2: Backfill company lastActions
    const companyResult = await backfillCompanyLastActions(options);

    // Final summary
    console.log('');
    console.log('='.repeat(70));
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(70));
    console.log(`People with lastContact data processed: ${peopleResult.processed}`);
    console.log(`People lastAction/lastActionDate merged: ${peopleResult.lastActionUpdated}`);
    if (!skipActionCreation) {
      console.log(`Action records created from lastContact: ${peopleResult.actionsCreated}`);
    }
    console.log(`Companies processed: ${companyResult.processed}`);
    console.log(`Companies lastAction updated (from actions): ${companyResult.updated}`);
    console.log(`Total errors: ${peopleResult.errors + companyResult.errors}`);
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
  skipActionCreation: args.includes('--skip-action-creation'),
  workspaceId: args.find(arg => arg.startsWith('--workspace-id='))?.split('=')[1] || 
               (process.argv.includes('--workspace-id') ? process.argv[process.argv.indexOf('--workspace-id') + 1] : null)
};

// Run the script
if (require.main === module) {
  main(options)
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

module.exports = { main, processPeopleLastContact, backfillCompanyLastActions };

