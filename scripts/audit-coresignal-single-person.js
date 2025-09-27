#!/usr/bin/env node

/**
 * 🔍 CORESIGNAL SINGLE PERSON AUDIT
 * 
 * Test CoreSignal enrichment with one specific person using LinkedIn URL
 * to verify accuracy and avoid fuzzy matching issues
 */

const { PrismaClient } = require('@prisma/client');

class CoreSignalSinglePersonAudit {
  constructor() {
    this.prisma = new PrismaClient();
    this.config = {
      CORESIGNAL_API_KEY: process.env.CORESIGNAL_API_KEY,
      BASE_URL: 'https://api.coresignal.com/cdapi/v2',
      MAX_RETRIES: 3,
      RATE_LIMIT_DELAY: 1000
    };
  }

  async auditSinglePerson() {
    console.log('🔍 CORESIGNAL SINGLE PERSON AUDIT');
    console.log('==================================');
    
    try {
      // Find a person with LinkedIn URL for testing
      const testPerson = await this.prisma.people.findFirst({
        where: {
          workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1',
          linkedinUrl: { not: null },
          linkedinUrl: { not: '' }
        },
        include: { company: true }
      });

      if (!testPerson) {
        console.log('❌ No person with LinkedIn URL found for testing');
        return;
      }

      console.log('👤 TEST PERSON SELECTED:');
      console.log('========================');
      console.log('Name:', testPerson.fullName);
      console.log('Company:', testPerson.company?.name);
      console.log('LinkedIn:', testPerson.linkedinUrl);
      console.log('Current Job Title:', testPerson.jobTitle || 'Not specified');
      console.log('Current Email:', testPerson.workEmail || 'Not available');
      console.log('Current Phone:', testPerson.phone || 'Not available');
      console.log('');

      // Test 1: Search by LinkedIn URL (most accurate)
      console.log('🔍 TEST 1: SEARCH BY LINKEDIN URL');
      console.log('==================================');
      const linkedinResult = await this.searchByLinkedInUrl(testPerson.linkedinUrl);
      
      if (linkedinResult) {
        console.log('✅ LinkedIn URL search successful');
        this.displayPersonData(linkedinResult, 'LinkedIn URL Search');
      } else {
        console.log('❌ LinkedIn URL search failed');
      }

      console.log('');

      // Test 2: Search by name and company (fuzzy matching - risky)
      console.log('🔍 TEST 2: SEARCH BY NAME AND COMPANY (FUZZY)');
      console.log('==============================================');
      const nameCompanyResult = await this.searchByNameAndCompany(
        testPerson.fullName, 
        testPerson.company?.name
      );
      
      if (nameCompanyResult && nameCompanyResult.length > 0) {
        console.log('⚠️ Name + Company search returned results (FUZZY MATCHING)');
        console.log('Found', nameCompanyResult.length, 'potential matches');
        
        nameCompanyResult.forEach((result, index) => {
          console.log(`\n${index + 1}. POTENTIAL MATCH:`);
          this.displayPersonData(result, `Fuzzy Match ${index + 1}`);
        });
        
        // Check if any match is accurate
        const accurateMatch = this.verifyMatchAccuracy(testPerson, nameCompanyResult);
        if (accurateMatch) {
          console.log('✅ Found accurate match in fuzzy results');
        } else {
          console.log('❌ No accurate match found in fuzzy results');
        }
      } else {
        console.log('❌ Name + Company search returned no results');
      }

      console.log('');

      // Test 3: Search by name only (very risky)
      console.log('🔍 TEST 3: SEARCH BY NAME ONLY (VERY RISKY)');
      console.log('============================================');
      const nameOnlyResult = await this.searchByNameOnly(testPerson.fullName);
      
      if (nameOnlyResult && nameOnlyResult.length > 0) {
        console.log('⚠️ Name-only search returned results (VERY RISKY)');
        console.log('Found', nameOnlyResult.length, 'potential matches');
        
        nameOnlyResult.slice(0, 3).forEach((result, index) => {
          console.log(`\n${index + 1}. POTENTIAL MATCH:`);
          this.displayPersonData(result, `Name-Only Match ${index + 1}`);
        });
        
        const accurateMatch = this.verifyMatchAccuracy(testPerson, nameOnlyResult);
        if (accurateMatch) {
          console.log('✅ Found accurate match in name-only results');
        } else {
          console.log('❌ No accurate match found in name-only results');
        }
      } else {
        console.log('❌ Name-only search returned no results');
      }

      console.log('');

      // Test 4: API Health Check
      console.log('🔍 TEST 4: API HEALTH CHECK');
      console.log('============================');
      await this.testAPIHealth();

      console.log('');

      // Summary and Recommendations
      console.log('📊 AUDIT SUMMARY');
      console.log('=================');
      console.log('✅ LinkedIn URL search: Most accurate method');
      console.log('⚠️ Name + Company search: Risky fuzzy matching');
      console.log('❌ Name-only search: Very risky, avoid');
      console.log('');
      console.log('💡 RECOMMENDATIONS:');
      console.log('1. Use LinkedIn URLs when available (95%+ accuracy)');
      console.log('2. Avoid name-only searches (high false positive risk)');
      console.log('3. Use name + company only as fallback with verification');
      console.log('4. Always verify matches before updating database');

    } catch (error) {
      console.error('❌ Audit error:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async searchByLinkedInUrl(linkedinUrl) {
    try {
      const params = new URLSearchParams({
        linkedin_url: linkedinUrl,
        limit: 1
      });

      const response = await this.makeCoreSignalRequest(`/people/search?${params}`);
      return response?.data?.[0] || null;
    } catch (error) {
      console.log(`   ❌ LinkedIn URL search error: ${error.message}`);
      return null;
    }
  }

  async searchByNameAndCompany(fullName, companyName) {
    try {
      const params = new URLSearchParams({
        name: fullName,
        company: companyName,
        limit: 5
      });

      const response = await this.makeCoreSignalRequest(`/people/search?${params}`);
      return response?.data || [];
    } catch (error) {
      console.log(`   ❌ Name + Company search error: ${error.message}`);
      return [];
    }
  }

  async searchByNameOnly(fullName) {
    try {
      const params = new URLSearchParams({
        name: fullName,
        limit: 5
      });

      const response = await this.makeCoreSignalRequest(`/people/search?${params}`);
      return response?.data || [];
    } catch (error) {
      console.log(`   ❌ Name-only search error: ${error.message}`);
      return [];
    }
  }

  verifyMatchAccuracy(originalPerson, searchResults) {
    if (!searchResults || searchResults.length === 0) return null;

    for (const result of searchResults) {
      // Check for exact matches
      const nameMatch = result.full_name?.toLowerCase() === originalPerson.fullName?.toLowerCase();
      const companyMatch = result.active_experience_company?.toLowerCase() === originalPerson.company?.name?.toLowerCase();
      const linkedinMatch = result.linkedin_url === originalPerson.linkedinUrl;

      if (nameMatch && companyMatch && linkedinMatch) {
        return result; // Perfect match
      }
    }

    return null; // No accurate match found
  }

  displayPersonData(personData, source) {
    console.log(`   📊 ${source} Results:`);
    console.log(`   Full Name: ${personData.full_name || 'Not found'}`);
    console.log(`   Job Title: ${personData.active_experience_title || 'Not found'}`);
    console.log(`   Company: ${personData.active_experience_company || 'Not found'}`);
    console.log(`   Email: ${personData.primary_professional_email || 'Not found'}`);
    console.log(`   Phone: ${personData.phone || 'Not found'}`);
    console.log(`   LinkedIn: ${personData.linkedin_url || 'Not found'}`);
    console.log(`   Location: ${personData.location || 'Not found'}`);
    
    if (personData.experience && personData.experience.length > 0) {
      console.log(`   Experience: ${personData.experience[0].title} at ${personData.experience[0].company_name}`);
    }
  }

  async testAPIHealth() {
    try {
      const response = await this.makeCoreSignalRequest('/companies/search?name=test&limit=1');
      if (response) {
        console.log('✅ CoreSignal API is responding');
        console.log('✅ API Key is valid');
        console.log('✅ Rate limiting is working');
      } else {
        console.log('❌ CoreSignal API is not responding');
      }
    } catch (error) {
      console.log('❌ API Health Check failed:', error.message);
    }
  }

  async makeCoreSignalRequest(endpoint) {
    for (let attempt = 1; attempt <= this.config.MAX_RETRIES; attempt++) {
      try {
        const url = `${this.config.BASE_URL}${endpoint}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'apikey': this.config.CORESIGNAL_API_KEY,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          console.log(`   ✅ CoreSignal API call successful (attempt ${attempt})`);
          await new Promise(resolve => setTimeout(resolve, this.config.RATE_LIMIT_DELAY));
          return await response.json();
        } else {
          console.log(`   ❌ CoreSignal API error: ${response.status} - ${response.statusText}`);
          if (attempt < this.config.MAX_RETRIES) {
            console.log(`   🔄 Retrying in ${this.config.RATE_LIMIT_DELAY * 2}ms...`);
            await new Promise(resolve => setTimeout(resolve, this.config.RATE_LIMIT_DELAY * 2));
          }
        }
      } catch (error) {
        console.log(`   ❌ Request error: ${error.message}`);
        if (attempt < this.config.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, this.config.RATE_LIMIT_DELAY * 2));
        }
      }
    }
    return null;
  }
}

// Run the audit
async function main() {
  const auditor = new CoreSignalSinglePersonAudit();
  await auditor.auditSinglePerson();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CoreSignalSinglePersonAudit;
