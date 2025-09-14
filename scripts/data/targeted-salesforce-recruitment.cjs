#!/usr/bin/env node

/**
 * 🎯 TARGETED SALESFORCE SOLUTION ARCHITECT RECRUITMENT
 * 
 * Using REAL LinkedIn People dataset metadata fields:
 * - position: Current job title
 * - about: Profile summary  
 * - experience: Work experience
 * - volunteer_experience: Volunteer work (nonprofit)
 * 
 * Target: "Salesforce Solution Architect" with "nonprofit cloud" AND "fundraising" experience
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const API_KEY = "7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e";
const LINKEDIN_PEOPLE_DATASET = "gd_ld7ll037kqy322v05";

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          console.log(`📡 Status: ${res.statusCode}`);
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch {
              resolve(data);
            }
          } else {
            console.log(`❌ Error Response: ${data}`);
            reject(new Error(`API error: ${res.statusCode} - ${data}`));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

/**
 * CREATE SALESFORCE SOLUTION ARCHITECT FILTERS
 * Using actual metadata field names
 */
function createSalesforceArchitectFilters() {
  console.log('🎯 Creating targeted filters for Salesforce Solution Architects...');
  
  // APPROACH 1: Filter by position field (job title)
  const positionFilter = {
    "operator": "and",
    "filters": [
      {
        "name": "position",
        "operator": "includes",
        "value": "salesforce"
      },
      {
        "name": "position", 
        "operator": "includes",
        "value": "solution"
      },
      {
        "name": "position",
        "operator": "includes", 
        "value": "architect"
      }
    ]
  };

  // APPROACH 2: Broader Salesforce professionals (fallback)
  const salesforceFilter = {
    "name": "position",
    "operator": "includes",
    "value": "salesforce"
  };

  // APPROACH 3: Test with about field
  const aboutFilter = {
    "name": "about",
    "operator": "includes",
    "value": "salesforce"
  };

  // APPROACH 4: Test experience field
  const experienceFilter = {
    "name": "experience", 
    "operator": "includes",
    "value": "salesforce"
  };

  return {
    positionFilter,
    salesforceFilter,
    aboutFilter,
    experienceFilter
  };
}

/**
 * STEP 1: Create filtered snapshot
 */
async function createSnapshot(filter, description = '') {
  console.log(`🔄 Creating snapshot: ${description}`);
  console.log(`📊 Dataset: ${LINKEDIN_PEOPLE_DATASET}`);
  console.log(`🔍 Filter: ${JSON.stringify(filter, null, 2)}`);
  
  const url = 'https://api.brightdata.com/datasets/filter';
  
  const payload = {
    dataset_id: LINKEDIN_PEOPLE_DATASET,
    filter: filter,
    records_limit: 200  // Reasonable limit for targeted search
  };

  try {
    const response = await makeRequest(url, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (response.snapshot_id) {
      console.log(`✅ Snapshot created: ${response.snapshot_id}`);
      return response.snapshot_id;
    } else {
      throw new Error('No snapshot_id in response: ' + JSON.stringify(response));
    }
  } catch (error) {
    console.error(`❌ Snapshot creation failed: ${error.message}`);
    throw error;
  }
}

/**
 * STEP 2: Wait for snapshot completion
 */
async function waitForSnapshot(snapshotId) {
  console.log(`⏳ Waiting for snapshot: ${snapshotId}`);
  
  for (let i = 0; i < 60; i++) {
    try {
      const status = await makeRequest(`https://api.brightdata.com/datasets/snapshots/${snapshotId}`);
      
      console.log(`📊 Status: ${status.status}`);
      
      if (status.status === 'ready' || status.status === 'completed') {
        console.log('✅ Snapshot ready!');
        return status;
      } else if (status.status === 'failed') {
        const warning = status.warning || 'Unknown error';
        console.log(`❌ Snapshot failed: ${warning}`);
        
        if (warning.includes('no records found')) {
          console.log('💡 No matches found - try a different filter approach');
        }
        
        throw new Error(`Snapshot failed: ${warning}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } catch (error) {
      console.error(`❌ Error checking snapshot: ${error.message}`);
      throw error;
    }
  }
  
  throw new Error('Snapshot timeout');
}

/**
 * STEP 3: Download and parse data
 */
async function downloadData(snapshotId) {
  console.log(`⬇️ Downloading data: ${snapshotId}`);
  
  const url = `https://api.brightdata.com/datasets/snapshots/${snapshotId}/download`;
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  try {
    const response = await makeRequest(url);
    
    // Parse JSONL format
    const records = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const record = JSON.parse(line);
          records.push(record);
        } catch (e) {
          // Skip invalid lines
        }
      }
    }
    
    console.log(`✅ Downloaded ${records.length} candidate profiles`);
    return records;
    
  } catch (error) {
    console.error(`❌ Download failed: ${error.message}`);
    throw error;
  }
}

/**
 * STEP 4: Enhanced local filtering for nonprofit/fundraising
 */
function enhancedFiltering(candidates) {
  console.log(`🎯 Enhanced filtering for nonprofit + fundraising experience...`);
  
  const enhanced = candidates.map(candidate => {
    // Combine all text fields for comprehensive search
    const searchText = [
      candidate.position || '',
      candidate.about || '', 
      candidate.experience || '',
      candidate.volunteer_experience || '',
      candidate.current_company_name || ''
    ].join(' ').toLowerCase();
    
    // Enhanced scoring system
    const scores = {
      // Core Salesforce skills
      salesforce: searchText.includes('salesforce') ? 2 : 0,
      solution: searchText.includes('solution') ? 1 : 0,
      architect: searchText.includes('architect') ? 2 : 0,
      
      // Nonprofit experience  
      nonprofit: (searchText.includes('nonprofit') || searchText.includes('non-profit')) ? 2 : 0,
      
      // Fundraising experience
      fundraising: (searchText.includes('fundraising') || searchText.includes('fundraiser') || 
                   searchText.includes('donor') || searchText.includes('philanthrop')) ? 2 : 0,
      
      // Cloud experience
      cloud: searchText.includes('cloud') ? 1 : 0,
      
      // Bonus points for exact matches
      exactTitle: searchText.includes('salesforce solution architect') ? 3 : 0,
      nonprofitCloud: searchText.includes('nonprofit cloud') ? 3 : 0
    };
    
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    
    return {
      ...candidate,
      scores,
      totalScore,
      linkedin_url: candidate.url || (candidate.linkedin_id ? `https://linkedin.com/in/${candidate.linkedin_id}` : ''),
      isQualified: totalScore >= 5,  // Higher threshold for quality
      isPerfectMatch: scores.salesforce > 0 && scores.architect > 0 && scores.nonprofit > 0 && scores.fundraising > 0
    };
  })
  .filter(c => c.isQualified)
  .sort((a, b) => {
    // Perfect matches first, then by total score
    if (a.isPerfectMatch && !b.isPerfectMatch) return -1;
    if (!a.isPerfectMatch && b.isPerfectMatch) return 1;
    return b.totalScore - a.totalScore;
  });
  
  console.log(`🎯 Found ${enhanced.length} qualified candidates`);
  console.log(`🏆 Perfect matches: ${enhanced.filter(c => c.isPerfectMatch).length}`);
  console.log(`📊 Score range: ${enhanced.length > 0 ? enhanced[enhanced.length-1].totalScore : 0}-${enhanced.length > 0 ? enhanced[0].totalScore : 0}`);
  
  return enhanced;
}

/**
 * STEP 5: Save comprehensive recruitment CSV
 */
function saveTargetedCSV(candidates, approach) {
  if (candidates.length === 0) {
    console.log('❌ No qualified candidates found');
    return;
  }

  console.log(`💾 Saving ${candidates.length} qualified candidates...`);
  
  const csvData = candidates.map(candidate => ({
    // CANDIDATE ESSENTIALS
    full_name: candidate.name || '',
    linkedin_url: candidate.linkedin_url,
    current_position: candidate.position || '',
    company: candidate.current_company_name || '',
    location: `${candidate.city || ''}, ${candidate.country_code || ''}`.replace(/^, |, $/, ''),
    
    // QUALIFICATION SCORING
    total_score: candidate.totalScore,
    is_perfect_match: candidate.isPerfectMatch ? 'YES' : 'NO',
    
    // DETAILED SCORING
    salesforce_score: candidate.scores.salesforce,
    solution_score: candidate.scores.solution, 
    architect_score: candidate.scores.architect,
    nonprofit_score: candidate.scores.nonprofit,
    fundraising_score: candidate.scores.fundraising,
    cloud_score: candidate.scores.cloud,
    exact_title_bonus: candidate.scores.exactTitle,
    nonprofit_cloud_bonus: candidate.scores.nonprofitCloud,
    
    // EXPERIENCE DETAILS
    about_summary: (candidate.about || '').substring(0, 300) + '...',
    volunteer_experience: candidate.volunteer_experience || '',
    
    // CONTACT INFO
    followers: candidate.followers || '',
    connections: candidate.connections || '',
    
    // RAW DATA FOR MANUAL REVIEW
    raw_position: candidate.position || '',
    raw_experience: candidate.experience ? JSON.stringify(candidate.experience).substring(0, 200) + '...' : '',
    linkedin_id: candidate.linkedin_id || candidate.linkedin_num_id || ''
  }));
  
  // Create CSV
  const headers = Object.keys(csvData[0]);
  const csvLines = [
    headers.map(h => `"${h}"`).join(','),
    ...csvData.map(row => 
      headers.map(h => {
        const value = row[h];
        return `"${String(value || '').replace(/"/g, '""')}"`;
      }).join(',')
    )
  ];
  
  const csvContent = csvLines.join('\n');
  
  // Save to desktop with descriptive filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `salesforce-solution-architects-${approach}-${timestamp}.csv`;
  const filepath = path.join(os.homedir(), 'Desktop', filename);
  
  fs.writeFileSync(filepath, csvContent, 'utf8');
  
  console.log(`✅ TARGETED RECRUITMENT CSV SAVED: ${filepath}`);
  console.log(`👥 Total qualified: ${candidates.length}`);
  console.log(`🎯 Perfect matches: ${candidates.filter(c => c.isPerfectMatch).length}`);
  console.log(`🏆 High score (8+): ${candidates.filter(c => c.totalScore >= 8).length}`);
  console.log(`🔗 With LinkedIn URLs: ${candidates.filter(c => c.linkedin_url).length}`);
  
  return filepath;
}

/**
 * MAIN RECRUITMENT FUNCTION
 */
async function findTargetedCandidates(approach = 'position') {
  console.log('🚀 TARGETED SALESFORCE SOLUTION ARCHITECT RECRUITMENT');
  console.log('====================================================');
  console.log('Target: Salesforce Solution Architect + Nonprofit + Fundraising');
  
  try {
    const filters = createSalesforceArchitectFilters();
    
    let filter, description;
    switch (approach) {
      case 'position':
        filter = filters.positionFilter;
        description = 'Position: Salesforce + Solution + Architect';
        break;
      case 'salesforce':
        filter = filters.salesforceFilter;
        description = 'Broad: Salesforce Professionals';
        break;
      case 'about':
        filter = filters.aboutFilter;
        description = 'About: Salesforce in Profile Summary';
        break;
      case 'experience':
        filter = filters.experienceFilter;
        description = 'Experience: Salesforce in Work History';
        break;
      default:
        throw new Error('Invalid approach');
    }
    
    // Step 1: Create snapshot
    const snapshotId = await createSnapshot(filter, description);
    
    // Step 2: Wait for completion  
    await waitForSnapshot(snapshotId);
    
    // Step 3: Download data
    const rawCandidates = await downloadData(snapshotId);
    
    // Step 4: Enhanced filtering
    const qualifiedCandidates = enhancedFiltering(rawCandidates);
    
    // Step 5: Save CSV
    const csvPath = saveTargetedCSV(qualifiedCandidates, approach);
    
    console.log('🎉 TARGETED RECRUITMENT COMPLETE!');
    return csvPath;
    
  } catch (error) {
    console.error(`❌ Recruitment failed: ${error.message}`);
    
    if (error.message.includes('no records found')) {
      console.log('💡 SUGGESTION: Try a broader approach:');
      console.log('   node targeted-salesforce-recruitment.cjs salesforce');
      console.log('   node targeted-salesforce-recruitment.cjs about');
    }
    
    throw error;
  }
}

// CLI Interface
if (require.main === module) {
  const approach = process.argv[2] || 'position';
  
  if (!['position', 'salesforce', 'about', 'experience'].includes(approach)) {
    console.log('Usage: node targeted-salesforce-recruitment.cjs [position|salesforce|about|experience]');
    console.log('  position    - Filter by job title (most targeted)');
    console.log('  salesforce  - Broad Salesforce professionals');  
    console.log('  about       - Salesforce in profile summary');
    console.log('  experience  - Salesforce in work history');
    process.exit(1);
  }
  
  findTargetedCandidates(approach)
    .then(path => {
      console.log(`✅ SUCCESS! Targeted recruitment CSV: ${path}`);
      process.exit(0);
    })
    .catch(error => {
      console.error(`❌ FAILED: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { findTargetedCandidates }; 