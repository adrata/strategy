#!/usr/bin/env node

/**
 * Fix Incorrect Email Links
 * 
 * Unlinks the 4 incorrectly linked emails identified in the deep audit.
 * 
 * Usage:
 *   node scripts/fix-incorrect-email-links.js [--dry-run]
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

// Incorrect email IDs from audit
const INCORRECT_EMAIL_IDS = [
  '01K9D2E2VWRP8DK59X84YND3R6',
  '01K9D2E2W5NFGGDCSWCT6K87ZE',
  '01K9D2E330PDFAMMPP9NDWB8V6',
  '01K9D2E33RKPW46FKM6WZYK9H3'
];

const WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';

async function fixIncorrectLinks() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('🔧 FIXING INCORRECT EMAIL LINKS');
  console.log('='.repeat(70));
  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be made');
  }
  console.log('');

  let fixed = 0;
  let errors = 0;

  for (const emailId of INCORRECT_EMAIL_IDS) {
    try {
      const email = await prisma.email_messages.findUnique({
        where: { id: emailId },
        select: {
          id: true,
          subject: true,
          from: true,
          personId: true,
          companyId: true
        }
      });

      if (!email) {
        console.log(`⚠️  Email ${emailId} not found, skipping`);
        continue;
      }

      console.log(`Processing: ${email.subject || 'No subject'}`);
      console.log(`  From: ${email.from}`);
      console.log(`  Current links: personId=${email.personId}, companyId=${email.companyId}`);

      if (email.companyId || email.personId) {
        if (dryRun) {
          console.log(`  [DRY RUN] Would unlink company and person`);
        } else {
          await prisma.email_messages.update({
            where: { id: emailId },
            data: {
              personId: null,
              companyId: null
            }
          });
          console.log(`  ✅ Unlinked company and person`);
          fixed++;
        }
      } else {
        console.log(`  ℹ️  Already unlinked, skipping`);
      }

      console.log('');
    } catch (error) {
      console.error(`❌ Error fixing email ${emailId}: ${error.message}`);
      errors++;
    }
  }

  console.log('='.repeat(70));
  if (dryRun) {
    console.log(`✅ [DRY RUN] Would fix ${fixed} emails`);
  } else {
    console.log(`✅ Fixed ${fixed} emails`);
    if (errors > 0) {
      console.log(`⚠️  ${errors} errors occurred`);
    }
  }

  await prisma.$disconnect().catch(() => {});
}

fixIncorrectLinks().catch(console.error);

