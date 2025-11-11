/**
 * Audit Top-Temp workspace for duplicate companies
 * This script finds duplicates but does NOT merge them automatically
 * Review the output before merging
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

const TOP_TEMP_WORKSPACE_ID = '01K9QAP09FHT6EAP1B4G2KP3D2';

// Simple string similarity function (Levenshtein distance)
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
    .replace(/\s+/g, ' ')
    .trim();
}

async function auditDuplicates() {
  try {
    console.log('🔍 AUDITING TOP-TEMP WORKSPACE FOR DUPLICATES');
    console.log('='.repeat(60));
    console.log('⚠️  This script only FINDS duplicates - it does NOT merge them\n');

    // Get all companies
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        website: true,
        linkedinUrl: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            people: {
              where: { deletedAt: null }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`✅ Found ${companies.length} companies to analyze\n`);

    // Find exact name duplicates (case-insensitive)
    console.log('1️⃣ Checking for EXACT duplicates (case-insensitive)...\n');
    const exactDuplicates = [];
    const nameMap = new Map();

    for (const company of companies) {
      const normalizedName = company.name.toLowerCase().trim();
      if (!nameMap.has(normalizedName)) {
        nameMap.set(normalizedName, []);
      }
      nameMap.get(normalizedName).push(company);
    }

    for (const [name, companyList] of nameMap.entries()) {
      if (companyList.length > 1) {
        exactDuplicates.push({
          name: name,
          companies: companyList,
          type: 'exact'
        });
      }
    }

    console.log(`   Found ${exactDuplicates.length} groups of exact duplicates\n`);

    // Find similar name duplicates (normalized)
    console.log('2️⃣ Checking for SIMILAR duplicates (normalized names)...\n');
    const similarDuplicates = [];
    const normalizedMap = new Map();

    for (const company of companies) {
      const normalized = normalizeCompanyName(company.name);
      if (normalized && normalized.length > 3) { // Skip very short names
        if (!normalizedMap.has(normalized)) {
          normalizedMap.set(normalized, []);
        }
        normalizedMap.get(normalized).push(company);
      }
    }

    for (const [normalized, companyList] of normalizedMap.entries()) {
      if (companyList.length > 1) {
        // Check if these are already in exact duplicates
        const isExactDuplicate = exactDuplicates.some(dup => 
          dup.companies.some(c => companyList.some(cl => cl.id === c.id))
        );
        
        if (!isExactDuplicate) {
          similarDuplicates.push({
            normalizedName: normalized,
            companies: companyList,
            type: 'normalized'
          });
        }
      }
    }

    console.log(`   Found ${similarDuplicates.length} groups of similar duplicates\n`);

    // Find high-similarity pairs (using Levenshtein distance)
    console.log('3️⃣ Checking for HIGH-SIMILARITY pairs (85%+ similarity)...\n');
    const highSimilarityPairs = [];
    const processedPairs = new Set();

    for (let i = 0; i < companies.length; i++) {
      for (let j = i + 1; j < companies.length; j++) {
        const company1 = companies[i];
        const company2 = companies[j];
        
        // Skip if already found as exact or normalized duplicate
        const isAlreadyDuplicate = 
          exactDuplicates.some(dup => 
            dup.companies.some(c => c.id === company1.id || c.id === company2.id)
          ) ||
          similarDuplicates.some(dup => 
            dup.companies.some(c => c.id === company1.id || c.id === company2.id)
          );

        if (isAlreadyDuplicate) continue;

        const similarity = calculateSimilarity(company1.name, company2.name);
        
        if (similarity >= 0.85) {
          const pairKey = [company1.id, company2.id].sort().join('-');
          if (!processedPairs.has(pairKey)) {
            processedPairs.add(pairKey);
            highSimilarityPairs.push({
              company1: {
                id: company1.id,
                name: company1.name,
                website: company1.website,
                linkedinUrl: company1.linkedinUrl,
                peopleCount: company1._count.people,
                createdAt: company1.createdAt
              },
              company2: {
                id: company2.id,
                name: company2.name,
                website: company2.website,
                linkedinUrl: company2.linkedinUrl,
                peopleCount: company2._count.people,
                createdAt: company2.createdAt
              },
              similarity: similarity,
              type: 'high-similarity'
            });
          }
        }
      }
    }

    console.log(`   Found ${highSimilarityPairs.length} high-similarity pairs\n`);

    // Generate report
    console.log('='.repeat(60));
    console.log('📊 AUDIT RESULTS');
    console.log('='.repeat(60));
    console.log(`Total companies analyzed: ${companies.length}`);
    console.log(`Exact duplicate groups: ${exactDuplicates.length}`);
    console.log(`Similar duplicate groups: ${similarDuplicates.length}`);
    console.log(`High-similarity pairs: ${highSimilarityPairs.length}`);
    console.log('='.repeat(60));

    // Display exact duplicates
    if (exactDuplicates.length > 0) {
      console.log('\n📋 EXACT DUPLICATES (Case-insensitive):');
      console.log('-'.repeat(60));
      exactDuplicates.forEach((group, idx) => {
        console.log(`\n${idx + 1}. "${group.name}" (${group.companies.length} duplicates):`);
        group.companies.forEach((company, cIdx) => {
          console.log(`   ${cIdx + 1}. ID: ${company.id}`);
          console.log(`      Name: "${company.name}"`);
          console.log(`      Website: ${company.website || '(empty)'}`);
          console.log(`      LinkedIn: ${company.linkedinUrl || '(empty)'}`);
          console.log(`      People: ${company._count.people}`);
          console.log(`      Created: ${company.createdAt.toISOString().split('T')[0]}`);
        });
      });
    }

    // Display similar duplicates
    if (similarDuplicates.length > 0) {
      console.log('\n📋 SIMILAR DUPLICATES (Normalized names):');
      console.log('-'.repeat(60));
      similarDuplicates.forEach((group, idx) => {
        console.log(`\n${idx + 1}. Normalized: "${group.normalizedName}" (${group.companies.length} duplicates):`);
        group.companies.forEach((company, cIdx) => {
          console.log(`   ${cIdx + 1}. ID: ${company.id}`);
          console.log(`      Name: "${company.name}"`);
          console.log(`      Website: ${company.website || '(empty)'}`);
          console.log(`      LinkedIn: ${company.linkedinUrl || '(empty)'}`);
          console.log(`      People: ${company._count.people}`);
          console.log(`      Created: ${company.createdAt.toISOString().split('T')[0]}`);
        });
      });
    }

    // Display high-similarity pairs
    if (highSimilarityPairs.length > 0) {
      console.log('\n📋 HIGH-SIMILARITY PAIRS (85%+ similarity):');
      console.log('-'.repeat(60));
      highSimilarityPairs.forEach((pair, idx) => {
        console.log(`\n${idx + 1}. Similarity: ${(pair.similarity * 100).toFixed(1)}%`);
        console.log(`   Company 1: "${pair.company1.name}" (ID: ${pair.company1.id})`);
        console.log(`      Website: ${pair.company1.website || '(empty)'}`);
        console.log(`      LinkedIn: ${pair.company1.linkedinUrl || '(empty)'}`);
        console.log(`      People: ${pair.company1.peopleCount}`);
        console.log(`   Company 2: "${pair.company2.name}" (ID: ${pair.company2.id})`);
        console.log(`      Website: ${pair.company2.website || '(empty)'}`);
        console.log(`      LinkedIn: ${pair.company2.linkedinUrl || '(empty)'}`);
        console.log(`      People: ${pair.company2.peopleCount}`);
      });
    }

    // Save results to JSON file for review
    const auditResults = {
      timestamp: new Date().toISOString(),
      totalCompanies: companies.length,
      exactDuplicates: exactDuplicates.map(g => ({
        name: g.name,
        companies: g.companies.map(c => ({
          id: c.id,
          name: c.name,
          website: c.website,
          linkedinUrl: c.linkedinUrl,
          peopleCount: c._count.people,
          createdAt: c.createdAt.toISOString()
        }))
      })),
      similarDuplicates: similarDuplicates.map(g => ({
        normalizedName: g.normalizedName,
        companies: g.companies.map(c => ({
          id: c.id,
          name: c.name,
          website: c.website,
          linkedinUrl: c.linkedinUrl,
          peopleCount: c._count.people,
          createdAt: c.createdAt.toISOString()
        }))
      })),
      highSimilarityPairs: highSimilarityPairs.map(p => ({
        similarity: p.similarity,
        company1: {
          id: p.company1.id,
          name: p.company1.name,
          website: p.company1.website,
          linkedinUrl: p.company1.linkedinUrl,
          peopleCount: p.company1.peopleCount,
          createdAt: p.company1.createdAt.toISOString()
        },
        company2: {
          id: p.company2.id,
          name: p.company2.name,
          website: p.company2.website,
          linkedinUrl: p.company2.linkedinUrl,
          peopleCount: p.company2.peopleCount,
          createdAt: p.company2.createdAt.toISOString()
        }
      }))
    };

    const outputPath = path.resolve('top-temp-duplicates-audit.json');
    fs.writeFileSync(outputPath, JSON.stringify(auditResults, null, 2), 'utf8');
    console.log(`\n✅ Audit results saved to: ${outputPath}`);
    console.log('\n⚠️  REVIEW THE RESULTS BEFORE MERGING DUPLICATES');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error auditing duplicates:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  auditDuplicates()
    .then(() => {
      console.log('\n✅ Audit complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Audit failed:', error);
      process.exit(1);
    });
}

module.exports = auditDuplicates;

