#!/usr/bin/env node

/**
 * Efficient Action System Fix
 * Processes in small batches to avoid timeouts
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('⚡ EFFICIENT ACTION SYSTEM FIX');
  console.log('===============================\n');

  try {
    // Step 1: Fix orphaned actions (smaller batches)
    console.log('🔗 Step 1: Fixing orphaned actions...');
    
    let totalFixed = 0;
    let batchCount = 0;
    const batchSize = 50;

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

      if (orphanedActions.length === 0) {
        break;
      }

      batchCount++;
      console.log(`Processing batch ${batchCount}: ${orphanedActions.length} orphaned actions`);

      let batchFixed = 0;
      for (const action of orphanedActions) {
        try {
          // Try to find a person or company to link to
          let personId = null;
          let companyId = null;

          // If action has a name, try to find matching person
          if (action.name) {
            const person = await prisma.people.findFirst({
              where: {
                OR: [
                  { fullName: { contains: action.name, mode: 'insensitive' } },
                  { email: { contains: action.name, mode: 'insensitive' } }
                ]
              }
            });
            if (person) personId = person.id;
          }

          // If action has a company name, try to find matching company
          if (action.companyName) {
            const company = await prisma.companies.findFirst({
              where: {
                name: { contains: action.companyName, mode: 'insensitive' }
              }
            });
            if (company) companyId = company.id;
          }

          // Update the action with found relationships
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

      // Break if no more orphaned actions
      if (orphanedActions.length < batchSize) {
        break;
      }
    }

    console.log(`✅ Total orphaned actions fixed: ${totalFixed}\n`);

    // Step 2: Update lastAction for people (smaller batches)
    console.log('👥 Step 2: Updating lastAction for people...');
    
    let peopleUpdated = 0;
    batchCount = 0;

    while (true) {
      const peopleWithoutLastAction = await prisma.people.findMany({
        where: { 
          OR: [
            { lastAction: null },
            { lastAction: "" }
          ]
        },
        take: batchSize
      });

      if (peopleWithoutLastAction.length === 0) {
        break;
      }

      batchCount++;
      console.log(`Processing batch ${batchCount}: ${peopleWithoutLastAction.length} people`);

      let batchUpdated = 0;
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
            batchUpdated++;
          }
        } catch (error) {
          console.log(`Error updating person ${person.id}: ${error.message}`);
        }
      }

      peopleUpdated += batchUpdated;
      console.log(`✅ Batch ${batchCount}: Updated ${batchUpdated} people (Total: ${peopleUpdated})`);

      if (peopleWithoutLastAction.length < batchSize) {
        break;
      }
    }

    console.log(`✅ Total people updated: ${peopleUpdated}\n`);

    // Step 3: Update lastAction for companies (smaller batches)
    console.log('🏢 Step 3: Updating lastAction for companies...');
    
    let companiesUpdated = 0;
    batchCount = 0;

    while (true) {
      const companiesWithoutLastAction = await prisma.companies.findMany({
        where: { 
          OR: [
            { lastAction: null },
            { lastAction: "" }
          ]
        },
        take: batchSize
      });

      if (companiesWithoutLastAction.length === 0) {
        break;
      }

      batchCount++;
      console.log(`Processing batch ${batchCount}: ${companiesWithoutLastAction.length} companies`);

      let batchUpdated = 0;
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
            batchUpdated++;
          }
        } catch (error) {
          console.log(`Error updating company ${company.id}: ${error.message}`);
        }
      }

      companiesUpdated += batchUpdated;
      console.log(`✅ Batch ${batchCount}: Updated ${batchUpdated} companies (Total: ${companiesUpdated})`);

      if (companiesWithoutLastAction.length < batchSize) {
        break;
      }
    }

    console.log(`✅ Total companies updated: ${companiesUpdated}\n`);

    // Step 4: Generate nextAction recommendations (smaller batches)
    console.log('🎯 Step 4: Generating nextAction recommendations...');
    
    let nextActionsGenerated = 0;
    batchCount = 0;

    while (true) {
      const peopleWithoutNextAction = await prisma.people.findMany({
        where: { 
          OR: [
            { nextAction: null },
            { nextAction: "" }
          ]
        },
        take: batchSize
      });

      if (peopleWithoutNextAction.length === 0) {
        break;
      }

      batchCount++;
      console.log(`Processing batch ${batchCount}: ${peopleWithoutNextAction.length} people`);

      let batchGenerated = 0;
      for (const person of peopleWithoutNextAction) {
        try {
          // Simple nextAction logic based on last action
          let nextAction = 'Follow up on previous contact';

          if (person.lastAction) {
            if (person.lastAction.includes('email')) {
              nextAction = 'Schedule a call to discuss next steps';
            } else if (person.lastAction.includes('call')) {
              nextAction = 'Send follow-up email with meeting notes';
            } else if (person.lastAction.includes('LinkedIn')) {
              nextAction = 'Send personalized connection message';
            } else if (person.lastAction.includes('created')) {
              nextAction = 'Send initial outreach email';
            }
          }

          await prisma.people.update({
            where: { id: person.id },
            data: {
              nextAction: nextAction,
              nextActionDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
            }
          });
          batchGenerated++;
        } catch (error) {
          console.log(`Error generating nextAction for person ${person.id}: ${error.message}`);
        }
      }

      nextActionsGenerated += batchGenerated;
      console.log(`✅ Batch ${batchCount}: Generated ${batchGenerated} nextActions (Total: ${nextActionsGenerated})`);

      if (peopleWithoutNextAction.length < batchSize) {
        break;
      }
    }

    console.log(`✅ Total nextActions generated: ${nextActionsGenerated}\n`);

    // Final status
    console.log('🎉 EFFICIENT ACTION FIX COMPLETE!');
    console.log('==================================');
    console.log(`✅ Fixed ${totalFixed} orphaned actions`);
    console.log(`✅ Updated lastAction for ${peopleUpdated} people`);
    console.log(`✅ Updated lastAction for ${companiesUpdated} companies`);
    console.log(`✅ Generated nextAction for ${nextActionsGenerated} people`);

  } catch (error) {
    console.error('❌ Error in efficient action fix:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
