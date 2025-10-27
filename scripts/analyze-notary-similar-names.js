#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// String similarity function (Levenshtein distance based)
function similarity(s1, s2) {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(s1, s2) {
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
}

async function analyzeSimilarNames() {
  const NOTARY_WORKSPACE_ID = '01K7DNYR5VZ7JY36KGKKN76XZ1';
  
  try {
    console.log('Analyzing similar company names...\n');
    
    // Get all companies
    const companies = await prisma.companies.findMany({
      where: { workspaceId: NOTARY_WORKSPACE_ID, deletedAt: null },
      select: { 
        id: true, 
        name: true, 
        domain: true, 
        website: true,
        email: true,
        phone: true,
        city: true,
        state: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { name: 'asc' }
    });
    
    console.log(`Total companies: ${companies.length}\n`);
    
    // Find similar pairs (85%+ similarity)
    const similarPairs = [];
    
    for (let i = 0; i < companies.length; i++) {
      for (let j = i + 1; j < companies.length; j++) {
        const c1 = companies[i];
        const c2 = companies[j];
        
        const sim = similarity(c1.name.toLowerCase(), c2.name.toLowerCase());
        
        if (sim >= 0.85 && sim < 1.0) {
          similarPairs.push({
            similarity: sim,
            company1: c1,
            company2: c2
          });
        }
      }
    }
    
    // Sort by similarity descending
    similarPairs.sort((a, b) => b.similarity - a.similarity);
    
    console.log(`Found ${similarPairs.length} similar pairs (85%+ similarity, not exact)\n`);
    console.log('Top 20 similar pairs:\n');
    
    similarPairs.slice(0, 20).forEach((pair, idx) => {
      console.log(`${idx + 1}. Similarity: ${(pair.similarity * 100).toFixed(1)}%`);
      console.log(`   "${pair.company1.name}"`);
      console.log(`   "${pair.company2.name}"`);
      console.log(`   Domain: ${pair.company1.domain || 'none'} vs ${pair.company2.domain || 'none'}`);
      console.log(`   Location: ${pair.company1.city || '?'}, ${pair.company1.state || '?'} vs ${pair.company2.city || '?'}, ${pair.company2.state || '?'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeSimilarNames();

