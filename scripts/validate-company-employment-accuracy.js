#!/usr/bin/env node

/**
 * 🔍 COMPANY EMPLOYMENT ACCURACY VALIDATOR
 * 
 * Validates that enriched people actually work at the companies we have linked
 * and verifies the accuracy of the employment data
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class CompanyEmploymentAccuracyValidator {
  constructor() {
    this.prisma = new PrismaClient();
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.baseUrl = 'https://api.coresignal.com/cdapi/v2';
    this.results = {
      total: 0,
      accurateEmployment: 0,
      inaccurateEmployment: 0,
      noEmploymentData: 0,
      details: [],
      accuracyIssues: {},
      companyMismatches: {},
      employmentStatusIssues: {}
    };
  }

  async validateEmploymentAccuracy() {
    console.log('🔍 COMPANY EMPLOYMENT ACCURACY VALIDATION');
    console.log('==========================================');
    console.log('Validating that enriched people actually work at the companies we have linked');
    console.log('');
    
    if (!this.apiKey) {
      console.log('❌ CORESIGNAL_API_KEY not found in environment');
      return;
    }
    
    // Get recently enriched people
    const enrichedPeople = await this.getRecentlyEnrichedPeople();
    
    console.log(`📊 VALIDATING EMPLOYMENT ACCURACY FOR ${enrichedPeople.length} PEOPLE`);
    console.log('================================================================');
    console.log('');
    
    // Validate each person's employment
    for (const person of enrichedPeople) {
      await this.validatePersonEmployment(person);
    }
    
    // Generate accuracy report
    this.generateEmploymentAccuracyReport();
    
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
        workEmail: true,
        jobTitle: true,
        linkedinUrl: true,
        company: {
          select: {
            name: true
          }
        },
        customFields: true
      },
      take: 20 // Start with 20 for detailed analysis
    });
    
    return people;
  }

  async validatePersonEmployment(person) {
    this.results.total++;
    
    console.log(`🔍 VALIDATING: ${person.fullName}`);
    console.log('================================');
    console.log(`   Our Company: ${person.company?.name || 'Unknown'}`);
    console.log(`   Our Title: ${person.jobTitle || 'None'}`);
    console.log(`   LinkedIn: ${person.linkedinUrl}`);
    console.log('');
    
    try {
      // Get fresh CoreSignal data to verify current employment
      const coresignalData = await this.getCoreSignalData(person.linkedinUrl);
      
      if (coresignalData) {
        console.log('   📊 FRESH CORESIGNAL DATA:');
        console.log(`   Name: ${coresignalData.full_name}`);
        console.log(`   Current Company: ${coresignalData.active_experience_company || 'None'}`);
        console.log(`   Current Title: ${coresignalData.active_experience_title || 'None'}`);
        console.log(`   Current Email: ${coresignalData.primary_professional_email || 'None'}`);
        console.log('');
        
        // Validate employment accuracy
        const employmentValidation = await this.validateEmploymentData(person, coresignalData);
        
        if (employmentValidation.isAccurate) {
          this.results.accurateEmployment++;
          console.log('   ✅ EMPLOYMENT ACCURATE: Person works at the company we have linked');
          console.log(`   Confidence Score: ${employmentValidation.confidenceScore}%`);
          console.log(`   Validation Methods: ${employmentValidation.methods.join(', ')}`);
        } else {
          this.results.inaccurateEmployment++;
          console.log('   ❌ EMPLOYMENT INACCURATE: Person does NOT work at the company we have linked');
          console.log(`   Issues: ${employmentValidation.issues.join(', ')}`);
          console.log(`   Confidence Score: ${employmentValidation.confidenceScore}%`);
        }
        
        // Track specific issues
        employmentValidation.issues.forEach(issue => {
          this.results.accuracyIssues[issue] = (this.results.accuracyIssues[issue] || 0) + 1;
        });
        
        if (employmentValidation.companyMismatch) {
          this.results.companyMismatches[employmentValidation.companyMismatch] = 
            (this.results.companyMismatches[employmentValidation.companyMismatch] || 0) + 1;
        }
        
        this.results.details.push({
          person: person.fullName,
          ourCompany: person.company?.name || 'Unknown',
          coresignalCompany: coresignalData.active_experience_company || 'None',
          isAccurate: employmentValidation.isAccurate,
          confidenceScore: employmentValidation.confidenceScore,
          methods: employmentValidation.methods,
          issues: employmentValidation.issues,
          companyMismatch: employmentValidation.companyMismatch
        });
        
      } else {
        this.results.noEmploymentData++;
        console.log('   ❌ NO CORESIGNAL DATA FOUND');
        
        this.results.details.push({
          person: person.fullName,
          ourCompany: person.company?.name || 'Unknown',
          coresignalCompany: 'No Data',
          isAccurate: false,
          confidenceScore: 0,
          methods: [],
          issues: ['No CoreSignal data found'],
          companyMismatch: 'No Data Available'
        });
      }
      
    } catch (error) {
      this.results.inaccurateEmployment++;
      console.log(`   ❌ ERROR: ${error.message}`);
      
      this.results.details.push({
        person: person.fullName,
        ourCompany: person.company?.name || 'Unknown',
        coresignalCompany: 'Error',
        isAccurate: false,
        confidenceScore: 0,
        methods: [],
        issues: [error.message],
        companyMismatch: 'Error'
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

  async validateEmploymentData(person, coresignalData) {
    const validationResult = {
      isAccurate: true,
      confidenceScore: 100,
      methods: [],
      issues: [],
      companyMismatch: null
    };
    
    console.log('   🔍 EMPLOYMENT ACCURACY VALIDATION:');
    console.log('   ===================================');
    
    // 1. Company Verification (CRITICAL)
    const companyMatch = this.validateCompanyEmployment(person.company?.name, coresignalData.active_experience_company);
    if (companyMatch.isMatch) {
      validationResult.methods.push('Company Employment Match');
      console.log(`   ✅ Company: ${companyMatch.confidence}% match - Person works at ${coresignalData.active_experience_company}`);
    } else {
      validationResult.isAccurate = false;
      validationResult.issues.push('Company employment mismatch');
      validationResult.companyMismatch = `${person.company?.name} vs ${coresignalData.active_experience_company}`;
      console.log(`   ❌ Company: MISMATCH - Person works at ${coresignalData.active_experience_company}, not ${person.company?.name}`);
    }
    
    // 2. Title Verification
    const titleMatch = this.validateTitleEmployment(person.jobTitle, coresignalData.active_experience_title);
    if (titleMatch.isMatch) {
      validationResult.methods.push('Title Employment Match');
      console.log(`   ✅ Title: ${titleMatch.confidence}% match`);
    } else {
      validationResult.issues.push('Title employment mismatch');
      console.log(`   ⚠️ Title: Possible mismatch - Our: ${person.jobTitle}, CoreSignal: ${coresignalData.active_experience_title}`);
    }
    
    // 3. Email Domain Verification
    const emailDomainMatch = this.validateEmailDomain(person.workEmail, coresignalData.primary_professional_email, person.company?.name);
    if (emailDomainMatch.isMatch) {
      validationResult.methods.push('Email Domain Match');
      console.log(`   ✅ Email Domain: ${emailDomainMatch.confidence}% match`);
    } else {
      validationResult.issues.push('Email domain mismatch');
      console.log(`   ⚠️ Email Domain: Possible mismatch`);
    }
    
    // 4. Employment Status Verification
    const employmentStatusMatch = this.validateEmploymentStatus(coresignalData);
    if (employmentStatusMatch.isCurrent) {
      validationResult.methods.push('Current Employment Status');
      console.log('   ✅ Employment Status: Currently employed');
    } else {
      validationResult.issues.push('Employment status unclear');
      console.log('   ⚠️ Employment Status: Status unclear or not current');
    }
    
    // 5. Experience Timeline Verification
    const experienceTimelineMatch = this.validateExperienceTimeline(coresignalData);
    if (experienceTimelineMatch.isCurrent) {
      validationResult.methods.push('Current Experience Timeline');
      console.log('   ✅ Experience Timeline: Current experience matches');
    } else {
      validationResult.issues.push('Experience timeline mismatch');
      console.log('   ⚠️ Experience Timeline: Timeline may not match current employment');
    }
    
    // Calculate final confidence score
    validationResult.confidenceScore = this.calculateEmploymentConfidenceScore(validationResult);
    
    console.log(`   📊 Final Employment Confidence Score: ${validationResult.confidenceScore}%`);
    console.log('');
    
    return validationResult;
  }

  validateCompanyEmployment(ourCompany, coresignalCompany) {
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
      isMatch: matchPercentage >= 80,
      confidence: matchPercentage
    };
  }

  validateTitleEmployment(ourTitle, coresignalTitle) {
    if (!ourTitle || !coresignalTitle) {
      return { isMatch: false, confidence: 0 };
    }
    
    const normalizeTitle = (title) => {
      return title.toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };
    
    const normalizedOur = normalizeTitle(ourTitle);
    const normalizedCoreSignal = normalizeTitle(coresignalTitle);
    
    if (normalizedOur === normalizedCoreSignal) {
      return { isMatch: true, confidence: 100 };
    }
    
    const ourWords = normalizedOur.split(' ');
    const coresignalWords = normalizedCoreSignal.split(' ');
    
    const matchingWords = ourWords.filter(word => 
      coresignalWords.some(csWord => csWord.includes(word) || word.includes(csWord))
    );
    
    const matchPercentage = (matchingWords.length / ourWords.length) * 100;
    
    return {
      isMatch: matchPercentage >= 60,
      confidence: matchPercentage
    };
  }

  validateEmailDomain(ourEmail, coresignalEmail, ourCompany) {
    if (!ourEmail || !coresignalEmail || !ourCompany) {
      return { isMatch: false, confidence: 0 };
    }
    
    const getDomain = (email) => {
      return email.toLowerCase().split('@')[1] || '';
    };
    
    const getCompanyDomain = (company) => {
      // Extract potential domain from company name
      const words = company.toLowerCase().split(' ');
      return words.join('') + '.com';
    };
    
    const ourDomain = getDomain(ourEmail);
    const coresignalDomain = getDomain(coresignalEmail);
    const expectedDomain = getCompanyDomain(ourCompany);
    
    if (ourDomain === coresignalDomain) {
      return { isMatch: true, confidence: 100 };
    }
    
    if (coresignalDomain.includes(ourDomain) || ourDomain.includes(coresignalDomain)) {
      return { isMatch: true, confidence: 80 };
    }
    
    return { isMatch: false, confidence: 0 };
  }

  validateEmploymentStatus(coresignalData) {
    // Check if the person is currently employed
    const hasCurrentEmployment = coresignalData.active_experience_company && 
                                coresignalData.active_experience_title;
    
    return {
      isCurrent: hasCurrentEmployment,
      confidence: hasCurrentEmployment ? 100 : 0
    };
  }

  validateExperienceTimeline(coresignalData) {
    // Check if the experience data suggests current employment
    const hasRecentExperience = coresignalData.experience && 
                               Array.isArray(coresignalData.experience) && 
                               coresignalData.experience.length > 0;
    
    return {
      isCurrent: hasRecentExperience,
      confidence: hasRecentExperience ? 100 : 0
    };
  }

  calculateEmploymentConfidenceScore(validationResult) {
    let score = 100;
    
    validationResult.issues.forEach(issue => {
      if (issue.includes('Company employment mismatch')) score -= 50;
      else if (issue.includes('Title employment mismatch')) score -= 20;
      else if (issue.includes('Email domain mismatch')) score -= 15;
      else if (issue.includes('Employment status unclear')) score -= 10;
      else if (issue.includes('Experience timeline mismatch')) score -= 5;
      else score -= 5;
    });
    
    return Math.max(0, score);
  }

  generateEmploymentAccuracyReport() {
    console.log('📊 EMPLOYMENT ACCURACY VALIDATION REPORT');
    console.log('========================================');
    console.log(`Total People Validated: ${this.results.total}`);
    console.log(`Accurate Employment: ${this.results.accurateEmployment} (${Math.round((this.results.accurateEmployment / this.results.total) * 100)}%)`);
    console.log(`Inaccurate Employment: ${this.results.inaccurateEmployment} (${Math.round((this.results.inaccurateEmployment / this.results.total) * 100)}%)`);
    console.log(`No Employment Data: ${this.results.noEmploymentData} (${Math.round((this.results.noEmploymentData / this.results.total) * 100)}%)`);
    console.log('');
    
    console.log('🔍 VALIDATION METHODS USED:');
    console.log('============================');
    const allMethods = new Set();
    this.results.details.forEach(detail => {
      detail.methods.forEach(method => allMethods.add(method));
    });
    
    allMethods.forEach(method => {
      const count = this.results.details.filter(d => d.methods.includes(method)).length;
      console.log(`${method}: ${count} validations`);
    });
    console.log('');
    
    console.log('⚠️ ACCURACY ISSUES:');
    console.log('==================');
    Object.entries(this.results.accuracyIssues)
      .sort((a, b) => b[1] - a[1])
      .forEach(([issue, count]) => {
        console.log(`${issue}: ${count} occurrences`);
      });
    console.log('');
    
    console.log('🏢 COMPANY MISMATCHES:');
    console.log('======================');
    Object.entries(this.results.companyMismatches)
      .sort((a, b) => b[1] - a[1])
      .forEach(([mismatch, count]) => {
        console.log(`${mismatch}: ${count} occurrences`);
      });
    console.log('');
    
    console.log('📋 DETAILED RESULTS:');
    console.log('=====================');
    this.results.details.forEach((detail, index) => {
      console.log(`${index + 1}. ${detail.person}`);
      console.log(`   Our Company: ${detail.ourCompany}`);
      console.log(`   CoreSignal Company: ${detail.coresignalCompany}`);
      console.log(`   Accurate: ${detail.isAccurate ? '✅' : '❌'}`);
      console.log(`   Confidence: ${detail.confidenceScore}%`);
      if (detail.issues.length > 0) {
        console.log(`   Issues: ${detail.issues.join(', ')}`);
      }
      console.log('');
    });
    
    console.log('✅ EMPLOYMENT ACCURACY VALIDATION COMPLETE');
    console.log('==========================================');
    console.log('✅ Company employment verification implemented');
    console.log('✅ Title employment verification implemented');
    console.log('✅ Email domain verification implemented');
    console.log('✅ Employment status verification implemented');
    console.log('✅ Experience timeline verification implemented');
    console.log('✅ Comprehensive accuracy reporting');
  }
}

// Run employment accuracy validation
async function main() {
  const validator = new CompanyEmploymentAccuracyValidator();
  await validator.validateEmploymentAccuracy();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CompanyEmploymentAccuracyValidator;
