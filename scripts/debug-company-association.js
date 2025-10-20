/**
 * Debug Script for Company Association Issue
 * 
 * This script helps debug the company association problem by testing the API directly
 */

// Test the specific person ID that's failing
const PERSON_ID = '01K815H9AZJ8C7XHN9GP69Q90R';
const TEST_COMPANY = {
  id: 'test-company-id',
  name: 'Test Company',
  workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP'
};

// Test function to debug the API call
async function debugCompanyAssociation() {
  console.log('🔍 Debugging Company Association');
  console.log('================================');
  
  try {
    // Step 1: Test if the person exists
    console.log('Step 1: Checking if person exists...');
    const personResponse = await fetch(`/api/v1/people/${PERSON_ID}`);
    const personData = await personResponse.json();
    
    console.log('Person API Response:', {
      status: personResponse.status,
      success: personData.success,
      data: personData.data ? {
        id: personData.data.id,
        fullName: personData.data.fullName,
        companyId: personData.data.companyId,
        company: personData.data.company
      } : null,
      error: personData.error
    });
    
    if (!personData.success) {
      console.error('❌ Person not found or API error');
      return;
    }
    
    // Step 2: Test the PATCH request
    console.log('Step 2: Testing PATCH request...');
    const updateData = {
      companyId: TEST_COMPANY.id,
      company: TEST_COMPANY.name
    };
    
    console.log('Update data:', updateData);
    
    const patchResponse = await fetch(`/api/v1/people/${PERSON_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    
    const patchData = await patchResponse.json();
    
    console.log('PATCH API Response:', {
      status: patchResponse.status,
      success: patchData.success,
      data: patchData.data,
      error: patchData.error,
      details: patchData.details
    });
    
    if (patchData.success) {
      console.log('✅ Company association successful!');
    } else {
      console.error('❌ Company association failed:', patchData.error);
    }
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  }
}

// Test function to check authentication
async function checkAuthentication() {
  console.log('🔐 Checking Authentication');
  console.log('==========================');
  
  try {
    // Try to get current user info
    const response = await fetch('/api/auth/session');
    const session = await response.json();
    
    console.log('Session response:', {
      status: response.status,
      user: session.user ? {
        id: session.user.id,
        email: session.user.email,
        workspaceId: session.user.workspaceId
      } : null
    });
    
  } catch (error) {
    console.error('❌ Authentication check failed:', error);
  }
}

// Test function to check workspace access
async function checkWorkspaceAccess() {
  console.log('🏢 Checking Workspace Access');
  console.log('============================');
  
  try {
    // Try to get workspace data
    const response = await fetch('/api/data/unified?type=people&limit=1');
    const data = await response.json();
    
    console.log('Workspace data response:', {
      status: response.status,
      success: data.success,
      hasData: !!data.data,
      dataLength: data.data ? data.data.length : 0
    });
    
  } catch (error) {
    console.error('❌ Workspace access check failed:', error);
  }
}

// Export functions for manual testing
window.debugCompanyAssociation = debugCompanyAssociation;
window.checkAuthentication = checkAuthentication;
window.checkWorkspaceAccess = checkWorkspaceAccess;

console.log('🔧 Company Association Debug Script Loaded');
console.log('Available functions:');
console.log('- debugCompanyAssociation() - Test the full flow');
console.log('- checkAuthentication() - Check auth status');
console.log('- checkWorkspaceAccess() - Check workspace access');
console.log('');
console.log('Run debugCompanyAssociation() to start debugging');
