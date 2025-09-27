#!/usr/bin/env node

/**
 * 🔍 ENRICH 10 PEOPLE WITH FULL CORESIGNAL DATA
 * 
 * Store ALL CoreSignal data (93 fields) for complete enrichment
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class Enrich10PeopleFullCoreSignal {
  constructor() {
    this.prisma = new PrismaClient();
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.baseUrl = 'https://api.coresignal.com/cdapi/v2';
    this.results = {
      total: 0,
      enriched: 0,
      errors: 0,
      fieldsStored: 0,
      details: []
    };
  }

  async enrichAllPeople() {
    console.log('🔍 ENRICHING 10 PEOPLE WITH FULL CORESIGNAL DATA');
    console.log('================================================');
    
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
    
    console.log(`📊 Enriching ${testPeople.length} people with FULL data...`);
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
    console.log('');
    
    try {
      // Get FULL CoreSignal data
      const coresignalData = await this.getFullCoreSignalData(person.linkedinUrl);
      
      if (coresignalData) {
        const fieldCount = Object.keys(coresignalData).length;
        console.log(`   ✅ CoreSignal data found: ${fieldCount} fields`);
        console.log(`   Name: ${coresignalData.full_name}`);
        console.log(`   Title: ${coresignalData.active_experience_title}`);
        console.log(`   Email: ${coresignalData.primary_professional_email || 'N/A'}`);
        console.log(`   Location: ${coresignalData.location_full || 'N/A'}`);
        console.log(`   Connections: ${coresignalData.connections_count || 'N/A'}`);
        console.log(`   Experience: ${coresignalData.experience?.length || 0} positions`);
        console.log(`   Education: ${coresignalData.education?.length || 0} degrees`);
        console.log(`   Skills: ${coresignalData.inferred_skills?.length || 0} skills`);
        console.log(`   Activity: ${coresignalData.activity?.length || 0} activities`);
        console.log('');
        
        // Update person with FULL CoreSignal data
        await this.updatePersonWithFullCoreSignalData(person, coresignalData);
        
        this.results.enriched++;
        this.results.fieldsStored += fieldCount;
        this.results.details.push({
          person: person.fullName,
          status: 'enriched',
          coresignalId: coresignalData.id,
          fieldCount: fieldCount,
          email: coresignalData.primary_professional_email,
          connections: coresignalData.connections_count,
          experience: coresignalData.experience?.length || 0,
          education: coresignalData.education?.length || 0,
          skills: coresignalData.inferred_skills?.length || 0
        });
        
        console.log(`   ✅ Successfully enriched with ${fieldCount} fields`);
      } else {
        console.log('   ❌ No CoreSignal data found');
        this.results.details.push({
          person: person.fullName,
          status: 'not_found',
          fieldCount: 0
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

  async getFullCoreSignalData(linkedinUrl) {
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
          return await this.collectFullEmployeeData(employeeId);
        }
      }
      
      return null;
    } catch (error) {
      console.log(`     Error getting CoreSignal data: ${error.message}`);
      return null;
    }
  }

  async collectFullEmployeeData(employeeId) {
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

  async updatePersonWithFullCoreSignalData(person, coresignalData) {
    try {
      // Prepare the update data with ALL CoreSignal fields
      const updateData = {
        // Core fields (only update if we have better data)
        workEmail: coresignalData.primary_professional_email || person.workEmail,
        phone: coresignalData.phone || person.phone,
        jobTitle: coresignalData.active_experience_title || person.jobTitle,
        location: coresignalData.location_full || person.location,
        
        // Custom fields with COMPLETE CoreSignal data
        customFields: {
          ...person.customFields,
          coresignalData: {
            // Store the ENTIRE CoreSignal response
            ...coresignalData,
            // Add our metadata
            lastEnrichedAt: new Date().toISOString(),
            enrichmentSource: 'CoreSignal API - Full Data',
            totalFields: Object.keys(coresignalData).length
          }
        },
        
        // Update enrichment sources
        enrichmentSources: [
          ...(person.enrichmentSources || []),
          'coresignal-full'
        ].filter((source, index, array) => array.indexOf(source) === index) // Remove duplicates
      };
      
      // Update the person record
      await this.prisma.people.update({
        where: { id: person.id },
        data: updateData
      });
      
      console.log('   📊 FULL DATA STORED:');
      console.log(`     - Core Fields Updated: Email, Title, Location`);
      console.log(`     - Total Fields Stored: ${Object.keys(coresignalData).length}`);
      console.log(`     - Profile Photo: ${coresignalData.picture_url ? 'Yes' : 'No'}`);
      console.log(`     - Connections: ${coresignalData.connections_count || 'N/A'}`);
      console.log(`     - Followers: ${coresignalData.followers_count || 'N/A'}`);
      console.log(`     - Experience: ${coresignalData.experience?.length || 0} positions`);
      console.log(`     - Education: ${coresignalData.education?.length || 0} degrees`);
      console.log(`     - Skills: ${coresignalData.inferred_skills?.length || 0} skills`);
      console.log(`     - Activity: ${coresignalData.activity?.length || 0} activities`);
      console.log(`     - Salary Data: ${coresignalData.projected_base_salary_median ? 'Yes' : 'No'}`);
      console.log(`     - Decision Maker: ${coresignalData.is_decision_maker ? 'Yes' : 'No'}`);
      
    } catch (error) {
      console.log(`     Error updating person: ${error.message}`);
      throw error;
    }
  }

  generateSummaryReport() {
    console.log('📊 FULL ENRICHMENT SUMMARY REPORT');
    console.log('==================================');
    console.log(`Total People Processed: ${this.results.total}`);
    console.log(`Successfully Enriched: ${this.results.enriched} (${Math.round((this.results.enriched / this.results.total) * 100)}%)`);
    console.log(`Total Fields Stored: ${this.results.fieldsStored}`);
    console.log(`Average Fields per Person: ${Math.round(this.results.fieldsStored / this.results.enriched)}`);
    console.log(`Errors: ${this.results.errors} (${Math.round((this.results.errors / this.results.total) * 100)}%)`);
    console.log('');
    
    console.log('🔍 DETAILED RESULTS:');
    console.log('===================');
    this.results.details.forEach((detail, index) => {
      console.log(`${index + 1}. ${detail.person}`);
      console.log(`   Status: ${detail.status}`);
      if (detail.coresignalId) {
        console.log(`   CoreSignal ID: ${detail.coresignalId}`);
        console.log(`   Fields Stored: ${detail.fieldCount}`);
        console.log(`   Email: ${detail.email || 'N/A'}`);
        console.log(`   Connections: ${detail.connections || 'N/A'}`);
        console.log(`   Experience: ${detail.experience} positions`);
        console.log(`   Education: ${detail.education} degrees`);
        console.log(`   Skills: ${detail.skills} skills`);
      }
      if (detail.error) {
        console.log(`   Error: ${detail.error}`);
      }
      console.log('');
    });
    
    console.log('💡 FULL ENRICHMENT BENEFITS:');
    console.log('============================');
    const enrichedCount = this.results.details.filter(d => d.status === 'enriched').length;
    const emailCount = this.results.details.filter(d => d.email).length;
    const connectionsCount = this.results.details.filter(d => d.connections).length;
    const experienceCount = this.results.details.filter(d => d.experience > 0).length;
    const educationCount = this.results.details.filter(d => d.education > 0).length;
    const skillsCount = this.results.details.filter(d => d.skills > 0).length;
    
    console.log(`✅ ${enrichedCount} people enriched with FULL CoreSignal data`);
    console.log(`📧 ${emailCount} people got email addresses`);
    console.log(`🔗 ${connectionsCount} people got connection counts`);
    console.log(`💼 ${experienceCount} people got experience history`);
    console.log(`🎓 ${educationCount} people got education data`);
    console.log(`🛠️ ${skillsCount} people got skills data`);
    console.log(`📊 Total fields stored: ${this.results.fieldsStored}`);
    console.log('');
    
    console.log('🎯 NEW DATA AVAILABLE:');
    console.log('======================');
    console.log('• Profile photos and headlines');
    console.log('• Connection and follower counts');
    console.log('• Detailed location information');
    console.log('• Salary projections and data');
    console.log('• Decision maker status');
    console.log('• Management level and department');
    console.log('• Skills and inferred skills');
    console.log('• Activity and engagement data');
    console.log('• Professional email collections');
    console.log('• Experience duration breakdowns');
    console.log('• And 70+ more valuable fields!');
  }
}

// Run the enrichment
async function main() {
  const enricher = new Enrich10PeopleFullCoreSignal();
  await enricher.enrichAllPeople();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = Enrich10PeopleFullCoreSignal;
