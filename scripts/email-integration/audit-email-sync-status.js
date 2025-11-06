#!/usr/bin/env node

/**
 * Comprehensive Email Sync System Audit Report
 * 
 * Runs all audit tests and generates a comprehensive report with:
 * - Sync status and statistics
 * - Linking success rates
 * - Unlinked email counts
 * - Issues found
 * - Recommendations for fixes
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

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

/**
 * Collect comprehensive statistics
 */
async function collectStatistics() {
  logSection('Collecting Statistics');
  
  try {
    const workspace = await prisma.workspaces.findFirst({
      where: { isActive: true },
      select: { id: true, name: true }
    });
    
    if (!workspace) {
      log('❌ No active workspace found', 'red');
      return null;
    }
    
    log(`Collecting statistics for workspace: ${workspace.name}`, 'blue');
    
    // Email statistics
    const totalEmails = await prisma.email_messages.count({
      where: { workspaceId: workspace.id }
    });
    
    const linkedEmails = await prisma.email_messages.count({
      where: {
        workspaceId: workspace.id,
        personId: { not: null }
      }
    });
    
    const emailsWithCompanies = await prisma.email_messages.count({
      where: {
        workspaceId: workspace.id,
        companyId: { not: null }
      }
    });
    
    const unlinkedEmails = await prisma.email_messages.count({
      where: {
        workspaceId: workspace.id,
        personId: null,
        companyId: null
      }
    });
    
    // Connection statistics
    const activeConnections = await prisma.grand_central_connections.count({
      where: {
        workspaceId: workspace.id,
        provider: { in: ['outlook', 'gmail'] },
        status: 'active'
      }
    });
    
    // People with emails statistics
    const peopleWithEmails = await prisma.people.count({
      where: {
        workspaceId: workspace.id,
        emails: {
          some: {}
        }
      }
    });
    
    // People status distribution
    const statusDistribution = await prisma.people.groupBy({
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
    
    // Recent emails (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentEmails = await prisma.email_messages.count({
      where: {
        workspaceId: workspace.id,
        receivedAt: { gte: oneDayAgo }
      }
    });
    
    // Provider distribution
    const providerDistribution = await prisma.email_messages.groupBy({
      by: ['provider'],
      where: {
        workspaceId: workspace.id
      },
      _count: {
        id: true
      }
    });
    
    const linkRate = totalEmails > 0 
      ? Math.round((linkedEmails / totalEmails) * 100)
      : 0;
    
    const companyLinkRate = totalEmails > 0
      ? Math.round((emailsWithCompanies / totalEmails) * 100)
      : 0;
    
    return {
      workspace: {
        id: workspace.id,
        name: workspace.name
      },
      emails: {
        total: totalEmails,
        linked: linkedEmails,
        unlinked: unlinkedEmails,
        withCompanies: emailsWithCompanies,
        recent: recentEmails,
        linkRate,
        companyLinkRate
      },
      connections: {
        active: activeConnections
      },
      people: {
        withEmails: peopleWithEmails,
        statusDistribution: statusDistribution.reduce((acc, item) => {
          acc[item.status || 'OTHER'] = item._count.id;
          return acc;
        }, {})
      },
      providers: providerDistribution.reduce((acc, item) => {
        acc[item.provider] = item._count.id;
        return acc;
      }, {})
    };
  } catch (error) {
    log(`❌ Error collecting statistics: ${error.message}`, 'red');
    console.error(error);
    return null;
  }
}

/**
 * Check for issues
 */
async function identifyIssues(stats) {
  logSection('Identifying Issues');
  
  const issues = [];
  const warnings = [];
  
  if (!stats) {
    issues.push('No active workspace found - cannot collect statistics');
    return { issues, warnings };
  }
  
  // Issue: Low link rate
  if (stats.emails.linkRate < 50) {
    issues.push(`Low email linking rate: ${stats.emails.linkRate}% (target: >80%)`);
  } else if (stats.emails.linkRate < 80) {
    warnings.push(`Email linking rate could be improved: ${stats.emails.linkRate}% (target: >80%)`);
  }
  
  // Issue: Many unlinked emails
  if (stats.emails.unlinked > 100) {
    issues.push(`Large number of unlinked emails: ${stats.emails.unlinked}`);
  } else if (stats.emails.unlinked > 10) {
    warnings.push(`${stats.emails.unlinked} emails are unlinked and should be processed`);
  }
  
  // Issue: No active connections
  if (stats.connections.active === 0) {
    issues.push('No active email connections found - sync cannot run');
  }
  
  // Issue: No recent emails
  if (stats.emails.recent === 0 && stats.emails.total > 0) {
    warnings.push('No emails synced in the last 24 hours - sync may not be working');
  }
  
  // Issue: Missing company links
  if (stats.emails.companyLinkRate < stats.emails.linkRate * 0.8) {
    warnings.push(`Company linking rate (${stats.emails.companyLinkRate}%) is lower than person linking rate (${stats.emails.linkRate}%)`);
  }
  
  log('Issues Found:', 'yellow');
  if (issues.length === 0) {
    log('  ✅ No critical issues found', 'green');
  } else {
    issues.forEach((issue, idx) => {
      log(`  ${idx + 1}. ❌ ${issue}`, 'red');
    });
  }
  
  log('\nWarnings:', 'yellow');
  if (warnings.length === 0) {
    log('  ✅ No warnings', 'green');
  } else {
    warnings.forEach((warning, idx) => {
      log(`  ${idx + 1}. ⚠️  ${warning}`, 'yellow');
    });
  }
  
  return { issues, warnings };
}

/**
 * Generate recommendations
 */
function generateRecommendations(stats, issues, warnings) {
  logSection('Recommendations');
  
  const recommendations = [];
  
  if (!stats) {
    recommendations.push('Set up an active workspace to enable email sync');
    return recommendations;
  }
  
  // Recommendation for unlinked emails
  if (stats.emails.unlinked > 0) {
    recommendations.push({
      priority: stats.emails.unlinked > 100 ? 'HIGH' : 'MEDIUM',
      issue: `${stats.emails.unlinked} unlinked emails`,
      action: 'Run linkEmailsToEntities() function to link emails to people and companies',
      command: 'Call UnifiedEmailSyncService.linkEmailsToEntities(workspaceId)'
    });
  }
  
  // Recommendation for low link rate
  if (stats.emails.linkRate < 80) {
    recommendations.push({
      priority: 'MEDIUM',
      issue: `Low linking rate: ${stats.emails.linkRate}%`,
      action: 'Review email matching logic and ensure people have correct email addresses',
      command: 'Check email addresses in people table match email addresses in emails'
    });
  }
  
  // Recommendation for missing connections
  if (stats.connections.active === 0) {
    recommendations.push({
      priority: 'HIGH',
      issue: 'No active email connections',
      action: 'Connect Outlook or Gmail account via Grand Central integrations page',
      command: 'Navigate to /grand-central/integrations and connect email account'
    });
  }
  
  // Recommendation for sync issues
  if (stats.emails.recent === 0 && stats.emails.total > 0) {
    recommendations.push({
      priority: 'HIGH',
      issue: 'No recent email sync activity',
      action: 'Check cron job is running and webhooks are configured',
      command: 'Verify /api/cron/email-sync is being called every 5 minutes'
    });
  }
  
  // Recommendation for company linking
  if (stats.emails.companyLinkRate < stats.emails.linkRate * 0.8) {
    recommendations.push({
      priority: 'LOW',
      issue: 'Company linking rate is lower than person linking rate',
      action: 'Ensure linkEmailsToEntities() sets companyId from person.companyId',
      command: 'Verify companyId is set when person has companyId'
    });
  }
  
  recommendations.forEach((rec, idx) => {
    log(`\n${idx + 1}. [${rec.priority}] ${rec.issue}`, 
        rec.priority === 'HIGH' ? 'red' : rec.priority === 'MEDIUM' ? 'yellow' : 'blue');
    log(`   Action: ${rec.action}`, 'blue');
    log(`   Command: ${rec.command}`, 'blue');
  });
  
  return recommendations;
}

/**
 * Generate report file
 */
async function generateReportFile(stats, issues, warnings, recommendations) {
  const reportDir = path.join(process.cwd(), 'scripts', 'email-integration', 'audit-reports');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(reportDir, `email-sync-audit-${timestamp}.json`);
  
  const report = {
    timestamp: new Date().toISOString(),
    statistics: stats,
    issues,
    warnings,
    recommendations,
    summary: {
      totalIssues: issues.length,
      totalWarnings: warnings.length,
      overallStatus: issues.length === 0 ? 'HEALTHY' : 'NEEDS_ATTENTION'
    }
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log(`\n📄 Report saved to: ${reportPath}`, 'green');
  
  return reportPath;
}

/**
 * Main audit report generator
 */
async function generateAuditReport() {
  log('\n' + '='.repeat(70), 'magenta');
  log('COMPREHENSIVE EMAIL SYNC SYSTEM AUDIT REPORT', 'magenta');
  log('='.repeat(70), 'magenta');
  log(`Generated: ${new Date().toISOString()}`, 'blue');
  
  try {
    // Collect statistics
    const stats = await collectStatistics();
    
    // Identify issues
    const { issues, warnings } = await identifyIssues(stats);
    
    // Generate recommendations
    const recommendations = generateRecommendations(stats, issues, warnings);
    
    // Display summary
    logSection('Executive Summary');
    
    if (stats) {
      log(`Workspace: ${stats.workspace.name}`, 'blue');
      log(`Total Emails: ${stats.emails.total}`, 'blue');
      log(`Linked Emails: ${stats.emails.linked} (${stats.emails.linkRate}%)`, 
          stats.emails.linkRate >= 80 ? 'green' : 'yellow');
      log(`Unlinked Emails: ${stats.emails.unlinked}`, 
          stats.emails.unlinked === 0 ? 'green' : 'yellow');
      log(`Active Connections: ${stats.connections.active}`, 
          stats.connections.active > 0 ? 'green' : 'red');
      log(`Recent Emails (24h): ${stats.emails.recent}`, 'blue');
      
      log(`\nPeople with Emails: ${stats.people.withEmails}`, 'blue');
      log('Status Distribution:', 'blue');
      Object.entries(stats.people.statusDistribution).forEach(([status, count]) => {
        if (count > 0) {
          log(`  ${status}: ${count}`, 'blue');
        }
      });
      
      log(`\nProvider Distribution:`, 'blue');
      Object.entries(stats.providers).forEach(([provider, count]) => {
        log(`  ${provider}: ${count}`, 'blue');
      });
    }
    
    log(`\nOverall Status:`, 'yellow');
    if (issues.length === 0) {
      log('  ✅ SYSTEM HEALTHY - No critical issues found', 'green');
    } else {
      log(`  ⚠️  NEEDS ATTENTION - ${issues.length} critical issue(s) found`, 'red');
    }
    
    // Generate report file
    const reportPath = await generateReportFile(stats, issues, warnings, recommendations);
    
    logSection('Next Steps');
    log('1. Review the issues and warnings above', 'yellow');
    log('2. Implement the recommendations provided', 'yellow');
    log('3. Re-run this audit after fixes to verify improvements', 'yellow');
    log(`4. Check the detailed report file: ${reportPath}`, 'yellow');
    
    log('\n✅ Audit report generation completed', 'green');
    
    return {
      stats,
      issues,
      warnings,
      recommendations,
      reportPath
    };
    
  } catch (error) {
    log(`\n❌ Fatal error generating audit report: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run audit report
if (require.main === module) {
  generateAuditReport().catch(console.error);
}

module.exports = { generateAuditReport };

