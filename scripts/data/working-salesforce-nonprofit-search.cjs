const axios = require('axios');
const fs = require('fs');

const API_KEY = '7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e';
const DATASET_ID = 'gd_l1viktl72bvl7bjuj0'; // LinkedIn People dataset
const BASE_URL = 'https://api.brightdata.com/datasets/snapshots'; // ✅ CORRECT URL!

console.log('🚀 CloudCaddie Optimized Salesforce + Nonprofit Search');
console.log('📊 Using correct API endpoint: https://api.brightdata.com');
console.log('');

async function createOptimizedSearch() {
  try {
    console.log('=== STRATEGY 1: COMPREHENSIVE MULTI-FIELD SEARCH ===');
    console.log('🔍 Creating comprehensive search with patterns found in real data...');
    
    // Based on our data analysis - these patterns actually exist in the LinkedIn data
    const comprehensiveFilter = {
      dataset_id: DATASET_ID,
      filter: {
        "$and": [
          // Geographic targeting - USA/Canada for quality
          {
            "$or": [
              { "country_code": "US" },
              { "country_code": "CA" }
            ]
          },
          // Primary search: Salesforce Solution Architect patterns
          {
            "$or": [
              { "position": { "$ilike": "%salesforce solution architect%" } },
              { "position": { "$ilike": "%solution architect%salesforce%" } },
              { "position": { "$ilike": "%salesforce architect%" } },
              { "experience": { "$ilike": "%salesforce solution architect%" } },
              { "experience": { "$ilike": "%solution architect%salesforce%" } }
            ]
          },
          // Nonprofit + Fundraising experience (work history, not volunteer)
          {
            "$or": [
              // Nonprofit experience patterns
              { "experience": { "$ilike": "%nonprofit%" } },
              { "experience": { "$ilike": "%non-profit%" } },
              { "experience": { "$ilike": "%foundation%" } },
              { "experience": { "$ilike": "%charitable%" } },
              { "experience": { "$ilike": "%charity%" } },
              { "current_company_name": { "$ilike": "%nonprofit%" } },
              { "current_company_name": { "$ilike": "%foundation%" } }
            ]
          },
          // Fundraising/Cloud patterns
          {
            "$or": [
              { "experience": { "$ilike": "%fundraising%" } },
              { "experience": { "$ilike": "%donation%" } },
              { "experience": { "$ilike": "%grant%" } },
              { "experience": { "$ilike": "%nonprofit cloud%" } },
              { "experience": { "$ilike": "%salesforce.org%" } },
              { "about": { "$ilike": "%fundraising%" } },
              { "about": { "$ilike": "%nonprofit%" } },
              { "certifications": { "$ilike": "%nonprofit%" } }
            ]
          }
        ]
      }
    };

    console.log('📤 Creating comprehensive search snapshot...');
    const comprehensiveResponse = await axios.post(BASE_URL, comprehensiveFilter, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const comprehensiveId = comprehensiveResponse.data.id;
    console.log(`✅ Comprehensive search created: ${comprehensiveId}`);

    // Strategy 2: Simplified backup approach
    console.log('');
    console.log('=== STRATEGY 2: SIMPLIFIED BACKUP SEARCH ===');
    console.log('🔍 Creating simplified search as backup...');
    
    const simplifiedFilter = {
      dataset_id: DATASET_ID,
      filter: {
        "$and": [
          { "country_code": { "$in": ["US", "CA"] } },
          { 
            "$or": [
              { "position": { "$ilike": "%salesforce%" } },
              { "experience": { "$ilike": "%salesforce%" } }
            ]
          },
          {
            "$or": [
              { "experience": { "$ilike": "%nonprofit%" } },
              { "experience": { "$ilike": "%fundraising%" } }
            ]
          }
        ]
      }
    };

    console.log('📤 Creating simplified search snapshot...');
    const simplifiedResponse = await axios.post(BASE_URL, simplifiedFilter, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const simplifiedId = simplifiedResponse.data.id;
    console.log(`✅ Simplified search created: ${simplifiedId}`);

    // Wait and check status
    console.log('');
    console.log('⏱️  Waiting for searches to process...');
    
    const searchResults = {
      comprehensive: { id: comprehensiveId, status: 'building' },
      simplified: { id: simplifiedId, status: 'building' }
    };

    // Check status periodically
    for (let i = 0; i < 12; i++) { // Check for 2 minutes
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      for (const [strategy, search] of Object.entries(searchResults)) {
        if (search.status === 'building') {
          try {
            const statusResponse = await axios.get(`${BASE_URL}/${search.id}`, {
              headers: { 'Authorization': `Bearer ${API_KEY}` }
            });
            
            search.status = statusResponse.data.status;
            search.dataset_size = statusResponse.data.dataset_size;
            
            console.log(`📊 ${strategy}: ${search.status} (${search.dataset_size || 0} results)`);
            
            if (search.status === 'ready' && search.dataset_size > 0) {
              console.log(`🎯 SUCCESS! ${strategy} search found ${search.dataset_size} candidates!`);
              console.log(`📥 Download URL: ${BASE_URL}/${search.id}/download`);
            }
          } catch (error) {
            console.log(`⚠️  Error checking ${strategy}: ${error.message}`);
          }
        }
      }
    }

    // Final summary
    console.log('');
    console.log('🎯 FINAL SEARCH SUMMARY:');
    console.log('========================');
    
    for (const [strategy, search] of Object.entries(searchResults)) {
      console.log(`${strategy.toUpperCase()}:`);
      console.log(`  - ID: ${search.id}`);
      console.log(`  - Status: ${search.status}`);
      console.log(`  - Results: ${search.dataset_size || 0} candidates`);
      if (search.status === 'ready') {
        console.log(`  - Download: curl -H "Authorization: Bearer ${API_KEY}" "${BASE_URL}/${search.id}/download" -o ${strategy}-results.json`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error creating search:', error.response?.data || error.message);
  }
}

// Run the search
createOptimizedSearch(); 