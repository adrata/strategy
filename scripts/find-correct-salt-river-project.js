const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const prisma = new PrismaClient();

class SaltRiverProjectFixer {
  constructor() {
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.baseUrl = 'https://api.coresignal.com/cdapi/v1';
  }

  async searchCorrectSaltRiverProject() {
    console.log('🔍 SEARCHING FOR CORRECT SALT RIVER PROJECT IN CORESIGNAL');
    console.log('=======================================================');
    
    try {
      // Search for Salt River Project in CoreSignal
      const searchQueries = [
        'Salt River Project',
        'SRP',
        'Salt River Project Arizona',
        'Salt River Project utility'
      ];
      
      for (const query of searchQueries) {
        console.log(`\n🔍 Searching for: "${query}"`);
        
        const response = await fetch(`${this.baseUrl}/company_multi_source/search/es_dsl`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: {
              bool: {
                should: [
                  { match: { name: query } },
                  { match: { description: query } },
                  { match: { industry: 'utilities' } }
                ],
                minimum_should_match: 1
              }
            },
            size: 10
          })
        });
        
        if (response.ok) {
          const results = await response.json();
          console.log(`   Found ${results.length} companies`);
          
          results.forEach((company, index) => {
            console.log(`   ${index + 1}. ${company.name}`);
            console.log(`      ID: ${company.id}`);
            console.log(`      Employees: ${company.employees_count}`);
            console.log(`      Industry: ${company.industry}`);
            console.log(`      Website: ${company.website}`);
            console.log(`      Location: ${company.location}`);
            console.log('');
            
            // Check if this looks like the right Salt River Project
            if (company.employees_count > 1000 && 
                (company.name.toLowerCase().includes('salt river') || 
                 company.name.toLowerCase().includes('srp'))) {
              console.log(`   ✅ POTENTIAL MATCH: This looks like the real Salt River Project!`);
              console.log(`      Large company (${company.employees_count} employees)`);
              console.log(`      Should be a utility company`);
              console.log('');
            }
          });
        } else {
          console.log(`   ❌ Search failed: ${response.status}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Error searching CoreSignal:', error.message);
    }
  }

  async updateCompanyWithCorrectData(companyId, coresignalId) {
    console.log('🔄 UPDATING COMPANY WITH CORRECT CORESIGNAL DATA');
    console.log('================================================');
    
    try {
      // Get the correct company data from CoreSignal
      const response = await fetch(`${this.baseUrl}/company_multi_source/collect/${coresignalId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const companyData = await response.json();
        console.log(`✅ Retrieved company data for ID: ${coresignalId}`);
        console.log(`   Name: ${companyData.name}`);
        console.log(`   Employees: ${companyData.employees_count}`);
        console.log(`   Industry: ${companyData.industry}`);
        console.log(`   Website: ${companyData.website}`);
        console.log('');
        
        // Update our company record
        await prisma.companies.update({
          where: { id: companyId },
          data: {
            customFields: {
              coresignalData: companyData,
              enrichmentDate: new Date().toISOString(),
              systemVersion: 'Salt River Project Fix v1.0',
              previousCoreSignalId: 26181771 // The wrong one we had
            },
            updatedAt: new Date()
          }
        });
        
        console.log(`✅ Updated company record with correct CoreSignal data`);
        console.log(`   New CoreSignal ID: ${coresignalId}`);
        console.log(`   New Employee Count: ${companyData.employees_count}`);
        console.log('');
        
        return companyData;
      } else {
        console.log(`❌ Failed to get company data: ${response.status}`);
        return null;
      }
      
    } catch (error) {
      console.error('❌ Error updating company:', error.message);
      return null;
    }
  }

  async reRunBuyerGroupDiscovery(companyId) {
    console.log('🚀 RE-RUNNING BUYER GROUP DISCOVERY');
    console.log('===================================');
    
    try {
      // This would trigger the buyer group discovery again
      // For now, just show what should happen
      console.log(`✅ Company ${companyId} should now have correct CoreSignal data`);
      console.log(`   Next step: Re-run buyer group discovery`);
      console.log(`   Expected: Large buyer group (100+ people)`);
      console.log(`   Expected: Multiple decision makers, champions, stakeholders`);
      console.log('');
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }

  async executeFix() {
    console.log('🔧 FIXING SALT RIVER PROJECT CORESIGNAL MATCHING');
    console.log('================================================');
    console.log('This will:');
    console.log('1. Search CoreSignal for the correct Salt River Project');
    console.log('2. Update our company record with correct data');
    console.log('3. Prepare for re-running buyer group discovery');
    console.log('');

    try {
      // Step 1: Search for correct Salt River Project
      await this.searchCorrectSaltRiverProject();
      
      console.log('🎯 NEXT STEPS:');
      console.log('==============');
      console.log('1. Review the search results above');
      console.log('2. Identify the correct Salt River Project (large utility company)');
      console.log('3. Update the company record with the correct CoreSignal ID');
      console.log('4. Re-run buyer group discovery');
      console.log('');

    } catch (error) {
      console.error('❌ Fix failed:', error.message);
    } finally {
      await prisma.$disconnect();
    }
  }
}

async function main() {
  const fixer = new SaltRiverProjectFixer();
  await fixer.executeFix();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = SaltRiverProjectFixer;
