#!/usr/bin/env node

/**
 * Email Linking Verification Test Script
 * 
 * Comprehensive test to verify email linking to people and companies works correctly:
 * - Test 1: Verify email linking after sync
 * - Test 2: Verify action creation
 * - Test 3: Test reverse linking
 * - Test 4: Verify data integrity
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
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'cyan');
  console.log('='.repeat(70));
}

function logSubsection(title) {
  console.log('\n' + '-'.repeat(70));
  log(title, 'magenta');
  console.log('-'.repeat(70));
}

/**
 * Test 1: Verify Email Linking After Sync
 * Goal: Confirm that newly synced emails are automatically linked to people
 */
async function testEmailLinkingAfterSync() {
  logSection('Test 1: Verify Email Linking After Sync');
  
  try {
    // Get workspace (use first active workspace or allow workspace ID as env var)
    const workspaceId = process.env.WORKSPACE_ID;
    let workspace;
    
    if (workspaceId) {
      workspace = await prisma.workspaces.findUnique({
        where: { id: workspaceId },
        select: { id: true, name: true }
      });
    } else {
      workspace = await prisma.workspaces.findFirst({
        where: { isActive: true },
        select: { id: true, name: true }
      });
    }
    
    if (!workspace) {
      log('❌ No workspace found. Set WORKSPACE_ID env var or ensure active workspace exists', 'red');
      return { success: false };
    }
    
    log(`Testing with workspace: ${workspace.name} (${workspace.id})`, 'blue');
    
    // Get recent emails (synced in last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentEmails = await prisma.email_messages.findMany({
      where: {
        workspaceId: workspace.id,
        createdAt: { gte: oneHourAgo }
      },
      take: 50,
      select: {
        id: true,
        from: true,
        to: true,
        cc: true,
        subject: true,
        personId: true,
        companyId: true,
        receivedAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    log(`\nFound ${recentEmails.length} emails synced in the last hour`, 'blue');
    
    if (recentEmails.length === 0) {
      log('⚠️  No recent emails found. Try syncing some emails first.', 'yellow');
      return { success: true, skipped: true };
    }
    
    // Analyze linking status
    const linkedEmails = recentEmails.filter(e => e.personId !== null);
    const unlinkedEmails = recentEmails.filter(e => e.personId === null);
    
    log(`\nLinking Status:`, 'yellow');
    log(`  ✅ Linked: ${linkedEmails.length}`, linkedEmails.length > 0 ? 'green' : 'yellow');
    log(`  ⚠️  Unlinked: ${unlinkedEmails.length}`, unlinkedEmails.length > 0 ? 'yellow' : 'green');
    
    // Check if unlinked emails should be linked
    let shouldBeLinked = 0;
    let cannotBeLinked = 0;
    
    logSubsection('Analyzing Unlinked Emails');
    
    for (const email of unlinkedEmails.slice(0, 10)) {
      const emailAddresses = [
        email.from,
        ...(email.to || []),
        ...(email.cc || [])
      ].filter(Boolean).map(e => e.toLowerCase().trim());
      
      if (emailAddresses.length === 0) {
        cannotBeLinked++;
        continue;
      }
      
      const matchingPerson = await prisma.people.findFirst({
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
      
      if (matchingPerson) {
        shouldBeLinked++;
        log(`  ⚠️  Email "${email.subject || 'No subject'}" should be linked to:`, 'yellow');
        log(`     Person: ${matchingPerson.fullName} (${matchingPerson.email || matchingPerson.workEmail || matchingPerson.personalEmail})`, 'blue');
        log(`     CompanyId: ${matchingPerson.companyId || 'None'}`, 'blue');
      } else {
        cannotBeLinked++;
      }
    }
    
    log(`\nAnalysis Results:`, 'yellow');
    log(`  Emails that should be linked: ${shouldBeLinked}`, shouldBeLinked > 0 ? 'yellow' : 'green');
    log(`  Emails without matching people: ${cannotBeLinked}`, 'blue');
    
    // Verify linked emails have correct relationships
    logSubsection('Verifying Linked Email Relationships');
    
    let correctLinks = 0;
    let incorrectLinks = 0;
    let missingCompanyIds = 0;
    
    for (const email of linkedEmails.slice(0, 10)) {
      const person = await prisma.people.findUnique({
        where: { id: email.personId },
        select: {
          id: true,
          fullName: true,
          email: true,
          workEmail: true,
          personalEmail: true,
          companyId: true
        }
      });
      
      if (!person) {
        incorrectLinks++;
        log(`  ❌ Email ${email.id} has invalid personId: ${email.personId}`, 'red');
        continue;
      }
      
      // Check if email addresses match
      const emailAddresses = [
        email.from,
        ...(email.to || []),
        ...(email.cc || [])
      ].filter(Boolean).map(e => e.toLowerCase().trim());
      
      const personEmails = [
        person.email,
        person.workEmail,
        person.personalEmail
      ].filter(Boolean).map(e => e.toLowerCase().trim());
      
      const hasMatch = emailAddresses.some(addr => personEmails.includes(addr));
      
      if (!hasMatch) {
        incorrectLinks++;
        log(`  ⚠️  Email "${email.subject || 'No subject'}" linked to ${person.fullName} but email addresses don't match`, 'yellow');
        log(`     Email addresses: ${emailAddresses.join(', ')}`, 'blue');
        log(`     Person emails: ${personEmails.join(', ')}`, 'blue');
        continue;
      }
      
      // Check companyId
      if (person.companyId && email.companyId !== person.companyId) {
        missingCompanyIds++;
        log(`  ⚠️  Email "${email.subject || 'No subject'}" has companyId ${email.companyId} but person has ${person.companyId}`, 'yellow');
      }
      
      correctLinks++;
    }
    
    log(`\nRelationship Verification:`, 'yellow');
    log(`  ✅ Correct links: ${correctLinks}`, 'green');
    log(`  ❌ Incorrect links: ${incorrectLinks}`, incorrectLinks > 0 ? 'red' : 'green');
    log(`  ⚠️  CompanyId mismatches: ${missingCompanyIds}`, missingCompanyIds > 0 ? 'yellow' : 'green');
    
    const success = shouldBeLinked === 0 && incorrectLinks === 0 && missingCompanyIds === 0;
    
    log(`\n${success ? '✅' : '⚠️'} Test 1 ${success ? 'PASSED' : 'NEEDS ATTENTION'}`, success ? 'green' : 'yellow');
    
    return {
      success,
      stats: {
        total: recentEmails.length,
        linked: linkedEmails.length,
        unlinked: unlinkedEmails.length,
        shouldBeLinked,
        correctLinks,
        incorrectLinks,
        missingCompanyIds
      }
    };
  } catch (error) {
    log(`❌ Error in Test 1: ${error.message}`, 'red');
    console.error(error);
    return { success: false, error: error.message };
  }
}

/**
 * Test 2: Verify Action Creation
 * Goal: Confirm that action records are created for linked emails
 */
async function testActionCreation() {
  logSection('Test 2: Verify Action Creation');
  
  try {
    const workspaceId = process.env.WORKSPACE_ID;
    let workspace;
    
    if (workspaceId) {
      workspace = await prisma.workspaces.findUnique({
        where: { id: workspaceId },
        select: { id: true, name: true }
      });
    } else {
      workspace = await prisma.workspaces.findFirst({
        where: { isActive: true },
        select: { id: true, name: true }
      });
    }
    
    if (!workspace) {
      log('❌ No workspace found', 'red');
      return { success: false };
    }
    
    log(`Testing with workspace: ${workspace.name}`, 'blue');
    
    // Find emails with personId set
    const linkedEmails = await prisma.email_messages.findMany({
      where: {
        workspaceId: workspace.id,
        personId: { not: null }
      },
      take: 100,
      select: {
        id: true,
        subject: true,
        receivedAt: true,
        personId: true,
        companyId: true
      },
      orderBy: { receivedAt: 'desc' }
    });
    
    log(`\nFound ${linkedEmails.length} linked emails`, 'blue');
    
    if (linkedEmails.length === 0) {
      log('⚠️  No linked emails found. Run Test 1 first or sync some emails.', 'yellow');
      return { success: true, skipped: true };
    }
    
    // Check for corresponding actions
    let emailsWithActions = 0;
    let emailsWithoutActions = 0;
    let actionMismatches = 0;
    
    logSubsection('Checking Action Records');
    
    for (const email of linkedEmails.slice(0, 20)) {
      const actions = await prisma.actions.findMany({
        where: {
          workspaceId: workspace.id,
          type: 'EMAIL',
          personId: email.personId,
          subject: email.subject,
          completedAt: email.receivedAt
        },
        select: {
          id: true,
          subject: true,
          completedAt: true,
          personId: true,
          companyId: true,
          status: true
        }
      });
      
      if (actions.length === 0) {
        emailsWithoutActions++;
        log(`  ⚠️  Email "${email.subject || 'No subject'}" has no corresponding action`, 'yellow');
        log(`     PersonId: ${email.personId}, ReceivedAt: ${email.receivedAt}`, 'blue');
      } else if (actions.length > 1) {
        actionMismatches++;
        log(`  ⚠️  Email "${email.subject || 'No subject'}" has ${actions.length} duplicate actions`, 'yellow');
      } else {
        const action = actions[0];
        
        // Verify action fields match email
        const subjectMatch = action.subject === email.subject;
        const dateMatch = action.completedAt?.getTime() === email.receivedAt?.getTime();
        const personMatch = action.personId === email.personId;
        const companyMatch = action.companyId === email.companyId;
        const statusMatch = action.status === 'COMPLETED';
        
        if (!subjectMatch || !dateMatch || !personMatch || !companyMatch || !statusMatch) {
          actionMismatches++;
          log(`  ⚠️  Action for email "${email.subject || 'No subject'}" has mismatched fields:`, 'yellow');
          if (!subjectMatch) log(`     Subject mismatch: ${action.subject} vs ${email.subject}`, 'blue');
          if (!dateMatch) log(`     Date mismatch: ${action.completedAt} vs ${email.receivedAt}`, 'blue');
          if (!personMatch) log(`     PersonId mismatch: ${action.personId} vs ${email.personId}`, 'blue');
          if (!companyMatch) log(`     CompanyId mismatch: ${action.companyId} vs ${email.companyId}`, 'blue');
          if (!statusMatch) log(`     Status mismatch: ${action.status} vs COMPLETED`, 'blue');
        } else {
          emailsWithActions++;
        }
      }
    }
    
    log(`\nAction Creation Results:`, 'yellow');
    log(`  ✅ Emails with correct actions: ${emailsWithActions}`, 'green');
    log(`  ⚠️  Emails without actions: ${emailsWithoutActions}`, emailsWithoutActions > 0 ? 'yellow' : 'green');
    log(`  ⚠️  Action mismatches/duplicates: ${actionMismatches}`, actionMismatches > 0 ? 'yellow' : 'green');
    
    const success = emailsWithoutActions === 0 && actionMismatches === 0;
    
    log(`\n${success ? '✅' : '⚠️'} Test 2 ${success ? 'PASSED' : 'NEEDS ATTENTION'}`, success ? 'green' : 'yellow');
    
    return {
      success,
      stats: {
        total: linkedEmails.length,
        withActions: emailsWithActions,
        withoutActions: emailsWithoutActions,
        mismatches: actionMismatches
      }
    };
  } catch (error) {
    log(`❌ Error in Test 2: ${error.message}`, 'red');
    console.error(error);
    return { success: false, error: error.message };
  }
}

/**
 * Test 3: Test Reverse Linking
 * Goal: Verify that creating a person links existing unlinked emails
 */
async function testReverseLinking() {
  logSection('Test 3: Test Reverse Linking');
  
  try {
    const workspaceId = process.env.WORKSPACE_ID;
    let workspace;
    
    if (workspaceId) {
      workspace = await prisma.workspaces.findUnique({
        where: { id: workspaceId },
        select: { id: true, name: true }
      });
    } else {
      workspace = await prisma.workspaces.findFirst({
        where: { isActive: true },
        select: { id: true, name: true }
      });
    }
    
    if (!workspace) {
      log('❌ No workspace found', 'red');
      return { success: false };
    }
    
    log(`Testing with workspace: ${workspace.name}`, 'blue');
    
    // Find people with email addresses
    const peopleWithEmails = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        OR: [
          { email: { not: null } },
          { workEmail: { not: null } },
          { personalEmail: { not: null } }
        ]
      },
      take: 10,
      select: {
        id: true,
        fullName: true,
        email: true,
        workEmail: true,
        personalEmail: true,
        companyId: true
      }
    });
    
    log(`\nFound ${peopleWithEmails.length} people with email addresses`, 'blue');
    
    if (peopleWithEmails.length === 0) {
      log('⚠️  No people with email addresses found.', 'yellow');
      return { success: true, skipped: true };
    }
    
    let totalUnlinkedEmails = 0;
    let peopleWithUnlinkedEmails = 0;
    
    logSubsection('Checking for Unlinked Emails');
    
    for (const person of peopleWithEmails.slice(0, 5)) {
      const personEmails = [
        person.email,
        person.workEmail,
        person.personalEmail
      ].filter(Boolean).map(e => e.toLowerCase().trim());
      
      if (personEmails.length === 0) continue;
      
      // Find unlinked emails matching this person's email addresses
      const unlinkedEmails = await prisma.email_messages.findMany({
        where: {
          workspaceId: workspace.id,
          personId: null,
          OR: [
            { from: { in: personEmails } },
            { to: { hasSome: personEmails } },
            { cc: { hasSome: personEmails } }
          ]
        },
        take: 10,
        select: {
          id: true,
          subject: true,
          from: true,
          to: true
        }
      });
      
      if (unlinkedEmails.length > 0) {
        peopleWithUnlinkedEmails++;
        totalUnlinkedEmails += unlinkedEmails.length;
        log(`  ⚠️  ${person.fullName} has ${unlinkedEmails.length} unlinked emails:`, 'yellow');
        log(`     Person emails: ${personEmails.join(', ')}`, 'blue');
        unlinkedEmails.slice(0, 3).forEach(email => {
          log(`     - "${email.subject || 'No subject'}" from ${email.from}`, 'blue');
        });
      }
    }
    
    log(`\nReverse Linking Analysis:`, 'yellow');
    log(`  People with unlinked emails: ${peopleWithUnlinkedEmails}`, peopleWithUnlinkedEmails > 0 ? 'yellow' : 'green');
    log(`  Total unlinked emails found: ${totalUnlinkedEmails}`, 'blue');
    
    if (totalUnlinkedEmails > 0) {
      log(`\n  💡 These emails should be linked via reverse linking when person is created`, 'blue');
      log(`  💡 Or run linkExistingEmailsToPerson() manually to link them`, 'blue');
    }
    
    const success = totalUnlinkedEmails === 0;
    
    log(`\n${success ? '✅' : '⚠️'} Test 3 ${success ? 'PASSED' : 'NEEDS ATTENTION'}`, success ? 'green' : 'yellow');
    
    return {
      success,
      stats: {
        peopleChecked: peopleWithEmails.length,
        peopleWithUnlinkedEmails,
        totalUnlinkedEmails
      }
    };
  } catch (error) {
    log(`❌ Error in Test 3: ${error.message}`, 'red');
    console.error(error);
    return { success: false, error: error.message };
  }
}

/**
 * Test 4: Verify Data Integrity
 * Goal: Ensure no orphaned or invalid links exist
 */
async function testDataIntegrity() {
  logSection('Test 4: Verify Data Integrity');
  
  try {
    const workspaceId = process.env.WORKSPACE_ID;
    let workspace;
    
    if (workspaceId) {
      workspace = await prisma.workspaces.findUnique({
        where: { id: workspaceId },
        select: { id: true, name: true }
      });
    } else {
      workspace = await prisma.workspaces.findFirst({
        where: { isActive: true },
        select: { id: true, name: true }
      });
    }
    
    if (!workspace) {
      log('❌ No workspace found', 'red');
      return { success: false };
    }
    
    log(`Testing with workspace: ${workspace.name}`, 'blue');
    
    // Check for orphaned personIds
    logSubsection('Checking for Orphaned PersonIds');
    
    const emailsWithPersonIds = await prisma.email_messages.findMany({
      where: {
        workspaceId: workspace.id,
        personId: { not: null }
      },
      select: {
        id: true,
        personId: true,
        subject: true
      },
      take: 1000
    });
    
    const personIds = [...new Set(emailsWithPersonIds.map(e => e.personId))];
    const existingPeople = await prisma.people.findMany({
      where: {
        id: { in: personIds },
        workspaceId: workspace.id
      },
      select: { id: true }
    });
    
    const existingPersonIds = new Set(existingPeople.map(p => p.id));
    const orphanedPersonIds = personIds.filter(id => !existingPersonIds.has(id));
    
    log(`  Total emails with personId: ${emailsWithPersonIds.length}`, 'blue');
    log(`  Unique personIds: ${personIds.length}`, 'blue');
    log(`  ${orphanedPersonIds.length > 0 ? '❌' : '✅'} Orphaned personIds: ${orphanedPersonIds.length}`, orphanedPersonIds.length > 0 ? 'red' : 'green');
    
    if (orphanedPersonIds.length > 0) {
      orphanedPersonIds.slice(0, 5).forEach(personId => {
        const emails = emailsWithPersonIds.filter(e => e.personId === personId);
        log(`     PersonId ${personId} referenced by ${emails.length} emails but person doesn't exist`, 'red');
      });
    }
    
    // Check for orphaned companyIds
    logSubsection('Checking for Orphaned CompanyIds');
    
    const emailsWithCompanyIds = await prisma.email_messages.findMany({
      where: {
        workspaceId: workspace.id,
        companyId: { not: null }
      },
      select: {
        id: true,
        companyId: true,
        subject: true
      },
      take: 1000
    });
    
    const companyIds = [...new Set(emailsWithCompanyIds.map(e => e.companyId))];
    const existingCompanies = await prisma.companies.findMany({
      where: {
        id: { in: companyIds },
        workspaceId: workspace.id
      },
      select: { id: true }
    });
    
    const existingCompanyIds = new Set(existingCompanies.map(c => c.id));
    const orphanedCompanyIds = companyIds.filter(id => !existingCompanyIds.has(id));
    
    log(`  Total emails with companyId: ${emailsWithCompanyIds.length}`, 'blue');
    log(`  Unique companyIds: ${companyIds.length}`, 'blue');
    log(`  ${orphanedCompanyIds.length > 0 ? '❌' : '✅'} Orphaned companyIds: ${orphanedCompanyIds.length}`, orphanedCompanyIds.length > 0 ? 'red' : 'green');
    
    if (orphanedCompanyIds.length > 0) {
      orphanedCompanyIds.slice(0, 5).forEach(companyId => {
        const emails = emailsWithCompanyIds.filter(e => e.companyId === companyId);
        log(`     CompanyId ${companyId} referenced by ${emails.length} emails but company doesn't exist`, 'red');
      });
    }
    
    // Check for companyId mismatches
    logSubsection('Checking for CompanyId Mismatches');
    
    let companyMismatches = 0;
    const emailsWithPeople = await prisma.email_messages.findMany({
      where: {
        workspaceId: workspace.id,
        personId: { not: null },
        companyId: { not: null }
      },
      take: 100,
      select: {
        id: true,
        personId: true,
        companyId: true,
        subject: true
      }
    });
    
    for (const email of emailsWithPeople) {
      const person = await prisma.people.findUnique({
        where: { id: email.personId },
        select: { companyId: true }
      });
      
      if (person && person.companyId !== email.companyId) {
        companyMismatches++;
        if (companyMismatches <= 5) {
          log(`  ⚠️  Email "${email.subject || 'No subject'}" has companyId ${email.companyId} but person has ${person.companyId}`, 'yellow');
        }
      }
    }
    
    log(`  ${companyMismatches > 0 ? '⚠️' : '✅'} CompanyId mismatches: ${companyMismatches}`, companyMismatches > 0 ? 'yellow' : 'green');
    
    // Check for duplicate actions
    logSubsection('Checking for Duplicate Actions');
    
    const emailActions = await prisma.actions.findMany({
      where: {
        workspaceId: workspace.id,
        type: 'EMAIL'
      },
      select: {
        id: true,
        personId: true,
        subject: true,
        completedAt: true
      },
      take: 1000
    });
    
    const actionKeys = new Map();
    let duplicates = 0;
    
    for (const action of emailActions) {
      const key = `${action.personId}|${action.subject}|${action.completedAt?.getTime()}`;
      if (actionKeys.has(key)) {
        duplicates++;
        if (duplicates <= 5) {
          log(`  ⚠️  Duplicate action found: PersonId ${action.personId}, Subject "${action.subject}"`, 'yellow');
        }
      } else {
        actionKeys.set(key, action.id);
      }
    }
    
    log(`  ${duplicates > 0 ? '⚠️' : '✅'} Duplicate actions: ${duplicates}`, duplicates > 0 ? 'yellow' : 'green');
    
    const success = orphanedPersonIds.length === 0 && orphanedCompanyIds.length === 0 && companyMismatches === 0 && duplicates === 0;
    
    log(`\n${success ? '✅' : '⚠️'} Test 4 ${success ? 'PASSED' : 'NEEDS ATTENTION'}`, success ? 'green' : 'yellow');
    
    return {
      success,
      stats: {
        orphanedPersonIds: orphanedPersonIds.length,
        orphanedCompanyIds: orphanedCompanyIds.length,
        companyMismatches,
        duplicateActions: duplicates
      }
    };
  } catch (error) {
    log(`❌ Error in Test 4: ${error.message}`, 'red');
    console.error(error);
    return { success: false, error: error.message };
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('\n');
  log('='.repeat(70), 'cyan');
  log('EMAIL LINKING VERIFICATION TEST SUITE', 'cyan');
  log('='.repeat(70), 'cyan');
  console.log('\n');
  
  const results = {
    test1: null,
    test2: null,
    test3: null,
    test4: null
  };
  
  try {
    // Run all tests
    results.test1 = await testEmailLinkingAfterSync();
    results.test2 = await testActionCreation();
    results.test3 = await testReverseLinking();
    results.test4 = await testDataIntegrity();
    
    // Summary
    logSection('Test Summary');
    
    const allPassed = Object.values(results).every(r => r && (r.success || r.skipped));
    const anyFailed = Object.values(results).some(r => r && !r.success && !r.skipped);
    
    log(`Test 1 (Email Linking): ${results.test1?.skipped ? 'SKIPPED' : results.test1?.success ? 'PASSED' : 'FAILED'}`, 
        results.test1?.skipped ? 'blue' : results.test1?.success ? 'green' : 'red');
    log(`Test 2 (Action Creation): ${results.test2?.skipped ? 'SKIPPED' : results.test2?.success ? 'PASSED' : 'FAILED'}`, 
        results.test2?.skipped ? 'blue' : results.test2?.success ? 'green' : 'red');
    log(`Test 3 (Reverse Linking): ${results.test3?.skipped ? 'SKIPPED' : results.test3?.success ? 'PASSED' : 'FAILED'}`, 
        results.test3?.skipped ? 'blue' : results.test3?.success ? 'green' : 'red');
    log(`Test 4 (Data Integrity): ${results.test4?.skipped ? 'SKIPPED' : results.test4?.success ? 'PASSED' : 'FAILED'}`, 
        results.test4?.skipped ? 'blue' : results.test4?.success ? 'green' : 'red');
    
    console.log('\n');
    
    if (allPassed && !anyFailed) {
      log('✅ ALL TESTS PASSED', 'green');
    } else if (anyFailed) {
      log('❌ SOME TESTS FAILED - Review output above', 'red');
    } else {
      log('⚠️  SOME TESTS SKIPPED - Check prerequisites', 'yellow');
    }
    
    console.log('\n');
    
  } catch (error) {
    log(`❌ Fatal error running tests: ${error.message}`, 'red');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testEmailLinkingAfterSync,
  testActionCreation,
  testReverseLinking,
  testDataIntegrity,
  runAllTests
};

