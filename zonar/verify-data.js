#!/usr/bin/env node

/**
 * Verify Enriched Data Script
 * 
 * This script checks if the enriched data was properly stored in the database.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class VerifyEnrichedData {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1'; // Notary Everyday workspace
  }

  async run() {
    try {
      console.log('🔍 Verifying Enriched Data in Database...\n');
      
      // Check enriched people
      await this.checkEnrichedPeople();
      
      console.log('\n' + '='.repeat(50) + '\n');
      
      // Check enriched companies
      await this.checkEnrichedCompanies();
      
    } catch (error) {
      console.error('❌ Error verifying enriched data:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async checkEnrichedPeople() {
    console.log('👤 Checking Enriched People...');
    
    const enrichedPeople = await this.prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        customFields: {
          path: ['coresignalId'],
          not: null
        }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        linkedinUrl: true,
        customFields: true,
        bio: true,
        updatedAt: true
      },
      take: 5
    });

    console.log(`   📊 Found ${enrichedPeople.length} enriched people`);
    
    enrichedPeople.forEach((person, index) => {
      console.log(`\n   ${index + 1}. ${person.fullName}`);
      console.log(`      📧 Email: ${person.email || 'None'}`);
      console.log(`      🔗 LinkedIn: ${person.linkedinUrl || 'None'}`);
      console.log(`      📝 Bio length: ${person.bio?.length || 0} characters`);
      console.log(`      🕒 Last updated: ${person.updatedAt}`);
      
      if (person.customFields && typeof person.customFields === 'object') {
        const customFields = person.customFields;
        console.log(`      🆔 Coresignal ID: ${customFields.coresignalId || 'None'}`);
        console.log(`      📅 Last enriched: ${customFields.lastEnrichedAt || 'None'}`);
        console.log(`      🔧 Enrichment source: ${customFields.enrichmentSource || 'None'}`);
        
        if (customFields.coresignalData) {
          const coresignalData = customFields.coresignalData;
          console.log(`      📊 Coresignal data keys: ${Object.keys(coresignalData).length} fields`);
          console.log(`      📊 Sample data:`, {
            id: coresignalData.id,
            full_name: coresignalData.full_name,
            linkedin_url: coresignalData.linkedin_url,
            summary: coresignalData.summary?.substring(0, 50) + '...'
          });
        }
      }
    });
  }

  async checkEnrichedCompanies() {
    console.log('🏢 Checking Enriched Companies...');
    
    const enrichedCompanies = await this.prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        customFields: {
          path: ['coresignalId'],
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        website: true,
        linkedinUrl: true,
        description: true,
        descriptionEnriched: true,
        customFields: true,
        updatedAt: true
      },
      take: 5
    });

    console.log(`   📊 Found ${enrichedCompanies.length} enriched companies`);
    
    enrichedCompanies.forEach((company, index) => {
      console.log(`\n   ${index + 1}. ${company.name}`);
      console.log(`      🌐 Website: ${company.website || 'None'}`);
      console.log(`      🔗 LinkedIn: ${company.linkedinUrl || 'None'}`);
      console.log(`      📝 Description: ${company.description?.length || 0} characters`);
      console.log(`      📝 Enriched description: ${company.descriptionEnriched?.length || 0} characters`);
      console.log(`      🕒 Last updated: ${company.updatedAt}`);
      
      if (company.customFields && typeof company.customFields === 'object') {
        const customFields = company.customFields;
        console.log(`      🆔 Coresignal ID: ${customFields.coresignalId || 'None'}`);
        console.log(`      📅 Last enriched: ${customFields.lastEnrichedAt || 'None'}`);
        console.log(`      🔧 Enrichment source: ${customFields.enrichmentSource || 'None'}`);
        
        if (customFields.coresignalData) {
          const coresignalData = customFields.coresignalData;
          console.log(`      📊 Coresignal data keys: ${Object.keys(coresignalData).length} fields`);
          console.log(`      📊 Sample data:`, {
            id: coresignalData.id,
            company_name: coresignalData.company_name,
            linkedin_url: coresignalData.linkedin_url,
            website: coresignalData.website,
            description: coresignalData.description?.substring(0, 50) + '...'
          });
        }
      }
    });
  }
}

// Run the verification
const verifier = new VerifyEnrichedData();
verifier.run().catch(console.error);
