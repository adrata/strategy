require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const prisma = new PrismaClient();

async function generateIntelligenceBatch() {
  try {
    console.log('🚀 Starting Batch AI Intelligence Generation...');

    const workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1'; // TOP workspace
    const batchSize = 10; // Process 10 records at a time
    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;

    // Process People records
    console.log('\n📊 Processing People records...');
    const allPeople = await prisma.people.findMany({
      where: { workspaceId },
      include: { company: true }
    });
    
    const peopleToProcess = allPeople.filter(person => {
      const intelligenceSummary = person.customFields?.intelligenceSummary;
      return !intelligenceSummary || intelligenceSummary === '' || intelligenceSummary === null;
    });
    
    console.log(`Found ${peopleToProcess.length} people records needing intelligence generation`);

    for (let i = 0; i < peopleToProcess.length; i += batchSize) {
      const batch = peopleToProcess.slice(i, i + batchSize);
      console.log(`\n🔄 Processing people batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(peopleToProcess.length/batchSize)} (${batch.length} records)`);
      
      const batchPromises = batch.map(async (record) => {
        try {
          console.log(`🔍 Processing: ${record.fullName || record.name} (${record.id})`);
          const response = await fetch('http://localhost:3000/api/intelligence/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recordId: record.id,
              recordType: 'people',
              workspaceId: record.workspaceId
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
          }

          const result = await response.json();
          console.log(`✅ Generated intelligence for ${record.fullName || record.name} - Influence: ${result.intelligenceProfile.influenceLevel}`);
          return { success: true, record: record.fullName || record.name };
        } catch (error) {
          console.error(`❌ Failed to generate intelligence for ${record.fullName || record.name}:`, error.message);
          return { success: false, record: record.fullName || record.name, error: error.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      const batchSuccess = batchResults.filter(r => r.success).length;
      const batchErrors = batchResults.filter(r => !r.success).length;
      
      successCount += batchSuccess;
      errorCount += batchErrors;
      processedCount += batch.length;
      
      console.log(`📈 Batch completed: ${batchSuccess} success, ${batchErrors} errors`);
      
      // Small delay between batches to avoid overwhelming the API
      if (i + batchSize < peopleToProcess.length) {
        console.log('⏳ Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Process Leads records
    console.log('\n📊 Processing Leads records...');
    const allLeads = await prisma.leads.findMany({
      where: { workspaceId },
      include: { company: true, person: true }
    });
    
    const leadsToProcess = allLeads.filter(lead => {
      const intelligenceSummary = lead.customFields?.intelligenceSummary;
      return !intelligenceSummary || intelligenceSummary === '' || intelligenceSummary === null;
    });
    
    console.log(`Found ${leadsToProcess.length} leads records needing intelligence generation`);

    for (let i = 0; i < leadsToProcess.length; i += batchSize) {
      const batch = leadsToProcess.slice(i, i + batchSize);
      console.log(`\n🔄 Processing leads batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(leadsToProcess.length/batchSize)} (${batch.length} records)`);
      
      const batchPromises = batch.map(async (record) => {
        try {
          console.log(`🔍 Processing Lead: ${record.fullName || record.name} (${record.id})`);
          const response = await fetch('http://localhost:3000/api/intelligence/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recordId: record.id,
              recordType: 'leads',
              workspaceId: record.workspaceId
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
          }

          const result = await response.json();
          console.log(`✅ Generated intelligence for Lead: ${record.fullName || record.name} - Influence: ${result.intelligenceProfile.influenceLevel}`);
          return { success: true, record: record.fullName || record.name };
        } catch (error) {
          console.error(`❌ Failed to generate intelligence for Lead ${record.fullName || record.name}:`, error.message);
          return { success: false, record: record.fullName || record.name, error: error.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      const batchSuccess = batchResults.filter(r => r.success).length;
      const batchErrors = batchResults.filter(r => !r.success).length;
      
      successCount += batchSuccess;
      errorCount += batchErrors;
      processedCount += batch.length;
      
      console.log(`📈 Batch completed: ${batchSuccess} success, ${batchErrors} errors`);
      
      // Small delay between batches
      if (i + batchSize < leadsToProcess.length) {
        console.log('⏳ Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Process Prospects records
    console.log('\n📊 Processing Prospects records...');
    const allProspects = await prisma.prospects.findMany({
      where: { workspaceId },
      include: { company: true, person: true }
    });
    
    const prospectsToProcess = allProspects.filter(prospect => {
      const intelligenceSummary = prospect.customFields?.intelligenceSummary;
      return !intelligenceSummary || intelligenceSummary === '' || intelligenceSummary === null;
    });
    
    console.log(`Found ${prospectsToProcess.length} prospects records needing intelligence generation`);

    for (let i = 0; i < prospectsToProcess.length; i += batchSize) {
      const batch = prospectsToProcess.slice(i, i + batchSize);
      console.log(`\n🔄 Processing prospects batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(prospectsToProcess.length/batchSize)} (${batch.length} records)`);
      
      const batchPromises = batch.map(async (record) => {
        try {
          console.log(`🔍 Processing Prospect: ${record.fullName || record.name} (${record.id})`);
          const response = await fetch('http://localhost:3000/api/intelligence/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recordId: record.id,
              recordType: 'prospects',
              workspaceId: record.workspaceId
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
          }

          const result = await response.json();
          console.log(`✅ Generated intelligence for Prospect: ${record.fullName || record.name} - Influence: ${result.intelligenceProfile.influenceLevel}`);
          return { success: true, record: record.fullName || record.name };
        } catch (error) {
          console.error(`❌ Failed to generate intelligence for Prospect ${record.fullName || record.name}:`, error.message);
          return { success: false, record: record.fullName || record.name, error: error.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      const batchSuccess = batchResults.filter(r => r.success).length;
      const batchErrors = batchResults.filter(r => !r.success).length;
      
      successCount += batchSuccess;
      errorCount += batchErrors;
      processedCount += batch.length;
      
      console.log(`📈 Batch completed: ${batchSuccess} success, ${batchErrors} errors`);
      
      // Small delay between batches
      if (i + batchSize < prospectsToProcess.length) {
        console.log('⏳ Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('\n🎉 Batch AI Intelligence Generation Completed!');
    console.log(`📊 Final Results:`);
    console.log(`   - Total processed: ${processedCount}`);
    console.log(`   - Successful: ${successCount}`);
    console.log(`   - Errors: ${errorCount}`);
    console.log(`   - Success rate: ${((successCount / processedCount) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Error in batch intelligence generation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateIntelligenceBatch();
