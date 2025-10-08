/**
 * 🏆 HIERARCHICAL RANKING SYSTEM EXECUTOR
 * 
 * This script runs the hierarchical ranking system to populate:
 * - Company ranks (1-400)
 * - Person ranks (1-4000 within each company)
 * - Sub-rankings for leads/prospects/opportunities
 */

import { prisma } from '../src/platform/database/prisma-client';

interface CompanyRanking {
  id: string;
  name: string;
  rank: number;
  score: number;
  totalValue: number;
  opportunityCount: number;
  peopleCount: number;
}

interface PersonRanking {
  id: string;
  name: string;
  companyId: string;
  companyName: string;
  companyRank: number;
  personRank: number;
  globalRank: number;
  score: number;
}

async function runHierarchicalRanking(workspaceId: string) {
  console.log(`🏆 [HIERARCHICAL RANKING] Starting for workspace: ${workspaceId}`);
  
  try {
    // Step 1: Get all companies and calculate scores
    console.log(`📊 [STEP 1] Calculating company scores...`);
    const companies = await prisma.companies.findMany({
      where: { workspaceId, deletedAt: null },
      include: {
        people: {
          where: { deletedAt: null },
          select: { id: true }
        }
      }
    });

    // Calculate company scores
    const scoredCompanies = companies.map(company => {
      const peopleCount = company.people.length;
      
      // Company scoring formula
      let score = 0;
      
      // Company size factor (30% of score)
      score += Math.min(peopleCount * 0.1, 30);
      
      // Industry factor (20% of score)
      const industryScores: Record<string, number> = {
        'Technology': 10,
        'Finance': 9,
        'Healthcare': 8,
        'Manufacturing': 7,
        'Legal': 6,
        'Real Estate': 5,
        'Construction': 4
      };
      score += industryScores[company.industry || ''] || 3;
      
      // Company name factor (10% of score) - prioritize recognizable companies
      if (company.name && company.name.length > 5) {
        score += 5;
      }
      
      // Random factor for variety (40% of score)
      score += Math.random() * 40;
      
      return {
        id: company.id,
        name: company.name,
        score,
        peopleCount
      };
    });

    // Sort by score and assign ranks 1-400
    const rankedCompanies = scoredCompanies
      .sort((a, b) => b.score - a.score)
      .slice(0, 400) // Limit to top 400 companies
      .map((company, index) => ({
        ...company,
        rank: index + 1
      }));

    console.log(`✅ [STEP 1] Ranked ${rankedCompanies.length} companies`);

    // Step 2: Update company ranks in database
    console.log(`💾 [STEP 2] Updating company ranks in database...`);
    for (const company of rankedCompanies) {
      await prisma.companies.update({
        where: { id: company.id },
        data: { rank: company.rank }
      });
    }

    // Step 3: Rank people within each company
    console.log(`👥 [STEP 3] Ranking people within companies...`);
    const allPersonRankings: PersonRanking[] = [];
    let globalPersonRank = 1;

    for (const company of rankedCompanies) {
      // Get people for this company
      const people = await prisma.people.findMany({
        where: {
          workspaceId,
          companyId: company.id,
          deletedAt: null
        },
        orderBy: [
          { updatedAt: 'desc' }
        ],
        take: 4000 // Limit to 4000 people per company
      });

      // Calculate person scores within company
      const scoredPeople = people.map((person, index) => {
        // Person scoring formula
        let score = 0;
        
        // Base score from company ranking (40% of person score)
        score += company.score * 0.4;
        
        // Person-specific factors (60% of person score)
        if (person.jobTitle && person.jobTitle.length > 5) {
          score += 20; // Job title factor
        }
        if (person.email && person.email.includes('@')) {
          score += 10; // Email factor
        }
        if (person.phone && person.phone !== 'Unknown Phone') {
          score += 10; // Phone factor
        }
        
        // Random factor for variety
        score += Math.random() * 20;
        
        return {
          id: person.id,
          name: person.fullName || `${person.firstName} ${person.lastName}`,
          companyId: company.id,
          companyName: company.name,
          companyRank: company.rank,
          score
        };
      });

      // Sort by score and assign ranks within company
      const rankedPeople = scoredPeople
        .sort((a, b) => b.score - a.score)
        .map((person, index) => ({
          ...person,
          personRank: index + 1,
          globalRank: globalPersonRank + index
        }));

      allPersonRankings.push(...rankedPeople);
      globalPersonRank += rankedPeople.length;

      console.log(`✅ [STEP 3] Ranked ${rankedPeople.length} people in ${company.name}`);
    }

    // Step 4: Update person ranks in database
    console.log(`💾 [STEP 4] Updating person ranks in database...`);
    for (const person of allPersonRankings) {
      await prisma.people.update({
        where: { id: person.id },
        data: { 
          rank: person.personRank,
          // Store additional ranking data in custom fields if needed
        }
      });
    }

    // Step 5: Create sub-rankings for leads/prospects/opportunities
    console.log(`📋 [STEP 5] Creating sub-rankings for leads/prospects/opportunities...`);
    
    // Get leads with person relationships
    const leads = await prisma.leads.findMany({
      where: { workspaceId, deletedAt: null },
      select: { id: true, personId: true, estimatedValue: true, status: true }
    });

    // Group leads by person and rank within each person
    const leadsByPerson = new Map<string, any[]>();
    leads.forEach(lead => {
      if (lead.personId) {
        if (!leadsByPerson.has(lead.personId)) {
          leadsByPerson.set(lead.personId, []);
        }
        leadsByPerson.get(lead.personId)!.push(lead);
      }
    });

    // Update lead ranks
    for (const [personId, personLeads] of leadsByPerson) {
      const person = allPersonRankings.find(p => p.id === personId);
      if (person) {
        // Sort leads by value and assign sub-ranks
        const sortedLeads = personLeads.sort((a, b) => (b.estimatedValue || 0) - (a.estimatedValue || 0));
        for (let i = 0; i < sortedLeads.length; i++) {
          await prisma.leads.update({
            where: { id: sortedLeads[i].id },
            data: { rank: i + 1 }
          });
        }
      }
    }

    // Similar process for prospects and opportunities
    const prospects = await prisma.prospects.findMany({
      where: { workspaceId, deletedAt: null },
      select: { id: true, personId: true, estimatedValue: true, status: true }
    });

    const prospectsByPerson = new Map<string, any[]>();
    prospects.forEach(prospect => {
      if (prospect.personId) {
        if (!prospectsByPerson.has(prospect.personId)) {
          prospectsByPerson.set(prospect.personId, []);
        }
        prospectsByPerson.get(prospect.personId)!.push(prospect);
      }
    });

    for (const [personId, personProspects] of prospectsByPerson) {
      const person = allPersonRankings.find(p => p.id === personId);
      if (person) {
        const sortedProspects = personProspects.sort((a, b) => (b.estimatedValue || 0) - (a.estimatedValue || 0));
        for (let i = 0; i < sortedProspects.length; i++) {
          await prisma.prospects.update({
            where: { id: sortedProspects[i].id },
            data: { rank: i + 1 }
          });
        }
      }
    }

    const opportunities = await prisma.opportunities.findMany({
      where: { workspaceId, deletedAt: null },
      select: { id: true, personId: true, amount: true, stage: true }
    });

    const opportunitiesByPerson = new Map<string, any[]>();
    opportunities.forEach(opportunity => {
      if (opportunity.personId) {
        if (!opportunitiesByPerson.has(opportunity.personId)) {
          opportunitiesByPerson.set(opportunity.personId, []);
        }
        opportunitiesByPerson.get(opportunity.personId)!.push(opportunity);
      }
    });

    for (const [personId, personOpportunities] of opportunitiesByPerson) {
      const person = allPersonRankings.find(p => p.id === personId);
      if (person) {
        const sortedOpportunities = personOpportunities.sort((a, b) => (b.amount || 0) - (a.amount || 0));
        for (let i = 0; i < sortedOpportunities.length; i++) {
          await prisma.opportunities.update({
            where: { id: sortedOpportunities[i].id },
            data: { rank: i + 1 }
          });
        }
      }
    }

    console.log(`🎉 [HIERARCHICAL RANKING] Completed successfully!`);
    console.log(`📊 [SUMMARY] Results:`);
    console.log(`   - ${rankedCompanies.length} companies ranked (1-400)`);
    console.log(`   - ${allPersonRankings.length} people ranked (1-4000 per company)`);
    console.log(`   - ${leads.length} leads with sub-rankings`);
    console.log(`   - ${prospects.length} prospects with sub-rankings`);
    console.log(`   - ${opportunities.length} opportunities with sub-rankings`);

  } catch (error) {
    console.error(`❌ [HIERARCHICAL RANKING] Error:`, error);
    throw error;
  }
}

// Main execution
async function main() {
  const workspaceId = process.argv[2] || '01K1VBYV8ETM2RCQA4GNN9EG72'; // Default to Dano's workspace
  
  console.log(`🚀 [HIERARCHICAL RANKING] Starting execution...`);
  console.log(`📋 [CONFIG] Workspace ID: ${workspaceId}`);
  
  await runHierarchicalRanking(workspaceId);
  
  console.log(`✅ [HIERARCHICAL RANKING] Execution completed!`);
  process.exit(0);
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error(`💥 [HIERARCHICAL RANKING] Fatal error:`, error);
    process.exit(1);
  });
}

export { runHierarchicalRanking };
