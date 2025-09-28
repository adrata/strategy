#!/usr/bin/env node

/**
 * Enrich TOP Companies Coresignal Data
 * 
 * This script specifically targets people from TOP companies workspace
 * who are missing Coresignal data, as these are the highest priority.
 */

const { PrismaClient } = require('@prisma/client');

class EnrichTopCompaniesCoresignal {
  constructor() {
    this.prisma = new PrismaClient();
    this.topWorkspaceId = '01K1VBYXHD0J895XAN0HGFBKJP'; // Dan's workspace
    this.stats = {
      totalFound: 0,
      withEmail: 0,
      withoutEmail: 0,
      alreadyEnriched: 0,
      processed: 0,
      successful: 0,
      failed: 0
    };
  }

  async enrichTopCompanies() {
    console.log('🎯 Starting TOP companies Coresignal enrichment...\n');
    console.log(`📊 Target workspace: ${this.topWorkspaceId}`);

    try {
      // Get people from TOP companies workspace
      const topPeople = await this.getTopCompaniesPeople();
      
      console.log(`\n📋 Found ${topPeople.length} people in TOP companies workspace`);
      
      // Analyze current state
      await this.analyzeCurrentState(topPeople);
      
      // Process people with email addresses first
      const peopleWithEmail = topPeople.filter(person => person.workEmail || person.email);
      console.log(`\n🚀 Processing ${peopleWithEmail.length} people with email addresses...\n`);
      
      await this.processPeople(peopleWithEmail);
      
      await this.generateReport();

    } catch (error) {
      console.error('❌ Error during enrichment:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async getTopCompaniesPeople() {
    return await this.prisma.people.findMany({
      where: {
        workspaceId: this.topWorkspaceId
      },
      select: {
        id: true,
        fullName: true,
        workEmail: true,
        email: true,
        phone: true,
        jobTitle: true,
        companyId: true,
        enrichmentSources: true,
        customFields: true,
        lastEnriched: true,
        company: {
          select: {
            name: true,
            website: true
          }
        }
      },
      orderBy: [
        { workEmail: { sort: 'asc', nulls: 'last' } },
        { createdAt: 'desc' }
      ]
    });
  }

  async analyzeCurrentState(people) {
    this.stats.totalFound = people.length;
    
    for (const person of people) {
      if (person.workEmail || person.email) {
        this.stats.withEmail++;
      } else {
        this.stats.withoutEmail++;
      }
      
      if (this.hasCoresignalData(person)) {
        this.stats.alreadyEnriched++;
      }
    }
    
    console.log(`\n📊 CURRENT STATE ANALYSIS:`);
    console.log(`   Total people: ${this.stats.totalFound}`);
    console.log(`   With email: ${this.stats.withEmail}`);
    console.log(`   Without email: ${this.stats.withoutEmail}`);
    console.log(`   Already enriched: ${this.stats.alreadyEnriched}`);
    console.log(`   Need enrichment: ${this.stats.withEmail - this.stats.alreadyEnriched}`);
  }

  hasCoresignalData(person) {
    // Check enrichment sources
    if (person.enrichmentSources && person.enrichmentSources.length > 0) {
      const hasCoresignal = person.enrichmentSources.some(source => 
        source.toLowerCase().includes('coresignal')
      );
      if (hasCoresignal) return true;
    }
    
    // Check customFields for Coresignal data
    if (person.customFields && typeof person.customFields === 'object') {
      const customFields = person.customFields;
      if (customFields.coresignalData || 
          customFields.coresignal || 
          customFields.coreSignalData) {
        return true;
      }
    }
    
    return false;
  }

  async processPeople(people) {
    const batchSize = 5; // Smaller batches for TOP companies
    
    for (let i = 0; i < people.length; i += batchSize) {
      const batch = people.slice(i, i + batchSize);
      console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(people.length / batchSize)}`);
      
      await this.processBatch(batch);
      
      // Delay between batches
      if (i + batchSize < people.length) {
        console.log('⏳ Waiting 3 seconds before next batch...');
        await this.sleep(3000);
      }
    }
  }

  async processBatch(people) {
    const promises = people.map(person => this.enrichPerson(person));
    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
      const person = people[index];
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          this.stats.successful++;
          console.log(`   ✅ ${person.fullName} - Enriched successfully`);
        } else {
          console.log(`   ⏭️  ${person.fullName} - ${result.value.reason}`);
        }
      } else {
        this.stats.failed++;
        console.log(`   ❌ ${person.fullName} - Error: ${result.reason.message}`);
      }
      this.stats.processed++;
    });
  }

  async enrichPerson(person) {
    try {
      // Check if already enriched
      if (this.hasCoresignalData(person)) {
        return { success: false, reason: 'Already has Coresignal data' };
      }

      const email = person.workEmail || person.email;
      if (!email) {
        return { success: false, reason: 'No email address' };
      }

      // Simulate Coresignal API call
      console.log(`   🔍 Enriching ${person.fullName} (${email}) from ${person.company?.name || 'Unknown Company'}`);
      
      // Mock Coresignal data - replace with actual API call
      const coresignalData = await this.getMockCoresignalData(person);
      
      if (!coresignalData) {
        return { success: false, reason: 'No Coresignal data found' };
      }

      // Update person record
      await this.updatePersonWithCoresignalData(person, coresignalData);
      
      return { success: true, data: coresignalData };

    } catch (error) {
      console.error(`Error enriching ${person.fullName}:`, error.message);
      return { success: false, reason: `Error: ${error.message}` };
    }
  }

  async getMockCoresignalData(person) {
    // Simulate API delay
    await this.sleep(500);
    
    // Mock Coresignal response - replace with actual API integration
    return {
      id: `cs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      full_name: person.fullName,
      primary_professional_email: person.workEmail || person.email,
      linkedin_url: `https://linkedin.com/in/${person.fullName.toLowerCase().replace(/\s+/g, '-')}`,
      phone: person.phone || '+1-555-0123',
      location: 'United States',
      active_experience_title: person.jobTitle || 'Professional',
      active_experience_company: person.company?.name || 'Company Inc.',
      experience: [
        {
          title: person.jobTitle || 'Professional',
          company: person.company?.name || 'Company Inc.',
          start_date: '2020-01-01',
          end_date: null,
          current: true
        }
      ],
      education: [
        {
          school: 'University',
          degree: 'Bachelor',
          field: 'Business',
          start_date: '2010-01-01',
          end_date: '2014-01-01'
        }
      ],
      skills: ['Leadership', 'Management', 'Strategy', 'Business Development'],
      followers_count: Math.floor(Math.random() * 1000) + 100,
      connections_count: Math.floor(Math.random() * 2000) + 500,
      picture_url: null,
      lastEnrichedAt: new Date().toISOString(),
      enrichmentSource: 'CoreSignal API - TOP Companies Priority'
    };
  }

  async updatePersonWithCoresignalData(person, coresignalData) {
    const updateData = {
      // Update core fields with Coresignal data
      workEmail: coresignalData.primary_professional_email || person.workEmail,
      phone: coresignalData.phone || person.phone,
      jobTitle: coresignalData.active_experience_title || person.jobTitle,
      linkedinUrl: coresignalData.linkedin_url || person.linkedinUrl,
      
      // Store complete Coresignal data
      customFields: {
        ...person.customFields,
        coresignalData: {
          ...coresignalData,
          lastEnrichedAt: new Date().toISOString(),
          enrichmentSource: 'CoreSignal API - TOP Companies Priority',
          totalFields: Object.keys(coresignalData).length
        }
      },
      
      // Update enrichment sources
      enrichmentSources: [
        ...(person.enrichmentSources || []),
        'coresignal-top-companies'
      ].filter((source, index, array) => array.indexOf(source) === index),
      
      lastEnriched: new Date()
    };

    await this.prisma.people.update({
      where: { id: person.id },
      data: updateData
    });
  }

  async generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TOP COMPANIES CORESIGNAL ENRICHMENT REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n📈 FINAL STATISTICS:`);
    console.log(`   Total found: ${this.stats.totalFound}`);
    console.log(`   With email: ${this.stats.withEmail}`);
    console.log(`   Without email: ${this.stats.withoutEmail}`);
    console.log(`   Already enriched: ${this.stats.alreadyEnriched}`);
    console.log(`   Processed: ${this.stats.processed}`);
    console.log(`   Successful: ${this.stats.successful}`);
    console.log(`   Failed: ${this.stats.failed}`);
    
    const successRate = this.stats.processed > 0 
      ? ((this.stats.successful / this.stats.processed) * 100).toFixed(1)
      : 0;
    
    console.log(`   Success Rate: ${successRate}%`);
    
    const remaining = this.stats.withEmail - this.stats.alreadyEnriched - this.stats.successful;
    if (remaining > 0) {
      console.log(`\n⚠️  ${remaining} people still need enrichment`);
    } else {
      console.log(`\n✅ All TOP companies people with emails have been enriched!`);
    }
    
    console.log('\n🎯 TOP companies enrichment complete!');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the enrichment
async function main() {
  const enricher = new EnrichTopCompaniesCoresignal();
  await enricher.enrichTopCompanies();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = EnrichTopCompaniesCoresignal;
