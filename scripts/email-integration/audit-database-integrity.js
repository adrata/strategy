#!/usr/bin/env node

/**
 * Database Integrity Audit Script
 * 
 * Runs database queries to check for:
 * - Unlinked emails (personId IS NULL AND companyId IS NULL)
 * - Orphaned email records
 * - Data consistency issues
 * - Email linking statistics
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
 * Check 1: Count unlinked emails
 */
async function checkUnlinkedEmails() {
  logSection('Check 1: Unlinked Emails');
  
  try {
    const workspace = await prisma.workspaces.findFirst({
      where: { isActive: true },
      select: { id: true, name: true }
    });
    
    if (!workspace) {
      log('❌ No active workspace found', 'red');
      return { unlinked: 0, total: 0 };
    }
    
    log(`Checking workspace: ${workspace.name}`, 'blue');
    
    // Total emails
    const totalEmails = await prisma.email_messages.count({
      where: { workspaceId: workspace.id }
    });
    
    // Unlinked emails (no personId and no companyId)
    const unlinkedEmails = await prisma.email_messages.count({
      where: {
        workspaceId: workspace.id,
        personId: null,
        companyId: null
      }
    });
    
    // Linked to person only
    const linkedToPersonOnly = await prisma.email_messages.count({
      where: {
        workspaceId: workspace.id,
        personId: { not: null },
        companyId: null
      }
    });
    
    // Linked to company only
    const linkedToCompanyOnly = await prisma.email_messages.count({
      where: {
        workspaceId: workspace.id,
        personId: null,
        companyId: { not: null }
      }
    });
    
    // Linked to both
    const linkedToBoth = await prisma.email_messages.count({
      where: {
        workspaceId: workspace.id,
        personId: { not: null },
        companyId: { not: null }
      }
    });
    
    log(`\nEmail Linking Statistics:`, 'yellow');
    log(`  Total emails: ${totalEmails}`, 'blue');
    log(`  Unlinked (no person, no company): ${unlinkedEmails}`, unlinkedEmails > 0 ? 'yellow' : 'green');
    log(`  Linked to person only: ${linkedToPersonOnly}`, 'blue');
    log(`  Linked to company only: ${linkedToCompanyOnly}`, 'blue');
    log(`  Linked to both: ${linkedToBoth}`, 'green');
    
    const linkRate = totalEmails > 0 
      ? Math.round(((totalEmails - unlinkedEmails) / totalEmails) * 100)
      : 0;
    
    log(`\n  Link Rate: ${linkRate}%`, linkRate >= 80 ? 'green' : linkRate >= 50 ? 'yellow' : 'red');
    
    if (unlinkedEmails > 0) {
      log(`\n  ⚠️  ${unlinkedEmails} emails need to be linked`, 'yellow');
      log(`  Recommendation: Run linkEmailsToEntities() to link these emails`, 'yellow');
    }
    
    return { unlinked: unlinkedEmails, total: totalEmails, linkRate };
  } catch (error) {
    log(`❌ Error checking unlinked emails: ${error.message}`, 'red');
    console.error(error);
    return { unlinked: 0, total: 0, linkRate: 0 };
  }
}

/**
 * Check 2: Orphaned records
 */
async function checkOrphanedRecords() {
  logSection('Check 2: Orphaned Records');
  
  try {
    const workspace = await prisma.workspaces.findFirst({
      where: { isActive: true },
      select: { id: true }
    });
    
    if (!workspace) {
      log('❌ No active workspace found', 'red');
      return;
    }
    
    // Emails with invalid personId
    const orphanedPersonLinks = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM email_messages e
      LEFT JOIN people p ON e."personId" = p.id
      WHERE e."workspaceId" = ${workspace.id}
        AND e."personId" IS NOT NULL
        AND p.id IS NULL
    `;
    
    // Emails with invalid companyId
    const orphanedCompanyLinks = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM email_messages e
      LEFT JOIN companies c ON e."companyId" = c.id
      WHERE e."workspaceId" = ${workspace.id}
        AND e."companyId" IS NOT NULL
        AND c.id IS NULL
    `;
    
    const orphanedPersonCount = Number(orphanedPersonLinks[0]?.count || 0);
    const orphanedCompanyCount = Number(orphanedCompanyLinks[0]?.count || 0);
    
    log('Orphaned Record Check:', 'yellow');
    
    if (orphanedPersonCount > 0) {
      log(`  ❌ Found ${orphanedPersonCount} emails with invalid personId`, 'red');
      log(`  These emails reference people that no longer exist`, 'red');
    } else {
      log(`  ✅ No orphaned person links`, 'green');
    }
    
    if (orphanedCompanyCount > 0) {
      log(`  ❌ Found ${orphanedCompanyCount} emails with invalid companyId`, 'red');
      log(`  These emails reference companies that no longer exist`, 'red');
    } else {
      log(`  ✅ No orphaned company links`, 'green');
    }
    
    if (orphanedPersonCount === 0 && orphanedCompanyCount === 0) {
      log(`\n  ✅ Database integrity is good - no orphaned records`, 'green');
    } else {
      log(`\n  ⚠️  Found ${orphanedPersonCount + orphanedCompanyCount} orphaned records`, 'yellow');
      log(`  Recommendation: Clean up orphaned links or restore missing records`, 'yellow');
    }
    
    return { orphanedPerson: orphanedPersonCount, orphanedCompany: orphanedCompanyCount };
  } catch (error) {
    log(`❌ Error checking orphaned records: ${error.message}`, 'red');
    console.error(error);
    return { orphanedPerson: 0, orphanedCompany: 0 };
  }
}

/**
 * Check 3: Data consistency
 */
async function checkDataConsistency() {
  logSection('Check 3: Data Consistency');
  
  try {
    const workspace = await prisma.workspaces.findFirst({
      where: { isActive: true },
      select: { id: true }
    });
    
    if (!workspace) {
      log('❌ No active workspace found', 'red');
      return;
    }
    
    // Check for emails missing required fields
    const emailsMissingFields = await prisma.email_messages.findMany({
      where: {
        workspaceId: workspace.id,
        OR: [
          { messageId: null },
          { provider: null },
          { subject: null },
          { from: null },
          { receivedAt: null }
        ]
      },
      select: {
        id: true,
        messageId: true,
        provider: true,
        subject: true,
        from: true,
        receivedAt: true
      },
      take: 10
    });
    
    if (emailsMissingFields.length > 0) {
      log(`  ⚠️  Found ${emailsMissingFields.length} emails with missing required fields:`, 'yellow');
      emailsMissingFields.forEach(email => {
        const missing = [];
        if (!email.messageId) missing.push('messageId');
        if (!email.provider) missing.push('provider');
        if (!email.subject) missing.push('subject');
        if (!email.from) missing.push('from');
        if (!email.receivedAt) missing.push('receivedAt');
        log(`    - Email ${email.id}: Missing ${missing.join(', ')}`, 'yellow');
      });
    } else {
      log(`  ✅ All emails have required fields`, 'green');
    }
    
    // Check for duplicate messageIds (should be unique per provider/workspace)
    const duplicates = await prisma.$queryRaw`
      SELECT "provider", "messageId", "workspaceId", COUNT(*) as count
      FROM email_messages
      WHERE "workspaceId" = ${workspace.id}
      GROUP BY "provider", "messageId", "workspaceId"
      HAVING COUNT(*) > 1
    `;
    
    if (duplicates.length > 0) {
      log(`  ❌ Found ${duplicates.length} duplicate email entries:`, 'red');
      duplicates.slice(0, 5).forEach(dup => {
        log(`    - ${dup.provider}: ${dup.messageId} (${dup.count} copies)`, 'red');
      });
    } else {
      log(`  ✅ No duplicate emails found`, 'green');
    }
    
    // Check for emails with invalid date ranges
    const invalidDates = await prisma.email_messages.findMany({
      where: {
        workspaceId: workspace.id,
        OR: [
          { receivedAt: { gt: new Date() } }, // Future dates
          { sentAt: { gt: new Date() } }
        ]
      },
      select: {
        id: true,
        subject: true,
        receivedAt: true,
        sentAt: true
      },
      take: 5
    });
    
    if (invalidDates.length > 0) {
      log(`  ⚠️  Found ${invalidDates.length} emails with future dates:`, 'yellow');
      invalidDates.forEach(email => {
        log(`    - ${email.subject}: receivedAt=${email.receivedAt}, sentAt=${email.sentAt}`, 'yellow');
      });
    } else {
      log(`  ✅ No emails with invalid date ranges`, 'green');
    }
    
    log('\n✅ Data consistency check completed', 'green');
  } catch (error) {
    log(`❌ Error checking data consistency: ${error.message}`, 'red');
    console.error(error);
  }
}

/**
 * Check 4: Email linking accuracy
 */
async function checkEmailLinkingAccuracy() {
  logSection('Check 4: Email Linking Accuracy');
  
  try {
    const workspace = await prisma.workspaces.findFirst({
      where: { isActive: true },
      select: { id: true }
    });
    
    if (!workspace) {
      log('❌ No active workspace found', 'red');
      return;
    }
    
    // Get linked emails and verify they match
    const linkedEmails = await prisma.email_messages.findMany({
      where: {
        workspaceId: workspace.id,
        personId: { not: null }
      },
      include: {
        person: {
          select: {
            id: true,
            email: true,
            workEmail: true,
            personalEmail: true
          }
        }
      },
      take: 50
    });
    
    let correctLinks = 0;
    let incorrectLinks = 0;
    const incorrectExamples = [];
    
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
      } else {
        incorrectLinks++;
        if (incorrectExamples.length < 5) {
          incorrectExamples.push({
            emailId: email.id,
            subject: email.subject,
            from: email.from,
            personEmails: personEmails
          });
        }
      }
    }
    
    log('Email Linking Accuracy:', 'yellow');
    log(`  Total linked emails checked: ${linkedEmails.length}`, 'blue');
    log(`  Correctly linked: ${correctLinks}`, 'green');
    log(`  Incorrectly linked: ${incorrectLinks}`, incorrectLinks > 0 ? 'red' : 'green');
    
    const accuracyRate = linkedEmails.length > 0
      ? Math.round((correctLinks / linkedEmails.length) * 100)
      : 0;
    
    log(`  Accuracy Rate: ${accuracyRate}%`, accuracyRate >= 95 ? 'green' : accuracyRate >= 80 ? 'yellow' : 'red');
    
    if (incorrectLinks > 0) {
      log(`\n  Examples of incorrect links:`, 'yellow');
      incorrectExamples.forEach(ex => {
        log(`    - ${ex.subject || 'No subject'}`, 'yellow');
        log(`      From: ${ex.from}`, 'blue');
        log(`      Person emails: ${ex.personEmails.join(', ') || 'None'}`, 'blue');
        log(`      No match found!`, 'red');
      });
    }
    
    log('\n✅ Email linking accuracy check completed', 'green');
  } catch (error) {
    log(`❌ Error checking email linking accuracy: ${error.message}`, 'red');
    console.error(error);
  }
}

/**
 * Check 5: People status distribution
 */
async function checkPeopleStatusDistribution() {
  logSection('Check 5: People Status Distribution');
  
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
    const statusCounts = await prisma.people.groupBy({
      by: ['status'],
      where: {
        workspaceId: workspace.id,
        emails: {
          some: {}
        }
      },
      _count: {
        id: true
      }
    });
    
    log('People with emails by status:', 'yellow');
    const statusMap = {
      LEAD: 0,
      PROSPECT: 0,
      OPPORTUNITY: 0,
      CLIENT: 0,
      SUPERFAN: 0,
      OTHER: 0
    };
    
    statusCounts.forEach(item => {
      const status = item.status || 'OTHER';
      if (statusMap[status] !== undefined) {
        statusMap[status] = item._count.id;
      } else {
        statusMap.OTHER += item._count.id;
      }
    });
    
    Object.entries(statusMap).forEach(([status, count]) => {
      if (count > 0) {
        log(`  ${status}: ${count} people`, 'blue');
      }
    });
    
    const total = Object.values(statusMap).reduce((sum, count) => sum + count, 0);
    log(`\n  Total people with emails: ${total}`, 'green');
    
    // Verify we can query emails by person status
    const sampleEmails = await prisma.email_messages.findMany({
      where: {
        workspaceId: workspace.id,
        person: {
          status: 'LEAD'
        }
      },
      take: 1,
      include: {
        person: {
          select: {
            status: true
          }
        }
      }
    });
    
    if (sampleEmails.length > 0) {
      log(`\n  ✅ Can query emails by person.status (e.g., LEAD)`, 'green');
      log(`  Sample: Email linked to person with status ${sampleEmails[0].person.status}`, 'blue');
    }
    
    log('\n✅ People status distribution check completed', 'green');
  } catch (error) {
    log(`❌ Error checking people status distribution: ${error.message}`, 'red');
    console.error(error);
  }
}

/**
 * Main audit runner
 */
async function runAudit() {
  log('\n' + '='.repeat(60), 'cyan');
  log('DATABASE INTEGRITY AUDIT', 'cyan');
  log('='.repeat(60), 'cyan');
  
  const results = {
    unlinked: {},
    orphaned: {},
    consistency: true,
    accuracy: 0
  };
  
  try {
    results.unlinked = await checkUnlinkedEmails();
    results.orphaned = await checkOrphanedRecords();
    await checkDataConsistency();
    await checkEmailLinkingAccuracy();
    await checkPeopleStatusDistribution();
    
    logSection('Audit Summary');
    log('Database integrity audit completed.', 'blue');
    log('\nKey Metrics:', 'yellow');
    log(`  Unlinked emails: ${results.unlinked.unlinked} / ${results.unlinked.total} (${results.unlinked.linkRate}% linked)`, 
        results.unlinked.linkRate >= 80 ? 'green' : 'yellow');
    log(`  Orphaned person links: ${results.orphaned.orphanedPerson}`, 
        results.orphaned.orphanedPerson === 0 ? 'green' : 'red');
    log(`  Orphaned company links: ${results.orphaned.orphanedCompany}`, 
        results.orphaned.orphanedCompany === 0 ? 'green' : 'red');
    
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
  
  return results;
}

// Run audit
if (require.main === module) {
  runAudit().catch(console.error);
}

module.exports = { runAudit };

