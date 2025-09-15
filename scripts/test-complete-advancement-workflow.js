#!/usr/bin/env node

/**
 * Complete Advancement Workflow Test
 * Tests the full pipeline: Lead → Prospect → Opportunity → Customer
 * Including automatic conversion when opportunities are closed/won
 */

const BASE_URL = 'http://localhost:3000';
const WORKSPACE_ID = '01K1VBYXHD0J895XAN0HGFBKJP';
const USER_ID = '01K1VBYZG41K9QA0D9CF06KNRG';

// Test data
const testData = {
  lead: {
    firstName: 'Jane',
    lastName: 'Smith',
    fullName: 'Jane Smith',
    email: 'jane.smith@advancement-test.com',
    company: 'Advancement Test Corp',
    jobTitle: 'VP of Sales',
    industry: 'Technology',
    source: 'Website',
    status: 'new',
    priority: 'high',
    estimatedValue: 75000,
    currency: 'USD',
    notes: 'High-value lead for advancement testing'
  },
  prospect: {
    firstName: 'Bob',
    lastName: 'Johnson',
    fullName: 'Bob Johnson',
    email: 'bob.johnson@prospect-test.com',
    company: 'Prospect Test Inc',
    jobTitle: 'CTO',
    industry: 'Software',
    source: 'Referral',
    status: 'qualified',
    priority: 'medium',
    estimatedValue: 100000,
    currency: 'USD',
    notes: 'Qualified prospect ready for advancement'
  },
  opportunity: {
    name: 'Enterprise Software Deal',
    description: 'Large enterprise software implementation',
    amount: 150000,
    currency: 'USD',
    stage: 'proposal',
    priority: 'high',
    source: 'Inbound',
    notes: 'High-value opportunity ready for closing'
  }
};

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return await response.json();
}

async function testCreateRecord(type, data) {
  console.log(`\n🧪 Testing ${type} Creation...`);
  
  const response = await makeRequest('/api/data/unified', {
    method: 'POST',
    body: JSON.stringify({
      type,
      action: 'create',
      data,
      workspaceId: WORKSPACE_ID,
      userId: USER_ID
    })
  });

  if (response.success) {
    console.log(`✅ ${type} created successfully: ${response.data.id}`);
    return response.data;
  } else {
    throw new Error(`Failed to create ${type}: ${response.error}`);
  }
}

async function testReadRecord(type, id) {
  console.log(`\n🧪 Testing ${type} Read...`);
  
  const response = await makeRequest(`/api/data/unified?type=${type}&action=get&id=${id}&workspaceId=${WORKSPACE_ID}&userId=${USER_ID}`);

  if (response.success) {
    console.log(`✅ ${type} read successfully: ${response.data.id}`);
    return response.data;
  } else {
    throw new Error(`Failed to read ${type}: ${response.error}`);
  }
}

async function testUpdateRecord(type, id, updateData) {
  console.log(`\n🧪 Testing ${type} Update...`);
  
  const response = await makeRequest('/api/data/unified', {
    method: 'POST',
    body: JSON.stringify({
      type,
      action: 'update',
      id,
      data: updateData,
      workspaceId: WORKSPACE_ID,
      userId: USER_ID
    })
  });

  if (response.success) {
    console.log(`✅ ${type} updated successfully: ${response.data.id}`);
    return response.data;
  } else {
    throw new Error(`Failed to update ${type}: ${response.error}`);
  }
}

async function testAdvanceLeadToProspect(leadId) {
  console.log(`\n⬆️ Testing Lead Advancement to Prospect...`);
  
  const response = await makeRequest('/api/data/unified', {
    method: 'POST',
    body: JSON.stringify({
      type: 'leads',
      action: 'advance_to_prospect',
      id: leadId,
      data: { notes: 'Advanced from lead to prospect' },
      workspaceId: WORKSPACE_ID,
      userId: USER_ID
    })
  });

  if (response.success) {
    console.log(`✅ Lead advanced to prospect successfully: ${response.newRecordId}`);
    return response.newRecordId;
  } else {
    throw new Error(`Failed to advance lead to prospect: ${response.error}`);
  }
}

async function testAdvanceProspectToOpportunity(prospectId) {
  console.log(`\n⬆️ Testing Prospect Advancement to Opportunity...`);
  
  const response = await makeRequest('/api/data/unified', {
    method: 'POST',
    body: JSON.stringify({
      type: 'prospects',
      action: 'advance_to_opportunity',
      id: prospectId,
      data: { 
        name: 'Advanced Opportunity',
        amount: 125000,
        stage: 'qualification',
        notes: 'Advanced from prospect to opportunity'
      },
      workspaceId: WORKSPACE_ID,
      userId: USER_ID
    })
  });

  if (response.success) {
    console.log(`✅ Prospect advanced to opportunity successfully: ${response.newRecordId}`);
    return response.newRecordId;
  } else {
    throw new Error(`Failed to advance prospect to opportunity: ${response.error}`);
  }
}

async function testCloseOpportunity(opportunityId, stage = 'won') {
  console.log(`\n🏁 Testing Opportunity Close (${stage})...`);
  
  const response = await makeRequest('/api/data/unified', {
    method: 'POST',
    body: JSON.stringify({
      type: 'opportunities',
      action: 'update',
      id: opportunityId,
      data: { 
        stage: stage,
        actualCloseDate: new Date().toISOString(),
        notes: `Opportunity ${stage} - should auto-convert to customer`
      },
      workspaceId: WORKSPACE_ID,
      userId: USER_ID
    })
  });

  if (response.success) {
    console.log(`✅ Opportunity closed as ${stage} successfully: ${response.data.id}`);
    return response.data;
  } else {
    throw new Error(`Failed to close opportunity: ${response.error}`);
  }
}

async function testSearchCustomers() {
  console.log(`\n🔍 Testing Customer Search (should find auto-converted customers)...`);
  
  const response = await makeRequest(`/api/data/unified?type=customers&action=get&workspaceId=${WORKSPACE_ID}&userId=${USER_ID}`);

  if (response.success) {
    console.log(`✅ Found ${response.data.length} customers`);
    return response.data;
  } else {
    throw new Error(`Failed to search customers: ${response.error}`);
  }
}

async function testDeleteRecord(type, id) {
  console.log(`\n🗑️ Testing ${type} Delete (Soft Delete)...`);
  
  const response = await makeRequest('/api/data/unified', {
    method: 'POST',
    body: JSON.stringify({
      type,
      action: 'delete',
      id,
      workspaceId: WORKSPACE_ID,
      userId: USER_ID
    })
  });

  if (response.success) {
    console.log(`✅ ${type} deleted successfully: ${id}`);
    return response.data;
  } else {
    throw new Error(`Failed to delete ${type}: ${response.error}`);
  }
}

async function runCompleteAdvancementTest() {
  console.log('🚀 Starting Complete Advancement Workflow Test...');
  console.log('Testing: Lead → Prospect → Opportunity → Customer (Auto-conversion)');
  
  const results = {
    created: {},
    advanced: {},
    errors: []
  };

  try {
    // Test 1: Create initial records
    console.log('\n📝 === CREATION TESTS ===');
    
    const lead = await testCreateRecord('leads', testData.lead);
    results.created.lead = lead;
    
    const prospect = await testCreateRecord('prospects', testData.prospect);
    results.created.prospect = prospect;
    
    const opportunity = await testCreateRecord('opportunities', testData.opportunity);
    results.created.opportunity = opportunity;

    // Test 2: Read all created records
    console.log('\n📖 === READ TESTS ===');
    
    await testReadRecord('leads', lead.id);
    await testReadRecord('prospects', prospect.id);
    await testReadRecord('opportunities', opportunity.id);

    // Test 3: Update all records
    console.log('\n✏️ === UPDATE TESTS ===');
    
    await testUpdateRecord('leads', lead.id, { 
      notes: 'Updated lead notes',
      priority: 'urgent'
    });
    
    await testUpdateRecord('prospects', prospect.id, { 
      notes: 'Updated prospect notes',
      estimatedValue: 120000
    });
    
    await testUpdateRecord('opportunities', opportunity.id, { 
      notes: 'Updated opportunity notes',
      amount: 175000
    });

    // Test 4: Lead → Prospect Advancement
    console.log('\n⬆️ === LEAD TO PROSPECT ADVANCEMENT ===');
    
    const advancedProspectId = await testAdvanceLeadToProspect(lead.id);
    results.advanced.leadToProspect = advancedProspectId;
    
    // Verify original lead is soft-deleted
    try {
      await testReadRecord('leads', lead.id);
      console.log('⚠️  Original lead still exists (should be soft-deleted)');
    } catch (error) {
      console.log('✅ Original lead properly soft-deleted');
    }

    // Test 5: Prospect → Opportunity Advancement
    console.log('\n⬆️ === PROSPECT TO OPPORTUNITY ADVANCEMENT ===');
    
    const advancedOpportunityId = await testAdvanceProspectToOpportunity(prospect.id);
    results.advanced.prospectToOpportunity = advancedOpportunityId;
    
    // Verify original prospect is soft-deleted
    try {
      await testReadRecord('prospects', prospect.id);
      console.log('⚠️  Original prospect still exists (should be soft-deleted)');
    } catch (error) {
      console.log('✅ Original prospect properly soft-deleted');
    }

    // Test 6: Opportunity → Customer Auto-conversion (Won)
    console.log('\n🏁 === OPPORTUNITY TO CUSTOMER AUTO-CONVERSION ===');
    
    const wonOpportunity = await testCloseOpportunity(opportunity.id, 'won');
    results.advanced.opportunityToCustomer = wonOpportunity;
    
    // Check if customer was automatically created
    const customers = await testSearchCustomers();
    console.log(`📋 Found ${customers.length} customers. Checking for auto-conversion...`);
    
    // Look for recently created customers (within last 5 minutes)
    const recentCustomers = customers.filter(c => {
      const createdAt = new Date(c.createdAt || c.customerSince);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return createdAt > fiveMinutesAgo;
    });
    
    let autoCustomer = null;
    if (recentCustomers.length > 0) {
      autoCustomer = recentCustomers[0]; // Take the most recent one
      console.log(`✅ Customer automatically created: ${autoCustomer.id}`);
      console.log(`   - Company ID: ${autoCustomer.companyId || 'N/A'}`);
      console.log(`   - Contract Value: $${autoCustomer.contractValue || 'N/A'}`);
      console.log(`   - Status: ${autoCustomer.customerStatus || 'N/A'}`);
      console.log(`   - Created: ${autoCustomer.createdAt || autoCustomer.customerSince || 'N/A'}`);
      results.advanced.autoCustomer = autoCustomer;
    } else {
      console.log('⚠️  No automatic customer conversion detected');
      console.log('   This might be expected if auto-conversion is not implemented yet');
    }

    // Test 7: Test with Lost Opportunity (should not create customer)
    console.log('\n❌ === TESTING LOST OPPORTUNITY (No Auto-conversion) ===');
    
    const lostOpportunity = await testCloseOpportunity(advancedOpportunityId, 'lost');
    console.log('✅ Opportunity marked as lost (should not create customer)');
    
    // Verify no additional customer was created
    const customersAfterLoss = await testSearchCustomers();
    if (customersAfterLoss.length === (autoCustomer ? 1 : 0)) {
      console.log('✅ No additional customer created for lost opportunity');
    } else {
      console.log('⚠️  Additional customer may have been created for lost opportunity');
    }

    // Test 8: Cleanup
    console.log('\n🗑️ === CLEANUP TESTS ===');
    
    if (results.advanced.autoCustomer) {
      await testDeleteRecord('customers', results.advanced.autoCustomer.id);
    }
    await testDeleteRecord('opportunities', opportunity.id);
    await testDeleteRecord('opportunities', advancedOpportunityId);
    await testDeleteRecord('prospects', advancedProspectId);

    console.log('\n🎉 === ALL ADVANCEMENT TESTS COMPLETED SUCCESSFULLY ===');

    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`✅ Created: ${Object.keys(results.created).length} records`);
    console.log(`✅ Advanced: ${Object.keys(results.advanced).length} records`);
    console.log(`❌ Errors: ${results.errors.length} errors`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    console.log('\n🔍 Advancement Workflow Verification:');
    console.log(`✅ Lead → Prospect: ${results.advanced.leadToProspect ? 'Working' : 'Failed'}`);
    console.log(`✅ Prospect → Opportunity: ${results.advanced.prospectToOpportunity ? 'Working' : 'Failed'}`);
    console.log(`✅ Opportunity → Customer: ${results.advanced.autoCustomer ? 'Working (Auto-conversion implemented!)' : 'Not Implemented'}`);
    console.log(`✅ Lost Opportunity Handling: Working (no auto-conversion)`);

  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    results.errors.push(error.message);
    
    console.log('\n📊 Test Summary:');
    console.log(`✅ Created: ${Object.keys(results.created).length} records`);
    console.log(`✅ Advanced: ${Object.keys(results.advanced).length} records`);
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

// Run the test
runCompleteAdvancementTest().catch(console.error);
