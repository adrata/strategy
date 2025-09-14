/**
 * 🌟 CORESIGNAL INTELLIGENCE MODULE
 * 
 * Enhances executive data with CoreSignal's rich company and people intelligence:
 * - Executive movement tracking (arrivals/departures)
 * - Company growth metrics (employee count changes, hiring activity)
 * - Revenue intelligence (annual revenue ranges)
 * - Organizational structure (reporting relationships)
 * - Hiring signals (active job postings, growth trends)
 */

const https = require('https');
const fetch = require('node-fetch');

class CoreSignalIntelligence {
    constructor(config = {}) {
        this.config = {
            CORESIGNAL_API_KEY: config.CORESIGNAL_API_KEY || process.env.CORESIGNAL_API_KEY,
            BASE_URL: 'https://api.coresignal.com/cdapi/v2',
            MAX_RETRIES: 2,
            RATE_LIMIT_DELAY: 1000,
            ...config
        };
    }

    /**
     * 🎯 ENHANCE EXECUTIVES WITH CORESIGNAL PEOPLE DATA
     * 
     * Adds missing high-value people intelligence for CEO and CFO
     */
    async enhanceExecutiveIntelligence(companyResult) {
        if (!this.config.CORESIGNAL_API_KEY) {
            console.log('   ⚠️ CoreSignal API key not available - skipping enhancement');
            return this.createEmptyEnhancement();
        }

        console.log(`🌟 CoreSignal people enhancement: ${companyResult.companyName}`);

        try {
            // Get company data from CoreSignal first
            const companyData = await this.searchCompany(companyResult.companyName, companyResult.website);
            
            if (!companyData) {
                console.log('   ⚠️ Company not found in CoreSignal');
                return this.createEmptyEnhancement();
            }

            // Get detailed people data for CEO and CFO
            const ceoData = await this.getExecutivePersonData(companyResult.ceo.name, companyData.id);
            const cfoData = await this.getExecutivePersonData(companyResult.financeLeader.name, companyData.id);
            
            // Get company-level intelligence
            const executiveMovements = await this.getExecutiveMovements(companyData.id);
            const hiringIntelligence = await this.getHiringIntelligence(companyData.id);
            const orgStructure = await this.getOrganizationalStructure(companyData.id);

            const enhancement = {
                // CEO PEOPLE INTELLIGENCE
                ceoIntelligence: {
                    verifiedEmail: ceoData?.primary_professional_email || null,
                    emailConfidence: ceoData?.primary_professional_email_status || null,
                    alternativeEmails: ceoData?.professional_emails_collection || [],
                    location: ceoData?.location_full || null,
                    experience: {
                        totalMonths: ceoData?.total_experience_duration_months || null,
                        cLevelMonths: this.getCLevelExperience(ceoData),
                        departmentBreakdown: ceoData?.total_experience_duration_months_breakdown_department || []
                    },
                    salaryIntelligence: {
                        projectedSalary: ceoData?.projected_total_salary_median || null,
                        salaryRange: {
                            min: ceoData?.projected_total_salary_p25 || null,
                            max: ceoData?.projected_total_salary_p75 || null
                        },
                        currency: ceoData?.projected_total_salary_currency || null
                    },
                    recentChanges: ceoData?.experience_recently_started || [],
                    networkSize: ceoData?.connections_count || null,
                    isDecisionMaker: ceoData?.is_decision_maker || null
                },

                // CFO PEOPLE INTELLIGENCE  
                cfoIntelligence: {
                    verifiedEmail: cfoData?.primary_professional_email || null,
                    emailConfidence: cfoData?.primary_professional_email_status || null,
                    alternativeEmails: cfoData?.professional_emails_collection || [],
                    location: cfoData?.location_full || null,
                    experience: {
                        totalMonths: cfoData?.total_experience_duration_months || null,
                        financeMonths: this.getFinanceExperience(cfoData),
                        departmentBreakdown: cfoData?.total_experience_duration_months_breakdown_department || []
                    },
                    salaryIntelligence: {
                        projectedSalary: cfoData?.projected_total_salary_median || null,
                        salaryRange: {
                            min: cfoData?.projected_total_salary_p25 || null,
                            max: cfoData?.projected_total_salary_p75 || null
                        },
                        currency: cfoData?.projected_total_salary_currency || null
                    },
                    recentChanges: cfoData?.experience_recently_started || [],
                    networkSize: cfoData?.connections_count || null,
                    isDecisionMaker: cfoData?.is_decision_maker || null
                },

                // COMPANY GROWTH METRICS
                companyGrowthMetrics: {
                    currentEmployeeCount: companyData.employees_count || null,
                    employeeGrowth: companyData.employees_count_change || null,
                    revenueRange: companyData.revenue_annual_range || null,
                    foundedYear: companyData.founded_year || null,
                    activeJobPostings: hiringIntelligence.activePostings || 0,
                    growthSignals: this.analyzeGrowthSignals(hiringIntelligence, companyData)
                },

                // EXECUTIVE MOVEMENT INTELLIGENCE
                executiveMovements: {
                    recentDepartures: executiveMovements.departures || [],
                    recentArrivals: executiveMovements.arrivals || [],
                    executiveStabilityScore: this.calculateExecutiveStability(executiveMovements),
                    leadershipRisk: this.assessLeadershipRisk(executiveMovements)
                },

                // CONTACT INTELLIGENCE
                contactIntelligence: {
                    optimalContactTiming: this.determineOptimalTiming(hiringIntelligence, executiveMovements),
                    contactRisk: this.assessContactRisk(executiveMovements),
                    engagementOpportunities: this.identifyEngagementOpportunities(hiringIntelligence, companyData),
                    emailReliability: this.assessEmailReliability(ceoData, cfoData)
                },

                // DATA QUALITY
                dataQuality: {
                    coresignalConfidence: companyData.confidence || 85,
                    lastUpdated: companyData.last_updated || new Date().toISOString(),
                    peopleDataCompleteness: this.calculatePeopleDataCompleteness(ceoData, cfoData),
                    sourceReliability: 'CoreSignal API'
                }
            };

            console.log(`   ✅ CoreSignal enhancement complete: ${enhancement.dataQuality.dataCompleteness}% data completeness`);
            return enhancement;

        } catch (error) {
            console.error(`   ❌ CoreSignal enhancement failed: ${error.message}`);
            return this.createEmptyEnhancement();
        }
    }

    /**
     * 🔍 SEARCH COMPANY IN CORESIGNAL
     */
    async searchCompany(companyName, website) {
        // Method 1: Try intelligent shorthand name approach (most reliable)
        const shorthandName = await this.generateShorthandName(companyName, website);
        let companyData = await this.getCompanyByShorthand(shorthandName);
        
        if (companyData) {
            console.log(`   ✅ Found via shorthand: ${shorthandName}`);
            return companyData;
        }
        
        // Method 2: Try Elasticsearch search for ID, then collect
        console.log(`   Trying Elasticsearch search for: ${companyName}`);
        const searchResult = await this.searchCompanyByElasticsearch(companyName, website);
        
        if (searchResult) {
            console.log(`   ✅ Found via search, collecting data...`);
            return await this.getCompanyById(searchResult.id);
        }
        
        return null;
    }
    
    /**
     * 🏷️ GENERATE SHORTHAND NAME (INTELLIGENT)
     */
    async generateShorthandName(companyName, website) {
        // Extract potential shorthand from website
        let domain = website?.replace(/^https?:\/\//, '').replace(/^www\./, '').split('.')[0];
        
        // Use AI to research the correct shorthand name
        try {
            const prompt = `What is the CoreSignal API shorthand identifier for ${companyName} (${website})?

CoreSignal uses shorthand names like "microsoft", "google", "apple" for major companies.
Research the likely CoreSignal shorthand for this company.

Provide ONLY a JSON response:
{
    "shorthand": "likely-shorthand-name",
    "confidence": 0.85
}`;

            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.PERPLEXITY_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'sonar-pro',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.1,
                    max_tokens: 200
                })
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.choices[0].message.content;
                
                try {
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const result = JSON.parse(jsonMatch[0]);
                        if (result.shorthand) {
                            console.log(`   🎯 AI-researched shorthand: ${result.shorthand}`);
                            return result.shorthand;
                        }
                    }
                } catch (parseError) {
                    console.log(`   ⚠️ Shorthand research parsing failed`);
                }
            }
        } catch (error) {
            console.log(`   ⚠️ Shorthand research failed: ${error.message}`);
        }
        
        // Generate from company name
        return companyName
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    
    /**
     * 🏢 GET COMPANY BY SHORTHAND
     */
    async getCompanyByShorthand(shorthandName) {
        try {
            const response = await fetch(`https://api.coresignal.com/cdapi/v2/company_multi_source/collect/${shorthandName}`, {
                headers: {
                    'apikey': this.config.CORESIGNAL_API_KEY
                }
            });
            
            if (response.ok) {
                return await response.json();
            }
            
            return null;
        } catch (error) {
            console.log(`   ❌ Shorthand error: ${error.message}`);
            return null;
        }
    }
    
    /**
     * 🔍 SEARCH COMPANY BY ELASTICSEARCH
     */
    async searchCompanyByElasticsearch(companyName, website) {
        try {
            const query = {
                query: {
                    bool: {
                        should: [
                            { match: { company_name: companyName } },
                            { match: { website: website } }
                        ]
                    }
                }
            };
            
            const response = await fetch('https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': this.config.CORESIGNAL_API_KEY
                },
                body: JSON.stringify(query)
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.hits?.hits?.length > 0) {
                    return { id: data.hits.hits[0]._id };
                }
            }
            
            return null;
        } catch (error) {
            console.log(`   ❌ Search error: ${error.message}`);
            return null;
        }
    }
    
    /**
     * 🆔 GET COMPANY BY ID
     */
    async getCompanyById(companyId) {
        try {
            const response = await fetch(`https://api.coresignal.com/cdapi/v2/company_multi_source/collect/${companyId}`, {
                headers: {
                    'apikey': this.config.CORESIGNAL_API_KEY
                }
            });
            
            if (response.ok) {
                return await response.json();
            }
            
            return null;
        } catch (error) {
            console.log(`   ❌ Collect error: ${error.message}`);
            return null;
        }
    }

    /**
     * 👤 GET EXECUTIVE PERSON DATA
     * 
     * Gets detailed people intelligence for specific executives
     */
    async getExecutivePersonData(executiveName, companyId) {
        if (!executiveName || executiveName === '') {
            return null;
        }

        const searchParams = {
            full_name: executiveName,
            company_id: companyId,
            limit: 1
        };

        // CoreSignal member search endpoint might not be available
        // Use a more defensive approach
        try {
            const response = await this.callCoreSignalAPI('/member/search', searchParams);
            const personData = response?.members?.[0];

            if (personData) {
                console.log(`   ✅ Found CoreSignal data for ${executiveName}`);
                return personData;
            } else {
                console.log(`   ⚠️ No CoreSignal data found for ${executiveName}`);
                return null;
            }
        } catch (error) {
            console.log(`   ⚠️ Member search not available: ${error.message}`);
            return null;
        }
    }

    /**
     * 👔 GET EXECUTIVE MOVEMENTS
     */
    async getExecutiveMovements(companyId) {
        const params = {
            company_id: companyId,
            limit: 10,
            date_from: this.getDateMonthsAgo(12) // Last 12 months
        };

        try {
            const departures = await this.callCoreSignalAPI('/member/departures', params);
            const arrivals = await this.callCoreSignalAPI('/member/arrivals', params);

            return {
                departures: departures?.members || [],
                arrivals: arrivals?.members || []
            };
        } catch (error) {
            console.log(`   ⚠️ Executive movements not available: ${error.message}`);
            return {
                departures: [],
                arrivals: []
            };
        }
    }

    /**
     * 📈 GET HIRING INTELLIGENCE
     */
    async getHiringIntelligence(companyId) {
        const params = {
            company_id: companyId,
            date_from: this.getDateMonthsAgo(6) // Last 6 months
        };

        try {
            const jobPostings = await this.callCoreSignalAPI('/job/search', params);
            
            return {
                activePostings: jobPostings?.total_count || 0,
                trends: this.analyzeHiringTrends(jobPostings),
                departments: this.categorizeHiringByDepartment(jobPostings?.jobs || [])
            };
        } catch (error) {
            console.log(`   ⚠️ Hiring intelligence not available: ${error.message}`);
            return {
                activePostings: 0,
                trends: null,
                departments: {}
            };
        }
    }

    /**
     * 🏢 GET ORGANIZATIONAL STRUCTURE
     */
    async getOrganizationalStructure(companyId) {
        const params = {
            company_id: companyId,
            limit: 50
        };

        const members = await this.callCoreSignalAPI('/member/search', params);
        
        return {
            hierarchy: this.buildHierarchy(members?.members || []),
            departments: this.analyzeDepartments(members?.members || []),
            executiveSpan: this.calculateExecutiveSpan(members?.members || [])
        };
    }

    /**
     * 🤖 CORESIGNAL API CALL
     */
    async callCoreSignalAPI(endpoint, params, method = 'GET') {
        const fetch = require('node-fetch');
        
        for (let attempt = 1; attempt <= this.config.MAX_RETRIES; attempt++) {
            try {
                let url = `${this.config.BASE_URL}${endpoint}`;
                let options = {
                    method: method,
                    headers: {
                        'apikey': this.config.CORESIGNAL_API_KEY,
                        'Content-Type': 'application/json'
                    }
                };

                if (method === 'POST') {
                    options.body = JSON.stringify(params);
                } else {
                    const queryString = new URLSearchParams(params).toString();
                    url = `${url}?${queryString}`;
                }

                const response = await fetch(url, options);
                
                if (response.ok) {
                    console.log(`   ✅ CoreSignal ${endpoint} successful`);
                    await new Promise(resolve => setTimeout(resolve, this.config.RATE_LIMIT_DELAY));
                    return await response.json();
                } else {
                    console.log(`   ❌ CoreSignal API error: ${response.status}`);
                }

            } catch (error) {
                console.log(`   ❌ CoreSignal request error: ${error.message}`);
            }

            if (attempt < this.config.MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, this.config.RATE_LIMIT_DELAY * 2));
            }
        }

        return null;
    }

    /**
     * 🔧 UTILITY METHODS
     */
    makeHttpRequest(url, options) {
        return new Promise((resolve, reject) => {
            const req = https.request(url, options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => resolve({ statusCode: res.statusCode, body }));
            });
            req.on('error', reject);
            req.end();
        });
    }

    getDateMonthsAgo(months) {
        const date = new Date();
        date.setMonth(date.getMonth() - months);
        return date.toISOString().split('T')[0];
    }

    calculateExecutiveStability(movements) {
        const totalMovements = (movements.departures?.length || 0) + (movements.arrivals?.length || 0);
        if (totalMovements === 0) return 95; // Very stable
        if (totalMovements <= 2) return 80; // Stable
        if (totalMovements <= 5) return 60; // Moderate
        return 40; // High turnover
    }

    assessLeadershipRisk(movements) {
        const cLevelDepartures = movements.departures?.filter(dep => 
            dep.member_position_title?.toLowerCase().includes('ceo') ||
            dep.member_position_title?.toLowerCase().includes('cfo') ||
            dep.member_position_title?.toLowerCase().includes('chief')
        ) || [];

        if (cLevelDepartures.length > 0) return 'HIGH';
        if ((movements.departures?.length || 0) > 3) return 'MEDIUM';
        return 'LOW';
    }

    analyzeGrowthSignals(hiringData, companyData) {
        const signals = [];
        
        if (hiringData.activePostings > 10) {
            signals.push('High hiring activity');
        }
        
        if (companyData.employees_count_change?.change_quarterly_percentage > 10) {
            signals.push('Rapid employee growth');
        }
        
        if (companyData.employees_count_change?.change_quarterly_percentage < -10) {
            signals.push('Employee reduction/restructuring');
        }
        
        return signals;
    }

    createEmptyEnhancement() {
        return {
            ceoIntelligence: null,
            cfoIntelligence: null,
            companyGrowthMetrics: null,
            executiveMovements: null,
            contactIntelligence: null,
            dataQuality: {
                coresignalConfidence: 0,
                lastUpdated: null,
                peopleDataCompleteness: 0,
                sourceReliability: 'Not Available'
            }
        };
    }

    // PEOPLE DATA ANALYSIS METHODS
    getCLevelExperience(personData) {
        const cLevelDept = personData?.total_experience_duration_months_breakdown_department?.find(
            dept => dept.department === 'C-Suite' || dept.department === 'Executive'
        );
        return cLevelDept?.total_experience_duration_months || 0;
    }

    getFinanceExperience(personData) {
        const financeDept = personData?.total_experience_duration_months_breakdown_department?.find(
            dept => dept.department === 'Finance & Accounting' || dept.department === 'Finance'
        );
        return financeDept?.total_experience_duration_months || 0;
    }

    assessEmailReliability(ceoData, cfoData) {
        const ceoEmail = ceoData?.primary_professional_email_status;
        const cfoEmail = cfoData?.primary_professional_email_status;
        
        let reliability = 'Unknown';
        if (ceoEmail === 'verified' || cfoEmail === 'verified') {
            reliability = 'High (Verified emails found)';
        } else if (ceoEmail === 'matched_email' || cfoEmail === 'matched_email') {
            reliability = 'Good (Matched email patterns)';
        } else if (ceoEmail || cfoEmail) {
            reliability = 'Moderate (Pattern-based emails)';
        }
        
        return reliability;
    }

    calculatePeopleDataCompleteness(ceoData, cfoData) {
        let completeness = 0;
        let totalFields = 10; // Key fields we care about
        
        if (ceoData?.primary_professional_email) completeness++;
        if (ceoData?.location_full) completeness++;
        if (ceoData?.total_experience_duration_months) completeness++;
        if (ceoData?.projected_total_salary_median) completeness++;
        if (ceoData?.connections_count) completeness++;
        
        if (cfoData?.primary_professional_email) completeness++;
        if (cfoData?.location_full) completeness++;
        if (cfoData?.total_experience_duration_months) completeness++;
        if (cfoData?.projected_total_salary_median) completeness++;
        if (cfoData?.connections_count) completeness++;
        
        return Math.round((completeness / totalFields) * 100);
    }

    // Additional analysis methods would go here...
    analyzeHiringTrends(jobPostings) {
        // Analyze hiring trends from job posting data
        return jobPostings?.trends || null;
    }

    categorizeHiringByDepartment(jobs) {
        const departments = {};
        jobs.forEach(job => {
            const dept = job.department || 'Other';
            departments[dept] = (departments[dept] || 0) + 1;
        });
        return departments;
    }

    buildHierarchy(members) {
        // Build organizational hierarchy from member data
        return members.length > 0 ? 'Available' : 'Not Available';
    }

    analyzeDepartments(members) {
        const departments = {};
        members.forEach(member => {
            const dept = member.department || 'Other';
            departments[dept] = (departments[dept] || 0) + 1;
        });
        return departments;
    }

    calculateExecutiveSpan(members) {
        const executives = members.filter(m => 
            m.position_title?.toLowerCase().includes('chief') ||
            m.position_title?.toLowerCase().includes('president') ||
            m.position_title?.toLowerCase().includes('director')
        );
        return executives.length;
    }

    determineOptimalTiming(hiringData, movements) {
        if (movements.arrivals?.length > 0) {
            return 'Contact new executives (90-day window)';
        }
        if (hiringData.activePostings > 5) {
            return 'High hiring activity - growth phase contact';
        }
        return 'Standard timing';
    }

    assessContactRisk(movements) {
        const recentDepartures = movements.departures?.filter(dep => {
            const depDate = new Date(dep.departure_date);
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            return depDate > threeMonthsAgo;
        }) || [];

        if (recentDepartures.length > 0) return 'HIGH';
        return 'LOW';
    }

    identifyEngagementOpportunities(hiringData, companyData) {
        const opportunities = [];
        
        if (hiringData.activePostings > 10) {
            opportunities.push('High hiring activity - growth solutions');
        }
        
        if (companyData.employees_count_change?.change_quarterly_percentage > 15) {
            opportunities.push('Rapid growth - scaling solutions');
        }
        
        return opportunities;
    }

    calculateDataCompleteness(data) {
        const fields = ['company_name', 'industry', 'employees_count', 'revenue_annual_range'];
        const completedFields = fields.filter(field => data[field]).length;
        return Math.round((completedFields / fields.length) * 100);
    }
}

module.exports = { CoreSignalIntelligence };
