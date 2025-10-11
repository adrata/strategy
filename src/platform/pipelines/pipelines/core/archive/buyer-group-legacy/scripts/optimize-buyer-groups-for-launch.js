/**
 * 🚀 BUYER GROUP OPTIMIZATION FOR CLIENT LAUNCH
 * 
 * This script optimizes buyer groups for all companies and hides non-buyer-group people
 * from all sections (people, companies, leads, speedrun).
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class BuyerGroupLaunchOptimizer {
  constructor() {
    this.workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1'; // TOP workspace
    this.optimizedCompanies = 0;
    this.hiddenPeople = 0;
  }

  async optimizeAllCompanies() {
    console.log('🚀 STARTING BUYER GROUP OPTIMIZATION FOR CLIENT LAUNCH...\n');
    
    try {
      // Step 1: Get all companies with people
      const companies = await prisma.companies.findMany({
        where: {
          workspaceId: this.workspaceId,
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
              email: true,
              mobilePhone: true,
              companyId: true,
              rank: true,
              buyerGroupRole: true,
              customFields: true
            }
          }
        },
        orderBy: { rank: 'asc' }
      });

      console.log(`📊 Found ${companies.length} companies to optimize`);

      // Step 2: Optimize each company's buyer group
      for (const company of companies) {
        if (company.people.length === 0) {
          console.log(`⚠️ Skipping ${company.name} - no people`);
          continue;
        }

        console.log(`\n🏢 Optimizing ${company.name} (${company.people.length} people)`);
        
        // Determine company size and target buyer group size
        const companySize = this.determineCompanySize(company.people.length);
        console.log(`📏 Company size: ${companySize.category} (target: ${companySize.targetSize} people)`);

        // Select optimal buyer group
        const buyerGroup = this.selectOptimalBuyerGroup(company.people, companySize);
        console.log(`🎯 Selected ${buyerGroup.length} people for buyer group`);

        // Mark people as buyer group members or hide them
        await this.updatePeopleVisibility(company.people, buyerGroup, company.name);
        
        this.optimizedCompanies++;
      }

      console.log(`\n✅ OPTIMIZATION COMPLETE!`);
      console.log(`📊 Optimized ${this.optimizedCompanies} companies`);
      console.log(`👥 Hidden ${this.hiddenPeople} non-buyer-group people`);

    } catch (error) {
      console.error('❌ Error during optimization:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  determineCompanySize(peopleCount) {
    if (peopleCount <= 10) {
      return {
        category: 'small',
        targetSize: Math.min(peopleCount, 2),
        roleDistribution: {
          decisionMakers: 1,
          champions: Math.min(1, peopleCount - 1),
          stakeholders: 0,
          blockers: 0,
          introducers: 0
        }
      };
    } else if (peopleCount <= 50) {
      return {
        category: 'medium',
        targetSize: Math.min(peopleCount, 6),
        roleDistribution: {
          decisionMakers: 1,
          champions: 1,
          stakeholders: 2,
          blockers: 1,
          introducers: 1
        }
      };
    } else {
      return {
        category: 'large',
        targetSize: Math.min(peopleCount, 12),
        roleDistribution: {
          decisionMakers: 2,
          champions: 2,
          stakeholders: 3,
          blockers: 2,
          introducers: 3
        }
      };
    }
  }

  selectOptimalBuyerGroup(allPeople, companySize) {
    // Assign roles to all people
    const peopleWithRoles = allPeople.map(person => ({
      ...person,
      role: this.assignRole(person.jobTitle || ''),
      influence: this.calculateInfluence(person),
      contactQuality: this.assessContactQuality(person)
    }));

    // Sort by priority
    const sortedPeople = peopleWithRoles.sort((a, b) => {
      const scoreA = this.calculateSelectionScore(a);
      const scoreB = this.calculateSelectionScore(b);
      return scoreB - scoreA;
    });

    // Select based on role distribution
    const selected = [];
    const roleCounts = {
      decisionMakers: 0,
      champions: 0,
      stakeholders: 0,
      blockers: 0,
      introducers: 0
    };

    for (const person of sortedPeople) {
      if (selected.length >= companySize.targetSize) break;

      const role = person.role;
      const roleKey = role.toLowerCase().replace(' ', '') + 's';
      const maxForRole = companySize.roleDistribution[roleKey];
      const currentCount = roleCounts[roleKey];

      if (currentCount < maxForRole) {
        selected.push(person);
        roleCounts[roleKey]++;
      }
    }

    // Ensure at least one Decision Maker
    if (!selected.some(p => p.role === 'Decision Maker') && sortedPeople.length > 0) {
      const topPerson = sortedPeople[0];
      if (topPerson) {
        // Replace lowest priority person
        const lowestPriority = selected.sort((a, b) => a.rank - b.rank)[selected.length - 1];
        const index = selected.findIndex(p => p.id === lowestPriority.id);
        if (index !== -1) {
          selected[index] = { ...topPerson, role: 'Decision Maker', influence: 'high' };
        }
      }
    }

    return selected;
  }

  assignRole(title) {
    if (!title) return 'Stakeholder';
    
    const titleLower = title.toLowerCase();
    
    // Decision Makers
    if (titleLower.includes('ceo') || titleLower.includes('president') || titleLower.includes('founder')) {
      return 'Decision Maker';
    }
    if (titleLower.includes('vp') || titleLower.includes('vice president') || titleLower.includes('director')) {
      return 'Decision Maker';
    }
    if (titleLower.includes('cfo') || titleLower.includes('cto') || titleLower.includes('cmo') || titleLower.includes('coo')) {
      return 'Decision Maker';
    }
    
    // Champions
    if (titleLower.includes('engineer') || titleLower.includes('developer') || titleLower.includes('architect')) {
      return 'Champion';
    }
    if (titleLower.includes('consultant') || titleLower.includes('advisor') || titleLower.includes('expert')) {
      return 'Champion';
    }
    
    // Blockers
    if (titleLower.includes('legal') || titleLower.includes('compliance') || titleLower.includes('security')) {
      return 'Blocker';
    }
    if (titleLower.includes('procurement') || titleLower.includes('purchasing')) {
      return 'Blocker';
    }
    
    // Introducers
    if (titleLower.includes('sales') || titleLower.includes('marketing') || titleLower.includes('business development')) {
      return 'Introducer';
    }
    if (titleLower.includes('account') || titleLower.includes('relationship') || titleLower.includes('partnership')) {
      return 'Introducer';
    }
    
    return 'Stakeholder';
  }

  calculateInfluence(person) {
    const title = (person.jobTitle || '').toLowerCase();
    
    if (title.includes('ceo') || title.includes('president') || title.includes('vp') || title.includes('director')) {
      return 'high';
    }
    if (title.includes('manager') || title.includes('lead') || title.includes('senior')) {
      return 'medium';
    }
    return 'low';
  }

  assessContactQuality(person) {
    let score = 0;
    if (person.email) score += 2;
    if (person.mobilePhone) score += 1;
    if (person.customFields?.linkedin) score += 1;
    
    if (score >= 4) return 'excellent';
    if (score >= 3) return 'good';
    if (score >= 2) return 'fair';
    return 'poor';
  }

  calculateSelectionScore(person) {
    let score = 0;
    
    // Influence
    if (person.influence === 'high') score += 10;
    else if (person.influence === 'medium') score += 5;
    else score += 1;
    
    // Contact quality
    if (person.contactQuality === 'excellent') score += 8;
    else if (person.contactQuality === 'good') score += 5;
    else if (person.contactQuality === 'fair') score += 2;
    
    // Rank (lower is better)
    score += (100 - (person.rank || 999));
    
    return score;
  }

  async updatePeopleVisibility(allPeople, buyerGroup, companyName) {
    const buyerGroupIds = buyerGroup.map(p => p.id);
    
    for (const person of allPeople) {
      const isInBuyerGroup = buyerGroupIds.includes(person.id);
      
      if (isInBuyerGroup) {
        // Update buyer group role and make visible
        await prisma.people.update({
          where: { id: person.id },
          data: {
            buyerGroupRole: buyerGroup.find(p => p.id === person.id)?.role || 'Stakeholder',
            customFields: {
              ...person.customFields,
              isBuyerGroupMember: true,
              buyerGroupOptimized: true
            }
          }
        });
        console.log(`✅ ${person.fullName} - Buyer Group Member (${buyerGroup.find(p => p.id === person.id)?.role})`);
      } else {
        // Hide from all sections
        await prisma.people.update({
          where: { id: person.id },
          data: {
            customFields: {
              ...person.customFields,
              isBuyerGroupMember: false,
              hiddenFromSections: ['people', 'companies', 'leads', 'speedrun'],
              buyerGroupOptimized: true
            }
          }
        });
        console.log(`👻 ${person.fullName} - Hidden from all sections`);
        this.hiddenPeople++;
      }
    }
  }
}

// Run the optimization
async function runOptimization() {
  const optimizer = new BuyerGroupLaunchOptimizer();
  await optimizer.optimizeAllCompanies();
}

runOptimization()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
