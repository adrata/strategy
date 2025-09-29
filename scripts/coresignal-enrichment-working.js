const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// CoreSignal API configuration
const CORESIGNAL_API_KEY = 'hzwQmb13cF21if4arzLpx0SRWyoOUyzP';

// Employee collection (this works perfectly)
async function collectEmployeeData(employeeId) {
  const url = `https://api.coresignal.com/cdapi/v2/employee_multi_source/collect/${employeeId}`;
  const customHeaders = {
    "Content-Type": "application/json",
    "apikey": CORESIGNAL_API_KEY
  };

  try {
    const response = await fetch(url, { 
      method: 'GET', 
      headers: customHeaders 
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Employee collection error:', error);
    throw error;
  }
}

// Store complete CoreSignal data
async function storeCompleteCoreSignalData(personId, coresignalData, method) {
  try {
    console.log(`📊 Storing complete CoreSignal data for person ${personId} (method: ${method})`);
    
    // Store the ENTIRE CoreSignal response
    await prisma.people.update({
      where: { id: personId },
      data: {
        customFields: {
          // Store the complete CoreSignal data
          coresignal: coresignalData,
          // Add our metadata
          enriched_at: new Date().toISOString(),
          enrichment_method: method,
          enrichment_source: 'coresignal_complete'
        },
        enrichmentSources: {
          push: 'coresignal_complete'
        },
        lastEnriched: new Date(),
        updatedAt: new Date()
      }
    });

    console.log(`✅ Successfully stored complete CoreSignal data for person ${personId}`);
    return true;

  } catch (error) {
    console.error(`❌ Error storing CoreSignal data for person ${personId}:`, error);
    throw error;
  }
}

// Test with known employee IDs first
async function testWithKnownEmployeeIds() {
  try {
    console.log('🚀 Testing CoreSignal Enrichment with Known Employee IDs');
    console.log('=========================================================');
    
    // Get TOP workspace
    const workspace = await prisma.workspaces.findFirst({
      where: { name: { contains: 'TOP' } },
      select: { id: true, name: true }
    });
    
    if (!workspace) {
      console.log('❌ No TOP workspace found');
      return;
    }
    
    console.log(`📊 Workspace: ${workspace.name}`);
    
    // Test with Aaron Adkins (we know his employee ID is 505666130)
    const aaron = await prisma.people.findFirst({
      where: {
        workspaceId: workspace.id,
        fullName: { contains: 'Aaron Adkins' }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        linkedinUrl: true
      }
    });
    
    if (!aaron) {
      console.log('❌ Aaron Adkins not found in TOP workspace');
      return;
    }
    
    console.log(`\n🔄 Testing with Aaron Adkins`);
    console.log('─'.repeat(50));
    console.log('Name:', aaron.fullName);
    console.log('Email:', aaron.email);
    console.log('LinkedIn:', aaron.linkedinUrl);
    
    // Test employee collection with known ID
    const knownEmployeeId = '505666130';
    console.log(`\n📊 Collecting data for employee ID: ${knownEmployeeId}`);
    
    try {
      const coresignalData = await collectEmployeeData(knownEmployeeId);
      
      console.log('✅ CoreSignal data collected successfully!');
      console.log('Employee ID:', coresignalData.id);
      console.log('Name:', coresignalData.full_name);
      console.log('Professional emails:', coresignalData.professional_emails_collection?.length || 0);
      console.log('Experience records:', coresignalData.experience?.length || 0);
      console.log('Education records:', coresignalData.education?.length || 0);
      console.log('Inferred skills:', coresignalData.inferred_skills?.length || 0);
      console.log('Activity records:', coresignalData.activity?.length || 0);
      console.log('Connections:', coresignalData.connections_count);
      console.log('Followers:', coresignalData.followers_count);
      console.log('Decision maker:', coresignalData.is_decision_maker);
      console.log('Total experience months:', coresignalData.total_experience_duration_months);
      
      // Store the data
      console.log('\n📊 Storing comprehensive data...');
      await storeCompleteCoreSignalData(aaron.id, coresignalData, 'known_employee_id');
      
      console.log('\n✅ SUCCESS: Aaron Adkins enriched with complete CoreSignal data!');
      
    } catch (error) {
      console.error('❌ Error collecting data for Aaron Adkins:', error);
    }
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('==============');
    console.log('1. The employee collection API works perfectly');
    console.log('2. We need to fix the search API to find employee IDs');
    console.log('3. Once search works, we can enrich all TOP people');
    console.log('4. For now, we can manually test with known employee IDs');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testWithKnownEmployeeIds();
