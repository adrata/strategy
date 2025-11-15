#!/usr/bin/env node

/**
 * Transfer Top-Temp Data to TOP Engineering Plus
 * 
 * Replaces TOP Engineering Plus people/companies with top-temp data (the good data),
 * while preserving and reconnecting emails from TOP Engineering Plus to the new records.
 * 
 * Note: Actions from top-temp are NOT transferred (as requested).
 * 
 * Usage:
 *   node scripts/transfer-top-temp-to-top-engineering-plus.js [--dry-run]
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

// Workspace IDs
const TOP_TEMP_WORKSPACE_ID = '01K9QAP09FHT6EAP1B4G2KP3D2';
const TOP_ENGINEERING_PLUS_WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';

// Temp users to map
const TEMP_USERS = [
  { name: 'Victoria Leland', username: 'temp-victoria', email: 'temp-victoria@top-temp.com', targetEmail: 'vleland@topengineersplus.com' },
  { name: 'Justin Bedard', username: 'temp-justin', email: 'temp-justin@top-temp.com' },
  { name: 'Judy Wigginton', username: 'temp-judy', email: 'temp-judy@top-temp.com' },
  { name: 'Hilary Tristan', username: 'temp-hilary', email: 'temp-hilary@top-temp.com' }
];

class TopTempTransfer {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.stats = {
      companiesTransferred: 0,
      peopleTransferred: 0,
      actionsReconnected: 0,
      emailsReconnected: 0,
      relatedDataTransferred: 0,
      companiesDeleted: 0,
      peopleDeleted: 0,
      errors: []
    };
    this.mappings = {
      users: {}, // { topTempUserId: topEngineeringPlusUserId }
      companies: {}, // { topTempCompanyId: sameIdInNewWorkspace }
      people: {}, // { topTempPersonId: sameIdInNewWorkspace }
      oldCompanies: {}, // { oldCompanyId: { actions: [], emails: [] } }
      oldPeople: {} // { oldPersonId: { actions: [], emails: [] } }
    };
    this.workspaces = {
      topTemp: null,
      topEngineeringPlus: null
    };
  }

  log(message, level = 'info') {
    const prefix = this.dryRun ? '[DRY RUN] ' : '';
    const icon = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix}${icon} ${message}`);
  }

  async execute() {
    try {
      this.log('TRANSFER TOP-TEMP TO TOP ENGINEERING PLUS', 'info');
      this.log('='.repeat(70), 'info');
      if (this.dryRun) {
        this.log('DRY RUN MODE - No changes will be made', 'warn');
      }
      this.log('', 'info');

      // Step 1: Pre-Flight Validation
      await this.preFlightValidation();

      // Step 2: User Mapping Setup
      await this.setupUserMappings();

      // Step 3: Backup TOP Engineering Plus Actions & Emails
      await this.backupActionsAndEmails();

      // Step 4: Transfer Companies
      await this.transferCompanies();

      // Step 5: Transfer People
      await this.transferPeople();

      // Step 6: Reconnect Actions
      await this.reconnectActions();

      // Step 7: Reconnect Emails
      await this.reconnectEmails();

      // Step 8: Transfer Related Data
      await this.transferRelatedData();

      // Step 9: Clean Up TOP Engineering Plus
      await this.cleanupTopEngineeringPlus();

      // Step 10: Clean Up top-temp
      await this.cleanupTopTemp();

      // Step 11: Verification & Reporting
      await this.verificationAndReporting();

      this.log('', 'info');
      this.log('TRANSFER COMPLETED SUCCESSFULLY', 'success');
      this.printSummary();

    } catch (error) {
      this.log(`Transfer failed: ${error.message}`, 'error');
      console.error(error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  // Step 1: Pre-Flight Validation
  async preFlightValidation() {
    this.log('Step 1: Pre-Flight Validation', 'info');
    this.log('-'.repeat(70), 'info');

    // Verify workspaces exist
    this.log('Verifying workspaces...', 'info');
    this.workspaces.topTemp = await prisma.workspaces.findUnique({
      where: { id: TOP_TEMP_WORKSPACE_ID }
    });

    if (!this.workspaces.topTemp) {
      throw new Error(`Top-temp workspace not found: ${TOP_TEMP_WORKSPACE_ID}`);
    }
    this.log(`Found top-temp workspace: ${this.workspaces.topTemp.name}`, 'success');

    this.workspaces.topEngineeringPlus = await prisma.workspaces.findUnique({
      where: { id: TOP_ENGINEERING_PLUS_WORKSPACE_ID }
    });

    if (!this.workspaces.topEngineeringPlus) {
      throw new Error(`TOP Engineering Plus workspace not found: ${TOP_ENGINEERING_PLUS_WORKSPACE_ID}`);
    }
    this.log(`Found TOP Engineering Plus workspace: ${this.workspaces.topEngineeringPlus.name}`, 'success');

    // Count records
    this.log('Counting records...', 'info');
    const topTempCounts = {
      companies: await prisma.companies.count({
        where: { workspaceId: TOP_TEMP_WORKSPACE_ID, deletedAt: null }
      }),
      people: await prisma.people.count({
        where: { workspaceId: TOP_TEMP_WORKSPACE_ID, deletedAt: null }
      }),
      actions: await prisma.actions.count({
        where: { workspaceId: TOP_TEMP_WORKSPACE_ID, deletedAt: null }
      }),
      emails: await prisma.email_messages.count({
        where: { workspaceId: TOP_TEMP_WORKSPACE_ID }
      })
    };

    const topEngineeringPlusCounts = {
      companies: await prisma.companies.count({
        where: { workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID, deletedAt: null }
      }),
      people: await prisma.people.count({
        where: { workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID, deletedAt: null }
      }),
      actions: await prisma.actions.count({
        where: { workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID, deletedAt: null }
      }),
      emails: await prisma.email_messages.count({
        where: { workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID }
      })
    };

    this.log(`Top-temp: ${topTempCounts.companies} companies, ${topTempCounts.people} people, ${topTempCounts.actions} actions, ${topTempCounts.emails} emails`, 'info');
    this.log(`TOP Engineering Plus: ${topEngineeringPlusCounts.companies} companies, ${topEngineeringPlusCounts.people} people, ${topEngineeringPlusCounts.actions} actions, ${topEngineeringPlusCounts.emails} emails`, 'info');

    this.log('Pre-flight validation complete', 'success');
    this.log('', 'info');
  }

  // Step 2: User Mapping Setup
  async setupUserMappings() {
    this.log('Step 2: User Mapping Setup', 'info');
    this.log('-'.repeat(70), 'info');

    for (const tempUser of TEMP_USERS) {
      // Find user in top-temp
      const topTempUser = await prisma.users.findFirst({
        where: {
          OR: [
            { email: tempUser.email },
            { username: tempUser.username },
            { name: { contains: tempUser.name.split(' ')[0], mode: 'insensitive' } }
          ]
        }
      });

      if (!topTempUser) {
        this.log(`User not found in top-temp: ${tempUser.name}`, 'warn');
        continue;
      }

      // Find or create user in TOP Engineering Plus
      let topEngineeringPlusUser = null;
      if (tempUser.targetEmail) {
        // Victoria - map 1:1 by email
        topEngineeringPlusUser = await prisma.users.findFirst({
          where: { email: tempUser.targetEmail }
        });
      } else {
        // Other users - check if exists by email/username
        topEngineeringPlusUser = await prisma.users.findFirst({
          where: {
            OR: [
              { email: tempUser.email },
              { username: tempUser.username },
              { name: { contains: tempUser.name.split(' ')[0], mode: 'insensitive' } }
            ]
          }
        });
      }

      if (!topEngineeringPlusUser) {
        if (this.dryRun) {
          this.log(`[DRY RUN] Would create user: ${tempUser.name}`, 'info');
          // Create a mock ID for dry run
          this.mappings.users[topTempUser.id] = `MOCK_${topTempUser.id}`;
        } else {
          // Create user in TOP Engineering Plus
          topEngineeringPlusUser = await prisma.users.create({
            data: {
              email: tempUser.targetEmail || tempUser.email,
              name: tempUser.name,
              username: tempUser.username,
              isActive: true
            }
          });
          this.log(`Created user: ${tempUser.name} (${topEngineeringPlusUser.id})`, 'success');
        }
      } else {
        this.log(`Found existing user: ${tempUser.name} (${topEngineeringPlusUser.id})`, 'success');
      }

      if (!this.dryRun && topEngineeringPlusUser) {
        this.mappings.users[topTempUser.id] = topEngineeringPlusUser.id;

        // Ensure workspace_users entry exists
        const workspaceUser = await prisma.workspace_users.findFirst({
          where: {
            workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
            userId: topEngineeringPlusUser.id
          }
        });

        if (!workspaceUser) {
          await prisma.workspace_users.create({
            data: {
              workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
              userId: topEngineeringPlusUser.id,
              role: 'SELLER',
              isActive: true
            }
          });
          this.log(`Created workspace_users entry for ${tempUser.name}`, 'success');
        }
      }
    }

    this.log(`User mapping complete: ${Object.keys(this.mappings.users).length} users mapped`, 'success');
    this.log('', 'info');
  }

  // Step 3: Backup TOP Engineering Plus Actions & Emails
  async backupActionsAndEmails() {
    this.log('Step 3: Backup TOP Engineering Plus Actions & Emails', 'info');
    this.log('-'.repeat(70), 'info');

    // Get all companies in TOP Engineering Plus
    const topEngineeringPlusCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        deletedAt: null
      },
      select: { id: true, name: true, domain: true, website: true, email: true }
    });

    // Get all people in TOP Engineering Plus
    const topEngineeringPlusPeople = await prisma.people.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        deletedAt: null
      },
      select: { id: true, fullName: true, email: true, workEmail: true, personalEmail: true, companyId: true }
    });

    // Backup actions for companies
    for (const company of topEngineeringPlusCompanies) {
      const actions = await prisma.actions.findMany({
        where: {
          workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
          companyId: company.id,
          deletedAt: null
        }
      });

      if (actions.length > 0) {
        this.mappings.oldCompanies[company.id] = {
          ...company,
          actions: actions,
          emails: []
        };
      }
    }

    // Backup actions for people
    for (const person of topEngineeringPlusPeople) {
      const actions = await prisma.actions.findMany({
        where: {
          workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
          personId: person.id,
          deletedAt: null
        }
      });

      if (actions.length > 0) {
        this.mappings.oldPeople[person.id] = {
          ...person,
          actions: actions,
          emails: []
        };
      }
    }

    // Backup emails for companies
    for (const companyId in this.mappings.oldCompanies) {
      const emails = await prisma.email_messages.findMany({
        where: {
          workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
          companyId: companyId
        }
      });
      this.mappings.oldCompanies[companyId].emails = emails;
    }

    // Backup emails for people
    for (const personId in this.mappings.oldPeople) {
      const emails = await prisma.email_messages.findMany({
        where: {
          workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
          personId: personId
        }
      });
      this.mappings.oldPeople[personId].emails = emails;
    }

    const totalActions = Object.values(this.mappings.oldCompanies).reduce((sum, c) => sum + c.actions.length, 0) +
                         Object.values(this.mappings.oldPeople).reduce((sum, p) => sum + p.actions.length, 0);
    const totalEmails = Object.values(this.mappings.oldCompanies).reduce((sum, c) => sum + c.emails.length, 0) +
                        Object.values(this.mappings.oldPeople).reduce((sum, p) => sum + p.emails.length, 0);

    this.log(`Backed up ${totalActions} actions and ${totalEmails} emails`, 'success');
    this.log('', 'info');
  }

  // Step 4: Transfer Companies
  async transferCompanies() {
    this.log('Step 4: Transfer Companies from top-temp to TOP Engineering Plus', 'info');
    this.log('-'.repeat(70), 'info');

    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        deletedAt: null
      }
    });

    this.log(`Found ${companies.length} companies to transfer`, 'info');

    for (const company of companies) {
      try {
        const mappedUserId = this.mappings.users[company.mainSellerId] || company.mainSellerId;

        if (this.dryRun) {
          this.log(`[DRY RUN] Would transfer company: ${company.name}`, 'info');
          this.mappings.companies[company.id] = company.id; // Same ID
          this.stats.companiesTransferred++;
        } else {
          // Update workspaceId and mainSellerId
          await prisma.companies.update({
            where: { id: company.id },
            data: {
              workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
              mainSellerId: mappedUserId,
              updatedAt: new Date()
            }
          });

          this.mappings.companies[company.id] = company.id; // Same ID (we're updating, not creating)
          this.stats.companiesTransferred++;

          if (this.stats.companiesTransferred % 100 === 0) {
            this.log(`Transferred ${this.stats.companiesTransferred} companies...`, 'info');
          }
        }
      } catch (error) {
        if (error.code === 'P2002') {
          // Unique constraint violation - skip duplicate
          this.log(`Skipping duplicate company: ${company.name}`, 'warn');
        } else {
          this.log(`Error transferring company ${company.name}: ${error.message}`, 'error');
          this.stats.errors.push({ type: 'company', id: company.id, error: error.message });
        }
      }
    }

    this.log(`Transferred ${this.stats.companiesTransferred} companies`, 'success');
    this.log('', 'info');
  }

  // Step 5: Transfer People
  async transferPeople() {
    this.log('Step 5: Transfer People from top-temp to TOP Engineering Plus', 'info');
    this.log('-'.repeat(70), 'info');

    const people = await prisma.people.findMany({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        deletedAt: null
      }
    });

    this.log(`Found ${people.length} people to transfer`, 'info');

    for (const person of people) {
      try {
        const mappedUserId = this.mappings.users[person.mainSellerId] || person.mainSellerId;
        const mappedCompanyId = person.companyId ? (this.mappings.companies[person.companyId] || null) : null;

        if (this.dryRun) {
          this.log(`[DRY RUN] Would transfer person: ${person.fullName}`, 'info');
          this.mappings.people[person.id] = person.id; // Same ID
          this.stats.peopleTransferred++;
        } else {
          // Update workspaceId, mainSellerId, and companyId
          await prisma.people.update({
            where: { id: person.id },
            data: {
              workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
              mainSellerId: mappedUserId,
              companyId: mappedCompanyId,
              updatedAt: new Date()
            }
          });

          this.mappings.people[person.id] = person.id; // Same ID (we're updating, not creating)
          this.stats.peopleTransferred++;

          if (this.stats.peopleTransferred % 100 === 0) {
            this.log(`Transferred ${this.stats.peopleTransferred} people...`, 'info');
          }
        }
      } catch (error) {
        if (error.code === 'P2002') {
          // Unique constraint violation - skip duplicate
          this.log(`Skipping duplicate person: ${person.fullName}`, 'warn');
        } else {
          this.log(`Error transferring person ${person.fullName}: ${error.message}`, 'error');
          this.stats.errors.push({ type: 'person', id: person.id, error: error.message });
        }
      }
    }

    this.log(`Transferred ${this.stats.peopleTransferred} people`, 'success');
    this.log('', 'info');
  }

  // Step 6: Reconnect Actions
  async reconnectActions() {
    this.log('Step 6: Reconnect Actions from TOP Engineering Plus', 'info');
    this.log('-'.repeat(70), 'info');

    // Get all transferred companies and people for matching
    const transferredCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        id: { in: Object.values(this.mappings.companies) }
      },
      select: { id: true, name: true, domain: true, website: true, email: true }
    });

    const transferredPeople = await prisma.people.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        id: { in: Object.values(this.mappings.people) }
      },
      select: { id: true, fullName: true, email: true, workEmail: true, personalEmail: true, companyId: true }
    });

    // Create lookup maps
    const companyMapByName = new Map();
    const companyMapByDomain = new Map();
    transferredCompanies.forEach(c => {
      companyMapByName.set(c.name.toLowerCase(), c);
      if (c.domain) companyMapByDomain.set(c.domain.toLowerCase(), c);
      if (c.website) {
        try {
          const domain = new URL(c.website).hostname.replace('www.', '');
          companyMapByDomain.set(domain.toLowerCase(), c);
        } catch (e) {}
      }
      if (c.email) {
        try {
          const domain = c.email.split('@')[1];
          if (domain) companyMapByDomain.set(domain.toLowerCase(), c);
        } catch (e) {}
      }
    });

    const personMapByEmail = new Map();
    transferredPeople.forEach(p => {
      if (p.email) personMapByEmail.set(p.email.toLowerCase(), p);
      if (p.workEmail) personMapByEmail.set(p.workEmail.toLowerCase(), p);
      if (p.personalEmail) personMapByEmail.set(p.personalEmail.toLowerCase(), p);
    });

    // Reconnect actions
    for (const oldCompanyId in this.mappings.oldCompanies) {
      const oldCompany = this.mappings.oldCompanies[oldCompanyId];
      
      for (const action of oldCompany.actions) {
        try {
          let newCompanyId = null;
          let newPersonId = null;

          // Try to match company
          if (action.companyId) {
            const match = companyMapByName.get(oldCompany.name.toLowerCase());
            if (match) {
              newCompanyId = match.id;
            } else {
              // Try domain matching if available
              for (const [domain, company] of companyMapByDomain.entries()) {
                if (oldCompany.domain && oldCompany.domain.toLowerCase().includes(domain)) {
                  newCompanyId = company.id;
                  break;
                }
              }
            }
          }

          // Try to match person
          if (action.personId) {
            const oldPerson = this.mappings.oldPeople[action.personId];
            if (oldPerson) {
              const emails = [oldPerson.email, oldPerson.workEmail, oldPerson.personalEmail].filter(Boolean);
              for (const email of emails) {
                const match = personMapByEmail.get(email.toLowerCase());
                if (match) {
                  newPersonId = match.id;
                  break;
                }
              }
            }
          }

          if (newCompanyId || newPersonId) {
            const mappedUserId = action.userId ? (this.mappings.users[action.userId] || action.userId) : action.userId;

            if (this.dryRun) {
              this.log(`[DRY RUN] Would reconnect action: ${action.subject}`, 'info');
              this.stats.actionsReconnected++;
            } else {
              await prisma.actions.update({
                where: { id: action.id },
                data: {
                  companyId: newCompanyId || action.companyId,
                  personId: newPersonId || action.personId,
                  userId: mappedUserId,
                  updatedAt: new Date()
                }
              });
              this.stats.actionsReconnected++;
            }
          } else {
            this.log(`Could not match action: ${action.subject} (company: ${oldCompany.name})`, 'warn');
          }
        } catch (error) {
          this.log(`Error reconnecting action ${action.id}: ${error.message}`, 'error');
          this.stats.errors.push({ type: 'action', id: action.id, error: error.message });
        }
      }
    }

    // Reconnect actions for people
    for (const oldPersonId in this.mappings.oldPeople) {
      const oldPerson = this.mappings.oldPeople[oldPersonId];
      
      for (const action of oldPerson.actions) {
        // Skip if already processed
        if (this.mappings.oldCompanies[action.companyId]) {
          continue;
        }

        try {
          let newPersonId = null;

          // Try to match person by email
          const emails = [oldPerson.email, oldPerson.workEmail, oldPerson.personalEmail].filter(Boolean);
          for (const email of emails) {
            const match = personMapByEmail.get(email.toLowerCase());
            if (match) {
              newPersonId = match.id;
              break;
            }
          }

          if (newPersonId) {
            const mappedUserId = action.userId ? (this.mappings.users[action.userId] || action.userId) : action.userId;

            if (this.dryRun) {
              this.log(`[DRY RUN] Would reconnect action: ${action.subject}`, 'info');
              this.stats.actionsReconnected++;
            } else {
              await prisma.actions.update({
                where: { id: action.id },
                data: {
                  personId: newPersonId,
                  userId: mappedUserId,
                  updatedAt: new Date()
                }
              });
              this.stats.actionsReconnected++;
            }
          } else {
            this.log(`Could not match action: ${action.subject} (person: ${oldPerson.fullName})`, 'warn');
          }
        } catch (error) {
          this.log(`Error reconnecting action ${action.id}: ${error.message}`, 'error');
          this.stats.errors.push({ type: 'action', id: action.id, error: error.message });
        }
      }
    }

    this.log(`Reconnected ${this.stats.actionsReconnected} actions`, 'success');
    this.log('', 'info');
  }

  // Step 7: Reconnect Emails
  async reconnectEmails() {
    this.log('Step 7: Reconnect Emails from TOP Engineering Plus', 'info');
    this.log('-'.repeat(70), 'info');

    // Get all transferred companies and people for matching
    const transferredCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        id: { in: Object.values(this.mappings.companies) }
      },
      select: { id: true, name: true, domain: true, website: true, email: true }
    });

    const transferredPeople = await prisma.people.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        id: { in: Object.values(this.mappings.people) }
      },
      select: { id: true, fullName: true, email: true, workEmail: true, personalEmail: true }
    });

    // Create lookup maps
    const companyMapByDomain = new Map();
    transferredCompanies.forEach(c => {
      if (c.domain) companyMapByDomain.set(c.domain.toLowerCase(), c);
      if (c.website) {
        try {
          const domain = new URL(c.website).hostname.replace('www.', '');
          companyMapByDomain.set(domain.toLowerCase(), c);
        } catch (e) {}
      }
      if (c.email) {
        try {
          const domain = c.email.split('@')[1];
          if (domain) companyMapByDomain.set(domain.toLowerCase(), c);
        } catch (e) {}
      }
    });

    const personMapByEmail = new Map();
    transferredPeople.forEach(p => {
      if (p.email) personMapByEmail.set(p.email.toLowerCase(), p);
      if (p.workEmail) personMapByEmail.set(p.workEmail.toLowerCase(), p);
      if (p.personalEmail) personMapByEmail.set(p.personalEmail.toLowerCase(), p);
    });

    // Helper function to extract domain from email
    const extractDomain = (email) => {
      try {
        return email.split('@')[1]?.toLowerCase();
      } catch (e) {
        return null;
      }
    };

    // Reconnect emails for companies
    for (const oldCompanyId in this.mappings.oldCompanies) {
      const oldCompany = this.mappings.oldCompanies[oldCompanyId];
      
      for (const email of oldCompany.emails) {
        try {
          let newCompanyId = null;
          let newPersonId = null;

          // Try to match company by domain from email
          const emailDomain = extractDomain(email.from);
          if (emailDomain) {
            newCompanyId = companyMapByDomain.get(emailDomain)?.id || null;
          }

          // Try to match person by email
          const personMatch = personMapByEmail.get(email.from.toLowerCase());
          if (personMatch) {
            newPersonId = personMatch.id;
          }

          // Also check 'to' field
          if (email.to && email.to.length > 0) {
            for (const toEmail of email.to) {
              const toPersonMatch = personMapByEmail.get(toEmail.toLowerCase());
              if (toPersonMatch) {
                newPersonId = toPersonMatch.id;
                break;
              }
            }
          }

          if (newCompanyId || newPersonId) {
            if (this.dryRun) {
              this.log(`[DRY RUN] Would reconnect email: ${email.subject}`, 'info');
              this.stats.emailsReconnected++;
            } else {
              await prisma.email_messages.update({
                where: { id: email.id },
                data: {
                  companyId: newCompanyId || email.companyId,
                  personId: newPersonId || email.personId,
                  updatedAt: new Date()
                }
              });
              this.stats.emailsReconnected++;
            }
          } else {
            this.log(`Could not match email: ${email.subject} (from: ${email.from})`, 'warn');
          }
        } catch (error) {
          this.log(`Error reconnecting email ${email.id}: ${error.message}`, 'error');
          this.stats.errors.push({ type: 'email', id: email.id, error: error.message });
        }
      }
    }

    // Reconnect emails for people
    for (const oldPersonId in this.mappings.oldPeople) {
      const oldPerson = this.mappings.oldPeople[oldPersonId];
      
      for (const email of oldPerson.emails) {
        // Skip if already processed
        if (this.mappings.oldCompanies[email.companyId]) {
          continue;
        }

        try {
          let newPersonId = null;

          // Try to match person by email
          const emails = [oldPerson.email, oldPerson.workEmail, oldPerson.personalEmail].filter(Boolean);
          for (const personEmail of emails) {
            if (email.from.toLowerCase() === personEmail.toLowerCase()) {
              const match = personMapByEmail.get(personEmail.toLowerCase());
              if (match) {
                newPersonId = match.id;
                break;
              }
            }
          }

          if (newPersonId) {
            if (this.dryRun) {
              this.log(`[DRY RUN] Would reconnect email: ${email.subject}`, 'info');
              this.stats.emailsReconnected++;
            } else {
              await prisma.email_messages.update({
                where: { id: email.id },
                data: {
                  personId: newPersonId,
                  updatedAt: new Date()
                }
              });
              this.stats.emailsReconnected++;
            }
          } else {
            this.log(`Could not match email: ${email.subject} (person: ${oldPerson.fullName})`, 'warn');
          }
        } catch (error) {
          this.log(`Error reconnecting email ${email.id}: ${error.message}`, 'error');
          this.stats.errors.push({ type: 'email', id: email.id, error: error.message });
        }
      }
    }

    this.log(`Reconnected ${this.stats.emailsReconnected} emails`, 'success');
    this.log('', 'info');
  }

  // Step 8: Transfer Related Data
  async transferRelatedData() {
    this.log('Step 8: Transfer Related Data', 'info');
    this.log('-'.repeat(70), 'info');

    // Transfer person_co_sellers
    // First get all people in top-temp, then get their co-sellers
    const topTempPeople = await prisma.people.findMany({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        deletedAt: null
      },
      select: { id: true }
    });
    
    const topTempPersonIds = topTempPeople.map(p => p.id);
    
    const personCoSellers = topTempPersonIds.length > 0 ? await prisma.person_co_sellers.findMany({
      where: {
        personId: { in: topTempPersonIds }
      }
    }) : [];

    for (const coSeller of personCoSellers) {
      try {
        const newPersonId = this.mappings.people[coSeller.personId];
        const newUserId = this.mappings.users[coSeller.userId] || coSeller.userId;

        if (newPersonId) {
          if (this.dryRun) {
            this.log(`[DRY RUN] Would transfer person_co_seller for person ${coSeller.personId}`, 'info');
            this.stats.relatedDataTransferred++;
          } else {
            // Check if already exists
            const existing = await prisma.person_co_sellers.findFirst({
              where: {
                personId: newPersonId,
                userId: newUserId
              }
            });

            if (!existing) {
              await prisma.person_co_sellers.create({
                data: {
                  personId: newPersonId,
                  userId: newUserId
                }
              });
              this.stats.relatedDataTransferred++;
            }
          }
        }
      } catch (error) {
        this.log(`Error transferring person_co_seller ${coSeller.id}: ${error.message}`, 'error');
      }
    }

    // Transfer reminders
    let reminders = [];
    try {
      reminders = await prisma.reminders.findMany({
        where: {
          workspaceId: TOP_TEMP_WORKSPACE_ID,
          deletedAt: null
        }
      });
    } catch (error) {
      this.log(`Skipping reminders transfer: ${error.message}`, 'warn');
    }

    for (const reminder of reminders) {
      try {
        let newEntityId = null;
        if (reminder.entityType === 'people') {
          newEntityId = this.mappings.people[reminder.entityId];
        } else if (reminder.entityType === 'companies') {
          newEntityId = this.mappings.companies[reminder.entityId];
        }

        if (newEntityId) {
          if (this.dryRun) {
            this.log(`[DRY RUN] Would transfer reminder for ${reminder.entityType} ${reminder.entityId}`, 'info');
            this.stats.relatedDataTransferred++;
          } else {
            await prisma.reminders.update({
              where: { id: reminder.id },
              data: {
                workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
                entityId: newEntityId,
                updatedAt: new Date()
              }
            });
            this.stats.relatedDataTransferred++;
          }
        }
      } catch (error) {
        this.log(`Error transferring reminder ${reminder.id}: ${error.message}`, 'error');
      }
    }

    // Transfer documents
    let documents = [];
    try {
      documents = await prisma.documents.findMany({
        where: {
          workspaceId: TOP_TEMP_WORKSPACE_ID
        }
      });
    } catch (error) {
      this.log(`Skipping documents transfer: ${error.message}`, 'warn');
    }

    for (const document of documents) {
      try {
        const newCompanyId = document.companyId ? (this.mappings.companies[document.companyId] || null) : null;
        const newPersonId = document.personId ? (this.mappings.people[document.personId] || null) : null;

        if (newCompanyId || newPersonId) {
          if (this.dryRun) {
            this.log(`[DRY RUN] Would transfer document: ${document.title}`, 'info');
            this.stats.relatedDataTransferred++;
          } else {
            await prisma.documents.update({
              where: { id: document.id },
              data: {
                workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
                companyId: newCompanyId || document.companyId,
                personId: newPersonId || document.personId,
                updatedAt: new Date()
              }
            });
            this.stats.relatedDataTransferred++;
          }
        }
      } catch (error) {
        this.log(`Error transferring document ${document.id}: ${error.message}`, 'error');
      }
    }

    // Transfer meeting_transcripts
    let meetingTranscripts = [];
    try {
      meetingTranscripts = await prisma.meeting_transcripts.findMany({
        where: {
          workspaceId: TOP_TEMP_WORKSPACE_ID
        }
      });
    } catch (error) {
      this.log(`Skipping meeting_transcripts transfer: ${error.message}`, 'warn');
    }

    for (const transcript of meetingTranscripts) {
      try {
        const newCompanyId = transcript.linkedCompanyId ? (this.mappings.companies[transcript.linkedCompanyId] || null) : null;

        if (newCompanyId) {
          if (this.dryRun) {
            this.log(`[DRY RUN] Would transfer meeting transcript: ${transcript.meetingTitle || transcript.id}`, 'info');
            this.stats.relatedDataTransferred++;
          } else {
            await prisma.meeting_transcripts.update({
              where: { id: transcript.id },
              data: {
                workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
                linkedCompanyId: newCompanyId,
                updatedAt: new Date()
              }
            });
            this.stats.relatedDataTransferred++;
          }
        }
      } catch (error) {
        this.log(`Error transferring meeting transcript ${transcript.id}: ${error.message}`, 'error');
      }
    }

    this.log(`Transferred ${this.stats.relatedDataTransferred} related data records`, 'success');
    this.log('', 'info');
  }

  // Step 9: Clean Up TOP Engineering Plus
  async cleanupTopEngineeringPlus() {
    this.log('Step 9: Clean Up TOP Engineering Plus (Soft Delete Old Data)', 'info');
    this.log('-'.repeat(70), 'info');

    // Get all company IDs that were transferred
    const transferredCompanyIds = new Set(Object.values(this.mappings.companies));
    const transferredPersonIds = new Set(Object.values(this.mappings.people));

    // Soft delete companies not in transfer mapping
    const companiesToDelete = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        deletedAt: null,
        NOT: {
          id: { in: Array.from(transferredCompanyIds) }
        }
      },
      select: { id: true, name: true }
    });

    this.log(`Found ${companiesToDelete.length} companies to soft delete`, 'info');

    for (const company of companiesToDelete) {
      try {
        if (this.dryRun) {
          this.log(`[DRY RUN] Would soft delete company: ${company.name}`, 'info');
          this.stats.companiesDeleted++;
        } else {
          await prisma.companies.update({
            where: { id: company.id },
            data: {
              deletedAt: new Date(),
              updatedAt: new Date()
            }
          });
          this.stats.companiesDeleted++;
        }
      } catch (error) {
        this.log(`Error soft deleting company ${company.id}: ${error.message}`, 'error');
      }
    }

    // Soft delete people not in transfer mapping
    const peopleToDelete = await prisma.people.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        deletedAt: null,
        NOT: {
          id: { in: Array.from(transferredPersonIds) }
        }
      },
      select: { id: true, fullName: true }
    });

    this.log(`Found ${peopleToDelete.length} people to soft delete`, 'info');

    for (const person of peopleToDelete) {
      try {
        if (this.dryRun) {
          this.log(`[DRY RUN] Would soft delete person: ${person.fullName}`, 'info');
          this.stats.peopleDeleted++;
        } else {
          await prisma.people.update({
            where: { id: person.id },
            data: {
              deletedAt: new Date(),
              updatedAt: new Date()
            }
          });
          this.stats.peopleDeleted++;
        }
      } catch (error) {
        this.log(`Error soft deleting person ${person.id}: ${error.message}`, 'error');
      }
    }

    this.log(`Soft deleted ${this.stats.companiesDeleted} companies and ${this.stats.peopleDeleted} people`, 'success');
    this.log('', 'info');
  }

  // Step 10: Clean Up top-temp
  async cleanupTopTemp() {
    this.log('Step 10: Clean Up top-temp (Soft Delete Transferred Data)', 'info');
    this.log('-'.repeat(70), 'info');

    // Soft delete all transferred companies
    const transferredCompanyIds = Object.keys(this.mappings.companies);
    
    if (this.dryRun) {
      this.log(`[DRY RUN] Would soft delete ${transferredCompanyIds.length} companies in top-temp`, 'info');
    } else {
      await prisma.companies.updateMany({
        where: {
          workspaceId: TOP_TEMP_WORKSPACE_ID,
          id: { in: transferredCompanyIds },
          deletedAt: null
        },
        data: {
          deletedAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

    // Soft delete all transferred people
    const transferredPersonIds = Object.keys(this.mappings.people);
    
    if (this.dryRun) {
      this.log(`[DRY RUN] Would soft delete ${transferredPersonIds.length} people in top-temp`, 'info');
    } else {
      await prisma.people.updateMany({
        where: {
          workspaceId: TOP_TEMP_WORKSPACE_ID,
          id: { in: transferredPersonIds },
          deletedAt: null
        },
        data: {
          deletedAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

    this.log(`Soft deleted transferred data in top-temp`, 'success');
    this.log('', 'info');
  }

  // Step 11: Verification & Reporting
  async verificationAndReporting() {
    this.log('Step 11: Verification & Reporting', 'info');
    this.log('-'.repeat(70), 'info');

    // Count records in TOP Engineering Plus
    const finalCounts = {
      companies: await prisma.companies.count({
        where: { workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID, deletedAt: null }
      }),
      people: await prisma.people.count({
        where: { workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID, deletedAt: null }
      }),
      actions: await prisma.actions.count({
        where: { workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID, deletedAt: null }
      }),
      emails: await prisma.email_messages.count({
        where: { workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID }
      })
    };

    this.log(`Final counts in TOP Engineering Plus:`, 'info');
    this.log(`  Companies: ${finalCounts.companies}`, 'info');
    this.log(`  People: ${finalCounts.people}`, 'info');
    this.log(`  Actions: ${finalCounts.actions}`, 'info');
    this.log(`  Emails: ${finalCounts.emails}`, 'info');

    // Verify relationships
    const peopleWithInvalidCompanies = await prisma.people.count({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        deletedAt: null,
        companyId: { not: null },
        company: null
      }
    });

    if (peopleWithInvalidCompanies > 0) {
      this.log(`Warning: ${peopleWithInvalidCompanies} people have invalid company references`, 'warn');
    } else {
      this.log(`All people-company relationships are valid`, 'success');
    }

    // Check for orphaned actions
    const orphanedActions = await prisma.actions.count({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        deletedAt: null,
        OR: [
          { companyId: { not: null }, company: null },
          { personId: { not: null }, person: null }
        ]
      }
    });

    if (orphanedActions > 0) {
      this.log(`Warning: ${orphanedActions} actions have invalid references`, 'warn');
    } else {
      this.log(`All action references are valid`, 'success');
    }

    // Check for orphaned emails
    const orphanedEmails = await prisma.email_messages.count({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        OR: [
          { companyId: { not: null }, company: null },
          { personId: { not: null }, person: null }
        ]
      }
    });

    if (orphanedEmails > 0) {
      this.log(`Warning: ${orphanedEmails} emails have invalid references`, 'warn');
    } else {
      this.log(`All email references are valid`, 'success');
    }

    this.log('', 'info');
  }

  printSummary() {
    this.log('='.repeat(70), 'info');
    this.log('TRANSFER SUMMARY', 'info');
    this.log('='.repeat(70), 'info');
    this.log(`Companies transferred: ${this.stats.companiesTransferred}`, 'info');
    this.log(`People transferred: ${this.stats.peopleTransferred}`, 'info');
    this.log(`Actions reconnected: ${this.stats.actionsReconnected}`, 'info');
    this.log(`Emails reconnected: ${this.stats.emailsReconnected}`, 'info');
    this.log(`Related data transferred: ${this.stats.relatedDataTransferred}`, 'info');
    this.log(`Companies deleted (TOP Engineering Plus): ${this.stats.companiesDeleted}`, 'info');
    this.log(`People deleted (TOP Engineering Plus): ${this.stats.peopleDeleted}`, 'info');
    
    if (this.stats.errors.length > 0) {
      this.log(`Errors: ${this.stats.errors.length}`, 'error');
      this.stats.errors.slice(0, 10).forEach(err => {
        this.log(`  - ${err.type} ${err.id}: ${err.error}`, 'error');
      });
      if (this.stats.errors.length > 10) {
        this.log(`  ... and ${this.stats.errors.length - 10} more errors`, 'error');
      }
    }
    
    this.log('='.repeat(70), 'info');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  const transfer = new TopTempTransfer({ dryRun });
  
  try {
    await transfer.execute();
    process.exit(0);
  } catch (error) {
    console.error('Transfer failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = TopTempTransfer;

