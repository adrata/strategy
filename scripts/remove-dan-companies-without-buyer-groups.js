#!/usr/bin/env node

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DAN_USER_ID = '01K7B327HWN9G6KGWA97S1TK43';
const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';

// Companies to remove (those without buyer groups)
const COMPANY_IDS_TO_DELETE = [
  "01K9AR5XNKBBWX19TWH38QBP8C", // Cloudflare
  "01K9AR5XFJKJAMAAXKGAYVPXGE", // JFrog
  "01K9AR5V24W5ZW977X5WRRKEY0", // MongoDB
  "01K9AR5VZQJF0TPY1KVKK6Q91S", // New Relic
  "01K9AR5W5SWPHP3ZP0D984PS4R", // Okta
  "01K9AR5TW0FRP8SEJAS43HFHKH"  // Twilio
];

async function removeCompanies() {
  console.log('🗑️  Removing Companies Without Buyer Groups');
  console.log('═'.repeat(60));
  console.log('');

  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // First, get details of companies to delete
    const companiesToDelete = await prisma.companies.findMany({
      where: {
        id: { in: COMPANY_IDS_TO_DELETE },
        workspaceId: ADRATA_WORKSPACE_ID,
        mainSellerId: DAN_USER_ID,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        website: true,
        _count: {
          select: {
            people: {
              where: { deletedAt: null }
            },
            actions: true
          }
        }
      }
    });

    console.log(`📋 Found ${companiesToDelete.length} companies to delete:\n`);

    if (companiesToDelete.length === 0) {
      console.log('⚠️  No companies found to delete (already deleted or IDs don\'t match)');
      await prisma.$disconnect();
      return;
    }

    // Display what will be deleted
    companiesToDelete.forEach((company, idx) => {
      console.log(`${idx + 1}. ${company.name}`);
      console.log(`   ID: ${company.id}`);
      console.log(`   Website: ${company.website || 'N/A'}`);
      console.log(`   People: ${company._count.people}`);
      console.log(`   Actions: ${company._count.actions}`);
      console.log('');
    });

    console.log('🔄 Starting soft delete (setting deletedAt timestamp)...\n');

    const results = {
      deleted: [],
      errors: []
    };

    // Soft delete each company
    for (const company of companiesToDelete) {
      try {
        // Soft delete the company by setting deletedAt
        await prisma.companies.update({
          where: { id: company.id },
          data: {
            deletedAt: new Date()
          }
        });

        console.log(`✅ Deleted: ${company.name}`);
        results.deleted.push(company);

        // Also soft delete associated people if any
        if (company._count.people > 0) {
          await prisma.people.updateMany({
            where: {
              companyId: company.id,
              deletedAt: null
            },
            data: {
              deletedAt: new Date()
            }
          });
          console.log(`   📝 Also soft-deleted ${company._count.people} associated people`);
        }

      } catch (error) {
        console.error(`❌ Error deleting ${company.name}:`, error.message);
        results.errors.push({
          company: company.name,
          error: error.message
        });
      }
    }

    console.log('\n\n📊 DELETION SUMMARY');
    console.log('═'.repeat(60));
    console.log(`✅ Successfully deleted: ${results.deleted.length} companies`);
    console.log(`❌ Errors: ${results.errors.length}`);

    if (results.deleted.length > 0) {
      console.log('\n✅ Deleted companies:');
      results.deleted.forEach(company => {
        console.log(`   - ${company.name}`);
      });
    }

    if (results.errors.length > 0) {
      console.log('\n❌ Errors:');
      results.errors.forEach(error => {
        console.log(`   - ${error.company}: ${error.error}`);
      });
    }

    console.log('\n✨ Done! Companies have been soft-deleted.');
    console.log('Note: Soft delete means deletedAt is set, not hard delete from database.');

    await prisma.$disconnect();

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

removeCompanies();

