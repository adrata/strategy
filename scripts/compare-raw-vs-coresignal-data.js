#!/usr/bin/env node

/**
 * 🔍 COMPARE RAW DATA VS CORESIGNAL DATA
 * 
 * Compare our raw data with CoreSignal data to understand discrepancies
 */

require('dotenv').config();

class CompareRawVsCoreSignalData {
  constructor() {
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.baseUrl = 'https://api.coresignal.com/cdapi/v2';
  }

  async compareData() {
    console.log('🔍 COMPARING RAW DATA VS CORESIGNAL DATA');
    console.log('========================================');
    console.log('Understanding discrepancies between our data and CoreSignal');
    console.log('');
    
    if (!this.apiKey) {
      console.log('❌ CORESIGNAL_API_KEY not found in environment');
      return;
    }
    
    // Test with Adam Riggs - we know the raw data shows Sunflower Electric Power Corporation
    const testPerson = {
      fullName: 'Adam Riggs',
      linkedinUrl: 'https://www.linkedin.com/in/adam-gregory-riggs',
      rawData: {
        company: 'Sunflower Electric Power Corporation',
        email: 'adam.riggs@sunflower.net',
        phone: '(620) 272-5428',
        address: '2075 Saint John ST, Garden City, KS, 67846-5071',
        title: null
      }
    };
    
    await this.comparePersonData(testPerson);
  }

  async comparePersonData(person) {
    console.log(`🔍 COMPARING: ${person.fullName}`);
    console.log('================================');
    console.log('   RAW DATA:');
    console.log(`     Company: ${person.rawData.company}`);
    console.log(`     Email: ${person.rawData.email}`);
    console.log(`     Phone: ${person.rawData.phone}`);
    console.log(`     Address: ${person.rawData.address}`);
    console.log(`     Title: ${person.rawData.title || 'None'}`);
    console.log(`     LinkedIn: ${person.linkedinUrl}`);
    console.log('');
    
    try {
      // Get CoreSignal data
      const coresignalData = await this.getCoreSignalData(person.linkedinUrl);
      
      if (coresignalData) {
        console.log('   CORESIGNAL DATA:');
        console.log('   ================');
        console.log(`     Name: ${coresignalData.full_name}`);
        console.log(`     Email: ${coresignalData.primary_professional_email || 'None'}`);
        console.log(`     Title: ${coresignalData.active_experience_title || 'None'}`);
        console.log(`     Location: ${coresignalData.location_full || 'None'}`);
        console.log(`     LinkedIn: ${coresignalData.linkedin_url}`);
        console.log('');
        
        // Show current company from experience
        if (coresignalData.experience && Array.isArray(coresignalData.experience)) {
          const activeCompanyId = coresignalData.active_experience_company_id;
          const matchingExperience = coresignalData.experience.find(exp => exp.company_id === activeCompanyId);
          
          if (matchingExperience) {
            console.log('   CURRENT EMPLOYMENT (CoreSignal):');
            console.log('   ================================');
            console.log(`     Company: ${matchingExperience.company_name}`);
            console.log(`     Title: ${coresignalData.active_experience_title}`);
            console.log(`     Start Date: ${matchingExperience.date_from}`);
            console.log(`     End Date: ${matchingExperience.date_to || 'Current'}`);
            console.log('');
            
            // Compare companies
            console.log('   🏢 COMPANY COMPARISON:');
            console.log('   ======================');
            console.log(`     Raw Data Company: ${person.rawData.company}`);
            console.log(`     CoreSignal Company: ${matchingExperience.company_name}`);
            
            const companyMatch = this.verifyCompany(person.rawData.company, matchingExperience.company_name);
            console.log(`     Company Match: ${companyMatch.isMatch ? '✅ MATCH' : '❌ MISMATCH'} (${companyMatch.confidence}%)`);
            console.log('');
            
            // Analyze the discrepancy
            console.log('   🔍 DISCREPANCY ANALYSIS:');
            console.log('   =========================');
            
            if (!companyMatch.isMatch) {
              console.log('   ❌ COMPANY MISMATCH DETECTED!');
              console.log('   Possible explanations:');
              console.log('   1. Person changed jobs since raw data was collected');
              console.log('   2. Raw data has incorrect company association');
              console.log('   3. CoreSignal data is outdated or incorrect');
              console.log('   4. Person has multiple jobs/roles');
              console.log('');
              
              // Check if this could be a data quality issue
              console.log('   📊 DATA QUALITY ASSESSMENT:');
              console.log('   ============================');
              
              // Check email domain
              const rawEmailDomain = person.rawData.email.split('@')[1];
              const coresignalEmailDomain = coresignalData.primary_professional_email?.split('@')[1];
              
              console.log(`     Raw Email Domain: ${rawEmailDomain}`);
              console.log(`     CoreSignal Email Domain: ${coresignalEmailDomain || 'None'}`);
              
              if (coresignalEmailDomain && rawEmailDomain !== coresignalEmailDomain) {
                console.log('     ⚠️ Email domain mismatch - suggests different companies');
              } else if (coresignalEmailDomain && rawEmailDomain === coresignalEmailDomain) {
                console.log('     ✅ Email domain matches - suggests same company');
              }
              
              // Check if CoreSignal has multiple experiences
              console.log('');
              console.log('   📋 ALL EXPERIENCES (CoreSignal):');
              console.log('   ================================');
              coresignalData.experience.forEach((exp, index) => {
                console.log(`     ${index + 1}. ${exp.company_name || 'Unknown Company'}`);
                console.log(`        Title: ${exp.position_title || 'None'}`);
                console.log(`        Start: ${exp.date_from || 'None'}`);
                console.log(`        End: ${exp.date_to || 'Current'}`);
                console.log(`        Company ID: ${exp.company_id || 'None'}`);
                console.log('');
              });
              
              // Check if Sunflower Electric Power Corporation appears anywhere
              const hasSunflower = coresignalData.experience.some(exp => 
                exp.company_name && exp.company_name.toLowerCase().includes('sunflower')
              );
              
              if (hasSunflower) {
                console.log('   ✅ Sunflower Electric Power Corporation found in experience history');
              } else {
                console.log('   ❌ Sunflower Electric Power Corporation NOT found in experience history');
                console.log('   This suggests the person never worked there or CoreSignal data is incomplete');
              }
            } else {
              console.log('   ✅ COMPANY MATCH - Data is consistent');
            }
          }
        }
        
      } else {
        console.log('   ❌ NO CORESIGNAL DATA FOUND');
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
    
    console.log('');
    console.log('='.repeat(80));
    console.log('');
  }

  async getCoreSignalData(linkedinUrl) {
    try {
      const searchQuery = {
        query: {
          bool: {
            must: [
              {
                match: {
                  linkedin_url: linkedinUrl
                }
              }
            ]
          }
        }
      };

      const searchUrl = `${this.baseUrl}/employee_multi_source/search/es_dsl?items_per_page=1`;
      
      const searchResponse = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(searchQuery)
      });

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        
        if (Array.isArray(searchData) && searchData.length > 0) {
          const employeeId = searchData[0];
          const collectUrl = `${this.baseUrl}/employee_multi_source/collect/${employeeId}`;
          
          const collectResponse = await fetch(collectUrl, {
            method: 'GET',
            headers: { 
              'apikey': this.apiKey,
              'Accept': 'application/json'
            }
          });

          if (collectResponse.ok) {
            return await collectResponse.json();
          }
        }
      }
      
      return null;
    } catch (error) {
      console.log(`     Error getting CoreSignal data: ${error.message}`);
      return null;
    }
  }

  verifyCompany(ourCompany, coresignalCompany) {
    if (!ourCompany || !coresignalCompany) {
      return { isMatch: false, confidence: 0 };
    }
    
    const normalizeCompany = (company) => {
      return company.toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };
    
    const normalizedOur = normalizeCompany(ourCompany);
    const normalizedCoreSignal = normalizeCompany(coresignalCompany);
    
    // Exact match
    if (normalizedOur === normalizedCoreSignal) {
      return { isMatch: true, confidence: 100 };
    }
    
    // Partial match
    const ourWords = normalizedOur.split(' ');
    const coresignalWords = normalizedCoreSignal.split(' ');
    
    const matchingWords = ourWords.filter(word => 
      coresignalWords.some(csWord => csWord.includes(word) || word.includes(csWord))
    );
    
    const matchPercentage = (matchingWords.length / ourWords.length) * 100;
    
    return {
      isMatch: matchPercentage >= 70,
      confidence: matchPercentage
    };
  }
}

// Run data comparison
async function main() {
  const comparer = new CompareRawVsCoreSignalData();
  await comparer.compareData();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CompareRawVsCoreSignalData;
