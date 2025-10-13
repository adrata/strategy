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

function chooseBestCompany(company1, company2) {
  // Prefer company with more people
  if (company1.peopleCount > company2.peopleCount) return company1;
  if (company2.peopleCount > company1.peopleCount) return company2;
  
  // If same people count, prefer the older one (created first)
  return new Date(company1.createdAt) < new Date(company2.createdAt) ? company1 : company2;
}

async function finalDeduplicationPass() {
  console.log('🔄 FINAL DEDUPLICATION PASS');
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
      people: {
        where: { deletedAt: null },
        select: { id: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`Processing ${companies.length} companies for final cleanup...\n`);

  const highSimilarityPairs = [];
  const processedPairs = new Set();

  // Find remaining high similarity pairs
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
            createdAt: company1.createdAt
          },
          company2: {
            id: company2.id,
            name: company2.name,
            peopleCount: company2.people.length,
            createdAt: company2.createdAt
          }
        });
        processedPairs.add(pairKey);
      }
    }
  }

  console.log(`Found ${highSimilarityPairs.length} high-similarity pairs to merge\n`);

  const results = {
    processed: 0,
    merged: 0,
    skipped: 0,
    errors: []
  };

  // Process each pair
  for (const pair of highSimilarityPairs) {
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
      
      console.log(`\n${results.processed}. Merging ${(pair.similarity * 100).toFixed(1)}% similar:`);
      console.log(`   Primary: "${primary.name}" (${primary.people.length} people) - KEEPING`);
      console.log(`   Secondary: "${secondary.name}" (${secondary.people.length} people) - MERGING INTO PRIMARY`);

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

      // Merge company data
      const mergedData = {
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
            similarity: pair.similarity,
            pass: 'final'
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
  console.log('📊 FINAL DEDUPLICATION COMPLETE');
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
  console.log(`   Companies After Final Pass: ${finalStats}`);

  await prisma.$disconnect();
}

finalDeduplicationPass().catch(async (error) => {
  console.error('Fatal error:', error);
  await prisma.$disconnect();
  process.exit(1);
});
