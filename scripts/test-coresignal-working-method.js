#!/usr/bin/env node

/**
 * 🔍 CORESIGNAL WORKING METHOD TEST
 * 
 * Test CoreSignal API using the correct POST/es_dsl method that was working before
 */

require('dotenv').config();

class CoreSignalWorkingMethodTest {
  constructor() {
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.baseUrl = 'https://api.coresignal.com/cdapi/v2';
  }

  async testWorkingMethod() {
    console.log('🔍 TESTING CORESIGNAL WORKING METHOD (POST/es_dsl)');
    console.log('==================================================');
    
    if (!this.apiKey) {
      console.log('❌ CORESIGNAL_API_KEY not found in environment');
      return;
    }
    
    console.log('API Key loaded:', this.apiKey ? 'Yes' : 'No');
    console.log('');
    
    // Test 1: Search by name and company (like the working scripts)
    await this.testSearchByNameAndCompany();
    
    // Test 2: Search by LinkedIn URL
    await this.testSearchByLinkedIn();
    
    // Test 3: Search by email
    await this.testSearchByEmail();
  }

  async testSearchByNameAndCompany() {
    console.log('🔍 TEST 1: SEARCH BY NAME AND COMPANY (POST/es_dsl)');
    console.log('===================================================');
    
    try {
      // Use the exact working pattern from your scripts
      const searchQuery = {
        query: {
          bool: {
            must: [
              {
                match: {
                  full_name: 'Jeffrey Sexton'
                }
              },
              {
                nested: {
                  path: 'experience',
                  query: {
                    bool: {
                      should: [
                        { match: { 'experience.company_name': 'Dairyland Power Cooperative' } },
                        { match_phrase: { 'experience.company_name': 'Dairyland Power Cooperative' } },
                      ],
                    },
                  },
                },
              },
            ]
          }
        }
      };

      const searchUrl = `${this.baseUrl}/employee_multi_source/search/es_dsl?items_per_page=5`;
      console.log('Search URL:', searchUrl);
      console.log('Search Query:', JSON.stringify(searchQuery, null, 2));
      
      const searchResponse = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(searchQuery)
      });

      console.log('Search Status:', searchResponse.status, searchResponse.statusText);

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        console.log('✅ Search successful!');
        console.log('Found employee IDs:', searchData);
        
        if (Array.isArray(searchData) && searchData.length > 0) {
          const employeeId = searchData[0];
          console.log('Employee ID found:', employeeId);
          
          // Test collect endpoint
          await this.testCollectEndpoint(employeeId);
        } else {
          console.log('❌ No employee IDs returned');
        }
      } else {
        const errorText = await searchResponse.text();
        console.log('❌ Search Error:', errorText.substring(0, 200));
      }
    } catch (error) {
      console.log('❌ Exception:', error.message);
    }
    
    console.log('');
  }

  async testSearchByLinkedIn() {
    console.log('🔍 TEST 2: SEARCH BY LINKEDIN URL (POST/es_dsl)');
    console.log('===============================================');
    
    try {
      const searchQuery = {
        query: {
          bool: {
            must: [
              {
                match: {
                  linkedin_url: 'https://www.linkedin.com/in/jeffrey-sexton-362b6829'
                }
              }
            ]
          }
        }
      };

      const searchUrl = `${this.baseUrl}/employee_multi_source/search/es_dsl?items_per_page=5`;
      console.log('Search URL:', searchUrl);
      console.log('Search Query:', JSON.stringify(searchQuery, null, 2));
      
      const searchResponse = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(searchQuery)
      });

      console.log('Search Status:', searchResponse.status, searchResponse.statusText);

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        console.log('✅ Search successful!');
        console.log('Found employee IDs:', searchData);
        
        if (Array.isArray(searchData) && searchData.length > 0) {
          const employeeId = searchData[0];
          console.log('Employee ID found:', employeeId);
          
          // Test collect endpoint
          await this.testCollectEndpoint(employeeId);
        } else {
          console.log('❌ No employee IDs returned');
        }
      } else {
        const errorText = await searchResponse.text();
        console.log('❌ Search Error:', errorText.substring(0, 200));
      }
    } catch (error) {
      console.log('❌ Exception:', error.message);
    }
    
    console.log('');
  }

  async testSearchByEmail() {
    console.log('🔍 TEST 3: SEARCH BY EMAIL (POST/es_dsl)');
    console.log('=========================================');
    
    try {
      const searchQuery = {
        query: {
          bool: {
            must: [
              {
                match: {
                  primary_professional_email: 'jeffrey.sexton@dairylandpower.com'
                }
              }
            ]
          }
        }
      };

      const searchUrl = `${this.baseUrl}/employee_multi_source/search/es_dsl?items_per_page=5`;
      console.log('Search URL:', searchUrl);
      console.log('Search Query:', JSON.stringify(searchQuery, null, 2));
      
      const searchResponse = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(searchQuery)
      });

      console.log('Search Status:', searchResponse.status, searchResponse.statusText);

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        console.log('✅ Search successful!');
        console.log('Found employee IDs:', searchData);
        
        if (Array.isArray(searchData) && searchData.length > 0) {
          const employeeId = searchData[0];
          console.log('Employee ID found:', employeeId);
          
          // Test collect endpoint
          await this.testCollectEndpoint(employeeId);
        } else {
          console.log('❌ No employee IDs returned');
        }
      } else {
        const errorText = await searchResponse.text();
        console.log('❌ Search Error:', errorText.substring(0, 200));
      }
    } catch (error) {
      console.log('❌ Exception:', error.message);
    }
    
    console.log('');
  }

  async testCollectEndpoint(employeeId) {
    console.log('🔍 TESTING COLLECT ENDPOINT');
    console.log('===========================');
    
    try {
      const collectUrl = `${this.baseUrl}/employee_multi_source/collect/${employeeId}`;
      console.log('Collect URL:', collectUrl);
      
      const collectResponse = await fetch(collectUrl, {
        method: 'GET',
        headers: { 
          'apikey': this.apiKey,
          'Accept': 'application/json'
        }
      });

      console.log('Collect Status:', collectResponse.status, collectResponse.statusText);

      if (collectResponse.ok) {
        const profileData = await collectResponse.json();
        console.log('✅ Collect successful!');
        console.log('Name:', profileData.full_name || 'Not found');
        console.log('Title:', profileData.active_experience_title || 'Not found');
        console.log('Company:', profileData.active_experience_company || 'Not found');
        console.log('Email:', profileData.primary_professional_email || 'Not found');
        console.log('Phone:', profileData.phone || 'Not found');
        console.log('LinkedIn:', profileData.linkedin_url || 'Not found');
        console.log('Location:', profileData.location || 'Not found');
      } else {
        const errorText = await collectResponse.text();
        console.log('❌ Collect Error:', errorText.substring(0, 200));
      }
    } catch (error) {
      console.log('❌ Collect Exception:', error.message);
    }
    
    console.log('');
  }
}

// Run the test
async function main() {
  const tester = new CoreSignalWorkingMethodTest();
  await tester.testWorkingMethod();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CoreSignalWorkingMethodTest;
