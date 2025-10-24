const fs = require('fs');

// Analyze Premier Bank variations to see if any match First Premier Bank
async function analyzePremierBanks() {
  console.log('🔍 Analyzing Premier Bank variations...');
  
  const premierBanks = [];
  let totalProcessed = 0;
  
  try {
    const data = fs.readFileSync('wv/part-00000-490a505d-2ef4-42dc-a75c-fcba75f51f20-c000.json', 'utf8');
    const lines = data.trim().split('\n');
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      try {
        const employee = JSON.parse(line);
        totalProcessed++;
        
        if (employee.experience && Array.isArray(employee.experience)) {
          employee.experience.forEach(exp => {
            if (exp.is_current && exp.company_name) {
              const companyName = exp.company_name.toLowerCase();
              
              // Look for Premier Bank variations
              if (companyName.includes('premier') && companyName.includes('bank')) {
                premierBanks.push({
                  employee: employee.name,
                  title: exp.title,
                  company: exp.company_name,
                  companyDomain: exp.company_domain,
                  location: exp.location,
                  fullExperience: exp
                });
              }
            }
          });
        }
        
      } catch (parseError) {
        continue;
      }
    }
    
    console.log(`\n✅ Processing complete: ${totalProcessed} total employees`);
    console.log(`🏦 Found ${premierBanks.length} employees at Premier Bank variations`);
    
    if (premierBanks.length > 0) {
      console.log('\n👥 Premier Bank employees:');
      premierBanks.forEach((bank, index) => {
        console.log(`${index + 1}. ${bank.employee} - ${bank.title} at ${bank.company}`);
        console.log(`   Domain: ${bank.companyDomain || 'N/A'}`);
        console.log(`   Location: ${bank.location || 'N/A'}`);
        console.log('');
      });
      
      // Check if any match First Premier Bank characteristics
      console.log('🔍 Checking for First Premier Bank characteristics...');
      const firstPremierMatches = premierBanks.filter(bank => {
        const company = bank.company.toLowerCase();
        const domain = (bank.companyDomain || '').toLowerCase();
        
        return company.includes('first') || 
               domain.includes('firstpremier') || 
               domain.includes('first-premier');
      });
      
      if (firstPremierMatches.length > 0) {
        console.log(`✅ Found ${firstPremierMatches.length} potential First Premier Bank matches:`);
        firstPremierMatches.forEach(match => {
          console.log(`- ${match.employee} at ${match.company} (${match.companyDomain})`);
        });
      } else {
        console.log('❌ No First Premier Bank matches found in Premier Bank variations');
      }
    }
    
    // Also check the data structure to understand the format better
    console.log('\n📊 Sample employee data structure:');
    if (premierBanks.length > 0) {
      console.log(JSON.stringify(premierBanks[0].fullExperience, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error processing data:', error);
  }
}

analyzePremierBanks();
