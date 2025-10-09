/**
 * 🔧 FIX PERSON-COMPANY RELATIONSHIPS
 * 
 * This script fixes the person-company relationships and re-runs hierarchical ranking
 */

import { prisma } from '../src/platform/database/prisma-client';

async function fixPersonCompanyRelationships(workspaceId: string) {
  console.log(`🔧 [FIX RELATIONSHIPS] Starting for workspace: ${workspaceId}`);
  
  try {
    // Step 1: Get all people without companyId
    const peopleWithoutCompany = await prisma.people.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        companyId: null
      },
        select: {
          id: true,
          fullName: true,
          firstName: true,
          lastName: true,
          companyId: true
        }
    });

    console.log(`📊 [STEP 1] Found ${peopleWithoutCompany.length} people without companyId`);

    // Step 2: Get all companies
    const companies = await prisma.companies.findMany({
      where: { workspaceId, deletedAt: null },
      select: { id: true, name: true }
    });

    console.log(`📊 [STEP 2] Found ${companies.length} companies`);

    // Step 3: Match people to companies by company name
    let matchedCount = 0;
    for (const person of peopleWithoutCompany) {
      const companyName = person.company;
      if (companyName && companyName !== 'Unknown Company') {
        // Find matching company
        const matchingCompany = companies.find(c => 
          c.name.toLowerCase() === companyName.toLowerCase() ||
          c.name.toLowerCase().includes(companyName.toLowerCase()) ||
          companyName.toLowerCase().includes(c.name.toLowerCase())
        );

        if (matchingCompany) {
          await prisma.people.update({
            where: { id: person.id },
            data: { companyId: matchingCompany.id }
          });
          matchedCount++;
        }
      }
    }

    console.log(`✅ [STEP 3] Matched ${matchedCount} people to companies`);

    // Step 4: Re-run hierarchical ranking
    console.log(`🏆 [STEP 4] Re-running hierarchical ranking...`);
    
    // Get companies with ranks
    const rankedCompanies = await prisma.companies.findMany({
      where: { 
        workspaceId, 
        deletedAt: null,
        rank: { gte: 1, lte: 400 }
      },
      orderBy: { rank: 'asc' },
      select: { id: true, name: true, rank: true }
    });

    console.log(`📊 [STEP 4] Found ${rankedCompanies.length} ranked companies`);

    // Step 5: Rank people within each company
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

      // Update person ranks within company
      for (let i = 0; i < people.length; i++) {
        await prisma.people.update({
          where: { id: people[i].id },
          data: { 
            rank: i + 1, // Person rank within company (1-4000)
            // Store company rank in a custom field if needed
          }
        });
      }

      console.log(`✅ [STEP 5] Ranked ${people.length} people in ${company.name} (Company Rank: ${company.rank})`);
      globalPersonRank += people.length;
    }

    console.log(`🎉 [FIX RELATIONSHIPS] Completed successfully!`);
    console.log(`📊 [SUMMARY] Results:`);
    console.log(`   - ${matchedCount} people matched to companies`);
    console.log(`   - ${rankedCompanies.length} companies with ranks`);
    console.log(`   - People re-ranked within companies`);

  } catch (error) {
    console.error(`❌ [FIX RELATIONSHIPS] Error:`, error);
    throw error;
  }
}

// Main execution
async function main() {
  const workspaceId = process.argv[2] || '01K1VBYV8ETM2RCQA4GNN9EG72'; // Default to Dano's workspace
  
  console.log(`🚀 [FIX RELATIONSHIPS] Starting execution...`);
  console.log(`📋 [CONFIG] Workspace ID: ${workspaceId}`);
  
  await fixPersonCompanyRelationships(workspaceId);
  
  console.log(`✅ [FIX RELATIONSHIPS] Execution completed!`);
  process.exit(0);
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error(`💥 [FIX RELATIONSHIPS] Fatal error:`, error);
    process.exit(1);
  });
}

export { fixPersonCompanyRelationships };
