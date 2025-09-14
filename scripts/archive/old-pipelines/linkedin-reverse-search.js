#!/usr/bin/env node

/**
 * LINKEDIN-BASED REVERSE SEARCH
 * Search for executives using LinkedIn URLs and company-specific queries
 */

const CONFIG = {
    CORESIGNAL_API_KEY: process.env.CORESIGNAL_API_KEY || 'your-api-key-here',
    CORESIGNAL_BASE_URL: 'https://api.coresignal.com'
};

// LinkedIn URLs for known executives (found via manual research)
const LINKEDIN_SEARCHES = [
    { name: 'Sue Marks', company: 'Cielo Talent', role: 'CEO', linkedin: '/in/suemarks/', companyId: 1430210 },
    { name: 'Brian Lindstrom', company: 'Cielo Talent', role: 'CFO', linkedin: '/in/brian-lindstrom/', companyId: 1430210 },
    { name: 'Chris Comparato', company: 'Toast', role: 'CEO', linkedin: '/in/chriscomparato/', companyId: 2777408 },
    { name: 'Elena Gomez', company: 'Toast', role: 'CFO', linkedin: '/in/elena-gomez-cfo/', companyId: 2777408 },
    { name: 'Vince De Palma', company: 'Softchoice', role: 'CEO', linkedin: '/in/vincedepalma/', companyId: 4638483 },
    { name: 'Bryan Caplin', company: 'Softchoice', role: 'CFO', linkedin: '/in/bryan-caplin/', companyId: 4638483 }
];

class LinkedInReverseSearcher {
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Search by LinkedIn URL
     */
    async searchByLinkedIn(linkedinUrl) {
        try {
            console.log(`🔗 Searching by LinkedIn: ${linkedinUrl}`);
            
            const searchQuery = {
                query: {
                    bool: {
                        must: [
                            {
                                query_string: {
                                    query: `"${linkedinUrl}"`,
                                    default_field: "professional_network_url",
                                    default_operator: "and"
                                }
                            }
                        ]
                    }
                }
            };

            const searchResponse = await fetch(`${CONFIG.CORESIGNAL_BASE_URL}/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=5`, {
                method: 'POST',
                headers: {
                    'apikey': CONFIG.CORESIGNAL_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(searchQuery)
            });

            if (searchResponse.ok) {
                const candidateIds = await searchResponse.json();
                console.log(`   📋 LinkedIn search found ${candidateIds.length} matches`);
                return candidateIds;
            }
        } catch (error) {
            console.log(`   ❌ LinkedIn search failed: ${error.message}`);
        }
        return [];
    }

    /**
     * Search by company ID and role keywords
     */
    async searchByCompanyAndRole(companyId, roleKeywords, executiveName) {
        try {
            console.log(`🏢 Searching company ${companyId} for ${roleKeywords.join(' OR ')}`);
            
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
                                                        "experience.company_id": companyId
                                                    }
                                                },
                                                {
                                                    bool: {
                                                        should: roleKeywords.map(keyword => ({
                                                            query_string: {
                                                                query: keyword,
                                                                default_field: "experience.position_title",
                                                                default_operator: "and"
                                                            }
                                                        })),
                                                        minimum_should_match: 1
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

            const searchResponse = await fetch(`${CONFIG.CORESIGNAL_BASE_URL}/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=10`, {
                method: 'POST',
                headers: {
                    'apikey': CONFIG.CORESIGNAL_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(searchQuery)
            });

            if (searchResponse.ok) {
                const candidateIds = await searchResponse.json();
                console.log(`   📋 Company+Role search found ${candidateIds.length} matches`);
                
                // Filter by name similarity if we have candidates
                if (candidateIds.length > 0) {
                    const profiles = await this.collectProfiles(candidateIds.slice(0, 5));
                    const nameMatches = profiles.filter(p => 
                        p.full_name && p.full_name.toLowerCase().includes(executiveName.toLowerCase().split(' ')[0])
                    );
                    console.log(`   🎯 Name-filtered matches: ${nameMatches.length}`);
                    return nameMatches.map(p => p.id);
                }
                
                return candidateIds;
            }
        } catch (error) {
            console.log(`   ❌ Company+Role search failed: ${error.message}`);
        }
        return [];
    }

    /**
     * Collect profiles for analysis
     */
    async collectProfiles(candidateIds) {
        const profiles = [];
        for (const candidateId of candidateIds) {
            try {
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
                }
                await this.delay(300);
            } catch (error) {
                console.log(`   ⚠️  Error collecting profile ${candidateId}`);
            }
        }
        return profiles;
    }

    /**
     * Comprehensive search for each executive
     */
    async searchExecutive(executive) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🎯 COMPREHENSIVE SEARCH: ${executive.name} (${executive.role} at ${executive.company})`);
        
        let allCandidates = [];
        
        // Method 1: LinkedIn URL search
        const linkedinCandidates = await this.searchByLinkedIn(executive.linkedin);
        allCandidates.push(...linkedinCandidates);
        
        // Method 2: Company + Role search
        const roleKeywords = executive.role === 'CEO' 
            ? ['CEO', 'Chief Executive Officer', 'President', 'Managing Director']
            : ['CFO', 'Chief Financial Officer', 'VP Finance', 'Finance Director'];
            
        const companyCandidates = await this.searchByCompanyAndRole(
            executive.companyId, 
            roleKeywords, 
            executive.name
        );
        allCandidates.push(...companyCandidates);
        
        // Remove duplicates
        const uniqueCandidates = [...new Set(allCandidates)];
        console.log(`   📊 Total unique candidates: ${uniqueCandidates.length}`);
        
        if (uniqueCandidates.length > 0) {
            const profiles = await this.collectProfiles(uniqueCandidates.slice(0, 3));
            console.log(`\n   ✅ FOUND PROFILES:`);
            profiles.forEach((profile, i) => {
                console.log(`   ${i + 1}. ${profile.full_name || 'N/A'}`);
                console.log(`      Title: ${profile.active_experience_title || 'N/A'}`);
                console.log(`      Company: ${profile.active_experience_company_name || 'N/A'}`);
                console.log(`      Company ID: ${profile.active_experience_company_id || 'N/A'}`);
                console.log(`      LinkedIn: ${profile.professional_network_url || 'N/A'}`);
                console.log(`      Email: ${profile.primary_professional_email || 'N/A'}`);
            });
            return profiles;
        } else {
            console.log(`   ❌ NO PROFILES FOUND`);
            return [];
        }
    }

    async run() {
        console.log(`🚀 LINKEDIN-BASED REVERSE SEARCH`);
        console.log(`=================================`);
        
        const results = [];
        
        for (const executive of LINKEDIN_SEARCHES) {
            const profiles = await this.searchExecutive(executive);
            results.push({ executive, profiles });
            await this.delay(1000);
        }
        
        // Final analysis
        console.log(`\n📊 FINAL ANALYSIS`);
        console.log(`=================`);
        
        const successful = results.filter(r => r.profiles.length > 0);
        const failed = results.filter(r => r.profiles.length === 0);
        
        console.log(`✅ Successfully found: ${successful.length}/${results.length} executives`);
        console.log(`❌ Not found: ${failed.length}/${results.length} executives`);
        
        if (failed.length > 0) {
            console.log(`\n🚨 MISSING EXECUTIVES:`);
            failed.forEach(f => {
                console.log(`   • ${f.executive.name} (${f.executive.role} at ${f.executive.company})`);
            });
            
            console.log(`\n💡 POSSIBLE REASONS:`);
            console.log(`   1. Executives not in CoreSignal database`);
            console.log(`   2. Different LinkedIn URL patterns`);
            console.log(`   3. Company data not properly linked`);
            console.log(`   4. Historical vs current experience issues`);
            console.log(`   5. Data privacy restrictions`);
        }
    }
}

// Run the comprehensive search
async function main() {
    if (!CONFIG.CORESIGNAL_API_KEY || CONFIG.CORESIGNAL_API_KEY === 'your-api-key-here') {
        console.error('❌ Please set CORESIGNAL_API_KEY environment variable');
        process.exit(1);
    }

    const searcher = new LinkedInReverseSearcher();
    await searcher.run();
}

main().catch(console.error);
