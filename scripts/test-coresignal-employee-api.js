#!/usr/bin/env node

/**
 * 🔍 CORESIGNAL EMPLOYEE API TEST
 * 
 * Test CoreSignal Employee API for person enrichment
 */

require('dotenv').config();

class CoreSignalEmployeeAPITest {
  constructor() {
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.baseUrl = 'https://api.coresignal.com/cdapi/v2';
  }

  async testEmployeeAPI() {
    console.log('🔍 TESTING CORESIGNAL EMPLOYEE API');
    console.log('===================================');
    
    if (!this.apiKey) {
      console.log('❌ CORESIGNAL_API_KEY not found in environment');
      return;
    }
    
    console.log('API Key loaded:', this.apiKey ? 'Yes' : 'No');
    console.log('');
    
    // Test 1: Employee search by LinkedIn URL
    await this.testEmployeeSearchByLinkedIn();
    
    // Test 2: Employee search by name and company
    await this.testEmployeeSearchByNameAndCompany();
    
    // Test 3: Employee search by email
    await this.testEmployeeSearchByEmail();
    
    // Test 4: Employee collect endpoint
    await this.testEmployeeCollect();
  }

  async testEmployeeSearchByLinkedIn() {
    console.log('🔍 TEST 1: EMPLOYEE SEARCH BY LINKEDIN URL');
    console.log('==========================================');
    
    const linkedinUrl = 'https://www.linkedin.com/in/jeffrey-sexton-362b6829';
    
    try {
      const url = `${this.baseUrl}/employee_multi_source/search?linkedin_url=${encodeURIComponent(linkedinUrl)}&limit=1`;
      console.log('Testing LinkedIn URL search...');
      console.log('URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
          'accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Status:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ SUCCESS: Employee search by LinkedIn working');
        console.log('Data:', JSON.stringify(data, null, 2));
      } else {
        const errorText = await response.text();
        console.log('❌ Error:', errorText.substring(0, 200));
      }
    } catch (error) {
      console.log('❌ Exception:', error.message);
    }
    
    console.log('');
  }

  async testEmployeeSearchByNameAndCompany() {
    console.log('🔍 TEST 2: EMPLOYEE SEARCH BY NAME AND COMPANY');
    console.log('==============================================');
    
    try {
      const url = `${this.baseUrl}/employee_multi_source/search?name=Jeffrey Sexton&company=Dairyland Power Cooperative&limit=1`;
      console.log('Testing name + company search...');
      console.log('URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
          'accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Status:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ SUCCESS: Employee search by name + company working');
        console.log('Data:', JSON.stringify(data, null, 2));
      } else {
        const errorText = await response.text();
        console.log('❌ Error:', errorText.substring(0, 200));
      }
    } catch (error) {
      console.log('❌ Exception:', error.message);
    }
    
    console.log('');
  }

  async testEmployeeSearchByEmail() {
    console.log('🔍 TEST 3: EMPLOYEE SEARCH BY EMAIL');
    console.log('====================================');
    
    try {
      const url = `${this.baseUrl}/employee_multi_source/search?email=jeffrey.sexton@dairylandpower.com&limit=1`;
      console.log('Testing email search...');
      console.log('URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
          'accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Status:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ SUCCESS: Employee search by email working');
        console.log('Data:', JSON.stringify(data, null, 2));
      } else {
        const errorText = await response.text();
        console.log('❌ Error:', errorText.substring(0, 200));
      }
    } catch (error) {
      console.log('❌ Exception:', error.message);
    }
    
    console.log('');
  }

  async testEmployeeCollect() {
    console.log('🔍 TEST 4: EMPLOYEE COLLECT ENDPOINT');
    console.log('===================================');
    
    // First try to get an employee ID from search
    try {
      const searchUrl = `${this.baseUrl}/employee_multi_source/search?name=Jeffrey Sexton&limit=1`;
      console.log('First, searching for employee...');
      
      const searchResponse = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
          'accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        console.log('Search successful, found employees:', searchData.data?.length || 0);
        
        if (searchData.data && searchData.data.length > 0) {
          const employeeId = searchData.data[0].id;
          console.log('Employee ID found:', employeeId);
          
          // Now try to collect detailed data
          const collectUrl = `${this.baseUrl}/employee_multi_source/collect/${employeeId}`;
          console.log('Collecting detailed data...');
          console.log('URL:', collectUrl);
          
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
            console.log('✅ SUCCESS: Employee collect working');
            console.log('Detailed Data:', JSON.stringify(collectData, null, 2));
          } else {
            const errorText = await collectResponse.text();
            console.log('❌ Collect Error:', errorText.substring(0, 200));
          }
        } else {
          console.log('❌ No employees found in search');
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
  const tester = new CoreSignalEmployeeAPITest();
  await tester.testEmployeeAPI();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CoreSignalEmployeeAPITest;
