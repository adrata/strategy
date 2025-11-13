/**
 * Infer and Persist Buyer Group Roles Script
 * 
 * This script infers buyer group roles from job titles for people who don't have
 * explicit roles set, and persists them to the database.
 * 
 * Usage:
 *   npx tsx scripts/infer-buyer-group-roles.ts [--workspace <workspaceId>] [--company <companyId>] [--dry-run] [--verbose]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Calculate influence level from buyer group role
 */
function calculateInfluenceLevelFromRole(role: string | null | undefined): 'High' | 'Medium' | 'Low' | null {
  if (!role) return null;
  
  const normalizedRole = role.toLowerCase().replace(/[_-]/g, ' ').trim();
  
  if (normalizedRole === 'decision maker' || normalizedRole === 'champion') {
    return 'High';
  }
  
  if (normalizedRole === 'blocker' || normalizedRole === 'stakeholder') {
    return 'Medium';
  }
  
  if (normalizedRole === 'introducer') {
    return 'Low';
  }
  
  return 'Medium';
}

/**
 * Infer buyer group role from job title
 * Matches the logic from UniversalPeopleTab.tsx for consistency
 */
function inferBuyerGroupRoleFromTitle(jobTitle: string | null | undefined): string | null {
  if (!jobTitle) return null;
  
  const title = jobTitle.toLowerCase().trim();
  
  // Decision Makers - C-suite, VP, President, Director
  if (title.match(/\b(ceo|cto|cfo|coo|cio|cmo|president|vp|vice president|director|chief)\b/i)) {
    return 'Decision Maker';
  }
  
  // Champions - Technical experts, Managers, Leads, Architects
  if (title.match(/\b(architect|engineer|developer|manager|lead|head of|senior|principal|consultant|advisor|expert)\b/i)) {
    return 'Champion';
  }
  
  // Blockers - Procurement, Legal, Compliance, Security
  if (title.match(/\b(procurement|legal|compliance|security|audit|risk)\b/i)) {
    return 'Blocker';
  }
  
  // Introducers - Sales, Marketing, BD
  if (title.match(/\b(sales|marketing|business development|bd|account)\b/i)) {
    return 'Introducer';
  }
  
  // Stakeholders - Everyone else (return null to skip persisting)
  // Only persist explicit roles, not default stakeholders
  return null;
}

interface ScriptOptions {
  workspaceId?: string;
  companyId?: string;
  dryRun: boolean;
  verbose: boolean;
}

/**
 * Main function to infer and persist roles
 */
async function inferAndPersistRoles(options: ScriptOptions) {
  const { workspaceId, companyId, dryRun, verbose } = options;
  
  console.log('🔍 [INFER ROLES] Starting buyer group role inference...');
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  if (workspaceId) {
    console.log(`   Workspace: ${workspaceId}`);
  }
  if (companyId) {
    console.log(`   Company: ${companyId}`);
  } else {
    console.log(`   Scope: ${workspaceId ? 'WORKSPACE' : 'ALL WORKSPACES'}`);
  }
  console.log('');
  
  // Build where clause
  const whereClause: any = {
    deletedAt: null,
    buyerGroupRole: null, // Only people without explicit roles
  };
  
  if (workspaceId) {
    whereClause.workspaceId = workspaceId;
  }
  
  if (companyId) {
    whereClause.companyId = companyId;
  }
  
  // Find people without buyer group roles
  const people = await prisma.people.findMany({
    where: whereClause,
    select: {
      id: true,
      fullName: true,
      jobTitle: true,
      buyerGroupRole: true,
      isBuyerGroupMember: true,
      influenceLevel: true,
      companyId: true,
      workspaceId: true,
    },
  });
  
  console.log(`📊 [INFER ROLES] Found ${people.length} people without explicit buyer group roles`);
  console.log('');
  
  if (people.length === 0) {
    console.log('✅ [INFER ROLES] No people found without roles.');
    return;
  }
  
  // Process each person
  let inferred = 0;
  let persisted = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const person of people) {
    try {
      const inferredRole = inferBuyerGroupRoleFromTitle(person.jobTitle);
      
      if (inferredRole) {
        inferred++;
        const influenceLevel = calculateInfluenceLevelFromRole(inferredRole);
        
        if (verbose || dryRun) {
          console.log(`${dryRun ? '[DRY RUN] ' : ''}${person.fullName}`);
          console.log(`   Title: ${person.jobTitle || 'N/A'}`);
          console.log(`   Inferred Role: ${inferredRole}`);
          console.log(`   Influence Level: ${influenceLevel}`);
          console.log('');
        }
        
        if (!dryRun) {
          await prisma.people.update({
            where: { id: person.id },
            data: {
              buyerGroupRole: inferredRole,
              isBuyerGroupMember: true,
              influenceLevel: influenceLevel,
              updatedAt: new Date(),
            },
          });
          persisted++;
        }
      } else {
        skipped++;
        if (verbose) {
          console.log(`[SKIPPED] ${person.fullName} - Title: ${person.jobTitle || 'N/A'} (no clear role)`);
        }
      }
    } catch (error) {
      errors++;
      console.error(`❌ [INFER ROLES] Error processing person ${person.id}:`, error);
    }
  }
  
  console.log('');
  console.log('📊 [INFER ROLES] Summary:');
  console.log(`   Total found: ${people.length}`);
  console.log(`   Roles inferred: ${inferred}`);
  console.log(`   ${dryRun ? 'Would persist' : 'Persisted'}: ${persisted}`);
  console.log(`   Skipped (no clear role): ${skipped}`);
  console.log(`   Errors: ${errors}`);
  console.log('');
  
  if (dryRun) {
    console.log('💡 [INFER ROLES] This was a dry run. Run without --dry-run to apply changes.');
  } else {
    console.log('✅ [INFER ROLES] Role inference complete!');
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
    } else if (arg === '--company' || arg === '-c') {
      options.companyId = args[++i];
    } else if (arg === '--dry-run' || arg === '-d') {
      options.dryRun = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log('');
      console.log('Infer and Persist Buyer Group Roles Script');
      console.log('');
      console.log('Usage:');
      console.log('  npx tsx scripts/infer-buyer-group-roles.ts [options]');
      console.log('');
      console.log('Options:');
      console.log('  --workspace, -w <id>   Only process people in specific workspace');
      console.log('  --company, -c <id>     Only process people in specific company');
      console.log('  --dry-run, -d          Show what would be changed without making changes');
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
    await inferAndPersistRoles(options);
  } catch (error) {
    console.error('❌ [INFER ROLES] Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();

