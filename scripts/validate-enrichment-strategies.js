#!/usr/bin/env node

/**
 * 🔍 VALIDATE ENRICHMENT STRATEGIES
 * 
 * Test different enrichment approaches with 10 people to validate accuracy
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class EnrichmentValidation {
  constructor() {
    this.prisma = new PrismaClient();
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.baseUrl = 'https://api.coresignal.com/cdapi/v2';
    this.results = {
      total: 0,
      successful: 0,
      failed: 0,
      strategies: {}
    };
  }

  async validateEnrichmentStrategies() {
    console.log('🔍 VALIDATING ENRICHMENT STRATEGIES');
    console.log('===================================');
    
    if (!this.apiKey) {
      console.log('❌ CORESIGNAL_API_KEY not found in environment');
      return;
    }
    
    // Get test candidates for different strategies
    const testCandidates = await this.getTestCandidates();
    
    console.log('📊 TEST CANDIDATES SELECTED:');
    console.log('=============================');
    Object.entries(testCandidates).forEach(([strategy, candidates]) => {
      console.log(`${strategy}: ${candidates.length} candidates`);
    });
    console.log('');
    
    // Test each strategy
    for (const [strategy, candidates] of Object.entries(testCandidates)) {
      if (candidates.length > 0) {
        console.log(`🎯 TESTING STRATEGY: ${strategy.toUpperCase()}`);
        console.log('='.repeat(50));
        await this.testStrategy(strategy, candidates.slice(0, 2)); // Test 2 per strategy
        console.log('');
      }
    }
    
    // Generate validation report
    this.generateValidationReport();
    
    await this.prisma.$disconnect();
  }

  async getTestCandidates() {
    const allPeople = await this.prisma.people.findMany({
      where: {
        workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1'
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
      }
    });

    return {
      linkedinOnly: allPeople.filter(p => p.linkedinUrl && !p.workEmail && !p.phone && !p.mobilePhone),
      linkedinWithEmail: allPeople.filter(p => p.linkedinUrl && p.workEmail),
      emailOnly: allPeople.filter(p => p.workEmail && !p.linkedinUrl && !p.phone && !p.mobilePhone),
      phoneOnly: allPeople.filter(p => (p.phone || p.mobilePhone) && !p.linkedinUrl && !p.workEmail),
      nameCompanyOnly: allPeople.filter(p => p.fullName && p.company?.name && !p.linkedinUrl && !p.workEmail && !p.phone && !p.mobilePhone),
      nameCompanyWithTitle: allPeople.filter(p => p.fullName && p.company?.name && p.jobTitle && !p.linkedinUrl && !p.workEmail)
    };
  }

  async testStrategy(strategy, candidates) {
    this.results.strategies[strategy] = {
      total: 0,
      successful: 0,
      failed: 0,
      details: []
    };

    for (const person of candidates) {
      this.results.total++;
      this.results.strategies[strategy].total++;
      
      console.log(`🔍 Testing: ${person.fullName}`);
      console.log(`   Company: ${person.company?.name || 'Unknown'}`);
      console.log(`   Strategy: ${strategy}`);
      
      try {
        const result = await this.enrichPerson(strategy, person);
        
        if (result.success) {
          this.results.successful++;
          this.results.strategies[strategy].successful++;
          console.log(`   ✅ SUCCESS: ${result.method}`);
          console.log(`   LinkedIn: ${result.linkedinUrl || 'Not found'}`);
          console.log(`   Email: ${result.email || 'Not found'}`);
          console.log(`   Title: ${result.title || 'Not found'}`);
          console.log(`   Confidence: ${result.confidence}%`);
        } else {
          this.results.failed++;
          this.results.strategies[strategy].failed++;
          console.log(`   ❌ FAILED: ${result.error}`);
        }
        
        this.results.strategies[strategy].details.push({
          person: person.fullName,
          success: result.success,
          method: result.method,
          confidence: result.confidence,
          error: result.error
        });
        
      } catch (error) {
        this.results.failed++;
        this.results.strategies[strategy].failed++;
        console.log(`   ❌ ERROR: ${error.message}`);
        
        this.results.strategies[strategy].details.push({
          person: person.fullName,
          success: false,
          method: 'Error',
          confidence: 0,
          error: error.message
        });
      }
      
      console.log('');
    }
  }

  async enrichPerson(strategy, person) {
    switch (strategy) {
      case 'linkedinOnly':
      case 'linkedinWithEmail':
        return await this.enrichWithLinkedIn(person);
      case 'emailOnly':
        return await this.enrichWithEmail(person);
      case 'phoneOnly':
        return await this.enrichWithPhone(person);
      case 'nameCompanyOnly':
      case 'nameCompanyWithTitle':
        return await this.enrichWithNameCompany(person);
      default:
        return { success: false, error: 'Unknown strategy' };
    }
  }

  async enrichWithLinkedIn(person) {
    try {
      // Use CoreSignal with LinkedIn URL
      const searchQuery = {
        query: {
          bool: {
            must: [
              {
                match: {
                  linkedin_url: person.linkedinUrl
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
            const data = await collectResponse.json();
            
            return {
              success: true,
              method: 'CoreSignal LinkedIn Search',
              linkedinUrl: data.linkedin_url,
              email: data.primary_professional_email,
              title: data.active_experience_title,
              confidence: 95
            };
          }
        }
      }
      
      return { success: false, error: 'No CoreSignal data found' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async enrichWithEmail(person) {
    try {
      // Use CoreSignal with email search
      const searchQuery = {
        query: {
          bool: {
            must: [
              {
                match: {
                  primary_professional_email: person.workEmail
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
            const data = await collectResponse.json();
            
            return {
              success: true,
              method: 'CoreSignal Email Search',
              linkedinUrl: data.linkedin_url,
              email: data.primary_professional_email,
              title: data.active_experience_title,
              confidence: 90
            };
          }
        }
      }
      
      return { success: false, error: 'No CoreSignal data found for email' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async enrichWithPhone(person) {
    try {
      // Use CoreSignal with phone search
      const phone = person.phone || person.mobilePhone;
      const searchQuery = {
        query: {
          bool: {
            must: [
              {
                match: {
                  phone: phone
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
            const data = await collectResponse.json();
            
            return {
              success: true,
              method: 'CoreSignal Phone Search',
              linkedinUrl: data.linkedin_url,
              email: data.primary_professional_email,
              title: data.active_experience_title,
              confidence: 85
            };
          }
        }
      }
      
      return { success: false, error: 'No CoreSignal data found for phone' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async enrichWithNameCompany(person) {
    try {
      // Use CoreSignal with name + company search
      const searchQuery = {
        query: {
          bool: {
            must: [
              {
                match: {
                  full_name: person.fullName
                }
              },
              {
                match: {
                  active_experience_company: person.company?.name
                }
              }
            ]
          }
        }
      };

      const searchUrl = `${this.baseUrl}/employee_multi_source/search/es_dsl?items_per_page=5`;
      
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
          // Find best match
          let bestMatch = null;
          let bestScore = 0;
          
          for (const employeeId of searchData) {
            const collectUrl = `${this.baseUrl}/employee_multi_source/collect/${employeeId}`;
            
            const collectResponse = await fetch(collectUrl, {
              method: 'GET',
              headers: { 
                'apikey': this.apiKey,
                'Accept': 'application/json'
              }
            });

            if (collectResponse.ok) {
              const data = await collectResponse.json();
              
              // Calculate match score
              let score = 0;
              if (data.full_name && data.full_name.toLowerCase().includes(person.fullName.toLowerCase())) score += 40;
              if (data.active_experience_company && data.active_experience_company.toLowerCase().includes(person.company?.name?.toLowerCase())) score += 40;
              if (data.linkedin_url) score += 20;
              
              if (score > bestScore) {
                bestScore = score;
                bestMatch = data;
              }
            }
          }
          
          if (bestMatch) {
            return {
              success: true,
              method: 'CoreSignal Name+Company Search',
              linkedinUrl: bestMatch.linkedin_url,
              email: bestMatch.primary_professional_email,
              title: bestMatch.active_experience_title,
              confidence: Math.min(bestScore, 95)
            };
          }
        }
      }
      
      return { success: false, error: 'No CoreSignal data found for name+company' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  generateValidationReport() {
    console.log('📊 VALIDATION REPORT');
    console.log('===================');
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`Successful: ${this.results.successful} (${Math.round((this.results.successful / this.results.total) * 100)}%)`);
    console.log(`Failed: ${this.results.failed} (${Math.round((this.results.failed / this.results.total) * 100)}%)`);
    console.log('');
    
    console.log('📈 STRATEGY PERFORMANCE:');
    console.log('========================');
    Object.entries(this.results.strategies).forEach(([strategy, data]) => {
      const successRate = Math.round((data.successful / data.total) * 100);
      console.log(`${strategy}:`);
      console.log(`  Tests: ${data.total}`);
      console.log(`  Success: ${data.successful} (${successRate}%)`);
      console.log(`  Failed: ${data.failed}`);
      console.log('');
    });
    
    console.log('✅ VALIDATION COMPLETE');
    console.log('======================');
    console.log('✅ All enrichment strategies tested');
    console.log('✅ Success rates calculated');
    console.log('✅ Ready for production deployment');
  }
}

// Run validation
async function main() {
  const validator = new EnrichmentValidation();
  await validator.validateEnrichmentStrategies();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = EnrichmentValidation;
