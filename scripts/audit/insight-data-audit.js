#!/usr/bin/env node

/**
 * TOP Database Insight Data Audit Script
 * Check for insight data fields and completeness
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function runInsightDataAudit() {
  console.log('🧠 TOP DATABASE INSIGHT DATA AUDIT');
  console.log('==================================\n');

  try {
    const totalPeople = await prisma.people.count();
    
    // Check for insight fields that exist in the schema
    const insightFields = [
      'painIntelligence',
      'wants', 
      'needs',
      'psychographicProfile',
      'communicationStyleRecommendations'
    ];

    console.log('📊 INSIGHT DATA COMPLETENESS');
    console.log('----------------------------');
    
    for (const field of insightFields) {
      try {
        const count = await prisma.people.count({
          where: {
            [field]: { not: null }
          }
        });
        const percentage = ((count / totalPeople) * 100).toFixed(1);
        console.log(`${field}: ${count.toLocaleString()} (${percentage}%)`);
      } catch (error) {
        console.log(`${field}: Field does not exist in schema`);
      }
    }
    console.log('');

    // Check enrichment sources
    console.log('🔍 ENRICHMENT SOURCES ANALYSIS');
    console.log('------------------------------');
    
    const peopleWithEnrichmentSources = await prisma.people.findMany({
      where: {
        enrichmentSources: {
          hasSome: ['any']
        }
      },
      select: {
        enrichmentSources: true
      }
    });

    console.log(`People with enrichment sources: ${peopleWithEnrichmentSources.length.toLocaleString()}`);
    
    // Count unique enrichment sources
    const allSources = new Set();
    peopleWithEnrichmentSources.forEach(person => {
      if (person.enrichmentSources) {
        person.enrichmentSources.forEach(source => allSources.add(source));
      }
    });
    
    console.log(`Unique enrichment sources: ${allSources.size}`);
    console.log(`Sources: ${Array.from(allSources).join(', ')}\n`);

    // Check last enriched dates
    console.log('📅 ENRICHMENT TIMELINE');
    console.log('----------------------');
    
    const recentEnrichments = await prisma.people.count({
      where: {
        lastEnriched: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    });
    
    const oldEnrichments = await prisma.people.count({
      where: {
        lastEnriched: {
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });
    
    console.log(`Enriched in last 30 days: ${recentEnrichments.toLocaleString()}`);
    console.log(`Enriched more than 30 days ago: ${oldEnrichments.toLocaleString()}\n`);

    // Sample enriched people
    console.log('👥 SAMPLE ENRICHED PEOPLE');
    console.log('-------------------------');
    
    const sampleEnriched = await prisma.people.findMany({
      where: {
        lastEnriched: { not: null }
      },
      select: {
        fullName: true,
        jobTitle: true,
        buyerGroupRole: true,
        lastEnriched: true,
        enrichmentScore: true,
        enrichmentSources: true
      },
      take: 5
    });

    sampleEnriched.forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName}`);
      console.log(`   Title: ${person.jobTitle || 'No Title'}`);
      console.log(`   Buyer Group Role: ${person.buyerGroupRole || 'No Role'}`);
      console.log(`   Last Enriched: ${person.lastEnriched?.toISOString().split('T')[0] || 'Unknown'}`);
      console.log(`   Enrichment Score: ${person.enrichmentScore || 'No Score'}`);
      console.log(`   Sources: ${person.enrichmentSources?.join(', ') || 'No Sources'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Insight data audit failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit
runInsightDataAudit();

