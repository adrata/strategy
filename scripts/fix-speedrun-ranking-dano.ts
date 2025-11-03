import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixSpeedrunRanking() {
  try {
    const workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1'; // Notary Everyday
    const userId = '01K7DP7QHQ7WATZAJAXCGANBYJ'; // Dano
    
    console.log('🔍 Investigating Speedrun ranking issue...');
    console.log(`Workspace: ${workspaceId}`);
    console.log(`User: ${userId}\n`);
    
    // First, check current state
    console.log('📊 Current ranking state:');
    
    // Check people with globalRank = 1
    const peopleWithRank1 = await prisma.people.findMany({
      where: {
        workspaceId,
        mainSellerId: userId,
        deletedAt: null,
        globalRank: 1
      },
      select: {
        id: true,
        fullName: true,
        globalRank: true,
        company: {
          select: {
            name: true
          }
        }
      }
    });
    
    console.log(`\n⚠️  People with globalRank = 1: ${peopleWithRank1.length}`);
    peopleWithRank1.slice(0, 10).forEach(p => {
      console.log(`  - ${p.fullName || 'Unknown'} (${p.company?.name || 'No company'})`);
    });
    
    // Check companies with globalRank = 1
    const companiesWithRank1 = await prisma.companies.findMany({
      where: {
        workspaceId,
        mainSellerId: userId,
        deletedAt: null,
        globalRank: 1
      },
      select: {
        id: true,
        name: true,
        globalRank: true
      }
    });
    
    console.log(`\n⚠️  Companies with globalRank = 1: ${companiesWithRank1.length}`);
    companiesWithRank1.slice(0, 10).forEach(c => {
      console.log(`  - ${c.name}`);
    });
    
    // Check null ranks
    const peopleWithNullRank = await prisma.people.count({
      where: {
        workspaceId,
        mainSellerId: userId,
        deletedAt: null,
        globalRank: null
      }
    });
    
    const companiesWithNullRank = await prisma.companies.count({
      where: {
        workspaceId,
        mainSellerId: userId,
        deletedAt: null,
        globalRank: null
      }
    });
    
    console.log(`\n📊 Records with null globalRank:`);
    console.log(`  - People: ${peopleWithNullRank}`);
    console.log(`  - Companies: ${companiesWithNullRank}`);
    
    // Get all records for ranking
    console.log('\n🔄 Fixing ranking...\n');
    
    // 1. Get companies without people
    const companiesWithoutPeople = await prisma.companies.findMany({
      where: {
        workspaceId,
        mainSellerId: userId,
        deletedAt: null,
        people: {
          none: {
            deletedAt: null,
            mainSellerId: userId
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        id: true,
        name: true,
        createdAt: true
      }
    });
    
    // 2. Get people from companies that have people
    const peopleFromCompaniesWithPeople = await prisma.people.findMany({
      where: {
        workspaceId,
        mainSellerId: userId,
        deletedAt: null,
        companyId: { not: null }
      },
      orderBy: {
        createdAt: 'asc'
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
    console.log(`📊 Found ${peopleFromCompaniesWithPeople.length} people from companies with people\n`);
    
    // Clear all existing ranks first (set to null)
    console.log('🧹 Clearing existing ranks...');
    await prisma.people.updateMany({
      where: {
        workspaceId,
        mainSellerId: userId,
        deletedAt: null
      },
      data: { globalRank: null }
    });
    
    await prisma.companies.updateMany({
      where: {
        workspaceId,
        mainSellerId: userId,
        deletedAt: null
      },
      data: { globalRank: null }
    });
    
    console.log('✅ Cleared existing ranks\n');
    
    // Create unified records with priority scores
    const allRecords: Array<{id: string, type: 'person' | 'company', name: string, companyName: string}> = [];
    
    // Add people first (higher priority)
    peopleFromCompaniesWithPeople.forEach((person) => {
      allRecords.push({
        id: person.id,
        type: 'person',
        name: person.fullName || `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Unknown',
        companyName: person.company?.name || 'Unknown'
      });
    });
    
    // Add companies without people (lower priority)
    companiesWithoutPeople.forEach((company) => {
      allRecords.push({
        id: company.id,
        type: 'company',
        name: company.name,
        companyName: company.name
      });
    });
    
    // Take only top 50 and assign sequential ranks (1-50)
    const top50Records = allRecords.slice(0, 50);
    
    console.log(`🎯 Assigning sequential ranks 1-${top50Records.length}:\n`);
    
    // Update people records
    const peopleToUpdate = top50Records.filter(r => r.type === 'person');
    for (let i = 0; i < top50Records.length; i++) {
      const record = top50Records[i];
      const rank = i + 1;
      
      if (record.type === 'person') {
        await prisma.people.update({
          where: { id: record.id },
          data: { globalRank: rank }
        });
        if (i < 10) {
          console.log(`  ${rank}. ${record.name} (${record.companyName}) [PERSON]`);
        }
      } else {
        await prisma.companies.update({
          where: { id: record.id },
          data: { globalRank: rank }
        });
        if (i < 10) {
          console.log(`  ${rank}. ${record.name} [COMPANY]`);
        }
      }
    }
    
    if (top50Records.length > 10) {
      console.log(`  ... and ${top50Records.length - 10} more`);
    }
    
    console.log(`\n✅ Successfully assigned ranks to ${top50Records.length} records (${peopleToUpdate.length} people, ${top50Records.length - peopleToUpdate.length} companies)`);
    
    // Verify results
    const rankedPeople = await prisma.people.count({
      where: {
        workspaceId,
        mainSellerId: userId,
        globalRank: { not: null, gte: 1, lte: 50 }
      }
    });
    
    const rankedCompanies = await prisma.companies.count({
      where: {
        workspaceId,
        mainSellerId: userId,
        globalRank: { not: null, gte: 1, lte: 50 }
      }
    });
    
    console.log(`\n🔍 Verification:`);
    console.log(`  - People with ranks 1-50: ${rankedPeople}`);
    console.log(`  - Companies with ranks 1-50: ${rankedCompanies}`);
    console.log(`  - Total Speedrun records: ${rankedPeople + rankedCompanies}`);
    
    // Check for duplicates
    const duplicateRanks = await prisma.$queryRaw<Array<{globalRank: number, count: bigint}>>`
      SELECT "globalRank", COUNT(*) as count
      FROM (
        SELECT "globalRank" FROM "people" 
        WHERE "workspaceId" = ${workspaceId} 
        AND "mainSellerId" = ${userId} 
        AND "deletedAt" IS NULL
        AND "globalRank" IS NOT NULL
        UNION ALL
        SELECT "globalRank" FROM "companies" 
        WHERE "workspaceId" = ${workspaceId} 
        AND "mainSellerId" = ${userId} 
        AND "deletedAt" IS NULL
        AND "globalRank" IS NOT NULL
      ) combined
      GROUP BY "globalRank"
      HAVING COUNT(*) > 1
    `;
    
    if (duplicateRanks.length > 0) {
      console.log(`\n⚠️  Found duplicate ranks:`);
      duplicateRanks.forEach(d => {
        console.log(`  - Rank ${d.globalRank}: ${d.count} records`);
      });
    } else {
      console.log(`\n✅ No duplicate ranks found - ranking is unique!`);
    }
    
  } catch (error) {
    console.error('❌ Error fixing ranking:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixSpeedrunRanking();

