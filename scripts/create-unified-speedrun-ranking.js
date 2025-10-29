const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createUnifiedSpeedrunRanking() {
  try {
    console.log('🎯 Creating unified Speedrun ranking...');
    
    // Get companies without people (these get Speedrun ranks)
    const companiesWithoutPeople = await prisma.companies.findMany({
      where: {
        workspaceId: '01K7464TNANHQXPCZT1FYX205V', // Adrata workspace
        deletedAt: null,
        mainSellerId: '01K7B327HWN9G6KGWA97S1TK43', // Dan Mirolli
        // Only companies with 0 people
        people: {
          none: {
            deletedAt: null,
            mainSellerId: '01K7B327HWN9G6KGWA97S1TK43'
          }
        }
      },
      select: {
        id: true,
        name: true,
        createdAt: true
      }
    });
    
    // Get people from companies that have people
    const peopleFromCompaniesWithPeople = await prisma.people.findMany({
      where: {
        workspaceId: '01K7464TNANHQXPCZT1FYX205V', // Adrata workspace
        deletedAt: null,
        companyId: { not: null },
        mainSellerId: '01K7B327HWN9G6KGWA97S1TK43' // Dan Mirolli
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    console.log(`📊 Found ${companiesWithoutPeople.length} companies without people`);
    console.log(`📊 Found ${peopleFromCompaniesWithPeople.length} people from companies with people`);
    
    // Create unified records with priority scores
    const allRecords = [];
    
    // Add people (higher priority - lower score)
    peopleFromCompaniesWithPeople.forEach((person, index) => {
      allRecords.push({
        id: person.id,
        type: 'person',
        name: person.fullName || `${person.firstName || ''} ${person.lastName || ''}`.trim(),
        companyName: person.company?.name || 'Unknown',
        createdAt: person.createdAt,
        priorityScore: index + 1 // People get priority 1, 2, 3, etc.
      });
    });
    
    // Add companies without people (lower priority - higher score)
    companiesWithoutPeople.forEach((company, index) => {
      allRecords.push({
        id: company.id,
        type: 'company',
        name: company.name,
        companyName: company.name,
        createdAt: company.createdAt,
        priorityScore: 1000 + index + 1 // Companies get priority 1001, 1002, etc.
      });
    });
    
    // Sort by priority score (people first, then companies)
    allRecords.sort((a, b) => a.priorityScore - b.priorityScore);
    
    // Take only top 50 and assign sequential ranks
    const top50Records = allRecords.slice(0, 50);
    
    console.log(`🎯 Assigning ranks 1-${top50Records.length} to top records:`);
    top50Records.forEach((record, index) => {
      console.log(`  ${index + 1}. ${record.name} (${record.type}) - ${record.companyName}`);
    });
    
    // Update people records
    const peopleToUpdate = top50Records.filter(r => r.type === 'person');
    for (const record of peopleToUpdate) {
      await prisma.people.update({
        where: { id: record.id },
        data: { globalRank: top50Records.indexOf(record) + 1 }
      });
    }
    
    // Update company records
    const companiesToUpdate = top50Records.filter(r => r.type === 'company');
    for (const record of companiesToUpdate) {
      await prisma.companies.update({
        where: { id: record.id },
        data: { globalRank: top50Records.indexOf(record) + 1 }
      });
    }
    
    console.log(`✅ Successfully assigned ranks to ${peopleToUpdate.length} people and ${companiesToUpdate.length} companies`);
    
    // Verify the results
    const rankedPeople = await prisma.people.count({
      where: {
        workspaceId: '01K7464TNANHQXPCZT1FYX205V',
        globalRank: { not: null, gte: 1, lte: 50 }
      }
    });
    
    const rankedCompanies = await prisma.companies.count({
      where: {
        workspaceId: '01K7464TNANHQXPCZT1FYX205V',
        globalRank: { not: null, gte: 1, lte: 50 }
      }
    });
    
    console.log(`🔍 Verification: ${rankedPeople} people and ${rankedCompanies} companies have ranks 1-50`);
    console.log(`📊 Total Speedrun records: ${rankedPeople + rankedCompanies}`);
    
  } catch (error) {
    console.error('❌ Error creating unified ranking:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUnifiedSpeedrunRanking();

