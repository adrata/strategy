/**
 * Fix Buyer Group Membership Sync
 * 
 * This script fixes the data inconsistency where people have buyerGroupRole
 * but isBuyerGroupMember is not set to true.
 * 
 * Specifically addresses the issue where Aidil Benitez and potentially other
 * people show as "not in buyer group" on their person record but appear
 * as stakeholders on the company's buyer group tab.
 * 
 * Usage:
 *   node scripts/maintenance/fix-buyer-group-membership-sync.js [workspaceId]
 * 
 * If no workspaceId is provided, it will sync all workspaces.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Calculate influence level from buyer group role
 */
function calculateInfluenceLevelFromRole(role) {
  if (!role) return null;
  
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

/**
 * Fix buyer group membership for a workspace
 */
async function fixWorkspaceBuyerGroups(workspaceId) {
  console.log(`\n🔍 Checking workspace: ${workspaceId}`);
  
  // Find people with buyerGroupRole but incorrect isBuyerGroupMember or influenceLevel
  const peopleToFix = await prisma.people.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      OR: [
        // Has buyerGroupRole but isBuyerGroupMember is false/null
        {
          buyerGroupRole: { not: null },
          OR: [
            { isBuyerGroupMember: false },
            { isBuyerGroupMember: null },
          ],
        },
        // Has buyerGroupRole but missing influenceLevel
        {
          buyerGroupRole: { not: null },
          influenceLevel: null,
        },
        // No buyerGroupRole but isBuyerGroupMember is true
        {
          buyerGroupRole: null,
          isBuyerGroupMember: true,
        },
      ],
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      buyerGroupRole: true,
      isBuyerGroupMember: true,
      influenceLevel: true,
      companyId: true,
      company: {
        select: {
          name: true,
        },
      },
    },
  });

  if (peopleToFix.length === 0) {
    console.log('✅ No issues found in this workspace');
    return { fixed: 0, errors: 0 };
  }

  console.log(`⚠️  Found ${peopleToFix.length} people with inconsistent buyer group data`);
  console.log('\nPeople to fix:');
  peopleToFix.forEach((person, index) => {
    console.log(`${index + 1}. ${person.fullName} (${person.email})`);
    console.log(`   Company: ${person.company?.name || 'N/A'}`);
    console.log(`   Current: Role="${person.buyerGroupRole}", Member=${person.isBuyerGroupMember}, Influence=${person.influenceLevel}`);
    
    const targetInfluence = person.buyerGroupRole ? calculateInfluenceLevelFromRole(person.buyerGroupRole) : null;
    const targetMember = person.buyerGroupRole ? true : false;
    console.log(`   Target:  Role="${person.buyerGroupRole}", Member=${targetMember}, Influence=${targetInfluence}`);
  });

  let fixed = 0;
  let errors = 0;

  // Fix each person
  for (const person of peopleToFix) {
    try {
      const updateData = {};

      if (person.buyerGroupRole) {
        // Has a role - ensure isBuyerGroupMember is true and influenceLevel is set
        if (!person.isBuyerGroupMember) {
          updateData.isBuyerGroupMember = true;
        }
        
        const calculatedInfluence = calculateInfluenceLevelFromRole(person.buyerGroupRole);
        if (calculatedInfluence && person.influenceLevel !== calculatedInfluence) {
          updateData.influenceLevel = calculatedInfluence;
        }
      } else {
        // No role - ensure isBuyerGroupMember is false
        if (person.isBuyerGroupMember) {
          updateData.isBuyerGroupMember = false;
        }
      }

      if (Object.keys(updateData).length > 0) {
        updateData.updatedAt = new Date();
        
        await prisma.people.update({
          where: { id: person.id },
          data: updateData,
        });

        fixed++;
        console.log(`✅ Fixed: ${person.fullName}`);
        console.log(`   Updates:`, updateData);
      }
    } catch (error) {
      errors++;
      console.error(`❌ Error fixing ${person.fullName}:`, error.message);
    }
  }

  return { fixed, errors };
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Starting Buyer Group Membership Sync Fix');
    console.log('=' .repeat(60));
    
    const args = process.argv.slice(2);
    const targetWorkspaceId = args[0];

    let workspaces;
    
    if (targetWorkspaceId) {
      // Fix specific workspace
      console.log(`\n📍 Targeting workspace: ${targetWorkspaceId}`);
      workspaces = [{ id: targetWorkspaceId }];
    } else {
      // Fix all workspaces
      console.log('\n📍 Scanning all workspaces');
      workspaces = await prisma.workspaces.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true, slug: true },
      });
      console.log(`Found ${workspaces.length} active workspaces`);
    }

    let totalFixed = 0;
    let totalErrors = 0;

    for (const workspace of workspaces) {
      const { fixed, errors } = await fixWorkspaceBuyerGroups(workspace.id);
      totalFixed += fixed;
      totalErrors += errors;
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Sync Fix Complete');
    console.log(`Total people fixed: ${totalFixed}`);
    console.log(`Total errors: ${totalErrors}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();

