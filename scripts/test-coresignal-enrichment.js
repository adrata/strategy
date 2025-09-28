#!/usr/bin/env node

/**
 * 🧪 TEST CORESIGNAL ENRICHMENT ON SAMPLE DATA
 * 
 * This script tests the CoreSignal enrichment process on a small sample
 * of people from the TOP Engineering Plus workspace to validate the approach
 * before running on the full dataset.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class TestCoreSignalEnrichment {
  constructor() {
    this.prisma = new PrismaClient();
    this.coresignalApiKey = process.env.CORESIGNAL_API_KEY;
    this.workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1'; // TOP Engineering Plus workspace
    this.testResults = {
      linkedinOnly: { success: 0, failed: 0, samples: [] },
      emailOnly: { success: 0, failed: 0, samples: [] },
      bothData: { success: 0, failed: 0, samples: [] }
    };
  }

  async testEnrichment() {
    try {
      console.log('🧪 TESTING CORESIGNAL ENRICHMENT ON SAMPLE DATA');
      console.log('===============================================');
      console.log(`📊 Workspace ID: ${this.workspaceId}`);
      console.log(`🔑 CoreSignal API Key: ${this.coresignalApiKey ? 'Configured' : 'Missing'}`);
      console.log('');

      if (!this.coresignalApiKey) {
        throw new Error('CORESIGNAL_API_KEY not found in environment variables');
      }

      // Get sample people from each category
      const sampleSize = 3; // Test with 3 people from each category
      
      const linkedinOnly = await this.getSamplePeople('linkedinOnly', sampleSize);
      const emailOnly = await this.getSamplePeople('emailOnly', sampleSize);
      const bothData = await this.getSamplePeople('bothData', sampleSize);

      console.log('📋 TEST SAMPLE BREAKDOWN:');
      console.log('=========================');
      console.log(`   LinkedIn Only: ${linkedinOnly.length} people`);
      console.log(`   Email Only: ${emailOnly.length} people`);
      console.log(`   Both Data: ${bothData.length} people`);
      console.log('');

      // Test each category
      if (linkedinOnly.length > 0) {
        console.log('🔗 TESTING LINKEDIN ONLY ENRICHMENT');
        console.log('==================================');
        await this.testLinkedInOnly(linkedinOnly);
        console.log('');
      }

      if (emailOnly.length > 0) {
        console.log('📧 TESTING EMAIL ONLY ENRICHMENT');
        console.log('================================');
        await this.testEmailOnly(emailOnly);
        console.log('');
      }

      if (bothData.length > 0) {
        console.log('📧🔗 TESTING BOTH DATA ENRICHMENT');
        console.log('=================================');
        await this.testBothData(bothData);
        console.log('');
      }

      // Show test results
      this.showTestResults();

    } catch (error) {
      console.error('❌ CRITICAL ERROR:', error.message);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async getSamplePeople(category, limit) {
    const whereClause = this.getWhereClause(category);
    
    return await this.prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        ...whereClause
      },
      include: {
        company: {
          select: {
            name: true
          }
        }
      },
      take: limit,
      orderBy: {
        fullName: 'asc'
      }
    });
  }

  getWhereClause(category) {
    switch (category) {
      case 'linkedinOnly':
        return {
          linkedinUrl: { not: null },
          AND: [
            { email: null },
            { workEmail: null },
            { personalEmail: null }
          ]
        };
      case 'emailOnly':
        return {
          OR: [
            { email: { not: null } },
            { workEmail: { not: null } },
            { personalEmail: { not: null } }
          ],
          linkedinUrl: null
        };
      case 'bothData':
        return {
          linkedinUrl: { not: null },
          OR: [
            { email: { not: null } },
            { workEmail: { not: null } },
            { personalEmail: { not: null } }
          ]
        };
      default:
        return {};
    }
  }

  async testLinkedInOnly(people) {
    for (let i = 0; i < people.length; i++) {
      const person = people[i];
      console.log(`   ${i + 1}/${people.length} - ${person.fullName}`);
      console.log(`      LinkedIn: ${person.linkedinUrl}`);
      
      try {
        const employeeId = await this.searchByLinkedInUrl(person.linkedinUrl);
        
        if (employeeId) {
          const profileData = await this.collectEmployeeProfile(employeeId);
          
          if (profileData) {
            console.log(`      ✅ SUCCESS: Found CoreSignal data`);
            console.log(`         Name: ${profileData.full_name}`);
            console.log(`         Title: ${profileData.active_experience_title}`);
            console.log(`         Company: ${profileData.experience?.[0]?.company_name}`);
            console.log(`         Email: ${profileData.primary_professional_email}`);
            console.log(`         Skills: ${profileData.inferred_skills?.slice(0, 3).join(', ')}`);
            
            this.testResults.linkedinOnly.success++;
            this.testResults.linkedinOnly.samples.push({
              person: person.fullName,
              linkedin: person.linkedinUrl,
              coresignal: {
                employeeId,
                name: profileData.full_name,
                title: profileData.active_experience_title,
                email: profileData.primary_professional_email
              }
            });
          } else {
            console.log(`      ⚠️  Found employee ID but no profile data`);
            this.testResults.linkedinOnly.failed++;
          }
        } else {
          console.log(`      ❌ No CoreSignal match found`);
          this.testResults.linkedinOnly.failed++;
        }
        
      } catch (error) {
        console.log(`      ❌ Error: ${error.message}`);
        this.testResults.linkedinOnly.failed++;
      }
      
      // Rate limiting
      if (i < people.length - 1) {
        await this.delay(200);
      }
    }
  }

  async testEmailOnly(people) {
    for (let i = 0; i < people.length; i++) {
      const person = people[i];
      const email = person.email || person.workEmail || person.personalEmail;
      console.log(`   ${i + 1}/${people.length} - ${person.fullName}`);
      console.log(`      Email: ${email}`);
      console.log(`      Company: ${person.company?.name || 'Unknown'}`);
      
      try {
        const employeeId = await this.searchByEmailAndName(email, person.fullName, person.company?.name);
        
        if (employeeId) {
          const profileData = await this.collectEmployeeProfile(employeeId);
          
          if (profileData) {
            console.log(`      ✅ SUCCESS: Found CoreSignal data`);
            console.log(`         Name: ${profileData.full_name}`);
            console.log(`         Title: ${profileData.active_experience_title}`);
            console.log(`         Company: ${profileData.experience?.[0]?.company_name}`);
            console.log(`         LinkedIn: ${profileData.linkedin_url}`);
            console.log(`         Skills: ${profileData.inferred_skills?.slice(0, 3).join(', ')}`);
            
            this.testResults.emailOnly.success++;
            this.testResults.emailOnly.samples.push({
              person: person.fullName,
              email: email,
              coresignal: {
                employeeId,
                name: profileData.full_name,
                title: profileData.active_experience_title,
                linkedin: profileData.linkedin_url
              }
            });
          } else {
            console.log(`      ⚠️  Found employee ID but no profile data`);
            this.testResults.emailOnly.failed++;
          }
        } else {
          console.log(`      ❌ No CoreSignal match found`);
          this.testResults.emailOnly.failed++;
        }
        
      } catch (error) {
        console.log(`      ❌ Error: ${error.message}`);
        this.testResults.emailOnly.failed++;
      }
      
      // Rate limiting
      if (i < people.length - 1) {
        await this.delay(200);
      }
    }
  }

  async testBothData(people) {
    for (let i = 0; i < people.length; i++) {
      const person = people[i];
      const email = person.email || person.workEmail || person.personalEmail;
      console.log(`   ${i + 1}/${people.length} - ${person.fullName}`);
      console.log(`      Email: ${email}`);
      console.log(`      LinkedIn: ${person.linkedinUrl}`);
      console.log(`      Company: ${person.company?.name || 'Unknown'}`);
      
      try {
        // Try LinkedIn first (more reliable)
        let employeeId = await this.searchByLinkedInUrl(person.linkedinUrl);
        
        // If LinkedIn fails, try email + name search
        if (!employeeId) {
          employeeId = await this.searchByEmailAndName(email, person.fullName, person.company?.name);
        }
        
        if (employeeId) {
          const profileData = await this.collectEmployeeProfile(employeeId);
          
          if (profileData) {
            console.log(`      ✅ SUCCESS: Found CoreSignal data`);
            console.log(`         Name: ${profileData.full_name}`);
            console.log(`         Title: ${profileData.active_experience_title}`);
            console.log(`         Company: ${profileData.experience?.[0]?.company_name}`);
            console.log(`         Email: ${profileData.primary_professional_email}`);
            console.log(`         LinkedIn: ${profileData.linkedin_url}`);
            console.log(`         Skills: ${profileData.inferred_skills?.slice(0, 3).join(', ')}`);
            
            this.testResults.bothData.success++;
            this.testResults.bothData.samples.push({
              person: person.fullName,
              email: email,
              linkedin: person.linkedinUrl,
              coresignal: {
                employeeId,
                name: profileData.full_name,
                title: profileData.active_experience_title,
                email: profileData.primary_professional_email,
                linkedin: profileData.linkedin_url
              }
            });
          } else {
            console.log(`      ⚠️  Found employee ID but no profile data`);
            this.testResults.bothData.failed++;
          }
        } else {
          console.log(`      ❌ No CoreSignal match found`);
          this.testResults.bothData.failed++;
        }
        
      } catch (error) {
        console.log(`      ❌ Error: ${error.message}`);
        this.testResults.bothData.failed++;
      }
      
      // Rate limiting
      if (i < people.length - 1) {
        await this.delay(200);
      }
    }
  }

  async searchByLinkedInUrl(linkedinUrl) {
    try {
      const searchQuery = {
        query: {
          bool: {
            must: [
              {
                match_phrase: {
                  linkedin_url: linkedinUrl
                }
              }
            ]
          }
        }
      };

      const response = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.coresignalApiKey
        },
        body: JSON.stringify(searchQuery)
      });

      if (response.ok) {
        const data = await response.json();
        return data.length > 0 ? data[0] : null;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  async searchByEmailAndName(email, fullName, companyName) {
    try {
      const strategies = [
        // Strategy 1: Exact email match (most reliable)
        {
          query: {
            bool: {
              must: [
                {
                  term: {
                    "primary_professional_email.exact": email
                  }
                }
              ]
            }
          }
        },
        // Strategy 2: Email match with name
        {
          query: {
            bool: {
              must: [
                { match: { primary_professional_email: email } },
                { match: { full_name: fullName } }
              ]
            }
          }
        }
      ];

      if (companyName) {
        strategies.push({
          query: {
            bool: {
              must: [
                {
                  nested: {
                    path: 'experience',
                    query: {
                      bool: {
                        must: [
                          { match: { 'experience.company_name': companyName } },
                          { match: { 'experience.active_experience': 1 } }
                        ]
                      }
                    }
                  }
                },
                { match: { full_name: fullName } }
              ]
            }
          }
        });
      }

      for (const strategy of strategies) {
        const response = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.coresignalApiKey
          },
          body: JSON.stringify(strategy)
        });

        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            return data[0];
          }
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  async collectEmployeeProfile(employeeId) {
    try {
      const response = await fetch(`https://api.coresignal.com/cdapi/v2/employee_multi_source/collect/${employeeId}`, {
        method: 'GET',
        headers: {
          'apikey': this.coresignalApiKey,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        return await response.json();
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  showTestResults() {
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('=======================');
    
    Object.entries(this.testResults).forEach(([category, results]) => {
      const total = results.success + results.failed;
      const successRate = total > 0 ? Math.round((results.success / total) * 100) : 0;
      
      console.log(`\n${category.toUpperCase()}:`);
      console.log(`   Total tested: ${total}`);
      console.log(`   Successful: ${results.success} (${successRate}%)`);
      console.log(`   Failed: ${results.failed}`);
      
      if (results.samples.length > 0) {
        console.log(`   Sample successes:`);
        results.samples.forEach((sample, i) => {
          console.log(`     ${i + 1}. ${sample.person} → ${sample.coresignal.name}`);
        });
      }
    });
    
    console.log('\n🎯 RECOMMENDATION:');
    const linkedinSuccess = this.testResults.linkedinOnly.success;
    const emailSuccess = this.testResults.emailOnly.success;
    const bothSuccess = this.testResults.bothData.success;
    
    if (linkedinSuccess > 0) {
      console.log('   ✅ LinkedIn-based enrichment shows promise');
    }
    if (emailSuccess > 0) {
      console.log('   ✅ Email-based enrichment shows promise');
    }
    if (bothSuccess > 0) {
      console.log('   ✅ Combined enrichment shows promise');
    }
    
    const totalSuccess = linkedinSuccess + emailSuccess + bothSuccess;
    if (totalSuccess > 0) {
      console.log(`   🚀 Ready to proceed with full enrichment (${totalSuccess} successful tests)`);
    } else {
      console.log('   ⚠️  Consider reviewing search strategies before full enrichment');
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the test
async function main() {
  const tester = new TestCoreSignalEnrichment();
  await tester.testEnrichment();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = TestCoreSignalEnrichment;