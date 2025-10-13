/**
 * Test script to verify next action population logic
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testNextActions() {
  console.log('🧪 TESTING NEXT ACTIONS LOGIC');
  console.log('==============================\n');

  try {
    // Test with a small sample first
    const testPeople = await prisma.people.findMany({
      where: {
        deletedAt: null,
        OR: [
          { nextAction: null },
          { nextAction: '' },
          { nextActionDate: null }
        ]
      },
      select: {
        id: true,
        fullName: true,
        globalRank: true,
        lastActionDate: true,
        nextAction: true,
        nextActionDate: true
      },
      take: 5,
      orderBy: { globalRank: 'asc' }
    });

    console.log(`Found ${testPeople.length} test people:\n`);

    for (const person of testPeople) {
      console.log(`👤 ${person.fullName} (Rank: ${person.globalRank || 'No rank'})`);
      console.log(`   Current nextAction: ${person.nextAction || 'None'}`);
      console.log(`   Current nextActionDate: ${person.nextActionDate || 'None'}`);
      console.log(`   Last action date: ${person.lastActionDate || 'None'}`);
      
      // Calculate what the new values should be
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      let targetDate;
      if (!person.globalRank || person.globalRank <= 50) {
        targetDate = today;
      } else if (person.globalRank <= 200) {
        targetDate = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
      } else if (person.globalRank <= 500) {
        targetDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else {
        targetDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
      }
      
      console.log(`   → Should get nextActionDate: ${targetDate.toISOString().split('T')[0]}`);
      console.log('');
    }

    // Test updating one person
    if (testPeople.length > 0) {
      const testPerson = testPeople[0];
      console.log(`🔄 Testing update for: ${testPerson.fullName}`);
      
      const updateData = {
        nextAction: 'Send LinkedIn connection request',
        nextActionDate: new Date(),
        nextActionPriority: 'high',
        nextActionType: 'linkedin_connection_request',
        nextActionReasoning: 'Test update from script',
        nextActionUpdatedAt: new Date()
      };
      
      const updated = await prisma.people.update({
        where: { id: testPerson.id },
        data: updateData
      });
      
      console.log(`✅ Successfully updated ${updated.fullName}`);
      console.log(`   New nextAction: ${updated.nextAction}`);
      console.log(`   New nextActionDate: ${updated.nextActionDate}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNextActions();
