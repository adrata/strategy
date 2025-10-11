#!/usr/bin/env node

/**
 * 🔍 CORESIGNAL COMPANY DISCOVERY TEST
 * 
 * Discover what companies are available in the Search Preview dataset
 */

const fetch = require('node-fetch');

class CoreSignalCompanyDiscovery {
    constructor() {
        this.config = {
            CORESIGNAL_API_KEY: process.env.CORESIGNAL_API_KEY,
            CORESIGNAL_BASE_URL: 'https://api.coresignal.com'
        };
    }

    async discoverCompanies() {
        console.log('🔍 Discovering Companies in Search Preview Dataset...');
        
        const url = `${this.config.CORESIGNAL_BASE_URL}/cdapi/v2/employee_multi_source/search/es_dsl/preview`;
        
        // Get a sample of companies from the dataset
        const query = {
            query: {
                match_all: {}
            }
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'apikey': this.config.CORESIGNAL_API_KEY.trim(),
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(query),
                timeout: 15000
            });

            console.log(`   Status: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`   Total results: ${Array.isArray(data) ? data.length : 'N/A'}`);
                
                if (Array.isArray(data) && data.length > 0) {
                    // Extract unique companies
                    const companies = [...new Set(data.map(emp => emp.company_name).filter(Boolean))];
                    console.log(`   Unique companies found: ${companies.length}`);
                    
                    // Show first 20 companies
                    console.log(`   Sample companies:`);
                    companies.slice(0, 20).forEach((company, index) => {
                        console.log(`     ${index + 1}. ${company}`);
                    });
                    
                    // Look for Microsoft variations
                    const microsoftVariations = companies.filter(company => 
                        company && company.toLowerCase().includes('microsoft')
                    );
                    
                    if (microsoftVariations.length > 0) {
                        console.log(`\n   🎯 Microsoft variations found:`);
                        microsoftVariations.forEach(company => {
                            console.log(`     - ${company}`);
                        });
                    } else {
                        console.log(`\n   ⚠️ No Microsoft variations found in dataset`);
                    }
                    
                    // Look for major tech companies
                    const techCompanies = companies.filter(company => 
                        company && (
                            company.toLowerCase().includes('google') ||
                            company.toLowerCase().includes('apple') ||
                            company.toLowerCase().includes('amazon') ||
                            company.toLowerCase().includes('meta') ||
                            company.toLowerCase().includes('tesla') ||
                            company.toLowerCase().includes('netflix') ||
                            company.toLowerCase().includes('uber')
                        )
                    );
                    
                    if (techCompanies.length > 0) {
                        console.log(`\n   🏢 Major tech companies found:`);
                        techCompanies.forEach(company => {
                            console.log(`     - ${company}`);
                        });
                    }
                    
                    // Look for CFO/CRO titles
                    const cfoCroEmployees = data.filter(emp => 
                        emp.active_experience_title && 
                        (emp.active_experience_title.toLowerCase().includes('cfo') || 
                         emp.active_experience_title.toLowerCase().includes('chief financial') ||
                         emp.active_experience_title.toLowerCase().includes('cro') ||
                         emp.active_experience_title.toLowerCase().includes('chief revenue'))
                    );
                    
                    if (cfoCroEmployees.length > 0) {
                        console.log(`\n   💰 CFO/CRO employees found: ${cfoCroEmployees.length}`);
                        cfoCroEmployees.slice(0, 10).forEach(emp => {
                            console.log(`     - ${emp.full_name} (${emp.active_experience_title}) at ${emp.company_name}`);
                        });
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

    async testPagination() {
        console.log('\n🔍 Testing Pagination to Get More Companies...');
        
        const url = `${this.config.CORESIGNAL_BASE_URL}/cdapi/v2/employee_multi_source/search/es_dsl/preview`;
        
        const query = {
            query: {
                match_all: {}
            }
        };

        const allCompanies = new Set();
        
        for (let page = 1; page <= 5; page++) {
            console.log(`\n   Page ${page}:`);
            
            try {
                const response = await fetch(`${url}?page=${page}`, {
                    method: 'POST',
                    headers: {
                        'apikey': this.config.CORESIGNAL_API_KEY.trim(),
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(query),
                    timeout: 15000
                });

                console.log(`   Status: ${response.status} ${response.statusText}`);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log(`   Results: ${Array.isArray(data) ? data.length : 'N/A'}`);
                    
                    if (Array.isArray(data) && data.length > 0) {
                        data.forEach(emp => {
                            if (emp.company_name) {
                                allCompanies.add(emp.company_name);
                            }
                        });
                        
                        console.log(`   Total unique companies so far: ${allCompanies.size}`);
                        
                        // Check for Microsoft in this page
                        const microsoftInPage = data.filter(emp => 
                            emp.company_name && emp.company_name.toLowerCase().includes('microsoft')
                        );
                        
                        if (microsoftInPage.length > 0) {
                            console.log(`   🎯 Microsoft found on page ${page}:`, microsoftInPage.map(emp => emp.company_name));
                        }
                    } else {
                        console.log(`   No more results on page ${page}`);
                        break;
                    }
                } else {
                    const errorText = await response.text();
                    console.log(`   Error: ${errorText}`);
                    break;
                }
            } catch (error) {
                console.log(`   Exception: ${error.message}`);
                break;
            }
        }
        
        console.log(`\n📊 Final Results:`);
        console.log(`   Total unique companies discovered: ${allCompanies.size}`);
        
        // Convert to array and sort
        const companiesArray = Array.from(allCompanies).sort();
        
        // Look for Microsoft variations
        const microsoftVariations = companiesArray.filter(company => 
            company.toLowerCase().includes('microsoft')
        );
        
        if (microsoftVariations.length > 0) {
            console.log(`   🎯 Microsoft variations found:`);
            microsoftVariations.forEach(company => {
                console.log(`     - ${company}`);
            });
        } else {
            console.log(`   ⚠️ No Microsoft variations found in any page`);
        }
    }

    async runAllTests() {
        console.log('🚀 CoreSignal Company Discovery Test Suite');
        console.log('==========================================');
        
        if (!this.config.CORESIGNAL_API_KEY) {
            console.log('❌ CoreSignal API key not configured');
            return;
        }

        await this.discoverCompanies();
        await this.testPagination();
        
        console.log('\n✅ Test suite complete!');
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new CoreSignalCompanyDiscovery();
    tester.runAllTests()
        .then(() => {
            process.exit(0);
        })
        .catch(error => {
            console.error('Test suite failed:', error);
            process.exit(1);
        });
}

module.exports = CoreSignalCompanyDiscovery;
