/**
 * Test Buyer Group Role Display Fix
 * 
 * This script verifies that all buyer group members display correct roles
 * (not all "Stakeholder") for Hill Country Telephone Cooperative.
 * 
 * Usage:
 *   node scripts/test-bg-role-display-fix.js [companyId]
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get role display label from database value
 */
function getRoleLabel(dbRole) {
  const roleMap = {
    'decision': 'Decision Maker',
    'champion': 'Champion',
    'stakeholder': 'Stakeholder',
    'blocker': 'Blocker',
    'introducer': 'Introducer'
  };
  
  if (!dbRole) return 'Unknown';
  const normalized = dbRole.toLowerCase().trim();
  return roleMap[normalized] || dbRole;
}

/**
 * Test buyer group role display fix
 */
async function testRoleDisplayFix(companyId) {
  console.log(`\n🧪 Testing Buyer Group Role Display Fix`);
  console.log('='.repeat(60));
  console.log(`📍 Company ID: ${companyId}`);
  
  // Get the company
  const company = await prisma.companies.findUnique({
    where: { id: companyId },
    select: { id: true, name: true, workspaceId: true }
  });
  
  if (!company) {
    console.error(`❌ Company not found: ${companyId}`);
    return { passed: false, errors: [`Company not found: ${companyId}`] };
  }
  
  console.log(`📋 Company: ${company.name} (${company.id})`);
  console.log(`📋 Workspace: ${company.workspaceId}`);
  
  // Get all people for this company who are buyer group members
  const people = await prisma.people.findMany({
    where: {
      companyId: companyId,
      workspaceId: company.workspaceId,
      deletedAt: null,
      OR: [
        { buyerGroupRole: { not: null } },
        { isBuyerGroupMember: true }
      ]
    },
    select: {
      id: true,
      fullName: true,
      jobTitle: true,
      buyerGroupRole: true,
      isBuyerGroupMember: true
    },
    orderBy: {
      fullName: 'asc'
    }
  });
  
  console.log(`\n📊 Found ${people.length} buyer group members`);
  
  if (people.length === 0) {
    console.error(`❌ No buyer group members found`);
    return { passed: false, errors: ['No buyer group members found'] };
  }
  
  // Test results
  const results = {
    passed: true,
    errors: [],
    warnings: [],
    roleCounts: {},
    memberDetails: []
  };
  
  // Analyze each member
  for (const person of people) {
    const dbRole = person.buyerGroupRole;
    const displayRole = getRoleLabel(dbRole);
    
    // Count roles
    results.roleCounts[displayRole] = (results.roleCounts[displayRole] || 0) + 1;
    
    // Store member details
    results.memberDetails.push({
      name: person.fullName,
      jobTitle: person.jobTitle || 'N/A',
      dbRole: dbRole || 'null',
      displayRole: displayRole,
      isBuyerGroupMember: person.isBuyerGroupMember
    });
    
    // Check for issues
    if (!dbRole) {
      results.warnings.push(`${person.fullName}: Missing buyerGroupRole`);
    }
    
    if (!person.isBuyerGroupMember && dbRole) {
      results.warnings.push(`${person.fullName}: Has role but isBuyerGroupMember is false`);
    }
  }
  
  // Verify expected roles for Hill Country Telephone Cooperative
  const expectedRoles = {
    'Scott Link': 'Decision Maker',
    'Ed Jones': 'Champion'
  };
  
  console.log(`\n📋 Member Details:`);
  for (const member of results.memberDetails) {
    const expectedRole = expectedRoles[member.name];
    const status = expectedRole 
      ? (member.displayRole === expectedRole ? '✅' : '❌')
      : '  ';
    console.log(`   ${status} ${member.name}: ${member.displayRole} (DB: ${member.dbRole})`);
    
    if (expectedRole && member.displayRole !== expectedRole) {
      results.errors.push(`${member.name}: Expected "${expectedRole}" but got "${member.displayRole}"`);
      results.passed = false;
    }
  }
  
  // Check role distribution
  console.log(`\n📊 Role Distribution:`);
  for (const [role, count] of Object.entries(results.roleCounts)) {
    console.log(`   ${role}: ${count}`);
  }
  
  // Critical test: Not all members should be Stakeholders
  const stakeholderCount = results.roleCounts['Stakeholder'] || 0;
  const totalMembers = people.length;
  
  console.log(`\n🔍 Critical Test: Not all members are Stakeholders`);
  console.log(`   Stakeholders: ${stakeholderCount} / ${totalMembers}`);
  
  if (stakeholderCount === totalMembers) {
    results.errors.push(`All ${totalMembers} members are showing as Stakeholder - fix failed!`);
    results.passed = false;
  } else {
    const nonStakeholderCount = totalMembers - stakeholderCount;
    console.log(`   ✅ PASS: ${nonStakeholderCount} non-stakeholder members found`);
  }
  
  // Verify specific expected members
  console.log(`\n🔍 Specific Member Tests:`);
  const scottLink = results.memberDetails.find(m => m.name === 'Scott Link');
  const edJones = results.memberDetails.find(m => m.name === 'Ed Jones');
  
  if (scottLink) {
    if (scottLink.displayRole === 'Decision Maker') {
      console.log(`   ✅ Scott Link: Correctly shows as "Decision Maker"`);
    } else {
      console.log(`   ❌ Scott Link: Shows as "${scottLink.displayRole}" (expected "Decision Maker")`);
      results.errors.push(`Scott Link: Expected "Decision Maker" but got "${scottLink.displayRole}"`);
      results.passed = false;
    }
  } else {
    console.log(`   ⚠️  Scott Link: Not found in buyer group`);
    results.warnings.push('Scott Link not found in buyer group');
  }
  
  if (edJones) {
    if (edJones.displayRole === 'Champion') {
      console.log(`   ✅ Ed Jones: Correctly shows as "Champion"`);
    } else {
      console.log(`   ❌ Ed Jones: Shows as "${edJones.displayRole}" (expected "Champion")`);
      results.errors.push(`Ed Jones: Expected "Champion" but got "${edJones.displayRole}"`);
      results.passed = false;
    }
  } else {
    console.log(`   ⚠️  Ed Jones: Not found in buyer group`);
    results.warnings.push('Ed Jones not found in buyer group');
  }
  
  // Summary
  console.log(`\n${'='.repeat(60)}`);
  if (results.passed) {
    console.log(`✅ TEST PASSED: All buyer group roles display correctly`);
  } else {
    console.log(`❌ TEST FAILED: Issues found with role display`);
  }
  
  if (results.errors.length > 0) {
    console.log(`\n❌ Errors:`);
    results.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  if (results.warnings.length > 0) {
    console.log(`\n⚠️  Warnings:`);
    results.warnings.forEach(warning => console.log(`   - ${warning}`));
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total Members: ${totalMembers}`);
  console.log(`   Stakeholders: ${stakeholderCount}`);
  console.log(`   Non-Stakeholders: ${totalMembers - stakeholderCount}`);
  console.log(`   Errors: ${results.errors.length}`);
  console.log(`   Warnings: ${results.warnings.length}`);
  
  return results;
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Starting Buyer Group Role Display Fix Test');
    console.log('='.repeat(60));
    
    const args = process.argv.slice(2);
    const companyId = args[0] || '01K9QD3RTJNEZFWAGJS701PQ2V'; // Default to Hill Country Telephone Cooperative
    
    console.log(`\n📍 Company ID: ${companyId}`);
    
    const results = await testRoleDisplayFix(companyId);
    
    console.log('\n' + '='.repeat(60));
    if (results.passed) {
      console.log('✅ All tests passed!');
      process.exit(0);
    } else {
      console.log('❌ Some tests failed!');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();

