const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPeopleCompanyAccuracy() {
  try {
    await prisma.$connect();
    
    console.log('🔍 CHECKING PEOPLE-COMPANY ACCURACY');
    console.log('===================================');
    
    // Get all people with CoreSignal data
    const people = await prisma.people.findMany({
      where: {
        workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1',
        customFields: {
          path: ['coresignalId'],
          not: null
        }
      },
      select: {
        fullName: true,
        jobTitle: true,
        company: {
          select: {
            name: true,
            website: true
          }
        },
        customFields: true
      },
      take: 5
    });
    
    console.log(`Found ${people.length} people with CoreSignal data\n`);
    
    let accurateMatches = 0;
    let partialMatches = 0;
    let noMatches = 0;
    
    for (const person of people) {
      console.log(`👤 ${person.fullName}`);
      console.log(`   Our Company: ${person.company?.name || 'N/A'}`);
      
      if (person.customFields?.coresignalData) {
        const data = person.customFields.coresignalData;
        const currentCompany = data.active_experience_company_name || '';
        const currentTitle = data.active_experience_title || '';
        
        console.log(`   CoreSignal Current: ${currentTitle} at ${currentCompany}`);
        
        // Check if current company matches
        const ourCompany = person.company?.name?.toLowerCase() || '';
        const coresignalCompany = currentCompany.toLowerCase();
        
        if (ourCompany && coresignalCompany) {
          const exactMatch = ourCompany === coresignalCompany;
          const partialMatch = ourCompany.includes(coresignalCompany.split(' ')[0]) || 
                              coresignalCompany.includes(ourCompany.split(' ')[0]);
          
          if (exactMatch) {
            console.log(`   ✅ EXACT MATCH`);
            accurateMatches++;
          } else if (partialMatch) {
            console.log(`   ⚠️  PARTIAL MATCH`);
            partialMatches++;
          } else {
            console.log(`   ❌ NO MATCH`);
            noMatches++;
            
            // Check experience history
            if (data.experience && Array.isArray(data.experience)) {
              let foundInHistory = false;
              for (const exp of data.experience.slice(0, 3)) {
                const expCompany = (exp.company_name || '').toLowerCase();
                const ourWords = ourCompany.split(' ').filter(w => w.length > 2);
                const hasMatch = ourWords.some(word => 
                  expCompany.includes(word) || word.includes(expCompany.split(' ')[0])
                );
                if (hasMatch) {
                  console.log(`   📋 Found in history: ${exp.position_title} at ${exp.company_name}`);
                  foundInHistory = true;
                  break;
                }
              }
              if (!foundInHistory) {
                console.log(`   ❌ Not found in experience history either`);
              }
            }
          }
        } else {
          console.log(`   ❓ Cannot compare (missing company data)`);
          noMatches++;
        }
      } else {
        console.log(`   ❌ No CoreSignal data`);
        noMatches++;
      }
      
      console.log('');
    }
    
    console.log('📊 ACCURACY SUMMARY:');
    console.log(`   ✅ Exact Matches: ${accurateMatches}`);
    console.log(`   ⚠️  Partial Matches: ${partialMatches}`);
    console.log(`   ❌ No Matches: ${noMatches}`);
    console.log(`   📈 Accuracy Rate: ${Math.round((accurateMatches + partialMatches) / people.length * 100)}%`);
    
    if (noMatches > accurateMatches) {
      console.log('\n⚠️  WARNING: Many people don\'t match their assigned companies!');
      console.log('This suggests we might be finding people by name only, not by company association.');
      console.log('Consider improving the search strategy to include company context.');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPeopleCompanyAccuracy();
const prisma = new PrismaClient();

async function checkPeopleCompanyAccuracy() {
  try {
    await prisma.$connect();
    
    console.log('🔍 CHECKING PEOPLE-COMPANY ACCURACY');
    console.log('===================================');
    
    // Get all people with CoreSignal data
    const people = await prisma.people.findMany({
      where: {
        workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1',
        customFields: {
          path: ['coresignalId'],
          not: null
        }
      },
      select: {
        fullName: true,
        jobTitle: true,
        company: {
          select: {
            name: true,
            website: true
          }
        },
        customFields: true
      },
      take: 5
    });
    
    console.log(`Found ${people.length} people with CoreSignal data\n`);
    
    let accurateMatches = 0;
    let partialMatches = 0;
    let noMatches = 0;
    
    for (const person of people) {
      console.log(`👤 ${person.fullName}`);
      console.log(`   Our Company: ${person.company?.name || 'N/A'}`);
      
      if (person.customFields?.coresignalData) {
        const data = person.customFields.coresignalData;
        const currentCompany = data.active_experience_company_name || '';
        const currentTitle = data.active_experience_title || '';
        
        console.log(`   CoreSignal Current: ${currentTitle} at ${currentCompany}`);
        
        // Check if current company matches
        const ourCompany = person.company?.name?.toLowerCase() || '';
        const coresignalCompany = currentCompany.toLowerCase();
        
        if (ourCompany && coresignalCompany) {
          const exactMatch = ourCompany === coresignalCompany;
          const partialMatch = ourCompany.includes(coresignalCompany.split(' ')[0]) || 
                              coresignalCompany.includes(ourCompany.split(' ')[0]);
          
          if (exactMatch) {
            console.log(`   ✅ EXACT MATCH`);
            accurateMatches++;
          } else if (partialMatch) {
            console.log(`   ⚠️  PARTIAL MATCH`);
            partialMatches++;
          } else {
            console.log(`   ❌ NO MATCH`);
            noMatches++;
            
            // Check experience history
            if (data.experience && Array.isArray(data.experience)) {
              let foundInHistory = false;
              for (const exp of data.experience.slice(0, 3)) {
                const expCompany = (exp.company_name || '').toLowerCase();
                const ourWords = ourCompany.split(' ').filter(w => w.length > 2);
                const hasMatch = ourWords.some(word => 
                  expCompany.includes(word) || word.includes(expCompany.split(' ')[0])
                );
                if (hasMatch) {
                  console.log(`   📋 Found in history: ${exp.position_title} at ${exp.company_name}`);
                  foundInHistory = true;
                  break;
                }
              }
              if (!foundInHistory) {
                console.log(`   ❌ Not found in experience history either`);
              }
            }
          }
        } else {
          console.log(`   ❓ Cannot compare (missing company data)`);
          noMatches++;
        }
      } else {
        console.log(`   ❌ No CoreSignal data`);
        noMatches++;
      }
      
      console.log('');
    }
    
    console.log('📊 ACCURACY SUMMARY:');
    console.log(`   ✅ Exact Matches: ${accurateMatches}`);
    console.log(`   ⚠️  Partial Matches: ${partialMatches}`);
    console.log(`   ❌ No Matches: ${noMatches}`);
    console.log(`   📈 Accuracy Rate: ${Math.round((accurateMatches + partialMatches) / people.length * 100)}%`);
    
    if (noMatches > accurateMatches) {
      console.log('\n⚠️  WARNING: Many people don\'t match their assigned companies!');
      console.log('This suggests we might be finding people by name only, not by company association.');
      console.log('Consider improving the search strategy to include company context.');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPeopleCompanyAccuracy();


