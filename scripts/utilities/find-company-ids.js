#!/usr/bin/env node

/**
 * 🏢 FIND COMPANY IDS FOR DANO'S ACCOUNTS
 * 
 * Step 1: Find Coresignal company IDs for all title agencies
 * Then we can search for employees at those companies
 */

const { PrismaClient } = require('@prisma/client');

const CORESIGNAL_API_KEY = 'hzwQmb13cF21if4arzLpx0SRWyoOUyzP';

async function findCompanyIds() {
  console.log('🏢 FINDING COMPANY IDS FOR TITLE AGENCIES');
  console.log('==========================================\n');
  
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    
    // Get Dano's first 5 accounts for testing
    const accounts = await prisma.accounts.findMany({
      where: {
        workspaceId: 'cmezxb1ez0001pc94yry3ntjk',
        assignedUserId: 'dano'
      },
      take: 5
    });
    
    console.log(`Found ${accounts.length} accounts to lookup company IDs for:`);
    accounts.forEach(a => {
      console.log(`  - ${a.name} (${a.website || 'no website'})`);
    });
    
    console.log('\n🔍 Searching for company IDs in Coresignal...\n');
    
    for (const account of accounts) {
      console.log(`📊 ${account.name}:`);
      
      const domain = account.website || `${account.name.toLowerCase().replace(/[^a-z]/g, '')}.com`;
      
      // Search for company by domain and name
      const companyQuery = {
        query: {
          bool: {
            should: [
              { match: { "domain": domain } },
              { match: { "name": account.name } },
              { match: { "name": account.name.replace(/,?\s*(Inc|LLC|Corp|Ltd|Corporation|Company|Title|Agency)\.?$/i, '') } }
            ],
            minimum_should_match: 1
          }
        }
      };

      try {
        const response = await fetch('https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl', {
          method: 'POST',
          headers: {
            'apikey': CORESIGNAL_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(companyQuery)
        });

        if (response.ok) {
          const data = await response.json();
          const companyIds = data.ids || [];
          
          if (companyIds.length > 0) {
            console.log(`  ✅ Found company ID: ${companyIds[0]}`);
            
            // Get company details to verify
            const detailsResponse = await fetch(`https://api.coresignal.com/cdapi/v2/company_multi_source/collect/${companyIds[0]}`, {
              method: 'GET',
              headers: {
                'apikey': CORESIGNAL_API_KEY,
                'accept': 'application/json'
              }
            });
            
            if (detailsResponse.ok) {
              const companyDetails = await detailsResponse.json();
              console.log(`  📊 Company: ${companyDetails.name || 'Unknown'}`);
              console.log(`  📊 Employees: ${companyDetails.employees_count || 'Unknown'}`);
              console.log(`  📊 Industry: ${companyDetails.industry || 'Unknown'}`);
              
              // Update our database with the company ID
              await prisma.accounts.update({
                where: { id: account.id },
                data: {
                  customFields: {
                    ...account.customFields,
                    coresignalCompanyId: companyIds[0],
                    coresignalEmployeeCount: companyDetails.employees_count,
                    coresignalIndustry: companyDetails.industry
                  },
                  updatedAt: new Date()
                }
              });
              
              console.log(`  💾 Updated database with company ID`);
            }
          } else {
            console.log(`  ❌ Not found in Coresignal database`);
          }
        } else {
          console.log(`  ⚠️ Search error: ${response.status}`);
        }
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
      }
      
      console.log(''); // Empty line between companies
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    await prisma.$disconnect();
    console.log('✅ Company ID lookup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findCompanyIds();
