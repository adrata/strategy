/**
 * Sync Last Actions Script
 * 
 * This script updates the stored lastAction and lastActionDate for people
 * to match their actual most recent completed action from the actions table.
 * This ensures full synchronization between stored fields and computed values.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BATCH_SIZE = 100;
const DELAY_BETWEEN_BATCHES = 500; // 0.5 seconds between batches

/**
 * Sync last actions for people
 */
async function syncLastActions() {
  console.log('🔄 SYNCING LAST ACTIONS');
  console.log('======================');
  console.log(`Started at: ${new Date().toISOString()}\n`);
  
  let processed = 0;
  let updated = 0;
  let noChange = 0;
  let errorCount = 0;
  
  try {
    // Get total count for progress tracking
    const totalPeople = await prisma.people.count();
    console.log(`  Total people to check: ${totalPeople.toLocaleString()}`);
    
    let offset = 0;
    
    while (offset < totalPeople) {
      try {
        // Fetch batch of people with their most recent action
        const people = await prisma.people.findMany({
          skip: offset,
          take: BATCH_SIZE,
          include: {
            actions: {
              where: { status: 'COMPLETED' },
              orderBy: { completedAt: 'desc' },
              take: 1,
              select: { subject: true, completedAt: true, type: true }
            }
          }
        });
        
        if (people.length === 0) break;
        
        console.log(`  Processing batch ${Math.floor(offset / BATCH_SIZE) + 1}/${Math.ceil(totalPeople / BATCH_SIZE)} (${people.length} people)...`);
        
        // Process each person in the batch
        for (const person of people) {
          try {
            const mostRecentAction = person.actions[0];
            
            // Determine what the lastAction should be
            const actualLastAction = mostRecentAction?.subject || 'Record created';
            const actualLastActionDate = mostRecentAction?.completedAt || person.createdAt;
            
            // Check if stored values match actual values
            const storedLastAction = person.lastAction;
            const storedLastActionDate = person.lastActionDate;
            
            const needsUpdate = 
              storedLastAction !== actualLastAction ||
              (storedLastActionDate && actualLastActionDate && 
               new Date(storedLastActionDate).getTime() !== new Date(actualLastActionDate).getTime());
            
            if (needsUpdate) {
              // Update the person's stored lastAction fields
              await prisma.people.update({
                where: { id: person.id },
                data: {
                  lastAction: actualLastAction,
                  lastActionDate: actualLastActionDate
                }
              });
              
              updated++;
              
              if (updated % 100 === 0) {
                console.log(`    Updated ${updated} people so far...`);
              }
            } else {
              noChange++;
            }
            
            processed++;
            
            if (processed % 1000 === 0) {
              console.log(`    Processed ${processed}/${totalPeople} people...`);
            }
            
          } catch (error) {
            console.error(`❌ Error processing person ${person.id}:`, error);
            errorCount++;
            processed++;
          }
        }
        
        offset += BATCH_SIZE;
        
        // Delay between batches
        if (offset < totalPeople) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
        }
        
      } catch (error) {
        console.error(`❌ Error processing people batch at offset ${offset}:`, error);
        errorCount += BATCH_SIZE;
        offset += BATCH_SIZE;
      }
    }
    
    console.log(`\n✅ Last actions sync complete:`);
    console.log(`  People processed: ${processed.toLocaleString()}`);
    console.log(`  People updated: ${updated.toLocaleString()}`);
    console.log(`  People unchanged: ${noChange.toLocaleString()}`);
    console.log(`  Errors: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 All last actions are now fully synchronized!');
    } else {
      console.log(`\n⚠️  ${errorCount} errors occurred during processing.`);
    }
    
    console.log(`\n✅ Sync completed at: ${new Date().toISOString()}`);
    
  } catch (error) {
    console.error('❌ Error during last actions sync:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the sync
syncLastActions().catch(console.error);
