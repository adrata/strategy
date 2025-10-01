require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function runComprehensiveIntelligenceGeneration() {
  try {
    console.log('🚀 Starting Comprehensive Intelligence Generation...\n');

    const workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1'; // TOP workspace ID

    // Get all people without intelligence
    const peopleWithoutIntelligence = await prisma.people.findMany({
      where: { 
        workspaceId,
        OR: [
          { customFields: null },
          { customFields: { path: ['intelligenceSummary'], equals: null } }
        ]
      },
      select: {
        id: true,
        fullName: true,
        customFields: true
      },
      take: 50 // Process in batches
    });

    console.log(`📊 Found ${peopleWithoutIntelligence.length} people without intelligence`);

    if (peopleWithoutIntelligence.length === 0) {
      console.log('✅ All people already have intelligence generated!');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const person of peopleWithoutIntelligence) {
      try {
        console.log(`🤖 Generating intelligence for: ${person.fullName}`);
        
        const response = await fetch('http://localhost:3000/api/intelligence/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recordId: person.id,
            recordType: 'people',
            workspaceId: workspaceId,
            userId: '01K1VBYZMWTCT09FWEKBDMCXZM'
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Success: ${person.fullName} - ${result.engagementLevel || 'Generated'}`);
          successCount++;
        } else {
          console.log(`❌ Failed: ${person.fullName} - ${response.status}`);
          errorCount++;
        }

        // Add delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.log(`❌ Error for ${person.fullName}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📊 BATCH COMPLETE:`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);

    // Check overall status
    const totalPeople = await prisma.people.count({ where: { workspaceId } });
    const peopleWithIntelligence = await prisma.people.count({
      where: { 
        workspaceId,
        customFields: {
          path: ['intelligenceSummary'],
          not: null
        }
      }
    });

    console.log(`\n🎯 OVERALL PROGRESS: ${peopleWithIntelligence}/${totalPeople} (${Math.round((peopleWithIntelligence/totalPeople)*100)}%)`);

    if (peopleWithIntelligence < totalPeople) {
      console.log('\n🔄 More records need intelligence generation. Run this script again to continue.');
    } else {
      console.log('\n🎉 ALL INTELLIGENCE GENERATION COMPLETE!');
    }

  } catch (error) {
    console.error('❌ Error in comprehensive intelligence generation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runComprehensiveIntelligenceGeneration();
