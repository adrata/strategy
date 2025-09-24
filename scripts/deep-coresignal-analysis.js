const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deepCoreSignalAnalysis() {
  try {
    await prisma.$connect();
    
    console.log('🔍 DEEP CORESIGNAL DATA ANALYSIS');
    console.log('================================');
    
    // Get one person with full CoreSignal data
    const person = await prisma.people.findFirst({
      where: { 
        fullName: 'Aaron Adkins',
        workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1'
      },
      select: {
        fullName: true,
        company: {
          select: {
            name: true,
            website: true
          }
        },
        customFields: true
      }
    });
    
    if (person && person.customFields?.coresignalData) {
      const data = person.customFields.coresignalData;
      
      console.log(`\n👤 ${person.fullName}`);
      console.log(`🏢 Our Database Company: ${person.company?.name}`);
      console.log(`🌐 Our Database Website: ${person.company?.website}`);
      
      console.log(`\n📊 CoreSignal Current Job:`);
      console.log(`   Title: ${data.active_experience_title || 'N/A'}`);
      console.log(`   Company: ${data.active_experience_company_name || 'N/A'}`);
      console.log(`   Website: ${data.active_experience_company_website || 'N/A'}`);
      console.log(`   Location: ${data.active_experience_location || 'N/A'}`);
      
      console.log(`\n📋 CoreSignal Experience History:`);
      if (data.experience && Array.isArray(data.experience)) {
        data.experience.slice(0, 3).forEach((exp, index) => {
          console.log(`   ${index + 1}. ${exp.position_title || 'N/A'} at ${exp.company_name || 'N/A'}`);
          console.log(`      Dates: ${exp.date_from || 'N/A'} - ${exp.date_to || 'Current'}`);
          console.log(`      Company Website: ${exp.company_website || 'N/A'}`);
        });
      }
      
      console.log(`\n🔍 Company Matching Analysis:`);
      const ourCompany = person.company?.name?.toLowerCase() || '';
      const currentCompany = (data.active_experience_company_name || '').toLowerCase();
      
      console.log(`   Our Company: "${ourCompany}"`);
      console.log(`   CoreSignal Current: "${currentCompany}"`);
      
      // Check for partial matches
      const ourWords = ourCompany.split(' ').filter(w => w.length > 2);
      const coresignalWords = currentCompany.split(' ').filter(w => w.length > 2);
      
      const hasCommonWords = ourWords.some(word => 
        coresignalWords.some(csWord => 
          word.includes(csWord) || csWord.includes(word)
        )
      );
      
      console.log(`   Common Words Match: ${hasCommonWords ? 'YES' : 'NO'}`);
      
      // Check experience history for company matches
      let foundInHistory = false;
      if (data.experience && Array.isArray(data.experience)) {
        for (const exp of data.experience) {
          const expCompany = (exp.company_name || '').toLowerCase();
          const hasExpMatch = ourWords.some(word => 
            expCompany.includes(word) || word.includes(expCompany.split(' ')[0])
          );
          if (hasExpMatch) {
            console.log(`   Found in Experience: "${exp.company_name}" (${exp.position_title})`);
            foundInHistory = true;
            break;
          }
        }
      }
      
      if (!foundInHistory) {
        console.log(`   No company matches found in experience history`);
      }
      
    } else {
      console.log('❌ No CoreSignal data found for Aaron Adkins');
    }
    
    console.log(`\n📊 ANALYSIS SUMMARY:`);
    console.log(`This analysis shows:`);
    console.log(`1. Whether the person's current job matches our company`);
    console.log(`2. If not, whether they worked at our company in the past`);
    console.log(`3. The quality of the CoreSignal data we're getting`);
    console.log(`4. Whether we're finding the right people or just name matches`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

deepCoreSignalAnalysis();
const prisma = new PrismaClient();

async function deepCoreSignalAnalysis() {
  try {
    await prisma.$connect();
    
    console.log('🔍 DEEP CORESIGNAL DATA ANALYSIS');
    console.log('================================');
    
    // Get one person with full CoreSignal data
    const person = await prisma.people.findFirst({
      where: { 
        fullName: 'Aaron Adkins',
        workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1'
      },
      select: {
        fullName: true,
        company: {
          select: {
            name: true,
            website: true
          }
        },
        customFields: true
      }
    });
    
    if (person && person.customFields?.coresignalData) {
      const data = person.customFields.coresignalData;
      
      console.log(`\n👤 ${person.fullName}`);
      console.log(`🏢 Our Database Company: ${person.company?.name}`);
      console.log(`🌐 Our Database Website: ${person.company?.website}`);
      
      console.log(`\n📊 CoreSignal Current Job:`);
      console.log(`   Title: ${data.active_experience_title || 'N/A'}`);
      console.log(`   Company: ${data.active_experience_company_name || 'N/A'}`);
      console.log(`   Website: ${data.active_experience_company_website || 'N/A'}`);
      console.log(`   Location: ${data.active_experience_location || 'N/A'}`);
      
      console.log(`\n📋 CoreSignal Experience History:`);
      if (data.experience && Array.isArray(data.experience)) {
        data.experience.slice(0, 3).forEach((exp, index) => {
          console.log(`   ${index + 1}. ${exp.position_title || 'N/A'} at ${exp.company_name || 'N/A'}`);
          console.log(`      Dates: ${exp.date_from || 'N/A'} - ${exp.date_to || 'Current'}`);
          console.log(`      Company Website: ${exp.company_website || 'N/A'}`);
        });
      }
      
      console.log(`\n🔍 Company Matching Analysis:`);
      const ourCompany = person.company?.name?.toLowerCase() || '';
      const currentCompany = (data.active_experience_company_name || '').toLowerCase();
      
      console.log(`   Our Company: "${ourCompany}"`);
      console.log(`   CoreSignal Current: "${currentCompany}"`);
      
      // Check for partial matches
      const ourWords = ourCompany.split(' ').filter(w => w.length > 2);
      const coresignalWords = currentCompany.split(' ').filter(w => w.length > 2);
      
      const hasCommonWords = ourWords.some(word => 
        coresignalWords.some(csWord => 
          word.includes(csWord) || csWord.includes(word)
        )
      );
      
      console.log(`   Common Words Match: ${hasCommonWords ? 'YES' : 'NO'}`);
      
      // Check experience history for company matches
      let foundInHistory = false;
      if (data.experience && Array.isArray(data.experience)) {
        for (const exp of data.experience) {
          const expCompany = (exp.company_name || '').toLowerCase();
          const hasExpMatch = ourWords.some(word => 
            expCompany.includes(word) || word.includes(expCompany.split(' ')[0])
          );
          if (hasExpMatch) {
            console.log(`   Found in Experience: "${exp.company_name}" (${exp.position_title})`);
            foundInHistory = true;
            break;
          }
        }
      }
      
      if (!foundInHistory) {
        console.log(`   No company matches found in experience history`);
      }
      
    } else {
      console.log('❌ No CoreSignal data found for Aaron Adkins');
    }
    
    console.log(`\n📊 ANALYSIS SUMMARY:`);
    console.log(`This analysis shows:`);
    console.log(`1. Whether the person's current job matches our company`);
    console.log(`2. If not, whether they worked at our company in the past`);
    console.log(`3. The quality of the CoreSignal data we're getting`);
    console.log(`4. Whether we're finding the right people or just name matches`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

deepCoreSignalAnalysis();


