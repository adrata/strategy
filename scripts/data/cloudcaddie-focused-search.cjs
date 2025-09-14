#!/usr/bin/env node

/**
 * 🎯 CLOUDCADDIE FOCUSED SEARCH - SALESFORCE SOLUTION ARCHITECTS
 * 
 * EXACT TARGET: "Salesforce Solution Architect" with "nonprofit cloud" AND "fundraising" experience
 * 
 * SEARCH APPROACHES:
 * 1. "salesforce" AND "solution" AND "architect" AND "nonprofit" AND "cloud" AND "fundraising"
 * 2. "salesforce solution architect" AND "nonprofit" AND "fundraising"
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const API_KEY = "7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e";
const LINKEDIN_PEOPLE_DATASET = "gd_l1viktl72bvl7bjuj0";

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
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function createFilteredSnapshot(filterConfig, searchName) {
  console.log(`\n🔍 Creating snapshot for: ${searchName}`);
  
  const response = await makeRequest('https://api.brightdata.com/datasets/filter', {
    method: 'POST',
    body: {
      dataset_id: LINKEDIN_PEOPLE_DATASET,
      filter: filterConfig
    }
  });

  if (response.status !== 200) {
    throw new Error(`Failed to create snapshot: ${JSON.stringify(response.data)}`);
  }

  const snapshotId = response.data.snapshot_id;
  console.log(`✅ Snapshot created: ${snapshotId}`);
  return snapshotId;
}

async function waitForCompletion(snapshotId, maxWaitMinutes = 10) {
  console.log(`⏳ Waiting for snapshot ${snapshotId} to complete...`);
  const maxAttempts = maxWaitMinutes * 2; // Check every 30 seconds
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await makeRequest(`https://api.brightdata.com/datasets/snapshots/${snapshotId}/meta`);
    
    if (response.status === 200) {
      const status = response.data.status;
      console.log(`📊 Status (${attempt}/${maxAttempts}): ${status}`);
      
      if (status === 'ready') {
        console.log(`✅ Snapshot ready! Records: ${response.data.record_count}`);
        return response.data;
      } else if (status === 'failed') {
        throw new Error(`Snapshot failed: ${JSON.stringify(response.data)}`);
      }
    }
    
    // Wait 30 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 30000));
  }
  
  throw new Error(`Snapshot timed out after ${maxWaitMinutes} minutes`);
}

async function downloadData(snapshotId) {
  console.log(`📥 Downloading data for snapshot: ${snapshotId}`);
  
  const response = await makeRequest(`https://api.brightdata.com/datasets/snapshots/${snapshotId}?format=json`);
  
  if (response.status !== 200) {
    throw new Error(`Failed to download data: ${JSON.stringify(response.data)}`);
  }

  return response.data;
}

function exportToCSV(data, filename) {
  if (!Array.isArray(data) || data.length === 0) {
    console.log('❌ No data to export');
    return;
  }

  // Extract all unique keys for CSV headers
  const allKeys = new Set();
  data.forEach(record => Object.keys(record).forEach(key => allKeys.add(key)));
  const headers = Array.from(allKeys);

  // Create CSV content
  const csvLines = [headers.join(',')];
  
  data.forEach(record => {
    const row = headers.map(header => {
      const value = record[header] || '';
      // Escape commas and quotes
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csvLines.push(row.join(','));
  });

  // Write to desktop
  const desktopPath = path.join(os.homedir(), 'Desktop');
  const filepath = path.join(desktopPath, filename);
  
  fs.writeFileSync(filepath, csvLines.join('\n'));
  console.log(`✅ Data exported to: ${filepath}`);
  console.log(`📊 Total records: ${data.length}`);
}

async function searchSalesforceArchitects() {
  try {
    console.log('🚀 CLOUDCADDIE RECRUITMENT - SALESFORCE SOLUTION ARCHITECTS');
    console.log('TARGET: Salesforce Solution Architect + Nonprofit Cloud + Fundraising Experience');
    
    // APPROACH 1: Individual Keywords with Work Experience Focus
    console.log('\n🎯 APPROACH 1: Individual Keywords + Work Experience');
    const keywordFilter = {
      "operator": "and",
      "filters": [
        // Salesforce Solution Architect (in position or experience)
        {
          "operator": "and",
          "filters": [
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
            }
          ]
        },
        // Nonprofit experience (prioritize work experience)
        {
          "name": "experience",
          "value": "nonprofit",
          "operator": "includes"
        },
        // Cloud experience
        {
          "name": "experience",
          "value": "cloud",
          "operator": "includes"
        },
        // Geographic filter: US/Canada
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

    const snapshotId1 = await createFilteredSnapshot(keywordFilter, 'Individual Keywords Approach');
    const metadata1 = await waitForCompletion(snapshotId1);
    const data1 = await downloadData(snapshotId1);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    exportToCSV(data1, `CloudCaddie_Salesforce_Keywords_${timestamp}.csv`);

    // APPROACH 2: Exact Phrases (if first approach found candidates)
    if (data1 && data1.length > 0) {
      console.log('\n🎯 APPROACH 2: Exact Phrases');
      const phraseFilter = {
        "operator": "and",
        "filters": [
          // Exact phrase: "salesforce solution architect"
          {
            "name": "position",
            "value": "salesforce solution architect",
            "operator": "includes"
          },
          // Nonprofit + fundraising experience
          {
            "operator": "and",
            "filters": [
              {
                "name": "experience",
                "value": "nonprofit",
                "operator": "includes"
              },
              {
                "name": "experience", 
                "value": "fundraising",
                "operator": "includes"
              }
            ]
          },
          // Geographic filter: US/Canada
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
              }
            ]
          }
        ]
      };

      const snapshotId2 = await createFilteredSnapshot(phraseFilter, 'Exact Phrases Approach');
      const metadata2 = await waitForCompletion(snapshotId2);
      const data2 = await downloadData(snapshotId2);
      
      exportToCSV(data2, `CloudCaddie_Salesforce_Phrases_${timestamp}.csv`);
    }

    console.log('\n🎉 RECRUITMENT SEARCH COMPLETED!');
    console.log('📁 Check your Desktop for CSV files with candidate data');
    
  } catch (error) {
    console.error('❌ Error in recruitment search:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Execute the search
searchSalesforceArchitects(); 