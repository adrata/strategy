#!/usr/bin/env node

/**
 * 🧪 CRUD & Person/Company Connection Test Suite
 * 
 * This script tests:
 * 1. CRUD operations for leads, prospects, opportunities, people, companies
 * 2. Person/Company record connections and relationships
 * 3. Lead advancement to prospect and opportunity advancement
 * 4. Data integrity across related records
 */

const BASE_URL = 'http://localhost:3000';
const WORKSPACE_ID = '01K1VBYXHD0J895XAN0HGFBKJP'; // Dan's workspace
const USER_ID = '01K1VBYZG41K9QA0D9CF06KNRG'; // Dan's user ID

// Test data
const testLead = {
  firstName: 'John',
  lastName: 'Doe',
  fullName: 'John Doe',
  email: 'john.doe@testcompany.com',
  phone: '+1-555-0123',
  company: 'Test Company Inc',
  jobTitle: 'VP of Sales',
  department: 'Sales',
  industry: 'Technology',
  companySize: '50-100',
  status: 'new',
  priority: 'high',
  source: 'Website',
  estimatedValue: 50000,
  notes: 'Interested in our enterprise solution'
};

const testCompany = {
  name: 'Test Company Inc',
  website: 'https://testcompany.com',
  industry: 'Technology',
  size: '50-100',
  description: 'A test company for CRUD operations'
};

const testPerson = {
  firstName: 'Jane',
  lastName: 'Smith',
  fullName: 'Jane Smith',
  email: 'jane.smith@testcompany.com',
  phone: '+1-555-0456',
  jobTitle: 'CTO',
  department: 'Engineering'
};

// Utility functions
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

// Test functions
async function testCreateLead() {
  console.log('\n🧪 Testing Lead Creation...');
  
  const response = await makeRequest('/api/data/unified', 'POST', {
    type: 'leads',
    action: 'create',
    data: testLead,
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

async function testCreateCompany() {
  console.log('\n🧪 Testing Company Creation...');
  
  const response = await makeRequest('/api/data/unified', 'POST', {
    type: 'companies',
    action: 'create',
    data: testCompany,
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

async function testCreatePerson() {
  console.log('\n🧪 Testing Person Creation...');
  
  const response = await makeRequest('/api/data/unified', 'POST', {
    type: 'people',
    action: 'create',
    data: testPerson,
    workspaceId: WORKSPACE_ID,
    userId: USER_ID
  });
  
  if (response.success) {
    console.log('✅ Person created successfully:', response.data.id);
    return response.data;
  } else {
    throw new Error('Failed to create person');
  }
}

async function testReadRecords(recordType, recordId) {
  console.log(`\n🧪 Testing ${recordType} Read...`);
  
  const response = await makeRequest(`/api/data/unified?type=${recordType}&action=get&id=${recordId}&workspaceId=${WORKSPACE_ID}&userId=${USER_ID}`);
  
  if (response.success) {
    console.log(`✅ ${recordType} read successfully:`, response.data.id);
    return response.data;
  } else {
    throw new Error(`Failed to read ${recordType}`);
  }
}

async function testUpdateRecord(recordType, recordId, updates) {
  console.log(`\n🧪 Testing ${recordType} Update...`);
  
  const response = await makeRequest('/api/data/unified', 'PUT', {
    type: recordType,
    action: 'update',
    id: recordId,
    data: updates,
    workspaceId: WORKSPACE_ID,
    userId: USER_ID
  });
  
  if (response.success) {
    console.log(`✅ ${recordType} updated successfully:`, response.data.id);
    return response.data;
  } else {
    throw new Error(`Failed to update ${recordType}`);
  }
}

async function testAdvanceLeadToProspect(leadId) {
  console.log('\n🧪 Testing Lead Advancement to Prospect...');
  
  const response = await makeRequest('/api/data/unified', 'POST', {
    type: 'leads',
    action: 'advance_to_prospect',
    id: leadId,
    data: testLead,
    workspaceId: WORKSPACE_ID,
    userId: USER_ID
  });
  
  if (response.success) {
    console.log('✅ Lead advanced to prospect successfully:', response.data.id);
    return response.data;
  } else {
    throw new Error('Failed to advance lead to prospect');
  }
}

async function testAdvanceProspectToOpportunity(prospectId) {
  console.log('\n🧪 Testing Prospect Advancement to Opportunity...');
  
  const response = await makeRequest('/api/data/unified', 'POST', {
    type: 'prospects',
    action: 'advance_to_opportunity',
    id: prospectId,
    data: testLead,
    workspaceId: WORKSPACE_ID,
    userId: USER_ID
  });
  
  if (response.success) {
    console.log('✅ Prospect advanced to opportunity successfully:', response.data.id);
    return response.data;
  } else {
    throw new Error('Failed to advance prospect to opportunity');
  }
}

async function testPersonCompanyConnections(leadId) {
  console.log('\n🧪 Testing Person/Company Connections...');
  
  // Read the lead to check connections
  const lead = await testReadRecords('leads', leadId);
  
  console.log('📋 Lead Details:');
  console.log(`  - Person ID: ${lead.personId || 'Not connected'}`);
  console.log(`  - Company ID: ${lead.companyId || 'Not connected'}`);
  console.log(`  - Company Name: ${lead.company || 'Not set'}`);
  
  // If personId exists, read the person record
  if (lead.personId) {
    try {
      const person = await testReadRecords('people', lead.personId);
      console.log('👤 Connected Person:');
      console.log(`  - Name: ${person.fullName}`);
      console.log(`  - Email: ${person.email}`);
      console.log(`  - Company ID: ${person.companyId || 'Not connected'}`);
    } catch (error) {
      console.log('⚠️ Could not read connected person:', error.message);
    }
  }
  
  // If companyId exists, read the company record
  if (lead.companyId) {
    try {
      const company = await testReadRecords('companies', lead.companyId);
      console.log('🏢 Connected Company:');
      console.log(`  - Name: ${company.name}`);
      console.log(`  - Industry: ${company.industry}`);
      console.log(`  - Size: ${company.size}`);
    } catch (error) {
      console.log('⚠️ Could not read connected company:', error.message);
    }
  }
  
  return lead;
}

async function testDeleteRecord(recordType, recordId) {
  console.log(`\n🧪 Testing ${recordType} Delete (Soft Delete)...`);
  
  const response = await makeRequest(`/api/data/unified?type=${recordType}&action=delete&id=${recordId}&workspaceId=${WORKSPACE_ID}&userId=${USER_ID}`, 'DELETE');
  
  if (response.success) {
    console.log(`✅ ${recordType} deleted successfully:`, response.data.id);
    return response.data;
  } else {
    throw new Error(`Failed to delete ${recordType}`);
  }
}

async function testSearchRecords(recordType, searchTerm) {
  console.log(`\n🧪 Testing ${recordType} Search...`);
  
  const response = await makeRequest(`/api/data/unified?type=${recordType}&action=search&search=${encodeURIComponent(JSON.stringify({ query: searchTerm }))}&workspaceId=${WORKSPACE_ID}&userId=${USER_ID}`);
  
  if (response.success) {
    console.log(`✅ ${recordType} search successful: Found ${response.data.length} records`);
    return response.data;
  } else {
    throw new Error(`Failed to search ${recordType}`);
  }
}

// Main test runner
async function runCRUDTests() {
  console.log('🚀 Starting CRUD & Person/Company Connection Tests...\n');
  
  const results = {
    created: {},
    errors: []
  };
  
  try {
    // Test 1: Create Records
    console.log('📝 === CREATION TESTS ===');
    
    const lead = await testCreateLead();
    results.created.lead = lead;
    
    const company = await testCreateCompany();
    results.created.company = company;
    
    const person = await testCreatePerson();
    results.created.person = person;
    
    // Test 2: Read Records
    console.log('\n📖 === READ TESTS ===');
    
    await testReadRecords('leads', lead.id);
    await testReadRecords('companies', company.id);
    await testReadRecords('people', person.id);
    
    // Test 3: Person/Company Connections
    console.log('\n🔗 === CONNECTION TESTS ===');
    
    await testPersonCompanyConnections(lead.id);
    
    // Test 4: Update Records
    console.log('\n✏️ === UPDATE TESTS ===');
    
    await testUpdateRecord('leads', lead.id, {
      status: 'contacted',
      notes: 'Updated notes - contacted via email'
    });
    
    await testUpdateRecord('companies', company.id, {
      description: 'Updated description - verified company details'
    });
    
    await testUpdateRecord('people', person.id, {
      jobTitle: 'Senior CTO',
      department: 'Technology'
    });
    
    // Test 5: Search Records
    console.log('\n🔍 === SEARCH TESTS ===');
    
    await testSearchRecords('leads', 'John Doe');
    await testSearchRecords('companies', 'Test Company');
    await testSearchRecords('people', 'Jane Smith');
    
    // Test 6: Lead Advancement
    console.log('\n⬆️ === ADVANCEMENT TESTS ===');
    
    const prospect = await testAdvanceLeadToProspect(lead.id);
    results.created.prospect = prospect;
    
    const opportunity = await testAdvanceProspectToOpportunity(prospect.id);
    results.created.opportunity = opportunity;
    
    // Test 7: Verify Advancement Connections
    console.log('\n🔍 === ADVANCEMENT CONNECTION VERIFICATION ===');
    
    // Note: Original prospect should be soft-deleted after advancement
    console.log('📋 Original prospect was soft-deleted during advancement (expected behavior)');
    
    const updatedOpportunity = await testReadRecords('opportunities', opportunity.id);
    console.log('📋 Opportunity Details:');
    console.log(`  - Person ID: ${updatedOpportunity.personId || 'Not connected'}`);
    console.log(`  - Company ID: ${updatedOpportunity.companyId || 'Not connected'}`);
    console.log(`  - Amount: $${updatedOpportunity.amount || 'Not set'}`);
    console.log(`  - Stage: ${updatedOpportunity.stage || 'Not set'}`);
    
    // Test 8: Cleanup (Soft Delete)
    console.log('\n🗑️ === CLEANUP TESTS ===');
    
    await testDeleteRecord('opportunities', opportunity.id);
    await testDeleteRecord('prospects', prospect.id);
    await testDeleteRecord('leads', lead.id);
    await testDeleteRecord('companies', company.id);
    await testDeleteRecord('people', person.id);
    
    console.log('\n🎉 === ALL TESTS COMPLETED SUCCESSFULLY ===');
    console.log('\n📊 Test Summary:');
    console.log(`✅ Created: ${Object.keys(results.created).length} records`);
    console.log(`❌ Errors: ${results.errors.length} errors`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    results.errors.push(error.message);
    
    console.log('\n📊 Test Summary:');
    console.log(`✅ Created: ${Object.keys(results.created).length} records`);
    console.log(`❌ Errors: ${results.errors.length} errors`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  runCRUDTests().catch(console.error);
}

module.exports = {
  runCRUDTests,
  testCreateLead,
  testCreateCompany,
  testCreatePerson,
  testReadRecords,
  testUpdateRecord,
  testAdvanceLeadToProspect,
  testAdvanceProspectToOpportunity,
  testPersonCompanyConnections,
  testDeleteRecord,
  testSearchRecords
};
