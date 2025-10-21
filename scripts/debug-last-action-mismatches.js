/**
 * Debug Last Action Mismatches Script
 * 
 * This script investigates the specific mismatches found in the audit
 * to understand why the sync didn't catch them.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugLastActionMismatches() {
  console.log('🔍 DEBUGGING LAST ACTION MISMATCHES');
  console.log('===================================');
  
  try {
    // Get a sample of people with actions to check for mismatches
    const peopleWithActions = await prisma.people.findMany({
      where: { 
        lastAction: { not: null },
        lastActionDate: { not: null }
      },
      include: {
        actions: {
          where: { status: 'COMPLETED' },
          orderBy: { completedAt: 'desc' },
          take: 1,
          select: { subject: true, completedAt: true, type: true }
        }
      },
      take: 10 // Small sample for debugging
    });
    
    console.log(`\n📋 SAMPLE OF ${peopleWithActions.length} PEOPLE WITH ACTIONS:`);
    
    peopleWithActions.forEach((person, index) => {
      const actualLastAction = person.actions[0];
      const storedLastAction = person.lastAction;
      
      console.log(`\n${index + 1}. ${person.fullName} (ID: ${person.id})`);
      console.log(`   Stored lastAction: "${storedLastAction}"`);
      console.log(`   Actual last action: "${actualLastAction?.subject || 'None'}"`);
      console.log(`   Match: ${storedLastAction === actualLastAction?.subject ? '✅' : '❌'}`);
      
      if (actualLastAction) {
        console.log(`   Action type: ${actualLastAction.type}`);
        console.log(`   Action date: ${actualLastAction.completedAt}`);
      }
    });
    
    // Find actual mismatches
    const mismatches = peopleWithActions.filter(person => {
      const actualLastAction = person.actions[0];
      if (!actualLastAction) return person.lastAction !== null;
      return person.lastAction !== actualLastAction.subject;
    });
    
    console.log(`\n❌ FOUND ${mismatches.length} MISMATCHES IN SAMPLE`);
    
    if (mismatches.length > 0) {
      console.log('\n🔧 FIXING MISMATCHES...');
      
      for (const person of mismatches) {
        const actualLastAction = person.actions[0];
        const actualLastActionText = actualLastAction?.subject || 'Record created';
        const actualLastActionDate = actualLastAction?.completedAt || person.createdAt;
        
        console.log(`   Updating ${person.fullName}: "${person.lastAction}" → "${actualLastActionText}"`);
        
        await prisma.people.update({
          where: { id: person.id },
          data: {
            lastAction: actualLastActionText,
            lastActionDate: actualLastActionDate
          }
        });
      }
      
      console.log(`✅ Fixed ${mismatches.length} mismatches in sample`);
    }
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug
debugLastActionMismatches().catch(console.error);
