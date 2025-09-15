#!/usr/bin/env node

/**
 * Simple Action System Fix - Basic Version
 * Fixes orphaned actions and lastAction without new schema fields
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 SIMPLE ACTION SYSTEM FIX - BASIC');
  console.log('====================================\n');

  try {
    // Step 1: Fix orphaned actions by linking to people/companies
    console.log('🔗 Step 1: Fixing orphaned actions...');
    
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
      take: 200 // Process more in each batch
    });

    console.log(`Found ${orphanedActions.length} orphaned actions to fix`);

    let fixedCount = 0;
    for (const action of orphanedActions) {
      try {
        // Try to find a person or company to link to based on action data
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
          fixedCount++;
        }
      } catch (error) {
        console.log(`Error fixing action ${action.id}: ${error.message}`);
      }
    }

    console.log(`✅ Fixed ${fixedCount} orphaned actions\n`);

    // Step 2: Update lastAction for people (using existing fields)
    console.log('👥 Step 2: Updating lastAction for people...');
    
    const peopleWithoutLastAction = await prisma.people.findMany({
      where: { 
        OR: [
          { lastAction: null },
          { lastAction: "" }
        ]
      },
      take: 100 // Process in batches
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

    // Step 3: Update lastAction for companies
    console.log('🏢 Step 3: Updating lastAction for companies...');
    
    const companiesWithoutLastAction = await prisma.companies.findMany({
      where: { 
        OR: [
          { lastAction: null },
          { lastAction: "" }
        ]
      },
      take: 100 // Process in batches
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

    // Step 4: Generate simple nextAction recommendations (using existing fields)
    console.log('🎯 Step 4: Generating nextAction recommendations...');
    
    const peopleWithoutNextAction = await prisma.people.findMany({
      where: { 
        OR: [
          { nextAction: null },
          { nextAction: "" }
        ]
      },
      take: 50 // Process in smaller batches
    });

    console.log(`Found ${peopleWithoutNextAction.length} people without nextAction`);

    let nextActionsGenerated = 0;
    for (const person of peopleWithoutNextAction) {
      try {
        // Simple nextAction logic based on last action
        let nextAction = 'Follow up on previous contact';
        let nextActionType = 'follow_up';
        let nextActionPriority = 'medium';

        if (person.lastAction) {
          if (person.lastAction.includes('email')) {
            nextAction = 'Schedule a call to discuss next steps';
            nextActionType = 'phone_call';
            nextActionPriority = 'high';
          } else if (person.lastAction.includes('call')) {
            nextAction = 'Send follow-up email with meeting notes';
            nextActionType = 'email';
            nextActionPriority = 'medium';
          } else if (person.lastAction.includes('LinkedIn')) {
            nextAction = 'Send personalized connection message';
            nextActionType = 'linkedin_message';
            nextActionPriority = 'medium';
          }
        }

        await prisma.people.update({
          where: { id: person.id },
          data: {
            nextAction: nextAction,
            nextActionDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
          }
        });
        nextActionsGenerated++;
      } catch (error) {
        console.log(`Error generating nextAction for person ${person.id}: ${error.message}`);
      }
    }

    console.log(`✅ Generated nextAction for ${nextActionsGenerated} people\n`);

    // Final status
    console.log('🎉 SIMPLE ACTION FIX COMPLETE!');
    console.log('==============================');
    console.log(`✅ Fixed ${fixedCount} orphaned actions`);
    console.log(`✅ Updated lastAction for ${peopleUpdated} people`);
    console.log(`✅ Updated lastAction for ${companiesUpdated} companies`);
    console.log(`✅ Generated nextAction for ${nextActionsGenerated} people`);

  } catch (error) {
    console.error('❌ Error in simple action fix:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
