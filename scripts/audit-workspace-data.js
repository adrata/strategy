#!/usr/bin/env node

/**
 * 🔍 COMPREHENSIVE WORKSPACE DATA AUDIT
 * 
 * Audits all data for Retail Product Solutions and Notary Everyday workspaces
 * Identifies data integrity issues, missing relationships, and schema mismatches
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

// Workspace configurations
const WORKSPACES = {
  'Retail Product Solutions': {
    id: '01K1VBYV8ETM2RCQA4GNN9EG72',
    slug: 'rps',
    expectedAccounts: 251,
    expectedLeads: 865,
    expectedContacts: 1130
  },
  'Notary Everyday': {
    id: 'cmezxb1ez0001pc94yry3ntjk',
    slug: 'ne',
    expectedAccounts: 3000,
    expectedLeads: 389,
    expectedContacts: 389
  }
};

// Dano's user IDs (both formats)
const DANO_USER_IDS = ['01K1VBYYV7TRPY04NW4TW4XWRB', 'dano'];

async function auditWorkspaceData() {
  console.log('🔍 COMPREHENSIVE WORKSPACE DATA AUDIT');
  console.log('=====================================\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    const auditResults = {};
    
    // Audit each workspace
    for (const [workspaceName, config] of Object.entries(WORKSPACES)) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🏢 AUDITING: ${workspaceName}`);
      console.log(`   ID: ${config.id}`);
      console.log(`   Slug: ${config.slug}`);
      console.log(`${'='.repeat(60)}`);
      
      const workspaceAudit = await auditWorkspace(config);
      auditResults[workspaceName] = workspaceAudit;
      
      // Print summary
      console.log(`\n📊 ${workspaceName} AUDIT SUMMARY:`);
      console.log(`   Accounts: ${workspaceAudit.accounts.total} (Expected: ${config.expectedAccounts})`);
      console.log(`   Leads: ${workspaceAudit.leads.total} (Expected: ${config.expectedLeads})`);
      console.log(`   Contacts: ${workspaceAudit.contacts.total} (Expected: ${config.expectedContacts})`);
      console.log(`   Issues Found: ${workspaceAudit.issues.length}`);
    }
    
    // Cross-workspace analysis
    console.log(`\n${'='.repeat(60)}`);
    console.log('🔍 CROSS-WORKSPACE ANALYSIS');
    console.log(`${'='.repeat(60)}`);
    
    await analyzeCrossWorkspaceIssues(auditResults);
    
    // Generate audit report
    await generateAuditReport(auditResults);
    
  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function auditWorkspace(config) {
  const audit = {
    workspaceId: config.id,
    accounts: {},
    leads: {},
    contacts: {},
    issues: [],
    dataIntegrity: {}
  };
  
  // 1. AUDIT ACCOUNTS
  console.log('\n📊 Auditing Accounts...');
  const accounts = await prisma.accounts.findMany({
    where: { workspaceId: config.id },
    select: {
      id: true,
      name: true,
      assignedUserId: true,
      workspaceId: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          contacts: true,
          opportunities: true,
          clients: true
        }
      }
    }
  });
  
  audit.accounts = {
    total: accounts.length,
    withAssignedUser: accounts.filter(a => a.assignedUserId).length,
    withoutAssignedUser: accounts.filter(a => !a.assignedUserId).length,
    withContacts: accounts.filter(a => a._count.contacts > 0).length,
    withOpportunities: accounts.filter(a => a._count.opportunities > 0).length,
    withClients: accounts.filter(a => a._count.clients > 0).length,
    data: accounts
  };
  
  // Check for accounts with NULL workspaceId that should belong here
  const accountsWithNullWorkspace = await prisma.accounts.findMany({
    where: { 
      assignedUserId: { in: DANO_USER_IDS }
    },
    select: { id: true, name: true, assignedUserId: true, workspaceId: true }
  }).then(accounts => accounts.filter(a => !a.workspaceId));
  
  if (accountsWithNullWorkspace.length > 0) {
    audit.issues.push({
      type: 'NULL_WORKSPACE_ID',
      severity: 'HIGH',
      message: `${accountsWithNullWorkspace.length} accounts have NULL workspaceId but assigned to Dano`,
      details: accountsWithNullWorkspace
    });
  }
  
  // 2. AUDIT LEADS
  console.log('📊 Auditing Leads...');
  const leads = await prisma.leads.findMany({
    where: { workspaceId: config.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      fullName: true,
      email: true,
      jobTitle: true,
      status: true,
      assignedUserId: true,
      company: true,
      workspaceId: true,
      createdAt: true,
      updatedAt: true
    }
  });
  
  audit.leads = {
    total: leads.length,
    withAssignedUser: leads.filter(l => l.assignedUserId).length,
    withoutAssignedUser: leads.filter(l => !l.assignedUserId).length,
    withCompany: leads.filter(l => l.company).length,
    withoutCompany: leads.filter(l => !l.company).length,
    data: leads
  };
  
  // 3. AUDIT CONTACTS
  console.log('📊 Auditing Contacts...');
  const contacts = await prisma.contacts.findMany({
    where: { workspaceId: config.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      fullName: true,
      email: true,
      jobTitle: true,
      status: true,
      assignedUserId: true,
      accountId: true,
      workspaceId: true,
      createdAt: true,
      updatedAt: true
    }
  });
  
  audit.contacts = {
    total: contacts.length,
    withAssignedUser: contacts.filter(c => c.assignedUserId).length,
    withoutAssignedUser: contacts.filter(c => !c.assignedUserId).length,
    withAccount: contacts.filter(c => c.accountId).length,
    withoutAccount: contacts.filter(c => !c.accountId).length,
    data: contacts
  };
  
  // 4. CHECK DATA INTEGRITY
  console.log('🔍 Checking Data Integrity...');
  
  // Check for orphaned records
  const orphanedLeads = leads.filter(l => l.company && !accounts.find(a => a.name === l.company));
  const orphanedContacts = contacts.filter(c => c.accountId && !accounts.find(a => a.id === c.accountId));
  
  if (orphanedLeads.length > 0) {
    audit.issues.push({
      type: 'ORPHANED_LEADS',
      severity: 'MEDIUM',
      message: `${orphanedLeads.length} leads reference non-existent accounts`,
      details: orphanedLeads
    });
  }
  
  if (orphanedContacts.length > 0) {
    audit.issues.push({
      type: 'ORPHANED_CONTACTS',
      severity: 'MEDIUM',
      message: `${orphanedContacts.length} contacts reference non-existent accounts`,
      details: orphanedContacts
    });
  }
  
  // Check for duplicate emails
  const leadEmails = leads.filter(l => l.email).map(l => l.email.toLowerCase());
  const contactEmails = contacts.filter(c => c.email).map(c => c.email.toLowerCase());
  const duplicateEmails = [...leadEmails, ...contactEmails].filter((email, index, arr) => arr.indexOf(email) !== index);
  
  if (duplicateEmails.length > 0) {
    audit.issues.push({
      type: 'DUPLICATE_EMAILS',
      severity: 'LOW',
      message: `${duplicateEmails.length} duplicate email addresses found`,
      details: [...new Set(duplicateEmails)]
    });
  }
  
  // Check for external Coresignal IDs
  const externalIds = [...leads, ...contacts].filter(record => 
    record.id.includes('coresignal') || record.id.includes('external')
  );
  
  if (externalIds.length > 0) {
    audit.issues.push({
      type: 'EXTERNAL_IDS',
      severity: 'HIGH',
      message: `${externalIds.length} records have external Coresignal IDs`,
      details: externalIds
    });
  }
  
  return audit;
}

async function analyzeCrossWorkspaceIssues(auditResults) {
  console.log('\n🔍 Analyzing cross-workspace issues...');
  
  // Check for data leakage between workspaces
  const allAccounts = [];
  const allLeads = [];
  const allContacts = [];
  
  Object.values(auditResults).forEach(audit => {
    allAccounts.push(...audit.accounts.data);
    allLeads.push(...audit.leads.data);
    allContacts.push(...audit.contacts.data);
  });
  
  // Check for duplicate records across workspaces
  const accountNames = allAccounts.map(a => a.name?.toLowerCase().trim()).filter(Boolean);
  const duplicateAccountNames = accountNames.filter((name, index) => accountNames.indexOf(name) !== index);
  
  if (duplicateAccountNames.length > 0) {
    console.log(`⚠️  Found ${duplicateAccountNames.length} duplicate account names across workspaces`);
  }
  
  // Check for user assignment conflicts
  const danoAccounts = allAccounts.filter(a => DANO_USER_IDS.includes(a.assignedUserId));
  const danoLeads = allLeads.filter(l => DANO_USER_IDS.includes(l.assignedUserId));
  const danoContacts = allContacts.filter(c => DANO_USER_IDS.includes(c.assignedUserId));
  
  console.log(`\n👤 Dano's assignments across all workspaces:`);
  console.log(`   Accounts: ${danoAccounts.length}`);
  console.log(`   Leads: ${danoLeads.length}`);
  console.log(`   Contacts: ${danoContacts.length}`);
  
  // Check for accounts with NULL workspaceId
  const accountsWithNullWorkspace = await prisma.accounts.findMany({
    where: { 
      assignedUserId: { in: DANO_USER_IDS }
    },
    select: { id: true, name: true, assignedUserId: true, workspaceId: true }
  }).then(accounts => accounts.filter(a => !a.workspaceId));
  
  if (accountsWithNullWorkspace.length > 0) {
    console.log(`\n🚨 CRITICAL: ${accountsWithNullWorkspace.length} accounts have NULL workspaceId`);
    console.log('   This will cause data to appear in wrong workspaces!');
  }
}

async function generateAuditReport(auditResults) {
  console.log('\n📋 Generating audit report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalWorkspaces: Object.keys(auditResults).length,
      totalIssues: Object.values(auditResults).reduce((sum, audit) => sum + audit.issues.length, 0),
      criticalIssues: Object.values(auditResults).reduce((sum, audit) => 
        sum + audit.issues.filter(i => i.severity === 'HIGH').length, 0
      )
    },
    workspaces: auditResults,
    recommendations: []
  };
  
  // Generate recommendations
  Object.entries(auditResults).forEach(([workspaceName, audit]) => {
    if (audit.issues.length > 0) {
      report.recommendations.push({
        workspace: workspaceName,
        issues: audit.issues.map(i => ({
          type: i.type,
          severity: i.severity,
          message: i.message
        }))
      });
    }
  });
  
  // Save report
  const fs = await import('fs');
  const reportPath = 'scripts/reports/workspace-audit-report.json';
  
  // Ensure reports directory exists
  const reportsDir = 'scripts/reports';
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`✅ Audit report saved to: ${reportPath}`);
  
  // Print critical issues
  const criticalIssues = Object.values(auditResults).flatMap(audit => 
    audit.issues.filter(i => i.severity === 'HIGH')
  );
  
  if (criticalIssues.length > 0) {
    console.log(`\n🚨 CRITICAL ISSUES REQUIRING IMMEDIATE ATTENTION:`);
    criticalIssues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue.message}`);
    });
  }
  
  return report;
}

// Run the audit
if (import.meta.url === `file://${process.argv[1]}`) {
  auditWorkspaceData();
}
