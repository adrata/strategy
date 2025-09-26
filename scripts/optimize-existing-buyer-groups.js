/**
 * 🎯 OPTIMIZE EXISTING BUYER GROUPS
 * 
 * Goals:
 * 1. Keep all existing buyer group roles (3,157 people)
 * 2. Cap large buyer groups at 8-12 people
 * 3. Ensure every buyer group has a decision maker
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class BuyerGroupOptimizer {
  constructor() {
    this.workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    this.optimizedCompanies = 0;
    this.cappedBuyerGroups = 0;
    this.addedDecisionMakers = 0;
  }

  async optimizeExistingBuyerGroups() {
    console.log('🎯 OPTIMIZING EXISTING BUYER GROUPS...\n');
    
    try {
      // Get all companies with their people and buyer group roles
      const companies = await prisma.companies.findMany({
        where: {
          workspaceId: this.workspaceId,
          deletedAt: null,
          rank: { lt: 999 } // Exclude internal company
        },
        include: {
          people: {
            where: { 
              deletedAt: null,
              buyerGroupRole: { not: null } // Only people with buyer group roles
            },
            select: {
              id: true,
              fullName: true,
              buyerGroupRole: true,
              rank: true,
              customFields: true
            }
          }
        },
        orderBy: { rank: 'asc' }
      });

      console.log(`📊 Found ${companies.length} companies to optimize`);

      for (const company of companies) {
        if (company.people.length === 0) {
          console.log(`⚠️ Skipping ${company.name} - no buyer group members`);
          continue;
        }

        console.log(`\n🏢 Optimizing ${company.name} (${company.people.length} buyer group members)`);
        
        // Step 1: Check if buyer group is too large (>12 people)
        if (company.people.length > 12) {
          console.log(`📏 Large buyer group detected (${company.people.length} people) - capping to 12`);
          await this.capLargeBuyerGroup(company);
          this.cappedBuyerGroups++;
        }
        
        // Step 2: Ensure at least one Decision Maker
        const hasDecisionMaker = company.people.some(person => person.buyerGroupRole === 'Decision Maker');
        if (!hasDecisionMaker) {
          console.log(`🎯 No Decision Maker found - promoting highest-ranking person`);
          await this.addDecisionMaker(company);
          this.addedDecisionMakers++;
        }
        
        this.optimizedCompanies++;
      }

      console.log(`\n✅ OPTIMIZATION COMPLETE!`);
      console.log(`📊 Optimized ${this.optimizedCompanies} companies`);
      console.log(`📏 Capped ${this.cappedBuyerGroups} large buyer groups`);
      console.log(`🎯 Added Decision Makers to ${this.addedDecisionMakers} companies`);

    } catch (error) {
      console.error('❌ Error during optimization:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  async capLargeBuyerGroup(company) {
    // Sort people by priority (Decision Makers first, then by rank)
    const sortedPeople = company.people.sort((a, b) => {
      // Decision Makers first
      if (a.buyerGroupRole === 'Decision Maker' && b.buyerGroupRole !== 'Decision Maker') return -1;
      if (b.buyerGroupRole === 'Decision Maker' && a.buyerGroupRole !== 'Decision Maker') return 1;
      
      // Then by rank (lower is better)
      return (a.rank || 999) - (b.rank || 999);
    });

    // Keep top 12 people
    const keepPeople = sortedPeople.slice(0, 12);
    const removePeople = sortedPeople.slice(12);

    // Remove buyer group role from excess people
    for (const person of removePeople) {
      await prisma.people.update({
        where: { id: person.id },
        data: { 
          buyerGroupRole: null,
          customFields: {
            ...person.customFields,
            buyerGroupOptimized: true,
            removedFromBuyerGroup: true
          }
        }
      });
      console.log(`  👻 Removed ${person.fullName} from buyer group (${person.buyerGroupRole})`);
    }

    console.log(`  ✅ Kept ${keepPeople.length} people, removed ${removePeople.length} people`);
  }

  async addDecisionMaker(company) {
    // Find the highest-ranking person (lowest rank number)
    const sortedPeople = company.people.sort((a, b) => (a.rank || 999) - (b.rank || 999));
    const topPerson = sortedPeople[0];

    if (topPerson) {
      await prisma.people.update({
        where: { id: topPerson.id },
        data: { 
          buyerGroupRole: 'Decision Maker',
          customFields: {
            ...topPerson.customFields,
            buyerGroupOptimized: true,
            promotedToDecisionMaker: true
          }
        }
      });
      console.log(`  🎯 Promoted ${topPerson.fullName} to Decision Maker`);
    }
  }
}

// Run the optimization
async function runOptimization() {
  const optimizer = new BuyerGroupOptimizer();
  await optimizer.optimizeExistingBuyerGroups();
}

runOptimization()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
