#!/usr/bin/env node

/**
 * 🔍 ANALYZE PEOPLE ENRICHMENT SOURCES
 * 
 * Analyzes people in TOP database to identify those not enriched by CoreSignal
 */

const { PrismaClient } = require('@prisma/client');

class AnalyzePeopleEnrichmentSources {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    this.results = {
      totalPeople: 0,
      peopleBySource: {},
      peopleWithoutCoreSignal: [],
      peopleWithCoreSignal: [],
      peopleWithNoSource: [],
      enrichmentGaps: []
    };
  }

  async execute() {
    console.log('🔍 ANALYZING PEOPLE ENRICHMENT SOURCES');
    console.log('=====================================\n');

    try {
      await this.analyzePeopleSources();
      await this.identifyEnrichmentGaps();
      await this.generateReport();
    } catch (error) {
      console.error('❌ Analysis failed:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async analyzePeopleSources() {
    console.log('🔍 STEP 1: Analyzing people enrichment sources...');
    
    const allPeople = await this.prisma.people.findMany({
      where: { workspaceId: this.workspaceId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        jobTitle: true,
        email: true,
        linkedinUrl: true,
        buyerGroupRole: true,
        enrichmentSources: true,
        customFields: true,
        company: {
          select: { name: true }
        }
      }
    });

    this.results.totalPeople = allPeople.length;
    console.log(`📊 Found ${allPeople.length} total people to analyze`);

    // Categorize people by enrichment source
    for (const person of allPeople) {
      const sources = person.enrichmentSources || [];
      
      if (sources.length === 0) {
        this.results.peopleWithNoSource.push(person);
      } else if (sources.includes('CoreSignal')) {
        this.results.peopleWithCoreSignal.push(person);
      } else {
        this.results.peopleWithoutCoreSignal.push(person);
      }

      // Track all sources
      sources.forEach(source => {
        if (!this.results.peopleBySource[source]) {
          this.results.peopleBySource[source] = [];
        }
        this.results.peopleBySource[source].push(person);
      });
    }

    console.log(`📊 People with CoreSignal: ${this.results.peopleWithCoreSignal.length}`);
    console.log(`📊 People without CoreSignal: ${this.results.peopleWithoutCoreSignal.length}`);
    console.log(`📊 People with no enrichment source: ${this.results.peopleWithNoSource.length}`);
  }

  async identifyEnrichmentGaps() {
    console.log('\n🔍 STEP 2: Identifying enrichment gaps...');
    
    // People without CoreSignal who could benefit from Perplexity enrichment
    const candidatesForEnrichment = [
      ...this.results.peopleWithoutCoreSignal,
      ...this.results.peopleWithNoSource
    ];

    // Filter for people who have basic info but could use more enrichment
    this.results.enrichmentGaps = candidatesForEnrichment.filter(person => {
      const hasBasicInfo = person.fullName && person.jobTitle;
      const hasContactInfo = person.email || person.linkedinUrl;
      const hasCompany = person.company?.name;
      
      return hasBasicInfo && (hasContactInfo || hasCompany);
    });

    console.log(`📊 People candidates for Perplexity enrichment: ${this.results.enrichmentGaps.length}`);
  }

  async generateReport() {
    console.log('\n🎉 PEOPLE ENRICHMENT SOURCES ANALYSIS REPORT');
    console.log('============================================');
    console.log(`📊 Total people: ${this.results.totalPeople}`);
    console.log(`📊 People with CoreSignal: ${this.results.peopleWithCoreSignal.length}`);
    console.log(`📊 People without CoreSignal: ${this.results.peopleWithoutCoreSignal.length}`);
    console.log(`📊 People with no enrichment source: ${this.results.peopleWithNoSource.length}`);
    console.log(`📊 Candidates for Perplexity enrichment: ${this.results.enrichmentGaps.length}`);

    console.log('\n📋 Enrichment sources breakdown:');
    Object.entries(this.results.peopleBySource).forEach(([source, people]) => {
      console.log(`   ${source}: ${people.length} people`);
    });

    if (this.results.enrichmentGaps.length > 0) {
      console.log('\n🎯 Top candidates for Perplexity enrichment:');
      this.results.enrichmentGaps.slice(0, 10).forEach((person, index) => {
        console.log(`   ${index + 1}. ${person.fullName} (${person.company?.name})`);
        console.log(`      Title: ${person.jobTitle || 'No title'}`);
        console.log(`      Email: ${person.email || 'No email'}`);
        console.log(`      LinkedIn: ${person.linkedinUrl || 'No LinkedIn'}`);
        console.log(`      Sources: ${(person.enrichmentSources || []).join(', ') || 'None'}`);
        console.log('');
      });
    }

    console.log('\n🎯 Next steps:');
    console.log('   1. Create Perplexity enrichment script for people without CoreSignal');
    console.log('   2. Focus on people with basic info but missing contact details');
    console.log('   3. Enrich job titles, company info, and contact information');
    console.log('   4. Update buyer group roles based on enriched data');
    console.log('\n🚀 People enrichment sources analysis complete!');
  }
}

if (require.main === module) {
  const analyzer = new AnalyzePeopleEnrichmentSources();
  analyzer.execute().catch(console.error);
}

module.exports = AnalyzePeopleEnrichmentSources;
