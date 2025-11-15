/**
 * 🔧 FIX: Comprehensive Email and Company Sync
 * 
 * This script:
 * 1. Links people to companies based on email domain
 * 2. Updates email_messages to include companyId when person has company
 * 3. Updates actions to include companyId when person has company
 * 
 * Usage:
 *   node scripts/fix-comprehensive-email-company-sync.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TOP_ENGINEERING_PLUS_WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';

class ComprehensiveEmailCompanySync {
  constructor() {
    this.stats = {
      peopleLinked: 0,
      emailsUpdated: 0,
      actionsUpdated: 0,
      errors: []
    };
  }

  log(message, type = 'info') {
    const prefix = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} ${message}`);
  }

  extractDomain(email) {
    if (!email) return null;
    const parts = email.split('@');
    return parts.length === 2 ? parts[1].toLowerCase() : null;
  }

  async run() {
    try {
      this.log('COMPREHENSIVE EMAIL AND COMPANY SYNC', 'info');
      this.log('='.repeat(60), 'info');
      
      await this.linkPeopleToCompanies();
      await this.updateEmailMessages();
      await this.updateActions();
      
      this.printSummary();
    } catch (error) {
      this.log(`Error during sync: ${error.message}`, 'error');
      console.error(error);
    } finally {
      await prisma.$disconnect();
    }
  }

  async linkPeopleToCompanies() {
    this.log('\n👥 Linking People to Companies', 'info');
    
    // Get all people without companyId but with emails
    const peopleWithoutCompany = await prisma.people.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        deletedAt: null,
        companyId: null,
        OR: [
          { workEmail: { not: null } },
          { personalEmail: { not: null } },
          { emails: { some: { workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID } } }
        ]
      },
      select: {
        id: true,
        fullName: true,
        workEmail: true,
        personalEmail: true,
        emails: {
          where: {
            workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID
          },
          select: {
            from: true
          },
          take: 10
        }
      }
    });

    this.log(`Found ${peopleWithoutCompany.length} people without companies`, 'info');

    for (const person of peopleWithoutCompany) {
      try {
        // Try to find company by email domain
        let companyId = null;
        const domains = new Set();
        
        if (person.workEmail) {
          const domain = this.extractDomain(person.workEmail);
          if (domain) domains.add(domain);
        }
        if (person.personalEmail) {
          const domain = this.extractDomain(person.personalEmail);
          if (domain) domains.add(domain);
        }
        for (const email of person.emails) {
          const domain = this.extractDomain(email.from);
          if (domain) domains.add(domain);
        }

        // Try to find company by domain match
        if (domains.size > 0) {
          // First try exact domain match
          const domainArray = Array.from(domains);
          const company = await prisma.companies.findFirst({
            where: {
              workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
              deletedAt: null,
              OR: [
                { email: { contains: domainArray[0] } },
                { website: { contains: domainArray[0] } }
              ]
            },
            select: {
              id: true,
              name: true
            }
          });

          if (company) {
            companyId = company.id;
          } else {
            // Try to find company by people with same domain
            const peopleWithSameDomain = await prisma.people.findFirst({
              where: {
                workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
                deletedAt: null,
                companyId: { not: null },
                OR: [
                  { workEmail: { contains: `@${domainArray[0]}` } },
                  { personalEmail: { contains: `@${domainArray[0]}` } }
                ]
              },
              select: {
                companyId: true,
                company: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            });

            if (peopleWithSameDomain?.companyId) {
              companyId = peopleWithSameDomain.companyId;
            }
          }
        }

        if (companyId) {
          await prisma.people.update({
            where: { id: person.id },
            data: {
              companyId: companyId,
              updatedAt: new Date()
            }
          });
          
          this.stats.peopleLinked++;
          const company = await prisma.companies.findUnique({
            where: { id: companyId },
            select: { name: true }
          });
          this.log(`  Linked ${person.fullName} to ${company?.name || companyId}`, 'success');
        } else {
          this.log(`  Could not find company for ${person.fullName} (domains: ${Array.from(domains).join(', ')})`, 'warn');
        }
      } catch (error) {
        this.stats.errors.push({
          type: 'link_person',
          personId: person.id,
          name: person.fullName,
          error: error.message
        });
        this.log(`  Failed to link ${person.fullName}: ${error.message}`, 'error');
      }
    }

    this.log(`✅ Linked ${this.stats.peopleLinked} people to companies`, 'success');
  }

  async updateEmailMessages() {
    this.log('\n📧 Updating Email Messages with CompanyId', 'info');
    
    // Get all emails with personId but no companyId
    const emailsWithoutCompany = await prisma.email_messages.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        personId: { not: null },
        companyId: null
      },
      select: {
        id: true,
        personId: true
      }
    });

    this.log(`Found ${emailsWithoutCompany.length} emails with personId but no companyId`, 'info');

    // Group by personId
    const emailsByPerson = {};
    for (const email of emailsWithoutCompany) {
      if (!emailsByPerson[email.personId]) {
        emailsByPerson[email.personId] = [];
      }
      emailsByPerson[email.personId].push(email.id);
    }

    // Update emails for each person
    for (const [personId, emailIds] of Object.entries(emailsByPerson)) {
      try {
        const person = await prisma.people.findUnique({
          where: { id: personId },
          select: {
            id: true,
            fullName: true,
            companyId: true
          }
        });

        if (!person) {
          continue;
        }

        if (person.companyId) {
          // Update all emails for this person
          const result = await prisma.email_messages.updateMany({
            where: {
              id: { in: emailIds },
              companyId: null
            },
            data: {
              companyId: person.companyId
            }
          });

          this.stats.emailsUpdated += result.count;
          this.log(`  Updated ${result.count} emails for ${person.fullName}`, 'success');
        }
      } catch (error) {
        this.stats.errors.push({
          type: 'update_emails',
          personId: personId,
          error: error.message
        });
        this.log(`  Failed to update emails for person ${personId}: ${error.message}`, 'error');
      }
    }

    this.log(`✅ Updated ${this.stats.emailsUpdated} email_messages with companyId`, 'success');
  }

  async updateActions() {
    this.log('\n📋 Updating Actions with CompanyId', 'info');
    
    // Get all actions with personId but no companyId
    const actionsWithoutCompany = await prisma.actions.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        deletedAt: null,
        personId: { not: null },
        companyId: null
      },
      select: {
        id: true,
        personId: true
      }
    });

    this.log(`Found ${actionsWithoutCompany.length} actions with personId but no companyId`, 'info');

    // Group by personId
    const actionsByPerson = {};
    for (const action of actionsWithoutCompany) {
      if (!actionsByPerson[action.personId]) {
        actionsByPerson[action.personId] = [];
      }
      actionsByPerson[action.personId].push(action.id);
    }

    // Update actions for each person
    for (const [personId, actionIds] of Object.entries(actionsByPerson)) {
      try {
        const person = await prisma.people.findUnique({
          where: { id: personId },
          select: {
            id: true,
            fullName: true,
            companyId: true
          }
        });

        if (!person) {
          continue;
        }

        if (person.companyId) {
          // Update all actions for this person
          const result = await prisma.actions.updateMany({
            where: {
              id: { in: actionIds },
              companyId: null
            },
            data: {
              companyId: person.companyId
            }
          });

          this.stats.actionsUpdated += result.count;
          this.log(`  Updated ${result.count} actions for ${person.fullName}`, 'success');
        }
      } catch (error) {
        this.stats.errors.push({
          type: 'update_actions',
          personId: personId,
          error: error.message
        });
        this.log(`  Failed to update actions for person ${personId}: ${error.message}`, 'error');
      }
    }

    this.log(`✅ Updated ${this.stats.actionsUpdated} actions with companyId`, 'success');
  }

  printSummary() {
    this.log('\n' + '='.repeat(60), 'info');
    this.log('SYNC SUMMARY', 'info');
    this.log('='.repeat(60), 'info');
    
    this.log(`\n✅ People linked to companies: ${this.stats.peopleLinked}`, 'success');
    this.log(`✅ Email messages updated: ${this.stats.emailsUpdated}`, 'success');
    this.log(`✅ Actions updated: ${this.stats.actionsUpdated}`, 'success');
    
    if (this.stats.errors.length > 0) {
      this.log(`\n⚠️  Errors: ${this.stats.errors.length}`, 'warn');
      this.stats.errors.slice(0, 10).forEach((error, idx) => {
        this.log(`  ${idx + 1}. ${error.type}: ${error.error}`, 'warn');
      });
      if (this.stats.errors.length > 10) {
        this.log(`  ... and ${this.stats.errors.length - 10} more errors`, 'warn');
      }
    }
  }
}

// Run the fix
if (require.main === module) {
  const fix = new ComprehensiveEmailCompanySync();
  fix.run().catch(console.error);
}

module.exports = ComprehensiveEmailCompanySync;

