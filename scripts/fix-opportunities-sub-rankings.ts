/**
 * 🔧 FIX OPPORTUNITIES SUB-RANKINGS
 * 
 * This script specifically fixes opportunities sub-rankings by:
 * 1. Linking opportunities to people
 * 2. Creating sub-rankings within each person
 */

import { prisma } from '../src/platform/database/prisma-client';

async function fixOpportunitiesSubRankings(workspaceId: string) {
  console.log(`🔧 [OPPORTUNITIES SUB-RANKINGS] Starting for workspace: ${workspaceId}`);
  
  try {
    // Step 1: Get all opportunities
    const opportunities = await prisma.opportunities.findMany({
      where: { workspaceId, deletedAt: null },
      select: { 
        id: true, 
        name: true, 
        amount: true, 
        stage: true, 
        personId: true,
        companyId: true
      }
    });

    console.log(`📊 [STEP 1] Found ${opportunities.length} opportunities`);

    // Step 2: Get all people with their company relationships
    const people = await prisma.people.findMany({
      where: { workspaceId, deletedAt: null },
      include: {
        company: {
          select: { id: true, name: true, rank: true }
        }
      }
    });

    console.log(`📊 [STEP 2] Found ${people.length} people`);

    // Step 3: Link opportunities to people by company
    let opportunitiesLinked = 0;
    for (const opportunity of opportunities) {
      if (!opportunity.personId && opportunity.companyId) {
        // Find people in the same company
        const companyPeople = people.filter(p => p.companyId === opportunity.companyId);
        
        if (companyPeople.length > 0) {
          // Link to the first person in the company (or could be more sophisticated)
          const targetPerson = companyPeople[0];
          
          await prisma.opportunities.update({
            where: { id: opportunity.id },
            data: { personId: targetPerson.id }
          });
          
          opportunitiesLinked++;
        }
      }
    }

    console.log(`✅ [STEP 3] Linked ${opportunitiesLinked} opportunities to people`);

    // Step 4: Create sub-rankings for opportunities within each person
    const opportunitiesWithPerson = await prisma.opportunities.findMany({
      where: { 
        workspaceId, 
        deletedAt: null,
        personId: { not: null }
      },
      select: { 
        id: true, 
        name: true, 
        amount: true, 
        stage: true, 
        personId: true
      }
    });

    console.log(`📊 [STEP 4] Found ${opportunitiesWithPerson.length} opportunities with person links`);

    // Group opportunities by person
    const opportunitiesByPerson = new Map<string, any[]>();
    opportunitiesWithPerson.forEach(opportunity => {
      if (opportunity.personId) {
        if (!opportunitiesByPerson.has(opportunity.personId)) {
          opportunitiesByPerson.set(opportunity.personId, []);
        }
        opportunitiesByPerson.get(opportunity.personId)!.push(opportunity);
      }
    });

    // Create sub-rankings within each person
    let opportunitiesRanked = 0;
    for (const [personId, personOpportunities] of opportunitiesByPerson) {
      // Sort opportunities by amount (highest first)
      const sortedOpportunities = personOpportunities.sort((a, b) => (b.amount || 0) - (a.amount || 0));
      
      // Assign sub-ranks
      for (let i = 0; i < sortedOpportunities.length; i++) {
        await prisma.opportunities.update({
          where: { id: sortedOpportunities[i].id },
          data: { rank: i + 1 }
        });
        opportunitiesRanked++;
      }
    }

    console.log(`✅ [STEP 4] Ranked ${opportunitiesRanked} opportunities with sub-rankings`);

    // Step 5: Verify results
    const finalOpportunities = await prisma.opportunities.findMany({
      where: { workspaceId, deletedAt: null },
      select: { 
        id: true, 
        name: true, 
        amount: true, 
        rank: true, 
        personId: true,
        company: {
          select: { name: true, rank: true }
        }
      },
      orderBy: { rank: 'asc' },
      take: 10
    });

    console.log(`📊 [STEP 5] Sample of ranked opportunities:`);
    finalOpportunities.forEach(opp => {
      console.log(`   - ${opp.name}: Rank ${opp.rank}, Amount $${opp.amount}, Company: ${opp.company?.name}, Person: ${opp.personId ? 'Linked' : 'Not Linked'}`);
    });

    console.log(`🎉 [OPPORTUNITIES SUB-RANKINGS] Completed successfully!`);
    console.log(`📊 [SUMMARY] Results:`);
    console.log(`   - ${opportunities.length} total opportunities`);
    console.log(`   - ${opportunitiesLinked} opportunities linked to people`);
    console.log(`   - ${opportunitiesRanked} opportunities with sub-rankings`);

  } catch (error) {
    console.error(`❌ [OPPORTUNITIES SUB-RANKINGS] Error:`, error);
    throw error;
  }
}

// Main execution
async function main() {
  const workspaceId = process.argv[2] || '01K1VBYV8ETM2RCQA4GNN9EG72'; // Default to Dano's workspace
  
  console.log(`🚀 [OPPORTUNITIES SUB-RANKINGS] Starting execution...`);
  console.log(`📋 [CONFIG] Workspace ID: ${workspaceId}`);
  
  await fixOpportunitiesSubRankings(workspaceId);
  
  console.log(`✅ [OPPORTUNITIES SUB-RANKINGS] Execution completed!`);
  process.exit(0);
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error(`💥 [OPPORTUNITIES SUB-RANKINGS] Fatal error:`, error);
    process.exit(1);
  });
}

export { fixOpportunitiesSubRankings };

