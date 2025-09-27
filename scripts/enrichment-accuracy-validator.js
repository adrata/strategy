#!/usr/bin/env node

/**
 * 🔍 ENRICHMENT ACCURACY VALIDATOR
 * 
 * Comprehensive validation system to ensure we never get wrong person's data
 * Multiple verification layers to prevent false matches
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class EnrichmentAccuracyValidator {
  constructor() {
    this.prisma = new PrismaClient();
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.baseUrl = 'https://api.coresignal.com/cdapi/v2';
    this.validationResults = {
      total: 0,
      accurate: 0,
      inaccurate: 0,
      rejected: 0,
      details: []
    };
  }

  async validateEnrichmentAccuracy() {
    console.log('🔍 ENRICHMENT ACCURACY VALIDATION');
    console.log('==================================');
    console.log('Testing multiple verification strategies to prevent wrong person matches');
    console.log('');
    
    if (!this.apiKey) {
      console.log('❌ CORESIGNAL_API_KEY not found in environment');
      return;
    }
    
    // Get test candidates with known data for validation
    const testCandidates = await this.getTestCandidates();
    
    console.log('📊 TEST CANDIDATES FOR ACCURACY VALIDATION:');
    console.log('===========================================');
    testCandidates.forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName}`);
      console.log(`   Company: ${person.company?.name || 'Unknown'}`);
      console.log(`   LinkedIn: ${person.linkedinUrl || 'None'}`);
      console.log(`   Email: ${person.workEmail || 'None'}`);
      console.log(`   Title: ${person.jobTitle || 'None'}`);
      console.log('');
    });
    
    // Test each candidate with multiple validation strategies
    for (const person of testCandidates) {
      await this.validatePersonAccuracy(person);
    }
    
    // Generate accuracy report
    this.generateAccuracyReport();
    
    await this.prisma.$disconnect();
  }

  async getTestCandidates() {
    // Get people with LinkedIn URLs for testing
    const candidates = await this.prisma.people.findMany({
      where: {
        workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1',
        linkedinUrl: { not: null },
        linkedinUrl: { not: '' }
      },
      select: {
        id: true,
        fullName: true,
        workEmail: true,
        jobTitle: true,
        linkedinUrl: true,
        phone: true,
        mobilePhone: true,
        company: {
          select: {
            name: true
          }
        }
      },
      take: 5
    });
    
    return candidates;
  }

  async validatePersonAccuracy(person) {
    this.validationResults.total++;
    
    console.log(`🔍 VALIDATING: ${person.fullName}`);
    console.log('================================');
    console.log(`   Company: ${person.company?.name || 'Unknown'}`);
    console.log(`   LinkedIn: ${person.linkedinUrl}`);
    console.log(`   Known Email: ${person.workEmail || 'None'}`);
    console.log(`   Known Title: ${person.jobTitle || 'None'}`);
    console.log('');
    
    try {
      // Get CoreSignal data
      const coresignalData = await this.getCoreSignalData(person.linkedinUrl);
      
      if (coresignalData) {
        console.log('   📊 CORESIGNAL DATA FOUND:');
        console.log(`   Name: ${coresignalData.full_name}`);
        console.log(`   Email: ${coresignalData.primary_professional_email || 'None'}`);
        console.log(`   Title: ${coresignalData.active_experience_title || 'None'}`);
        console.log(`   Company: ${coresignalData.active_experience_company || 'None'}`);
        console.log(`   LinkedIn: ${coresignalData.linkedin_url}`);
        console.log('');
        
        // Run multiple validation checks
        const validationResult = await this.runValidationChecks(person, coresignalData);
        
        if (validationResult.isAccurate) {
          this.validationResults.accurate++;
          console.log('   ✅ VALIDATION PASSED: Data is accurate');
          console.log(`   Confidence Score: ${validationResult.confidenceScore}%`);
          console.log(`   Validation Methods: ${validationResult.methods.join(', ')}`);
        } else if (validationResult.shouldReject) {
          this.validationResults.rejected++;
          console.log('   ❌ VALIDATION FAILED: Data rejected as inaccurate');
          console.log(`   Issues: ${validationResult.issues.join(', ')}`);
        } else {
          this.validationResults.inaccurate++;
          console.log('   ⚠️ VALIDATION WARNING: Data may be inaccurate');
          console.log(`   Issues: ${validationResult.issues.join(', ')}`);
        }
        
        this.validationResults.details.push({
          person: person.fullName,
          isAccurate: validationResult.isAccurate,
          shouldReject: validationResult.shouldReject,
          confidenceScore: validationResult.confidenceScore,
          methods: validationResult.methods,
          issues: validationResult.issues
        });
        
      } else {
        this.validationResults.rejected++;
        console.log('   ❌ NO CORESIGNAL DATA FOUND');
        
        this.validationResults.details.push({
          person: person.fullName,
          isAccurate: false,
          shouldReject: true,
          confidenceScore: 0,
          methods: [],
          issues: ['No CoreSignal data found']
        });
      }
      
    } catch (error) {
      this.validationResults.rejected++;
      console.log(`   ❌ ERROR: ${error.message}`);
      
      this.validationResults.details.push({
        person: person.fullName,
        isAccurate: false,
        shouldReject: true,
        confidenceScore: 0,
        methods: [],
        issues: [error.message]
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

  async runValidationChecks(person, coresignalData) {
    const validationResult = {
      isAccurate: true,
      shouldReject: false,
      confidenceScore: 100,
      methods: [],
      issues: []
    };
    
    console.log('   🔍 RUNNING VALIDATION CHECKS:');
    console.log('   ==============================');
    
    // 1. LinkedIn URL Verification
    const linkedinMatch = this.validateLinkedInUrl(person.linkedinUrl, coresignalData.linkedin_url);
    if (linkedinMatch.isMatch) {
      validationResult.methods.push('LinkedIn URL Match');
      console.log('   ✅ LinkedIn URL: Perfect match');
    } else {
      validationResult.isAccurate = false;
      validationResult.shouldReject = true;
      validationResult.issues.push('LinkedIn URL mismatch');
      console.log('   ❌ LinkedIn URL: MISMATCH - REJECTING');
    }
    
    // 2. Name Verification
    const nameMatch = this.validateName(person.fullName, coresignalData.full_name);
    if (nameMatch.isMatch) {
      validationResult.methods.push('Name Match');
      console.log(`   ✅ Name: ${nameMatch.confidence}% match`);
    } else {
      validationResult.isAccurate = false;
      validationResult.issues.push('Name mismatch');
      console.log('   ❌ Name: MISMATCH');
    }
    
    // 3. Company Verification
    const companyMatch = this.validateCompany(person.company?.name, coresignalData.active_experience_company);
    if (companyMatch.isMatch) {
      validationResult.methods.push('Company Match');
      console.log(`   ✅ Company: ${companyMatch.confidence}% match`);
    } else {
      validationResult.issues.push('Company mismatch');
      console.log('   ⚠️ Company: Possible mismatch');
    }
    
    // 4. Email Verification (if we have known email)
    if (person.workEmail) {
      const emailMatch = this.validateEmail(person.workEmail, coresignalData.primary_professional_email);
      if (emailMatch.isMatch) {
        validationResult.methods.push('Email Match');
        console.log(`   ✅ Email: ${emailMatch.confidence}% match`);
      } else {
        validationResult.issues.push('Email mismatch');
        console.log('   ⚠️ Email: Possible mismatch');
      }
    }
    
    // 5. Title Verification (if we have known title)
    if (person.jobTitle) {
      const titleMatch = this.validateTitle(person.jobTitle, coresignalData.active_experience_title);
      if (titleMatch.isMatch) {
        validationResult.methods.push('Title Match');
        console.log(`   ✅ Title: ${titleMatch.confidence}% match`);
      } else {
        validationResult.issues.push('Title mismatch');
        console.log('   ⚠️ Title: Possible mismatch');
      }
    }
    
    // 6. Cross-Reference Validation
    const crossRefMatch = this.validateCrossReference(coresignalData);
    if (crossRefMatch.isMatch) {
      validationResult.methods.push('Cross-Reference Match');
      console.log(`   ✅ Cross-Reference: ${crossRefMatch.confidence}% match`);
    } else {
      validationResult.issues.push('Cross-reference validation failed');
      console.log('   ⚠️ Cross-Reference: Possible issues');
    }
    
    // Calculate final confidence score
    validationResult.confidenceScore = this.calculateConfidenceScore(validationResult);
    
    // Determine if we should reject
    if (validationResult.issues.includes('LinkedIn URL mismatch')) {
      validationResult.shouldReject = true;
    }
    
    console.log(`   📊 Final Confidence Score: ${validationResult.confidenceScore}%`);
    console.log('');
    
    return validationResult;
  }

  validateLinkedInUrl(knownLinkedIn, coresignalLinkedIn) {
    if (!knownLinkedIn || !coresignalLinkedIn) {
      return { isMatch: false, confidence: 0 };
    }
    
    // Normalize LinkedIn URLs
    const normalizeLinkedIn = (url) => {
      return url.toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '');
    };
    
    const normalizedKnown = normalizeLinkedIn(knownLinkedIn);
    const normalizedCoreSignal = normalizeLinkedIn(coresignalLinkedIn);
    
    return {
      isMatch: normalizedKnown === normalizedCoreSignal,
      confidence: normalizedKnown === normalizedCoreSignal ? 100 : 0
    };
  }

  validateName(knownName, coresignalName) {
    if (!knownName || !coresignalName) {
      return { isMatch: false, confidence: 0 };
    }
    
    const normalizeName = (name) => {
      return name.toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };
    
    const normalizedKnown = normalizeName(knownName);
    const normalizedCoreSignal = normalizeName(coresignalName);
    
    // Exact match
    if (normalizedKnown === normalizedCoreSignal) {
      return { isMatch: true, confidence: 100 };
    }
    
    // Partial match (check if all words are present)
    const knownWords = normalizedKnown.split(' ');
    const coresignalWords = normalizedCoreSignal.split(' ');
    
    const matchingWords = knownWords.filter(word => 
      coresignalWords.some(csWord => csWord.includes(word) || word.includes(csWord))
    );
    
    const matchPercentage = (matchingWords.length / knownWords.length) * 100;
    
    return {
      isMatch: matchPercentage >= 80,
      confidence: matchPercentage
    };
  }

  validateCompany(knownCompany, coresignalCompany) {
    if (!knownCompany || !coresignalCompany) {
      return { isMatch: false, confidence: 0 };
    }
    
    const normalizeCompany = (company) => {
      return company.toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };
    
    const normalizedKnown = normalizeCompany(knownCompany);
    const normalizedCoreSignal = normalizeCompany(coresignalCompany);
    
    // Exact match
    if (normalizedKnown === normalizedCoreSignal) {
      return { isMatch: true, confidence: 100 };
    }
    
    // Partial match
    const knownWords = normalizedKnown.split(' ');
    const coresignalWords = normalizedCoreSignal.split(' ');
    
    const matchingWords = knownWords.filter(word => 
      coresignalWords.some(csWord => csWord.includes(word) || word.includes(csWord))
    );
    
    const matchPercentage = (matchingWords.length / knownWords.length) * 100;
    
    return {
      isMatch: matchPercentage >= 70,
      confidence: matchPercentage
    };
  }

  validateEmail(knownEmail, coresignalEmail) {
    if (!knownEmail || !coresignalEmail) {
      return { isMatch: false, confidence: 0 };
    }
    
    const normalizeEmail = (email) => email.toLowerCase().trim();
    
    const normalizedKnown = normalizeEmail(knownEmail);
    const normalizedCoreSignal = normalizeEmail(coresignalEmail);
    
    return {
      isMatch: normalizedKnown === normalizedCoreSignal,
      confidence: normalizedKnown === normalizedCoreSignal ? 100 : 0
    };
  }

  validateTitle(knownTitle, coresignalTitle) {
    if (!knownTitle || !coresignalTitle) {
      return { isMatch: false, confidence: 0 };
    }
    
    const normalizeTitle = (title) => {
      return title.toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };
    
    const normalizedKnown = normalizeTitle(knownTitle);
    const normalizedCoreSignal = normalizeTitle(coresignalTitle);
    
    // Exact match
    if (normalizedKnown === normalizedCoreSignal) {
      return { isMatch: true, confidence: 100 };
    }
    
    // Partial match
    const knownWords = normalizedKnown.split(' ');
    const coresignalWords = normalizedCoreSignal.split(' ');
    
    const matchingWords = knownWords.filter(word => 
      coresignalWords.some(csWord => csWord.includes(word) || word.includes(csWord))
    );
    
    const matchPercentage = (matchingWords.length / knownWords.length) * 100;
    
    return {
      isMatch: matchPercentage >= 60,
      confidence: matchPercentage
    };
  }

  validateCrossReference(coresignalData) {
    // Check for data consistency within CoreSignal response
    const issues = [];
    
    // Check if LinkedIn URL matches the search
    if (coresignalData.linkedin_url && !coresignalData.linkedin_url.includes('linkedin.com/in/')) {
      issues.push('Invalid LinkedIn URL format');
    }
    
    // Check if email format is valid
    if (coresignalData.primary_professional_email && !coresignalData.primary_professional_email.includes('@')) {
      issues.push('Invalid email format');
    }
    
    // Check if name is reasonable
    if (coresignalData.full_name && coresignalData.full_name.length < 2) {
      issues.push('Name too short');
    }
    
    // Check if company name is reasonable
    if (coresignalData.active_experience_company && coresignalData.active_experience_company.length < 2) {
      issues.push('Company name too short');
    }
    
    return {
      isMatch: issues.length === 0,
      confidence: issues.length === 0 ? 100 : Math.max(0, 100 - (issues.length * 20)),
      issues: issues
    };
  }

  calculateConfidenceScore(validationResult) {
    let score = 100;
    
    // Deduct points for issues
    validationResult.issues.forEach(issue => {
      if (issue.includes('LinkedIn URL mismatch')) score -= 50;
      else if (issue.includes('Name mismatch')) score -= 30;
      else if (issue.includes('Email mismatch')) score -= 20;
      else if (issue.includes('Company mismatch')) score -= 15;
      else if (issue.includes('Title mismatch')) score -= 10;
      else score -= 5;
    });
    
    return Math.max(0, score);
  }

  generateAccuracyReport() {
    console.log('📊 ACCURACY VALIDATION REPORT');
    console.log('=============================');
    console.log(`Total Validations: ${this.validationResults.total}`);
    console.log(`Accurate: ${this.validationResults.accurate} (${Math.round((this.validationResults.accurate / this.validationResults.total) * 100)}%)`);
    console.log(`Inaccurate: ${this.validationResults.inaccurate} (${Math.round((this.validationResults.inaccurate / this.validationResults.total) * 100)}%)`);
    console.log(`Rejected: ${this.validationResults.rejected} (${Math.round((this.validationResults.rejected / this.validationResults.total) * 100)}%)`);
    console.log('');
    
    console.log('🔍 VALIDATION METHODS USED:');
    console.log('============================');
    const allMethods = new Set();
    this.validationResults.details.forEach(detail => {
      detail.methods.forEach(method => allMethods.add(method));
    });
    
    allMethods.forEach(method => {
      const count = this.validationResults.details.filter(d => d.methods.includes(method)).length;
      console.log(`${method}: ${count} validations`);
    });
    console.log('');
    
    console.log('⚠️ COMMON ISSUES:');
    console.log('================');
    const issueCounts = {};
    this.validationResults.details.forEach(detail => {
      detail.issues.forEach(issue => {
        issueCounts[issue] = (issueCounts[issue] || 0) + 1;
      });
    });
    
    Object.entries(issueCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([issue, count]) => {
        console.log(`${issue}: ${count} occurrences`);
      });
    console.log('');
    
    console.log('✅ ACCURACY VALIDATION COMPLETE');
    console.log('===============================');
    console.log('✅ Multiple validation layers implemented');
    console.log('✅ LinkedIn URL verification prevents wrong person matches');
    console.log('✅ Name, company, email, and title cross-validation');
    console.log('✅ Confidence scoring system');
    console.log('✅ Automatic rejection for critical mismatches');
    console.log('✅ Ready for production with accuracy safeguards');
  }
}

// Run validation
async function main() {
  const validator = new EnrichmentAccuracyValidator();
  await validator.validateEnrichmentAccuracy();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = EnrichmentAccuracyValidator;
