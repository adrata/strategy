/**
 * 🔧 FIX PERSON-COMPANY RELATIONSHIPS
 * 
 * This script fixes the person-company relationships and re-runs hierarchical ranking
 */

import { prisma } from '../src/platform/database/prisma-client';

/**
 * Calculate similarity between two strings using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) {
    return 1.0;
  }
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

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
          companyId: true,
          currentCompany: true,
          enrichedData: true,
          coresignalData: true
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
    let unmatchedCount = 0;
    const unmatchedExamples: string[] = [];
    
    for (const person of peopleWithoutCompany) {
      // Try to extract company name from multiple sources
      let companyName: string | null = null;
      
      // Priority 1: currentCompany field
      if (person.currentCompany && person.currentCompany.trim() !== '') {
        companyName = person.currentCompany;
      }
      // Priority 2: enrichedData
      else if (person.enrichedData && typeof person.enrichedData === 'object') {
        const enriched = person.enrichedData as any;
        if (enriched.overview?.companyName) {
          companyName = enriched.overview.companyName;
        } else if (enriched.company) {
          companyName = enriched.company;
        }
      }
      // Priority 3: coresignalData
      else if (person.coresignalData && typeof person.coresignalData === 'object') {
        const coresignal = person.coresignalData as any;
        if (coresignal.company) {
          companyName = coresignal.company;
        } else if (coresignal.current_company) {
          companyName = coresignal.current_company;
        }
      }
      
      if (companyName && companyName !== 'Unknown Company') {
        // Find matching company using exact and fuzzy matching
        const matchingCompany = companies.find(c => {
          const companyLower = companyName!.toLowerCase().trim();
          const cNameLower = c.name.toLowerCase().trim();
          
          // Exact match
          if (cNameLower === companyLower) return true;
          
          // Contains match
          if (cNameLower.includes(companyLower) || companyLower.includes(cNameLower)) {
            return true;
          }
          
          // Calculate similarity for fuzzy match
          const similarity = calculateSimilarity(companyLower, cNameLower);
          return similarity >= 0.85;
        });

        if (matchingCompany) {
          await prisma.people.update({
            where: { id: person.id },
            data: { companyId: matchingCompany.id }
          });
          matchedCount++;
          console.log(`   ✅ Matched "${person.fullName}" to company "${matchingCompany.name}"`);
        } else {
          unmatchedCount++;
          if (unmatchedExamples.length < 10) {
            unmatchedExamples.push(`${person.fullName} → "${companyName}"`);
          }
        }
      }
    }
    
    console.log(`\n📊 [MATCHING RESULTS]`);
    console.log(`   ✅ Matched: ${matchedCount}`);
    console.log(`   ❌ Unmatched: ${unmatchedCount}`);
    if (unmatchedExamples.length > 0) {
      console.log(`\n   Unmatched examples (company not found):`);
      unmatchedExamples.forEach((example, i) => {
        console.log(`   ${i + 1}. ${example}`);
      });
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
