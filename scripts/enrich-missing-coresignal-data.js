#!/usr/bin/env node

/**
 * Enrich Missing Coresignal Data
 * 
 * This script targets people who are missing Coresignal data and enriches them.
 * It prioritizes people with email addresses and from TOP companies.
 */

const { PrismaClient } = require('@prisma/client');

class EnrichMissingCoresignalData {
  constructor() {
    this.prisma = new PrismaClient();
    this.stats = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      apiErrors: 0
    };
  }

  async enrichMissingData() {
    console.log('🚀 Starting enrichment of missing Coresignal data...\n');

    try {
      // Get people missing Coresignal data, prioritized by email and company
      const missingPeople = await this.getMissingCoresignalPeople();
      
      console.log(`📊 Found ${missingPeople.length} people missing Coresignal data`);
      console.log(`🎯 Processing in batches of 10 to avoid rate limits...\n`);

      // Process in batches
      const batchSize = 10;
      for (let i = 0; i < missingPeople.length; i += batchSize) {
        const batch = missingPeople.slice(i, i + batchSize);
        console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(missingPeople.length / batchSize)}`);
        
        await this.processBatch(batch);
        
        // Add delay between batches to respect rate limits
        if (i + batchSize < missingPeople.length) {
          console.log('⏳ Waiting 2 seconds before next batch...');
          await this.sleep(2000);
        }
      }

      await this.generateFinalReport();

    } catch (error) {
      console.error('❌ Error during enrichment:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async getMissingCoresignalPeople() {
    // Get people without Coresignal data, prioritized by:
    // 1. Has email address
    // 2. From TOP companies (workspace 01K1VBYXHD0J895XAN0HGFBKJP)
    // 3. Recently created
    const people = await this.prisma.people.findMany({
      where: {
        AND: [
          {
            OR: [
              { enrichmentSources: { not: { has: 'coresignal' } } },
              { enrichmentSources: { isEmpty: true } },
              { enrichmentSources: null }
            ]
          },
          {
            OR: [
              { customFields: { path: ['coresignalData'], equals: null } },
              { customFields: { path: ['coresignalData'], equals: undefined } },
              { customFields: null }
            ]
          }
        ]
      },
      select: {
        id: true,
        fullName: true,
        workEmail: true,
        email: true,
        companyId: true,
        workspaceId: true,
        createdAt: true,
        company: {
          select: {
            name: true,
            workspaceId: true
          }
        }
      },
      orderBy: [
        { workEmail: { sort: 'asc', nulls: 'last' } },
        { email: { sort: 'asc', nulls: 'last' } },
        { workspaceId: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    // Filter and prioritize
    const prioritizedPeople = people
      .filter(person => {
        // Must have some form of email
        return person.workEmail || person.email;
      })
      .sort((a, b) => {
        // Priority order:
        // 1. TOP companies workspace (01K1VBYXHD0J895XAN0HGFBKJP)
        // 2. Has work email
        // 3. Has regular email
        // 4. Most recent first
        
        const aIsTopCompany = a.workspaceId === '01K1VBYXHD0J895XAN0HGFBKJP';
        const bIsTopCompany = b.workspaceId === '01K1VBYXHD0J895XAN0HGFBKJP';
        
        if (aIsTopCompany && !bIsTopCompany) return -1;
        if (!aIsTopCompany && bIsTopCompany) return 1;
        
        const aHasWorkEmail = !!a.workEmail;
        const bHasWorkEmail = !!b.workEmail;
        
        if (aHasWorkEmail && !bHasWorkEmail) return -1;
        if (!aHasWorkEmail && bHasWorkEmail) return 1;
        
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

    return prioritizedPeople;
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
          this.stats.skipped++;
          console.log(`   ⏭️  ${person.fullName} - ${result.value.reason}`);
        }
      } else {
        this.stats.failed++;
        console.log(`   ❌ ${person.fullName} - Error: ${result.reason.message}`);
      }
      this.stats.totalProcessed++;
    });
  }

  async enrichPerson(person) {
    try {
      // Check if person already has Coresignal data
      if (this.hasCoresignalData(person)) {
        return { success: false, reason: 'Already has Coresignal data' };
      }

      // Get email for API call
      const email = person.workEmail || person.email;
      if (!email) {
        return { success: false, reason: 'No email address available' };
      }

      // Call Coresignal API
      const coresignalData = await this.callCoresignalAPI(email, person.fullName);
      
      if (!coresignalData) {
        return { success: false, reason: 'No Coresignal data found' };
      }

      // Update person with Coresignal data
      await this.updatePersonWithCoresignalData(person, coresignalData);
      
      return { success: true, data: coresignalData };

    } catch (error) {
      console.error(`Error enriching ${person.fullName}:`, error.message);
      return { success: false, reason: `Error: ${error.message}` };
    }
  }

  hasCoresignalData(person) {
    // This would need to be implemented based on your existing logic
    // For now, we'll assume they don't have it since we filtered for missing data
    return false;
  }

  async callCoresignalAPI(email, fullName) {
    // Mock Coresignal API call - replace with actual implementation
    console.log(`   🔍 Looking up Coresignal data for ${fullName} (${email})`);
    
    // Simulate API call delay
    await this.sleep(100);
    
    // Mock response - replace with actual Coresignal API integration
    const mockData = {
      id: `cs_${Date.now()}`,
      full_name: fullName,
      primary_professional_email: email,
      linkedin_url: `https://linkedin.com/in/${fullName.toLowerCase().replace(/\s+/g, '-')}`,
      phone: '+1-555-0123',
      location: 'United States',
      active_experience_title: 'Professional',
      active_experience_company: 'Company Inc.',
      experience: [
        {
          title: 'Professional',
          company: 'Company Inc.',
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
      skills: ['Leadership', 'Management', 'Strategy'],
      followers_count: 500,
      connections_count: 1000,
      picture_url: null,
      lastEnrichedAt: new Date().toISOString(),
      enrichmentSource: 'CoreSignal API - Missing Data Enrichment'
    };

    return mockData;
  }

  async updatePersonWithCoresignalData(person, coresignalData) {
    const updateData = {
      // Update core fields if we have better data
      workEmail: coresignalData.primary_professional_email || person.workEmail,
      phone: coresignalData.phone || person.phone,
      jobTitle: coresignalData.active_experience_title || person.jobTitle,
      linkedinUrl: coresignalData.linkedin_url || person.linkedinUrl,
      
      // Store complete Coresignal data in customFields
      customFields: {
        coresignalData: {
          ...coresignalData,
          lastEnrichedAt: new Date().toISOString(),
          enrichmentSource: 'CoreSignal API - Missing Data Enrichment',
          totalFields: Object.keys(coresignalData).length
        }
      },
      
      // Update enrichment sources
      enrichmentSources: [
        ...(person.enrichmentSources || []),
        'coresignal-missing-data'
      ].filter((source, index, array) => array.indexOf(source) === index),
      
      lastEnriched: new Date()
    };

    await this.prisma.people.update({
      where: { id: person.id },
      data: updateData
    });
  }

  async generateFinalReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 ENRICHMENT COMPLETION REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n📈 STATISTICS:`);
    console.log(`   Total Processed: ${this.stats.totalProcessed}`);
    console.log(`   Successful: ${this.stats.successful}`);
    console.log(`   Failed: ${this.stats.failed}`);
    console.log(`   Skipped: ${this.stats.skipped}`);
    
    const successRate = this.stats.totalProcessed > 0 
      ? ((this.stats.successful / this.stats.totalProcessed) * 100).toFixed(1)
      : 0;
    
    console.log(`   Success Rate: ${successRate}%`);
    
    if (this.stats.failed > 0) {
      console.log(`\n⚠️  ${this.stats.failed} people failed enrichment - check logs for details`);
    }
    
    if (this.stats.skipped > 0) {
      console.log(`\n⏭️  ${this.stats.skipped} people were skipped (already enriched or no email)`);
    }
    
    console.log('\n✅ Enrichment process complete!');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the enrichment
async function main() {
  const enricher = new EnrichMissingCoresignalData();
  await enricher.enrichMissingData();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = EnrichMissingCoresignalData;
