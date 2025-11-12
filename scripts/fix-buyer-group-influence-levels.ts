/**
 * Migration Script: Fix Buyer Group Influence Levels
 * 
 * Backfills missing influenceLevel values for existing buyer group members.
 * Ensures consistency between buyerGroupRole and influenceLevel.
 * 
 * Usage:
 *   npx tsx scripts/fix-buyer-group-influence-levels.ts [workspaceId] [--dry-run]
 * 
 * Examples:
 *   npx tsx scripts/fix-buyer-group-influence-levels.ts
 *   npx tsx scripts/fix-buyer-group-influence-levels.ts 01K7DNYR5VZ7JY36KGKKN76XZ1
 *   npx tsx scripts/fix-buyer-group-influence-levels.ts 01K7DNYR5VZ7JY36KGKKN76XZ1 --dry-run
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Calculate influence level from buyer group role
 * Maps buyer group roles to influence levels for consistency
 */
function calculateInfluenceLevelFromRole(role: string | null | undefined): 'High' | 'Medium' | 'Low' | null {
  if (!role) return null;
  
  const normalizedRole = role.toLowerCase().trim();
  
  // Decision Maker and Champion have high influence
  if (normalizedRole === 'decision maker' || normalizedRole === 'champion') {
    return 'High';
  }
  
  // Blocker and Stakeholder have medium influence
  if (normalizedRole === 'blocker' || normalizedRole === 'stakeholder') {
    return 'Medium';
  }
  
  // Introducer has low influence
  if (normalizedRole === 'introducer') {
    return 'Low';
  }
  
  // Default to Medium for unknown roles
  return 'Medium';
}

interface SyncStats {
  totalFound: number;
  updated: number;
  skipped: number;
  errors: number;
  changes: {
    influenceLevel: number;
    isBuyerGroupMember: number;
  };
}

async function fixBuyerGroupInfluenceLevels(
  workspaceId?: string,
  options?: { dryRun?: boolean; batchSize?: number }
): Promise<SyncStats> {
  const dryRun = options?.dryRun || false;
  const queryBatchSize = options?.batchSize || 1000; // How many to query at a time
  const processBatchSize = 100; // How many to process before logging progress

  const stats: SyncStats = {
    totalFound: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    changes: {
      influenceLevel: 0,
      isBuyerGroupMember: 0,
    },
  };

  console.log('🔄 [BUYER GROUP FIX] Starting buyer group influence level fix...');
  if (dryRun) {
    console.log('⚠️  [DRY RUN] Running in dry-run mode - no changes will be made');
  }
  if (workspaceId) {
    console.log(`📋 [BUYER GROUP FIX] Filtering by workspace: ${workspaceId}`);
  }

  try {
    // Find people with buyerGroupRole but missing/null influenceLevel or incorrect isBuyerGroupMember
    const whereClause: any = {
      deletedAt: null,
      OR: [
        // Has buyerGroupRole but missing/null influenceLevel
        {
          buyerGroupRole: { not: null },
          influenceLevel: null,
        },
        // Has buyerGroupRole but isBuyerGroupMember is false/null
        {
          buyerGroupRole: { not: null },
          OR: [
            { isBuyerGroupMember: false },
            { isBuyerGroupMember: null },
          ],
        },
        // No buyerGroupRole but isBuyerGroupMember is true
        {
          buyerGroupRole: null,
          isBuyerGroupMember: true,
        },
      ],
    };

    if (workspaceId) {
      whereClause.workspaceId = workspaceId;
    }

    // Process all records in batches using cursor-based pagination
    let cursor: string | undefined = undefined;
    let hasMore = true;
    let batchNumber = 0;

    while (hasMore) {
      const peopleToFix = await prisma.people.findMany({
        where: {
          ...whereClause,
          ...(cursor ? { id: { gt: cursor } } : {}),
        },
        select: {
          id: true,
          fullName: true,
          buyerGroupRole: true,
          isBuyerGroupMember: true,
          influenceLevel: true,
        },
        take: queryBatchSize,
        orderBy: { id: 'asc' },
      });

      if (peopleToFix.length === 0) {
        hasMore = false;
        break;
      }

      batchNumber++;
      stats.totalFound += peopleToFix.length;
      console.log(`📊 [BUYER GROUP FIX] Processing batch ${batchNumber} (${peopleToFix.length} records)`);

      // Process in smaller batches for progress updates
      for (let i = 0; i < peopleToFix.length; i += processBatchSize) {
        const batch = peopleToFix.slice(i, i + processBatchSize);
        const batchNum = Math.floor(i / processBatchSize) + 1;
        const totalBatches = Math.ceil(peopleToFix.length / processBatchSize);
        console.log(`🔄 [BUYER GROUP FIX]   Processing sub-batch ${batchNum}/${totalBatches} (${batch.length} records)`);

        for (const person of batch) {
          try {
            const updateData: Record<string, any> = {};
            const changes: string[] = [];

            // Calculate influence level from role
            const calculatedInfluenceLevel = person.buyerGroupRole
              ? calculateInfluenceLevelFromRole(person.buyerGroupRole)
              : null;

            // Set isBuyerGroupMember based on buyerGroupRole
            if (person.buyerGroupRole) {
              if (!person.isBuyerGroupMember) {
                updateData.isBuyerGroupMember = true;
                changes.push(`isBuyerGroupMember: false/null → true`);
                stats.changes.isBuyerGroupMember++;
              }
              // Set influenceLevel if missing or incorrect
              if (calculatedInfluenceLevel && person.influenceLevel !== calculatedInfluenceLevel) {
                updateData.influenceLevel = calculatedInfluenceLevel;
                changes.push(`influenceLevel: ${person.influenceLevel || 'null'} → ${calculatedInfluenceLevel}`);
                stats.changes.influenceLevel++;
              }
            } else {
              // No buyerGroupRole but isBuyerGroupMember is true - set to false
              if (person.isBuyerGroupMember) {
                updateData.isBuyerGroupMember = false;
                changes.push(`isBuyerGroupMember: true → false (no buyerGroupRole)`);
                stats.changes.isBuyerGroupMember++;
              }
            }

            if (Object.keys(updateData).length > 0) {
              if (dryRun) {
                console.log(`[DRY RUN] Would update ${person.fullName} (${person.id}):`, changes);
                stats.updated++;
              } else {
                updateData.updatedAt = new Date();
                await prisma.people.update({
                  where: { id: person.id },
                  data: updateData,
                });
                console.log(`✅ Updated ${person.fullName} (${person.id}):`, changes);
                stats.updated++;
              }
            } else {
              stats.skipped++;
            }
          } catch (error) {
            stats.errors++;
            console.error(`❌ Error fixing person ${person.id}:`, error);
          }
        }
      }

      // Update cursor for next batch
      if (peopleToFix.length === queryBatchSize) {
        cursor = peopleToFix[peopleToFix.length - 1].id;
      } else {
        hasMore = false;
      }
    }

    console.log('\n📊 [BUYER GROUP FIX] Summary:');
    console.log(`   Total found: ${stats.totalFound}`);
    console.log(`   Updated: ${stats.updated}`);
    console.log(`   Skipped: ${stats.skipped}`);
    console.log(`   Errors: ${stats.errors}`);
    console.log(`   Changes:`);
    console.log(`     - influenceLevel: ${stats.changes.influenceLevel}`);
    console.log(`     - isBuyerGroupMember: ${stats.changes.isBuyerGroupMember}`);

    return stats;
  } catch (error) {
    console.error('❌ [BUYER GROUP FIX] Fatal error:', error);
    throw error;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const workspaceId = args.find(arg => !arg.startsWith('--')) || undefined;
  const dryRun = args.includes('--dry-run');

  try {
    await fixBuyerGroupInfluenceLevels(workspaceId, { dryRun });
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { fixBuyerGroupInfluenceLevels, calculateInfluenceLevelFromRole };

