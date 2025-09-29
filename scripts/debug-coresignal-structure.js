const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const PERSON_ID = '01K5D6AHYJC6FQWDG0R0QRYA0Z';

async function debugCoreSignalStructure() {
  try {
    await prisma.$connect();
    console.log('🔍 DEBUGGING CORESIGNAL DATA STRUCTURE');
    console.log('======================================');
    console.log(`Person ID: ${PERSON_ID}`);
    console.log('');

    // Get the person record
    const person = await prisma.people.findUnique({
      where: { id: PERSON_ID },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        jobTitle: true,
        company: true,
        linkedinUrl: true,
        customFields: true
      }
    });

    if (!person) {
      console.log('❌ Person not found with ID:', PERSON_ID);
      return;
    }

    console.log('📊 PERSON BASIC INFO:');
    console.log('=====================');
    console.log(`Name: ${person.fullName}`);
    console.log(`Email: ${person.email || 'N/A'}`);
    console.log(`Phone: ${person.phone || 'N/A'}`);
    console.log(`Job Title: ${person.jobTitle || 'N/A'}`);
    console.log(`Company: ${person.company || 'N/A'}`);
    console.log(`LinkedIn: ${person.linkedinUrl || 'N/A'}`);
    console.log('');

    // Parse custom fields
    const customFields = person.customFields || {};
    const coresignalData = customFields.coresignalData || {};
    
    console.log('🔍 CORESIGNAL DATA ANALYSIS:');
    console.log('============================');
    console.log(`Enrichment Source: ${coresignalData.enrichmentSource || 'N/A'}`);
    console.log(`Last Enriched: ${coresignalData.lastEnrichedAt || 'N/A'}`);
    console.log(`Total Fields: ${coresignalData.totalFields || 'N/A'}`);
    console.log(`CoreSignal ID: ${coresignalData.id || 'N/A'}`);
    console.log('');

    // Check key fields that UI expects
    console.log('🎯 UI CRITICAL FIELDS:');
    console.log('======================');
    console.log(`primary_professional_email: ${coresignalData.primary_professional_email || 'NULL'}`);
    console.log(`active_experience_title: ${coresignalData.active_experience_title || 'NULL'}`);
    console.log(`headline: ${coresignalData.headline || 'NULL'}`);
    console.log(`phone: ${coresignalData.phone || 'NULL'}`);
    console.log(`linkedin_url: ${coresignalData.linkedin_url || 'NULL'}`);
    console.log(`location_full: ${coresignalData.location_full || 'NULL'}`);
    console.log('');

    // Check array fields
    console.log('📋 ARRAY FIELDS:');
    console.log('================');
    console.log(`experience: ${Array.isArray(coresignalData.experience) ? coresignalData.experience.length : 'Not array'} items`);
    console.log(`education: ${Array.isArray(coresignalData.education) ? coresignalData.education.length : 'Not array'} items`);
    console.log(`inferred_skills: ${Array.isArray(coresignalData.inferred_skills) ? coresignalData.inferred_skills.length : 'Not array'} items`);
    console.log(`skills: ${Array.isArray(coresignalData.skills) ? coresignalData.skills.length : 'Not array'} items`);
    console.log('');

    // Check if experience has data
    if (Array.isArray(coresignalData.experience) && coresignalData.experience.length > 0) {
      console.log('💼 EXPERIENCE DATA:');
      console.log('===================');
      coresignalData.experience.forEach((exp, index) => {
        console.log(`  ${index + 1}. ${exp.company_name || 'Unknown Company'} - ${exp.title || 'Unknown Title'}`);
        console.log(`     Department: ${exp.department || 'N/A'}`);
        console.log(`     Management Level: ${exp.management_level || 'N/A'}`);
        console.log(`     Active: ${exp.active_experience ? 'Yes' : 'No'}`);
        console.log(`     Start: ${exp.start_date || 'N/A'}`);
        console.log(`     End: ${exp.end_date || 'N/A'}`);
      });
    } else {
      console.log('💼 EXPERIENCE: No data available');
    }
    console.log('');

    // Check if education has data
    if (Array.isArray(coresignalData.education) && coresignalData.education.length > 0) {
      console.log('🎓 EDUCATION DATA:');
      console.log('==================');
      coresignalData.education.forEach((edu, index) => {
        console.log(`  ${index + 1}. ${edu.school_name || 'Unknown School'}`);
        console.log(`     Degree: ${edu.degree || 'N/A'}`);
        console.log(`     Field: ${edu.field_of_study || 'N/A'}`);
        console.log(`     Start: ${edu.start_date || 'N/A'}`);
        console.log(`     End: ${edu.end_date || 'N/A'}`);
      });
    } else {
      console.log('🎓 EDUCATION: No data available');
    }
    console.log('');

    // Check if skills have data
    if (Array.isArray(coresignalData.inferred_skills) && coresignalData.inferred_skills.length > 0) {
      console.log('🛠️ SKILLS DATA:');
      console.log('===============');
      coresignalData.inferred_skills.forEach((skill, index) => {
        console.log(`  ${index + 1}. ${skill}`);
      });
    } else if (Array.isArray(coresignalData.skills) && coresignalData.skills.length > 0) {
      console.log('🛠️ SKILLS DATA (from skills field):');
      console.log('====================================');
      coresignalData.skills.forEach((skill, index) => {
        console.log(`  ${index + 1}. ${skill}`);
      });
    } else {
      console.log('🛠️ SKILLS: No data available');
    }
    console.log('');

    // Check validation metadata
    if (coresignalData.validationMetadata) {
      console.log('✅ VALIDATION METADATA:');
      console.log('========================');
      console.log(`Confidence Score: ${coresignalData.validationMetadata.confidenceScore || 'N/A'}`);
      console.log(`Validation Methods: ${coresignalData.validationMetadata.validationMethods?.join(', ') || 'N/A'}`);
      console.log(`Validation Issues: ${coresignalData.validationMetadata.validationIssues?.join(', ') || 'N/A'}`);
      console.log(`Validated At: ${coresignalData.validationMetadata.validatedAt || 'N/A'}`);
    } else {
      console.log('✅ VALIDATION METADATA: Not available');
    }
    console.log('');

    // Check if there are any other useful fields
    console.log('🔍 OTHER USEFUL FIELDS:');
    console.log('========================');
    const usefulFields = [
      'full_name', 'first_name', 'last_name', 'middle_name',
      'picture_url', 'connections_count', 'followers_count',
      'is_decision_maker', 'total_experience_duration_months',
      'publications', 'certifications', 'awards', 'projects'
    ];
    
    usefulFields.forEach(field => {
      const value = coresignalData[field];
      if (value !== undefined && value !== null && value !== '') {
        console.log(`${field}: ${value}`);
      }
    });

    console.log('');
    console.log('✅ CORESIGNAL STRUCTURE ANALYSIS COMPLETE');

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCoreSignalStructure();
