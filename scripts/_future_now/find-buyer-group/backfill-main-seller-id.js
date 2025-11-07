#!/usr/bin/env node

/**
 * Backfill mainSellerId for existing people in Adrata workspace
 * 
 * Sets mainSellerId for people that have null mainSellerId
 * This fixes the issue where people created by BGI don't appear in counts
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';
const DAN_USER_ID = '01K7B327HWN9G6KGWA97S1TK43';

class BackfillMainSellerId {
  constructor(workspaceId, workspaceName, userId) {
    this.prisma = new PrismaClient();
    this.workspaceId = workspaceId;
    this.workspaceName = workspaceName;
    this.userId = userId;
    this.updated = 0;
    this.errors = [];
  }

  async run() {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🔧 Backfilling mainSellerId - ${this.workspaceName}`);
    console.log('='.repeat(70));
    console.log(`Workspace: ${this.workspaceId}`);
    console.log(`User ID: ${this.userId}\n`);

    try {
      // Find all people with null mainSellerId in this workspace
      const peopleWithoutSeller = await this.prisma.people.findMany({
        where: {
          workspaceId: this.workspaceId,
          deletedAt: null,
          mainSellerId: null
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          companyId: true,
          company: {
            select: {
              name: true
            }
          }
        }
      });

      console.log(`📊 Found ${peopleWithoutSeller.length} people without mainSellerId\n`);

      if (peopleWithoutSeller.length === 0) {
        console.log('✅ All people already have mainSellerId assigned!');
        await this.prisma.$disconnect();
        return;
      }

      // Update each person
      for (const person of peopleWithoutSeller) {
        try {
          await this.prisma.people.update({
            where: { id: person.id },
            data: {
              mainSellerId: this.userId
            }
          });

          this.updated++;
          if (this.updated % 10 === 0) {
            console.log(`   ✅ Updated ${this.updated}/${peopleWithoutSeller.length}...`);
          }
        } catch (error) {
          console.error(`   ❌ Failed to update ${person.fullName || person.id}:`, error.message);
          this.errors.push({
            personId: person.id,
            personName: person.fullName,
            error: error.message
          });
        }
      }

      console.log(`\n✅ Backfill complete!`);
      console.log(`   Updated: ${this.updated} people`);
      if (this.errors.length > 0) {
        console.log(`   Errors: ${this.errors.length} people`);
      }

      // Verify the fix
      const remaining = await this.prisma.people.count({
        where: {
          workspaceId: this.workspaceId,
          deletedAt: null,
          mainSellerId: null
        }
      });

      console.log(`\n📊 Verification:`);
      console.log(`   People without mainSellerId: ${remaining}`);
      if (remaining === 0) {
        console.log(`   ✅ All people now have mainSellerId!`);
      } else {
        console.log(`   ⚠️  ${remaining} people still need mainSellerId`);
      }

    } catch (error) {
      console.error('❌ Backfill failed:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }
}

// Run for Adrata workspace
if (require.main === module) {
  const workspaceId = process.argv[2] || ADRATA_WORKSPACE_ID;
  const workspaceName = process.argv[3] || "Dan's Adrata";
  const userId = process.argv[4] || DAN_USER_ID;

  console.log(`\n⚠️  This will set mainSellerId=${userId} for all people in ${workspaceName} workspace`);
  console.log(`   that currently have mainSellerId=null`);
  console.log(`\n   Press Ctrl+C to cancel, or wait 5 seconds to continue...`);

  setTimeout(async () => {
    const backfill = new BackfillMainSellerId(workspaceId, workspaceName, userId);
    backfill.run().catch(console.error);
  }, 5000);
}

module.exports = { BackfillMainSellerId };

