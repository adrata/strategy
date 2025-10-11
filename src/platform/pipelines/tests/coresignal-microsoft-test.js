#!/usr/bin/env node

/**
 * 🔍 CORESIGNAL MICROSOFT SPECIFIC TEST
 * 
 * Test specific searches for Microsoft employees
 */

const fetch = require('node-fetch');

class CoreSignalMicrosoftTester {
    constructor() {
        this.config = {
            CORESIGNAL_API_KEY: process.env.CORESIGNAL_API_KEY,
            CORESIGNAL_BASE_URL: 'https://api.coresignal.com'
        };
    }

    async testMicrosoftSearches() {
        console.log('🔍 Testing Microsoft-Specific Searches...');
        
        const url = `${this.config.CORESIGNAL_BASE_URL}/cdapi/v2/employee_multi_source/search/es_dsl/preview`;
        
        // Test different Microsoft search variations
        const microsoftQueries = [
            // Query 1: Exact company name match
            {
                query: {
                    term: {
                        "company_name": "Microsoft"
                    }
                }
            },
            // Query 2: Case-insensitive match
            {
                query: {
                    match: {
                        "company_name": "microsoft"
                    }
                }
            },
            // Query 3: Query string search
            {
                query: {
                    query_string: {
                        query: "Microsoft",
                        default_field: "company_name"
                    }
                }
            },
            // Query 4: Fuzzy search
            {
                query: {
                    fuzzy: {
                        "company_name": {
                            "value": "Microsoft",
                            "fuzziness": "AUTO"
                        }
                    }
                }
            },
            // Query 5: Wildcard search
            {
                query: {
                    wildcard: {
                        "company_name": "*Microsoft*"
                    }
                }
            },
            // Query 6: Multi-match
            {
                query: {
                    multi_match: {
                        "query": "Microsoft",
                        "fields": ["company_name", "company_linkedin_url", "company_website"]
                    }
                }
            }
        ];

        for (let i = 0; i < microsoftQueries.length; i++) {
            console.log(`\n   Test ${i + 1}: ${Object.keys(microsoftQueries[i].query)[0]}`);
            
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'apikey': this.config.CORESIGNAL_API_KEY.trim(),
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(microsoftQueries[i]),
                    timeout: 15000
                });

                console.log(`   Status: ${response.status} ${response.statusText}`);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log(`   Results: ${Array.isArray(data) ? data.length : 'N/A'}`);
                    
                    if (Array.isArray(data) && data.length > 0) {
                        console.log(`   Sample companies:`, data.slice(0, 5).map(emp => emp.company_name));
                        console.log(`   Sample titles:`, data.slice(0, 5).map(emp => emp.active_experience_title));
                        console.log(`   Sample management levels:`, data.slice(0, 5).map(emp => emp.active_experience_management_level));
                        
                        // Look for CFO/CRO specifically
                        const cfoCro = data.filter(emp => 
                            emp.active_experience_title && 
                            (emp.active_experience_title.toLowerCase().includes('cfo') || 
                             emp.active_experience_title.toLowerCase().includes('chief financial') ||
                             emp.active_experience_title.toLowerCase().includes('cro') ||
                             emp.active_experience_title.toLowerCase().includes('chief revenue'))
                        );
                        
                        if (cfoCro.length > 0) {
                            console.log(`   🎯 CFO/CRO found:`, cfoCro.map(emp => `${emp.full_name} (${emp.active_experience_title})`));
                        }
                        
                        break; // Stop after first successful result
                    }
                } else {
                    const errorText = await response.text();
                    console.log(`   Error: ${errorText}`);
                }
            } catch (error) {
                console.log(`   Exception: ${error.message}`);
            }
        }
    }

    async testCFOSearch() {
        console.log('\n🔍 Testing CFO Search with Microsoft...');
        
        const url = `${this.config.CORESIGNAL_BASE_URL}/cdapi/v2/employee_multi_source/search/es_dsl/preview`;
        
        // Test CFO search with different approaches
        const cfoQueries = [
            // Query 1: Company + CFO title
            {
                query: {
                    bool: {
                        must: [
                            { match: { "company_name": "Microsoft" } },
                            { match: { "active_experience_title": "CFO" } }
                        ]
                    }
                }
            },
            // Query 2: Company + Chief Financial Officer
            {
                query: {
                    bool: {
                        must: [
                            { match: { "company_name": "Microsoft" } },
                            { match: { "active_experience_title": "Chief Financial Officer" } }
                        ]
                    }
                }
            },
            // Query 3: CFO with C-Level filter
            {
                query: {
                    bool: {
                        must: [
                            { match: { "company_name": "Microsoft" } },
                            { match: { "active_experience_title": "CFO" } }
                        ],
                        filter: [
                            { term: { "active_experience_management_level": "C-Level" } }
                        ]
                    }
                }
            },
            // Query 4: Query string approach
            {
                query: {
                    query_string: {
                        query: "Microsoft AND (CFO OR \"Chief Financial Officer\")",
                        default_field: "company_name,active_experience_title"
                    }
                }
            }
        ];

        for (let i = 0; i < cfoQueries.length; i++) {
            console.log(`\n   CFO Test ${i + 1}: ${JSON.stringify(cfoQueries[i].query).substring(0, 100)}...`);
            
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'apikey': this.config.CORESIGNAL_API_KEY.trim(),
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(cfoQueries[i]),
                    timeout: 15000
                });

                console.log(`   Status: ${response.status} ${response.statusText}`);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log(`   Results: ${Array.isArray(data) ? data.length : 'N/A'}`);
                    
                    if (Array.isArray(data) && data.length > 0) {
                        console.log(`   CFO Results:`, data.map(emp => `${emp.full_name} (${emp.active_experience_title}) - ${emp.active_experience_management_level}`));
                    }
                } else {
                    const errorText = await response.text();
                    console.log(`   Error: ${errorText}`);
                }
            } catch (error) {
                console.log(`   Exception: ${error.message}`);
            }
        }
    }

    async runAllTests() {
        console.log('🚀 CoreSignal Microsoft Test Suite');
        console.log('==================================');
        
        if (!this.config.CORESIGNAL_API_KEY) {
            console.log('❌ CoreSignal API key not configured');
            return;
        }

        await this.testMicrosoftSearches();
        await this.testCFOSearch();
        
        console.log('\n✅ Test suite complete!');
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new CoreSignalMicrosoftTester();
    tester.runAllTests()
        .then(() => {
            process.exit(0);
        })
        .catch(error => {
            console.error('Test suite failed:', error);
            process.exit(1);
        });
}

module.exports = CoreSignalMicrosoftTester;
