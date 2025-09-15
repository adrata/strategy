#!/usr/bin/env node

/**
 * Simple Orphaned Action Fix
 * Focus on linking existing orphaned actions to people/companies
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔗 SIMPLE ORPHANED ACTION FIX');
  console.log('==============================\n');

  try {
    // Get orphaned actions in small batches
    const batchSize = 100;
    let totalFixed = 0;
    let batchCount = 0;

    while (true) {
      const orphanedActions = await prisma.actions.findMany({
        where: {
          AND: [
            { personId: null },
            { companyId: null },
            { leadId: null },
            { opportunityId: null },
            { prospectId: null }
          ]
        },
        take: batchSize
      });

      if (orphanedActions.length === 0) break;

      batchCount++;
      console.log(`Processing batch ${batchCount}: ${orphanedActions.length} orphaned actions`);

      let batchFixed = 0;
      for (const action of orphanedActions) {
        try {
          let personId = null;
          let companyId = null;

          // Try to find person by name
          if (action.name) {
            const person = await prisma.people.findFirst({
              where: {
                fullName: { contains: action.name, mode: 'insensitive' }
              }
            });
            if (person) {
              personId = person.id;
              if (person.companyId) {
                companyId = person.companyId;
              }
            }
          }

          // Try to find company by name
          if (action.companyName) {
            const company = await prisma.companies.findFirst({
              where: {
                name: { contains: action.companyName, mode: 'insensitive' }
              }
            });
            if (company) {
              companyId = company.id;
            }
          }

          // Update the action if we found matches
          if (personId || companyId) {
            await prisma.actions.update({
              where: { id: action.id },
              data: {
                personId: personId,
                companyId: companyId
              }
            });
            batchFixed++;
          }
        } catch (error) {
          console.log(`Error fixing action ${action.id}: ${error.message}`);
        }
      }

      totalFixed += batchFixed;
      console.log(`✅ Batch ${batchCount}: Fixed ${batchFixed} actions (Total: ${totalFixed})`);

      if (orphanedActions.length < batchSize) break;
    }

    console.log(`\n🎉 ORPHANED ACTION FIX COMPLETE!`);
    console.log(`✅ Total actions fixed: ${totalFixed}`);

  } catch (error) {
    console.error('❌ Error in orphaned action fix:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
