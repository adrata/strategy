require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function generateIntelligenceForAllRecords() {
  try {
    console.log('🚀 Starting AI Intelligence Generation for All Records...\n');
    
    // Get all people records that need intelligence generation
    const allPeople = await prisma.people.findMany({
      include: { company: true },
      take: 50 // Start with 50 for testing
    });
    
    // Filter for records that need intelligence generation
    const peopleNeedingIntelligence = allPeople.filter(person => {
      const intelligenceSummary = person.customFields?.intelligenceSummary;
      return !intelligenceSummary || intelligenceSummary === '' || intelligenceSummary === null;
    });
    
    console.log(`📊 Found ${peopleNeedingIntelligence.length} people records needing intelligence generation`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const person of peopleNeedingIntelligence) {
      try {
        console.log(`🔍 Processing: ${person.fullName} (${person.id})`);
        
        const response = await fetch('http://localhost:3000/api/intelligence/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recordId: person.id,
            recordType: 'people',
            workspaceId: person.workspaceId
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Generated intelligence for ${person.fullName}`);
          console.log(`   - Influence: ${result.intelligenceProfile.influenceLevel}`);
          console.log(`   - Strategy: ${result.intelligenceProfile.engagementStrategy.substring(0, 50)}...`);
          successCount++;
        } else {
          const errorText = await response.text();
          console.log(`❌ Failed for ${person.fullName}: ${response.status} - ${errorText}`);
          errorCount++;
        }
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error processing ${person.fullName}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n📈 People Intelligence Generation Summary:`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📊 Total Processed: ${successCount + errorCount}`);
    
    // Now process leads
    console.log(`\n🔗 Processing Leads...`);
    const allLeads = await prisma.leads.findMany({
      include: { company: true, person: true },
      take: 25 // Start with 25 for testing
    });
    
    const leadsNeedingIntelligence = allLeads.filter(lead => {
      const intelligenceSummary = lead.customFields?.intelligenceSummary;
      return !intelligenceSummary || intelligenceSummary === '' || intelligenceSummary === null;
    });
    
    console.log(`📊 Found ${leadsNeedingIntelligence.length} leads needing intelligence generation`);
    
    let leadSuccessCount = 0;
    let leadErrorCount = 0;
    
    for (const lead of leadsNeedingIntelligence) {
      try {
        console.log(`🔍 Processing Lead: ${lead.fullName || lead.name} (${lead.id})`);
        
        const response = await fetch('http://localhost:3000/api/intelligence/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recordId: lead.id,
            recordType: 'leads',
            workspaceId: lead.workspaceId
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Generated intelligence for Lead: ${lead.fullName || lead.name}`);
          leadSuccessCount++;
        } else {
          const errorText = await response.text();
          console.log(`❌ Failed for Lead ${lead.fullName || lead.name}: ${response.status}`);
          leadErrorCount++;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error processing Lead ${lead.fullName || lead.name}:`, error.message);
        leadErrorCount++;
      }
    }
    
    console.log(`\n📈 Leads Intelligence Generation Summary:`);
    console.log(`✅ Successful: ${leadSuccessCount}`);
    console.log(`❌ Failed: ${leadErrorCount}`);
    console.log(`📊 Total Processed: ${leadSuccessCount + leadErrorCount}`);
    
    // Now process prospects
    console.log(`\n🎯 Processing Prospects...`);
    const allProspects = await prisma.prospects.findMany({
      include: { company: true, person: true },
      take: 25 // Start with 25 for testing
    });
    
    const prospectsNeedingIntelligence = allProspects.filter(prospect => {
      const intelligenceSummary = prospect.customFields?.intelligenceSummary;
      return !intelligenceSummary || intelligenceSummary === '' || intelligenceSummary === null;
    });
    
    console.log(`📊 Found ${prospectsNeedingIntelligence.length} prospects needing intelligence generation`);
    
    let prospectSuccessCount = 0;
    let prospectErrorCount = 0;
    
    for (const prospect of prospectsNeedingIntelligence) {
      try {
        console.log(`🔍 Processing Prospect: ${prospect.fullName || prospect.name} (${prospect.id})`);
        
        const response = await fetch('http://localhost:3000/api/intelligence/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recordId: prospect.id,
            recordType: 'prospects',
            workspaceId: prospect.workspaceId
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Generated intelligence for Prospect: ${prospect.fullName || prospect.name}`);
          prospectSuccessCount++;
        } else {
          const errorText = await response.text();
          console.log(`❌ Failed for Prospect ${prospect.fullName || prospect.name}: ${response.status}`);
          prospectErrorCount++;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error processing Prospect ${prospect.fullName || prospect.name}:`, error.message);
        prospectErrorCount++;
      }
    }
    
    console.log(`\n📈 Prospects Intelligence Generation Summary:`);
    console.log(`✅ Successful: ${prospectSuccessCount}`);
    console.log(`❌ Failed: ${prospectErrorCount}`);
    console.log(`📊 Total Processed: ${prospectSuccessCount + prospectErrorCount}`);
    
    // Final summary
    const totalSuccess = successCount + leadSuccessCount + prospectSuccessCount;
    const totalErrors = errorCount + leadErrorCount + prospectErrorCount;
    
    console.log(`\n🎉 FINAL SUMMARY:`);
    console.log(`✅ Total Successful: ${totalSuccess}`);
    console.log(`❌ Total Failed: ${totalErrors}`);
    console.log(`📊 Total Records Processed: ${totalSuccess + totalErrors}`);
    console.log(`🎯 Success Rate: ${((totalSuccess / (totalSuccess + totalErrors)) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ Error in intelligence generation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateIntelligenceForAllRecords();
