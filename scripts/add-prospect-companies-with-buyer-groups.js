#!/usr/bin/env node

/**
 * Add Prospect Companies with Buyer Groups
 * 
 * Adds identified companies and people as Prospects, links emails/actions,
 * and runs buyer group analysis in batches to avoid timeouts.
 * 
 * Usage:
 *   node scripts/add-prospect-companies-with-buyer-groups.js [--dry-run] [--batch-size=5]
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { SmartBuyerGroupPipeline } = require('./_future_now/find-buyer-group/index');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

const WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';

// Priority companies from intelligence audit (utility/energy focus)
// These will be loaded from the intelligence audit results
const PRIORITY_COMPANIES = [
  { name: 'Rosenbergernetworks', domain: 'rosenbergernetworks.com', emailCount: 7, category: 'utility' },
  { name: 'Stec', domain: 'stec.org', emailCount: 1, category: 'utility' },
  { name: 'Truvisionsolutions', domain: 'truvisionsolutions.com', emailCount: 2, category: 'utility' },
  { name: 'Fiberbroadband', domain: 'fiberbroadband.org', emailCount: 25, category: 'energy' }
];

// Priority people from intelligence audit
const PRIORITY_PEOPLE = [
  { fullName: 'Nikhil Gogate', email: 'nikhil.gogate@rosenbergernetworks.com', emailCount: 4 },
  { fullName: 'Kimarley Thorpe', email: 'kimarley.thorpe@pens.com', emailCount: 3 },
  { fullName: 'Yareli Gardea', email: 'yareli.gardea@rlmunderground.com', emailCount: 3 },
  { fullName: 'Joshua Whaley', email: 'joshua.whaley@hdrinc.com', emailCount: 2 },
  { fullName: 'Randal Neck', email: 'randal.neck@rosenbergernetworks.com', emailCount: 2 }
];

class ProspectCompanyAdder {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.batchSize = options.batchSize || 3; // Process 3 companies at a time to avoid timeout
    this.delayBetweenBatches = 5000; // 5 seconds between batches
    this.delayBetweenCompanies = 2000; // 2 seconds between companies
    this.stats = {
      companiesAdded: 0,
      peopleAdded: 0,
      emailsLinked: 0,
      actionsCreated: 0,
      buyerGroupsRun: 0,
      errors: []
    };
  }

  log(message, level = 'info') {
    const prefix = this.dryRun ? '[DRY RUN] ' : '';
    const icon = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix}${icon} ${message}`);
  }

  /**
   * Get or create workspace user for mainSellerId
   */
  async getWorkspaceUser() {
    const workspaceUser = await prisma.workspace_users.findFirst({
      where: {
        workspaceId: WORKSPACE_ID,
        isActive: true
      },
      include: {
        user: true
      }
    });

    if (!workspaceUser) {
      throw new Error('No active workspace user found');
    }

    return workspaceUser.userId;
  }

  /**
   * Extract company name from domain
   */
  extractCompanyName(domain) {
    const parts = domain.split('.');
    if (parts.length >= 2) {
      const companyPart = parts[parts.length - 2];
      return companyPart.charAt(0).toUpperCase() + companyPart.slice(1);
    }
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  }

  /**
   * Add company as Prospect
   */
  async addCompany(companyData) {
    try {
      // Check if company already exists
      const existing = await prisma.companies.findFirst({
        where: {
          workspaceId: WORKSPACE_ID,
          OR: [
            { domain: companyData.domain },
            { website: { contains: companyData.domain } },
            { name: { contains: companyData.name, mode: 'insensitive' } }
          ],
          deletedAt: null
        }
      });

      if (existing) {
        this.log(`Company ${companyData.name} already exists (${existing.id})`, 'warn');
        return existing;
      }

      const mainSellerId = await this.getWorkspaceUser();

      if (this.dryRun) {
        this.log(`Would create company: ${companyData.name} (${companyData.domain})`, 'info');
        return { id: 'dry-run-company-id', name: companyData.name, domain: companyData.domain };
      }

      const company = await prisma.companies.create({
        data: {
          workspaceId: WORKSPACE_ID,
          name: companyData.name,
          domain: companyData.domain,
          website: `https://${companyData.domain}`,
          status: 'PROSPECT',
          mainSellerId: mainSellerId,
          tags: ['from-email-analysis', 'utility-energy-focus'],
          customFields: {
            source: 'unlinked-email-analysis',
            emailCount: companyData.emailCount,
            addedDate: new Date().toISOString()
          }
        }
      });

      this.log(`Created company: ${company.name} (${company.id})`, 'success');
      this.stats.companiesAdded++;
      return company;
    } catch (error) {
      this.log(`Error adding company ${companyData.name}: ${error.message}`, 'error');
      this.stats.errors.push({ type: 'company', name: companyData.name, error: error.message });
      throw error;
    }
  }

  /**
   * Add person as Prospect
   */
  async addPerson(personData, companyId) {
    try {
      // Check if person already exists
      const existing = await prisma.people.findFirst({
        where: {
          workspaceId: WORKSPACE_ID,
          email: personData.email,
          deletedAt: null
        }
      });

      if (existing) {
        this.log(`Person ${personData.fullName} already exists (${existing.id})`, 'warn');
        return existing;
      }

      const mainSellerId = await this.getWorkspaceUser();
      const nameParts = personData.fullName.split(' ');

      if (this.dryRun) {
        this.log(`Would create person: ${personData.fullName} (${personData.email})`, 'info');
        return { id: 'dry-run-person-id', fullName: personData.fullName, email: personData.email };
      }

      const person = await prisma.people.create({
        data: {
          workspaceId: WORKSPACE_ID,
          fullName: personData.fullName,
          firstName: nameParts[0] || personData.fullName,
          lastName: nameParts.slice(1).join(' ') || '',
          email: personData.email,
          workEmail: personData.email,
          status: 'PROSPECT',
          companyId: companyId,
          mainSellerId: mainSellerId,
          tags: ['from-email-analysis'],
          customFields: {
            source: 'unlinked-email-analysis',
            emailCount: personData.emailCount,
            addedDate: new Date().toISOString()
          }
        }
      });

      this.log(`Created person: ${person.fullName} (${person.id})`, 'success');
      this.stats.peopleAdded++;
      return person;
    } catch (error) {
      this.log(`Error adding person ${personData.fullName}: ${error.message}`, 'error');
      this.stats.errors.push({ type: 'person', name: personData.fullName, error: error.message });
      throw error;
    }
  }

  /**
   * Link emails to company/person
   */
  async linkEmails(companyId, personId, domain, emailAddress) {
    try {
      // Build OR conditions dynamically
      const orConditions = [];
      
      if (domain) {
        orConditions.push({ from: { contains: domain } });
      }
      
      if (emailAddress) {
        orConditions.push({ from: emailAddress });
        orConditions.push({ to: { has: emailAddress } });
        orConditions.push({ cc: { has: emailAddress } });
      }

      if (orConditions.length === 0) {
        return 0;
      }

      // Find unlinked emails for this domain/email
      const emails = await prisma.email_messages.findMany({
        where: {
          workspaceId: WORKSPACE_ID,
          OR: orConditions,
          personId: null,
          companyId: null
        }
      });

      if (emails.length === 0) {
        return 0;
      }

      if (this.dryRun) {
        this.log(`Would link ${emails.length} emails to company/person`, 'info');
        return emails.length;
      }

      let linked = 0;
      for (const email of emails) {
        try {
          await prisma.email_messages.update({
            where: { id: email.id },
            data: {
              personId: personId || null,
              companyId: companyId || null
            }
          });
          linked++;
        } catch (error) {
          this.log(`Error linking email ${email.id}: ${error.message}`, 'warn');
        }
      }

      this.log(`Linked ${linked} emails`, 'success');
      this.stats.emailsLinked += linked;
      return linked;
    } catch (error) {
      this.log(`Error linking emails: ${error.message}`, 'error');
      return 0;
    }
  }

  /**
   * Create action records for linked emails
   */
  async createActionsForEmails(companyId, personId) {
    try {
      const emails = await prisma.email_messages.findMany({
        where: {
          workspaceId: WORKSPACE_ID,
          OR: [
            { companyId: companyId },
            { personId: personId }
          ]
        },
        take: 50 // Limit to avoid too many actions
      });

      if (emails.length === 0) {
        return 0;
      }

      const mainSellerId = await this.getWorkspaceUser();
      let created = 0;

      for (const email of emails) {
        // Check if action already exists
        const existing = await prisma.actions.findFirst({
          where: {
            workspaceId: WORKSPACE_ID,
            personId: personId,
            type: 'EMAIL',
            subject: email.subject,
            completedAt: email.receivedAt
          }
        });

        if (existing) {
          continue;
        }

        if (this.dryRun) {
          created++;
          continue;
        }

        try {
          await prisma.actions.create({
            data: {
              workspaceId: WORKSPACE_ID,
              userId: mainSellerId,
              companyId: companyId,
              personId: personId,
              type: 'EMAIL',
              subject: email.subject,
              description: email.body ? email.body.substring(0, 500) : null,
              status: 'COMPLETED',
              completedAt: email.receivedAt,
              createdAt: email.receivedAt,
              updatedAt: email.receivedAt
            }
          });
          created++;
        } catch (error) {
          this.log(`Error creating action for email ${email.id}: ${error.message}`, 'warn');
        }
      }

      if (created > 0) {
        this.log(`Created ${created} action records`, 'success');
        this.stats.actionsCreated += created;
      }

      return created;
    } catch (error) {
      this.log(`Error creating actions: ${error.message}`, 'error');
      return 0;
    }
  }

  /**
   * Run buyer group analysis for company
   */
  async runBuyerGroup(company) {
    try {
      this.log(`Running buyer group analysis for ${company.name}...`, 'info');

      if (this.dryRun) {
        this.log(`[DRY RUN] Would run buyer group analysis`, 'info');
        return { success: true, dryRun: true };
      }

      const mainSellerId = await this.getWorkspaceUser();

      // Set timeout for buyer group analysis (5 minutes max)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Buyer group analysis timeout (5 minutes)')), 5 * 60 * 1000);
      });

      const pipeline = new SmartBuyerGroupPipeline({
        workspaceId: WORKSPACE_ID,
        mainSellerId: mainSellerId,
        dealSize: 300000,
        productCategory: 'engineering-services',
        customFiltering: {
          departments: {
            primary: ['engineering', 'it', 'operations', 'technology', 'communications', 'telecommunications', 'infrastructure'],
            secondary: ['strategy', 'planning', 'project management', 'fiber', 'outside plant'],
            exclude: ['customer success', 'hr', 'sales', 'marketing', 'finance', 'accounting']
          },
          titles: {
            primary: [
              'cto', 'chief technology officer', 'vp engineering', 'director engineering',
              'director it', 'director technology', 'director operations', 'director communications',
              'engineering manager', 'it manager', 'operations manager'
            ]
          }
        }
      });

      // Run with timeout
      const result = await Promise.race([
        pipeline.run(company),
        timeoutPromise
      ]);

      if (result && result.finalBuyerGroup) {
        this.log(`Buyer group analysis complete: ${result.finalBuyerGroup.length} people identified`, 'success');
        this.stats.buyerGroupsRun++;
        return { success: true, buyerGroupSize: result.finalBuyerGroup.length };
      }

      return { success: false, error: 'No buyer group returned' };
    } catch (error) {
      if (error.message.includes('timeout')) {
        this.log(`Buyer group analysis timed out for ${company.name} - continuing...`, 'warn');
      } else {
        this.log(`Error running buyer group for ${company.name}: ${error.message}`, 'error');
      }
      this.stats.errors.push({ type: 'buyer-group', company: company.name, error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Process company with all steps
   */
  async processCompany(companyData) {
    this.log(`\nProcessing company: ${companyData.name}`, 'info');
    this.log('-'.repeat(70), 'info');

    try {
      // Step 1: Add company
      const company = await this.addCompany(companyData);

      // Step 2: Link emails to company
      await this.linkEmails(company.id, null, companyData.domain, null);

      // Step 3: Add people for this company
      const peopleForCompany = PRIORITY_PEOPLE.filter(p => 
        p.email.includes(companyData.domain)
      );

      let personIds = [];
      for (const personData of peopleForCompany) {
        const person = await this.addPerson(personData, company.id);
        personIds.push(person.id);

        // Link emails for this person
        await this.linkEmails(company.id, person.id, companyData.domain, personData.email);

        // Create actions for this person's emails
        await this.createActionsForEmails(company.id, person.id);

        // Small delay between people
        await this.delay(500);
      }

      // Step 4: Create actions for company emails (if no people)
      if (personIds.length === 0) {
        await this.createActionsForEmails(company.id, null);
      }

      // Step 5: Run buyer group analysis (with delay to avoid timeout)
      this.log(`Waiting ${this.delayBetweenCompanies / 1000}s before buyer group analysis...`, 'info');
      await this.delay(this.delayBetweenCompanies);

      const buyerGroupResult = await this.runBuyerGroup(company);

      return { success: true, company, buyerGroupResult };
    } catch (error) {
      this.log(`Error processing company ${companyData.name}: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Delay helper
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute in batches
   */
  async execute() {
    try {
      this.log('ADDING PROSPECT COMPANIES WITH BUYER GROUPS', 'info');
      this.log('='.repeat(70), 'info');
      if (this.dryRun) {
        this.log('DRY RUN MODE - No changes will be made', 'warn');
      }
      this.log(`Batch size: ${this.batchSize} companies`, 'info');
      this.log(`Delay between batches: ${this.delayBetweenBatches / 1000}s`, 'info');
      this.log(`Delay between companies: ${this.delayBetweenCompanies / 1000}s`, 'info');
      this.log(`Total companies to process: ${PRIORITY_COMPANIES.length}`, 'info');
      this.log('', 'info');

      // Process companies in batches
      for (let i = 0; i < PRIORITY_COMPANIES.length; i += this.batchSize) {
        const batch = PRIORITY_COMPANIES.slice(i, i + this.batchSize);
        const batchNumber = Math.floor(i / this.batchSize) + 1;
        const totalBatches = Math.ceil(PRIORITY_COMPANIES.length / this.batchSize);

        this.log(`\n📦 Processing Batch ${batchNumber}/${totalBatches} (${batch.length} companies)`, 'info');
        this.log(`Progress: ${i + 1}-${Math.min(i + batch.length, PRIORITY_COMPANIES.length)} of ${PRIORITY_COMPANIES.length}`, 'info');
        this.log('='.repeat(70), 'info');

        for (let j = 0; j < batch.length; j++) {
          const companyData = batch[j];
          const companyNumber = i + j + 1;
          
          this.log(`\n[${companyNumber}/${PRIORITY_COMPANIES.length}] Processing: ${companyData.name}`, 'info');
          
          await this.processCompany(companyData);

          // Delay between companies (except last in batch)
          if (j < batch.length - 1) {
            this.log(`Waiting ${this.delayBetweenCompanies / 1000}s before next company...`, 'info');
            await this.delay(this.delayBetweenCompanies);
          }
        }

        // Delay between batches (except last batch)
        if (i + this.batchSize < PRIORITY_COMPANIES.length) {
          this.log(`\n⏳ Waiting ${this.delayBetweenBatches / 1000}s before next batch...`, 'info');
          await this.delay(this.delayBetweenBatches);
        }
      }

      // Generate summary
      this.generateSummary();

    } catch (error) {
      this.log(`Execution failed: ${error.message}`, 'error');
      console.error(error);
      throw error;
    } finally {
      await prisma.$disconnect().catch(() => {});
    }
  }

  generateSummary() {
    this.log('', 'info');
    this.log('='.repeat(70), 'info');
    this.log('SUMMARY', 'info');
    this.log('='.repeat(70), 'info');
    this.log('', 'info');

    this.log(`Companies added: ${this.stats.companiesAdded}`, 'success');
    this.log(`People added: ${this.stats.peopleAdded}`, 'success');
    this.log(`Emails linked: ${this.stats.emailsLinked}`, 'success');
    this.log(`Actions created: ${this.stats.actionsCreated}`, 'success');
    this.log(`Buyer groups run: ${this.stats.buyerGroupsRun}`, 'success');

    if (this.stats.errors.length > 0) {
      this.log(`Errors: ${this.stats.errors.length}`, 'warn');
      this.stats.errors.slice(0, 5).forEach(e => {
        this.log(`  - ${e.type}: ${e.name || e.company} - ${e.error}`, 'warn');
      });
    }

    this.log('', 'info');
    this.log('='.repeat(70), 'info');
    this.log('Processing complete', 'success');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run'),
    batchSize: parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1] || '3')
  };

  const adder = new ProspectCompanyAdder(options);

  try {
    await adder.execute();
    process.exit(0);
  } catch (error) {
    console.error('Execution failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ProspectCompanyAdder;

