/**
 * 🔧 FIX SUB-RANKINGS FOR ALL ENTITY TYPES
 * 
 * This script fixes sub-rankings for:
 * - Prospects (1,384 with sub-rankings)
 * - Opportunities (56 with sub-rankings) 
 * - Leads (Ready for sub-rankings)
 */

import { prisma } from '../src/platform/database/prisma-client';

async function fixSubRankings(workspaceId: string) {
  console.log(`🔧 [SUB-RANKINGS] Starting for workspace: ${workspaceId}`);
  
  try {
    // Step 1: Get all people with their company relationships
    const people = await prisma.people.findMany({
      where: { workspaceId, deletedAt: null },
      include: {
        company: {
          select: { id: true, name: true, rank: true }
        }
      },
      orderBy: [
        { company: { rank: 'asc' } },
        { rank: 'asc' }
      ]
    });

    console.log(`📊 [STEP 1] Found ${people.length} people with company relationships`);

    // Step 2: Fix Prospects sub-rankings
    console.log(`📋 [STEP 2] Fixing Prospects sub-rankings...`);
    const prospects = await prisma.prospects.findMany({
      where: { workspaceId, deletedAt: null },
      select: { id: true, fullName: true, estimatedValue: true, status: true, personId: true }
    });

    console.log(`📊 [STEP 2] Found ${prospects.length} prospects`);

    // Group prospects by person and rank within each person
    const prospectsByPerson = new Map<string, any[]>();
    prospects.forEach(prospect => {
      if (prospect.personId) {
        if (!prospectsByPerson.has(prospect.personId)) {
          prospectsByPerson.set(prospect.personId, []);
        }
        prospectsByPerson.get(prospect.personId)!.push(prospect);
      }
    });

    let prospectsUpdated = 0;
    for (const [personId, personProspects] of prospectsByPerson) {
      const person = people.find(p => p.id === personId);
      if (person) {
        // Sort prospects by value and assign sub-ranks
        const sortedProspects = personProspects.sort((a, b) => (b.estimatedValue || 0) - (a.estimatedValue || 0));
        for (let i = 0; i < sortedProspects.length; i++) {
          await prisma.prospects.update({
            where: { id: sortedProspects[i].id },
            data: { rank: i + 1 }
          });
          prospectsUpdated++;
        }
      }
    }

    console.log(`✅ [STEP 2] Updated ${prospectsUpdated} prospects with sub-rankings`);

    // Step 3: Fix Opportunities sub-rankings
    console.log(`💰 [STEP 3] Fixing Opportunities sub-rankings...`);
    const opportunities = await prisma.opportunities.findMany({
      where: { workspaceId, deletedAt: null },
      select: { id: true, name: true, amount: true, stage: true, personId: true }
    });

    console.log(`📊 [STEP 3] Found ${opportunities.length} opportunities`);

    // Group opportunities by person and rank within each person
    const opportunitiesByPerson = new Map<string, any[]>();
    opportunities.forEach(opportunity => {
      if (opportunity.personId) {
        if (!opportunitiesByPerson.has(opportunity.personId)) {
          opportunitiesByPerson.set(opportunity.personId, []);
        }
        opportunitiesByPerson.get(opportunity.personId)!.push(opportunity);
      }
    });

    let opportunitiesUpdated = 0;
    for (const [personId, personOpportunities] of opportunitiesByPerson) {
      const person = people.find(p => p.id === personId);
      if (person) {
        // Sort opportunities by amount and assign sub-ranks
        const sortedOpportunities = personOpportunities.sort((a, b) => (b.amount || 0) - (a.amount || 0));
        for (let i = 0; i < sortedOpportunities.length; i++) {
          await prisma.opportunities.update({
            where: { id: sortedOpportunities[i].id },
            data: { rank: i + 1 }
          });
          opportunitiesUpdated++;
        }
      }
    }

    console.log(`✅ [STEP 3] Updated ${opportunitiesUpdated} opportunities with sub-rankings`);

    // Step 4: Fix Leads sub-rankings
    console.log(`🎯 [STEP 4] Fixing Leads sub-rankings...`);
    const leads = await prisma.leads.findMany({
      where: { workspaceId, deletedAt: null },
      select: { id: true, fullName: true, estimatedValue: true, status: true, personId: true }
    });

    console.log(`📊 [STEP 4] Found ${leads.length} leads`);

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

    let leadsUpdated = 0;
    for (const [personId, personLeads] of leadsByPerson) {
      const person = people.find(p => p.id === personId);
      if (person) {
        // Sort leads by value and assign sub-ranks
        const sortedLeads = personLeads.sort((a, b) => (b.estimatedValue || 0) - (a.estimatedValue || 0));
        for (let i = 0; i < sortedLeads.length; i++) {
          await prisma.leads.update({
            where: { id: sortedLeads[i].id },
            data: { rank: i + 1 }
          });
          leadsUpdated++;
        }
      }
    }

    console.log(`✅ [STEP 4] Updated ${leadsUpdated} leads with sub-rankings`);

    // Step 5: Create person-entity relationships for entities without personId
    console.log(`🔗 [STEP 5] Creating person-entity relationships...`);
    
    // For prospects without personId, try to match by name
    const prospectsWithoutPerson = await prisma.prospects.findMany({
      where: { 
        workspaceId, 
        deletedAt: null, 
        personId: null 
      },
      take: 100 // Limit to avoid too many updates
    });

    let prospectsLinked = 0;
    for (const prospect of prospectsWithoutPerson) {
      // Try to find matching person by name
      const matchingPerson = people.find(p => 
        p.fullName?.toLowerCase().includes(prospect.fullName?.toLowerCase() || '') ||
        prospect.fullName?.toLowerCase().includes(p.fullName?.toLowerCase() || '')
      );

      if (matchingPerson) {
        await prisma.prospects.update({
          where: { id: prospect.id },
          data: { personId: matchingPerson.id }
        });
        prospectsLinked++;
      }
    }

    console.log(`✅ [STEP 5] Linked ${prospectsLinked} prospects to people`);

    // Similar for opportunities
    const opportunitiesWithoutPerson = await prisma.opportunities.findMany({
      where: { 
        workspaceId, 
        deletedAt: null, 
        personId: null 
      },
      take: 50 // Limit to avoid too many updates
    });

    let opportunitiesLinked = 0;
    for (const opportunity of opportunitiesWithoutPerson) {
      // Try to find matching person by name
      const matchingPerson = people.find(p => 
        p.fullName?.toLowerCase().includes(opportunity.name?.toLowerCase() || '') ||
        opportunity.name?.toLowerCase().includes(p.fullName?.toLowerCase() || '')
      );

      if (matchingPerson) {
        await prisma.opportunities.update({
          where: { id: opportunity.id },
          data: { personId: matchingPerson.id }
        });
        opportunitiesLinked++;
      }
    }

    console.log(`✅ [STEP 5] Linked ${opportunitiesLinked} opportunities to people`);

    console.log(`🎉 [SUB-RANKINGS] Completed successfully!`);
    console.log(`📊 [SUMMARY] Results:`);
    console.log(`   - ${prospectsUpdated} prospects with sub-rankings`);
    console.log(`   - ${opportunitiesUpdated} opportunities with sub-rankings`);
    console.log(`   - ${leadsUpdated} leads with sub-rankings`);
    console.log(`   - ${prospectsLinked} prospects linked to people`);
    console.log(`   - ${opportunitiesLinked} opportunities linked to people`);

  } catch (error) {
    console.error(`❌ [SUB-RANKINGS] Error:`, error);
    throw error;
  }
}

// Main execution
async function main() {
  const workspaceId = process.argv[2] || '01K1VBYV8ETM2RCQA4GNN9EG72'; // Default to Dano's workspace
  
  console.log(`🚀 [SUB-RANKINGS] Starting execution...`);
  console.log(`📋 [CONFIG] Workspace ID: ${workspaceId}`);
  
  await fixSubRankings(workspaceId);
  
  console.log(`✅ [SUB-RANKINGS] Execution completed!`);
  process.exit(0);
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error(`💥 [SUB-RANKINGS] Fatal error:`, error);
    process.exit(1);
  });
}

export { fixSubRankings };
