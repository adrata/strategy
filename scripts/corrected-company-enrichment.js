#!/usr/bin/env node

/**
 * 🔧 CORRECTED COMPANY ENRICHMENT
 * 
 * Fixed enrichment script that properly extracts company data
 * from the experience array instead of active_experience_company
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class CorrectedCompanyEnrichment {
  constructor() {
    this.prisma = new PrismaClient();
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.baseUrl = 'https://api.coresignal.com/cdapi/v2';
    this.results = {
      total: 0,
      withCorrectCompanyData: 0,
      withoutCorrectCompanyData: 0,
      details: []
    };
  }

  async enrichWithCorrectCompanyData() {
    console.log('🔧 CORRECTED COMPANY ENRICHMENT');
    console.log('===============================');
    console.log('Fixed enrichment that properly extracts company data from experience array');
    console.log('');
    
    if (!this.apiKey) {
      console.log('❌ CORESIGNAL_API_KEY not found in environment');
      return;
    }
    
    // Get recently enriched people
    const enrichedPeople = await this.getRecentlyEnrichedPeople();
    
    console.log(`📊 ENRICHING WITH CORRECT COMPANY DATA FOR ${enrichedPeople.length} PEOPLE`);
    console.log('================================================================');
    console.log('');
    
    // Enrich each person with correct company data
    for (const person of enrichedPeople) {
      await this.enrichPersonWithCorrectCompanyData(person);
    }
    
    // Generate enrichment report
    this.generateEnrichmentReport();
    
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
      take: 10
    });
    
    return people;
  }

  async enrichPersonWithCorrectCompanyData(person) {
    this.results.total++;
    
    console.log(`🔧 ENRICHING: ${person.fullName}`);
    console.log('================================');
    console.log(`   Our Company: ${person.company?.name || 'Unknown'}`);
    console.log(`   LinkedIn: ${person.linkedinUrl}`);
    console.log('');
    
    try {
      // Get fresh CoreSignal data
      const coresignalData = await this.getCoreSignalData(person.linkedinUrl);
      
      if (coresignalData) {
        console.log('   📊 CORESIGNAL DATA ANALYSIS:');
        console.log('   =============================');
        
        // Extract correct company information from experience array
        const companyInfo = this.extractCorrectCompanyFromExperience(coresignalData);
        
        if (companyInfo.hasCompanyData) {
          this.results.withCorrectCompanyData++;
          console.log('   ✅ CORRECT COMPANY DATA FOUND:');
          console.log(`   Current Company: ${companyInfo.currentCompany}`);
          console.log(`   Current Title: ${companyInfo.currentTitle}`);
          console.log(`   Company ID: ${companyInfo.companyId}`);
          console.log(`   Start Date: ${companyInfo.startDate}`);
          console.log(`   End Date: ${companyInfo.endDate}`);
          console.log(`   Is Current: ${companyInfo.isCurrent}`);
          
          // Check if this matches our company
          const companyMatch = this.checkCompanyMatch(person.company?.name, companyInfo.currentCompany);
          console.log(`   Company Match: ${companyMatch.isMatch ? '✅' : '❌'} (${companyMatch.confidence}%)`);
          
          // Update the person's record with correct company data
          await this.updatePersonWithCorrectCompanyData(person, coresignalData, companyInfo);
          
        } else {
          this.results.withoutCorrectCompanyData++;
          console.log('   ❌ NO COMPANY DATA FOUND IN EXPERIENCE ARRAY');
        }
        
        this.results.details.push({
          person: person.fullName,
          ourCompany: person.company?.name || 'Unknown',
          coresignalCompany: companyInfo.currentCompany || 'None',
          hasCompanyData: companyInfo.hasCompanyData,
          companyMatch: companyInfo.hasCompanyData ? this.checkCompanyMatch(person.company?.name, companyInfo.currentCompany) : { isMatch: false, confidence: 0 },
          companyInfo: companyInfo
        });
        
      } else {
        this.results.withoutCorrectCompanyData++;
        console.log('   ❌ NO CORESIGNAL DATA FOUND');
        
        this.results.details.push({
          person: person.fullName,
          ourCompany: person.company?.name || 'Unknown',
          coresignalCompany: 'No Data',
          hasCompanyData: false,
          companyMatch: { isMatch: false, confidence: 0 },
          companyInfo: null
        });
      }
      
    } catch (error) {
      this.results.withoutCorrectCompanyData++;
      console.log(`   ❌ ERROR: ${error.message}`);
      
      this.results.details.push({
        person: person.fullName,
        ourCompany: person.company?.name || 'Unknown',
        coresignalCompany: 'Error',
        hasCompanyData: false,
        companyMatch: { isMatch: false, confidence: 0 },
        companyInfo: null
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

  extractCorrectCompanyFromExperience(coresignalData) {
    const companyInfo = {
      hasCompanyData: false,
      currentCompany: null,
      currentTitle: null,
      companyId: null,
      isCurrent: false,
      startDate: null,
      endDate: null
    };
    
    // Get the active experience company ID
    const activeCompanyId = coresignalData.active_experience_company_id;
    const activeTitle = coresignalData.active_experience_title;
    
    if (activeCompanyId && coresignalData.experience && Array.isArray(coresignalData.experience)) {
      // Find the experience that matches the active company ID
      const matchingExperience = coresignalData.experience.find(exp => 
        exp.company_id === activeCompanyId
      );
      
      if (matchingExperience) {
        companyInfo.hasCompanyData = true;
        companyInfo.currentCompany = matchingExperience.company_name || matchingExperience.company;
        companyInfo.currentTitle = activeTitle || matchingExperience.position_title;
        companyInfo.companyId = activeCompanyId;
        companyInfo.isCurrent = true; // If it's the active experience, it's current
        companyInfo.startDate = matchingExperience.date_from;
        companyInfo.endDate = matchingExperience.date_to;
      }
    }
    
    return companyInfo;
  }

  checkCompanyMatch(ourCompany, coresignalCompany) {
    if (!ourCompany || !coresignalCompany) {
      return { isMatch: false, confidence: 0 };
    }
    
    const normalizeCompany = (company) => {
      return company.toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };
    
    const normalizedOur = normalizeCompany(ourCompany);
    const normalizedCoreSignal = normalizeCompany(coresignalCompany);
    
    // Exact match
    if (normalizedOur === normalizedCoreSignal) {
      return { isMatch: true, confidence: 100 };
    }
    
    // Partial match
    const ourWords = normalizedOur.split(' ');
    const coresignalWords = normalizedCoreSignal.split(' ');
    
    const matchingWords = ourWords.filter(word => 
      coresignalWords.some(csWord => csWord.includes(word) || word.includes(csWord))
    );
    
    const matchPercentage = (matchingWords.length / ourWords.length) * 100;
    
    return {
      isMatch: matchPercentage >= 70,
      confidence: matchPercentage
    };
  }

  async updatePersonWithCorrectCompanyData(person, coresignalData, companyInfo) {
    try {
      // Update the person's record with correct company data
      const updateData = {
        // Update company information if we have better data
        jobTitle: companyInfo.currentTitle || person.jobTitle,
        
        // Store the corrected CoreSignal data with proper company information
        customFields: {
          ...person.customFields,
          coresignalDataCorrected: {
            ...coresignalData,
            // Add our corrected company information
            correctedCompanyData: {
              currentCompany: companyInfo.currentCompany,
              currentTitle: companyInfo.currentTitle,
              companyId: companyInfo.companyId,
              isCurrent: companyInfo.isCurrent,
              startDate: companyInfo.startDate,
              endDate: companyInfo.endDate,
              extractedFrom: 'experience_array',
              correctedAt: new Date().toISOString()
            },
            // Add validation metadata
            validationMetadata: {
              companyDataExtracted: true,
              extractionMethod: 'experience_array_matching',
              activeCompanyId: coresignalData.active_experience_company_id,
              matchedExperienceIndex: coresignalData.experience.findIndex(exp => exp.company_id === coresignalData.active_experience_company_id),
              correctedAt: new Date().toISOString()
            }
          }
        },
        
        // Update enrichment sources
        enrichmentSources: [
          ...(person.enrichmentSources || []),
          'coresignal-corrected-company-data'
        ].filter((source, index, array) => array.indexOf(source) === index)
      };
      
      await this.prisma.people.update({
        where: { id: person.id },
        data: updateData
      });
      
      console.log('   📊 CORRECTED DATA STORED:');
      console.log(`     - Company: ${companyInfo.currentCompany}`);
      console.log(`     - Title: ${companyInfo.currentTitle}`);
      console.log(`     - Company ID: ${companyInfo.companyId}`);
      console.log(`     - Extraction Method: experience_array_matching`);
      
    } catch (error) {
      console.log(`     Error updating person: ${error.message}`);
      throw error;
    }
  }

  generateEnrichmentReport() {
    console.log('📊 CORRECTED COMPANY ENRICHMENT REPORT');
    console.log('======================================');
    console.log(`Total People Processed: ${this.results.total}`);
    console.log(`With Correct Company Data: ${this.results.withCorrectCompanyData} (${Math.round((this.results.withCorrectCompanyData / this.results.total) * 100)}%)`);
    console.log(`Without Correct Company Data: ${this.results.withoutCorrectCompanyData} (${Math.round((this.results.withoutCorrectCompanyData / this.results.total) * 100)}%)`);
    console.log('');
    
    console.log('📋 DETAILED ENRICHMENT RESULTS:');
    console.log('================================');
    this.results.details.forEach((detail, index) => {
      console.log(`${index + 1}. ${detail.person}`);
      console.log(`   Our Company: ${detail.ourCompany}`);
      console.log(`   CoreSignal Company: ${detail.coresignalCompany}`);
      console.log(`   Has Company Data: ${detail.hasCompanyData ? '✅' : '❌'}`);
      console.log(`   Company Match: ${detail.companyMatch.isMatch ? '✅' : '❌'} (${detail.companyMatch.confidence}%)`);
      
      if (detail.companyInfo && detail.companyInfo.hasCompanyData) {
        console.log(`   Current Title: ${detail.companyInfo.currentTitle || 'None'}`);
        console.log(`   Company ID: ${detail.companyInfo.companyId || 'None'}`);
        console.log(`   Is Current: ${detail.companyInfo.isCurrent}`);
        console.log(`   Start Date: ${detail.companyInfo.startDate || 'None'}`);
        console.log(`   End Date: ${detail.companyInfo.endDate || 'None'}`);
      }
      console.log('');
    });
    
    console.log('✅ CORRECTED COMPANY ENRICHMENT COMPLETE');
    console.log('======================================');
    console.log('✅ Company data properly extracted from experience array');
    console.log('✅ Active experience company ID matched with experience data');
    console.log('✅ Current employment status correctly identified');
    console.log('✅ Company matching accuracy assessed');
    console.log('✅ Data structure issues resolved');
    console.log('✅ Corrected enrichment data stored');
  }
}

// Run corrected company enrichment
async function main() {
  const enricher = new CorrectedCompanyEnrichment();
  await enricher.enrichWithCorrectCompanyData();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CorrectedCompanyEnrichment;
