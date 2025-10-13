const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const WORKSPACE_ID = '01K7DNYR5VZ7JY36KGKKN76XZ1';

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

async function analyzeDuplicates() {
  console.log('🔍 ANALYZING DUPLICATE COMPANIES');
  console.log('=' .repeat(60));
  
  const companies = await prisma.companies.findMany({
    where: {
      workspaceId: WORKSPACE_ID,
      deletedAt: null
    },
    select: { 
      id: true, 
      name: true, 
      createdAt: true, 
      customFields: true,
      people: {
        where: { deletedAt: null },
        select: { id: true, fullName: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`Analyzing ${companies.length} companies for duplicates...\n`);

  const highSimilarityPairs = [];
  const mediumSimilarityPairs = [];
  const processedPairs = new Set();

  for (let i = 0; i < companies.length; i++) {
    for (let j = i + 1; j < companies.length; j++) {
      const company1 = companies[i];
      const company2 = companies[j];

      const pairKey = [company1.id, company2.id].sort().join('-');
      if (processedPairs.has(pairKey)) continue;

      const similarity = calculateSimilarity(
        normalizeCompanyName(company1.name),
        normalizeCompanyName(company2.name)
      );

      if (similarity >= 0.85) {
        highSimilarityPairs.push({
          similarity: parseFloat(similarity.toFixed(3)),
          company1: {
            id: company1.id,
            name: company1.name,
            peopleCount: company1.people.length,
            createdAt: company1.createdAt,
            source: company1.customFields?.createdFrom || 'Existing'
          },
          company2: {
            id: company2.id,
            name: company2.name,
            peopleCount: company2.people.length,
            createdAt: company2.createdAt,
            source: company2.customFields?.createdFrom || 'Existing'
          }
        });
        processedPairs.add(pairKey);
      } else if (similarity >= 0.70) {
        mediumSimilarityPairs.push({
          similarity: parseFloat(similarity.toFixed(3)),
          company1: {
            id: company1.id,
            name: company1.name,
            peopleCount: company1.people.length,
            createdAt: company1.createdAt,
            source: company1.customFields?.createdFrom || 'Existing'
          },
          company2: {
            id: company2.id,
            name: company2.name,
            peopleCount: company2.people.length,
            createdAt: company2.createdAt,
            source: company2.customFields?.createdFrom || 'Existing'
          }
        });
        processedPairs.add(pairKey);
      }
    }
  }

  // Sort by similarity (highest first)
  highSimilarityPairs.sort((a, b) => b.similarity - a.similarity);
  mediumSimilarityPairs.sort((a, b) => b.similarity - a.similarity);

  console.log('📊 DUPLICATE ANALYSIS RESULTS');
  console.log('=' .repeat(60));
  console.log(`High Similarity Pairs (85%+): ${highSimilarityPairs.length}`);
  console.log(`Medium Similarity Pairs (70-84%): ${mediumSimilarityPairs.length}`);
  console.log(`Total Potential Duplicates: ${highSimilarityPairs.length + mediumSimilarityPairs.length}`);

  if (highSimilarityPairs.length > 0) {
    console.log('\n🚨 HIGH SIMILARITY DUPLICATES (85%+):');
    console.log('-'.repeat(60));
    highSimilarityPairs.slice(0, 20).forEach((pair, index) => {
      console.log(`${index + 1}. ${(pair.similarity * 100).toFixed(1)}% similar:`);
      console.log(`   A: "${pair.company1.name}" (${pair.company1.peopleCount} people, ${pair.company1.source})`);
      console.log(`   B: "${pair.company2.name}" (${pair.company2.peopleCount} people, ${pair.company2.source})`);
      console.log('');
    });

    if (highSimilarityPairs.length > 20) {
      console.log(`   ... and ${highSimilarityPairs.length - 20} more high similarity pairs`);
    }
  }

  if (mediumSimilarityPairs.length > 0) {
    console.log('\n⚠️  MEDIUM SIMILARITY PAIRS (70-84%):');
    console.log('-'.repeat(60));
    mediumSimilarityPairs.slice(0, 10).forEach((pair, index) => {
      console.log(`${index + 1}. ${(pair.similarity * 100).toFixed(1)}% similar:`);
      console.log(`   A: "${pair.company1.name}" (${pair.company1.peopleCount} people)`);
      console.log(`   B: "${pair.company2.name}" (${pair.company2.peopleCount} people)`);
      console.log('');
    });

    if (mediumSimilarityPairs.length > 10) {
      console.log(`   ... and ${mediumSimilarityPairs.length - 10} more medium similarity pairs`);
    }
  }

  // Save results for deduplication script
  const fs = require('fs');
  const results = {
    highSimilarityPairs,
    mediumSimilarityPairs,
    totalCompanies: companies.length,
    analyzedAt: new Date().toISOString()
  };

  fs.writeFileSync('duplicate-analysis-results.json', JSON.stringify(results, null, 2));
  console.log('\n💾 Results saved to duplicate-analysis-results.json');

  // Calculate potential savings
  const totalDuplicates = highSimilarityPairs.length;
  const potentialSavings = totalDuplicates;
  
  console.log('\n📈 DEDUPLICATION IMPACT:');
  console.log(`Current Companies: ${companies.length}`);
  console.log(`Potential Duplicates to Merge: ${totalDuplicates}`);
  console.log(`Companies After Deduplication: ${companies.length - totalDuplicates}`);
  console.log(`Reduction: ${((totalDuplicates / companies.length) * 100).toFixed(1)}%`);

  await prisma.$disconnect();
}

analyzeDuplicates().catch(async (error) => {
  console.error('Error:', error);
  await prisma.$disconnect();
  process.exit(1);
});
