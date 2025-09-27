#!/usr/bin/env node

/**
 * 🔍 CORESIGNAL SEARCH AND COLLECT TEST
 * 
 * Test CoreSignal API using the correct search -> collect workflow
 */

require('dotenv').config();

class CoreSignalSearchCollectTest {
  constructor() {
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.baseUrl = 'https://api.coresignal.com/cdapi/v2';
  }

  async testSearchAndCollect() {
    console.log('🔍 TESTING CORESIGNAL SEARCH AND COLLECT WORKFLOW');
    console.log('=================================================');
    
    if (!this.apiKey) {
      console.log('❌ CORESIGNAL_API_KEY not found in environment');
      return;
    }
    
    console.log('API Key loaded:', this.apiKey ? 'Yes' : 'No');
    console.log('');
    
    // Test 1: Search for person by LinkedIn URL
    await this.testPersonSearchByLinkedIn();
    
    // Test 2: Search for person by name and company
    await this.testPersonSearchByNameAndCompany();
    
    // Test 3: Search for person by name only
    await this.testPersonSearchByName();
    
    // Test 4: Search for person by email
    await this.testPersonSearchByEmail();
  }

  async testPersonSearchByLinkedIn() {
    console.log('🔍 TEST 1: SEARCH PERSON BY LINKEDIN URL');
    console.log('=======================================');
    
    const linkedinUrl = 'https://www.linkedin.com/in/jeffrey-sexton-362b6829';
    
    try {
      // Step 1: Search for the person
      const searchUrl = `${this.baseUrl}/person_multi_source/search?linkedin_url=${encodeURIComponent(linkedinUrl)}&limit=1`;
      console.log('Step 1: Searching for person...');
      console.log('Search URL:', searchUrl);
      
      const searchResponse = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
          'accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Search Status:', searchResponse.status, searchResponse.statusText);
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        console.log('✅ Search successful!');
        console.log('Found', searchData.data?.length || 0, 'results');
        
        if (searchData.data && searchData.data.length > 0) {
          const personId = searchData.data[0].id;
          console.log('Person ID found:', personId);
          
          // Step 2: Collect detailed data
          const collectUrl = `${this.baseUrl}/person_multi_source/collect/${personId}`;
          console.log('\\nStep 2: Collecting detailed data...');
          console.log('Collect URL:', collectUrl);
          
          const collectResponse = await fetch(collectUrl, {
            method: 'GET',
            headers: {
              'apikey': this.apiKey,
              'accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
          
          console.log('Collect Status:', collectResponse.status, collectResponse.statusText);
          
          if (collectResponse.ok) {
            const collectData = await collectResponse.json();
            console.log('✅ Collect successful!');
            console.log('Name:', collectData.full_name || 'Not found');
            console.log('Title:', collectData.active_experience_title || 'Not found');
            console.log('Company:', collectData.active_experience_company || 'Not found');
            console.log('Email:', collectData.primary_professional_email || 'Not found');
            console.log('Phone:', collectData.phone || 'Not found');
            console.log('LinkedIn:', collectData.linkedin_url || 'Not found');
            console.log('Location:', collectData.location || 'Not found');
          } else {
            const errorText = await collectResponse.text();
            console.log('❌ Collect Error:', errorText.substring(0, 200));
          }
        } else {
          console.log('❌ No person found in search results');
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

  async testPersonSearchByNameAndCompany() {
    console.log('🔍 TEST 2: SEARCH PERSON BY NAME AND COMPANY');
    console.log('============================================');
    
    try {
      // Step 1: Search for the person
      const searchUrl = `${this.baseUrl}/person_multi_source/search?name=Jeffrey Sexton&company=Dairyland Power Cooperative&limit=1`;
      console.log('Step 1: Searching for person...');
      console.log('Search URL:', searchUrl);
      
      const searchResponse = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
          'accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Search Status:', searchResponse.status, searchResponse.statusText);
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        console.log('✅ Search successful!');
        console.log('Found', searchData.data?.length || 0, 'results');
        
        if (searchData.data && searchData.data.length > 0) {
          const personId = searchData.data[0].id;
          console.log('Person ID found:', personId);
          
          // Step 2: Collect detailed data
          const collectUrl = `${this.baseUrl}/person_multi_source/collect/${personId}`;
          console.log('\\nStep 2: Collecting detailed data...');
          console.log('Collect URL:', collectUrl);
          
          const collectResponse = await fetch(collectUrl, {
            method: 'GET',
            headers: {
              'apikey': this.apiKey,
              'accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
          
          console.log('Collect Status:', collectResponse.status, collectResponse.statusText);
          
          if (collectResponse.ok) {
            const collectData = await collectResponse.json();
            console.log('✅ Collect successful!');
            console.log('Name:', collectData.full_name || 'Not found');
            console.log('Title:', collectData.active_experience_title || 'Not found');
            console.log('Company:', collectData.active_experience_company || 'Not found');
            console.log('Email:', collectData.primary_professional_email || 'Not found');
            console.log('Phone:', collectData.phone || 'Not found');
            console.log('LinkedIn:', collectData.linkedin_url || 'Not found');
            console.log('Location:', collectData.location || 'Not found');
          } else {
            const errorText = await collectResponse.text();
            console.log('❌ Collect Error:', errorText.substring(0, 200));
          }
        } else {
          console.log('❌ No person found in search results');
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

  async testPersonSearchByName() {
    console.log('🔍 TEST 3: SEARCH PERSON BY NAME ONLY');
    console.log('=====================================');
    
    try {
      // Step 1: Search for the person
      const searchUrl = `${this.baseUrl}/person_multi_source/search?name=Jeffrey Sexton&limit=1`;
      console.log('Step 1: Searching for person...');
      console.log('Search URL:', searchUrl);
      
      const searchResponse = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
          'accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Search Status:', searchResponse.status, searchResponse.statusText);
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        console.log('✅ Search successful!');
        console.log('Found', searchData.data?.length || 0, 'results');
        
        if (searchData.data && searchData.data.length > 0) {
          const personId = searchData.data[0].id;
          console.log('Person ID found:', personId);
          
          // Step 2: Collect detailed data
          const collectUrl = `${this.baseUrl}/person_multi_source/collect/${personId}`;
          console.log('\\nStep 2: Collecting detailed data...');
          console.log('Collect URL:', collectUrl);
          
          const collectResponse = await fetch(collectUrl, {
            method: 'GET',
            headers: {
              'apikey': this.apiKey,
              'accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
          
          console.log('Collect Status:', collectResponse.status, collectResponse.statusText);
          
          if (collectResponse.ok) {
            const collectData = await collectResponse.json();
            console.log('✅ Collect successful!');
            console.log('Name:', collectData.full_name || 'Not found');
            console.log('Title:', collectData.active_experience_title || 'Not found');
            console.log('Company:', collectData.active_experience_company || 'Not found');
            console.log('Email:', collectData.primary_professional_email || 'Not found');
            console.log('Phone:', collectData.phone || 'Not found');
            console.log('LinkedIn:', collectData.linkedin_url || 'Not found');
            console.log('Location:', collectData.location || 'Not found');
          } else {
            const errorText = await collectResponse.text();
            console.log('❌ Collect Error:', errorText.substring(0, 200));
          }
        } else {
          console.log('❌ No person found in search results');
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

  async testPersonSearchByEmail() {
    console.log('🔍 TEST 4: SEARCH PERSON BY EMAIL');
    console.log('==================================');
    
    try {
      // Step 1: Search for the person
      const searchUrl = `${this.baseUrl}/person_multi_source/search?email=jeffrey.sexton@dairylandpower.com&limit=1`;
      console.log('Step 1: Searching for person...');
      console.log('Search URL:', searchUrl);
      
      const searchResponse = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
          'accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Search Status:', searchResponse.status, searchResponse.statusText);
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        console.log('✅ Search successful!');
        console.log('Found', searchData.data?.length || 0, 'results');
        
        if (searchData.data && searchData.data.length > 0) {
          const personId = searchData.data[0].id;
          console.log('Person ID found:', personId);
          
          // Step 2: Collect detailed data
          const collectUrl = `${this.baseUrl}/person_multi_source/collect/${personId}`;
          console.log('\\nStep 2: Collecting detailed data...');
          console.log('Collect URL:', collectUrl);
          
          const collectResponse = await fetch(collectUrl, {
            method: 'GET',
            headers: {
              'apikey': this.apiKey,
              'accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
          
          console.log('Collect Status:', collectResponse.status, collectResponse.statusText);
          
          if (collectResponse.ok) {
            const collectData = await collectResponse.json();
            console.log('✅ Collect successful!');
            console.log('Name:', collectData.full_name || 'Not found');
            console.log('Title:', collectData.active_experience_title || 'Not found');
            console.log('Company:', collectData.active_experience_company || 'Not found');
            console.log('Email:', collectData.primary_professional_email || 'Not found');
            console.log('Phone:', collectData.phone || 'Not found');
            console.log('LinkedIn:', collectData.linkedin_url || 'Not found');
            console.log('Location:', collectData.location || 'Not found');
          } else {
            const errorText = await collectResponse.text();
            console.log('❌ Collect Error:', errorText.substring(0, 200));
          }
        } else {
          console.log('❌ No person found in search results');
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
}

// Run the test
async function main() {
  const tester = new CoreSignalSearchCollectTest();
  await tester.testSearchAndCollect();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CoreSignalSearchCollectTest;
