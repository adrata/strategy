#!/usr/bin/env node

/**
 * Nike Sales Preview Script
 * 
 * Uses Coresignal's Search Preview API to:
 * 1. Find sales people at Nike using department filtering
 * 2. Understand organizational structure for buyer group analysis
 */

const fetch = require('node-fetch');
require('dotenv').config();

async function searchNikeSalesPreview() {
    // Check for API key
    const apiKey = process.env.CORESIGNAL_API_KEY;
    if (!apiKey) {
        console.error('❌ Error: CORESIGNAL_API_KEY environment variable not set');
        process.exit(1);
    }

    console.log('🔍 Nike Sales Preview - Understanding Organizational Structure...\n');

    try {
        // Step 1: Search for Nike employees with department filtering
        const searchUrl = 'https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl/preview';
        
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

        console.log('📡 Step 1: Getting Nike employee preview...');
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

        const employees = await searchResponse.json();
        console.log(`📊 Found ${employees.length} Nike employees in preview\n`);
        
        if (!employees || employees.length === 0) {
            console.log('⚠️  No employees found at Nike');
            return;
        }

        // Step 2: Analyze departments and organizational structure
        console.log('📊 Step 2: Analyzing organizational structure...\n');
        
        const departmentStats = {};
        const salesPeople = [];
        const managementLevels = {};
        
        employees.forEach(employee => {
            const department = employee.active_experience_department || 'Unknown';
            const managementLevel = employee.active_experience_management_level || 'Unknown';
            const title = employee.active_experience_title || 'Unknown';
            
            // Count departments
            departmentStats[department] = (departmentStats[department] || 0) + 1;
            
            // Count management levels
            managementLevels[managementLevel] = (managementLevels[managementLevel] || 0) + 1;
            
            // Identify sales people
            if (department.toLowerCase().includes('sales') || 
                title.toLowerCase().includes('sales') ||
                title.toLowerCase().includes('seller') ||
                title.toLowerCase().includes('retail')) {
                salesPeople.push({
                    name: employee.full_name,
                    title: title,
                    department: department,
                    managementLevel: managementLevel,
                    location: employee.location_full,
                    linkedin: employee.linkedin_url,
                    company: employee.company_name
                });
            }
        });

        // Step 3: Display organizational analysis
        console.log('🏢 NIKE ORGANIZATIONAL STRUCTURE ANALYSIS');
        console.log('=' .repeat(50));
        
        console.log('\n📈 DEPARTMENT BREAKDOWN:');
        Object.entries(departmentStats)
            .sort(([,a], [,b]) => b - a)
            .forEach(([dept, count]) => {
                console.log(`   ${dept}: ${count} employees`);
            });

        console.log('\n👔 MANAGEMENT LEVEL BREAKDOWN:');
        Object.entries(managementLevels)
            .sort(([,a], [,b]) => b - a)
            .forEach(([level, count]) => {
                console.log(`   ${level}: ${count} employees`);
            });

        console.log('\n🎯 SALES TEAM ANALYSIS:');
        console.log('=' .repeat(30));
        
        if (salesPeople.length > 0) {
            console.log(`Found ${salesPeople.length} sales people at Nike:\n`);
            
            salesPeople.forEach((person, index) => {
                console.log(`${index + 1}. ${person.name}`);
                console.log(`   Title: ${person.title}`);
                console.log(`   Department: ${person.department}`);
                console.log(`   Management Level: ${person.managementLevel}`);
                console.log(`   Location: ${person.location}`);
                console.log(`   LinkedIn: ${person.linkedin}`);
                console.log('');
            });

            // Buyer group analysis
            console.log('🎯 BUYER GROUP INSIGHTS:');
            console.log('=' .repeat(25));
            
            const salesTitles = salesPeople.map(p => p.title);
            const uniqueTitles = [...new Set(salesTitles)];
            
            console.log(`\nSales Role Types Found:`);
            uniqueTitles.forEach(title => {
                const count = salesTitles.filter(t => t === title).length;
                console.log(`   • ${title} (${count} people)`);
            });

            const locations = salesPeople.map(p => p.location).filter(l => l && l !== 'Unknown');
            const uniqueLocations = [...new Set(locations)];
            
            if (uniqueLocations.length > 0) {
                console.log(`\nGeographic Distribution:`);
                uniqueLocations.forEach(location => {
                    const count = locations.filter(l => l === location).length;
                    console.log(`   • ${location} (${count} people)`);
                });
            }

        } else {
            console.log('⚠️  No sales people found in preview data');
            console.log('\nAvailable departments for filtering:');
            Object.keys(departmentStats).forEach(dept => {
                console.log(`   • ${dept}`);
            });
        }

        console.log('\n💡 NEXT STEPS FOR BUYER GROUP ANALYSIS:');
        console.log('=' .repeat(40));
        console.log('1. Use department filtering to target specific roles');
        console.log('2. Focus on decision makers and management levels');
        console.log('3. Consider geographic distribution for regional strategies');
        console.log('4. Use preview data to identify key contacts before full collection');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run the preview analysis
searchNikeSalesPreview();
