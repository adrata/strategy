#!/usr/bin/env node

/**
 * ☁️ CLOUDCADDIE CONTACT ENRICHMENT
 * 
 * Enriches CloudCaddie people with real contact data using:
 * - Coresignal API for comprehensive profile data
 * - Lusha API for contact verification and phone numbers
 * - Focus on getting emails, phones, and LinkedIn data
 */

const { PrismaClient } = require('@prisma/client');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load environment variables
require('dotenv').config(); // Load from .env file

// API Configuration
const CORESIGNAL_CONFIG = {
  apiKey: process.env.CORESIGNAL_API_KEY?.replace(/\\n/g, '').trim(),
  baseUrl: 'https://api.coresignal.com/cdapi/v2'
};

const LUSHA_CONFIG = {
  apiKey: process.env.LUSHA_API_KEY?.replace(/\\n/g, '').trim(),
  baseUrl: 'https://api.lusha.com/v2'
};

class CloudCaddieContactEnrichment {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspace = null;
    this.stats = {
      total: 0,
      processed: 0,
      coresignalEnriched: 0,
      lushaEnriched: 0,
      contactDataAdded: 0,
      failed: 0,
      skipped: 0
    };
  }

  async runEnrichment() {
    try {
      console.log('☁️ Starting CloudCaddie contact enrichment...\n');
      
      // Validate API keys
      if (!CORESIGNAL_CONFIG.apiKey) {
        console.log('❌ CORESIGNAL_API_KEY not found in environment variables');
        return;
      }
      if (!LUSHA_CONFIG.apiKey) {
        console.log('❌ LUSHA_API_KEY not found in environment variables');
        return;
      }
      
      console.log('✅ API keys validated\n');

      // Find CloudCaddie workspace
      this.workspace = await this.prisma.workspaces.findFirst({
        where: {
          OR: [
            { name: { contains: 'CloudCaddie', mode: 'insensitive' } },
            { name: { contains: 'Cloud Caddie', mode: 'insensitive' } },
            { slug: { contains: 'cloudcaddie', mode: 'insensitive' } }
          ]
        }
      });

      if (!this.workspace) {
        console.log('❌ CloudCaddie workspace not found!');
        return;
      }

      console.log(`✅ Found workspace: ${this.workspace.name} (${this.workspace.id})\n`);

      // Get people who need contact enrichment
      const people = await this.prisma.people.findMany({
        where: { 
          workspaceId: this.workspace.id,
          // Focus on people missing contact data
          OR: [
            { phone: null },
            { mobilePhone: null },
            { workPhone: null },
            { email: null },
            { workEmail: null }
          ]
        },
        include: {
          company: {
            select: {
              name: true,
              domain: true,
              website: true
            }
          }
        },
        orderBy: { fullName: 'asc' }
      });

      this.stats.total = people.length;
      console.log(`📊 Found ${people.length} people needing contact enrichment\n`);

      if (people.length === 0) {
        console.log('✅ All people already have contact data!');
        return;
      }

      // Process people in batches
      await this.processPeopleInBatches(people, 5); // Smaller batches for API limits

      // Final summary
      this.printSummary();

    } catch (error) {
      console.error('❌ Error during enrichment:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async processPeopleInBatches(people, batchSize = 5) {
    console.log(`👥 PROCESSING PEOPLE IN BATCHES OF ${batchSize}:`);
    console.log('================================================\n');

    for (let i = 0; i < people.length; i += batchSize) {
      const batch = people.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      console.log(`📦 Batch ${batchNumber}/${Math.ceil(people.length / batchSize)}`);
      await this.processBatch(batch, batchNumber);
      
      // Rate limiting between batches
      if (i + batchSize < people.length) {
        console.log('   ⏳ Waiting 3 seconds between batches...\n');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }

  async processBatch(people, batchNumber) {
    const batchPromises = people.map(async (person, index) => {
      try {
        console.log(`   ${index + 1}. Processing ${person.fullName}...`);
        
        let coresignalData = null;
        let lushaData = null;
        let contactUpdates = {};

        // Try Coresignal enrichment first (if has LinkedIn or email)
        if (person.linkedinUrl || person.email || person.workEmail) {
          coresignalData = await this.enrichWithCoresignal(person);
          if (coresignalData) {
            console.log(`      ✅ Coresignal enriched`);
            this.stats.coresignalEnriched++;
            
            // Extract contact data from Coresignal
            contactUpdates = this.extractCoresignalContacts(coresignalData, person);
          } else {
            console.log(`      ❌ Coresignal enrichment failed`);
          }
        }

        // Try Lusha enrichment (if has name and company info)
        if (person.firstName && person.lastName && (person.company?.name || person.linkedinUrl)) {
          lushaData = await this.enrichWithLusha(person);
          if (lushaData) {
            console.log(`      ✅ Lusha enriched`);
            this.stats.lushaEnriched++;
            
            // Extract contact data from Lusha
            const lushaContacts = this.extractLushaContacts(lushaData, person);
            contactUpdates = { ...contactUpdates, ...lushaContacts };
          } else {
            console.log(`      ❌ Lusha enrichment failed`);
          }
        }

        // Update database with contact data
        if (Object.keys(contactUpdates).length > 0) {
          await this.prisma.people.update({
            where: { id: person.id },
            data: {
              ...contactUpdates,
              lastEnriched: new Date(),
              coresignalData: coresignalData,
              enrichedData: lushaData,
              updatedAt: new Date()
            }
          });
          
          console.log(`      📞 Contact data updated: ${Object.keys(contactUpdates).join(', ')}`);
          this.stats.contactDataAdded++;
        } else {
          console.log(`      ⚠️ No contact data found`);
        }

        this.stats.processed++;

        // Rate limiting between API calls
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.log(`      ❌ Error processing ${person.fullName}: ${error.message}`);
        this.stats.failed++;
      }
    });

    await Promise.all(batchPromises);
    console.log(`   📊 Batch ${batchNumber} complete: ${this.stats.coresignalEnriched} Coresignal, ${this.stats.lushaEnriched} Lusha, ${this.stats.contactDataAdded} contacts updated, ${this.stats.failed} failed\n`);
  }

  async enrichWithCoresignal(person) {
    try {
      // Try LinkedIn URL search first
      if (person.linkedinUrl) {
        const linkedinData = await this.callCoresignalLinkedInSearch(person.linkedinUrl);
        if (linkedinData) return linkedinData;
      }

      // Try email search
      if (person.email || person.workEmail) {
        const emailData = await this.callCoresignalEmailSearch(person.email || person.workEmail);
        if (emailData) return emailData;
      }

      // Try name + company search
      if (person.firstName && person.lastName && person.company?.name) {
        const nameData = await this.callCoresignalNameSearch(person.firstName, person.lastName, person.company.name);
        if (nameData) return nameData;
      }

      return null;
    } catch (error) {
      console.error(`      Coresignal error for ${person.fullName}:`, error.message);
      return null;
    }
  }

  async callCoresignalLinkedInSearch(linkedinUrl) {
    try {
      const url = `${CORESIGNAL_CONFIG.baseUrl}/employee_multi_source/search/es_dsl`;
      const data = {
        query: {
          bool: {
            must: [
              {
                match_phrase: {
                  linkedin_url: linkedinUrl
                }
              }
            ]
          }
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CORESIGNAL_CONFIG.apiKey
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Coresignal API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.hits?.hits?.length > 0) {
        return result.hits.hits[0]._source;
      }
      
      return null;
    } catch (error) {
      console.error('      Coresignal LinkedIn search error:', error.message);
      return null;
    }
  }

  async callCoresignalEmailSearch(email) {
    try {
      const url = `${CORESIGNAL_CONFIG.baseUrl}/employee_multi_source/search/es_dsl`;
      const data = {
        query: {
          bool: {
            must: [
              {
                match_phrase: {
                  work_email: email
                }
              }
            ]
          }
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CORESIGNAL_CONFIG.apiKey
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Coresignal API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.hits?.hits?.length > 0) {
        return result.hits.hits[0]._source;
      }
      
      return null;
    } catch (error) {
      console.error('      Coresignal email search error:', error.message);
      return null;
    }
  }

  async callCoresignalNameSearch(firstName, lastName, companyName) {
    try {
      const url = `${CORESIGNAL_CONFIG.baseUrl}/employee_multi_source/search/es_dsl`;
      const data = {
        query: {
          bool: {
            must: [
              {
                match_phrase: {
                  first_name: firstName
                }
              },
              {
                match_phrase: {
                  last_name: lastName
                }
              },
              {
                match_phrase: {
                  current_company_name: companyName
                }
              }
            ]
          }
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CORESIGNAL_CONFIG.apiKey
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Coresignal API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.hits?.hits?.length > 0) {
        return result.hits.hits[0]._source;
      }
      
      return null;
    } catch (error) {
      console.error('      Coresignal name search error:', error.message);
      return null;
    }
  }

  async enrichWithLusha(person) {
    try {
      // Try LinkedIn URL first
      if (person.linkedinUrl) {
        const linkedinData = await this.callLushaLinkedInSearch(person.linkedinUrl);
        if (linkedinData) return linkedinData;
      }

      // Try name + company search
      if (person.firstName && person.lastName && person.company?.name) {
        const nameData = await this.callLushaNameSearch(person.firstName, person.lastName, person.company.name);
        if (nameData) return nameData;
      }

      return null;
    } catch (error) {
      console.error(`      Lusha error for ${person.fullName}:`, error.message);
      return null;
    }
  }

  async callLushaLinkedInSearch(linkedinUrl) {
    try {
      const requestBody = {
        contacts: [
          {
            contactId: "1",
            linkedinUrl: linkedinUrl
          }
        ],
        metadata: {
          revealEmails: true,
          revealPhones: true
        }
      };

      const response = await fetch(`${LUSHA_CONFIG.baseUrl}/person`, {
        method: 'POST',
        headers: {
          'api_key': LUSHA_CONFIG.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lusha API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      // Lusha returns data in result.contacts.contactId format
      if (result.contacts && result.contacts["1"] && result.contacts["1"].data) {
        return result.contacts["1"].data;
      }
      
      return null;
    } catch (error) {
      console.error('      Lusha LinkedIn search error:', error.message);
      return null;
    }
  }

  async callLushaNameSearch(firstName, lastName, companyName) {
    try {
      // Lusha name search requires fullName + companyName format
      const requestBody = {
        contacts: [
          {
            contactId: "1",
            fullName: `${firstName} ${lastName}`,
            companyName: companyName
          }
        ],
        metadata: {
          revealEmails: true,
          revealPhones: true
        }
      };

      const response = await fetch(`${LUSHA_CONFIG.baseUrl}/person`, {
        method: 'POST',
        headers: {
          'api_key': LUSHA_CONFIG.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lusha API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      // Lusha returns data in result.contacts.contactId format
      if (result.contacts && result.contacts["1"] && result.contacts["1"].data) {
        return result.contacts["1"].data;
      }
      
      return null;
    } catch (error) {
      console.error('      Lusha name search error:', error.message);
      return null;
    }
  }

  extractCoresignalContacts(coresignalData, person) {
    const updates = {};

    // Extract email data
    if (coresignalData.work_email && !person.workEmail) {
      updates.workEmail = coresignalData.work_email;
    }
    if (coresignalData.personal_email && !person.personalEmail) {
      updates.personalEmail = coresignalData.personal_email;
    }

    // Extract phone data
    if (coresignalData.phone_numbers && coresignalData.phone_numbers.length > 0) {
      const phone = coresignalData.phone_numbers[0];
      if (phone && !person.phone) {
        updates.phone = phone;
      }
    }
    if (coresignalData.mobile_phone && !person.mobilePhone) {
      updates.mobilePhone = coresignalData.mobile_phone;
    }

    // Extract LinkedIn data
    if (coresignalData.linkedin_url && !person.linkedinUrl) {
      updates.linkedinUrl = coresignalData.linkedin_url;
    }

    return updates;
  }

  extractLushaContacts(lushaData, person) {
    const updates = {};

    // Extract email data
    if (lushaData.emails && lushaData.emails.length > 0) {
      const email = lushaData.emails[0];
      if (email && !person.email) {
        updates.email = email;
      }
    }

    // Extract phone data
    if (lushaData.phones && lushaData.phones.length > 0) {
      const phone = lushaData.phones[0];
      if (phone && !person.phone) {
        updates.phone = phone;
      }
      
      // Try to get mobile phone if available
      if (lushaData.phones.length > 1 && !person.mobilePhone) {
        updates.mobilePhone = lushaData.phones[1];
      }
    }

    // Extract additional contact info
    if (lushaData.fullName && !person.fullName) {
      updates.fullName = lushaData.fullName;
    }

    return updates;
  }

  printSummary() {
    console.log('🎉 CLOUDCADDIE CONTACT ENRICHMENT SUMMARY');
    console.log('==========================================');
    console.log(`📊 Total People: ${this.stats.total}`);
    console.log(`✅ Coresignal Enriched: ${this.stats.coresignalEnriched}`);
    console.log(`✅ Lusha Enriched: ${this.stats.lushaEnriched}`);
    console.log(`📞 Contact Data Added: ${this.stats.contactDataAdded}`);
    console.log(`⏭️ Skipped: ${this.stats.skipped}`);
    console.log(`❌ Failed: ${this.stats.failed}`);
    console.log(`📈 Success Rate: ${((this.stats.contactDataAdded / this.stats.total) * 100).toFixed(1)}%`);
    console.log('\n🎯 CloudCaddie contact enrichment complete!');
  }
}

// Run the enrichment
if (require.main === module) {
  const enrichment = new CloudCaddieContactEnrichment();
  enrichment.runEnrichment();
}

module.exports = { CloudCaddieContactEnrichment };
