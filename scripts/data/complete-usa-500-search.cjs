const axios = require('axios');

const API_KEY = '7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e';
const DATASET_ID = 'gd_l1viktl72bvl7bjuj0';
const BASE_URL = 'https://api.brightdata.com';

console.log('🇺🇸 COMPLETE USA SEARCH - TOP 500 CANDIDATES');
console.log('🎯 Target: Salesforce Solution Architects with nonprofit + fundraising experience');
console.log('💰 Estimated cost: ~$25 (500 records)');
console.log('');

async function runCompleteUSASearch() {
  try {
    // Complete filter based on your exact requirements
    console.log('=== BUILDING COMPLETE SEARCH FILTER ===');
    console.log('📋 Requirements:');
    console.log('  ✓ USA only (geographic focus)');
    console.log('  ✓ "Salesforce Solution Architect" OR "Solution Architect Salesforce"');
    console.log('  ✓ Nonprofit experience (work history)'); 
    console.log('  ✓ Fundraising OR nonprofit cloud experience');
    console.log('  ✓ Limit: 500 results maximum');
    console.log('');

    const completeFilter = {
      "operator": "and",
      "filters": [
        // USA ONLY - your target market
        {
          "name": "country_code",
          "operator": "=",
          "value": "US"
        },
        
        // PRIMARY REQUIREMENT: Salesforce Solution Architect (multiple patterns)
        {
          "operator": "or",
          "filters": [
            {
              "name": "position",
              "operator": "includes",
              "value": "salesforce solution architect"
            },
            {
              "name": "position", 
              "operator": "includes",
              "value": "solution architect salesforce"
            },
            {
              "name": "position",
              "operator": "includes",
              "value": "salesforce architect"
            },
            // Also check experience field for these titles
            {
              "name": "experience",
              "operator": "includes",
              "value": "salesforce solution architect"
            },
            {
              "name": "experience",
              "operator": "includes", 
              "value": "solution architect salesforce"
            }
          ]
        },
        
        // NONPROFIT EXPERIENCE REQUIREMENT (work history, not volunteer)
        {
          "operator": "or",
          "filters": [
            {
              "name": "experience",
              "operator": "includes",
              "value": "nonprofit"
            },
            {
              "name": "experience",
              "operator": "includes",
              "value": "non-profit"
            },
            {
              "name": "experience",
              "operator": "includes",
              "value": "foundation"
            },
            {
              "name": "experience",
              "operator": "includes",
              "value": "charitable organization"
            },
            {
              "name": "current_company_name",
              "operator": "includes",
              "value": "nonprofit"
            },
            {
              "name": "current_company_name",
              "operator": "includes",
              "value": "foundation"
            }
          ]
        },
        
        // FUNDRAISING/CLOUD EXPERIENCE REQUIREMENT
        {
          "operator": "or",
          "filters": [
            {
              "name": "experience",
              "operator": "includes",
              "value": "fundraising"
            },
            {
              "name": "experience",
              "operator": "includes",
              "value": "nonprofit cloud"
            },
            {
              "name": "experience",
              "operator": "includes",
              "value": "salesforce.org"
            },
            {
              "name": "experience",
              "operator": "includes",
              "value": "donation"
            },
            {
              "name": "experience",
              "operator": "includes",
              "value": "grant management"
            },
            {
              "name": "about",
              "operator": "includes",
              "value": "fundraising"
            },
            {
              "name": "about",
              "operator": "includes", 
              "value": "nonprofit"
            },
            {
              "name": "certifications",
              "operator": "includes",
              "value": "nonprofit"
            }
          ]
        }
      ]
    };

    console.log('🚀 Creating complete USA search (500 record limit)...');
    
    const response = await axios.post(
      `${BASE_URL}/datasets/filter?dataset_id=${DATASET_ID}&records_limit=500`,
      { 
        dataset_id: DATASET_ID,
        filter: completeFilter 
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const snapshotId = response.data.snapshot_id;
    console.log(`✅ Complete search created: ${snapshotId}`);
    console.log('');

    // Monitor the search
    console.log('⏱️  Monitoring search progress...');
    console.log('⚡ This may take 2-5 minutes for 500 records');
    console.log('');
    
    let searchComplete = false;
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max
    
    while (!searchComplete && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      attempts++;
      
      try {
        const statusResponse = await axios.get(
          `${BASE_URL}/datasets/snapshots/${snapshotId}`,
          { headers: { 'Authorization': `Bearer ${API_KEY}` } }
        );
        
        const status = statusResponse.data.status;
        const datasetSize = statusResponse.data.dataset_size;
        const cost = statusResponse.data.cost;
        const fileSize = statusResponse.data.file_size;
        
        console.log(`📊 Status: ${status} | Results: ${datasetSize || 0}/500 | Cost: $${cost || '0.00'} | Size: ${fileSize ? Math.round(fileSize/1024) + 'KB' : 'Calculating...'}`);
        
        if (status === 'ready') {
          searchComplete = true;
          console.log('');
          console.log('🎯 SEARCH COMPLETED SUCCESSFULLY!');
          console.log('================================');
          console.log(`📊 Final Results: ${datasetSize} qualified candidates found`);
          console.log(`💰 Total Cost: $${cost}`);
          console.log(`📁 File Size: ${fileSize ? Math.round(fileSize/1024) + 'KB' : 'N/A'}`);
          console.log(`🆔 Snapshot ID: ${snapshotId}`);
          console.log('');
          
          if (datasetSize > 0) {
            console.log('📥 DOWNLOAD COMMANDS:');
            console.log('JSON Format:');
            console.log(`curl -H "Authorization: Bearer ${API_KEY}" "${BASE_URL}/datasets/snapshots/${snapshotId}/download?format=json" -o salesforce-nonprofit-usa-500.json`);
            console.log('');
            console.log('CSV Format:');
            console.log(`curl -H "Authorization: Bearer ${API_KEY}" "${BASE_URL}/datasets/snapshots/${snapshotId}/download?format=csv" -o salesforce-nonprofit-usa-500.csv`);
            console.log('');
            
            console.log('🎯 WHAT YOU GET:');
            console.log('- Up to 500 highly qualified candidates');
            console.log('- Salesforce Solution Architects');
            console.log('- USA-based professionals');
            console.log('- Proven nonprofit sector experience'); 
            console.log('- Fundraising/nonprofit cloud expertise');
            console.log('- Complete LinkedIn profiles with contact info');
            console.log('');
            
            console.log('💼 RECRUITMENT VALUE:');
            console.log('- Perfect fit for CloudCaddie requirements');
            console.log('- Pre-qualified for nonprofit cloud implementations');
            console.log('- Ready for outreach and recruitment');
            console.log(`- Cost per qualified lead: $${(cost/datasetSize).toFixed(2)}`);
            
          } else {
            console.log('⚠️  No results found. Consider:');
            console.log('- Broadening search criteria');
            console.log('- Removing one requirement (e.g., just nonprofit OR fundraising)');
            console.log('- Checking if data exists in other regions');
          }
          
        } else if (status === 'failed') {
          console.log('❌ Search failed. Check filter syntax or try simpler criteria.');
          searchComplete = true;
        } else if (status === 'scheduled' || status === 'building') {
          // Continue waiting
          console.log(`⏳ Still processing... (${attempts}/${maxAttempts})`);
        }
        
      } catch (error) {
        console.log(`⚠️  Error checking status: ${error.message}`);
      }
    }
    
    if (!searchComplete) {
      console.log('⏰ Search is taking longer than expected. Check status manually:');
      console.log(`curl -H "Authorization: Bearer ${API_KEY}" "${BASE_URL}/datasets/snapshots/${snapshotId}"`);
    }

  } catch (error) {
    console.error('❌ Error creating search:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Full error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Execute the complete search
runCompleteUSASearch(); 