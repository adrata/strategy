#!/usr/bin/env node

/**
 * 🔧 CORESIGNAL PROPER FORMAT TEST
 * 
 * Tests CoreSignal with proper company name and website format
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY?.replace(/\\n/g, '').trim();

async function testCoreSignalProperFormat() {
  console.log('🔧 CORESIGNAL PROPER FORMAT TEST');
  console.log('=' .repeat(60));
  
  const testCases = [
    // Test different formats to see what works
    { companyName: 'Stewart Information Services Corporation', website: 'stewart.com' },
    { companyName: 'Stewart Title', website: 'stewart.com' },
    { companyName: 'Stewart', website: 'stewart.com' },
    { companyName: 'First American Financial Corporation', website: 'firstam.com' },
    { companyName: 'First American', website: 'firstam.com' },
    { companyName: 'Microsoft Corporation', website: 'microsoft.com' },
    { companyName: 'Microsoft', website: 'microsoft.com' }
  ];

  for (const testCase of testCases) {
    console.log(`🔍 Testing: "${testCase.companyName}" with website "${testCase.website}"`);
    
    try {
      // Use exact query from old system
      const query = {
        query: {
          bool: {
            should: [
              { match: { company_name: testCase.companyName } },
              { match: { website: testCase.website } }
            ]
          }
        }
      };

      console.log(`   Query: company_name="${testCase.companyName}", website="${testCase.website}"`);

      const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CORESIGNAL_API_KEY?.trim()
        },
        body: JSON.stringify(query)
      });

      console.log(`   📊 Status: ${searchResponse.status}`);
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        const hitCount = searchData.hits?.hits?.length || 0;
        console.log(`   📋 Results: ${hitCount} companies found`);
        
        if (hitCount > 0) {
          const company = searchData.hits.hits[0]._source;
          console.log(`   ✅ MATCH FOUND!`);
          console.log(`      Company: ${company.company_name}`);
          console.log(`      Website: ${company.website}`);
          console.log(`      Industry: ${company.industry || 'Not provided'}`);
          console.log(`      Employees: ${company.employees_count || 'Not provided'}`);
          
          // Test collection
          const companyId = searchData.hits.hits[0]._id;
          console.log(`      ID: ${companyId}`);
          
          console.log('   🔍 Testing collection...');
          const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/company_multi_source/collect/${companyId}`, {
            headers: { 'apikey': CORESIGNAL_API_KEY?.trim() }
          });
          
          if (collectResponse.ok) {
            const collectData = await collectResponse.json();
            console.log(`   👥 Key Executives: ${collectData.key_executives?.length || 0}`);
            
            if (collectData.key_executives && collectData.key_executives.length > 0) {
              console.log('   🎉 EXECUTIVES FOUND!');
              collectData.key_executives.slice(0, 3).forEach((exec, index) => {
                const name = exec.member_full_name || exec.full_name || exec.name || 'Unknown';
                const title = exec.member_position_title || exec.title || exec.job_title || 'Unknown';
                const email = exec.member_professional_email || exec.professional_email || exec.email || null;
                const linkedin = exec.member_linkedin_url || exec.linkedin_url || exec.linkedin || null;
                
                console.log(`      ${index + 1}. ${name} (${title})`);
                console.log(`         📧 Email: ${email || 'Not found'}`);
                console.log(`         💼 LinkedIn: ${linkedin || 'Not found'}`);
              });
              
              if (collectData.key_executives.length > 3) {
                console.log(`      ... and ${collectData.key_executives.length - 3} more executives`);
              }
            }
          } else {
            console.log(`   ❌ Collection failed: ${collectResponse.status}`);
          }
          
          // We found a working format, break
          console.log('');
          console.log('🎯 WORKING FORMAT IDENTIFIED!');
          console.log(`   Company Name: "${testCase.companyName}"`);
          console.log(`   Website: "${testCase.website}"`);
          break;
          
        } else {
          console.log(`   ⚠️ No matches found`);
        }
        
      } else {
        const errorText = await searchResponse.text();
        console.log(`   ❌ Search failed: ${errorText}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
  }
}

// Run the test
if (require.main === module) {
  testCoreSignalProperFormat().catch(console.error);
}

module.exports = { testCoreSignalProperFormat };
