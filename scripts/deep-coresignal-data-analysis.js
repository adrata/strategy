#!/usr/bin/env node

/**
 * 🔍 DEEP CORESIGNAL DATA ANALYSIS
 * 
 * Comprehensive analysis of CoreSignal data structure to understand
 * why we're not getting company information
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class DeepCoreSignalDataAnalysis {
  constructor() {
    this.prisma = new PrismaClient();
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.baseUrl = 'https://api.coresignal.com/cdapi/v2';
    this.results = {
      total: 0,
      withCompanyData: 0,
      withoutCompanyData: 0,
      dataStructureAnalysis: [],
      fieldAnalysis: {},
      experienceAnalysis: {},
      companyFieldVariations: {}
    };
  }

  async analyzeCoreSignalDataStructure() {
    console.log('🔍 DEEP CORESIGNAL DATA STRUCTURE ANALYSIS');
    console.log('==========================================');
    console.log('Comprehensive analysis of CoreSignal data to understand company data availability');
    console.log('');
    
    if (!this.apiKey) {
      console.log('❌ CORESIGNAL_API_KEY not found in environment');
      return;
    }
    
    // Get recently enriched people
    const enrichedPeople = await this.getRecentlyEnrichedPeople();
    
    console.log(`📊 ANALYZING CORESIGNAL DATA STRUCTURE FOR ${enrichedPeople.length} PEOPLE`);
    console.log('================================================================');
    console.log('');
    
    // Analyze each person's CoreSignal data structure
    for (const person of enrichedPeople) {
      await this.analyzePersonDataStructure(person);
    }
    
    // Generate comprehensive analysis report
    this.generateDataStructureReport();
    
    await this.prisma.$disconnect();
  }

  async getRecentlyEnrichedPeople() {
    // Get people who were recently enriched with CoreSignal data
    const people = await this.prisma.people.findMany({
      where: {
        workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1',
        customFields: {
          path: ['coresignalData'],
          not: null
        }
      },
      select: {
        id: true,
        fullName: true,
        linkedinUrl: true,
        company: {
          select: {
            name: true
          }
        },
        customFields: true
      },
      take: 10 // Start with 10 for detailed analysis
    });
    
    return people;
  }

  async analyzePersonDataStructure(person) {
    this.results.total++;
    
    console.log(`🔍 ANALYZING: ${person.fullName}`);
    console.log('================================');
    console.log(`   Our Company: ${person.company?.name || 'Unknown'}`);
    console.log(`   LinkedIn: ${person.linkedinUrl}`);
    console.log('');
    
    try {
      // Get fresh CoreSignal data
      const coresignalData = await this.getCoreSignalData(person.linkedinUrl);
      
      if (coresignalData) {
        console.log('   📊 CORESIGNAL DATA STRUCTURE ANALYSIS:');
        console.log('   =======================================');
        
        // Analyze all available fields
        const fieldAnalysis = this.analyzeAllFields(coresignalData);
        this.results.dataStructureAnalysis.push({
          person: person.fullName,
          ourCompany: person.company?.name || 'Unknown',
          fieldAnalysis: fieldAnalysis,
          hasCompanyData: fieldAnalysis.hasCompanyData,
          companyFields: fieldAnalysis.companyFields,
          experienceData: fieldAnalysis.experienceData
        });
        
        if (fieldAnalysis.hasCompanyData) {
          this.results.withCompanyData++;
          console.log('   ✅ COMPANY DATA FOUND:');
          fieldAnalysis.companyFields.forEach(field => {
            console.log(`     ${field.name}: ${field.value}`);
          });
        } else {
          this.results.withoutCompanyData++;
          console.log('   ❌ NO COMPANY DATA FOUND');
        }
        
        // Analyze experience data
        if (fieldAnalysis.experienceData.length > 0) {
          console.log('   📋 EXPERIENCE DATA:');
          fieldAnalysis.experienceData.forEach((exp, index) => {
            console.log(`     Experience ${index + 1}:`);
            console.log(`       Company: ${exp.company || 'None'}`);
            console.log(`       Title: ${exp.title || 'None'}`);
            console.log(`       Start: ${exp.startDate || 'None'}`);
            console.log(`       End: ${exp.endDate || 'None'}`);
            console.log(`       Current: ${exp.isCurrent || false}`);
          });
        }
        
        // Track field variations
        Object.keys(coresignalData).forEach(field => {
          this.results.fieldAnalysis[field] = (this.results.fieldAnalysis[field] || 0) + 1;
        });
        
        // Track company field variations
        fieldAnalysis.companyFields.forEach(field => {
          this.results.companyFieldVariations[field.name] = 
            (this.results.companyFieldVariations[field.name] || 0) + 1;
        });
        
        // Track experience data
        if (fieldAnalysis.experienceData.length > 0) {
          this.results.experienceAnalysis.totalPeople = (this.results.experienceAnalysis.totalPeople || 0) + 1;
          this.results.experienceAnalysis.totalExperiences = (this.results.experienceAnalysis.totalExperiences || 0) + fieldAnalysis.experienceData.length;
        }
        
      } else {
        this.results.withoutCompanyData++;
        console.log('   ❌ NO CORESIGNAL DATA FOUND');
        
        this.results.dataStructureAnalysis.push({
          person: person.fullName,
          ourCompany: person.company?.name || 'Unknown',
          fieldAnalysis: { hasCompanyData: false, companyFields: [], experienceData: [] },
          hasCompanyData: false,
          companyFields: [],
          experienceData: []
        });
      }
      
    } catch (error) {
      this.results.withoutCompanyData++;
      console.log(`   ❌ ERROR: ${error.message}`);
      
      this.results.dataStructureAnalysis.push({
        person: person.fullName,
        ourCompany: person.company?.name || 'Unknown',
        fieldAnalysis: { hasCompanyData: false, companyFields: [], experienceData: [] },
        hasCompanyData: false,
        companyFields: [],
        experienceData: []
      });
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
        }
      }
      
      return null;
    } catch (error) {
      console.log(`     Error getting CoreSignal data: ${error.message}`);
      return null;
    }
  }

  analyzeAllFields(coresignalData) {
    const fieldAnalysis = {
      hasCompanyData: false,
      companyFields: [],
      experienceData: [],
      allFields: Object.keys(coresignalData)
    };
    
    // Check for company-related fields
    const companyFields = [
      'active_experience_company',
      'current_company',
      'company',
      'employer',
      'workplace',
      'organization',
      'active_experience_company_name',
      'current_company_name',
      'company_name',
      'employer_name',
      'workplace_name',
      'organization_name'
    ];
    
    companyFields.forEach(field => {
      if (coresignalData[field] && coresignalData[field] !== null && coresignalData[field] !== '') {
        fieldAnalysis.hasCompanyData = true;
        fieldAnalysis.companyFields.push({
          name: field,
          value: coresignalData[field],
          type: typeof coresignalData[field]
        });
      }
    });
    
    // Check for experience data
    if (coresignalData.experience && Array.isArray(coresignalData.experience)) {
      coresignalData.experience.forEach(exp => {
        fieldAnalysis.experienceData.push({
          company: exp.company || exp.company_name || exp.employer || exp.organization,
          title: exp.title || exp.position || exp.job_title,
          startDate: exp.start_date || exp.start,
          endDate: exp.end_date || exp.end,
          isCurrent: exp.is_current || exp.current || exp.active
        });
      });
    }
    
    // Check for other potential company fields
    Object.keys(coresignalData).forEach(field => {
      if (field.toLowerCase().includes('company') || 
          field.toLowerCase().includes('employer') || 
          field.toLowerCase().includes('workplace') || 
          field.toLowerCase().includes('organization')) {
        if (coresignalData[field] && coresignalData[field] !== null && coresignalData[field] !== '') {
          fieldAnalysis.companyFields.push({
            name: field,
            value: coresignalData[field],
            type: typeof coresignalData[field]
          });
        }
      }
    });
    
    return fieldAnalysis;
  }

  generateDataStructureReport() {
    console.log('📊 CORESIGNAL DATA STRUCTURE ANALYSIS REPORT');
    console.log('============================================');
    console.log(`Total People Analyzed: ${this.results.total}`);
    console.log(`With Company Data: ${this.results.withCompanyData} (${Math.round((this.results.withCompanyData / this.results.total) * 100)}%)`);
    console.log(`Without Company Data: ${this.results.withoutCompanyData} (${Math.round((this.results.withoutCompanyData / this.results.total) * 100)}%)`);
    console.log('');
    
    console.log('🔍 FIELD ANALYSIS:');
    console.log('==================');
    Object.entries(this.results.fieldAnalysis)
      .sort((a, b) => b[1] - a[1])
      .forEach(([field, count]) => {
        console.log(`${field}: ${count} occurrences`);
      });
    console.log('');
    
    console.log('🏢 COMPANY FIELD VARIATIONS:');
    console.log('============================');
    Object.entries(this.results.companyFieldVariations)
      .sort((a, b) => b[1] - a[1])
      .forEach(([field, count]) => {
        console.log(`${field}: ${count} occurrences`);
      });
    console.log('');
    
    console.log('📋 EXPERIENCE DATA ANALYSIS:');
    console.log('============================');
    console.log(`People with Experience Data: ${this.results.experienceAnalysis.totalPeople || 0}`);
    console.log(`Total Experiences: ${this.results.experienceAnalysis.totalExperiences || 0}`);
    console.log('');
    
    console.log('📊 DETAILED DATA STRUCTURE ANALYSIS:');
    console.log('====================================');
    this.results.dataStructureAnalysis.forEach((analysis, index) => {
      console.log(`${index + 1}. ${analysis.person}`);
      console.log(`   Our Company: ${analysis.ourCompany}`);
      console.log(`   Has Company Data: ${analysis.hasCompanyData ? '✅' : '❌'}`);
      console.log(`   Company Fields: ${analysis.companyFields.length}`);
      console.log(`   Experience Records: ${analysis.experienceData.length}`);
      
      if (analysis.companyFields.length > 0) {
        console.log('   Company Field Values:');
        analysis.companyFields.forEach(field => {
          console.log(`     ${field.name}: ${field.value} (${field.type})`);
        });
      }
      
      if (analysis.experienceData.length > 0) {
        console.log('   Experience Data:');
        analysis.experienceData.forEach((exp, expIndex) => {
          console.log(`     ${expIndex + 1}. ${exp.company || 'None'} - ${exp.title || 'None'} (${exp.isCurrent ? 'Current' : 'Past'})`);
        });
      }
      console.log('');
    });
    
    console.log('✅ CORESIGNAL DATA STRUCTURE ANALYSIS COMPLETE');
    console.log('==============================================');
    console.log('✅ Comprehensive field analysis completed');
    console.log('✅ Company data availability assessed');
    console.log('✅ Experience data structure analyzed');
    console.log('✅ Field variations documented');
    console.log('✅ Data quality issues identified');
  }
}

// Run deep data structure analysis
async function main() {
  const analyzer = new DeepCoreSignalDataAnalysis();
  await analyzer.analyzeCoreSignalDataStructure();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DeepCoreSignalDataAnalysis;
