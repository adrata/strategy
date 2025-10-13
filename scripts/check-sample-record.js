const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSampleRecord() {
  try {
    const workspaceId = '01K75ZD7DWHG1XF16HAF2YVKCK';
    
    // Get a sample person/lead
    const person = await prisma.people.findFirst({
      where: {
        workspaceId: workspaceId,
        deletedAt: null
      },
      include: {
        company: {
          select: {
            name: true,
            industry: true,
            description: true,
            size: true,
            website: true,
            businessChallenges: true,
            businessPriorities: true,
            competitiveAdvantages: true
          }
        }
      },
      take: 1
    });

    console.log('=== SAMPLE PERSON RECORD ===');
    console.log(JSON.stringify(person, null, 2));
    
    // Show what context the AI would get
    if (person) {
      console.log('\n=== AI WOULD SEE ===');
      console.log(`Person: ${person.fullName || person.firstName + ' ' + person.lastName}`);
      console.log(`Title: ${person.jobTitle || 'Unknown'}`);
      console.log(`Company: ${person.company?.name || 'Unknown'}`);
      console.log(`Industry: ${person.company?.industry || 'Unknown'}`);
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkSampleRecord();

