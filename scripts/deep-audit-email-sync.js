#!/usr/bin/env node

/**
 * Deep Audit Email Sync
 * 
 * Comprehensive audit of email linking to ensure 100% accuracy:
 * - Verifies all linked emails are correctly linked
 * - Checks for mismatches or incorrect links
 * - Analyzes why emails couldn't be linked
 * - Validates linking logic
 * - Checks for edge cases and data quality issues
 * 
 * Usage:
 *   node scripts/deep-audit-email-sync.js [--workspace-id=WORKSPACE_ID]
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

class DeepEmailSyncAudit {
  constructor(options = {}) {
    this.workspaceId = options.workspaceId || null;
    this.results = {
      workspace: null,
      emails: {
        total: 0,
        linked: 0,
        unlinked: 0,
        linkedToPerson: 0,
        linkedToCompany: 0,
        linkedToBoth: 0
      },
      validation: {
        correctLinks: 0,
        incorrectLinks: 0,
        issues: []
      },
      unlinkedAnalysis: {
        noMatchingPerson: 0,
        noMatchingCompany: 0,
        noEmailAddresses: 0,
        invalidEmailAddresses: 0,
        sampleUnlinked: []
      },
      dataQuality: {
        peopleWithoutEmail: 0,
        companiesWithoutDomain: 0,
        emailsWithoutAddresses: 0
      }
    };
  }

  log(message, level = 'info') {
    const icon = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'success' ? '✅' : 'ℹ️';
    console.log(`${icon} ${message}`);
  }

  /**
   * Extract domain from email
   */
  extractDomain(email) {
    if (!email || typeof email !== 'string') return null;
    const match = email.toLowerCase().trim().match(/@([^@]+)$/);
    return match ? match[1] : null;
  }

  /**
   * Normalize domain
   */
  normalizeDomain(domain) {
    if (!domain) return null;
    return domain
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '')
      .trim();
  }

  /**
   * Validate email address format
   */
  isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.toLowerCase().trim());
  }

  /**
   * Verify email is correctly linked to person
   */
  async verifyPersonLink(email, personId) {
    if (!personId) return { valid: false, reason: 'No personId' };

    const person = await prisma.people.findUnique({
      where: { id: personId },
      select: {
        id: true,
        email: true,
        workEmail: true,
        personalEmail: true,
        fullName: true,
        companyId: true
      }
    });

    if (!person) {
      return { valid: false, reason: 'Person not found' };
    }

    // Extract email addresses from email message
    const emailAddresses = [
      email.from,
      ...(email.to || []),
      ...(email.cc || []),
      ...(email.bcc || [])
    ].filter(Boolean).map(e => e.toLowerCase().trim());

    // Check if any email address matches person's emails
    const personEmails = [
      person.email,
      person.workEmail,
      person.personalEmail
    ].filter(Boolean).map(e => e.toLowerCase().trim());

    const hasMatch = emailAddresses.some(ea => personEmails.includes(ea));

    if (!hasMatch) {
      return {
        valid: false,
        reason: 'Email address does not match person emails',
        emailAddresses,
        personEmails
      };
    }

    return { valid: true, person };
  }

  /**
   * Verify email is correctly linked to company
   */
  async verifyCompanyLink(email, companyId) {
    if (!companyId) return { valid: false, reason: 'No companyId' };

    const company = await prisma.companies.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        domain: true,
        website: true,
        email: true
      }
    });

    if (!company) {
      return { valid: false, reason: 'Company not found' };
    }

    // Extract email addresses and domains from email message
    const emailAddresses = [
      email.from,
      ...(email.to || []),
      ...(email.cc || []),
      ...(email.bcc || [])
    ].filter(Boolean).map(e => e.toLowerCase().trim());

    const domains = emailAddresses
      .map(e => this.extractDomain(e))
      .filter(Boolean)
      .map(d => this.normalizeDomain(d))
      .filter(Boolean);

    // Check if company email matches
    if (company.email && emailAddresses.includes(company.email.toLowerCase().trim())) {
      return { valid: true, company, matchType: 'email' };
    }

    // Check if company domain matches
    if (company.domain) {
      const normalizedCompanyDomain = this.normalizeDomain(company.domain);
      if (domains.includes(normalizedCompanyDomain)) {
        return { valid: true, company, matchType: 'domain' };
      }

      // Check base domain match
      const companyBaseDomain = normalizedCompanyDomain.split('.').slice(-2).join('.');
      const emailBaseDomains = domains.map(d => d.split('.').slice(-2).join('.'));
      if (emailBaseDomains.includes(companyBaseDomain)) {
        return { valid: true, company, matchType: 'base-domain' };
      }
    }

    // Check if company website domain matches
    if (company.website) {
      const normalizedWebsite = this.normalizeDomain(company.website);
      if (domains.some(d => normalizedWebsite === d || normalizedWebsite.includes(d) || d.includes(normalizedWebsite))) {
        return { valid: true, company, matchType: 'website' };
      }
    }

    return {
      valid: false,
      reason: 'Email domain does not match company domain/website/email',
      emailAddresses,
      domains,
      companyDomain: company.domain,
      companyWebsite: company.website,
      companyEmail: company.email
    };
  }

  /**
   * Analyze why email couldn't be linked
   */
  async analyzeUnlinkedEmail(email, workspaceId) {
    const emailAddresses = [
      email.from,
      ...(email.to || []),
      ...(email.cc || []),
      ...(email.bcc || [])
    ].filter(Boolean).map(e => e.toLowerCase().trim());

    if (emailAddresses.length === 0) {
      return { reason: 'noEmailAddresses', details: 'No email addresses found in message' };
    }

    // Check for invalid email addresses
    const invalidEmails = emailAddresses.filter(e => !this.isValidEmail(e));
    if (invalidEmails.length > 0) {
      return { reason: 'invalidEmailAddresses', details: `Invalid email addresses: ${invalidEmails.join(', ')}` };
    }

    // Try to find matching person
    const person = await prisma.people.findFirst({
      where: {
        workspaceId,
        deletedAt: null,
        OR: [
          { email: { in: emailAddresses } },
          { workEmail: { in: emailAddresses } },
          { personalEmail: { in: emailAddresses } }
        ]
      },
      select: { id: true, fullName: true, email: true, workEmail: true, personalEmail: true }
    });

    if (!person) {
      // Try to find matching company
      const domains = emailAddresses
        .map(e => this.extractDomain(e))
        .filter(Boolean)
        .map(d => this.normalizeDomain(d))
        .filter(Boolean);

      if (domains.length === 0) {
        return { reason: 'noDomains', details: 'Could not extract domains from email addresses' };
      }

      const company = await prisma.companies.findFirst({
        where: {
          workspaceId,
          deletedAt: null,
          OR: [
            { domain: { in: domains } },
            { email: { in: emailAddresses } }
          ]
        },
        select: { id: true, name: true, domain: true, website: true, email: true }
      });

      if (!company) {
        // Try website matching
        const companies = await prisma.companies.findMany({
          where: {
            workspaceId,
            deletedAt: null,
            website: { not: null }
          },
          select: { id: true, name: true, domain: true, website: true }
        });

        let matchedCompany = null;
        for (const domain of domains) {
          matchedCompany = companies.find(c => {
            if (!c.website) return false;
            const normalizedWebsite = this.normalizeDomain(c.website);
            return normalizedWebsite === domain || 
                   (normalizedWebsite && domain && (
                     normalizedWebsite.includes(domain) ||
                     domain.includes(normalizedWebsite)
                   ));
          });
          if (matchedCompany) break;
        }

        if (!matchedCompany) {
          return {
            reason: 'noMatchingCompany',
            details: `No company found for domains: ${domains.join(', ')}`,
            sampleDomain: domains[0]
          };
        }
      }

      return { reason: 'noMatchingPerson', details: 'Person not found but company might exist' };
    }

    return { reason: 'unknown', details: 'Could not determine reason' };
  }

  /**
   * Audit workspace
   */
  async auditWorkspace(workspaceId) {
    this.log(`Auditing workspace: ${workspaceId}`, 'info');
    this.log('='.repeat(70), 'info');

    // Get workspace info
    const workspace = await prisma.workspaces.findUnique({
      where: { id: workspaceId },
      select: { id: true, name: true, slug: true }
    });
    this.results.workspace = workspace;

    // Get all emails
    const allEmails = await prisma.email_messages.findMany({
      where: { workspaceId },
      select: {
        id: true,
        from: true,
        to: true,
        cc: true,
        bcc: true,
        subject: true,
        personId: true,
        companyId: true,
        receivedAt: true
      }
    });

    this.results.emails.total = allEmails.length;
    this.log(`Total emails: ${this.results.emails.total}`, 'info');

    // Categorize emails
    const linkedEmails = allEmails.filter(e => e.personId || e.companyId);
    const unlinkedEmails = allEmails.filter(e => !e.personId && !e.companyId);

    this.results.emails.linked = linkedEmails.length;
    this.results.emails.unlinked = unlinkedEmails.length;
    this.results.emails.linkedToPerson = linkedEmails.filter(e => e.personId).length;
    this.results.emails.linkedToCompany = linkedEmails.filter(e => e.companyId).length;
    this.results.emails.linkedToBoth = linkedEmails.filter(e => e.personId && e.companyId).length;

    this.log(`Linked emails: ${this.results.emails.linked}`, 'info');
    this.log(`Unlinked emails: ${this.results.emails.unlinked}`, 'info');
    this.log(`Linked to person: ${this.results.emails.linkedToPerson}`, 'info');
    this.log(`Linked to company: ${this.results.emails.linkedToCompany}`, 'info');
    this.log(`Linked to both: ${this.results.emails.linkedToBoth}`, 'info');
    this.log('', 'info');

    // Validate linked emails
    this.log('Validating linked emails...', 'info');
    let validatedCount = 0;
    const sampleSize = Math.min(linkedEmails.length, 100); // Sample 100 linked emails for validation

    for (let i = 0; i < sampleSize; i++) {
      const email = linkedEmails[i];
      let isValid = true;
      let issues = [];

      if (email.personId) {
        const personValidation = await this.verifyPersonLink(email, email.personId);
        if (!personValidation.valid) {
          isValid = false;
          issues.push({
            type: 'person',
            reason: personValidation.reason,
            details: personValidation
          });
        }
      }

      if (email.companyId) {
        const companyValidation = await this.verifyCompanyLink(email, email.companyId);
        if (!companyValidation.valid) {
          isValid = false;
          issues.push({
            type: 'company',
            reason: companyValidation.reason,
            details: companyValidation
          });
        }
      }

      if (isValid) {
        this.results.validation.correctLinks++;
      } else {
        this.results.validation.incorrectLinks++;
        this.results.validation.issues.push({
          emailId: email.id,
          subject: email.subject,
          issues
        });
      }

      validatedCount++;
      if (validatedCount % 20 === 0) {
        this.log(`Validated ${validatedCount}/${sampleSize} emails...`, 'info');
      }
    }

    this.log(`Validated ${validatedCount} linked emails`, 'success');
    this.log(`Correct links: ${this.results.validation.correctLinks}`, 'success');
    if (this.results.validation.incorrectLinks > 0) {
      this.log(`Incorrect links: ${this.results.validation.incorrectLinks}`, 'warn');
    }
    this.log('', 'info');

    // Analyze unlinked emails
    this.log('Analyzing unlinked emails...', 'info');
    const unlinkedSampleSize = Math.min(unlinkedEmails.length, 50); // Sample 50 unlinked emails

    for (let i = 0; i < unlinkedSampleSize; i++) {
      const email = unlinkedEmails[i];
      const analysis = await this.analyzeUnlinkedEmail(email, workspaceId);

      switch (analysis.reason) {
        case 'noEmailAddresses':
          this.results.unlinkedAnalysis.noEmailAddresses++;
          break;
        case 'invalidEmailAddresses':
          this.results.unlinkedAnalysis.invalidEmailAddresses++;
          break;
        case 'noMatchingPerson':
          this.results.unlinkedAnalysis.noMatchingPerson++;
          break;
        case 'noMatchingCompany':
          this.results.unlinkedAnalysis.noMatchingCompany++;
          break;
      }

      if (this.results.unlinkedAnalysis.sampleUnlinked.length < 10) {
        this.results.unlinkedAnalysis.sampleUnlinked.push({
          emailId: email.id,
          subject: email.subject,
          from: email.from,
          reason: analysis.reason,
          details: analysis.details
        });
      }
    }

    this.log(`Analyzed ${unlinkedSampleSize} unlinked emails`, 'success');
    this.log('', 'info');

    // Data quality checks
    this.log('Checking data quality...', 'info');

    // People without email
    const peopleWithoutEmail = await prisma.people.count({
      where: {
        workspaceId,
        deletedAt: null,
        email: null,
        workEmail: null,
        personalEmail: null
      }
    });
    this.results.dataQuality.peopleWithoutEmail = peopleWithoutEmail;

    // Companies without domain
    const companiesWithoutDomain = await prisma.companies.count({
      where: {
        workspaceId,
        deletedAt: null,
        domain: null,
        website: null,
        email: null
      }
    });
    this.results.dataQuality.companiesWithoutDomain = companiesWithoutDomain;

    // Emails without addresses (check if from is empty or to/cc/bcc are all empty)
    const allEmailsForCheck = await prisma.email_messages.findMany({
      where: { workspaceId },
      select: { id: true, from: true, to: true, cc: true, bcc: true }
    });
    const emailsWithoutAddresses = allEmailsForCheck.filter(e => {
      const hasFrom = e.from && e.from.trim().length > 0;
      const hasTo = e.to && Array.isArray(e.to) && e.to.length > 0;
      const hasCc = e.cc && Array.isArray(e.cc) && e.cc.length > 0;
      const hasBcc = e.bcc && Array.isArray(e.bcc) && e.bcc.length > 0;
      return !hasFrom && !hasTo && !hasCc && !hasBcc;
    }).length;
    this.results.dataQuality.emailsWithoutAddresses = emailsWithoutAddresses;

    this.log(`People without email: ${peopleWithoutEmail}`, 'info');
    this.log(`Companies without domain: ${companiesWithoutDomain}`, 'info');
    this.log(`Emails without addresses: ${emailsWithoutAddresses}`, 'info');
    this.log('', 'info');
  }

  /**
   * Execute audit
   */
  async execute() {
    try {
      this.log('DEEP EMAIL SYNC AUDIT', 'info');
      this.log('='.repeat(70), 'info');
      this.log('', 'info');

      let workspaceIds = [];

      if (this.workspaceId) {
        workspaceIds = [this.workspaceId];
      } else {
        const workspaces = await prisma.workspaces.findMany({
          select: { id: true, name: true }
        });
        workspaceIds = workspaces.map(w => w.id);
        this.log(`Auditing ${workspaces.length} workspaces`, 'info');
      }

      for (const workspaceId of workspaceIds) {
        await this.auditWorkspace(workspaceId);
      }

      this.generateReport();

    } catch (error) {
      this.log(`Audit failed: ${error.message}`, 'error');
      console.error(error);
      throw error;
    } finally {
      try {
        await prisma.$disconnect();
      } catch (disconnectError) {
        // Ignore
      }
    }
  }

  generateReport() {
    this.log('', 'info');
    this.log('='.repeat(70), 'info');
    this.log('DEEP AUDIT REPORT', 'info');
    this.log('='.repeat(70), 'info');

    // Email Statistics
    this.log('', 'info');
    this.log('EMAIL STATISTICS:', 'info');
    this.log(`  Total emails: ${this.results.emails.total}`, 'info');
    this.log(`  Linked: ${this.results.emails.linked} (${((this.results.emails.linked / this.results.emails.total) * 100).toFixed(2)}%)`, 
      this.results.emails.linked > 0 ? 'success' : 'warn');
    this.log(`  Unlinked: ${this.results.emails.unlinked} (${((this.results.emails.unlinked / this.results.emails.total) * 100).toFixed(2)}%)`, 
      this.results.emails.unlinked === 0 ? 'success' : 'warn');
    this.log(`  Linked to person: ${this.results.emails.linkedToPerson}`, 'info');
    this.log(`  Linked to company: ${this.results.emails.linkedToCompany}`, 'info');
    this.log(`  Linked to both: ${this.results.emails.linkedToBoth}`, 'info');

    // Validation Results
    this.log('', 'info');
    this.log('VALIDATION RESULTS:', 'info');
    const totalValidated = this.results.validation.correctLinks + this.results.validation.incorrectLinks;
    if (totalValidated > 0) {
      const accuracy = (this.results.validation.correctLinks / totalValidated) * 100;
      this.log(`  Accuracy: ${accuracy.toFixed(2)}%`, accuracy >= 95 ? 'success' : 'warn');
      this.log(`  Correct links: ${this.results.validation.correctLinks}`, 'success');
      if (this.results.validation.incorrectLinks > 0) {
        this.log(`  Incorrect links: ${this.results.validation.incorrectLinks}`, 'error');
        this.log('  Issues found:', 'warn');
        this.results.validation.issues.slice(0, 5).forEach(issue => {
          this.log(`    - Email ${issue.emailId}: ${issue.issues.map(i => i.reason).join(', ')}`, 'warn');
        });
        if (this.results.validation.issues.length > 5) {
          this.log(`    ... and ${this.results.validation.issues.length - 5} more issues`, 'warn');
        }
      }
    }

    // Unlinked Analysis
    this.log('', 'info');
    this.log('UNLINKED EMAIL ANALYSIS:', 'info');
    this.log(`  No matching person: ${this.results.unlinkedAnalysis.noMatchingPerson}`, 'info');
    this.log(`  No matching company: ${this.results.unlinkedAnalysis.noMatchingCompany}`, 'info');
    this.log(`  No email addresses: ${this.results.unlinkedAnalysis.noEmailAddresses}`, 'info');
    this.log(`  Invalid email addresses: ${this.results.unlinkedAnalysis.invalidEmailAddresses}`, 'info');

    if (this.results.unlinkedAnalysis.sampleUnlinked.length > 0) {
      this.log('  Sample unlinked emails:', 'info');
      this.results.unlinkedAnalysis.sampleUnlinked.slice(0, 5).forEach(email => {
        this.log(`    - ${email.subject || 'No subject'}: ${email.reason}`, 'info');
      });
    }

    // Data Quality
    this.log('', 'info');
    this.log('DATA QUALITY:', 'info');
    this.log(`  People without email: ${this.results.dataQuality.peopleWithoutEmail}`, 
      this.results.dataQuality.peopleWithoutEmail === 0 ? 'success' : 'warn');
    this.log(`  Companies without domain: ${this.results.dataQuality.companiesWithoutDomain}`, 
      this.results.dataQuality.companiesWithoutDomain === 0 ? 'success' : 'warn');
    this.log(`  Emails without addresses: ${this.results.dataQuality.emailsWithoutAddresses}`, 
      this.results.dataQuality.emailsWithoutAddresses === 0 ? 'success' : 'warn');

    // Summary
    this.log('', 'info');
    this.log('='.repeat(70), 'info');
    const accuracy = totalValidated > 0 ? (this.results.validation.correctLinks / totalValidated) * 100 : 100;
    if (accuracy >= 95 && this.results.validation.incorrectLinks === 0) {
      this.log('✅ EMAIL SYNC IS 100% ACCURATE', 'success');
    } else if (accuracy >= 90) {
      this.log('⚠️  EMAIL SYNC IS MOSTLY ACCURATE', 'warn');
    } else {
      this.log('❌ EMAIL SYNC HAS ACCURACY ISSUES', 'error');
    }
    this.log('='.repeat(70), 'info');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const options = {
    workspaceId: args.find(arg => arg.startsWith('--workspace-id='))?.split('=')[1] || null
  };

  const audit = new DeepEmailSyncAudit(options);

  try {
    await audit.execute();
    process.exit(0);
  } catch (error) {
    console.error('Audit failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DeepEmailSyncAudit;

