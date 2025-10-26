#!/usr/bin/env node

/**
 * Test Zonar Enrichment Script
 * 
 * This script tests enrichment for just one person and one company
 * to verify the API calls work correctly and data is stored properly.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class TestEnrichment {
  constructor() {
    this.prisma = new PrismaClient();
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1'; // Notary Everyday workspace

    if (!this.apiKey) {
      console.error('❌ CORESIGNAL_API_KEY environment variable is required');
      process.exit(1);
    }
  }

  async run() {
    try {
      console.log('🧪 Testing Zonar Enrichment for Notary Everyday workspace...\n');
      
      // Test one person
      await this.testPersonEnrichment();
      
      console.log('\n' + '='.repeat(50) + '\n');
      
      // Test one company
      await this.testCompanyEnrichment();
      
    } catch (error) {
      console.error('❌ Error in test enrichment:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async testPersonEnrichment() {
    console.log('👤 Testing Person Enrichment...');
    
    // Get the first person from Notary Everyday
    const person = await this.prisma.people.findFirst({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            linkedinUrl: true,
            website: true,
            domain: true
          }
        }
      }
    });

    if (!person) {
      console.log('❌ No person found in Notary Everyday workspace');
      return;
    }

    console.log(`   🔍 Testing with: ${person.fullName} at ${person.company?.name || 'Unknown Company'}`);
    console.log(`   📧 Email: ${person.email || 'None'}`);
    console.log(`   🔗 LinkedIn: ${person.linkedinUrl || 'None'}`);
    
    // Check current enrichment status
    const isEnriched = this.isPersonEnriched(person);
    console.log(`   📊 Currently enriched: ${isEnriched ? 'Yes' : 'No'}`);
    
    if (isEnriched) {
      console.log('   ✅ Person is already enriched, skipping API call');
      return;
    }

    // Test Coresignal API call
    try {
      const searchQuery = this.buildPersonSearchQuery(person);
      console.log('   🔍 Search query:', JSON.stringify(searchQuery, null, 2));
      
      const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=5', {
        method: 'POST',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(searchQuery)
      });

      console.log(`   📡 Search response status: ${searchResponse.status} ${searchResponse.statusText}`);

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        console.log(`   ❌ Search failed: ${errorText}`);
        return;
      }

      const searchData = await searchResponse.json();
      console.log('   📊 Search response data:', JSON.stringify(searchData, null, 2));
      
      // Handle different response formats
      let employeeIds = [];
      if (Array.isArray(searchData)) {
        employeeIds = searchData;
      } else if (searchData.hits?.hits) {
        employeeIds = searchData.hits.hits.map(hit => hit._id || hit._source?.id);
      } else if (searchData.hits) {
        employeeIds = searchData.hits;
      }

      console.log(`   🆔 Found ${employeeIds.length} employee IDs:`, employeeIds);

      if (employeeIds.length === 0) {
        console.log('   ⚠️ No Coresignal data found for this person');
        return;
      }

      // Test collect API call
      const employeeId = employeeIds[0];
      console.log(`   🔍 Collecting data for employee ID: ${employeeId}`);
      
      const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/employee_multi_source/collect/${employeeId}`, {
        headers: { 
          'apikey': this.apiKey,
          'Accept': 'application/json'
        }
      });

      console.log(`   📡 Collect response status: ${collectResponse.status} ${collectResponse.statusText}`);

      if (!collectResponse.ok) {
        const errorText = await collectResponse.text();
        console.log(`   ❌ Collect failed: ${errorText}`);
        return;
      }

      const profileData = await collectResponse.json();
      console.log('   📊 Profile data keys:', Object.keys(profileData));
      console.log('   📊 Profile data sample:', JSON.stringify({
        id: profileData.id,
        full_name: profileData.full_name,
        linkedin_url: profileData.linkedin_url,
        summary: profileData.summary?.substring(0, 100) + '...'
      }, null, 2));

      // Update person with test data
      await this.updatePersonWithTestData(person, employeeId, profileData);
      console.log('   ✅ Person updated with Coresignal data');

    } catch (error) {
      console.error(`   ❌ Error testing person enrichment:`, error.message);
    }
  }

  async testCompanyEnrichment() {
    console.log('🏢 Testing Company Enrichment...');
    
    // Get the first company from Notary Everyday
    const company = await this.prisma.companies.findFirst({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null
      }
    });

    if (!company) {
      console.log('❌ No company found in Notary Everyday workspace');
      return;
    }

    console.log(`   🔍 Testing with: ${company.name}`);
    console.log(`   🌐 Website: ${company.website || 'None'}`);
    console.log(`   🔗 LinkedIn: ${company.linkedinUrl || 'None'}`);
    console.log(`   📧 Email: ${company.email || 'None'}`);
    
    // Check current enrichment status
    const isEnriched = this.isCompanyEnriched(company);
    console.log(`   📊 Currently enriched: ${isEnriched ? 'Yes' : 'No'}`);
    
    if (isEnriched) {
      console.log('   ✅ Company is already enriched, skipping API call');
      return;
    }

    // Test Coresignal API call
    try {
      const searchQuery = this.buildCompanySearchQuery(company);
      console.log('   🔍 Search query:', JSON.stringify(searchQuery, null, 2));
      
      const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl?items_per_page=5', {
        method: 'POST',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(searchQuery)
      });

      console.log(`   📡 Search response status: ${searchResponse.status} ${searchResponse.statusText}`);

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        console.log(`   ❌ Search failed: ${errorText}`);
        return;
      }

      const searchData = await searchResponse.json();
      console.log('   📊 Search response data:', JSON.stringify(searchData, null, 2));
      
      // Handle different response formats
      let companyIds = [];
      if (Array.isArray(searchData)) {
        companyIds = searchData;
      } else if (searchData.hits?.hits) {
        companyIds = searchData.hits.hits.map(hit => hit._id || hit._source?.id);
      } else if (searchData.hits) {
        companyIds = searchData.hits;
      }

      console.log(`   🆔 Found ${companyIds.length} company IDs:`, companyIds);

      if (companyIds.length === 0) {
        console.log('   ⚠️ No Coresignal data found for this company');
        return;
      }

      // Test collect API call
      const coresignalCompanyId = companyIds[0];
      console.log(`   🔍 Collecting data for company ID: ${coresignalCompanyId}`);
      
      const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/company_multi_source/collect/${coresignalCompanyId}`, {
        headers: { 
          'apikey': this.apiKey,
          'Accept': 'application/json'
        }
      });

      console.log(`   📡 Collect response status: ${collectResponse.status} ${collectResponse.statusText}`);

      if (!collectResponse.ok) {
        const errorText = await collectResponse.text();
        console.log(`   ❌ Collect failed: ${errorText}`);
        return;
      }

      const profileData = await collectResponse.json();
      console.log('   📊 Profile data keys:', Object.keys(profileData));
      console.log('   📊 Profile data sample:', JSON.stringify({
        id: profileData.id,
        company_name: profileData.company_name,
        linkedin_url: profileData.linkedin_url,
        website: profileData.website,
        description: profileData.description?.substring(0, 100) + '...'
      }, null, 2));

      // Update company with test data
      await this.updateCompanyWithTestData(company, coresignalCompanyId, profileData);
      console.log('   ✅ Company updated with Coresignal data');

    } catch (error) {
      console.error(`   ❌ Error testing company enrichment:`, error.message);
    }
  }

  isPersonEnriched(person) {
    if (person.customFields && typeof person.customFields === 'object') {
      const customFields = person.customFields;
      if (customFields.coresignalId || customFields.coresignalData || customFields.lastEnrichedAt) {
        return true;
      }
    }
    return false;
  }

  isCompanyEnriched(company) {
    if (company.customFields && typeof company.customFields === 'object') {
      const customFields = company.customFields;
      if (customFields.coresignalId || customFields.coresignalData || customFields.lastEnrichedAt) {
        return true;
      }
    }
    return false;
  }

  buildPersonSearchQuery(person) {
    const query = {
      query: {
        bool: {
          must: []
        }
      }
    };

    // Add company experience filter if company has LinkedIn URL
    if (person.company?.linkedinUrl) {
      query.query.bool.must.push({
        nested: {
          path: 'experience',
          query: {
            bool: {
              must: [
                {
                  match: {
                    'experience.company_linkedin_url': person.company.linkedinUrl
                  }
                },
                {
                  term: {
                    'experience.active_experience': 1
                  }
                }
              ]
            }
          }
        }
      });
    }

    // Add person name matching
    query.query.bool.must.push({
      bool: {
        should: [
          { match: { 'full_name': person.fullName } },
          { match_phrase: { 'full_name': person.fullName } },
          { match: { 'member_full_name': person.fullName } },
          { match_phrase: { 'member_full_name': person.fullName } }
        ]
      }
    });

    return query;
  }

  buildCompanySearchQuery(company) {
    const query = {
      query: {
        bool: {
          must: []
        }
      }
    };

    // Add company name matching
    query.query.bool.must.push({
      bool: {
        should: [
          { match: { 'name': company.name } },
          { match_phrase: { 'name': company.name } },
          { match: { 'company_name': company.name } },
          { match_phrase: { 'company_name': company.name } }
        ]
      }
    });

    return query;
  }

  async updatePersonWithTestData(person, coresignalId, profileData) {
    const enrichedData = {
      coresignalId: coresignalId,
      coresignalData: profileData,
      lastEnrichedAt: new Date().toISOString(),
      enrichmentSource: 'coresignal'
    };

    await this.prisma.people.update({
      where: { id: person.id },
      data: {
        customFields: {
          ...(person.customFields || {}),
          ...enrichedData
        },
        bio: profileData.summary || person.bio,
        linkedinUrl: profileData.linkedin_url || person.linkedinUrl,
        updatedAt: new Date()
      }
    });
  }

  async updateCompanyWithTestData(company, coresignalId, profileData) {
    const enrichedData = {
      coresignalId: coresignalId,
      coresignalData: profileData,
      lastEnrichedAt: new Date().toISOString(),
      enrichmentSource: 'coresignal'
    };

    await this.prisma.companies.update({
      where: { id: company.id },
      data: {
        customFields: {
          ...(company.customFields || {}),
          ...enrichedData
        },
        descriptionEnriched: profileData.description || company.descriptionEnriched,
        linkedinUrl: profileData.linkedin_url || company.linkedinUrl,
        website: profileData.website || company.website,
        domain: profileData.domain || company.domain,
        industry: profileData.industry || company.industry,
        employeeCount: profileData.employees_count || company.employeeCount,
        foundedYear: profileData.founded_year || company.foundedYear,
        updatedAt: new Date()
      }
    });
  }
}

// Run the test
const test = new TestEnrichment();
test.run().catch(console.error);
