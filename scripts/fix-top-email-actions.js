#!/usr/bin/env node

/**
 * Fix TOP Email Actions - Add Email Details
 * 
 * Updates existing email actions to include:
 * - Email addresses (from/to/cc)
 * - Thread ID
 * - Clear indication of who the email was with
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const TOP_WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';

class TOPEmailActionsFixer {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = TOP_WORKSPACE_ID;
  }

  async run() {
    console.log('🔧 Fixing TOP Email Actions');
    console.log('='.repeat(70));
    console.log(`Workspace: ${this.workspaceId}\n`);

    try {
      // Get all EMAIL actions
      const actions = await this.prisma.actions.findMany({
        where: {
          workspaceId: this.workspaceId,
          type: 'EMAIL',
          deletedAt: null
        },
        select: {
          id: true,
          subject: true,
          description: true,
          completedAt: true,
          personId: true,
          companyId: true
        }
      });

      console.log(`📊 Found ${actions.length} email actions to check\n`);

      let updated = 0;
      let skipped = 0;

      for (const action of actions) {
        // Find the corresponding email
        const email = await this.prisma.email_messages.findFirst({
          where: {
            workspaceId: this.workspaceId,
            personId: action.personId,
            companyId: action.companyId,
            subject: action.subject,
            receivedAt: action.completedAt || undefined
          },
          select: {
            id: true,
            from: true,
            to: true,
            cc: true,
            threadId: true,
            body: true,
            subject: true
          }
        });

        if (!email) {
          skipped++;
          continue;
        }

        // Build enhanced description
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
        
        const enhancedDescription = emailDetails.join('\n');

        // Check if already has email details
        if (action.description && action.description.includes('From:') && action.description.includes('To:')) {
          skipped++;
          continue;
        }

        // Update action
        await this.prisma.actions.update({
          where: { id: action.id },
          data: {
            description: enhancedDescription
          }
        });

        updated++;
        if (updated % 50 === 0) {
          console.log(`   Updated ${updated}/${actions.length}...`);
        }
      }

      console.log(`\n✅ Updated ${updated} actions`);
      console.log(`⏭️  Skipped ${skipped} actions (already have details or no email found)\n`);

    } catch (error) {
      console.error('❌ Error:', error.message);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }
}

// Run if called directly
if (require.main === module) {
  const fixer = new TOPEmailActionsFixer();
  fixer.run().catch(console.error);
}

module.exports = { TOPEmailActionsFixer };

