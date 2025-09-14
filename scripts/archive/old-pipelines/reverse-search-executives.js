#!/usr/bin/env node

/**
 * REVERSE SEARCH KNOWN EXECUTIVES IN CORESIGNAL
 * Find the actual data structure for known CEOs/CFOs to debug our search logic
 */

const CONFIG = {
    CORESIGNAL_API_KEY: process.env.CORESIGNAL_API_KEY || 'your-api-key-here',
    CORESIGNAL_BASE_URL: 'https://api.coresignal.com'
};

// Known executives to reverse search
const KNOWN_EXECUTIVES = [
    { name: 'Sue Marks', company: 'Cielo Talent', role: 'CEO', website: 'cielotalent.com' },
    { name: 'Brian Lindstrom', company: 'Cielo Talent', role: 'CFO', website: 'cielotalent.com' },
    { name: 'Chris Comparato', company: 'Toast', role: 'CEO', website: 'pos.toasttab.com' },
    { name: 'Elena Gomez', company: 'Toast', role: 'CFO', website: 'pos.toasttab.com' },
    { name: 'Vince De Palma', company: 'Softchoice', role: 'CEO', website: 'softchoice.com' },
    { name: 'Bryan Caplin', company: 'Softchoice', role: 'CFO', website: 'softchoice.com' }
];

class ExecutiveReverseSearcher {
    constructor() {
        this.findings = [];
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Search for executive by name across all companies
     */
    async searchExecutiveByName(executiveName) {
        try {
            console.log(`\n🔍 Reverse searching: ${executiveName}`);
            
            // Search by full name using general employee search
            const searchQuery = {
                query: {
                    bool: {
                        must: [
                            {
                                query_string: {
                                    query: `"${executiveName}"`,
                                    default_field: "full_name",
                                    default_operator: "and"
                                }
                            }
                        ]
                    }
                },
                sort: ["_score"]
            };

            const searchResponse = await fetch(`${CONFIG.CORESIGNAL_BASE_URL}/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=10`, {
                method: 'POST',
                headers: {
                    'apikey': CONFIG.CORESIGNAL_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(searchQuery)
            });

            if (!searchResponse.ok) {
                console.log(`   ❌ Search failed: ${searchResponse.status}`);
                return null;
            }

            const candidateIds = await searchResponse.json();
            console.log(`   📋 Found ${candidateIds.length} potential matches`);

            if (candidateIds.length === 0) {
                return null;
            }

            // Collect detailed profiles for all matches
            const profiles = [];
            for (const candidateId of candidateIds.slice(0, 5)) {
                try {
                    console.log(`   📥 Collecting profile for ID: ${candidateId}`);
                    
                    const collectResponse = await fetch(`${CONFIG.CORESIGNAL_BASE_URL}/cdapi/v2/employee_multi_source/collect/${candidateId}`, {
                        method: 'GET',
                        headers: {
                            'apikey': CONFIG.CORESIGNAL_API_KEY,
                            'Accept': 'application/json'
                        }
                    });

                    if (collectResponse.ok) {
                        const profile = await collectResponse.json();
                        profiles.push(profile);
                        console.log(`   ✅ Profile: ${profile.full_name} - ${profile.active_experience_title} at ${profile.active_experience_company_name}`);
                    }
                    
                    await this.delay(500);
                } catch (error) {
                    console.log(`   ⚠️  Error collecting profile ${candidateId}: ${error.message}`);
                }
            }

            return profiles;

        } catch (error) {
            console.error(`❌ Error searching for ${executiveName}:`, error.message);
            return null;
        }
    }

    /**
     * Get company data for comparison
     */
    async getCompanyData(website) {
        try {
            const companyResponse = await fetch(`${CONFIG.CORESIGNAL_BASE_URL}/cdapi/v2/company_multi_source/enrich?website=${website}`, {
                method: 'GET',
                headers: {
                    'apikey': CONFIG.CORESIGNAL_API_KEY,
                    'Accept': 'application/json'
                }
            });

            if (companyResponse.ok) {
                return await companyResponse.json();
            }
        } catch (error) {
            console.log(`   ⚠️  Company lookup failed for ${website}`);
        }
        return null;
    }

    /**
     * Analyze findings to understand data gaps
     */
    analyzeFindings() {
        console.log(`\n📊 ANALYSIS OF REVERSE SEARCH FINDINGS`);
        console.log(`=============================================`);

        const foundExecutives = this.findings.filter(f => f.profiles && f.profiles.length > 0);
        const notFoundExecutives = this.findings.filter(f => !f.profiles || f.profiles.length === 0);

        console.log(`\n✅ FOUND EXECUTIVES (${foundExecutives.length}):`);
        foundExecutives.forEach(exec => {
            console.log(`\n👤 ${exec.name} (${exec.role} at ${exec.company}):`);
            exec.profiles.forEach((profile, i) => {
                console.log(`   ${i + 1}. ${profile.full_name}`);
                console.log(`      Title: ${profile.active_experience_title || 'N/A'}`);
                console.log(`      Company: ${profile.active_experience_company_name || 'N/A'}`);
                console.log(`      Company ID: ${profile.active_experience_company_id || 'N/A'}`);
                console.log(`      LinkedIn: ${profile.professional_network_url || 'N/A'}`);
                console.log(`      Email: ${profile.primary_professional_email || 'N/A'}`);
            });
        });

        console.log(`\n❌ NOT FOUND EXECUTIVES (${notFoundExecutives.length}):`);
        notFoundExecutives.forEach(exec => {
            console.log(`   • ${exec.name} (${exec.role} at ${exec.company})`);
        });

        // Analyze title patterns
        console.log(`\n🎯 TITLE PATTERNS FOUND:`);
        const titlePatterns = new Set();
        foundExecutives.forEach(exec => {
            exec.profiles.forEach(profile => {
                if (profile.active_experience_title) {
                    titlePatterns.add(profile.active_experience_title);
                }
            });
        });
        
        Array.from(titlePatterns).forEach(title => {
            console.log(`   • "${title}"`);
        });

        // Company ID analysis
        console.log(`\n🏢 COMPANY ID ANALYSIS:`);
        foundExecutives.forEach(exec => {
            const companyIds = new Set();
            exec.profiles.forEach(profile => {
                if (profile.active_experience_company_id) {
                    companyIds.add(profile.active_experience_company_id);
                }
            });
            console.log(`   ${exec.company}: Company IDs found: [${Array.from(companyIds).join(', ')}]`);
        });
    }

    /**
     * Main execution function
     */
    async run() {
        console.log(`🚀 REVERSE SEARCH KNOWN EXECUTIVES IN CORESIGNAL`);
        console.log(`================================================`);
        console.log(`Searching for ${KNOWN_EXECUTIVES.length} known executives...`);

        for (const executive of KNOWN_EXECUTIVES) {
            console.log(`\n${'='.repeat(60)}`);
            
            // Get company data first
            const companyData = await this.getCompanyData(executive.website);
            if (companyData) {
                console.log(`🏢 Company: ${companyData.company_name} (ID: ${companyData.id})`);
            }

            // Search for the executive
            const profiles = await this.searchExecutiveByName(executive.name);
            
            this.findings.push({
                ...executive,
                profiles: profiles,
                companyData: companyData
            });

            await this.delay(1000); // Rate limiting
        }

        // Analyze all findings
        this.analyzeFindings();

        // Generate recommendations
        this.generateRecommendations();
    }

    /**
     * Generate recommendations based on findings
     */
    generateRecommendations() {
        console.log(`\n💡 RECOMMENDATIONS FOR FIXING SEARCH LOGIC:`);
        console.log(`==========================================`);

        const foundExecutives = this.findings.filter(f => f.profiles && f.profiles.length > 0);
        
        if (foundExecutives.length === 0) {
            console.log(`❌ No executives found - possible issues:`);
            console.log(`   1. Name variations (nicknames, middle names)`);
            console.log(`   2. Different company associations in CoreSignal`);
            console.log(`   3. Inactive profiles or outdated data`);
            console.log(`   4. Search query structure problems`);
            return;
        }

        // Analyze successful patterns
        console.log(`✅ Based on successful matches, consider:`);
        
        // Title analysis
        const successfulTitles = new Set();
        foundExecutives.forEach(exec => {
            exec.profiles.forEach(profile => {
                if (profile.active_experience_title) {
                    successfulTitles.add(profile.active_experience_title);
                }
            });
        });

        console.log(`\n1. EXPAND TITLE SEARCH PATTERNS:`);
        Array.from(successfulTitles).forEach(title => {
            console.log(`   • Add: "${title}"`);
        });

        // Company matching analysis
        console.log(`\n2. COMPANY MATCHING IMPROVEMENTS:`);
        foundExecutives.forEach(exec => {
            const companyNames = new Set();
            exec.profiles.forEach(profile => {
                if (profile.active_experience_company_name) {
                    companyNames.add(profile.active_experience_company_name);
                }
            });
            
            if (companyNames.size > 0) {
                console.log(`   ${exec.company}: Also search for [${Array.from(companyNames).join(', ')}]`);
            }
        });

        console.log(`\n3. SEARCH STRATEGY IMPROVEMENTS:`);
        console.log(`   • Use fuzzy name matching for variations`);
        console.log(`   • Search by LinkedIn URL if available`);
        console.log(`   • Try company name variations in search`);
        console.log(`   • Consider historical experience, not just active`);
    }
}

// Run the reverse search
async function main() {
    if (!CONFIG.CORESIGNAL_API_KEY || CONFIG.CORESIGNAL_API_KEY === 'your-api-key-here') {
        console.error('❌ Please set CORESIGNAL_API_KEY environment variable');
        process.exit(1);
    }

    const searcher = new ExecutiveReverseSearcher();
    await searcher.run();
}

main().catch(console.error);
