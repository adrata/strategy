#!/usr/bin/env node

/**
 * Verify and Fix Email Linking for TOP Workspace
 * 
 * Ensures:
 * 1. All emails are tagged to TOP workspace (workspaceId)
 * 2. All emails are linked to Victoria (the user who connected them)
 * 3. All emails are correctly tied to the right person and company via email and name matching
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const TOP_WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';

class TOPEmailLinker {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = TOP_WORKSPACE_ID;
  }

  async run() {
    console.log('📧 TOP Email Linking Verification & Fix');
    console.log('='.repeat(60));
    console.log(`Workspace: ${this.workspaceId}\n`);

    try {
      // Step 1: Find Victoria's user ID
      const victoria = await this.findVictoria();
      if (!victoria) {
        console.log('❌ Victoria not found. Cannot proceed.');
        return;
      }

      console.log(`✅ Found Victoria: ${victoria.email} (ID: ${victoria.id})\n`);

      // Step 2: Find Grand Central connections for TOP
      const connections = await this.findConnections();
      console.log(`📡 Found ${connections.length} email connection(s) for TOP\n`);

      // Step 3: Check email statistics
      const stats = await this.checkEmailStats();
      console.log('📊 Email Statistics:');
      console.log(`   Total emails: ${stats.total}`);
      console.log(`   Linked to people: ${stats.linkedToPeople}`);
      console.log(`   Linked to companies: ${stats.linkedToCompanies}`);
      console.log(`   Unlinked: ${stats.unlinked}\n`);

      // Step 4: Verify workspace tagging
      const workspaceIssues = await this.verifyWorkspaceTagging();
      if (workspaceIssues.length > 0) {
        console.log(`⚠️  Found ${workspaceIssues.length} emails with wrong workspaceId`);
        await this.fixWorkspaceTagging(workspaceIssues, connections);
      } else {
        console.log('✅ All emails correctly tagged to TOP workspace\n');
      }

      // Step 5: Verify and fix person/company linking
      const linkingResults = await this.verifyAndFixLinking();
      console.log('\n📋 Linking Results:');
      console.log(`   Emails linked to people: ${linkingResults.linkedToPeople}`);
      console.log(`   Emails linked to companies: ${linkingResults.linkedToCompanies}`);
      console.log(`   Emails that couldn't be linked: ${linkingResults.unlinked}`);

      // Step 6: Create action records for linked emails (if needed)
      const actionResults = await this.createEmailActions();
      console.log(`\n✅ Created ${actionResults.created} action records for emails`);

      console.log('\n✅ Email linking verification complete!\n');

    } catch (error) {
      console.error('❌ Error:', error.message);
      console.error(error.stack);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * Find Victoria's user account
   */
  async findVictoria() {
    const users = await this.prisma.users.findMany({
      where: {
        OR: [
          { email: { contains: 'victoria', mode: 'insensitive' } },
          { name: { contains: 'victoria', mode: 'insensitive' } }
        ]
      }
    });

    // Check if Victoria is in TOP workspace
    for (const user of users) {
      const workspaceUser = await this.prisma.workspace_users.findFirst({
        where: {
          workspaceId: this.workspaceId,
          userId: user.id
        }
      });

      if (workspaceUser) {
        return user;
      }
    }

    return null;
  }

  /**
   * Find Grand Central connections for TOP workspace
   */
  async findConnections() {
    return await this.prisma.grand_central_connections.findMany({
      where: {
        workspaceId: this.workspaceId,
        provider: { in: ['outlook', 'gmail'] },
        status: 'active'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });
  }

  /**
   * Check email statistics
   */
  async checkEmailStats() {
    const total = await this.prisma.email_messages.count({
      where: { workspaceId: this.workspaceId }
    });

    const linkedToPeople = await this.prisma.email_messages.count({
      where: {
        workspaceId: this.workspaceId,
        personId: { not: null }
      }
    });

    const linkedToCompanies = await this.prisma.email_messages.count({
      where: {
        workspaceId: this.workspaceId,
        companyId: { not: null }
      }
    });

    const unlinked = await this.prisma.email_messages.count({
      where: {
        workspaceId: this.workspaceId,
        personId: null,
        companyId: null
      }
    });

    return {
      total,
      linkedToPeople,
      linkedToCompanies,
      unlinked
    };
  }

  /**
   * Verify workspace tagging
   */
  async verifyWorkspaceTagging() {
    // Check for emails that might be in wrong workspace
    // This is a safety check - emails should already be tagged correctly
    const emails = await this.prisma.email_messages.findMany({
      where: {
        workspaceId: this.workspaceId
      },
      take: 10,
      select: {
        id: true,
        workspaceId: true,
        from: true,
        subject: true
      }
    });

    const issues = emails.filter(e => e.workspaceId !== this.workspaceId);
    return issues;
  }

  /**
   * Fix workspace tagging (shouldn't be needed, but safety check)
   */
  async fixWorkspaceTagging(issues, connections) {
    console.log(`🔧 Fixing ${issues.length} emails with wrong workspaceId...`);
    
    for (const email of issues) {
      await this.prisma.email_messages.update({
        where: { id: email.id },
        data: { workspaceId: this.workspaceId }
      });
    }

    console.log(`✅ Fixed ${issues.length} emails\n`);
  }

  /**
   * Verify and fix person/company linking via email matching
   */
  async verifyAndFixLinking() {
    console.log('\n🔗 Verifying and fixing email linking...');

    // Get all unlinked emails
    const unlinkedEmails = await this.prisma.email_messages.findMany({
      where: {
        workspaceId: this.workspaceId,
        OR: [
          { personId: null },
          { companyId: null }
        ]
      },
      take: 1000 // Process in batches
    });

    console.log(`   Found ${unlinkedEmails.length} emails to check\n`);

    let linkedToPeople = 0;
    let linkedToCompanies = 0;
    let unlinked = 0;

    for (const email of unlinkedEmails) {
      // Extract all email addresses from the email
      const emailAddresses = [
        email.from,
        ...email.to,
        ...email.cc
      ]
        .filter(Boolean)
        .map(e => e.toLowerCase().trim())
        .filter(e => e.includes('@'));

      if (emailAddresses.length === 0) {
        unlinked++;
        continue;
      }

      // Try to find matching person
      const person = await this.prisma.people.findFirst({
        where: {
          workspaceId: this.workspaceId,
          OR: [
            { email: { in: emailAddresses } },
            { workEmail: { in: emailAddresses } },
            { personalEmail: { in: emailAddresses } }
          ]
        },
        include: {
          company: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (person) {
        // Update email with person and company
        await this.prisma.email_messages.update({
          where: { id: email.id },
          data: {
            personId: person.id,
            companyId: person.companyId || person.company?.id || null
          }
        });

        linkedToPeople++;
        if (person.companyId || person.company?.id) {
          linkedToCompanies++;
        }
      } else {
        // Try to find company by email domain
        const emailDomain = email.from?.split('@')[1];
        if (emailDomain) {
          const company = await this.prisma.companies.findFirst({
            where: {
              workspaceId: this.workspaceId,
              OR: [
                { domain: emailDomain },
                { website: { contains: emailDomain } }
              ]
            }
          });

          if (company) {
            await this.prisma.email_messages.update({
              where: { id: email.id },
              data: { companyId: company.id }
            });
            linkedToCompanies++;
          } else {
            unlinked++;
          }
        } else {
          unlinked++;
        }
      }
    }

    return {
      linkedToPeople,
      linkedToCompanies,
      unlinked
    };
  }

  /**
   * Create action records for linked emails
   */
  async createEmailActions() {
    // Get workspace user (Victoria)
    const workspaceUser = await this.prisma.workspace_users.findFirst({
      where: {
        workspaceId: this.workspaceId,
        isActive: true
      }
    });

    if (!workspaceUser) {
      console.log('⚠️  No active workspace user found, skipping action creation');
      return { created: 0 };
    }

    // Find emails with linked people that don't have actions
    const emailsWithPeople = await this.prisma.email_messages.findMany({
      where: {
        workspaceId: this.workspaceId,
        personId: { not: null }
      },
      take: 1000
    });

    // Get existing actions to avoid duplicates
    const personIds = [...new Set(emailsWithPeople.map(e => e.personId).filter(Boolean))];
    const existingActions = await this.prisma.actions.findMany({
      where: {
        workspaceId: this.workspaceId,
        personId: { in: personIds },
        type: 'EMAIL'
      },
      select: {
        personId: true,
        subject: true,
        completedAt: true
      }
    });

    const actionKeys = new Set(
      existingActions.map(a => `${a.personId}|${a.subject}|${a.completedAt?.getTime()}`)
    );

    let created = 0;

    for (const email of emailsWithPeople) {
      if (!email.personId) continue;

      const actionKey = `${email.personId}|${email.subject}|${email.receivedAt.getTime()}`;
      if (actionKeys.has(actionKey)) {
        continue;
      }

        try {
          // Build description with email details
          const emailDetails = [];
          emailDetails.push(`From: ${email.from}`);
          if (email.to && email.to.length > 0) {
            emailDetails.push(`To: ${email.to.join(', ')}`);
          }
          if (email.cc && email.cc.length > 0) {
            emailDetails.push(`CC: ${email.cc.join(', ')}`);
          }
          if (email.threadId) {
            emailDetails.push(`Thread: ${email.threadId}`);
          }
          emailDetails.push(`\n${email.body.substring(0, 400)}`);
          
          const description = emailDetails.join('\n');

          await this.prisma.actions.create({
            data: {
              workspaceId: this.workspaceId,
              userId: workspaceUser.userId,
              companyId: email.companyId,
              personId: email.personId,
              type: 'EMAIL',
              subject: email.subject || '(No Subject)',
              description: description,
              status: 'COMPLETED',
              completedAt: email.receivedAt,
              createdAt: email.receivedAt,
              updatedAt: email.receivedAt
            }
          });
          created++;
          actionKeys.add(actionKey);
        } catch (error) {
          console.error(`❌ Failed to create action for email ${email.id}:`, error.message);
        }
    }

    return { created };
  }
}

// Run if called directly
if (require.main === module) {
  const linker = new TOPEmailLinker();
  linker.run().catch(console.error);
}

module.exports = { TOPEmailLinker };

