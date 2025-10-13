const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();
const WORKSPACE_ID = '01K7DNYR5VZ7JY36KGKKN76XZ1';

// Load duplicate analysis results
const duplicateResults = JSON.parse(fs.readFileSync('duplicate-analysis-results.json', 'utf8'));

// Simple string similarity function
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = (s1, s2) => {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  };
  
  return (longer.length - editDistance(longer, shorter)) / parseFloat(longer.length);
}

function normalizeCompanyName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\b(inc|llc|ltd|corp|corporation|company|co)\b\.?/gi, '')
    .replace(/[^\w\s]/g, '')
    .trim();
}

function chooseBestCompanyName(company1, company2) {
  // Prefer the name with more complete legal structure
  const name1 = company1.name;
  const name2 = company2.name;
  
  // If one has LLC/Inc/Corp and the other doesn't, prefer the one with legal structure
  const hasLegalStructure1 = /\b(LLC|Inc|Corp|Corporation|Ltd)\b/i.test(name1);
  const hasLegalStructure2 = /\b(LLC|Inc|Corp|Corporation|Ltd)\b/i.test(name2);
  
  if (hasLegalStructure1 && !hasLegalStructure2) return name1;
  if (hasLegalStructure2 && !hasLegalStructure1) return name2;
  
  // If both or neither have legal structure, prefer the longer name (more descriptive)
  if (name1.length > name2.length) return name1;
  if (name2.length > name1.length) return name2;
  
  // If same length, prefer the one with more people
  if (company1.peopleCount > company2.peopleCount) return name1;
  if (company2.peopleCount > company1.peopleCount) return name2;
  
  // If still tied, prefer the older one (created first)
  return new Date(company1.createdAt) < new Date(company2.createdAt) ? name1 : name2;
}

function chooseBestCompany(company1, company2) {
  // Prefer company with more people
  if (company1.peopleCount > company2.peopleCount) return company1;
  if (company2.peopleCount > company1.peopleCount) return company2;
  
  // If same people count, prefer the older one (created first)
  return new Date(company1.createdAt) < new Date(company2.createdAt) ? company1 : company2;
}

async function deduplicateCompanies() {
  console.log('🔄 DEDUPLICATING COMPANIES');
  console.log('=' .repeat(60));
  console.log(`Processing ${duplicateResults.highSimilarityPairs.length} high-similarity duplicate pairs\n`);

  const results = {
    processed: 0,
    merged: 0,
    skipped: 0,
    errors: [],
    mergedCompanies: [],
    deletedCompanies: []
  };

  // Process high similarity pairs (85%+ similarity)
  for (const pair of duplicateResults.highSimilarityPairs) {
    try {
      results.processed++;
      
      // Get full company data
      const company1 = await prisma.companies.findUnique({
        where: { id: pair.company1.id },
        include: {
          people: {
            where: { deletedAt: null },
            select: { id: true, fullName: true }
          }
        }
      });

      const company2 = await prisma.companies.findUnique({
        where: { id: pair.company2.id },
        include: {
          people: {
            where: { deletedAt: null },
            select: { id: true, fullName: true }
          }
        }
      });

      if (!company1 || !company2) {
        console.log(`⚠️  Skipping pair - one or both companies not found`);
        results.skipped++;
        continue;
      }

      // Determine which company to keep (primary) and which to merge (secondary)
      const primary = chooseBestCompany(company1, company2);
      const secondary = primary.id === company1.id ? company2 : company1;
      
      // Choose the best name
      const bestName = chooseBestCompanyName(company1, company2);
      
      console.log(`\n${results.processed}. Merging ${(pair.similarity * 100).toFixed(1)}% similar:`);
      console.log(`   Primary: "${primary.name}" (${primary.people.length} people) - KEEPING`);
      console.log(`   Secondary: "${secondary.name}" (${secondary.people.length} people) - MERGING INTO PRIMARY`);

      // If primary name is not the best, update it
      if (primary.name !== bestName) {
        await prisma.companies.update({
          where: { id: primary.id },
          data: { 
            name: bestName,
            updatedAt: new Date()
          }
        });
        console.log(`   ✅ Updated primary name to: "${bestName}"`);
      }

      // Merge people from secondary to primary
      if (secondary.people.length > 0) {
        await prisma.people.updateMany({
          where: { 
            companyId: secondary.id,
            deletedAt: null
          },
          data: { 
            companyId: primary.id,
            updatedAt: new Date()
          }
        });
        console.log(`   ✅ Moved ${secondary.people.length} people to primary company`);
      }

      // Merge company data (take the best of both)
      const mergedData = {
        // Keep primary's data but enhance with secondary's if primary is missing
        website: primary.website || secondary.website,
        email: primary.email || secondary.email,
        phone: primary.phone || secondary.phone,
        address: primary.address || secondary.address,
        city: primary.city || secondary.city,
        state: primary.state || secondary.state,
        country: primary.country || secondary.country,
        postalCode: primary.postalCode || secondary.postalCode,
        industry: primary.industry || secondary.industry,
        sector: primary.sector || secondary.sector,
        size: primary.size || secondary.size,
        description: primary.description || secondary.description,
        updatedAt: new Date(),
        customFields: {
          ...primary.customFields,
          mergedFrom: {
            companyId: secondary.id,
            companyName: secondary.name,
            mergedAt: new Date().toISOString(),
            similarity: pair.similarity
          }
        }
      };

      await prisma.companies.update({
        where: { id: primary.id },
        data: mergedData
      });

      // Soft delete the secondary company
      await prisma.companies.update({
        where: { id: secondary.id },
        data: { 
          deletedAt: new Date(),
          updatedAt: new Date()
        }
      });

      results.merged++;
      results.mergedCompanies.push({
        primaryId: primary.id,
        primaryName: bestName,
        secondaryId: secondary.id,
        secondaryName: secondary.name,
        similarity: pair.similarity,
        peopleMoved: secondary.people.length
      });
      results.deletedCompanies.push(secondary.id);

      console.log(`   ✅ Successfully merged and deleted secondary company`);

    } catch (error) {
      console.error(`   ❌ Error processing pair: ${error.message}`);
      results.errors.push({
        pair: `${pair.company1.name} vs ${pair.company2.name}`,
        error: error.message
      });
    }
  }

  // Generate final report
  console.log('\n' + '='.repeat(60));
  console.log('📊 DEDUPLICATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`\n📈 RESULTS:`);
  console.log(`   Pairs Processed: ${results.processed}`);
  console.log(`   Successfully Merged: ${results.merged}`);
  console.log(`   Skipped: ${results.skipped}`);
  console.log(`   Errors: ${results.errors.length}`);

  if (results.errors.length > 0) {
    console.log(`\n❌ ERRORS:`);
    results.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.pair}: ${error.error}`);
    });
  }

  // Get final stats
  const finalStats = await prisma.companies.count({
    where: { workspaceId: WORKSPACE_ID, deletedAt: null }
  });

  console.log(`\n📊 FINAL STATS:`);
  console.log(`   Companies Before: ${duplicateResults.totalCompanies}`);
  console.log(`   Companies After: ${finalStats}`);
  console.log(`   Companies Removed: ${duplicateResults.totalCompanies - finalStats}`);
  console.log(`   Reduction: ${(((duplicateResults.totalCompanies - finalStats) / duplicateResults.totalCompanies) * 100).toFixed(1)}%`);

  // Save detailed results
  const finalResults = {
    ...results,
    beforeCount: duplicateResults.totalCompanies,
    afterCount: finalStats,
    reduction: duplicateResults.totalCompanies - finalStats,
    reductionPercentage: ((duplicateResults.totalCompanies - finalStats) / duplicateResults.totalCompanies) * 100,
    completedAt: new Date().toISOString()
  };

  fs.writeFileSync('deduplication-results.json', JSON.stringify(finalResults, null, 2));
  console.log(`\n💾 Detailed results saved to deduplication-results.json`);

  await prisma.$disconnect();
}

deduplicateCompanies().catch(async (error) => {
  console.error('Fatal error:', error);
  await prisma.$disconnect();
  process.exit(1);
});
