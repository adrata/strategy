const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const PERSON_ID = '01K5D60X0GVPX2GG0D954KQ84R';

async function lookupPersonById() {
  try {
    await prisma.$connect();
    console.log('🔍 LOOKING UP PERSON BY ID');
    console.log('==========================');
    console.log(`Person ID: ${PERSON_ID}`);
    console.log('');

    // Get the person record
    const person = await prisma.people.findUnique({
      where: { id: PERSON_ID },
      include: {
        company: true,
        buyerGroups: true,
        actions: true
      }
    });

    if (!person) {
      console.log('❌ Person not found with ID:', PERSON_ID);
      return;
    }

    console.log('✅ PERSON FOUND:');
    console.log('================');
    console.log(`Name: ${person.fullName}`);
    console.log(`Email: ${person.email || 'N/A'}`);
    console.log(`Phone: ${person.phone || 'N/A'}`);
    console.log(`Job Title: ${person.jobTitle || 'N/A'}`);
    console.log(`Company: ${person.company?.name || 'N/A'}`);
    console.log(`LinkedIn: ${person.linkedinUrl || 'N/A'}`);
    console.log(`Workspace ID: ${person.workspaceId}`);
    console.log(`Status: ${person.status || 'N/A'}`);
    console.log(`Created: ${person.createdAt}`);
    console.log(`Updated: ${person.updatedAt}`);
    console.log('');

    // Check for custom fields and data sources
    console.log('📊 DATA SOURCES ANALYSIS:');
    console.log('=========================');
    
    if (person.customFields) {
      const customFields = person.customFields;
      
      // Check for CoreSignal data
      if (customFields.coresignalId) {
        console.log('✅ CoreSignal ID:', customFields.coresignalId);
      } else {
        console.log('❌ No CoreSignal ID');
      }

      // Check for raw data
      if (customFields.rawData) {
        console.log('✅ Raw Data Available');
        console.log('Raw Data Keys:', Object.keys(customFields.rawData));
        
        // Show sample of raw data structure
        if (customFields.rawData.person) {
          console.log('Raw Person Data Keys:', Object.keys(customFields.rawData.person));
        }
        if (customFields.rawData.company) {
          console.log('Raw Company Data Keys:', Object.keys(customFields.rawData.company));
        }
      } else {
        console.log('❌ No Raw Data');
      }

      // Check for CoreSignal processed data
      if (customFields.coresignalData) {
        console.log('✅ CoreSignal Data Available');
        console.log('CoreSignal Data Keys:', Object.keys(customFields.coresignalData));
      } else {
        console.log('❌ No CoreSignal Data');
      }

      // Check for enrichment data
      if (customFields.enrichedData) {
        console.log('✅ Enriched Data Available');
        console.log('Enriched Data Keys:', Object.keys(customFields.enrichedData));
      } else {
        console.log('❌ No Enriched Data');
      }

      // Check for other custom fields
      const otherFields = Object.keys(customFields).filter(key => 
        !['coresignalId', 'rawData', 'coresignalData', 'enrichedData'].includes(key)
      );
      
      if (otherFields.length > 0) {
        console.log('📋 Other Custom Fields:', otherFields);
      }

    } else {
      console.log('❌ No Custom Fields');
    }

    console.log('');
    console.log('🔍 DETAILED DATA BREAKDOWN:');
    console.log('===========================');

    // Show detailed breakdown of available data
    if (person.customFields?.rawData) {
      console.log('\n📄 RAW DATA STRUCTURE:');
      console.log('----------------------');
      console.log(JSON.stringify(person.customFields.rawData, null, 2));
    }

    if (person.customFields?.coresignalData) {
      console.log('\n🎯 CORESIGNAL DATA STRUCTURE:');
      console.log('-----------------------------');
      console.log(JSON.stringify(person.customFields.coresignalData, null, 2));
    }

    if (person.customFields?.enrichedData) {
      console.log('\n✨ ENRICHED DATA STRUCTURE:');
      console.log('---------------------------');
      console.log(JSON.stringify(person.customFields.enrichedData, null, 2));
    }

  } catch (error) {
    console.error('❌ Error looking up person:', error);
  } finally {
    await prisma.$disconnect();
  }
}

lookupPersonById();
