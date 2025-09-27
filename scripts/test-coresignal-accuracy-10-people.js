#!/usr/bin/env node

/**
 * 🔍 CORESIGNAL ACCURACY TEST - 10 PEOPLE
 * 
 * Test CoreSignal employee enrichment accuracy with 10 real people
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class CoreSignalAccuracyTest {
  constructor() {
    this.prisma = new PrismaClient();
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.baseUrl = 'https://api.coresignal.com/cdapi/v2';
    this.results = {
      total: 0,
      found: 0,
      notFound: 0,
      accurate: 0,
      inaccurate: 0,
      partial: 0,
      errors: 0,
      details: []
    };
  }

  async testAccuracy() {
    console.log('🔍 CORESIGNAL ACCURACY TEST - 10 PEOPLE');
    console.log('========================================');
    
    if (!this.apiKey) {
      console.log('❌ CORESIGNAL_API_KEY not found in environment');
      return;
    }
    
    console.log('API Key loaded:', this.apiKey ? 'Yes' : 'No');
    console.log('');
    
    // Get 10 people with LinkedIn URLs for testing
    const testPeople = await this.getTestPeople();
    
    if (testPeople.length === 0) {
      console.log('❌ No people with LinkedIn URLs found for testing');
      return;
    }
    
    console.log(`📊 Testing ${testPeople.length} people...`);
    console.log('');
    
    // Test each person
    for (const person of testPeople) {
      await this.testPerson(person);
    }
    
    // Generate accuracy report
    this.generateAccuracyReport();
    
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

  async testPerson(person) {
    this.results.total++;
    
    console.log(`🔍 TESTING: ${person.fullName}`);
    console.log(`   Company: ${person.company?.name || 'Unknown'}`);
    console.log(`   LinkedIn: ${person.linkedinUrl}`);
    console.log(`   Current Title: ${person.jobTitle || 'Not specified'}`);
    console.log(`   Current Email: ${person.workEmail || 'Not available'}`);
    console.log('');
    
    try {
      // Test 1: Search by LinkedIn URL (most accurate)
      const linkedinResult = await this.searchByLinkedIn(person.linkedinUrl);
      
      if (linkedinResult) {
        console.log('   ✅ LinkedIn search successful');
        const accuracy = this.analyzeAccuracy(person, linkedinResult, 'LinkedIn URL');
        this.results.details.push({
          person: person.fullName,
          method: 'LinkedIn URL',
          found: true,
          accuracy: accuracy,
          coresignalData: linkedinResult
        });
        
        if (accuracy === 'accurate') this.results.accurate++;
        else if (accuracy === 'partial') this.results.partial++;
        else this.results.inaccurate++;
        
        this.results.found++;
      } else {
        console.log('   ❌ LinkedIn search failed');
        
        // Test 2: Search by name and company (fallback)
        const nameCompanyResult = await this.searchByNameAndCompany(person.fullName, person.company?.name);
        
        if (nameCompanyResult) {
          console.log('   ⚠️ Name + Company search successful (fallback)');
          const accuracy = this.analyzeAccuracy(person, nameCompanyResult, 'Name + Company');
          this.results.details.push({
            person: person.fullName,
            method: 'Name + Company',
            found: true,
            accuracy: accuracy,
            coresignalData: nameCompanyResult
          });
          
          if (accuracy === 'accurate') this.results.accurate++;
          else if (accuracy === 'partial') this.results.partial++;
          else this.results.inaccurate++;
          
          this.results.found++;
        } else {
          console.log('   ❌ No CoreSignal data found');
          this.results.details.push({
            person: person.fullName,
            method: 'None',
            found: false,
            accuracy: 'not_found',
            coresignalData: null
          });
          this.results.notFound++;
        }
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      this.results.errors++;
      this.results.details.push({
        person: person.fullName,
        method: 'Error',
        found: false,
        accuracy: 'error',
        coresignalData: null,
        error: error.message
      });
    }
    
    console.log('');
  }

  async searchByLinkedIn(linkedinUrl) {
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
      console.log(`     LinkedIn search error: ${error.message}`);
      return null;
    }
  }

  async searchByNameAndCompany(fullName, companyName) {
    try {
      const searchQuery = {
        query: {
          bool: {
            must: [
              {
                match: {
                  full_name: fullName
                }
              },
              {
                nested: {
                  path: 'experience',
                  query: {
                    bool: {
                      should: [
                        { match: { 'experience.company_name': companyName } },
                        { match_phrase: { 'experience.company_name': companyName } },
                      ],
                    },
                  },
                },
              },
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
      console.log(`     Name + Company search error: ${error.message}`);
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
      console.log(`     Collect error: ${error.message}`);
      return null;
    }
  }

  analyzeAccuracy(originalPerson, coresignalData, method) {
    console.log('   📊 ACCURACY ANALYSIS:');
    
    // Check name match
    const nameMatch = this.checkNameMatch(originalPerson.fullName, coresignalData.full_name);
    console.log(`     Name Match: ${nameMatch ? '✅' : '❌'} (${coresignalData.full_name})`);
    
    // Check company match
    const companyMatch = this.checkCompanyMatch(originalPerson.company?.name, coresignalData.active_experience_company);
    console.log(`     Company Match: ${companyMatch ? '✅' : '❌'} (${coresignalData.active_experience_company})`);
    
    // Check LinkedIn match
    const linkedinMatch = this.checkLinkedInMatch(originalPerson.linkedinUrl, coresignalData.linkedin_url);
    console.log(`     LinkedIn Match: ${linkedinMatch ? '✅' : '❌'} (${coresignalData.linkedin_url})`);
    
    // Check email match
    const emailMatch = this.checkEmailMatch(originalPerson.workEmail, coresignalData.primary_professional_email);
    console.log(`     Email Match: ${emailMatch ? '✅' : '❌'} (${coresignalData.primary_professional_email})`);
    
    // Check title match
    const titleMatch = this.checkTitleMatch(originalPerson.jobTitle, coresignalData.active_experience_title);
    console.log(`     Title Match: ${titleMatch ? '✅' : '❌'} (${coresignalData.active_experience_title})`);
    
    // Determine overall accuracy
    const matches = [nameMatch, companyMatch, linkedinMatch, emailMatch, titleMatch].filter(Boolean).length;
    const totalChecks = 5;
    const accuracyScore = matches / totalChecks;
    
    console.log(`     Accuracy Score: ${matches}/${totalChecks} (${Math.round(accuracyScore * 100)}%)`);
    
    if (accuracyScore >= 0.8) return 'accurate';
    if (accuracyScore >= 0.5) return 'partial';
    return 'inaccurate';
  }

  checkNameMatch(originalName, coresignalName) {
    if (!originalName || !coresignalName) return false;
    return originalName.toLowerCase().trim() === coresignalName.toLowerCase().trim();
  }

  checkCompanyMatch(originalCompany, coresignalCompany) {
    if (!originalCompany || !coresignalCompany) return false;
    return originalCompany.toLowerCase().trim() === coresignalCompany.toLowerCase().trim();
  }

  checkLinkedInMatch(originalLinkedIn, coresignalLinkedIn) {
    if (!originalLinkedIn || !coresignalLinkedIn) return false;
    return originalLinkedIn.toLowerCase().trim() === coresignalLinkedIn.toLowerCase().trim();
  }

  checkEmailMatch(originalEmail, coresignalEmail) {
    if (!originalEmail || !coresignalEmail) return false;
    return originalEmail.toLowerCase().trim() === coresignalEmail.toLowerCase().trim();
  }

  checkTitleMatch(originalTitle, coresignalTitle) {
    if (!originalTitle || !coresignalTitle) return false;
    return originalTitle.toLowerCase().trim() === coresignalTitle.toLowerCase().trim();
  }

  generateAccuracyReport() {
    console.log('📊 CORESIGNAL ACCURACY REPORT');
    console.log('=============================');
    console.log(`Total People Tested: ${this.results.total}`);
    console.log(`Found in CoreSignal: ${this.results.found} (${Math.round((this.results.found / this.results.total) * 100)}%)`);
    console.log(`Not Found: ${this.results.notFound} (${Math.round((this.results.notFound / this.results.total) * 100)}%)`);
    console.log(`Errors: ${this.results.errors} (${Math.round((this.results.errors / this.results.total) * 100)}%)`);
    console.log('');
    
    if (this.results.found > 0) {
      console.log('📈 ACCURACY BREAKDOWN:');
      console.log(`Accurate Matches: ${this.results.accurate} (${Math.round((this.results.accurate / this.results.found) * 100)}%)`);
      console.log(`Partial Matches: ${this.results.partial} (${Math.round((this.results.partial / this.results.found) * 100)}%)`);
      console.log(`Inaccurate Matches: ${this.results.inaccurate} (${Math.round((this.results.inaccurate / this.results.found) * 100)}%)`);
      console.log('');
    }
    
    console.log('🔍 DETAILED RESULTS:');
    console.log('===================');
    this.results.details.forEach((detail, index) => {
      console.log(`${index + 1}. ${detail.person}`);
      console.log(`   Method: ${detail.method}`);
      console.log(`   Found: ${detail.found ? 'Yes' : 'No'}`);
      console.log(`   Accuracy: ${detail.accuracy}`);
      if (detail.coresignalData) {
        console.log(`   CoreSignal Name: ${detail.coresignalData.full_name || 'N/A'}`);
        console.log(`   CoreSignal Company: ${detail.coresignalData.active_experience_company || 'N/A'}`);
        console.log(`   CoreSignal Email: ${detail.coresignalData.primary_professional_email || 'N/A'}`);
      }
      if (detail.error) {
        console.log(`   Error: ${detail.error}`);
      }
      console.log('');
    });
    
    console.log('💡 RECOMMENDATIONS:');
    console.log('===================');
    if (this.results.found / this.results.total >= 0.8) {
      console.log('✅ CoreSignal coverage is excellent (>80%)');
    } else if (this.results.found / this.results.total >= 0.6) {
      console.log('⚠️ CoreSignal coverage is good (60-80%)');
    } else {
      console.log('❌ CoreSignal coverage is low (<60%)');
    }
    
    if (this.results.accurate / this.results.found >= 0.8) {
      console.log('✅ CoreSignal accuracy is excellent (>80%)');
    } else if (this.results.accurate / this.results.found >= 0.6) {
      console.log('⚠️ CoreSignal accuracy is good (60-80%)');
    } else {
      console.log('❌ CoreSignal accuracy is low (<60%)');
    }
    
    console.log('');
    console.log('🎯 BEST PRACTICES:');
    console.log('1. Use LinkedIn URLs for highest accuracy');
    console.log('2. Use name + company as fallback');
    console.log('3. Always verify matches before updating database');
    console.log('4. Consider fuzzy matching only for low-confidence results');
  }
}

// Run the test
async function main() {
  const tester = new CoreSignalAccuracyTest();
  await tester.testAccuracy();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CoreSignalAccuracyTest;
