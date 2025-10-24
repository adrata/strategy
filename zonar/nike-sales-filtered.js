#!/usr/bin/env node

/**
 * Nike Sales Filtered Search
 * 
 * Uses Coresignal's Search Preview API with department filtering
 * to find only sales people at Nike
 */

const fetch = require('node-fetch');
require('dotenv').config();

async function searchNikeSalesFiltered() {
    // Check for API key
    const apiKey = process.env.CORESIGNAL_API_KEY;
    if (!apiKey) {
        console.error('❌ Error: CORESIGNAL_API_KEY environment variable not set');
        process.exit(1);
    }

    console.log('🎯 Nike Sales Team - Department Filtered Search\n');

    try {
        // Search specifically for Sales department at Nike
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
                                            },
                                            {
                                                "match": {
                                                    "experience.department": "Sales"
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

        console.log('📡 Searching for Sales department employees at Nike...');
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

        const salesPeople = await searchResponse.json();
        console.log(`📊 Found ${salesPeople.length} sales people at Nike\n`);
        
        if (!salesPeople || salesPeople.length === 0) {
            console.log('⚠️  No sales people found at Nike');
            console.log('\n💡 Try searching for other departments:');
            console.log('   • Marketing');
            console.log('   • Operations');
            console.log('   • Engineering and Technical');
            console.log('   • Finance & Accounting');
            return;
        }

        // Display sales team
        console.log('🎯 NIKE SALES TEAM:');
        console.log('=' .repeat(30));
        
        salesPeople.forEach((person, index) => {
            console.log(`\n${index + 1}. ${person.full_name}`);
            console.log(`   Title: ${person.active_experience_title || 'Unknown'}`);
            console.log(`   Department: ${person.active_experience_department || 'Unknown'}`);
            console.log(`   Management Level: ${person.active_experience_management_level || 'Unknown'}`);
            console.log(`   Location: ${person.location_full || 'Unknown'}`);
            console.log(`   LinkedIn: ${person.linkedin_url || 'Not available'}`);
            console.log(`   Company: ${person.company_name || 'Unknown'}`);
            console.log(`   Score: ${person._score || 'N/A'}`);
        });

        // Buyer group analysis
        console.log('\n🎯 BUYER GROUP ANALYSIS:');
        console.log('=' .repeat(30));
        
        const titles = salesPeople.map(p => p.active_experience_title).filter(t => t);
        const uniqueTitles = [...new Set(titles)];
        
        console.log(`\nSales Role Types (${uniqueTitles.length} unique):`);
        uniqueTitles.forEach(title => {
            const count = titles.filter(t => t === title).length;
            console.log(`   • ${title} (${count} people)`);
        });

        const managementLevels = salesPeople.map(p => p.active_experience_management_level).filter(m => m);
        const uniqueLevels = [...new Set(managementLevels)];
        
        console.log(`\nManagement Levels (${uniqueLevels.length} unique):`);
        uniqueLevels.forEach(level => {
            const count = managementLevels.filter(l => l === level).length;
            console.log(`   • ${level} (${count} people)`);
        });

        const locations = salesPeople.map(p => p.location_full).filter(l => l && l !== 'Unknown');
        const uniqueLocations = [...new Set(locations)];
        
        if (uniqueLocations.length > 0) {
            console.log(`\nGeographic Distribution (${uniqueLocations.length} locations):`);
            uniqueLocations.forEach(location => {
                const count = locations.filter(l => l === location).length;
                console.log(`   • ${location} (${count} people)`);
            });
        }

        console.log('\n💡 BUYER GROUP INSIGHTS:');
        console.log('=' .repeat(25));
        console.log(`• Total Sales Team Size: ${salesPeople.length} people`);
        console.log(`• Role Diversity: ${uniqueTitles.length} different titles`);
        console.log(`• Management Levels: ${uniqueLevels.length} different levels`);
        console.log(`• Geographic Spread: ${uniqueLocations.length} locations`);
        
        if (uniqueLevels.includes('Manager') || uniqueLevels.includes('Director')) {
            console.log('• ✅ Decision makers identified in sales team');
        }
        
        console.log('\n🚀 NEXT STEPS:');
        console.log('1. Use full collect API for detailed contact information');
        console.log('2. Focus on Manager/Director level contacts for decision makers');
        console.log('3. Consider geographic targeting for regional strategies');
        console.log('4. Analyze role types to understand sales structure');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run the filtered search
searchNikeSalesFiltered();
