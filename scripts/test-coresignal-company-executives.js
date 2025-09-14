#!/usr/bin/env node

/**
 * 🏢 CORESIGNAL COMPANY EXECUTIVES TEST
 * 
 * Tests CoreSignal's ability to find ALL executives at a company
 * Using the exact working pattern from the old pipeline
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY?.replace(/\\n/g, '').trim();

async function testCoreSignalCompanyExecutives() {
  console.log('🏢 CORESIGNAL COMPANY EXECUTIVES TEST');
  console.log('=' .repeat(60));
  console.log('Testing CoreSignal ability to find ALL executives at a company');
  console.log('');

  const testCompanies = [
    { name: 'Stewart Title', website: 'stewart.com' },
    { name: 'First American Financial Corporation', website: 'firstam.com' },
    { name: 'Microsoft', website: 'microsoft.com' } // Large company for comparison
  ];

  for (const company of testCompanies) {
    console.log(`🏢 Testing: ${company.name} (${company.website})`);
    console.log('─'.repeat(50));
    
    try {
      // STEP 1: Search for company (exact pattern from old system)
      console.log('🔍 STEP 1: Company search...');
      
      const query = {
        query: {
          bool: {
            should: [
              { match: { company_name: company.name } },
              { match: { website: company.website } }
            ]
          }
        }
      };

      const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CORESIGNAL_API_KEY?.trim()
        },
        body: JSON.stringify(query)
      });

      console.log(`   📊 Search Status: ${searchResponse.status}`);
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        console.log(`   📋 Found: ${searchData.hits?.hits?.length || 0} company matches`);
        
        if (searchData.hits?.hits?.length > 0) {
          const companyId = searchData.hits.hits[0]._id;
          const companySource = searchData.hits.hits[0]._source;
          
          console.log(`   🏢 Company: ${companySource.company_name || company.name}`);
          console.log(`   🆔 Company ID: ${companyId}`);
          
          // STEP 2: Get company data with key executives
          console.log('');
          console.log('🔍 STEP 2: Collecting company executives...');
          
          const companyResponse = await fetch(`https://api.coresignal.com/cdapi/v2/company_multi_source/collect/${companyId}`, {
            headers: { 'apikey': CORESIGNAL_API_KEY?.trim() }
          });

          console.log(`   📊 Collection Status: ${companyResponse.status}`);
          
          if (companyResponse.ok) {
            const companyData = await companyResponse.json();
            
            console.log(`   🏢 Company Details:`);
            console.log(`      Name: ${companyData.company_name || 'Not provided'}`);
            console.log(`      Website: ${companyData.website || 'Not provided'}`);
            console.log(`      Industry: ${companyData.industry || 'Not provided'}`);
            console.log(`      Employees: ${companyData.employees_count || 'Not provided'}`);
            console.log(`      Key Executives: ${companyData.key_executives?.length || 0}`);
            
            if (companyData.key_executives && companyData.key_executives.length > 0) {
              console.log('');
              console.log(`   👥 KEY EXECUTIVES (${companyData.key_executives.length} found):`);
              
              companyData.key_executives.forEach((exec, index) => {
                const name = exec.member_full_name || exec.full_name || exec.name || exec.executive_name || 'Unknown';
                const title = exec.member_position_title || exec.title || exec.job_title || exec.position || 'Unknown';
                const email = exec.member_professional_email || exec.professional_email || exec.email || exec.work_email || null;
                const linkedIn = exec.member_linkedin_url || exec.linkedin_url || exec.linkedin || null;
                
                console.log(`   ${index + 1}. ${name}`);
                console.log(`      Title: ${title}`);
                console.log(`      Email: ${email || 'Not found'}`);
                console.log(`      LinkedIn: ${linkedIn || 'Not found'}`);
                
                // Classify role
                const role = classifyRole(title);
                if (role) {
                  console.log(`      Role: ${role} ⭐`);
                }
                console.log('');
              });
              
              // Summary
              const withEmail = companyData.key_executives.filter(exec => 
                exec.member_professional_email || exec.professional_email || exec.email || exec.work_email
              ).length;
              
              const withLinkedIn = companyData.key_executives.filter(exec => 
                exec.member_linkedin_url || exec.linkedin_url || exec.linkedin
              ).length;
              
              console.log('📊 CONTACT DATA SUMMARY:');
              console.log(`   📧 Executives with Email: ${withEmail}/${companyData.key_executives.length} (${Math.round(withEmail/companyData.key_executives.length*100)}%)`);
              console.log(`   💼 Executives with LinkedIn: ${withLinkedIn}/${companyData.key_executives.length} (${Math.round(withLinkedIn/companyData.key_executives.length*100)}%)`);
              
            } else {
              console.log('   ⚠️ No key executives found in company data');
            }
            
          } else {
            const errorText = await companyResponse.text();
            console.log(`   ❌ Failed to collect company data: ${errorText}`);
          }
        } else {
          console.log('   ⚠️ Company not found in CoreSignal database');
        }
        
      } else {
        const errorText = await searchResponse.text();
        console.log(`   ❌ Company search failed: ${errorText}`);
      }
      
    } catch (error) {
      console.error(`   ❌ Test failed for ${company.name}:`, error.message);
    }
    
    console.log('');
    console.log('⏳ Waiting 3 seconds before next company...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('');
  }
}

function classifyRole(title) {
  if (!title) return null;
  
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('chief executive officer') || titleLower.includes('ceo')) return 'CEO';
  if (titleLower.includes('chief financial officer') || titleLower.includes('cfo')) return 'CFO';
  if (titleLower.includes('chief operating officer') || titleLower.includes('coo')) return 'COO';
  if (titleLower.includes('general counsel') || titleLower.includes('chief legal')) return 'General_Counsel';
  if (titleLower.includes('president') && !titleLower.includes('vice')) return 'President';
  if (titleLower.includes('vice president') && titleLower.includes('operations')) return 'VP_Operations';
  if (titleLower.includes('vice president') && titleLower.includes('finance')) return 'VP_Finance';
  
  return null;
}

// Run the test
if (require.main === module) {
  testCoreSignalCompanyExecutives().catch(console.error);
}

module.exports = { testCoreSignalCompanyExecutives };
