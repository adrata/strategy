#!/usr/bin/env node

/**
 * Quick Action State Check
 * Simple, fast queries to understand the current state
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 QUICK ACTION STATE CHECK');
  console.log('============================\n');

  try {
    // Simple counts first
    const totalPeople = await prisma.people.count();
    const totalActions = await prisma.actions.count();
    const actionsWithPeople = await prisma.actions.count({
      where: { personId: { not: null } }
    });

    console.log('📊 BASIC COUNTS:');
    console.log(`Total People: ${totalPeople}`);
    console.log(`Total Actions: ${totalActions}`);
    console.log(`Actions linked to people: ${actionsWithPeople}`);
    console.log(`People with actions: ~${Math.round((actionsWithPeople / totalPeople) * 100)}%\n`);

    // Check lastAction status
    const peopleWithLastAction = await prisma.people.count({
      where: { lastAction: { not: null } }
    });

    const peopleWithoutLastAction = await prisma.people.count({
      where: { 
        OR: [
          { lastAction: null },
          { lastAction: "" }
        ]
      }
    });

    console.log('🎯 LASTACTION STATUS:');
    console.log(`People with lastAction: ${peopleWithLastAction}`);
    console.log(`People without lastAction: ${peopleWithoutLastAction}`);
    console.log(`Coverage: ${Math.round((peopleWithLastAction / totalPeople) * 100)}%\n`);

    // Sample a few people to see their state
    console.log('👥 SAMPLE PEOPLE:');
    const samplePeople = await prisma.people.findMany({
      take: 3,
      select: {
        id: true,
        fullName: true,
        lastAction: true,
        lastActionDate: true
      }
    });

    for (const person of samplePeople) {
      const actionCount = await prisma.actions.count({
        where: { personId: person.id }
      });
      
      console.log(`- ${person.fullName}`);
      console.log(`  Actions: ${actionCount}`);
      console.log(`  LastAction: ${person.lastAction || 'None'}`);
      console.log(`  LastActionDate: ${person.lastActionDate || 'None'}`);
    }

    console.log('\n💡 RECOMMENDATION:');
    if (peopleWithoutLastAction > 0) {
      console.log(`We need to populate lastAction for ${peopleWithoutLastAction} people.`);
      console.log('This should be straightforward - just find their most recent action.');
    } else {
      console.log('All people have lastAction populated!');
    }

  } catch (error) {
    console.error('❌ Error in quick check:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
