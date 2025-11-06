#!/usr/bin/env node

/**
 * Email Entity Relationships Test Script
 * 
 * Verifies emails are properly connected to:
 * - People (with status LEAD/PROSPECT/OPPORTUNITY)
 * - Companies
 * - Cascading relationships work correctly
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

/**
 * Test 1: Verify emails connected to people with status
 */
async function testEmailToPeopleStatus() {
  logSection('Test 1: Emails Connected to People by Status');
  
  try {
    const workspace = await prisma.workspaces.findFirst({
      where: { isActive: true },
      select: { id: true, name: true }
    });
    
    if (!workspace) {
      log('❌ No active workspace found', 'red');
      return;
    }
    
    log(`Testing with workspace: ${workspace.name}`, 'blue');
    
    // Get emails linked to people, grouped by status
    const emailsByStatus = await prisma.email_messages.findMany({
      where: {
        workspaceId: workspace.id,
        personId: { not: null }
      },
      include: {
        person: {
          select: {
            id: true,
            fullName: true,
            status: true,
            email: true,
            companyId: true
          }
        }
      }
    });
    
    // Group by status
    const statusGroups = {
      LEAD: [],
      PROSPECT: [],
      OPPORTUNITY: [],
      CLIENT: [],
      OTHER: []
    };
    
    emailsByStatus.forEach(email => {
      const status = email.person?.status || 'OTHER';
      if (statusGroups[status]) {
        statusGroups[status].push(email);
      } else {
        statusGroups.OTHER.push(email);
      }
    });
    
    log('\nEmails linked to people by status:', 'yellow');
    Object.entries(statusGroups).forEach(([status, emails]) => {
      if (emails.length > 0) {
        log(`  ${status}: ${emails.length} emails`, 'blue');
        
        // Show sample
        emails.slice(0, 3).forEach(email => {
          log(`    - ${email.subject || 'No subject'} → ${email.person?.fullName}`, 'blue');
        });
      }
    });
    
    // Verify we can access status via email.person.status
    const sampleEmail = emailsByStatus[0];
    if (sampleEmail && sampleEmail.person) {
      log(`\nSample relationship access:`, 'yellow');
      log(`  Email: ${sampleEmail.subject}`, 'blue');
      log(`  Person: ${sampleEmail.person.fullName}`, 'blue');
      log(`  Status: ${sampleEmail.person.status}`, 'green');
      log(`  ✅ Can access person.status via email.person.status`, 'green');
    }
    
    log('\n✅ Email to people status test completed', 'green');
  } catch (error) {
    log(`❌ Error testing email to people status: ${error.message}`, 'red');
    console.error(error);
  }
}

/**
 * Test 2: Verify emails connected to companies
 */
async function testEmailToCompanies() {
  logSection('Test 2: Emails Connected to Companies');
  
  try {
    const workspace = await prisma.workspaces.findFirst({
      where: { isActive: true },
      select: { id: true }
    });
    
    if (!workspace) {
      log('❌ No active workspace found', 'red');
      return;
    }
    
    // Get emails linked to companies
    const emailsWithCompanies = await prisma.email_messages.findMany({
      where: {
        workspaceId: workspace.id,
        companyId: { not: null }
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            domain: true
          }
        },
        person: {
          select: {
            id: true,
            fullName: true,
            companyId: true
          }
        }
      },
      take: 20
    });
    
    log(`Found ${emailsWithCompanies.length} emails linked to companies:`, 'blue');
    
    let correctLinks = 0;
    let incorrectLinks = 0;
    
    emailsWithCompanies.forEach((email, idx) => {
      if (email.person && email.person.companyId === email.companyId) {
        correctLinks++;
        if (idx < 5) {
          log(`  ✅ ${email.subject || 'No subject'}`, 'green');
          log(`     Company: ${email.company?.name}`, 'blue');
          log(`     Person: ${email.person.fullName} (companyId matches)`, 'blue');
        }
      } else if (email.person && email.person.companyId !== email.companyId) {
        incorrectLinks++;
        log(`  ⚠️  ${email.subject || 'No subject'}`, 'yellow');
        log(`     Email companyId: ${email.companyId}`, 'blue');
        log(`     Person companyId: ${email.person.companyId}`, 'blue');
        log(`     Mismatch!`, 'yellow');
      } else {
        correctLinks++; // Email linked directly to company
        if (idx < 5) {
          log(`  ✅ ${email.subject || 'No subject'}`, 'green');
          log(`     Company: ${email.company?.name}`, 'blue');
        }
      }
    });
    
    log(`\nCompany Linking Summary:`, 'yellow');
    log(`  Correctly linked: ${correctLinks}`, 'green');
    log(`  Incorrectly linked: ${incorrectLinks}`, incorrectLinks > 0 ? 'red' : 'green');
    
    log('\n✅ Email to companies test completed', 'green');
  } catch (error) {
    log(`❌ Error testing email to companies: ${error.message}`, 'red');
    console.error(error);
  }
}

/**
 * Test 3: Verify cascading relationships
 */
async function testCascadingRelationships() {
  logSection('Test 3: Cascading Relationships (Email → Person → Company)');
  
  try {
    const workspace = await prisma.workspaces.findFirst({
      where: { isActive: true },
      select: { id: true }
    });
    
    if (!workspace) {
      log('❌ No active workspace found', 'red');
      return;
    }
    
    // Get emails with full relationship chain
    const emailsWithRelations = await prisma.email_messages.findMany({
      where: {
        workspaceId: workspace.id,
        personId: { not: null }
      },
      include: {
        person: {
          select: {
            id: true,
            fullName: true,
            status: true,
            companyId: true,
            company: {
              select: {
                id: true,
                name: true,
                domain: true
              }
            }
          }
        },
        company: {
          select: {
            id: true,
            name: true
          }
        }
      },
      take: 10
    });
    
    log(`Testing cascading relationships with ${emailsWithRelations.length} emails:`, 'blue');
    
    let fullChain = 0;
    let missingCompany = 0;
    let statusBreakdown = {
      LEAD: 0,
      PROSPECT: 0,
      OPPORTUNITY: 0,
      CLIENT: 0,
      OTHER: 0
    };
    
    emailsWithRelations.forEach((email, idx) => {
      const hasFullChain = email.person && email.person.company;
      const status = email.person?.status || 'OTHER';
      
      if (statusBreakdown[status] !== undefined) {
        statusBreakdown[status]++;
      } else {
        statusBreakdown.OTHER++;
      }
      
      if (hasFullChain) {
        fullChain++;
        if (idx < 3) {
          log(`  ✅ ${email.subject || 'No subject'}`, 'green');
          log(`     Person: ${email.person.fullName} (${status})`, 'blue');
          log(`     Company: ${email.person.company.name}`, 'blue');
          log(`     Full chain: Email → Person → Company`, 'green');
        }
      } else if (email.person && email.person.companyId) {
        missingCompany++;
        log(`  ⚠️  ${email.subject || 'No subject'}`, 'yellow');
        log(`     Person: ${email.person.fullName} has companyId but company not loaded`, 'yellow');
      }
    });
    
    log(`\nCascading Relationship Summary:`, 'yellow');
    log(`  Full chain (Email → Person → Company): ${fullChain}`, 'green');
    log(`  Missing company in chain: ${missingCompany}`, missingCompany > 0 ? 'yellow' : 'green');
    
    log(`\nStatus Distribution:`, 'yellow');
    Object.entries(statusBreakdown).forEach(([status, count]) => {
      if (count > 0) {
        log(`  ${status}: ${count} emails`, 'blue');
      }
    });
    
    // Verify we can access: email.person.status and email.person.company.name
    const sample = emailsWithRelations.find(e => e.person?.company);
    if (sample) {
      log(`\nSample cascading access:`, 'yellow');
      log(`  Email: ${sample.subject}`, 'blue');
      log(`  Person Status: ${sample.person.status}`, 'green');
      log(`  Company Name: ${sample.person.company.name}`, 'green');
      log(`  ✅ Can access email.person.status and email.person.company.name`, 'green');
    }
    
    log('\n✅ Cascading relationships test completed', 'green');
  } catch (error) {
    log(`❌ Error testing cascading relationships: ${error.message}`, 'red');
    console.error(error);
  }
}

/**
 * Test 4: Verify people status distribution
 */
async function testPeopleStatusDistribution() {
  logSection('Test 4: People Status Distribution');
  
  try {
    const workspace = await prisma.workspaces.findFirst({
      where: { isActive: true },
      select: { id: true }
    });
    
    if (!workspace) {
      log('❌ No active workspace found', 'red');
      return;
    }
    
    // Get people with emails, grouped by status
    const peopleWithEmails = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        emails: {
          some: {}
        }
      },
      include: {
        emails: {
          select: {
            id: true
          }
        }
      },
      select: {
        id: true,
        fullName: true,
        status: true,
        email: true
      }
    });
    
    // Group by status
    const statusGroups = {};
    peopleWithEmails.forEach(person => {
      const status = person.status || 'OTHER';
      if (!statusGroups[status]) {
        statusGroups[status] = [];
      }
      statusGroups[status].push(person);
    });
    
    log('People with emails by status:', 'yellow');
    Object.entries(statusGroups).forEach(([status, people]) => {
      log(`  ${status}: ${people.length} people`, 'blue');
      
      // Show sample
      people.slice(0, 3).forEach(person => {
        log(`    - ${person.fullName} (${person.email || 'No email'})`, 'blue');
      });
    }));
    
    // Verify status values
    const validStatuses = ['LEAD', 'PROSPECT', 'OPPORTUNITY', 'CLIENT', 'SUPERFAN', 'ACTIVE', 'INACTIVE'];
    const invalidStatuses = Object.keys(statusGroups).filter(s => !validStatuses.includes(s));
    
    if (invalidStatuses.length > 0) {
      log(`\n⚠️  Found invalid status values: ${invalidStatuses.join(', ')}`, 'yellow');
    } else {
      log(`\n✅ All status values are valid`, 'green');
    }
    
    log('\n✅ People status distribution test completed', 'green');
  } catch (error) {
    log(`❌ Error testing people status distribution: ${error.message}`, 'red');
    console.error(error);
  }
}

/**
 * Test 5: Verify relationship integrity
 */
async function testRelationshipIntegrity() {
  logSection('Test 5: Relationship Integrity');
  
  try {
    const workspace = await prisma.workspaces.findFirst({
      where: { isActive: true },
      select: { id: true }
    });
    
    if (!workspace) {
      log('❌ No active workspace found', 'red');
      return;
    }
    
    // Check for orphaned emails (personId or companyId that doesn't exist)
    const emailsWithInvalidPerson = await prisma.$queryRaw`
      SELECT e.id, e."personId", e."companyId"
      FROM email_messages e
      LEFT JOIN people p ON e."personId" = p.id
      WHERE e."workspaceId" = ${workspace.id}
        AND e."personId" IS NOT NULL
        AND p.id IS NULL
    `;
    
    const emailsWithInvalidCompany = await prisma.$queryRaw`
      SELECT e.id, e."companyId"
      FROM email_messages e
      LEFT JOIN companies c ON e."companyId" = c.id
      WHERE e."workspaceId" = ${workspace.id}
        AND e."companyId" IS NOT NULL
        AND c.id IS NULL
    `;
    
    log('Relationship Integrity Check:', 'yellow');
    
    if (emailsWithInvalidPerson.length > 0) {
      log(`  ❌ Found ${emailsWithInvalidPerson.length} emails with invalid personId`, 'red');
      emailsWithInvalidPerson.slice(0, 5).forEach(email => {
        log(`    - Email ${email.id} has personId ${email.personId} (person doesn't exist)`, 'red');
      });
    } else {
      log(`  ✅ No orphaned person relationships`, 'green');
    }
    
    if (emailsWithInvalidCompany.length > 0) {
      log(`  ❌ Found ${emailsWithInvalidCompany.length} emails with invalid companyId`, 'red');
      emailsWithInvalidCompany.slice(0, 5).forEach(email => {
        log(`    - Email ${email.id} has companyId ${email.companyId} (company doesn't exist)`, 'red');
      });
    } else {
      log(`  ✅ No orphaned company relationships`, 'green');
    }
    
    // Check for people with invalid companyId
    const peopleWithInvalidCompany = await prisma.$queryRaw`
      SELECT p.id, p."fullName", p."companyId"
      FROM people p
      LEFT JOIN companies c ON p."companyId" = c.id
      WHERE p."workspaceId" = ${workspace.id}
        AND p."companyId" IS NOT NULL
        AND c.id IS NULL
    `;
    
    if (peopleWithInvalidCompany.length > 0) {
      log(`  ⚠️  Found ${peopleWithInvalidCompany.length} people with invalid companyId`, 'yellow');
    } else {
      log(`  ✅ No people with invalid companyId`, 'green');
    }
    
    log('\n✅ Relationship integrity test completed', 'green');
  } catch (error) {
    log(`❌ Error testing relationship integrity: ${error.message}`, 'red');
    console.error(error);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  log('\n' + '='.repeat(60), 'cyan');
  log('EMAIL ENTITY RELATIONSHIPS AUDIT TEST', 'cyan');
  log('='.repeat(60), 'cyan');
  
  try {
    await testEmailToPeopleStatus();
    await testEmailToCompanies();
    await testCascadingRelationships();
    await testPeopleStatusDistribution();
    await testRelationshipIntegrity();
    
    logSection('Test Summary');
    log('Entity relationships tests completed. Review results above.', 'blue');
    log('\nKey Findings:', 'yellow');
    log('1. Verify emails can access person.status (LEAD/PROSPECT/OPPORTUNITY)', 'yellow');
    log('2. Verify cascading relationships work (Email → Person → Company)', 'yellow');
    log('3. Check for orphaned relationships', 'yellow');
    
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };

