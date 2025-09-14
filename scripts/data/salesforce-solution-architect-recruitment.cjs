#!/usr/bin/env node

/**
 * 🎯 SALESFORCE SOLUTION ARCHITECT RECRUITMENT - WORK EXPERIENCE FOCUSED
 * 
 * UPDATED REQUIREMENTS:
 * - "Salesforce Solution Architect" with "nonprofit" WORK experience + "cloud" + "fundraising" experience
 * - Geographic focus: USA or Canada only
 * - Fast, direct approach - no complex parts API
 * - Two approaches: individual keywords vs exact phrases
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const API_KEY = "7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e";
const LINKEDIN_PEOPLE_DATASET = "gd_l1viktl72bvl7bjuj0"; // Confirmed: 115M LinkedIn people profiles

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
 * CREATE YOUR EXACT SEARCH FILTERS
 */
function createSalesforceArchitectFilters() {
  console.log('🎯 Creating your exact Salesforce Solution Architect filters...');
  
  // APPROACH 1: Individual keywords - "salesforce" AND "solution" AND "architect" AND "nonprofit" AND "cloud" AND "fundraising"
  const individualKeywordsFilter = {
    "operator": "and",
    "filters": [
      // Salesforce Solution Architect in position
      {
        "name": "position",
        "value": "salesforce",
        "operator": "includes"
      },
      {
        "name": "position", 
        "value": "solution",
        "operator": "includes"
      },
      {
        "name": "position",
        "value": "architect",
        "operator": "includes"
      },
      // Nonprofit WORK experience (prioritizing actual work experience)
      {
        "operator": "or",
        "filters": [
          {
            "name": "experience",
            "value": "nonprofit",
            "operator": "includes"
          },
          {
            "name": "current_company_name",
            "value": "nonprofit",
            "operator": "includes"
          },
          {
            "name": "about",
            "value": "nonprofit",
            "operator": "includes"
          }
        ]
      },
      // Geographic focus: USA (US) or Canada (CA) - using country codes
      {
        "operator": "or",
        "filters": [
          {
            "name": "about",
            "value": "US",
            "operator": "includes"
          },
          {
            "name": "about",
            "value": "CA",
            "operator": "includes"
          },
          {
            "name": "about",
            "value": "United States",
            "operator": "includes"
          },
          {
            "name": "about",
            "value": "Canada",
            "operator": "includes"
          }
        ]
      },
      // Cloud experience
      {
        "operator": "or",
        "filters": [
          {
            "name": "position",
            "value": "cloud",
            "operator": "includes"
          },
          {
            "name": "experience",
            "value": "cloud",
            "operator": "includes"
          },
          {
            "name": "about",
            "value": "cloud",
            "operator": "includes"
          }
        ]
      },
      // Fundraising experience
      {
        "operator": "or",
        "filters": [
          {
            "name": "volunteer_experience",
            "value": "fundraising",
            "operator": "includes"
          },
          {
            "name": "about",
            "value": "fundraising",
            "operator": "includes"
          },
          {
            "name": "experience",
            "value": "fundraising",
            "operator": "includes"
          }
        ]
      }
    ]
  };

  // APPROACH 2: Exact phrases - "salesforce solution architect" AND "nonprofit" AND "fundraising"
  const exactPhrasesFilter = {
    "operator": "and",
    "filters": [
      // Exact phrase "salesforce solution architect"
      {
        "name": "position",
        "value": "salesforce solution architect",
        "operator": "includes"
      },
      // Nonprofit WORK experience (prioritizing actual work experience)
      {
        "operator": "or",
        "filters": [
          {
            "name": "experience",
            "value": "nonprofit",
            "operator": "includes"
          },
          {
            "name": "current_company_name",
            "value": "nonprofit",
            "operator": "includes"
          },
          {
            "name": "about",
            "value": "nonprofit",
            "operator": "includes"
          }
        ]
      },
      // Fundraising experience
      {
        "operator": "or",
        "filters": [
          {
            "name": "experience",
            "value": "fundraising",
            "operator": "includes"
          },
          {
            "name": "about",
            "value": "fundraising",
            "operator": "includes"
          }
        ]
      },
      // Geographic focus: USA (US) or Canada (CA) - using country codes
      {
        "operator": "or",
        "filters": [
          {
            "name": "about",
            "value": "US",
            "operator": "includes"
          },
          {
            "name": "about",
            "value": "CA",
            "operator": "includes"
          },
          {
            "name": "about",
            "value": "United States",
            "operator": "includes"
          },
          {
            "name": "about",
            "value": "Canada",
            "operator": "includes"
          }
        ]
      }
    ]
  };

  return { individualKeywordsFilter, exactPhrasesFilter };
}

/**
 * STEP 1: Create filtered snapshot
 */
async function createSnapshot(filter, description = '') {
  console.log(`🔄 Creating snapshot: ${description}`);
  console.log(`📊 Dataset: ${LINKEDIN_PEOPLE_DATASET} (115M LinkedIn people)`);
  console.log(`🔍 Filter: ${JSON.stringify(filter, null, 2)}`);
  
  const payload = {
    "dataset_id": LINKEDIN_PEOPLE_DATASET,
    "filter": filter,
    "records_limit": 100  // Good sample size for recruitment
  };

  try {
    const response = await makeRequest('https://api.brightdata.com/datasets/filter', {
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
  console.log(`⏳ Waiting for snapshot completion: ${snapshotId}`);
  
  for (let i = 0; i < 60; i++) {
    try {
      const status = await makeRequest(`https://api.brightdata.com/datasets/snapshots/${snapshotId}`);
      
      console.log(`📊 Status: ${status.status}`);
      
      if (status.status === 'ready' || status.status === 'completed') {
        console.log('✅ Snapshot ready!');
        return status;
      } else if (status.status === 'failed') {
        const warning = status.warning || 'Unknown error';
        throw new Error(`Snapshot failed: ${warning}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 3000)); // Faster polling
      
    } catch (error) {
      console.error(`❌ Error checking snapshot: ${error.message}`);
      throw error;
    }
  }
  
  throw new Error('Snapshot timeout');
}

/**
 * STEP 3: Download candidate data
 */
async function downloadCandidates(snapshotId) {
  console.log(`⬇️ Downloading candidate data: ${snapshotId}`);
  
  const url = `https://api.brightdata.com/datasets/snapshots/${snapshotId}/download`;
  
  await new Promise(resolve => setTimeout(resolve, 2000)); // Faster download start
  
  try {
    const response = await makeRequest(url);
    
    // Parse JSONL format
    const candidates = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const candidate = JSON.parse(line);
          candidates.push(candidate);
        } catch (e) {
          console.log(`⚠️ Skipping invalid JSON line`);
        }
      }
    }
    
    console.log(`✅ Downloaded ${candidates.length} candidate profiles`);
    return candidates;
    
  } catch (error) {
    console.error(`❌ Download failed: ${error.message}`);
    throw error;
  }
}

/**
 * STEP 4: Create comprehensive recruitment CSV with all key data
 */
function createRecruitmentCSV(candidates, searchType) {
  if (!candidates || candidates.length === 0) {
    console.log('❌ No candidates found');
    return;
  }

  console.log(`💼 Processing ${candidates.length} Salesforce Solution Architect candidates...`);
  
  // Create comprehensive candidate profiles
  const candidateProfiles = candidates.map(candidate => ({
    // BASIC PROFILE INFO
    full_name: candidate.name || '',
    first_name: candidate.first_name || '',
    last_name: candidate.last_name || '',
    linkedin_url: candidate.url || (candidate.linkedin_id ? `https://linkedin.com/in/${candidate.linkedin_id}` : ''),
    linkedin_id: candidate.linkedin_id || candidate.linkedin_num_id || '',
    
    // PROFESSIONAL INFO
    current_position: candidate.position || '',
    current_company: candidate.current_company_name || '',
    about_summary: candidate.about || '',
    
    // LOCATION
    city: candidate.city || '',
    country: candidate.country_code || '',
    location: `${candidate.city || ''}, ${candidate.country_code || ''}`.replace(/^, |, $/, ''),
    
    // EXPERIENCE & SKILLS
    experience: candidate.experience ? (typeof candidate.experience === 'string' ? candidate.experience : JSON.stringify(candidate.experience)) : '',
    education: candidate.education ? (typeof candidate.education === 'string' ? candidate.education : JSON.stringify(candidate.education)) : '',
    certifications: candidate.certifications ? (typeof candidate.certifications === 'string' ? candidate.certifications : JSON.stringify(candidate.certifications)) : '',
    volunteer_experience: candidate.volunteer_experience || '',
    organizations: candidate.organizations ? (typeof candidate.organizations === 'string' ? candidate.organizations : JSON.stringify(candidate.organizations)) : '',
    
    // SOCIAL METRICS
    followers: candidate.followers || '',
    connections: candidate.connections || '',
    
    // QUALIFICATION SCORING (for your review)
    has_salesforce_title: (candidate.position || '').toLowerCase().includes('salesforce') ? 'YES' : 'NO',
    has_solution_title: (candidate.position || '').toLowerCase().includes('solution') ? 'YES' : 'NO',
    has_architect_title: (candidate.position || '').toLowerCase().includes('architect') ? 'YES' : 'NO',
    has_nonprofit_exp: ((candidate.volunteer_experience || '') + (candidate.about || '') + (candidate.experience || '')).toLowerCase().includes('nonprofit') ? 'YES' : 'NO',
    has_cloud_exp: ((candidate.position || '') + (candidate.experience || '') + (candidate.about || '')).toLowerCase().includes('cloud') ? 'YES' : 'NO',
    has_fundraising_exp: ((candidate.volunteer_experience || '') + (candidate.about || '') + (candidate.experience || '')).toLowerCase().includes('fundraising') ? 'YES' : 'NO',
    
    // CONTACT POTENTIAL
    has_linkedin_url: candidate.url ? 'YES' : 'NO',
    profile_completeness: [candidate.position, candidate.about, candidate.experience].filter(Boolean).length,
    
    // RAW DATA (for manual review)
    raw_timestamp: candidate.timestamp || '',
    raw_posts: candidate.posts ? (typeof candidate.posts === 'string' ? candidate.posts.substring(0, 200) + '...' : 'Array data') : '',
    search_type: searchType
  }));
  
  // Sort by relevance (most qualified first)
  candidateProfiles.sort((a, b) => {
    const scoreA = [a.has_salesforce_title, a.has_solution_title, a.has_architect_title, a.has_nonprofit_exp, a.has_cloud_exp, a.has_fundraising_exp].filter(x => x === 'YES').length;
    const scoreB = [b.has_salesforce_title, b.has_solution_title, b.has_architect_title, b.has_nonprofit_exp, b.has_cloud_exp, b.has_fundraising_exp].filter(x => x === 'YES').length;
    return scoreB - scoreA;
  });
  
  // Create CSV
  const headers = Object.keys(candidateProfiles[0]);
  const csvLines = [
    headers.map(h => `"${h}"`).join(','),
    ...candidateProfiles.map(profile => 
      headers.map(h => {
        const value = profile[h];
        if (value === null || value === undefined) return '""';
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    )
  ];
  
  const csvContent = csvLines.join('\n');
  
  // Save to desktop with descriptive filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `salesforce-solution-architects-${searchType}-${timestamp}.csv`;
  const filepath = path.join(os.homedir(), 'Desktop', filename);
  
  fs.writeFileSync(filepath, csvContent, 'utf8');
  
  console.log(`✅ RECRUITMENT CSV SAVED: ${filepath}`);
  console.log(`👥 Total candidates: ${candidateProfiles.length}`);
  console.log(`🎯 Perfect matches (all 6 criteria): ${candidateProfiles.filter(c => [c.has_salesforce_title, c.has_solution_title, c.has_architect_title, c.has_nonprofit_exp, c.has_cloud_exp, c.has_fundraising_exp].filter(x => x === 'YES').length === 6).length}`);
  console.log(`🏆 Strong matches (5+ criteria): ${candidateProfiles.filter(c => [c.has_salesforce_title, c.has_solution_title, c.has_architect_title, c.has_nonprofit_exp, c.has_cloud_exp, c.has_fundraising_exp].filter(x => x === 'YES').length >= 5).length}`);
  console.log(`🔗 With LinkedIn URLs: ${candidateProfiles.filter(c => c.has_linkedin_url === 'YES').length}`);
  
  return filepath;
}

/**
 * MAIN RECRUITMENT FUNCTION
 */
async function runSalesforceArchitectRecruitment(approach = 'keywords') {
  console.log('🚀 SALESFORCE SOLUTION ARCHITECT RECRUITMENT');
  console.log('===========================================');
  console.log('Target: Salesforce Solution Architect + Nonprofit Cloud + Fundraising');
  
  try {
    const filters = createSalesforceArchitectFilters();
    
    let filter, description, searchType;
    if (approach === 'keywords') {
      filter = filters.individualKeywordsFilter;
      description = 'Individual Keywords: salesforce + solution + architect + nonprofit + cloud + fundraising';
      searchType = 'individual-keywords';
    } else {
      filter = filters.exactPhrasesFilter;
      description = 'Exact Phrases: "salesforce solution architect" + nonprofit + fundraising';
      searchType = 'exact-phrases';
    }
    
    // Step 1: Create snapshot
    const snapshotId = await createSnapshot(filter, description);
    
    // Step 2: Wait for completion
    await waitForSnapshot(snapshotId);
    
    // Step 3: Download candidates
    const candidates = await downloadCandidates(snapshotId);
    
    // Step 4: Create comprehensive CSV
    const csvPath = createRecruitmentCSV(candidates, searchType);
    
    console.log('🎉 RECRUITMENT COMPLETE!');
    console.log(`📁 Candidates file: ${csvPath}`);
    
    return { csvPath, candidates: candidates.length };
    
  } catch (error) {
    console.error(`❌ Recruitment failed: ${error.message}`);
    throw error;
  }
}

// CLI Interface
if (require.main === module) {
  const approach = process.argv[2] || 'keywords';
  
  if (!['keywords', 'phrases'].includes(approach)) {
    console.log('Usage: node salesforce-solution-architect-recruitment.cjs [keywords|phrases]');
    console.log('  keywords - "salesforce" AND "solution" AND "architect" AND "nonprofit" AND "cloud" AND "fundraising"');
    console.log('  phrases  - "salesforce solution architect" AND "nonprofit" AND "fundraising"');
    process.exit(1);
  }
  
  runSalesforceArchitectRecruitment(approach)
    .then(result => {
      console.log(`\n✅ SUCCESS! Found ${result.candidates} candidates`);
      console.log(`📄 CSV with all key data: ${result.csvPath}`);
      console.log('\n🎯 NEXT STEPS:');
      console.log('1. Open the CSV to review candidates');
      console.log('2. Sort by qualification scores');
      console.log('3. Use LinkedIn URLs for direct outreach');
      process.exit(0);
    })
    .catch(error => {
      console.error(`❌ FAILED: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { runSalesforceArchitectRecruitment }; 