const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyPeopleCompanyMatching() {
  try {
    await prisma.$connect();
    
    const testNames = [
      'Aaron Adkins', 'Aaron Anderson', 'Aaron Root', 'Aaron Staas', 'Aaron Wunderlich', 
      'Adam Beasley', 'Adam Goertz', 'Adam Mattson', 'Adam Riggs', 'Adam Spratt'
    ];
    
    console.log('🔍 VERIFYING PEOPLE-COMPANY MATCHING');
    console.log('=====================================');
    
    for (const name of testNames) {
      const person = await prisma.people.findFirst({
        where: { 
          fullName: name,
          workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1'
        },
        select: {
          fullName: true,
          jobTitle: true,
          companyId: true,
          customFields: true,
          company: {
            select: {
              name: true,
              website: true
            }
          }
        }
      });
      
      if (person) {
        console.log(`\n👤 ${person.fullName}`);
        console.log(`   📋 Our Database:`);
        console.log(`      Job Title: ${person.jobTitle || 'N/A'}`);
        console.log(`      Company: ${person.company?.name || 'N/A'}`);
        console.log(`      Company Website: ${person.company?.website || 'N/A'}`);
        
        if (person.customFields?.coresignalData) {
          const coresignalData = person.customFields.coresignalData;
          console.log(`   🔍 CoreSignal Data:`);
          console.log(`      Job Title: ${coresignalData.job_title || coresignalData.active_experience_title || 'N/A'}`);
          console.log(`      Company: ${coresignalData.company_name || coresignalData.active_experience_company_name || 'N/A'}`);
          console.log(`      Company Website: ${coresignalData.company_website || coresignalData.active_experience_company_website || 'N/A'}`);
          console.log(`      LinkedIn: ${coresignalData.linkedin_url || 'N/A'}`);
          console.log(`      Location: ${coresignalData.location_full || coresignalData.location_country || 'N/A'}`);
          
          // Check if company names match
          const ourCompany = person.company?.name?.toLowerCase() || '';
          const coresignalCompany = (coresignalData.company_name || coresignalData.active_experience_company_name || '').toLowerCase();
          
          if (ourCompany && coresignalCompany) {
            const companyMatch = ourCompany.includes(coresignalCompany.split(' ')[0]) || 
                               coresignalCompany.includes(ourCompany.split(' ')[0]) ||
                               ourCompany === coresignalCompany;
            console.log(`   ✅ Company Match: ${companyMatch ? 'YES' : 'NO'}`);
          }
        } else {
          console.log(`   ❌ No CoreSignal data found`);
        }
      } else {
        console.log(`\n❌ ${name}: Not found in database`);
      }
    }
    
    console.log('\n📊 VERIFICATION SUMMARY:');
    console.log('This check verifies that:');
    console.log('1. People are associated with companies in our database');
    console.log('2. CoreSignal data shows current job titles and companies');
    console.log('3. Company names match between our database and CoreSignal');
    console.log('4. We\'re finding the right people, not random matches');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyPeopleCompanyMatching();
const prisma = new PrismaClient();

async function verifyPeopleCompanyMatching() {
  try {
    await prisma.$connect();
    
    const testNames = [
      'Aaron Adkins', 'Aaron Anderson', 'Aaron Root', 'Aaron Staas', 'Aaron Wunderlich', 
      'Adam Beasley', 'Adam Goertz', 'Adam Mattson', 'Adam Riggs', 'Adam Spratt'
    ];
    
    console.log('🔍 VERIFYING PEOPLE-COMPANY MATCHING');
    console.log('=====================================');
    
    for (const name of testNames) {
      const person = await prisma.people.findFirst({
        where: { 
          fullName: name,
          workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1'
        },
        select: {
          fullName: true,
          jobTitle: true,
          companyId: true,
          customFields: true,
          company: {
            select: {
              name: true,
              website: true
            }
          }
        }
      });
      
      if (person) {
        console.log(`\n👤 ${person.fullName}`);
        console.log(`   📋 Our Database:`);
        console.log(`      Job Title: ${person.jobTitle || 'N/A'}`);
        console.log(`      Company: ${person.company?.name || 'N/A'}`);
        console.log(`      Company Website: ${person.company?.website || 'N/A'}`);
        
        if (person.customFields?.coresignalData) {
          const coresignalData = person.customFields.coresignalData;
          console.log(`   🔍 CoreSignal Data:`);
          console.log(`      Job Title: ${coresignalData.job_title || coresignalData.active_experience_title || 'N/A'}`);
          console.log(`      Company: ${coresignalData.company_name || coresignalData.active_experience_company_name || 'N/A'}`);
          console.log(`      Company Website: ${coresignalData.company_website || coresignalData.active_experience_company_website || 'N/A'}`);
          console.log(`      LinkedIn: ${coresignalData.linkedin_url || 'N/A'}`);
          console.log(`      Location: ${coresignalData.location_full || coresignalData.location_country || 'N/A'}`);
          
          // Check if company names match
          const ourCompany = person.company?.name?.toLowerCase() || '';
          const coresignalCompany = (coresignalData.company_name || coresignalData.active_experience_company_name || '').toLowerCase();
          
          if (ourCompany && coresignalCompany) {
            const companyMatch = ourCompany.includes(coresignalCompany.split(' ')[0]) || 
                               coresignalCompany.includes(ourCompany.split(' ')[0]) ||
                               ourCompany === coresignalCompany;
            console.log(`   ✅ Company Match: ${companyMatch ? 'YES' : 'NO'}`);
          }
        } else {
          console.log(`   ❌ No CoreSignal data found`);
        }
      } else {
        console.log(`\n❌ ${name}: Not found in database`);
      }
    }
    
    console.log('\n📊 VERIFICATION SUMMARY:');
    console.log('This check verifies that:');
    console.log('1. People are associated with companies in our database');
    console.log('2. CoreSignal data shows current job titles and companies');
    console.log('3. Company names match between our database and CoreSignal');
    console.log('4. We\'re finding the right people, not random matches');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyPeopleCompanyMatching();


