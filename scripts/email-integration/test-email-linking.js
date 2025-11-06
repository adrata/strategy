#!/usr/bin/env node

/**
 * Email Linking Test Script
 * 
 * Tests email linking to people and companies:
 * - Email to people linking by email match
 * - Email to people linking by workEmail match
 * - Email to people linking by personalEmail match
 * - Company linking via person.companyId
 * - Reverse linking when person is created
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
 * Test 1: Verify email linking to people
 */
async function testEmailToPeopleLinking() {
  logSection('Test 1: Email to People Linking');
  
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
    
    // Get unlinked emails
    const unlinkedEmails = await prisma.email_messages.findMany({
      where: {
        workspaceId: workspace.id,
        personId: null,
        companyId: null
      },
      take: 10,
      select: {
        id: true,
        from: true,
        to: true,
        cc: true,
        subject: true
      }
    });
    
    log(`\nFound ${unlinkedEmails.length} unlinked emails:`, 'yellow');
    
    let matchCount = 0;
    let noMatchCount = 0;
    
    for (const email of unlinkedEmails) {
      // Extract all email addresses
      const emailAddresses = [
        email.from,
        ...email.to,
        ...email.cc
      ].filter(Boolean).map(e => e.toLowerCase().trim());
      
      // Try to find matching person
      const person = await prisma.people.findFirst({
        where: {
          workspaceId: workspace.id,
          OR: [
            { email: { in: emailAddresses } },
            { workEmail: { in: emailAddresses } },
            { personalEmail: { in: emailAddresses } }
          ]
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          workEmail: true,
          personalEmail: true,
          companyId: true
        }
      });
      
      if (person) {
        matchCount++;
        log(`  ✅ ${email.subject || 'No subject'}`, 'green');
        log(`     Matches: ${person.fullName} (${person.email || person.workEmail || person.personalEmail})`, 'blue');
        log(`     Should link to personId: ${person.id}, companyId: ${person.companyId || 'None'}`, 'blue');
      } else {
        noMatchCount++;
        log(`  ⚠️  ${email.subject || 'No subject'}`, 'yellow');
        log(`     From: ${email.from}`, 'blue');
        log(`     No matching person found`, 'blue');
      }
    }
    
    log(`\nLinking Summary:`, 'yellow');
    log(`  Emails with potential matches: ${matchCount}`, matchCount > 0 ? 'green' : 'yellow');
    log(`  Emails without matches: ${noMatchCount}`, 'blue');
    
    if (matchCount > 0) {
      log(`\n  ⚠️  ${matchCount} emails should be linked but aren't`, 'yellow');
      log(`  Run linkEmailsToEntities() to link these emails`, 'yellow');
    }
    
    log('\n✅ Email to people linking test completed', 'green');
  } catch (error) {
    log(`❌ Error testing email to people linking: ${error.message}`, 'red');
    console.error(error);
  }
}

/**
 * Test 2: Verify linked emails have correct relationships
 */
async function testLinkedEmailRelationships() {
  logSection('Test 2: Linked Email Relationships');
  
  try {
    const workspace = await prisma.workspaces.findFirst({
      where: { isActive: true },
      select: { id: true }
    });
    
    if (!workspace) {
      log('❌ No active workspace found', 'red');
      return;
    }
    
    // Get linked emails
    const linkedEmails = await prisma.email_messages.findMany({
      where: {
        workspaceId: workspace.id,
        personId: { not: null }
      },
      take: 10,
      include: {
        person: {
          select: {
            id: true,
            fullName: true,
            email: true,
            workEmail: true,
            personalEmail: true,
            companyId: true,
            status: true
          }
        },
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    log(`Found ${linkedEmails.length} linked emails:`, 'blue');
    
    let correctLinks = 0;
    let incorrectLinks = 0;
    let missingCompany = 0;
    
    for (const email of linkedEmails) {
      const emailAddresses = [
        email.from,
        ...email.to,
        ...email.cc
      ].filter(Boolean).map(e => e.toLowerCase().trim());
      
      const personEmails = [
        email.person?.email,
        email.person?.workEmail,
        email.person?.personalEmail
      ].filter(Boolean).map(e => e.toLowerCase().trim());
      
      const hasMatch = emailAddresses.some(addr => personEmails.includes(addr));
      
      if (hasMatch) {
        correctLinks++;
        log(`  ✅ ${email.subject || 'No subject'}`, 'green');
        log(`     Linked to: ${email.person?.fullName} (${email.person?.status})`, 'blue');
        if (email.company) {
          log(`     Company: ${email.company.name}`, 'blue');
        } else if (email.person?.companyId) {
          missingCompany++;
          log(`     ⚠️  Person has companyId but email not linked to company`, 'yellow');
        }
      } else {
        incorrectLinks++;
        log(`  ❌ ${email.subject || 'No subject'}`, 'red');
        log(`     Linked to: ${email.person?.fullName}`, 'blue');
        log(`     But email addresses don't match!`, 'red');
        log(`     Email from: ${email.from}`, 'blue');
        log(`     Person emails: ${personEmails.join(', ')}`, 'blue');
      }
    }
    
    log(`\nRelationship Summary:`, 'yellow');
    log(`  Correctly linked: ${correctLinks}`, correctLinks > 0 ? 'green' : 'yellow');
    log(`  Incorrectly linked: ${incorrectLinks}`, incorrectLinks > 0 ? 'red' : 'green');
    log(`  Missing company link: ${missingCompany}`, missingCompany > 0 ? 'yellow' : 'green');
    
    log('\n✅ Linked email relationships test completed', 'green');
  } catch (error) {
    log(`❌ Error testing linked email relationships: ${error.message}`, 'red');
    console.error(error);
  }
}

/**
 * Test 3: Verify company linking via person
 */
async function testCompanyLinking() {
  logSection('Test 3: Company Linking via Person');
  
  try {
    const workspace = await prisma.workspaces.findFirst({
      where: { isActive: true },
      select: { id: true }
    });
    
    if (!workspace) {
      log('❌ No active workspace found', 'red');
      return;
    }
    
    // Get emails linked to people with companies
    const emailsWithPeople = await prisma.email_messages.findMany({
      where: {
        workspaceId: workspace.id,
        personId: { not: null }
      },
      include: {
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
    
    log(`Checking ${emailsWithPeople.length} emails linked to people:`, 'blue');
    
    let withCompany = 0;
    let withoutCompany = 0;
    let personHasCompanyButEmailDoesnt = 0;
    
    for (const email of emailsWithPeople) {
      if (email.companyId) {
        withCompany++;
      } else {
        withoutCompany++;
        if (email.person?.companyId) {
          personHasCompanyButEmailDoesnt++;
          log(`  ⚠️  Email ${email.id} linked to person with companyId but email.companyId is null`, 'yellow');
          log(`     Person: ${email.person.fullName}, CompanyId: ${email.person.companyId}`, 'blue');
        }
      }
    }
    
    log(`\nCompany Linking Summary:`, 'yellow');
    log(`  Emails with companyId: ${withCompany}`, 'green');
    log(`  Emails without companyId: ${withoutCompany}`, 'blue');
    log(`  Person has company but email doesn't: ${personHasCompanyButEmailDoesnt}`, 
        personHasCompanyButEmailDoesnt > 0 ? 'yellow' : 'green');
    
    if (personHasCompanyButEmailDoesnt > 0) {
      log(`\n  ⚠️  ${personHasCompanyButEmailDoesnt} emails should have companyId set`, 'yellow');
      log(`  The linkEmailsToEntities() function should set companyId from person.companyId`, 'yellow');
    }
    
    log('\n✅ Company linking test completed', 'green');
  } catch (error) {
    log(`❌ Error testing company linking: ${error.message}`, 'red');
    console.error(error);
  }
}

/**
 * Test 4: Test reverse linking scenario
 */
async function testReverseLinking() {
  logSection('Test 4: Reverse Linking (Person Created After Email)');
  
  try {
    const workspace = await prisma.workspaces.findFirst({
      where: { isActive: true },
      select: { id: true }
    });
    
    if (!workspace) {
      log('❌ No active workspace found', 'red');
      return;
    }
    
    // Find people created recently
    const recentPeople = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        workEmail: true,
        personalEmail: true,
        createdAt: true
      },
      take: 5
    });
    
    log(`Found ${recentPeople.length} people created in last 7 days:`, 'blue');
    
    for (const person of recentPeople) {
      const personEmails = [
        person.email,
        person.workEmail,
        person.personalEmail
      ].filter(Boolean).map(e => e.toLowerCase().trim());
      
      if (personEmails.length === 0) {
        log(`  ⚠️  ${person.fullName} has no email addresses`, 'yellow');
        continue;
      }
      
      // Check if there are emails that should be linked
      const matchingEmails = await prisma.email_messages.findMany({
        where: {
          workspaceId: workspace.id,
          personId: null,
          OR: [
            { from: { in: personEmails } },
            { to: { hasSome: personEmails } },
            { cc: { hasSome: personEmails } }
          ]
        },
        select: {
          id: true,
          subject: true,
          from: true,
          receivedAt: true
        },
        take: 5
      });
      
      if (matchingEmails.length > 0) {
        log(`  ✅ ${person.fullName} (${personEmails.join(', ')})`, 'green');
        log(`     Has ${matchingEmails.length} unlinked emails that should be linked`, 'blue');
        log(`     Reverse linking should connect these emails`, 'blue');
      } else {
        log(`  ℹ️  ${person.fullName} (${personEmails.join(', ')})`, 'blue');
        log(`     No unlinked emails found for this person`, 'blue');
      }
    }
    
    log('\n✅ Reverse linking test completed', 'green');
  } catch (error) {
    log(`❌ Error testing reverse linking: ${error.message}`, 'red');
    console.error(error);
  }
}

/**
 * Test 5: Verify email matching logic
 */
async function testEmailMatchingLogic() {
  logSection('Test 5: Email Matching Logic');
  
  try {
    const workspace = await prisma.workspaces.findFirst({
      where: { isActive: true },
      select: { id: true }
    });
    
    if (!workspace) {
      log('❌ No active workspace found', 'red');
      return;
    }
    
    // Get sample people with emails
    const people = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        OR: [
          { email: { not: null } },
          { workEmail: { not: null } },
          { personalEmail: { not: null } }
        ]
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        workEmail: true,
        personalEmail: true
      },
      take: 10
    });
    
    log(`Testing email matching with ${people.length} people:`, 'blue');
    
    let matchTests = 0;
    let matchSuccess = 0;
    
    for (const person of people) {
      const personEmails = [
        person.email,
        person.workEmail,
        person.personalEmail
      ].filter(Boolean).map(e => e.toLowerCase().trim());
      
      if (personEmails.length === 0) continue;
      
      // Test each email address
      for (const personEmail of personEmails) {
        matchTests++;
        
        // Find emails with this address
        const matchingEmails = await prisma.email_messages.findMany({
          where: {
            workspaceId: workspace.id,
            OR: [
              { from: personEmail },
              { to: { has: personEmail } },
              { cc: { has: personEmail } }
            ]
          },
          select: {
            id: true,
            personId: true
          },
          take: 1
          });
        
        if (matchingEmails.length > 0) {
          const email = matchingEmails[0];
          if (email.personId === person.id) {
            matchSuccess++;
            log(`  ✅ ${personEmail} → ${person.fullName} (correctly linked)`, 'green');
          } else if (email.personId) {
            log(`  ⚠️  ${personEmail} → Linked to different person`, 'yellow');
          } else {
            log(`  ⚠️  ${personEmail} → ${person.fullName} (not linked)`, 'yellow');
          }
        }
      }
    }
    
    log(`\nMatching Summary:`, 'yellow');
    log(`  Total match tests: ${matchTests}`, 'blue');
    log(`  Successfully linked: ${matchSuccess}`, matchSuccess > 0 ? 'green' : 'yellow');
    
    log('\n✅ Email matching logic test completed', 'green');
  } catch (error) {
    log(`❌ Error testing email matching logic: ${error.message}`, 'red');
    console.error(error);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  log('\n' + '='.repeat(60), 'cyan');
  log('EMAIL LINKING AUDIT TEST', 'cyan');
  log('='.repeat(60), 'cyan');
  
  try {
    await testEmailToPeopleLinking();
    await testLinkedEmailRelationships();
    await testCompanyLinking();
    await testReverseLinking();
    await testEmailMatchingLogic();
    
    logSection('Test Summary');
    log('Email linking tests completed. Review results above.', 'blue');
    log('\nRecommendations:', 'yellow');
    log('1. Run linkEmailsToEntities() to link unlinked emails', 'yellow');
    log('2. Verify companyId is set when person has companyId', 'yellow');
    log('3. Check for incorrectly linked emails', 'yellow');
    
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

