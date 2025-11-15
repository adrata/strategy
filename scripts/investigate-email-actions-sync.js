/**
 * 🔍 INVESTIGATE: Email Messages to Actions Sync
 * 
 * This script investigates the relationship between email_messages and actions
 * to understand why more actions weren't synced.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TOP_ENGINEERING_PLUS_WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';

class InvestigateEmailActionsSync {
  constructor() {
    this.stats = {
      totalEmails: 0,
      emailsWithPersonId: 0,
      emailsWithCompanyId: 0,
      emailsWithBoth: 0,
      emailsWithPersonButNoCompany: 0,
      totalActions: 0,
      actionsFromEmails: 0,
      emailsWithoutActions: 0,
      peopleWithEmails: {},
      companiesWithEmails: {}
    };
  }

  log(message, type = 'info') {
    const prefix = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} ${message}`);
  }

  async run() {
    try {
      this.log('INVESTIGATING EMAIL MESSAGES TO ACTIONS SYNC', 'info');
      this.log('='.repeat(60), 'info');
      
      await this.analyzeEmailMessages();
      await this.analyzeActions();
      await this.findMissingActions();
      await this.checkPeopleWithoutCompanies();
      
      this.printSummary();
    } catch (error) {
      this.log(`Error during investigation: ${error.message}`, 'error');
      console.error(error);
    } finally {
      await prisma.$disconnect();
    }
  }

  async analyzeEmailMessages() {
    this.log('\n📧 Analyzing Email Messages', 'info');
    
    const allEmails = await prisma.email_messages.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID
      },
      select: {
        id: true,
        personId: true,
        companyId: true,
        from: true,
        subject: true
      }
    });

    this.stats.totalEmails = allEmails.length;
    this.log(`Total email_messages: ${allEmails.length.toLocaleString()}`, 'info');

    for (const email of allEmails) {
      const hasPersonId = !!email.personId;
      const hasCompanyId = !!email.companyId;
      
      if (hasPersonId) this.stats.emailsWithPersonId++;
      if (hasCompanyId) this.stats.emailsWithCompanyId++;
      if (hasPersonId && hasCompanyId) this.stats.emailsWithBoth++;
      if (hasPersonId && !hasCompanyId) this.stats.emailsWithPersonButNoCompany++;
    }

    this.log(`  Emails with personId: ${this.stats.emailsWithPersonId.toLocaleString()}`, 'info');
    this.log(`  Emails with companyId: ${this.stats.emailsWithCompanyId.toLocaleString()}`, 'info');
    this.log(`  Emails with both: ${this.stats.emailsWithBoth.toLocaleString()}`, 'info');
    this.log(`  Emails with personId but no companyId: ${this.stats.emailsWithPersonButNoCompany.toLocaleString()}`, 'warn');

    // Group by person
    const emailsByPerson = {};
    for (const email of allEmails) {
      if (email.personId) {
        if (!emailsByPerson[email.personId]) {
          emailsByPerson[email.personId] = [];
        }
        emailsByPerson[email.personId].push(email);
      }
    }

    // Get person details for top email recipients
    const personIds = Object.keys(emailsByPerson);
    const people = await prisma.people.findMany({
      where: {
        id: { in: personIds },
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID
      },
      select: {
        id: true,
        fullName: true,
        companyId: true,
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    this.log(`\n  Top people by email count:`, 'info');
    const sortedPeople = people
      .map(p => ({
        ...p,
        emailCount: emailsByPerson[p.id].length,
        emailsWithCompany: emailsByPerson[p.id].filter(e => e.companyId).length
      }))
      .sort((a, b) => b.emailCount - a.emailCount)
      .slice(0, 10);

    for (const person of sortedPeople) {
      const hasCompany = !!person.companyId;
      const companyName = person.company?.name || 'NO COMPANY';
      this.log(`    ${person.fullName}: ${person.emailCount} emails, ${person.emailsWithCompany} with companyId, Company: ${companyName}`, hasCompany ? 'info' : 'warn');
      this.stats.peopleWithEmails[person.id] = {
        name: person.fullName,
        emailCount: person.emailCount,
        emailsWithCompany: person.emailsWithCompany,
        hasCompany: hasCompany,
        companyName: companyName
      };
    }
  }

  async analyzeActions() {
    this.log('\n📋 Analyzing Actions', 'info');
    
    const allActions = await prisma.actions.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        deletedAt: null
      },
      select: {
        id: true,
        type: true,
        personId: true,
        companyId: true
      }
    });

    this.stats.totalActions = allActions.length;
    this.log(`Total actions: ${allActions.length.toLocaleString()}`, 'info');

    const emailActions = allActions.filter(a => a.type === 'EMAIL' || a.type === 'email_sent' || a.type === 'email_received' || a.type === 'email_conversation');
    this.stats.actionsFromEmails = emailActions.length;
    this.log(`  Email-type actions: ${emailActions.length.toLocaleString()}`, 'info');
    this.log(`  Actions with personId: ${allActions.filter(a => a.personId).length.toLocaleString()}`, 'info');
    this.log(`  Actions with companyId: ${allActions.filter(a => a.companyId).length.toLocaleString()}`, 'info');
    this.log(`  Actions with both: ${allActions.filter(a => a.personId && a.companyId).length.toLocaleString()}`, 'info');
  }

  async findMissingActions() {
    this.log('\n🔍 Finding Emails Without Actions', 'info');
    
    // Get all emails with personId
    const emailsWithPerson = await prisma.email_messages.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        personId: { not: null }
      },
      select: {
        id: true,
        personId: true,
        companyId: true,
        subject: true,
        receivedAt: true
      }
    });

    this.log(`  Emails with personId: ${emailsWithPerson.length.toLocaleString()}`, 'info');

    // Check which emails don't have corresponding actions
    let emailsWithoutActions = 0;
    const sampleMissing = [];

    for (const email of emailsWithPerson.slice(0, 100)) { // Check first 100 for performance
      const actionExists = await prisma.actions.findFirst({
        where: {
          workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
          personId: email.personId,
          type: 'EMAIL',
          subject: email.subject,
          completedAt: email.receivedAt
        }
      });

      if (!actionExists) {
        emailsWithoutActions++;
        if (sampleMissing.length < 10) {
          sampleMissing.push(email);
        }
      }
    }

    this.stats.emailsWithoutActions = emailsWithoutActions;
    this.log(`  Sample check: ${emailsWithoutActions} emails (out of 100 checked) don't have actions`, emailsWithoutActions > 0 ? 'warn' : 'info');
    
    if (sampleMissing.length > 0) {
      this.log(`  Sample emails without actions:`, 'warn');
      for (const email of sampleMissing.slice(0, 5)) {
        this.log(`    - ${email.subject} (personId: ${email.personId})`, 'warn');
      }
    }
  }

  async checkPeopleWithoutCompanies() {
    this.log('\n👥 Checking People Without Companies', 'info');
    
    // Get people with emails but no companyId
    const peopleWithEmailsNoCompany = await prisma.people.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        deletedAt: null,
        companyId: null,
        emails: {
          some: {
            workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID
          }
        }
      },
      select: {
        id: true,
        fullName: true,
        workEmail: true,
        personalEmail: true,
        _count: {
          select: {
            emails: {
              where: {
                workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID
              }
            },
            actions: {
              where: {
                deletedAt: null
              }
            }
          }
        }
      }
    });

    this.log(`  People with emails but no companyId: ${peopleWithEmailsNoCompany.length.toLocaleString()}`, 'warn');
    
    if (peopleWithEmailsNoCompany.length > 0) {
      this.log(`  Top people without companies:`, 'warn');
      for (const person of peopleWithEmailsNoCompany.slice(0, 10)) {
        this.log(`    ${person.fullName}: ${person._count.emails} emails, ${person._count.actions} actions`, 'warn');
      }
    }
  }

  printSummary() {
    this.log('\n' + '='.repeat(60), 'info');
    this.log('INVESTIGATION SUMMARY', 'info');
    this.log('='.repeat(60), 'info');
    
    this.log(`\n📧 Email Messages:`, 'info');
    this.log(`  Total: ${this.stats.totalEmails.toLocaleString()}`, 'info');
    this.log(`  With personId: ${this.stats.emailsWithPersonId.toLocaleString()}`, 'info');
    this.log(`  With companyId: ${this.stats.emailsWithCompanyId.toLocaleString()}`, 'info');
    this.log(`  With personId but no companyId: ${this.stats.emailsWithPersonButNoCompany.toLocaleString()}`, 'warn');
    
    this.log(`\n📋 Actions:`, 'info');
    this.log(`  Total: ${this.stats.totalActions.toLocaleString()}`, 'info');
    this.log(`  Email-type: ${this.stats.actionsFromEmails.toLocaleString()}`, 'info');
    
    this.log(`\n⚠️  Issues:`, 'warn');
    this.log(`  - ${this.stats.emailsWithPersonButNoCompany.toLocaleString()} emails have personId but no companyId`, 'warn');
    this.log(`  - This means ${this.stats.emailsWithPersonButNoCompany.toLocaleString()} emails can't create actions with companyId`, 'warn');
    this.log(`  - People without companyId can't have their actions synced to companies`, 'warn');
    
    this.log(`\n✅ Recommendations:`, 'success');
    this.log(`  1. Link people to companies based on email domain`, 'info');
    this.log(`  2. Update email_messages to include companyId when person has company`, 'info');
    this.log(`  3. Create actions from email_messages that don't have actions yet`, 'info');
    this.log(`  4. Sync actions to companies after people are linked`, 'info');
  }
}

// Run the investigation
if (require.main === module) {
  const investigation = new InvestigateEmailActionsSync();
  investigation.run().catch(console.error);
}

module.exports = InvestigateEmailActionsSync;

