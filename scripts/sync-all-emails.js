#!/usr/bin/env node

/**
 * Sync All Emails to Companies and People
 * 
 * Retroactively links all unlinked emails to companies and people with improved matching.
 * Processes all emails in batches and creates action records for linked emails.
 * 
 * Usage:
 *   node scripts/sync-all-emails.js [--workspace-id=WORKSPACE_ID] [--dry-run]
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

class EmailSyncService {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.workspaceId = options.workspaceId || null;
    this.batchSize = 100;
    this.stats = {
      emailsProcessed: 0,
      emailsLinkedToPerson: 0,
      emailsLinkedToCompany: 0,
      emailsLinkedToBoth: 0,
      actionsCreated: 0,
      errors: []
    };
  }

  log(message, level = 'info') {
    const prefix = this.dryRun ? '[DRY RUN] ' : '';
    const icon = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix}${icon} ${message}`);
  }

  /**
   * Extract domain from email address
   */
  extractDomain(email) {
    if (!email || typeof email !== 'string') return null;
    const match = email.toLowerCase().trim().match(/@([^@]+)$/);
    return match ? match[1] : null;
  }

  /**
   * Normalize domain for matching (remove www, http/https, etc.)
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
   * Extract base domain (e.g., "example.com" from "mail.example.com")
   */
  extractBaseDomain(domain) {
    if (!domain) return null;
    const normalized = this.normalizeDomain(domain);
    const parts = normalized.split('.');
    if (parts.length >= 2) {
      // Return last two parts (e.g., "example.com")
      return parts.slice(-2).join('.');
    }
    return normalized;
  }

  /**
   * Find matching person by email address
   */
  async findMatchingPerson(workspaceId, emailAddresses) {
    if (!emailAddresses || emailAddresses.length === 0) return null;

    const normalizedEmails = emailAddresses
      .filter(Boolean)
      .map(e => e.toLowerCase().trim());

    const person = await prisma.people.findFirst({
      where: {
        workspaceId,
        deletedAt: null,
        OR: [
          { email: { in: normalizedEmails } },
          { workEmail: { in: normalizedEmails } },
          { personalEmail: { in: normalizedEmails } }
        ]
      },
      include: {
        company: {
          select: {
            id: true,
            domain: true,
            website: true
          }
        }
      }
    });

    return person;
  }

  /**
   * Find matching company by domain or email
   */
  async findMatchingCompany(workspaceId, emailAddresses, domains) {
    if (!domains || domains.length === 0) return null;

    // Normalize domains
    const normalizedDomains = domains
      .map(d => this.normalizeDomain(d))
      .filter(Boolean);

    const baseDomains = normalizedDomains
      .map(d => this.extractBaseDomain(d))
      .filter(Boolean);

    // Get all unique domains to search
    const allDomains = [...new Set([...normalizedDomains, ...baseDomains])];

    if (allDomains.length === 0) return null;

    // First, try exact domain match
    let company = await prisma.companies.findFirst({
      where: {
        workspaceId,
        deletedAt: null,
        OR: [
          { domain: { in: allDomains } },
          { email: { in: emailAddresses } }
        ]
      }
    });

    // If no exact match, try website contains domain
    if (!company) {
      // Try matching against website field
      const companies = await prisma.companies.findMany({
        where: {
          workspaceId,
          deletedAt: null,
          website: { not: null }
        },
        select: {
          id: true,
          name: true,
          domain: true,
          website: true
        }
      });

      for (const domain of allDomains) {
        const matchingCompany = companies.find(c => {
          if (!c.website) return false;
          const normalizedWebsite = this.normalizeDomain(c.website);
          return normalizedWebsite === domain || 
                 normalizedWebsite.includes(domain) ||
                 domain.includes(normalizedWebsite);
        });

        if (matchingCompany) {
          company = matchingCompany;
          break;
        }
      }
    }

    return company;
  }

  /**
   * Link email to person and/or company
   */
  async linkEmail(email, workspaceId) {
    // Extract all email addresses from email
    const emailAddresses = [
      email.from,
      ...(email.to || []),
      ...(email.cc || []),
      ...(email.bcc || [])
    ].filter(Boolean).map(e => e.toLowerCase().trim());

    if (emailAddresses.length === 0) {
      return { personId: null, companyId: null };
    }

    let personId = email.personId;
    let companyId = email.companyId;

    // Try to find matching person
    if (!personId) {
      const person = await this.findMatchingPerson(workspaceId, emailAddresses);
      if (person) {
        personId = person.id;
        // If person has a company, link to that company too
        if (!companyId && person.companyId) {
          companyId = person.companyId;
        }
      }
    }

    // If no person found, try to find company by domain
    if (!companyId) {
      const domains = emailAddresses
        .map(e => this.extractDomain(e))
        .filter(Boolean);

      if (domains.length > 0) {
        const company = await this.findMatchingCompany(workspaceId, emailAddresses, domains);
        if (company) {
          companyId = company.id;
        }
      }
    }

    // Update email if we found links
    if (personId !== email.personId || companyId !== email.companyId) {
      if (!this.dryRun) {
        await prisma.email_messages.update({
          where: { id: email.id },
          data: {
            personId: personId || null,
            companyId: companyId || null
          }
        });
      }

      return { personId, companyId };
    }

    return { personId: email.personId, companyId: email.companyId };
  }

  /**
   * Create action record for linked email
   */
  async createActionForEmail(email, workspaceId) {
    if (!email.personId) return null;

    // Check if action already exists
    const existingAction = await prisma.actions.findFirst({
      where: {
        workspaceId,
        personId: email.personId,
        type: 'EMAIL',
        subject: email.subject,
        completedAt: email.receivedAt
      }
    });

    if (existingAction) return null;

    // Get workspace user for action assignment
    const workspaceUser = await prisma.workspace_users.findFirst({
      where: {
        workspaceId,
        isActive: true
      }
    });

    if (!workspaceUser) return null;

    if (!this.dryRun) {
      const action = await prisma.actions.create({
        data: {
          workspaceId,
          userId: workspaceUser.userId,
          companyId: email.companyId,
          personId: email.personId,
          type: 'EMAIL',
          subject: email.subject,
          description: email.body ? email.body.substring(0, 500) : null,
          status: 'COMPLETED',
          completedAt: email.receivedAt,
          createdAt: email.receivedAt,
          updatedAt: email.receivedAt
        }
      });

      return action;
    }

    return { id: 'dry-run-action' };
  }

  /**
   * Process emails for a workspace
   */
  async processWorkspace(workspaceId) {
    this.log(`Processing workspace: ${workspaceId}`, 'info');
    this.log('-'.repeat(70), 'info');

    // Get all unlinked emails
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const unlinkedEmails = await prisma.email_messages.findMany({
        where: {
          workspaceId,
          OR: [
            { personId: null },
            { companyId: null }
          ]
        },
        take: this.batchSize,
        skip: skip,
        orderBy: {
          receivedAt: 'desc'
        }
      });

      if (unlinkedEmails.length === 0) {
        hasMore = false;
        break;
      }

      this.log(`Processing batch ${Math.floor(skip / this.batchSize) + 1}: ${unlinkedEmails.length} emails`, 'info');

      for (const email of unlinkedEmails) {
        try {
          const result = await this.linkEmail(email, workspaceId);

          if (result.personId || result.companyId) {
            // Update email object for action creation
            email.personId = result.personId;
            email.companyId = result.companyId;

            if (result.personId && result.companyId) {
              this.stats.emailsLinkedToBoth++;
            } else if (result.personId) {
              this.stats.emailsLinkedToPerson++;
            } else if (result.companyId) {
              this.stats.emailsLinkedToCompany++;
            }

            // Create action record
            if (result.personId) {
              const action = await this.createActionForEmail(email, workspaceId);
              if (action) {
                this.stats.actionsCreated++;
              }
            }
          }

          this.stats.emailsProcessed++;

          if (this.stats.emailsProcessed % 100 === 0) {
            this.log(`Processed ${this.stats.emailsProcessed} emails...`, 'info');
          }
        } catch (error) {
          this.log(`Error processing email ${email.id}: ${error.message}`, 'error');
          this.stats.errors.push({ emailId: email.id, error: error.message });
        }
      }

      skip += this.batchSize;
      hasMore = unlinkedEmails.length === this.batchSize;
    }

    this.log(`Completed processing workspace ${workspaceId}`, 'success');
    this.log('', 'info');
  }

  /**
   * Execute email sync
   */
  async execute() {
    try {
      this.log('EMAIL SYNC - Link All Unlinked Emails', 'info');
      this.log('='.repeat(70), 'info');
      if (this.dryRun) {
        this.log('DRY RUN MODE - No changes will be made', 'warn');
      }
      this.log('', 'info');

      let workspaceIds = [];

      if (this.workspaceId) {
        // Process specific workspace
        workspaceIds = [this.workspaceId];
      } else {
        // Process all workspaces
        const workspaces = await prisma.workspaces.findMany({
          select: { id: true, name: true, slug: true }
        });
        workspaceIds = workspaces.map(w => w.id);
        this.log(`Found ${workspaces.length} workspaces to process`, 'info');
      }

      for (const workspaceId of workspaceIds) {
        await this.processWorkspace(workspaceId);
      }

      // Generate summary
      this.generateSummary();

    } catch (error) {
      this.log(`Email sync failed: ${error.message}`, 'error');
      console.error(error);
      throw error;
    } finally {
      try {
        await prisma.$disconnect();
      } catch (disconnectError) {
        // Ignore disconnect errors
      }
    }
  }

  generateSummary() {
    this.log('', 'info');
    this.log('='.repeat(70), 'info');
    this.log('EMAIL SYNC SUMMARY', 'info');
    this.log('='.repeat(70), 'info');
    this.log('', 'info');

    this.log(`Emails processed: ${this.stats.emailsProcessed}`, 'info');
    this.log(`Emails linked to person: ${this.stats.emailsLinkedToPerson}`, 'success');
    this.log(`Emails linked to company: ${this.stats.emailsLinkedToCompany}`, 'success');
    this.log(`Emails linked to both: ${this.stats.emailsLinkedToBoth}`, 'success');
    this.log(`Action records created: ${this.stats.actionsCreated}`, 'success');

    if (this.stats.errors.length > 0) {
      this.log(`Errors: ${this.stats.errors.length}`, 'warn');
      this.stats.errors.slice(0, 5).forEach(e => {
        this.log(`  - Email ${e.emailId}: ${e.error}`, 'warn');
      });
      if (this.stats.errors.length > 5) {
        this.log(`  ... and ${this.stats.errors.length - 5} more errors`, 'warn');
      }
    }

    const totalLinked = this.stats.emailsLinkedToPerson + this.stats.emailsLinkedToCompany - this.stats.emailsLinkedToBoth;
    this.log('', 'info');
    this.log(`Total emails linked: ${totalLinked}`, 'success');
    this.log(`Success rate: ${this.stats.emailsProcessed > 0 ? ((totalLinked / this.stats.emailsProcessed) * 100).toFixed(2) : 0}%`, 'success');

    this.log('', 'info');
    this.log('='.repeat(70), 'info');
    this.log('Email sync complete', 'success');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run'),
    workspaceId: args.find(arg => arg.startsWith('--workspace-id='))?.split('=')[1] || null
  };

  const syncService = new EmailSyncService(options);

  try {
    await syncService.execute();
    process.exit(0);
  } catch (error) {
    console.error('Email sync failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = EmailSyncService;

