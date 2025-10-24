#!/usr/bin/env node

/**
 * Simple Nike Sales Search Script
 * 
 * Searches for people in the Sales department at Nike using Coresignal API
 */

const fetch = require('node-fetch');
require('dotenv').config();

async function searchNikeSales() {
    // Check for API key
    const apiKey = process.env.CORESIGNAL_API_KEY;
    if (!apiKey) {
        console.error('❌ Error: CORESIGNAL_API_KEY environment variable not set');
        console.log('Please set your Coresignal API key:');
        console.log('export CORESIGNAL_API_KEY="your-api-key-here"');
        process.exit(1);
    }

    console.log('🔍 Searching for employees at Nike...');

    try {
        // Step 1: Search for employee IDs using Elasticsearch DSL
        const searchUrl = 'https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl';
        
        const searchQuery = {
            "query": {
                "bool": {
                    "must": [
                        {
                            "nested": {
                                "path": "experience",
                                "query": {
                                    "bool": {
                                        "must": [
                                            {
                                                "match": {
                                                    "experience.company_name": "Nike"
                                                }
                                            },
                                            {
                                                "term": {
                                                    "experience.active_experience": 1
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        };

        console.log('📡 Step 1: Searching for employee IDs...');
        const searchResponse = await fetch(searchUrl, {
            method: 'POST',
            headers: {
                'apikey': apiKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(searchQuery)
        });

        if (!searchResponse.ok) {
            const errorText = await searchResponse.text();
            console.error('Search API Error:', errorText);
            throw new Error(`Search API failed: ${searchResponse.status} ${searchResponse.statusText}`);
        }

        const searchData = await searchResponse.json();
        console.log(`📊 Found ${searchData.length} employee IDs`);
        
        if (!searchData || searchData.length === 0) {
            console.log('⚠️  No employees found at Nike');
            return;
        }

        // Step 2: Collect full employee data and filter for Sales department
        console.log('📡 Step 2: Collecting full employee data and filtering for Sales...');
        const employees = [];
        const limit = Math.min(20, searchData.length); // Check more employees to find sales people
        let salesCount = 0;
        
        for (let i = 0; i < limit && salesCount < 5; i++) {
            const employeeId = searchData[i];
            console.log(`   Collecting data for employee ${i + 1}/${limit} (ID: ${employeeId})...`);
            
            try {
                const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/employee_multi_source/collect/${employeeId}`, {
                    method: 'GET',
                    headers: {
                        'apikey': apiKey,
                        'Accept': 'application/json'
                    }
                });

                if (collectResponse.ok) {
                    const employeeData = await collectResponse.json();
                    const department = employeeData.active_experience_department || employeeData.experience?.[0]?.department;
                    
                    if (department && department.toLowerCase().includes('sales')) {
                        employees.push(employeeData);
                        salesCount++;
                        console.log(`   ✅ Found Sales person: ${employeeData.full_name || 'Unknown'} (${department})`);
                    } else {
                        console.log(`   ⏭️  Skipped ${employeeData.full_name || 'Unknown'} (${department || 'Unknown department'})`);
                    }
                } else {
                    const errorText = await collectResponse.text();
                    console.log(`   ⚠️ Failed to collect data for employee ${employeeId}: ${collectResponse.status} ${errorText}`);
                }
            } catch (error) {
                console.log(`   ⚠️ Error collecting data for employee ${employeeId}: ${error.message}`);
            }
        }

        console.log(`\n✅ Successfully collected ${employees.length} employee profiles:\n`);

        // Display results
        employees.forEach((employee, index) => {
            console.log(`${index + 1}. ${employee.full_name || 'Unknown'}`);
            console.log(`   Title: ${employee.active_experience_title || 'Unknown'}`);
            console.log(`   Department: ${employee.active_experience_department || 'Unknown'}`);
            console.log(`   LinkedIn: ${employee.linkedin_url || 'Not available'}`);
            console.log(`   Email: ${employee.primary_professional_email || 'Not available'}`);
            console.log(`   Location: ${employee.location_full || 'Unknown'}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run the search
searchNikeSales();
