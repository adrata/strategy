#!/usr/bin/env node

/**
 * 🧪 Simple CRUD Test
 * Tests basic CRUD operations without complex data
 */

const BASE_URL = 'http://localhost:3000';
const WORKSPACE_ID = '01K1VBYXHD0J895XAN0HGFBKJP'; // Dan's workspace
const USER_ID = '01K1VBYZG41K9QA0D9CF06KNRG'; // Dan's user ID

// Simple test data
const simpleLead = {
  firstName: 'John',
  lastName: 'Doe',
  fullName: 'John Doe',
  email: 'john@test.com',
  company: 'Test Corp',
  status: 'new'
};

async function makeRequest(endpoint, method = 'GET', body = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || response.statusText}`);
    }
    
    return data;
  } catch (error) {
    console.error(`❌ Request failed: ${error.message}`);
    throw error;
  }
}

async function testSimpleLeadCreation() {
  console.log('🧪 Testing Simple Lead Creation...');
  
  const response = await makeRequest('/api/data/unified', 'POST', {
    type: 'leads',
    action: 'create',
    data: simpleLead,
    workspaceId: WORKSPACE_ID,
    userId: USER_ID
  });
  
  if (response.success) {
    console.log('✅ Lead created successfully:', response.data.id);
    return response.data;
  } else {
    throw new Error('Failed to create lead');
  }
}

async function testSimpleCompanyCreation() {
  console.log('🧪 Testing Simple Company Creation...');
  
  const response = await makeRequest('/api/data/unified', 'POST', {
    type: 'companies',
    action: 'create',
    data: {
      name: 'Test Corp',
      industry: 'Tech'
    },
    workspaceId: WORKSPACE_ID,
    userId: USER_ID
  });
  
  if (response.success) {
    console.log('✅ Company created successfully:', response.data.id);
    return response.data;
  } else {
    throw new Error('Failed to create company');
  }
}

async function runSimpleTests() {
  console.log('🚀 Starting Simple CRUD Tests...\n');
  
  try {
    // Test company creation first
    const company = await testSimpleCompanyCreation();
    
    // Test lead creation
    const lead = await testSimpleLeadCreation();
    
    console.log('\n🎉 Simple tests completed successfully!');
    console.log(`✅ Company ID: ${company.id}`);
    console.log(`✅ Lead ID: ${lead.id}`);
    
  } catch (error) {
    console.error('\n💥 Simple tests failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  runSimpleTests().catch(console.error);
}
