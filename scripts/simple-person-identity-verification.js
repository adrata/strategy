#!/usr/bin/env node

/**
 * 🔍 SIMPLE PERSON IDENTITY VERIFICATION
 * 
 * Simple verification to ensure we're getting the right person's data
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class SimplePersonIdentityVerification {
  constructor() {
    this.prisma = new PrismaClient();
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.baseUrl = 'https://api.coresignal.com/cdapi/v2';
  }

  async verifyPersonIdentity() {
    console.log('🔍 SIMPLE PERSON IDENTITY VERIFICATION');
    console.log('=====================================');
    console.log('Verifying that we get the right person from CoreSignal');
    console.log('');
    
    if (!this.apiKey) {
      console.log('❌ CORESIGNAL_API_KEY not found in environment');
      return;
    }
    
    // Test with a specific person
    const testPerson = {
      fullName: 'Adam Riggs',
      linkedinUrl: 'https://www.linkedin.com/in/adam-gregory-riggs',
      ourCompany: 'Sunflower Electric Power Corporation'
    };
    
    await this.verifySpecificPerson(testPerson);
    
    await this.prisma.$disconnect();
  }

  async verifySpecificPerson(person) {
    console.log(`🔍 VERIFYING: ${person.fullName}`);
    console.log('================================');
    console.log(`   Our Company: ${person.ourCompany}`);
    console.log(`   LinkedIn: ${person.linkedinUrl}`);
    console.log('');
    
    try {
      // Get CoreSignal data
      const coresignalData = await this.getCoreSignalData(person.linkedinUrl);
      
      if (coresignalData) {
        console.log('   📊 CORESIGNAL DATA:');
        console.log('   ===================');
        console.log(`   Name: ${coresignalData.full_name}`);
        console.log(`   Email: ${coresignalData.primary_professional_email || 'None'}`);
        console.log(`   Title: ${coresignalData.active_experience_title || 'None'}`);
        console.log(`   Location: ${coresignalData.location_full || 'None'}`);
        console.log(`   LinkedIn: ${coresignalData.linkedin_url}`);
        console.log('');
        
        // Verify identity
        console.log('   🔍 IDENTITY VERIFICATION:');
        console.log('   ==========================');
        
        // 1. LinkedIn URL Verification
        const linkedinMatch = this.verifyLinkedInUrl(person.linkedinUrl, coresignalData.linkedin_url);
        console.log(`   LinkedIn URL: ${linkedinMatch.isMatch ? '✅ MATCH' : '❌ MISMATCH'} (${linkedinMatch.confidence}%)`);
        
        // 2. Name Verification
        const nameMatch = this.verifyName(person.fullName, coresignalData.full_name);
        console.log(`   Name: ${nameMatch.isMatch ? '✅ MATCH' : '❌ MISMATCH'} (${nameMatch.confidence}%)`);
        
        // 3. Check if this is the right person
        const isCorrectPerson = linkedinMatch.isMatch && nameMatch.isMatch;
        console.log('');
        console.log(`   🎯 RESULT: ${isCorrectPerson ? '✅ CORRECT PERSON' : '❌ WRONG PERSON'}`);
        
        if (isCorrectPerson) {
          console.log('   ✅ We are getting the correct person from CoreSignal');
          console.log('   ✅ The LinkedIn URL matches exactly');
          console.log('   ✅ The name matches closely');
        } else {
          console.log('   ❌ We are NOT getting the correct person from CoreSignal');
          console.log('   ❌ Either LinkedIn URL or name does not match');
        }
        
        // Show current company from experience
        if (coresignalData.experience && Array.isArray(coresignalData.experience)) {
          console.log('');
          console.log('   📋 CURRENT EMPLOYMENT:');
          console.log('   ======================');
          
          const activeCompanyId = coresignalData.active_experience_company_id;
          const matchingExperience = coresignalData.experience.find(exp => exp.company_id === activeCompanyId);
          
          if (matchingExperience) {
            console.log(`   Current Company: ${matchingExperience.company_name}`);
            console.log(`   Current Title: ${coresignalData.active_experience_title}`);
            console.log(`   Start Date: ${matchingExperience.date_from}`);
            console.log(`   End Date: ${matchingExperience.date_to || 'Current'}`);
            console.log('');
            console.log(`   🏢 COMPANY COMPARISON:`);
            console.log(`   Our Company: ${person.ourCompany}`);
            console.log(`   CoreSignal Company: ${matchingExperience.company_name}`);
            
            const companyMatch = this.verifyCompany(person.ourCompany, matchingExperience.company_name);
            console.log(`   Company Match: ${companyMatch.isMatch ? '✅ MATCH' : '❌ MISMATCH'} (${companyMatch.confidence}%)`);
          }
        }
        
      } else {
        console.log('   ❌ NO CORESIGNAL DATA FOUND');
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
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

  verifyCompany(ourCompany, coresignalCompany) {
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
}

// Run simple person identity verification
async function main() {
  const verifier = new SimplePersonIdentityVerification();
  await verifier.verifyPersonIdentity();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = SimplePersonIdentityVerification;
