#!/usr/bin/env node

/**
 * 🔍 ANALYZE CORESIGNAL RESPONSES FOR REAL ACCURACY
 * 
 * Deep analysis of CoreSignal responses to determine actual accuracy
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class CoreSignalResponseAnalyzer {
  constructor() {
    this.prisma = new PrismaClient();
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.baseUrl = 'https://api.coresignal.com/cdapi/v2';
  }

  async analyzeResponses() {
    console.log('🔍 ANALYZING CORESIGNAL RESPONSES FOR REAL ACCURACY');
    console.log('==================================================');
    
    if (!this.apiKey) {
      console.log('❌ CORESIGNAL_API_KEY not found in environment');
      return;
    }
    
    // Get the same 10 people
    const testPeople = await this.getTestPeople();
    
    console.log(`📊 Analyzing ${testPeople.length} people in detail...`);
    console.log('');
    
    for (const person of testPeople) {
      await this.analyzePersonResponse(person);
    }
    
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

  async analyzePersonResponse(person) {
    console.log(`🔍 ANALYZING: ${person.fullName}`);
    console.log('================================');
    console.log('📋 ORIGINAL DATA:');
    console.log(`   Name: ${person.fullName}`);
    console.log(`   Company: ${person.company?.name || 'Not specified'}`);
    console.log(`   LinkedIn: ${person.linkedinUrl}`);
    console.log(`   Title: ${person.jobTitle || 'Not specified'}`);
    console.log(`   Email: ${person.workEmail || 'Not available'}`);
    console.log('');
    
    try {
      // Get CoreSignal data
      const coresignalData = await this.getCoreSignalData(person.linkedinUrl);
      
      if (coresignalData) {
        console.log('📊 CORESIGNAL RESPONSE:');
        console.log(`   Name: ${coresignalData.full_name || 'N/A'}`);
        console.log(`   Company: ${coresignalData.active_experience_company || 'N/A'}`);
        console.log(`   LinkedIn: ${coresignalData.linkedin_url || 'N/A'}`);
        console.log(`   Title: ${coresignalData.active_experience_title || 'N/A'}`);
        console.log(`   Email: ${coresignalData.primary_professional_email || 'N/A'}`);
        console.log(`   Phone: ${coresignalData.phone || 'N/A'}`);
        console.log(`   Location: ${coresignalData.location || 'N/A'}`);
        console.log('');
        
        // Analyze the actual data structure
        console.log('🔍 DETAILED ANALYSIS:');
        this.analyzeDataStructure(coresignalData);
        
        // Check for experience data
        if (coresignalData.experience && coresignalData.experience.length > 0) {
          console.log('💼 EXPERIENCE DATA:');
          coresignalData.experience.slice(0, 3).forEach((exp, index) => {
            console.log(`   ${index + 1}. ${exp.title || 'N/A'} at ${exp.company_name || 'N/A'} (${exp.start_date || 'N/A'} - ${exp.end_date || 'Current'})`);
          });
        }
        
        // Check for education data
        if (coresignalData.education && coresignalData.education.length > 0) {
          console.log('🎓 EDUCATION DATA:');
          coresignalData.education.slice(0, 2).forEach((edu, index) => {
            console.log(`   ${index + 1}. ${edu.degree || 'N/A'} from ${edu.school_name || 'N/A'} (${edu.graduation_year || 'N/A'})`);
          });
        }
        
        // Check for skills data
        if (coresignalData.skills && coresignalData.skills.length > 0) {
          console.log('🛠️ SKILLS DATA:');
          console.log(`   Skills: ${coresignalData.skills.slice(0, 5).join(', ')}${coresignalData.skills.length > 5 ? '...' : ''}`);
        }
        
        // Real accuracy assessment
        console.log('');
        console.log('📈 REAL ACCURACY ASSESSMENT:');
        this.assessRealAccuracy(person, coresignalData);
        
      } else {
        console.log('❌ No CoreSignal data found');
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log('');
    console.log('='.repeat(80));
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

  analyzeDataStructure(coresignalData) {
    console.log('📋 DATA STRUCTURE ANALYSIS:');
    
    // Check what fields are actually populated
    const fields = [
      'full_name', 'active_experience_company', 'linkedin_url', 
      'active_experience_title', 'primary_professional_email',
      'phone', 'location', 'experience', 'education', 'skills'
    ];
    
    fields.forEach(field => {
      const value = coresignalData[field];
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          console.log(`   ✅ ${field}: Array with ${value.length} items`);
        } else if (typeof value === 'object') {
          console.log(`   ✅ ${field}: Object with ${Object.keys(value).length} keys`);
        } else {
          console.log(`   ✅ ${field}: "${value}"`);
        }
      } else {
        console.log(`   ❌ ${field}: Not populated`);
      }
    });
  }

  assessRealAccuracy(originalPerson, coresignalData) {
    console.log('🎯 REAL ACCURACY ASSESSMENT:');
    
    // Check if this is actually the same person
    const isSamePerson = this.isSamePerson(originalPerson, coresignalData);
    console.log(`   Same Person: ${isSamePerson ? '✅ YES' : '❌ NO'}`);
    
    if (isSamePerson) {
      console.log('   🎉 PERFECT MATCH - This is the correct person!');
      
      // Check data quality
      const dataQuality = this.assessDataQuality(coresignalData);
      console.log(`   📊 Data Quality: ${dataQuality.score}/10 (${dataQuality.description})`);
      
      // Check enrichment value
      const enrichmentValue = this.assessEnrichmentValue(originalPerson, coresignalData);
      console.log(`   💎 Enrichment Value: ${enrichmentValue.score}/10 (${enrichmentValue.description})`);
      
    } else {
      console.log('   ⚠️ WRONG PERSON - This is not the correct person!');
    }
  }

  isSamePerson(originalPerson, coresignalData) {
    // Check LinkedIn URL match (most reliable)
    const linkedinMatch = originalPerson.linkedinUrl === coresignalData.linkedin_url;
    
    // Check name match
    const nameMatch = originalPerson.fullName?.toLowerCase().trim() === coresignalData.full_name?.toLowerCase().trim();
    
    return linkedinMatch && nameMatch;
  }

  assessDataQuality(coresignalData) {
    let score = 0;
    let description = '';
    
    // Basic info (2 points)
    if (coresignalData.full_name) score += 1;
    if (coresignalData.linkedin_url) score += 1;
    
    // Contact info (2 points)
    if (coresignalData.primary_professional_email) score += 1;
    if (coresignalData.phone) score += 1;
    
    // Professional info (2 points)
    if (coresignalData.active_experience_title) score += 1;
    if (coresignalData.active_experience_company) score += 1;
    
    // Location (1 point)
    if (coresignalData.location) score += 1;
    
    // Experience data (2 points)
    if (coresignalData.experience && coresignalData.experience.length > 0) score += 1;
    if (coresignalData.experience && coresignalData.experience.length > 2) score += 1;
    
    // Education (1 point)
    if (coresignalData.education && coresignalData.education.length > 0) score += 1;
    
    if (score >= 8) description = 'Excellent';
    else if (score >= 6) description = 'Good';
    else if (score >= 4) description = 'Fair';
    else description = 'Poor';
    
    return { score, description };
  }

  assessEnrichmentValue(originalPerson, coresignalData) {
    let score = 0;
    let description = '';
    
    // Email enrichment (3 points)
    if (coresignalData.primary_professional_email && !originalPerson.workEmail) score += 3;
    else if (coresignalData.primary_professional_email) score += 1;
    
    // Phone enrichment (2 points)
    if (coresignalData.phone && !originalPerson.phone) score += 2;
    
    // Title enrichment (2 points)
    if (coresignalData.active_experience_title && !originalPerson.jobTitle) score += 2;
    else if (coresignalData.active_experience_title) score += 1;
    
    // Company enrichment (2 points)
    if (coresignalData.active_experience_company && !originalPerson.company?.name) score += 2;
    else if (coresignalData.active_experience_company) score += 1;
    
    // Location enrichment (1 point)
    if (coresignalData.location) score += 1;
    
    if (score >= 8) description = 'Very High';
    else if (score >= 6) description = 'High';
    else if (score >= 4) description = 'Medium';
    else description = 'Low';
    
    return { score, description };
  }
}

// Run the analysis
async function main() {
  const analyzer = new CoreSignalResponseAnalyzer();
  await analyzer.analyzeResponses();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CoreSignalResponseAnalyzer;
