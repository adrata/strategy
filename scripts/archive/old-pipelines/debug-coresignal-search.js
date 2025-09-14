#!/usr/bin/env node

/**
 * DEBUG CORESIGNAL SEARCH - Find out why we're not getting executives
 */

const CONFIG = {
    CORESIGNAL_API_KEY: 'CREDENTIAL_REMOVED_FOR_SECURITY',
    CORESIGNAL_BASE_URL: 'https://api.coresignal.com'
};

async function debugCompanySearch(website) {
    console.log(`\n🔍 DEBUGGING: ${website}`);
    console.log('=' .repeat(50));
    
    try {
        // Step 1: Get company data
        const domain = website.replace(/^https?:\/\//, '').replace(/^www\./, '');
        console.log(`1️⃣ Searching for company: ${domain}`);
        
        const companyResponse = await fetch(`${CONFIG.CORESIGNAL_BASE_URL}/cdapi/v2/company_multi_source/enrich?website=${domain}`, {
            method: 'GET',
            headers: {
                'apikey': CONFIG.CORESIGNAL_API_KEY,
                'Accept': 'application/json'
            }
        });

        if (!companyResponse.ok) {
            console.log(`❌ Company search failed: ${companyResponse.status}`);
            return;
        }

        const companyData = await companyResponse.json();
        console.log(`✅ Found company: ${companyData.company_name} (ID: ${companyData.id})`);
        
        // Step 2: Try different employee search approaches
        await testEmployeeSearchApproaches(companyData);
        
    } catch (error) {
        console.error(`❌ Error debugging ${website}:`, error.message);
    }
}

async function testEmployeeSearchApproaches(companyData) {
    console.log(`\n2️⃣ Testing employee search approaches for ${companyData.company_name}...`);
    
    // Approach 1: Simple URL parameter search (from working example)
    console.log('\n🔍 Approach 1: URL Parameter Search');
    await testUrlParameterSearch(companyData);
    
    // Approach 2: Elasticsearch DSL with nested experience
    console.log('\n🔍 Approach 2: Elasticsearch DSL (Nested Experience)');
    await testElasticsearchDSL(companyData);
    
    // Approach 3: Simple Elasticsearch DSL
    console.log('\n🔍 Approach 3: Simple Elasticsearch DSL');
    await testSimpleElasticsearchDSL(companyData);
}

async function testUrlParameterSearch(companyData) {
    try {
        const searchParams = new URLSearchParams({
            company_website: companyData.website || `${companyData.company_name.toLowerCase().replace(/\s+/g, '')}.com`,
            title: 'CEO',
            limit: '3'
        });
        
        const response = await fetch(`${CONFIG.CORESIGNAL_BASE_URL}/cdapi/v2/employee_multi_source/search?${searchParams}`, {
            headers: {
                'apikey': CONFIG.CORESIGNAL_API_KEY,
                'Accept': 'application/json'
            }
        });
        
        console.log(`   Status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`   Results: ${Array.isArray(data) ? data.length : 'Not an array'} employees found`);
            if (Array.isArray(data) && data.length > 0) {
                console.log(`   First result: ${data[0].first_name} ${data[0].last_name} - ${data[0].title}`);
            }
        } else {
            const errorText = await response.text();
            console.log(`   Error: ${errorText}`);
        }
        
    } catch (error) {
        console.log(`   Exception: ${error.message}`);
    }
}

async function testElasticsearchDSL(companyData) {
    try {
        const searchQuery = {
            query: {
                bool: {
                    must: [
                        {
                            nested: {
                                path: "experience",
                                query: {
                                    bool: {
                                        must: [
                                            {
                                                term: {
                                                    "experience.company_id": companyData.id
                                                }
                                            },
                                            {
                                                term: {
                                                    "experience.active_experience": 1
                                                }
                                            },
                                            {
                                                query_string: {
                                                    query: "CEO OR \"Chief Executive Officer\"",
                                                    default_field: "experience.position_title",
                                                    default_operator: "or"
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    ]
                }
            },
            sort: ["_score"]
        };
        
        console.log(`   Query:`, JSON.stringify(searchQuery, null, 2));
        
        const response = await fetch(`${CONFIG.CORESIGNAL_BASE_URL}/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=5`, {
            method: 'POST',
            headers: {
                'apikey': CONFIG.CORESIGNAL_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(searchQuery)
        });
        
        console.log(`   Status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`   Full response:`, JSON.stringify(data, null, 2));
            
            if (data.hits && data.hits.hits) {
                console.log(`   Results: ${data.hits.hits.length} employees found`);
                if (data.hits.hits.length > 0) {
                    console.log(`   First result ID: ${data.hits.hits[0]._id}`);
                }
            }
        } else {
            const errorText = await response.text();
            console.log(`   Error: ${errorText}`);
        }
        
    } catch (error) {
        console.log(`   Exception: ${error.message}`);
    }
}

async function testSimpleElasticsearchDSL(companyData) {
    try {
        const searchQuery = {
            query: {
                bool: {
                    must: [
                        {
                            match: {
                                "company_name": companyData.company_name
                            }
                        },
                        {
                            query_string: {
                                query: "CEO OR \"Chief Executive Officer\"",
                                default_field: "title",
                                default_operator: "or"
                            }
                        }
                    ]
                }
            },
            sort: ["_score"]
        };
        
        console.log(`   Query:`, JSON.stringify(searchQuery, null, 2));
        
        const response = await fetch(`${CONFIG.CORESIGNAL_BASE_URL}/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=5`, {
            method: 'POST',
            headers: {
                'apikey': CONFIG.CORESIGNAL_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(searchQuery)
        });
        
        console.log(`   Status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`   Full response:`, JSON.stringify(data, null, 2));
            
            if (data.hits && data.hits.hits) {
                console.log(`   Results: ${data.hits.hits.length} employees found`);
                if (data.hits.hits.length > 0) {
                    console.log(`   First result ID: ${data.hits.hits[0]._id}`);
                }
            }
        } else {
            const errorText = await response.text();
            console.log(`   Error: ${errorText}`);
        }
        
    } catch (error) {
        console.log(`   Exception: ${error.message}`);
    }
}

// Test with a few companies
async function main() {
    console.log('🚀 CORESIGNAL SEARCH DEBUG - 2025');
    console.log('Finding out why we\'re not getting executives...\n');
    
    const testCompanies = [
        'www.optimizely.com',
        'pos.toasttab.com',
        'www.highradius.com'
    ];
    
    for (const company of testCompanies) {
        await debugCompanySearch(company);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limiting
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('❌ Debug script failed:', error);
        process.exit(1);
    });
}
