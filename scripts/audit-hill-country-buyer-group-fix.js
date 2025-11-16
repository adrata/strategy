/**
 * Comprehensive Audit: Hill Country Telephone Cooperative Buyer Group Fix
 * 
 * This script audits:
 * 1. Database state - roles stored correctly
 * 2. API response - roles returned correctly  
 * 3. Data consistency - all members properly marked
 * 4. Role format consistency - lowercase DB values vs display labels
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const COMPANY_ID = '01K9QD3RTJNEZFWAGJS701PQ2V';
const COMPANY_NAME = 'Hill Country Telephone Cooperative';

// Valid role values (database format)
const VALID_DB_ROLES = ['decision', 'champion', 'stakeholder', 'blocker', 'introducer'];

// Valid role labels (display format)
const VALID_DISPLAY_ROLES = ['Decision Maker', 'Champion', 'Stakeholder', 'Blocker', 'Introducer'];

/**
 * Convert DB role to display label
 */
function getRoleLabel(dbRole) {
  const roleMap = {
    'decision': 'Decision Maker',
    'champion': 'Champion',
    'stakeholder': 'Stakeholder',
    'blocker': 'Blocker',
    'introducer': 'Introducer'
  };
  return roleMap[dbRole] || dbRole || 'Unknown';
}

/**
 * Audit database state
 */
async function auditDatabaseState() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 AUDIT 1: DATABASE STATE');
  console.log('='.repeat(80));
  
  const company = await prisma.companies.findUnique({
    where: { id: COMPANY_ID },
    select: { id: true, name: true, workspaceId: true }
  });
  
  if (!company) {
    console.error(`❌ Company not found: ${COMPANY_ID}`);
    return { passed: false, issues: ['Company not found'] };
  }
  
  console.log(`✅ Company found: ${company.name}`);
  console.log(`   Workspace: ${company.workspaceId}\n`);
  
  // Get all people for this company
  const people = await prisma.people.findMany({
    where: {
      companyId: COMPANY_ID,
      workspaceId: company.workspaceId,
      deletedAt: null
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      jobTitle: true,
      buyerGroupRole: true,
      isBuyerGroupMember: true,
      influenceLevel: true
    },
    orderBy: { fullName: 'asc' }
  });
  
  console.log(`Found ${people.length} people for this company\n`);
  
  const issues = [];
  const stats = {
    total: people.length,
    bgMembers: 0,
    withRoles: 0,
    validRoles: 0,
    invalidRoles: 0,
    missingRoles: 0,
    roleDistribution: {}
  };
  
  people.forEach((person, index) => {
    const num = index + 1;
    const hasRole = !!person.buyerGroupRole;
    const isValidRole = hasRole && VALID_DB_ROLES.includes(person.buyerGroupRole);
    const isBGMember = person.isBuyerGroupMember === true;
    
    console.log(`${num}. ${person.fullName}`);
    console.log(`   Job Title: ${person.jobTitle || 'N/A'}`);
    console.log(`   Email: ${person.email || 'N/A'}`);
    console.log(`   buyerGroupRole: ${person.buyerGroupRole || 'null'} ${hasRole ? (isValidRole ? '✅' : '❌ INVALID') : '⚠️ MISSING'}`);
    console.log(`   isBuyerGroupMember: ${isBGMember} ${isBGMember ? '✅' : '❌'}`);
    console.log(`   influenceLevel: ${person.influenceLevel || 'null'}`);
    
    // Count stats
    if (isBGMember) stats.bgMembers++;
    if (hasRole) {
      stats.withRoles++;
      if (isValidRole) {
        stats.validRoles++;
        stats.roleDistribution[person.buyerGroupRole] = (stats.roleDistribution[person.buyerGroupRole] || 0) + 1;
      } else {
        stats.invalidRoles++;
        issues.push(`${person.fullName}: Invalid role "${person.buyerGroupRole}"`);
      }
    } else {
      stats.missingRoles++;
      if (isBGMember) {
        issues.push(`${person.fullName}: Marked as BG member but missing buyerGroupRole`);
      }
    }
    
    if (!isBGMember && hasRole) {
      issues.push(`${person.fullName}: Has buyerGroupRole but isBuyerGroupMember is false`);
    }
    
    console.log('');
  });
  
  console.log('\n📈 STATISTICS:');
  console.log(`   Total people: ${stats.total}`);
  console.log(`   Buyer group members: ${stats.bgMembers}`);
  console.log(`   With roles: ${stats.withRoles}`);
  console.log(`   Valid roles: ${stats.validRoles}`);
  console.log(`   Invalid roles: ${stats.invalidRoles}`);
  console.log(`   Missing roles: ${stats.missingRoles}`);
  console.log('\n📊 ROLE DISTRIBUTION:');
  Object.entries(stats.roleDistribution).forEach(([role, count]) => {
    console.log(`   ${getRoleLabel(role)}: ${count}`);
  });
  
  const passed = issues.length === 0 && stats.bgMembers === stats.total && stats.validRoles === stats.total;
  
  if (issues.length > 0) {
    console.log('\n⚠️  ISSUES FOUND:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  } else {
    console.log('\n✅ No issues found in database state');
  }
  
  return { passed, issues, stats };
}

/**
 * Audit API response (simulate what the API returns)
 */
async function auditAPIResponse() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 AUDIT 2: API RESPONSE (Simulated)');
  console.log('='.repeat(80));
  
  const company = await prisma.companies.findUnique({
    where: { id: COMPANY_ID },
    select: { id: true, name: true, workspaceId: true }
  });
  
  if (!company) {
    return { passed: false, issues: ['Company not found'] };
  }
  
  // Simulate the API query
  const people = await prisma.people.findMany({
    where: {
      companyId: COMPANY_ID,
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
      firstName: true,
      lastName: true,
      jobTitle: true,
      email: true,
      phone: true,
      linkedinUrl: true,
      buyerGroupRole: true,
      customFields: true,
      status: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: { fullName: 'asc' }
  });
  
  console.log(`API would return ${people.length} buyer group members\n`);
  
  const issues = [];
  const apiResults = [];
  
  // Simulate API transformation
  people.forEach((person) => {
    const storedRole = person.buyerGroupRole;
    const displayRole = getRoleLabel(storedRole);
    
    // Simulate getInfluenceLevel
    let influence = 'medium';
    if (storedRole === 'decision' || storedRole === 'champion') {
      influence = 'high';
    } else if (storedRole === 'introducer') {
      influence = 'low';
    }
    
    const apiMember = {
      id: person.id,
      name: person.fullName || `${person.firstName} ${person.lastName}`,
      title: person.jobTitle || '',
      email: person.email || '',
      phone: person.phone || '',
      linkedinUrl: person.linkedinUrl || '',
      role: displayRole, // Should be display label format
      influence: influence,
      status: person.status || null
    };
    
    apiResults.push(apiMember);
    
    // Validate API response
    if (!VALID_DISPLAY_ROLES.includes(displayRole) && displayRole !== 'Unknown') {
      issues.push(`${person.fullName}: API would return invalid role "${displayRole}"`);
    }
    
    if (!storedRole) {
      issues.push(`${person.fullName}: API would return role "Unknown" (no stored role)`);
    }
    
    console.log(`${person.fullName}:`);
    console.log(`   DB Role: ${storedRole || 'null'} → API Role: ${displayRole}`);
    console.log(`   Influence: ${influence}`);
    console.log('');
  });
  
  // Check if all are stakeholders
  const allStakeholders = apiResults.every(m => m.role === 'Stakeholder');
  if (allStakeholders) {
    issues.push('CRITICAL: All members would show as "Stakeholder" in API response');
  }
  
  const passed = issues.length === 0 && !allStakeholders;
  
  if (issues.length > 0) {
    console.log('⚠️  ISSUES FOUND:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  } else {
    console.log('✅ API response format is correct');
  }
  
  return { passed, issues, apiResults };
}

/**
 * Audit role format consistency
 */
async function auditRoleFormatConsistency() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 AUDIT 3: ROLE FORMAT CONSISTENCY');
  console.log('='.repeat(80));
  
  const company = await prisma.companies.findUnique({
    where: { id: COMPANY_ID },
    select: { workspaceId: true }
  });
  
  if (!company) {
    return { passed: false, issues: ['Company not found'] };
  }
  
  // Check for mixed formats in database
  const people = await prisma.people.findMany({
    where: {
      companyId: COMPANY_ID,
      workspaceId: company.workspaceId,
      deletedAt: null,
      buyerGroupRole: { not: null }
    },
    select: {
      id: true,
      fullName: true,
      buyerGroupRole: true
    }
  });
  
  const issues = [];
  const formatCheck = {
    lowercase: 0,
    capitalized: 0,
    mixed: 0,
    invalid: 0
  };
  
  people.forEach(person => {
    const role = person.buyerGroupRole;
    
    if (!role) return;
    
    // Check format
    if (VALID_DB_ROLES.includes(role)) {
      formatCheck.lowercase++;
    } else if (VALID_DISPLAY_ROLES.includes(role)) {
      formatCheck.capitalized++;
      issues.push(`${person.fullName}: Has capitalized role "${role}" (should be lowercase in DB)`);
    } else {
      formatCheck.invalid++;
      issues.push(`${person.fullName}: Has invalid role format "${role}"`);
    }
  });
  
  console.log('📊 FORMAT DISTRIBUTION:');
  console.log(`   Lowercase (correct): ${formatCheck.lowercase}`);
  console.log(`   Capitalized (incorrect): ${formatCheck.capitalized}`);
  console.log(`   Invalid: ${formatCheck.invalid}`);
  
  const passed = formatCheck.capitalized === 0 && formatCheck.invalid === 0;
  
  if (issues.length > 0) {
    console.log('\n⚠️  ISSUES FOUND:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  } else {
    console.log('\n✅ All roles are in correct format (lowercase)');
  }
  
  return { passed, issues, formatCheck };
}

/**
 * Audit original issue: All showing as stakeholders
 */
async function auditOriginalIssue() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 AUDIT 4: ORIGINAL ISSUE CHECK');
  console.log('='.repeat(80));
  console.log('Original Issue: "all BG members listed as stakeholders"');
  console.log('');
  
  const company = await prisma.companies.findUnique({
    where: { id: COMPANY_ID },
    select: { workspaceId: true }
  });
  
  if (!company) {
    return { passed: false, issues: ['Company not found'] };
  }
  
  const people = await prisma.people.findMany({
    where: {
      companyId: COMPANY_ID,
      workspaceId: company.workspaceId,
      deletedAt: null,
      isBuyerGroupMember: true
    },
    select: {
      id: true,
      fullName: true,
      buyerGroupRole: true,
      jobTitle: true
    },
    orderBy: { fullName: 'asc' }
  });
  
  const stakeholderCount = people.filter(p => p.buyerGroupRole === 'stakeholder').length;
  const nonStakeholderCount = people.length - stakeholderCount;
  
  console.log(`Total BG members: ${people.length}`);
  console.log(`Stakeholders: ${stakeholderCount}`);
  console.log(`Non-stakeholders: ${nonStakeholderCount}`);
  console.log('');
  
  if (nonStakeholderCount === 0) {
    console.log('❌ ISSUE STILL EXISTS: All members are stakeholders');
    console.log('   This suggests roles were not properly assigned or inferred');
    return { passed: false, issues: ['All members are stakeholders'] };
  }
  
  console.log('✅ ISSUE RESOLVED: Not all members are stakeholders');
  console.log('\nNon-stakeholder members:');
  people.filter(p => p.buyerGroupRole !== 'stakeholder').forEach(p => {
    console.log(`   - ${p.fullName}: ${getRoleLabel(p.buyerGroupRole)} (${p.jobTitle || 'no title'})`);
  });
  
  return { passed: true, stakeholderCount, nonStakeholderCount };
}

/**
 * Main audit execution
 */
async function main() {
  try {
    console.log('🔍 COMPREHENSIVE AUDIT: Hill Country Telephone Cooperative Buyer Group Fix');
    console.log('='.repeat(80));
    console.log(`Company: ${COMPANY_NAME}`);
    console.log(`Company ID: ${COMPANY_ID}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    const results = {
      databaseState: await auditDatabaseState(),
      apiResponse: await auditAPIResponse(),
      roleFormat: await auditRoleFormatConsistency(),
      originalIssue: await auditOriginalIssue()
    };
    
    // Final summary
    console.log('\n' + '='.repeat(80));
    console.log('📋 FINAL SUMMARY');
    console.log('='.repeat(80));
    
    const allPassed = Object.values(results).every(r => r.passed);
    
    Object.entries(results).forEach(([name, result]) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} - ${name}`);
      if (result.issues && result.issues.length > 0) {
        console.log(`   Issues: ${result.issues.length}`);
      }
    });
    
    console.log('\n' + '='.repeat(80));
    if (allPassed) {
      console.log('✅ ALL AUDITS PASSED - System is working correctly');
    } else {
      console.log('⚠️  SOME AUDITS FAILED - Review issues above');
    }
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ Audit failed with error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

