/**
 * Test Company Association Script
 * 
 * This script tests the company association flow step by step
 */

// Test the specific person ID
const PERSON_ID = '01K815H9AZJ8C7XHN9GP69Q90R';

async function testCompanyAssociation() {
  console.log('🧪 Testing Company Association Flow');
  console.log('===================================');
  
  try {
    // Step 1: Check if person exists
    console.log('Step 1: Checking person exists...');
    const personResponse = await fetch(`/api/v1/people/${PERSON_ID}`);
    const personData = await personResponse.json();
    
    if (!personData.success) {
      console.error('❌ Person not found:', personData.error);
      return;
    }
    
    console.log('✅ Person found:', {
      id: personData.data.id,
      fullName: personData.data.fullName,
      currentCompanyId: personData.data.companyId,
      currentCompany: personData.data.company
    });
    
    // Step 2: Create a test company
    console.log('Step 2: Creating test company...');
    const companyResponse = await fetch('/api/v1/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Test Company ${Date.now()}`,
        website: 'https://testcompany.com'
      })
    });
    
    const companyData = await companyResponse.json();
    
    if (!companyData.success) {
      console.error('❌ Company creation failed:', companyData.error);
      return;
    }
    
    console.log('✅ Company created:', {
      id: companyData.data.id,
      name: companyData.data.name,
      workspaceId: companyData.data.workspaceId
    });
    
    // Step 3: Try to associate company with person
    console.log('Step 3: Associating company with person...');
    const updateResponse = await fetch(`/api/v1/people/${PERSON_ID}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId: companyData.data.id,
        company: companyData.data.name
      })
    });
    
    const updateData = await updateResponse.json();
    
    console.log('Update response:', {
      status: updateResponse.status,
      success: updateData.success,
      error: updateData.error,
      details: updateData.details,
      data: updateData.data
    });
    
    if (updateData.success) {
      console.log('✅ Company association successful!');
      
      // Step 4: Verify the association
      console.log('Step 4: Verifying association...');
      const verifyResponse = await fetch(`/api/v1/people/${PERSON_ID}`);
      const verifyData = await verifyResponse.json();
      
      if (verifyData.success) {
        console.log('✅ Verification successful:', {
          companyId: verifyData.data.companyId,
          company: verifyData.data.company
        });
      } else {
        console.error('❌ Verification failed:', verifyData.error);
      }
    } else {
      console.error('❌ Company association failed:', updateData.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Test with a simple company name (string) instead of companyId
async function testCompanyAssociationWithName() {
  console.log('🧪 Testing Company Association with Name');
  console.log('=========================================');
  
  try {
    // Try to associate with just a company name
    const updateResponse = await fetch(`/api/v1/people/${PERSON_ID}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company: `Test Company Name ${Date.now()}`
      })
    });
    
    const updateData = await updateResponse.json();
    
    console.log('Update response:', {
      status: updateResponse.status,
      success: updateData.success,
      error: updateData.error,
      details: updateData.details,
      data: updateData.data
    });
    
    if (updateData.success) {
      console.log('✅ Company association with name successful!');
    } else {
      console.error('❌ Company association with name failed:', updateData.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Export functions
window.testCompanyAssociation = testCompanyAssociation;
window.testCompanyAssociationWithName = testCompanyAssociationWithName;

console.log('🔧 Company Association Test Script Loaded');
console.log('Available functions:');
console.log('- testCompanyAssociation() - Test with companyId');
console.log('- testCompanyAssociationWithName() - Test with company name');
console.log('');
console.log('Run testCompanyAssociation() to start testing');
