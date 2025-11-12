/**
 * Fix Buyer Group Data Inconsistency Script
 * 
 * This script fixes all people records with inconsistent buyer group data:
 * - Calculates correct influenceLevel from buyerGroupRole
 * - Sets isBuyerGroupMember = true when buyerGroupRole exists
 * - Clears isBuyerGroupMember when no buyerGroupRole exists
 * 
 * Usage:
 *   npx tsx scripts/fix-buyer-group-data-inconsistency.ts --workspace <workspaceId> [--dry-run] [--verbose]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Calculate influence level from buyer group role
 * Handles case-insensitive and various formats
 */
function calculateInfluenceLevelFromRole(role: string | null | undefined): 'High' | 'Medium' | 'Low' | null {
  if (!role) return null;
  
  // Normalize: lowercase, replace underscores/hyphens with spaces, trim
  const normalizedRole = role.toLowerCase().replace(/[_-]/g, ' ').trim();
  
  // Decision Maker and Champion have high influence
  if (normalizedRole === 'decision maker' || 
      normalizedRole === 'champion' ||
      normalizedRole === 'decision' ||
      normalizedRole.includes('decision')) {
    return 'High';
  }
  
  // Blocker and Stakeholder have medium influence
  if (normalizedRole === 'blocker' || 
      normalizedRole === 'stakeholder') {
    return 'Medium';
  }
  
  // Introducer has low influence
  if (normalizedRole === 'introducer') {
    return 'Low';
  }
  
  // Default to Medium for unknown roles
  return 'Medium';
}

interface ScriptOptions {
  workspaceId?: string;
  dryRun: boolean;
  verbose: boolean;
}

/**
 * Main migration function
 */
async function fixBuyerGroupData(options: ScriptOptions) {
  const { workspaceId, dryRun, verbose } = options;
  
  console.log('🔄 [MIGRATION] Starting buyer group data fix...');
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  if (workspaceId) {
    console.log(`   Workspace: ${workspaceId}`);
  } else {
    console.log(`   Scope: ALL WORKSPACES`);
  }
  console.log('');
  
  // Build where clause
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
  
  // Find all people with inconsistent buyer group data
  const peopleToFix = await prisma.people.findMany({
    where: whereClause,
    select: {
      id: true,
      fullName: true,
      buyerGroupRole: true,
      isBuyerGroupMember: true,
      influenceLevel: true,
      companyId: true,
      workspaceId: true,
    },
  });
  
  console.log(`📊 [MIGRATION] Found ${peopleToFix.length} people with inconsistent buyer group data`);
  console.log('');
  
  if (peopleToFix.length === 0) {
    console.log('✅ [MIGRATION] No inconsistencies found! All data is already consistent.');
    return;
  }
  
  // Group by issue type for reporting
  const hasRoleButNoInfluence = peopleToFix.filter(p => p.buyerGroupRole && !p.influenceLevel);
  const hasRoleButNotMember = peopleToFix.filter(p => p.buyerGroupRole && !p.isBuyerGroupMember);
  const noRoleButMember = peopleToFix.filter(p => !p.buyerGroupRole && p.isBuyerGroupMember);
  
  console.log('📊 [MIGRATION] Issue breakdown:');
  console.log(`   - Has role but no influenceLevel: ${hasRoleButNoInfluence.length}`);
  console.log(`   - Has role but isBuyerGroupMember = false: ${hasRoleButNotMember.length}`);
  console.log(`   - No role but isBuyerGroupMember = true: ${noRoleButMember.length}`);
  console.log('');
  
  // Process each person
  let fixed = 0;
  let errors = 0;
  
  for (const person of peopleToFix) {
    try {
      const updateData: any = {};
      const changes: string[] = [];
      
      if (person.buyerGroupRole) {
        // Person has a role - ensure all fields are set correctly
        const calculatedInfluence = calculateInfluenceLevelFromRole(person.buyerGroupRole);
        
        if (!person.isBuyerGroupMember) {
          updateData.isBuyerGroupMember = true;
          changes.push(`isBuyerGroupMember: ${person.isBuyerGroupMember} → true`);
        }
        
        if (calculatedInfluence && person.influenceLevel !== calculatedInfluence) {
          updateData.influenceLevel = calculatedInfluence;
          changes.push(`influenceLevel: ${person.influenceLevel || 'null'} → ${calculatedInfluence}`);
        }
      } else {
        // Person has no role - clear buyer group membership
        if (person.isBuyerGroupMember) {
          updateData.isBuyerGroupMember = false;
          changes.push(`isBuyerGroupMember: true → false`);
        }
      }
      
      if (Object.keys(updateData).length > 0) {
        if (verbose || dryRun) {
          console.log(`${dryRun ? '[DRY RUN] ' : ''}Fixing ${person.fullName} (${person.id})`);
          console.log(`   Role: ${person.buyerGroupRole || 'none'}`);
          changes.forEach(change => console.log(`   ${change}`));
          console.log('');
        }
        
        if (!dryRun) {
          updateData.updatedAt = new Date();
          await prisma.people.update({
            where: { id: person.id },
            data: updateData,
          });
        }
        
        fixed++;
      }
    } catch (error) {
      errors++;
      console.error(`❌ [MIGRATION] Error fixing person ${person.id}:`, error);
    }
  }
  
  console.log('');
  console.log('📊 [MIGRATION] Summary:');
  console.log(`   Total found: ${peopleToFix.length}`);
  console.log(`   ${dryRun ? 'Would fix' : 'Fixed'}: ${fixed}`);
  console.log(`   Errors: ${errors}`);
  console.log('');
  
  if (dryRun) {
    console.log('💡 [MIGRATION] This was a dry run. Run without --dry-run to apply changes.');
  } else {
    console.log('✅ [MIGRATION] Migration complete!');
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2);
  const options: ScriptOptions = {
    dryRun: false,
    verbose: false,
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--workspace' || arg === '-w') {
      options.workspaceId = args[++i];
    } else if (arg === '--dry-run' || arg === '-d') {
      options.dryRun = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log('');
      console.log('Fix Buyer Group Data Inconsistency Script');
      console.log('');
      console.log('Usage:');
      console.log('  npx tsx scripts/fix-buyer-group-data-inconsistency.ts [options]');
      console.log('');
      console.log('Options:');
      console.log('  --workspace, -w <id>   Only fix data for specific workspace');
      console.log('  --dry-run, -d          Show what would be fixed without making changes');
      console.log('  --verbose, -v          Show detailed output for each person');
      console.log('  --help, -h             Show this help message');
      console.log('');
      process.exit(0);
    }
  }
  
  return options;
}

/**
 * Main entry point
 */
async function main() {
  try {
    const options = parseArgs();
    await fixBuyerGroupData(options);
  } catch (error) {
    console.error('❌ [MIGRATION] Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();

