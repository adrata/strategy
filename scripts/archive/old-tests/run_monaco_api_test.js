#!/usr/bin/env node

/**
 * Monaco API Test Runner for Shortcut Software Inc.
 * 
 * This script calls the Monaco API to run analysis on the smallest company
 * from the 360 list, targeting sales leaders and decision makers.
 */

const https = require('https');
const http = require('http');

const SHORTCUT_COMPANY_DATA = {
  name: 'Shortcut Software Inc.',
  alternativeNames: ['Clubhouse', 'Shortcut'],
  website: 'shortcut.com',
  linkedinUrl: 'https://www.linkedin.com/company/shortcut-software/',
  industry: 'Project Management Software',
  sizeCategory: 'M3',
  employees: 120,
  revenue: '$10M',
  description: 'Agile project management platform for software teams',
  complexSalesDescription: 'Often adopted by engineering orgs (VP Engineering, product managers) at tech companies; relatively low-complexity SaaS sale focusing on developer-friendly features, land-and-expand growth with per-user pricing'
};

async function makeRequest(url, data = null) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https:');
    const client = isHttps ? https : http;
    
    const options = {
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Monaco-Test/1.0'
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = client.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            data: parsed
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function checkMonacoStatus() {
  console.log('🔍 Checking Monaco pipeline status...');
  
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://adrata-production.vercel.app'
    : 'http://localhost:3000';
    
  const statusUrl = `${baseUrl}/api/monaco?type=status&workspaceId=adrata&userId=dan`;
  
  try {
    const response = await makeRequest(statusUrl);
    console.log(`Status Code: ${response.statusCode}`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response;
  } catch (error) {
    console.error('Error checking Monaco status:', error.message);
    return null;
  }
}

async function searchShortcutCompany() {
  console.log('🔍 Searching for Shortcut Software Inc. in Monaco...');
  
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://adrata-production.vercel.app'
    : 'http://localhost:3000';
    
  const searchUrl = `${baseUrl}/api/monaco?type=search&workspaceId=adrata&userId=dan&companyName=Shortcut Software Inc`;
  
  try {
    const response = await makeRequest(searchUrl);
    console.log(`Status Code: ${response.statusCode}`);
    
    if (response.statusCode === 200 && response.data.success) {
      console.log('✅ Company found in Monaco database!');
      console.log(`Companies found: ${response.data.companies?.length || 0}`);
      
      if (response.data.companies && response.data.companies.length > 0) {
        const company = response.data.companies[0];
        console.log('\n📊 Company Details:');
        console.log(`Name: ${company.name || 'N/A'}`);
        console.log(`Industry: ${company.industry || 'N/A'}`);
        console.log(`Employees: ${company.employees || 'N/A'}`);
        console.log(`Website: ${company.website || 'N/A'}`);
        
        // Look for people data
        if (company.people && company.people.length > 0) {
          console.log(`\n👥 People found: ${company.people.length}`);
          
          // Filter for sales-related roles
          const salesPeople = company.people.filter(person => {
            const title = (person.title || '').toLowerCase();
            return title.includes('sales') || 
                   title.includes('business development') || 
                   title.includes('revenue') ||
                   title.includes('account') ||
                   title.includes('customer success');
          });
          
          // Filter for leadership roles
          const salesLeaders = salesPeople.filter(person => {
            const title = (person.title || '').toLowerCase();
            return title.includes('vp') ||
                   title.includes('director') ||
                   title.includes('head') ||
                   title.includes('manager') ||
                   title.includes('chief');
          });
          
          console.log(`Sales-Related People: ${salesPeople.length}`);
          console.log(`Sales Leaders: ${salesLeaders.length}`);
          
          if (salesLeaders.length > 0) {
            console.log('\n🎯 TOP SALES TARGETS:');
            console.log('-'.repeat(40));
            
            salesLeaders.slice(0, 5).forEach((person, index) => {
              console.log(`${index + 1}. ${person.name || 'Name not available'}`);
              console.log(`   Title: ${person.title || 'Title not available'}`);
              console.log(`   Email: ${person.email || 'Not available'}`);
              console.log(`   LinkedIn: ${person.linkedinUrl || 'Not available'}`);
              console.log('');
            });
          } else if (salesPeople.length > 0) {
            console.log('\n👥 SALES-RELATED CONTACTS:');
            console.log('-'.repeat(40));
            salesPeople.slice(0, 3).forEach((person, index) => {
              console.log(`${index + 1}. ${person.name || 'Name not available'}`);
              console.log(`   Title: ${person.title || 'Title not available'}`);
              console.log('');
            });
          }
        }
        
        return company;
      }
    } else {
      console.log('⚠️ Company not found in Monaco database');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    }
    
    return response;
  } catch (error) {
    console.error('Error searching for company:', error.message);
    return null;
  }
}

async function runMonacoForShortcut() {
  console.log('🎯 Monaco Analysis for Shortcut Software Inc. (Smallest Company in 360 List)');
  console.log('Target: Sales Leaders/Managers (avoiding Sales Ops/Rev Ops)');
  console.log('='.repeat(80));
  
  console.log('📊 Company Details:');
  console.log(`Name: ${SHORTCUT_COMPANY_DATA.name}`);
  console.log(`Website: ${SHORTCUT_COMPANY_DATA.website}`);
  console.log(`Size: ${SHORTCUT_COMPANY_DATA.employees} employees, ${SHORTCUT_COMPANY_DATA.revenue} revenue`);
  console.log(`Industry: ${SHORTCUT_COMPANY_DATA.industry}`);
  console.log('');

  console.log('🎯 Target Configuration:');
  console.log('✅ Targeting: Sales Leaders, Managers, Directors, VPs');
  console.log('❌ Avoiding: Sales Ops, Rev Ops, Analysts, Enablement');
  console.log('');

  // Step 1: Check Monaco status
  console.log('Step 1: Checking Monaco pipeline status...');
  const statusResult = await checkMonacoStatus();
  
  if (!statusResult) {
    console.log('❌ Failed to connect to Monaco API');
    return;
  }
  
  console.log('');
  
  // Step 2: Search for Shortcut Software Inc.
  console.log('Step 2: Searching for Shortcut Software Inc. in Monaco...');
  const searchResult = await searchShortcutCompany();
  
  if (!searchResult) {
    console.log('❌ Failed to search for company');
    return;
  }
  
  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `monaco_shortcut_analysis_${timestamp}.json`;
  
  const fullResults = {
    timestamp: new Date().toISOString(),
    company: SHORTCUT_COMPANY_DATA,
    statusCheck: statusResult,
    searchResults: searchResult,
    targetConfiguration: {
      targeting: ['Sales Leaders', 'Managers', 'Directors', 'VPs'],
      avoiding: ['Sales Ops', 'Rev Ops', 'Analysts', 'Enablement']
    }
  };
  
  require('fs').writeFileSync(filename, JSON.stringify(fullResults, null, 2));
  console.log(`\n💾 Results saved to: ${filename}`);
  
  console.log('\n✅ Monaco analysis completed');
}

// Run the analysis
if (require.main === module) {
  runMonacoForShortcut()
    .then(() => {
      console.log('✅ Monaco API test completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Monaco API test failed:', error);
      process.exit(1);
    });
}

module.exports = { runMonacoForShortcut }; 