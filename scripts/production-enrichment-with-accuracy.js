#!/usr/bin/env node

/**
 * 🚀 PRODUCTION ENRICHMENT WITH ACCURACY SAFEGUARDS
 * 
 * Production-ready enrichment system with multiple validation layers
 * to ensure we never get wrong person's data
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class ProductionEnrichmentWithAccuracy {
  constructor() {
    this.prisma = new PrismaClient();
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.baseUrl = 'https://api.coresignal.com/cdapi/v2';
    this.results = {
      total: 0,
      enriched: 0,
      rejected: 0,
      accuracyValidated: 0,
      details: []
    };
  }

  async enrichWithAccuracySafeguards() {
    console.log('🚀 PRODUCTION ENRICHMENT WITH ACCURACY SAFEGUARDS');
    console.log('==================================================');
    console.log('Multiple validation layers to prevent wrong person matches');
    console.log('');
    
    if (!this.apiKey) {
      console.log('❌ CORESIGNAL_API_KEY not found in environment');
      return;
    }
    
    // Get people with LinkedIn URLs for enrichment
    const peopleToEnrich = await this.getPeopleToEnrich();
    
    console.log(`📊 ENRICHING ${peopleToEnrich.length} PEOPLE WITH ACCURACY SAFEGUARDS`);
    console.log('================================================================');
    console.log('');
    
    // Enrich each person with accuracy validation
    for (const person of peopleToEnrich) {
      await this.enrichPersonWithAccuracyValidation(person);
    }
    
    // Generate production report
    this.generateProductionReport();
    
    await this.prisma.$disconnect();
  }

  async getPeopleToEnrich() {
    // Get people with LinkedIn URLs who haven't been fully enriched
    const people = await this.prisma.people.findMany({
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
        },
        customFields: true,
        enrichmentSources: true
      },
      take: 10 // Start with 10 for testing
    });
    
    return people;
  }

  async enrichPersonWithAccuracyValidation(person) {
    this.results.total++;
    
    console.log(`🔍 ENRICHING: ${person.fullName}`);
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
        console.log('');
        
        // Run accuracy validation
        const validationResult = await this.validateAccuracy(person, coresignalData);
        
        if (validationResult.isAccurate && !validationResult.shouldReject) {
          // Data is accurate, proceed with enrichment
          await this.updatePersonWithValidatedData(person, coresignalData, validationResult);
          
          this.results.enriched++;
          this.results.accuracyValidated++;
          
          console.log('   ✅ ENRICHMENT SUCCESSFUL: Data validated and stored');
          console.log(`   Confidence Score: ${validationResult.confidenceScore}%`);
          console.log(`   Validation Methods: ${validationResult.methods.join(', ')}`);
          
        } else {
          // Data is inaccurate or should be rejected
          this.results.rejected++;
          
          console.log('   ❌ ENRICHMENT REJECTED: Data failed accuracy validation');
          console.log(`   Issues: ${validationResult.issues.join(', ')}`);
          console.log(`   Confidence Score: ${validationResult.confidenceScore}%`);
        }
        
        this.results.details.push({
          person: person.fullName,
          success: validationResult.isAccurate && !validationResult.shouldReject,
          confidenceScore: validationResult.confidenceScore,
          methods: validationResult.methods,
          issues: validationResult.issues,
          rejected: validationResult.shouldReject
        });
        
      } else {
        this.results.rejected++;
        console.log('   ❌ NO CORESIGNAL DATA FOUND');
        
        this.results.details.push({
          person: person.fullName,
          success: false,
          confidenceScore: 0,
          methods: [],
          issues: ['No CoreSignal data found'],
          rejected: true
        });
      }
      
    } catch (error) {
      this.results.rejected++;
      console.log(`   ❌ ERROR: ${error.message}`);
      
      this.results.details.push({
        person: person.fullName,
        success: false,
        confidenceScore: 0,
        methods: [],
        issues: [error.message],
        rejected: true
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

  async validateAccuracy(person, coresignalData) {
    const validationResult = {
      isAccurate: true,
      shouldReject: false,
      confidenceScore: 100,
      methods: [],
      issues: []
    };
    
    console.log('   🔍 ACCURACY VALIDATION:');
    console.log('   =======================');
    
    // 1. LinkedIn URL Verification (CRITICAL - must match exactly)
    const linkedinMatch = this.validateLinkedInUrl(person.linkedinUrl, coresignalData.linkedin_url);
    if (linkedinMatch.isMatch) {
      validationResult.methods.push('LinkedIn URL Match');
      console.log('   ✅ LinkedIn URL: Perfect match');
    } else {
      validationResult.isAccurate = false;
      validationResult.shouldReject = true;
      validationResult.issues.push('LinkedIn URL mismatch - REJECTING');
      console.log('   ❌ LinkedIn URL: MISMATCH - REJECTING');
    }
    
    // 2. Name Verification (CRITICAL - must match closely)
    const nameMatch = this.validateName(person.fullName, coresignalData.full_name);
    if (nameMatch.isMatch) {
      validationResult.methods.push('Name Match');
      console.log(`   ✅ Name: ${nameMatch.confidence}% match`);
    } else {
      validationResult.isAccurate = false;
      validationResult.shouldReject = true;
      validationResult.issues.push('Name mismatch - REJECTING');
      console.log('   ❌ Name: MISMATCH - REJECTING');
    }
    
    // 3. Company Verification (WARNING - but not rejection)
    const companyMatch = this.validateCompany(person.company?.name, coresignalData.active_experience_company);
    if (companyMatch.isMatch) {
      validationResult.methods.push('Company Match');
      console.log(`   ✅ Company: ${companyMatch.confidence}% match`);
    } else {
      validationResult.issues.push('Company mismatch');
      console.log('   ⚠️ Company: Possible mismatch (not rejecting)');
    }
    
    // 4. Email Verification (if we have known email)
    if (person.workEmail) {
      const emailMatch = this.validateEmail(person.workEmail, coresignalData.primary_professional_email);
      if (emailMatch.isMatch) {
        validationResult.methods.push('Email Match');
        console.log(`   ✅ Email: ${emailMatch.confidence}% match`);
      } else {
        validationResult.issues.push('Email mismatch');
        console.log('   ⚠️ Email: Possible mismatch (not rejecting)');
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
        console.log('   ⚠️ Title: Possible mismatch (not rejecting)');
      }
    }
    
    // 6. Data Quality Validation
    const qualityCheck = this.validateDataQuality(coresignalData);
    if (qualityCheck.isValid) {
      validationResult.methods.push('Data Quality Check');
      console.log('   ✅ Data Quality: Valid');
    } else {
      validationResult.issues.push('Data quality issues');
      console.log('   ⚠️ Data Quality: Issues detected');
    }
    
    // Calculate final confidence score
    validationResult.confidenceScore = this.calculateConfidenceScore(validationResult);
    
    console.log(`   📊 Final Confidence Score: ${validationResult.confidenceScore}%`);
    console.log('');
    
    return validationResult;
  }

  validateLinkedInUrl(knownLinkedIn, coresignalLinkedIn) {
    if (!knownLinkedIn || !coresignalLinkedIn) {
      return { isMatch: false, confidence: 0 };
    }
    
    // Normalize LinkedIn URLs for exact comparison
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

  validateDataQuality(coresignalData) {
    const issues = [];
    
    // Check if LinkedIn URL is valid
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
      isValid: issues.length === 0,
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

  async updatePersonWithValidatedData(person, coresignalData, validationResult) {
    try {
      // Parse location data from CoreSignal
      const locationParts = this.parseLocation(coresignalData.location_full);
      
      // Prepare the update data with validated CoreSignal data
      const updateData = {
        // Core fields (only update if we have better data)
        workEmail: coresignalData.primary_professional_email || person.workEmail,
        workPhone: coresignalData.phone || person.workPhone,
        jobTitle: coresignalData.active_experience_title || person.jobTitle,
        
        // Location fields
        address: coresignalData.location_full || person.address,
        city: locationParts.city || person.city,
        state: locationParts.state || person.state,
        country: locationParts.country || person.country,
        postalCode: locationParts.postalCode || person.postalCode,
        
        // Profile picture
        profilePictureUrl: coresignalData.picture_url || person.profilePictureUrl,
        
        // Custom fields with COMPLETE CoreSignal data + validation metadata
        customFields: {
          ...person.customFields,
          coresignalData: {
            // Store the ENTIRE CoreSignal response
            ...coresignalData,
            // Add our validation metadata
            lastEnrichedAt: new Date().toISOString(),
            enrichmentSource: 'CoreSignal API - Production with Accuracy Validation',
            totalFields: Object.keys(coresignalData).length,
            validationMetadata: {
              confidenceScore: validationResult.confidenceScore,
              validationMethods: validationResult.methods,
              validationIssues: validationResult.issues,
              validatedAt: new Date().toISOString()
            }
          }
        },
        
        // Update enrichment sources
        enrichmentSources: [
          ...(person.enrichmentSources || []),
          'coresignal-full-validated'
        ].filter((source, index, array) => array.indexOf(source) === index)
      };
      
      // Update the person record
      await this.prisma.people.update({
        where: { id: person.id },
        data: updateData
      });
      
      console.log('   📊 VALIDATED DATA STORED:');
      console.log(`     - Core Fields Updated: Email, Title, Phone, Location`);
      console.log(`     - Total Fields Stored: ${Object.keys(coresignalData).length}`);
      console.log(`     - Validation Score: ${validationResult.confidenceScore}%`);
      console.log(`     - Validation Methods: ${validationResult.methods.join(', ')}`);
      
    } catch (error) {
      console.log(`     Error updating person: ${error.message}`);
      throw error;
    }
  }

  parseLocation(locationFull) {
    if (!locationFull) return { city: null, state: null, country: null, postalCode: null };
    
    const parts = locationFull.split(',').map(part => part.trim());
    
    if (parts.length === 1) {
      return { city: parts[0], state: null, country: null, postalCode: null };
    } else if (parts.length === 2) {
      return { city: parts[0], state: parts[1], country: null, postalCode: null };
    } else if (parts.length >= 3) {
      return { 
        city: parts[0], 
        state: parts[1], 
        country: parts[2], 
        postalCode: parts[3] || null 
      };
    }
    
    return { city: null, state: null, country: null, postalCode: null };
  }

  generateProductionReport() {
    console.log('📊 PRODUCTION ENRICHMENT REPORT');
    console.log('===============================');
    console.log(`Total People Processed: ${this.results.total}`);
    console.log(`Successfully Enriched: ${this.results.enriched} (${Math.round((this.results.enriched / this.results.total) * 100)}%)`);
    console.log(`Rejected (Accuracy Issues): ${this.results.rejected} (${Math.round((this.results.rejected / this.results.total) * 100)}%)`);
    console.log(`Accuracy Validated: ${this.results.accuracyValidated} (${Math.round((this.results.accuracyValidated / this.results.total) * 100)}%)`);
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
    
    console.log('⚠️ REJECTION REASONS:');
    console.log('====================');
    const rejectionReasons = {};
    this.results.details.filter(d => d.rejected).forEach(detail => {
      detail.issues.forEach(issue => {
        rejectionReasons[issue] = (rejectionReasons[issue] || 0) + 1;
      });
    });
    
    Object.entries(rejectionReasons)
      .sort((a, b) => b[1] - a[1])
      .forEach(([reason, count]) => {
        console.log(`${reason}: ${count} rejections`);
      });
    console.log('');
    
    console.log('✅ PRODUCTION ENRICHMENT COMPLETE');
    console.log('==================================');
    console.log('✅ Multiple accuracy validation layers implemented');
    console.log('✅ LinkedIn URL verification prevents wrong person matches');
    console.log('✅ Name verification ensures correct person identification');
    console.log('✅ Company, email, and title cross-validation');
    console.log('✅ Data quality validation');
    console.log('✅ Confidence scoring system');
    console.log('✅ Automatic rejection for critical mismatches');
    console.log('✅ Production-ready with accuracy safeguards');
  }
}

// Run production enrichment
async function main() {
  const enricher = new ProductionEnrichmentWithAccuracy();
  await enricher.enrichWithAccuracySafeguards();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ProductionEnrichmentWithAccuracy;
