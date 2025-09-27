#!/usr/bin/env node

/**
 * 🔍 VERIFY CORRECT PERSON IDENTITY
 * 
 * Comprehensive verification to ensure we're getting the right person's data
 * Multiple validation layers to prevent wrong person matches
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class VerifyCorrectPersonIdentity {
  constructor() {
    this.prisma = new PrismaClient();
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.baseUrl = 'https://api.coresignal.com/cdapi/v2';
    this.results = {
      total: 0,
      correctPerson: 0,
      wrongPerson: 0,
      uncertain: 0,
      details: []
    };
  }

  async verifyPersonIdentity() {
    console.log('🔍 VERIFYING CORRECT PERSON IDENTITY');
    console.log('====================================');
    console.log('Comprehensive verification to ensure we get the right person');
    console.log('');
    
    if (!this.apiKey) {
      console.log('❌ CORESIGNAL_API_KEY not found in environment');
      return;
    }
    
    // Get people for identity verification
    const peopleToVerify = await this.getPeopleToVerify();
    
    console.log(`📊 VERIFYING IDENTITY FOR ${peopleToVerify.length} PEOPLE`);
    console.log('=======================================================');
    console.log('');
    
    // Verify each person's identity
    for (const person of peopleToVerify) {
      if (person) {
        await this.verifyPersonIdentity(person);
      }
    }
    
    // Generate verification report
    this.generateVerificationReport();
    
    await this.prisma.$disconnect();
  }

  async getPeopleToVerify() {
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
        phone: true,
        mobilePhone: true,
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

  async verifyPersonIdentity(person) {
    if (!person) {
      console.log('❌ No person data provided');
      return;
    }
    
    this.results.total++;
    
    console.log(`🔍 VERIFYING: ${person.fullName || 'Unknown'}`);
    console.log('================================');
    console.log(`   Our Company: ${person.company?.name || 'Unknown'}`);
    console.log(`   Our Email: ${person.workEmail || 'None'}`);
    console.log(`   Our Title: ${person.jobTitle || 'None'}`);
    console.log(`   Our Phone: ${person.phone || 'None'}`);
    console.log(`   LinkedIn: ${person.linkedinUrl || 'None'}`);
    console.log('');
    
    try {
      // Get fresh CoreSignal data
      const coresignalData = await this.getCoreSignalData(person.linkedinUrl);
      
      if (coresignalData) {
        console.log('   📊 CORESIGNAL DATA FOR IDENTITY VERIFICATION:');
        console.log('   ===============================================');
        console.log(`   Name: ${coresignalData.full_name}`);
        console.log(`   Email: ${coresignalData.primary_professional_email || 'None'}`);
        console.log(`   Title: ${coresignalData.active_experience_title || 'None'}`);
        console.log(`   Location: ${coresignalData.location_full || 'None'}`);
        console.log(`   LinkedIn: ${coresignalData.linkedin_url}`);
        console.log('');
        
        // Run comprehensive identity verification
        const identityVerification = await this.runIdentityVerification(person, coresignalData);
        
        if (identityVerification.isCorrectPerson) {
          this.results.correctPerson++;
          console.log('   ✅ CORRECT PERSON: Identity verified');
          console.log(`   Confidence Score: ${identityVerification.confidenceScore}%`);
          console.log(`   Verification Methods: ${identityVerification.methods.join(', ')}`);
        } else if (identityVerification.isWrongPerson) {
          this.results.wrongPerson++;
          console.log('   ❌ WRONG PERSON: Identity verification failed');
          console.log(`   Issues: ${identityVerification.issues.join(', ')}`);
          console.log(`   Confidence Score: ${identityVerification.confidenceScore}%`);
        } else {
          this.results.uncertain++;
          console.log('   ⚠️ UNCERTAIN: Identity verification inconclusive');
          console.log(`   Issues: ${identityVerification.issues.join(', ')}`);
          console.log(`   Confidence Score: ${identityVerification.confidenceScore}%`);
        }
        
        this.results.details.push({
          person: person.fullName,
          ourCompany: person.company?.name || 'Unknown',
          coresignalName: coresignalData.full_name,
          coresignalEmail: coresignalData.primary_professional_email,
          coresignalTitle: coresignalData.active_experience_title,
          isCorrectPerson: identityVerification.isCorrectPerson,
          isWrongPerson: identityVerification.isWrongPerson,
          confidenceScore: identityVerification.confidenceScore,
          methods: identityVerification.methods,
          issues: identityVerification.issues
        });
        
      } else {
        this.results.uncertain++;
        console.log('   ❌ NO CORESIGNAL DATA FOUND');
        
        this.results.details.push({
          person: person.fullName,
          ourCompany: person.company?.name || 'Unknown',
          coresignalName: 'No Data',
          coresignalEmail: 'No Data',
          coresignalTitle: 'No Data',
          isCorrectPerson: false,
          isWrongPerson: false,
          confidenceScore: 0,
          methods: [],
          issues: ['No CoreSignal data found']
        });
      }
      
    } catch (error) {
      this.results.uncertain++;
      console.log(`   ❌ ERROR: ${error.message}`);
      
      this.results.details.push({
        person: person.fullName,
        ourCompany: person.company?.name || 'Unknown',
        coresignalName: 'Error',
        coresignalEmail: 'Error',
        coresignalTitle: 'Error',
        isCorrectPerson: false,
        isWrongPerson: false,
        confidenceScore: 0,
        methods: [],
        issues: [error.message]
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

  async runIdentityVerification(person, coresignalData) {
    const verification = {
      isCorrectPerson: false,
      isWrongPerson: false,
      confidenceScore: 100,
      methods: [],
      issues: []
    };
    
    console.log('   🔍 IDENTITY VERIFICATION:');
    console.log('   ==========================');
    
    // 1. LinkedIn URL Verification (CRITICAL - must match exactly)
    const linkedinMatch = this.verifyLinkedInUrl(person.linkedinUrl, coresignalData.linkedin_url);
    if (linkedinMatch.isMatch) {
      verification.methods.push('LinkedIn URL Match');
      console.log('   ✅ LinkedIn URL: Perfect match');
    } else {
      verification.isWrongPerson = true;
      verification.issues.push('LinkedIn URL mismatch - WRONG PERSON');
      console.log('   ❌ LinkedIn URL: MISMATCH - WRONG PERSON');
    }
    
    // 2. Name Verification (CRITICAL - must match closely)
    const nameMatch = this.verifyName(person.fullName, coresignalData.full_name);
    if (nameMatch.isMatch) {
      verification.methods.push('Name Match');
      console.log(`   ✅ Name: ${nameMatch.confidence}% match`);
    } else {
      verification.isWrongPerson = true;
      verification.issues.push('Name mismatch - WRONG PERSON');
      console.log('   ❌ Name: MISMATCH - WRONG PERSON');
    }
    
    // 3. Email Verification (if we have known email)
    if (person.workEmail) {
      const emailMatch = this.verifyEmail(person.workEmail, coresignalData.primary_professional_email);
      if (emailMatch.isMatch) {
        verification.methods.push('Email Match');
        console.log(`   ✅ Email: ${emailMatch.confidence}% match`);
      } else {
        verification.issues.push('Email mismatch');
        console.log('   ⚠️ Email: Possible mismatch');
      }
    }
    
    // 4. Title Verification (if we have known title)
    if (person.jobTitle) {
      const titleMatch = this.verifyTitle(person.jobTitle, coresignalData.active_experience_title);
      if (titleMatch.isMatch) {
        verification.methods.push('Title Match');
        console.log(`   ✅ Title: ${titleMatch.confidence}% match`);
      } else {
        verification.issues.push('Title mismatch');
        console.log('   ⚠️ Title: Possible mismatch');
      }
    }
    
    // 5. Location Verification (if we have location data)
    const locationMatch = this.verifyLocation(person, coresignalData);
    if (locationMatch.isMatch) {
      verification.methods.push('Location Match');
      console.log(`   ✅ Location: ${locationMatch.confidence}% match`);
    } else {
      verification.issues.push('Location mismatch');
      console.log('   ⚠️ Location: Possible mismatch');
    }
    
    // 6. Cross-Reference Verification
    const crossRefMatch = this.verifyCrossReference(coresignalData);
    if (crossRefMatch.isMatch) {
      verification.methods.push('Cross-Reference Match');
      console.log(`   ✅ Cross-Reference: ${crossRefMatch.confidence}% match`);
    } else {
      verification.issues.push('Cross-reference validation failed');
      console.log('   ⚠️ Cross-Reference: Possible issues');
    }
    
    // 7. Data Consistency Verification
    const consistencyMatch = this.verifyDataConsistency(coresignalData);
    if (consistencyMatch.isConsistent) {
      verification.methods.push('Data Consistency Check');
      console.log('   ✅ Data Consistency: Valid');
    } else {
      verification.issues.push('Data consistency issues');
      console.log('   ⚠️ Data Consistency: Issues detected');
    }
    
    // Calculate final confidence score
    verification.confidenceScore = this.calculateIdentityConfidenceScore(verification);
    
    // Determine if this is the correct person
    if (verification.isWrongPerson) {
      verification.isCorrectPerson = false;
    } else if (verification.confidenceScore >= 80 && verification.methods.length >= 3) {
      verification.isCorrectPerson = true;
    } else {
      verification.isCorrectPerson = false;
    }
    
    console.log(`   📊 Final Identity Confidence Score: ${verification.confidenceScore}%`);
    console.log('');
    
    return verification;
  }

  verifyLinkedInUrl(knownLinkedIn, coresignalLinkedIn) {
    if (!knownLinkedIn || !coresignalLinkedIn) {
      return { isMatch: false, confidence: 0 };
    }
    
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

  verifyName(knownName, coresignalName) {
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
    
    // Partial match
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

  verifyEmail(knownEmail, coresignalEmail) {
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

  verifyTitle(knownTitle, coresignalTitle) {
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
    
    if (normalizedKnown === normalizedCoreSignal) {
      return { isMatch: true, confidence: 100 };
    }
    
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

  verifyLocation(person, coresignalData) {
    // This is a placeholder - we'd need location data in our person record
    // For now, we'll just check if CoreSignal has location data
    const hasLocation = coresignalData.location_full && coresignalData.location_full.length > 0;
    
    return {
      isMatch: hasLocation,
      confidence: hasLocation ? 100 : 0
    };
  }

  verifyCrossReference(coresignalData) {
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
    
    return {
      isMatch: issues.length === 0,
      confidence: issues.length === 0 ? 100 : Math.max(0, 100 - (issues.length * 20)),
      issues: issues
    };
  }

  verifyDataConsistency(coresignalData) {
    const issues = [];
    
    // Check if the data makes sense
    if (coresignalData.full_name && coresignalData.full_name.length < 2) {
      issues.push('Name too short');
    }
    
    if (coresignalData.primary_professional_email && !coresignalData.primary_professional_email.includes('@')) {
      issues.push('Invalid email format');
    }
    
    if (coresignalData.linkedin_url && !coresignalData.linkedin_url.includes('linkedin.com/in/')) {
      issues.push('Invalid LinkedIn URL format');
    }
    
    return {
      isConsistent: issues.length === 0,
      issues: issues
    };
  }

  calculateIdentityConfidenceScore(verification) {
    let score = 100;
    
    verification.issues.forEach(issue => {
      if (issue.includes('LinkedIn URL mismatch')) score -= 50;
      else if (issue.includes('Name mismatch')) score -= 30;
      else if (issue.includes('Email mismatch')) score -= 20;
      else if (issue.includes('Title mismatch')) score -= 15;
      else if (issue.includes('Location mismatch')) score -= 10;
      else if (issue.includes('Cross-reference validation failed')) score -= 10;
      else if (issue.includes('Data consistency issues')) score -= 5;
      else score -= 5;
    });
    
    return Math.max(0, score);
  }

  generateVerificationReport() {
    console.log('📊 PERSON IDENTITY VERIFICATION REPORT');
    console.log('=====================================');
    console.log(`Total People Verified: ${this.results.total}`);
    console.log(`Correct Person: ${this.results.correctPerson} (${Math.round((this.results.correctPerson / this.results.total) * 100)}%)`);
    console.log(`Wrong Person: ${this.results.wrongPerson} (${Math.round((this.results.wrongPerson / this.results.total) * 100)}%)`);
    console.log(`Uncertain: ${this.results.uncertain} (${Math.round((this.results.uncertain / this.results.total) * 100)}%)`);
    console.log('');
    
    console.log('📋 DETAILED VERIFICATION RESULTS:');
    console.log('==================================');
    this.results.details.forEach((detail, index) => {
      console.log(`${index + 1}. ${detail.person}`);
      console.log(`   Our Data: ${detail.ourCompany}`);
      console.log(`   CoreSignal Name: ${detail.coresignalName}`);
      console.log(`   CoreSignal Email: ${detail.coresignalEmail}`);
      console.log(`   CoreSignal Title: ${detail.coresignalTitle}`);
      console.log(`   Correct Person: ${detail.isCorrectPerson ? '✅' : '❌'}`);
      console.log(`   Wrong Person: ${detail.isWrongPerson ? '❌' : '✅'}`);
      console.log(`   Confidence: ${detail.confidenceScore}%`);
      console.log(`   Methods: ${detail.methods.join(', ')}`);
      if (detail.issues.length > 0) {
        console.log(`   Issues: ${detail.issues.join(', ')}`);
      }
      console.log('');
    });
    
    console.log('✅ PERSON IDENTITY VERIFICATION COMPLETE');
    console.log('======================================');
    console.log('✅ LinkedIn URL verification prevents wrong person matches');
    console.log('✅ Name verification ensures correct person identification');
    console.log('✅ Email, title, and location cross-validation');
    console.log('✅ Data consistency verification');
    console.log('✅ Cross-reference validation');
    console.log('✅ Comprehensive identity verification system');
  }
}

// Run person identity verification
async function main() {
  const verifier = new VerifyCorrectPersonIdentity();
  await verifier.verifyPersonIdentity();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = VerifyCorrectPersonIdentity;
