#!/usr/bin/env node

/**
 * 🔍 ENRICH 10 PEOPLE WITH CORESIGNAL DATA
 * 
 * Enrich and store all CoreSignal data for the 10 test people
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class Enrich10PeopleCoreSignal {
  constructor() {
    this.prisma = new PrismaClient();
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.baseUrl = 'https://api.coresignal.com/cdapi/v2';
    this.results = {
      total: 0,
      enriched: 0,
      errors: 0,
      details: []
    };
  }

  async enrichAllPeople() {
    console.log('🔍 ENRICHING 10 PEOPLE WITH CORESIGNAL DATA');
    console.log('============================================');
    
    if (!this.apiKey) {
      console.log('❌ CORESIGNAL_API_KEY not found in environment');
      return;
    }
    
    console.log('API Key loaded:', this.apiKey ? 'Yes' : 'No');
    console.log('');
    
    // Get the 10 people
    const testPeople = await this.getTestPeople();
    
    if (testPeople.length === 0) {
      console.log('❌ No people found for enrichment');
      return;
    }
    
    console.log(`📊 Enriching ${testPeople.length} people...`);
    console.log('');
    
    // Enrich each person
    for (const person of testPeople) {
      await this.enrichPerson(person);
    }
    
    // Generate summary report
    this.generateSummaryReport();
    
    await this.prisma.$disconnect();
  }

  async getTestPeople() {
    try {
      const people = await this.prisma.people.findMany({
        where: {
          workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1',
          linkedinUrl: { not: null },
          linkedinUrl: { not: '' }
        },
        include: { company: true },
        take: 10,
        orderBy: { createdAt: 'desc' }
      });
      
      return people;
    } catch (error) {
      console.error('Error getting test people:', error);
      return [];
    }
  }

  async enrichPerson(person) {
    this.results.total++;
    
    console.log(`🔍 ENRICHING: ${person.fullName}`);
    console.log('================================');
    console.log(`   Company: ${person.company?.name || 'Unknown'}`);
    console.log(`   LinkedIn: ${person.linkedinUrl}`);
    console.log(`   Current Title: ${person.jobTitle || 'Not specified'}`);
    console.log('');
    
    try {
      // Get CoreSignal data
      const coresignalData = await this.getCoreSignalData(person.linkedinUrl);
      
      if (coresignalData) {
        console.log('   ✅ CoreSignal data found');
        console.log(`   Name: ${coresignalData.full_name}`);
        console.log(`   Title: ${coresignalData.active_experience_title}`);
        console.log(`   Email: ${coresignalData.primary_professional_email || 'N/A'}`);
        console.log(`   Experience: ${coresignalData.experience?.length || 0} positions`);
        console.log(`   Education: ${coresignalData.education?.length || 0} degrees`);
        console.log('');
        
        // Update person with CoreSignal data
        await this.updatePersonWithCoreSignalData(person, coresignalData);
        
        this.results.enriched++;
        this.results.details.push({
          person: person.fullName,
          status: 'enriched',
          coresignalId: coresignalData.id,
          email: coresignalData.primary_professional_email,
          experience: coresignalData.experience?.length || 0,
          education: coresignalData.education?.length || 0
        });
        
        console.log('   ✅ Successfully enriched and stored data');
      } else {
        console.log('   ❌ No CoreSignal data found');
        this.results.details.push({
          person: person.fullName,
          status: 'not_found',
          coresignalId: null,
          email: null,
          experience: 0,
          education: 0
        });
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      this.results.errors++;
      this.results.details.push({
        person: person.fullName,
        status: 'error',
        error: error.message
      });
    }
    
    console.log('');
    console.log('='.repeat(60));
    console.log('');
  }

  async getCoreSignalData(linkedinUrl) {
    try {
      const searchQuery = {
        query: {
          bool: {
            must: [
              {
                match: {
                  linkedin_url: linkedinUrl
                }
              }
            ]
          }
        }
      };

      const searchUrl = `${this.baseUrl}/employee_multi_source/search/es_dsl?items_per_page=1`;
      
      const searchResponse = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(searchQuery)
      });

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        
        if (Array.isArray(searchData) && searchData.length > 0) {
          const employeeId = searchData[0];
          return await this.collectEmployeeData(employeeId);
        }
      }
      
      return null;
    } catch (error) {
      console.log(`     Error getting CoreSignal data: ${error.message}`);
      return null;
    }
  }

  async collectEmployeeData(employeeId) {
    try {
      const collectUrl = `${this.baseUrl}/employee_multi_source/collect/${employeeId}`;
      
      const collectResponse = await fetch(collectUrl, {
        method: 'GET',
        headers: { 
          'apikey': this.apiKey,
          'Accept': 'application/json'
        }
      });

      if (collectResponse.ok) {
        return await collectResponse.json();
      }
      
      return null;
    } catch (error) {
      console.log(`     Error collecting employee data: ${error.message}`);
      return null;
    }
  }

  async updatePersonWithCoreSignalData(person, coresignalData) {
    try {
      // Prepare the update data
      const updateData = {
        // Basic info
        workEmail: coresignalData.primary_professional_email || person.workEmail,
        phone: coresignalData.phone || person.phone,
        jobTitle: coresignalData.active_experience_title || person.jobTitle,
        
        // Location info
        location: coresignalData.location || person.location,
        
        // Custom fields with full CoreSignal data
        customFields: {
          ...person.customFields,
          coresignalData: {
            id: coresignalData.id,
            full_name: coresignalData.full_name,
            linkedin_url: coresignalData.linkedin_url,
            primary_professional_email: coresignalData.primary_professional_email,
            phone: coresignalData.phone,
            location: coresignalData.location,
            active_experience_title: coresignalData.active_experience_title,
            active_experience_company: coresignalData.active_experience_company,
            experience: coresignalData.experience || [],
            education: coresignalData.education || [],
            skills: coresignalData.skills || [],
            lastEnrichedAt: new Date().toISOString(),
            enrichmentSource: 'CoreSignal API'
          }
        },
        
        // Update enrichment sources
        enrichmentSources: [
          ...(person.enrichmentSources || []),
          'coresignal'
        ].filter((source, index, array) => array.indexOf(source) === index) // Remove duplicates
      };
      
      // Update the person record
      await this.prisma.people.update({
        where: { id: person.id },
        data: updateData
      });
      
      console.log('   📊 Data stored successfully:');
      console.log(`     - Email: ${updateData.workEmail || 'Not updated'}`);
      console.log(`     - Phone: ${updateData.phone || 'Not updated'}`);
      console.log(`     - Title: ${updateData.jobTitle || 'Not updated'}`);
      console.log(`     - Location: ${updateData.location || 'Not updated'}`);
      console.log(`     - Experience: ${coresignalData.experience?.length || 0} positions`);
      console.log(`     - Education: ${coresignalData.education?.length || 0} degrees`);
      console.log(`     - Skills: ${coresignalData.skills?.length || 0} skills`);
      
    } catch (error) {
      console.log(`     Error updating person: ${error.message}`);
      throw error;
    }
  }

  generateSummaryReport() {
    console.log('📊 ENRICHMENT SUMMARY REPORT');
    console.log('============================');
    console.log(`Total People Processed: ${this.results.total}`);
    console.log(`Successfully Enriched: ${this.results.enriched} (${Math.round((this.results.enriched / this.results.total) * 100)}%)`);
    console.log(`Errors: ${this.results.errors} (${Math.round((this.results.errors / this.results.total) * 100)}%)`);
    console.log('');
    
    console.log('🔍 DETAILED RESULTS:');
    console.log('===================');
    this.results.details.forEach((detail, index) => {
      console.log(`${index + 1}. ${detail.person}`);
      console.log(`   Status: ${detail.status}`);
      if (detail.coresignalId) {
        console.log(`   CoreSignal ID: ${detail.coresignalId}`);
        console.log(`   Email: ${detail.email || 'N/A'}`);
        console.log(`   Experience: ${detail.experience} positions`);
        console.log(`   Education: ${detail.education} degrees`);
      }
      if (detail.error) {
        console.log(`   Error: ${detail.error}`);
      }
      console.log('');
    });
    
    console.log('💡 ENRICHMENT BENEFITS:');
    console.log('======================');
    const enrichedCount = this.results.details.filter(d => d.status === 'enriched').length;
    const emailCount = this.results.details.filter(d => d.email).length;
    const experienceCount = this.results.details.filter(d => d.experience > 0).length;
    const educationCount = this.results.details.filter(d => d.education > 0).length;
    
    console.log(`✅ ${enrichedCount} people enriched with CoreSignal data`);
    console.log(`📧 ${emailCount} people got email addresses`);
    console.log(`💼 ${experienceCount} people got experience history`);
    console.log(`🎓 ${educationCount} people got education data`);
    console.log('');
    
    console.log('🎯 NEXT STEPS:');
    console.log('==============');
    console.log('1. Verify the enriched data in your database');
    console.log('2. Check the customFields.coresignalData for full details');
    console.log('3. Use the enriched data for better lead scoring');
    console.log('4. Consider running enrichment for more people');
  }
}

// Run the enrichment
async function main() {
  const enricher = new Enrich10PeopleCoreSignal();
  await enricher.enrichAllPeople();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = Enrich10PeopleCoreSignal;
