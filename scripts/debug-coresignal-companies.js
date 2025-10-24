const fs = require('fs');

// Debug script to see what companies are in the CoreSignal data
async function debugCompanies() {
  console.log('🔍 Analyzing companies in CoreSignal data...');
  
  const companies = new Set();
  const companyCounts = {};
  let totalProcessed = 0;
  
  try {
    const data = fs.readFileSync('wv/part-00000-490a505d-2ef4-42dc-a75c-fcba75f51f20-c000.json', 'utf8');
    const lines = data.trim().split('\n');
    
    console.log(`📊 Processing ${lines.length} employee records...`);
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      try {
        const employee = JSON.parse(line);
        totalProcessed++;
        
        if (employee.experience && Array.isArray(employee.experience)) {
          employee.experience.forEach(exp => {
            if (exp.is_current && exp.company_name) {
              const companyName = exp.company_name.toLowerCase();
              companies.add(companyName);
              companyCounts[companyName] = (companyCounts[companyName] || 0) + 1;
            }
          });
        }
        
        if (totalProcessed % 50 === 0) {
          console.log(`📈 Processed ${totalProcessed} employees, found ${companies.size} unique companies`);
        }
        
      } catch (parseError) {
        continue;
      }
    }
    
    console.log(`\n✅ Processing complete: ${totalProcessed} total employees`);
    console.log(`🏢 Found ${companies.size} unique companies with current employees`);
    
    // Show companies with most employees
    const sortedCompanies = Object.entries(companyCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20);
    
    console.log('\n📊 Top 20 companies by employee count:');
    sortedCompanies.forEach(([company, count], index) => {
      console.log(`${index + 1}. ${company} (${count} employees)`);
    });
    
    // Look for First Premier Bank variations
    console.log('\n🔍 Searching for First Premier Bank variations...');
    const firstPremierVariations = Array.from(companies).filter(company => 
      company.includes('first') || company.includes('premier') || company.includes('bank')
    );
    
    if (firstPremierVariations.length > 0) {
      console.log('Found potential matches:');
      firstPremierVariations.forEach(company => {
        console.log(`- "${company}" (${companyCounts[company]} employees)`);
      });
    } else {
      console.log('❌ No First Premier Bank variations found');
    }
    
    // Show all bank-related companies
    console.log('\n🏦 All bank-related companies:');
    const bankCompanies = Array.from(companies).filter(company => 
      company.includes('bank') || company.includes('financial') || company.includes('credit')
    );
    
    if (bankCompanies.length > 0) {
      bankCompanies.forEach(company => {
        console.log(`- "${company}" (${companyCounts[company]} employees)`);
      });
    } else {
      console.log('❌ No bank-related companies found');
    }
    
  } catch (error) {
    console.error('❌ Error processing data:', error);
  }
}

debugCompanies();
