const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Calculate next action date based on global rank
 */
function calculateRankBasedDate(globalRank, lastActionDate) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const lastActionToday = lastActionDate && 
    lastActionDate.getFullYear() === now.getFullYear() &&
    lastActionDate.getMonth() === now.getMonth() &&
    lastActionDate.getDate() === now.getDate();
  
  let targetDate;
  
  if (!globalRank || globalRank <= 50) {
    targetDate = lastActionToday ? new Date(today.getTime() + 24 * 60 * 60 * 1000) : today;
  } else if (globalRank <= 200) {
    const daysOut = lastActionToday ? 3 : 2;
    targetDate = new Date(today.getTime() + daysOut * 24 * 60 * 60 * 1000);
  } else if (globalRank <= 500) {
    targetDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  } else {
    targetDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
  }
  
  const dayOfWeek = targetDate.getDay();
  if (dayOfWeek === 0) {
    targetDate = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);
  } else if (dayOfWeek === 6) {
    targetDate = new Date(targetDate.getTime() + 2 * 24 * 60 * 60 * 1000);
  }
  
  return targetDate;
}

async function assignDemoDanSpeedrunRanks() {
  console.log('🔧 Assigning speedrun ranks for dan in Demo workspace...\n');
  
  try {
    const workspaceId = '01K74N79PCW5W8D9X6EK7KJANM'; // Demo
    const danId = '01K7B327HWN9G6KGWA97S1TK43'; // dan (same user as Adrata)
    
    // First, get a count of people
    const totalPeople = await prisma.people.count({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        mainSellerId: danId,
        companyId: { not: null }
      }
    });
    
    console.log(`📊 Found ${totalPeople} people assigned to dan in Demo workspace`);
    
    if (totalPeople === 0) {
      console.log('❌ No people found to rank');
      return;
    }
    
    // Get all people in batches to avoid memory issues
    const BATCH_SIZE = 1000;
    let allPeople = [];
    let offset = 0;
    
    while (offset < totalPeople) {
      console.log(`📥 Fetching batch ${Math.floor(offset / BATCH_SIZE) + 1}...`);
      
      const batch = await prisma.people.findMany({
        where: {
          workspaceId: workspaceId,
          deletedAt: null,
          mainSellerId: danId,
          companyId: { not: null }
        },
        select: {
          id: true,
          fullName: true,
          jobTitle: true,
          lastActionDate: true,
          companyId: true,
          company: {
            select: {
              id: true,
              name: true,
              industry: true,
              size: true
            }
          }
        },
        skip: offset,
        take: BATCH_SIZE
      });
      
      allPeople = allPeople.concat(batch);
      offset += BATCH_SIZE;
    }
    
    console.log(`📊 Loaded ${allPeople.length} people total`);
    
    // Define industry priority for Demo workspace (Technology/Software focus)
    const industryPriority = {
      'Technology': 1,
      'Software': 2,
      'SaaS': 3,
      'IT Services': 4,
      'Consulting': 5,
      'Marketing': 6,
      'Sales': 7,
      'Other': 8
    };
    
    // Define job title seniority
    const titleSeniority = {
      'CEO': 1,
      'President': 2,
      'Vice President': 3,
      'VP': 3,
      'Director': 4,
      'Manager': 5,
      'Lead': 6,
      'Senior': 7,
      'Principal': 8,
      'Staff': 9,
      'Engineer': 10,
      'Developer': 10,
      'Analyst': 11,
      'Coordinator': 12,
      'Assistant': 13
    };
    
    // Rank people using hierarchical logic
    console.log('🔄 Ranking people...');
    const rankedPeople = allPeople.map(person => {
      const company = person.company;
      if (!company) return null;
      
      const industryScore = industryPriority[company.industry] || industryPriority['Other'];
      const sizeScore = company.size === 'Large' ? 1 : company.size === 'Medium' ? 2 : 3;
      
      const jobTitle = person.jobTitle || '';
      const titleScore = Object.entries(titleSeniority).find(([title]) => 
        jobTitle.toLowerCase().includes(title.toLowerCase())
      )?.[1] || 20;
      
      const lastActionDate = person.lastActionDate ? new Date(person.lastActionDate) : new Date(0);
      
      return {
        ...person,
        industryScore,
        sizeScore,
        titleScore,
        lastActionDate
      };
    }).filter(Boolean);
    
    // Sort by ranking criteria
    console.log('🔄 Sorting people by ranking criteria...');
    rankedPeople.sort((a, b) => {
      if (a.industryScore !== b.industryScore) return a.industryScore - b.industryScore;
      if (a.sizeScore !== b.sizeScore) return a.sizeScore - b.sizeScore;
      if (a.titleScore !== b.titleScore) return a.titleScore - b.titleScore;
      return b.lastActionDate.getTime() - a.lastActionDate.getTime();
    });
    
    // Take top 50 people for speedrun
    const top50People = rankedPeople.slice(0, 50);
    
    console.log(`\n📋 Top 50 people for speedrun ranking:`);
    top50People.forEach((person, index) => {
      const rank = index + 1;
      console.log(`  ${rank}. ${person.fullName} (${person.company.name}) - ${person.jobTitle || 'No title'}`);
    });
    
    // Update people with new ranks in batches
    console.log(`\n🔄 Updating top 50 people with speedrun ranks...`);
    
    for (let i = 0; i < top50People.length; i++) {
      const person = top50People[i];
      const newRank = i + 1;
      const nextActionDate = calculateRankBasedDate(newRank, person.lastActionDate);
      
      await prisma.people.update({
        where: { id: person.id },
        data: {
          globalRank: newRank,
          nextActionDate: nextActionDate
        }
      });
      
      if ((i + 1) % 10 === 0) {
        console.log(`  Updated ${i + 1}/50 people...`);
      }
    }
    
    // Set remaining people to rank > 50 in batches
    const remainingPeople = rankedPeople.slice(50);
    if (remainingPeople.length > 0) {
      console.log(`\n🔄 Setting ${remainingPeople.length} remaining people to rank > 50...`);
      
      for (let i = 0; i < remainingPeople.length; i++) {
        const person = remainingPeople[i];
        const newRank = 51 + i;
        const nextActionDate = calculateRankBasedDate(newRank, person.lastActionDate);
        
        await prisma.people.update({
          where: { id: person.id },
          data: {
            globalRank: newRank,
            nextActionDate: nextActionDate
          }
        });
        
        if ((i + 1) % 500 === 0) {
          console.log(`  Updated ${i + 1}/${remainingPeople.length} remaining people...`);
        }
      }
    }
    
    console.log('✅ Demo dan speedrun ranks assigned successfully!');
    
    // Verify the results
    const speedrunCount = await prisma.people.count({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        mainSellerId: danId,
        globalRank: { not: null, gte: 1, lte: 50 }
      }
    });
    
    console.log(`\n📊 Final speedrun count for dan in Demo: ${speedrunCount} people`);
    
  } catch (error) {
    console.error('❌ Error assigning Demo dan speedrun ranks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignDemoDanSpeedrunRanks();
