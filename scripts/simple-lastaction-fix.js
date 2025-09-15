#!/usr/bin/env node

/**
 * Simple LastAction Fix
 * Just focuses on populating lastAction fields
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🎯 SIMPLE LASTACTION FIX');
  console.log('=========================\n');

  try {
    // Step 1: Fix people lastAction
    console.log('👥 Step 1: Updating people lastAction...');
    
    const peopleWithoutLastAction = await prisma.people.findMany({
      where: { 
        OR: [
          { lastAction: null },
          { lastAction: "" }
        ]
      },
      take: 200
    });

    console.log(`Found ${peopleWithoutLastAction.length} people without lastAction`);

    let peopleUpdated = 0;
    for (const person of peopleWithoutLastAction) {
      try {
        // Find the most recent action for this person
        const lastAction = await prisma.actions.findFirst({
          where: { personId: person.id },
          orderBy: { createdAt: 'desc' }
        });

        if (lastAction) {
          await prisma.people.update({
            where: { id: person.id },
            data: {
              lastAction: lastAction.name || lastAction.type,
              lastActionDate: lastAction.createdAt
            }
          });
          peopleUpdated++;
        }
      } catch (error) {
        console.log(`Error updating person ${person.id}: ${error.message}`);
      }
    }

    console.log(`✅ Updated lastAction for ${peopleUpdated} people\n`);

    // Step 2: Fix companies lastAction
    console.log('🏢 Step 2: Updating companies lastAction...');
    
    const companiesWithoutLastAction = await prisma.companies.findMany({
      where: { 
        OR: [
          { lastAction: null },
          { lastAction: "" }
        ]
      },
      take: 200
    });

    console.log(`Found ${companiesWithoutLastAction.length} companies without lastAction`);

    let companiesUpdated = 0;
    for (const company of companiesWithoutLastAction) {
      try {
        // Find the most recent action for this company
        const lastAction = await prisma.actions.findFirst({
          where: { companyId: company.id },
          orderBy: { createdAt: 'desc' }
        });

        if (lastAction) {
          await prisma.companies.update({
            where: { id: company.id },
            data: {
              lastAction: lastAction.name || lastAction.type,
              lastActionDate: lastAction.createdAt
            }
          });
          companiesUpdated++;
        }
      } catch (error) {
        console.log(`Error updating company ${company.id}: ${error.message}`);
      }
    }

    console.log(`✅ Updated lastAction for ${companiesUpdated} companies\n`);

    // Final status
    console.log('🎉 SIMPLE LASTACTION FIX COMPLETE!');
    console.log('===================================');
    console.log(`✅ Updated lastAction for ${peopleUpdated} people`);
    console.log(`✅ Updated lastAction for ${companiesUpdated} companies`);

  } catch (error) {
    console.error('❌ Error in simple lastAction fix:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
