const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * OPTIMIZE BUYER GROUP DISTRIBUTION
 * 
 * Goals:
 * 1. Ensure every buyer group has at least 1 Decision Maker
 * 2. Cap large buyer groups at 20-25 people maximum
 * 3. Maintain optimal 6-10 people for most companies
 * 4. Prioritize Decision Makers, Champions, and high-influence people
 */

async function optimizeBuyerGroupDistribution() {
  console.log('🚀 OPTIMIZING BUYER GROUP DISTRIBUTION...\n');
  
  const workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1';
  
  // Get all companies with their people
  const companies = await prisma.companies.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      rank: { lt: 999 } // Exclude internal company
    },
    include: {
      people: {
        where: { deletedAt: null },
        select: { 
          id: true, 
          fullName: true, 
          jobTitle: true,
          buyerGroupRole: true,
          customFields: true
        }
      }
    },
    orderBy: { rank: 'asc' }
  });
  
  console.log(`📊 Found ${companies.length} companies to analyze\n`);
  
  const optimizationResults = {
    companiesProcessed: 0,
    decisionMakersAdded: 0,
    oversizedGroupsReduced: 0,
    peopleRemoved: 0,
    errors: []
  };
  
  for (const company of companies) {
    try {
      const people = company.people;
      const currentSize = people.length;
      
      // Skip companies with no people
      if (currentSize === 0) {
        continue;
      }
      
      optimizationResults.companiesProcessed++;
      
      // 1. CHECK FOR DECISION MAKERS
      const decisionMakers = people.filter(p => p.buyerGroupRole === 'Decision Maker');
      const needsDecisionMaker = decisionMakers.length === 0;
      
      // 2. CHECK FOR OVERSIZED GROUPS
      const isOversized = currentSize > 20; // Cap at 20 people maximum
      const targetSize = Math.min(20, Math.max(6, Math.ceil(currentSize * 0.6))); // Cap at 20, minimum 6
      
      if (needsDecisionMaker || isOversized) {
        console.log(`🔧 Optimizing ${company.name}:`);
        console.log(`   Current: ${currentSize} people, ${decisionMakers.length} Decision Makers`);
        
        // Create priority scoring for people
        const peopleWithScores = people.map(person => {
          let score = 0;
          
          // Role priority (Decision Maker = highest)
          if (person.buyerGroupRole === 'Decision Maker') score += 1000;
          else if (person.buyerGroupRole === 'Champion') score += 800;
          else if (person.buyerGroupRole === 'Blocker') score += 600;
          else if (person.buyerGroupRole === 'Stakeholder') score += 400;
          else if (person.buyerGroupRole === 'Introducer') score += 200;
          
          // Influence level (from customFields)
          const influenceLevel = person.customFields?.influenceLevel;
          if (influenceLevel === 'High') score += 100;
          else if (influenceLevel === 'Medium') score += 50;
          else if (influenceLevel === 'Low') score += 10;
          
          // Job title indicators
          const title = (person.jobTitle || '').toLowerCase();
          if (title.includes('ceo') || title.includes('president') || title.includes('director')) score += 200;
          else if (title.includes('manager') || title.includes('lead')) score += 100;
          else if (title.includes('senior') || title.includes('principal')) score += 50;
          
          return { ...person, priorityScore: score };
        });
        
        // Sort by priority score (highest first)
        peopleWithScores.sort((a, b) => b.priorityScore - a.priorityScore);
        
        // Select top people for optimized buyer group
        const selectedPeople = peopleWithScores.slice(0, targetSize);
        
        // Ensure at least one Decision Maker
        const selectedDecisionMakers = selectedPeople.filter(p => p.buyerGroupRole === 'Decision Maker');
        if (selectedDecisionMakers.length === 0 && selectedPeople.length > 0) {
          // Promote the highest priority person to Decision Maker
          selectedPeople[0].buyerGroupRole = 'Decision Maker';
          optimizationResults.decisionMakersAdded++;
          console.log(`   ✅ Promoted ${selectedPeople[0].fullName} to Decision Maker`);
        }
        
        // Update people in database
        const peopleToUpdate = [];
        const peopleToRemove = [];
        
        for (const person of people) {
          const isSelected = selectedPeople.some(p => p.id === person.id);
          if (isSelected) {
            peopleToUpdate.push({
              id: person.id,
              buyerGroupRole: person.buyerGroupRole,
              customFields: {
                ...person.customFields,
                isBuyerGroupMember: true,
                buyerGroupOptimized: true
              }
            });
          } else {
            peopleToRemove.push({
              id: person.id,
              customFields: {
                ...person.customFields,
                isBuyerGroupMember: false,
                buyerGroupOptimized: true
              }
            });
          }
        }
        
        // Apply updates
        for (const update of peopleToUpdate) {
          await prisma.people.update({
            where: { id: update.id },
            data: {
              buyerGroupRole: update.buyerGroupRole,
              customFields: update.customFields
            }
          });
        }
        
        for (const remove of peopleToRemove) {
          await prisma.people.update({
            where: { id: remove.id },
            data: {
              customFields: remove.customFields
            }
          });
        }
        
        if (isOversized) {
          optimizationResults.oversizedGroupsReduced++;
          optimizationResults.peopleRemoved += (currentSize - targetSize);
          console.log(`   ✅ Reduced from ${currentSize} to ${targetSize} people`);
        }
        
        if (needsDecisionMaker) {
          console.log(`   ✅ Ensured Decision Maker presence`);
        }
        
        console.log(`   📊 Final: ${selectedPeople.length} people, ${selectedPeople.filter(p => p.buyerGroupRole === 'Decision Maker').length} Decision Makers\n`);
      }
      
    } catch (error) {
      console.error(`❌ Error optimizing ${company.name}:`, error.message);
      optimizationResults.errors.push({ company: company.name, error: error.message });
    }
  }
  
  console.log('🎯 OPTIMIZATION COMPLETE!');
  console.log('========================');
  console.log(`Companies processed: ${optimizationResults.companiesProcessed}`);
  console.log(`Decision Makers added: ${optimizationResults.decisionMakersAdded}`);
  console.log(`Oversized groups reduced: ${optimizationResults.oversizedGroupsReduced}`);
  console.log(`People removed from buyer groups: ${optimizationResults.peopleRemoved}`);
  
  if (optimizationResults.errors.length > 0) {
    console.log(`\n❌ Errors encountered: ${optimizationResults.errors.length}`);
    optimizationResults.errors.slice(0, 5).forEach(error => {
      console.log(`  • ${error.company}: ${error.error}`);
    });
  }
  
  console.log('\n✅ Buyer group distribution optimization completed!');
}

optimizeBuyerGroupDistribution()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
