const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function generateIntelligenceForRecords() {
  try {
    console.log('🚀 Starting AI Intelligence Generation...');
    
    // Get all people records that need intelligence generation
    const people = await prisma.people.findMany({
      where: {
        OR: [
          { customFields: { path: ['intelligenceSummary'], equals: null } },
          { customFields: { path: ['intelligenceSummary'], equals: undefined } },
          { customFields: { path: ['intelligenceSummary'], equals: '' } }
        ]
      },
      include: {
        company: true
      },
      take: 10 // Start with 10 records for testing
    });

    console.log(`📊 Found ${people.length} people records to process`);

    for (const person of people) {
      try {
        console.log(`\n🔍 Processing: ${person.fullName || person.name} (${person.id})`);
        
        // Generate AI intelligence using the API
        const response = await fetch('http://localhost:3000/api/intelligence/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recordId: person.id,
            recordType: 'people',
            workspaceId: person.workspaceId || 'top'
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Generated intelligence for ${person.fullName || person.name}`);
          console.log(`   - Influence Level: ${result.intelligenceProfile.influenceLevel}`);
          console.log(`   - Engagement Strategy: ${result.intelligenceProfile.engagementStrategy}`);
          console.log(`   - Pain Points: ${result.intelligenceProfile.painPoints.length} identified`);
        } else {
          console.error(`❌ Failed to generate intelligence for ${person.fullName || person.name}: ${response.status}`);
        }
      } catch (error) {
        console.error(`❌ Error processing ${person.fullName || person.name}:`, error.message);
      }
    }

    console.log('\n🎉 AI Intelligence generation completed!');
  } catch (error) {
    console.error('❌ Error in intelligence generation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
generateIntelligenceForRecords();
