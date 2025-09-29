const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const PERSON_ID = '01K5D6AHYJC6FQWDG0R0QRYA0Z';

async function analyzeCustomFields() {
  try {
    await prisma.$connect();
    console.log('🔍 ANALYZING CUSTOM FIELDS STRUCTURE');
    console.log('====================================');
    console.log(`Person ID: ${PERSON_ID}`);
    console.log('');

    // Get the person record with custom fields
    const person = await prisma.people.findUnique({
      where: { id: PERSON_ID },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        jobTitle: true,
        company: true,
        customFields: true
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
    console.log(`Company: ${person.company || 'N/A'}`);
    console.log('');

    console.log('📋 CUSTOM FIELDS ANALYSIS:');
    console.log('==========================');
    
    if (person.customFields) {
      console.log('Raw customFields type:', typeof person.customFields);
      console.log('Raw customFields:', JSON.stringify(person.customFields, null, 2));
      
      // Try to parse if it's a string
      let parsedCustomFields;
      if (typeof person.customFields === 'string') {
        try {
          parsedCustomFields = JSON.parse(person.customFields);
          console.log('\n📊 PARSED CUSTOM FIELDS:');
          console.log('========================');
          console.log(JSON.stringify(parsedCustomFields, null, 2));
        } catch (error) {
          console.log('❌ Failed to parse customFields as JSON:', error.message);
        }
      } else {
        parsedCustomFields = person.customFields;
      }

      if (parsedCustomFields) {
        console.log('\n🔍 CUSTOM FIELDS STRUCTURE ANALYSIS:');
        console.log('=====================================');
        
        // Check for CoreSignal data
        if (parsedCustomFields.coresignal) {
          console.log('✅ Found coresignal data');
          console.log('Coresignal keys:', Object.keys(parsedCustomFields.coresignal));
        } else {
          console.log('❌ No coresignal data found');
        }
        
        if (parsedCustomFields.coresignalData) {
          console.log('✅ Found coresignalData');
          console.log('CoresignalData keys:', Object.keys(parsedCustomFields.coresignalData));
        } else {
          console.log('❌ No coresignalData found');
        }
        
        // Check for other enrichment data
        console.log('\n📊 ALL CUSTOM FIELD KEYS:');
        console.log('==========================');
        Object.keys(parsedCustomFields).forEach(key => {
          const value = parsedCustomFields[key];
          const valueType = typeof value;
          const isObject = valueType === 'object' && value !== null;
          const isArray = Array.isArray(value);
          
          console.log(`${key}: ${valueType}${isArray ? ' (array)' : ''}${isObject && !isArray ? ' (object)' : ''}`);
          
          if (isObject && !isArray && value !== null) {
            console.log(`  └─ Object keys: ${Object.keys(value).join(', ')}`);
          } else if (isArray) {
            console.log(`  └─ Array length: ${value.length}`);
          } else {
            console.log(`  └─ Value: ${value}`);
          }
        });
        
        // Look for specific CoreSignal fields that the UI expects
        console.log('\n🎯 UI EXPECTED FIELDS CHECK:');
        console.log('============================');
        
        const expectedFields = [
          'coresignalData.full_name',
          'coresignalData.primary_professional_email',
          'coresignalData.phone',
          'coresignalData.linkedin_url',
          'coresignalData.experience',
          'coresignalData.education',
          'coresignalData.skills',
          'coresignalData.inferred_skills',
          'coresignalData.active_experience_title',
          'coresignalData.headline',
          'coresignalData.location_full',
          'coresignalData.location'
        ];
        
        expectedFields.forEach(fieldPath => {
          const keys = fieldPath.split('.');
          let value = parsedCustomFields;
          let found = true;
          
          for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
              value = value[key];
            } else {
              found = false;
              break;
            }
          }
          
          console.log(`${fieldPath}: ${found ? '✅ Found' : '❌ Missing'} ${found ? `(${typeof value})` : ''}`);
        });
        
      }
    } else {
      console.log('❌ No customFields found');
    }

    console.log('');
    console.log('✅ CUSTOM FIELDS ANALYSIS COMPLETE');

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeCustomFields();
