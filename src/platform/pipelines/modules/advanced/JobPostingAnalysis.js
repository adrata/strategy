/**
 * 💼 JOB POSTING ANALYSIS MODULE
 * 
 * Analyzes company job postings for strategic intelligence:
 * - Company growth signals and hiring velocity
 * - Executive decision-making priorities
 * - Budget allocation and spending patterns
 * - Contact timing based on hiring activity
 * - Technology investment signals
 */

const https = require('https');

class JobPostingAnalysis {
    constructor(config = {}) {
        this.config = {
            CORESIGNAL_API_KEY: config.CORESIGNAL_API_KEY || process.env.CORESIGNAL_API_KEY,
            BASE_URL: 'https://api.coresignal.com/cdapi/v1',
            MAX_RETRIES: 2,
            RATE_LIMIT_DELAY: 1000,
            ...config
        };
    }

    /**
     * 🎯 ANALYZE COMPANY HIRING INTELLIGENCE
     * 
     * Provides strategic insights based on job posting activity
     */
    async analyzeHiringIntelligence(companyResult) {
        if (!this.config.CORESIGNAL_API_KEY) {
            console.log('   ⚠️ CoreSignal API key not available - skipping job posting analysis');
            return this.createEmptyAnalysis();
        }

        console.log(`💼 Job posting analysis: ${companyResult.companyName}`);

        try {
            // Get recent job postings (last 6 months)
            const recentJobs = await this.getRecentJobPostings(companyResult.companyName, companyResult.website);
            
            if (!recentJobs || recentJobs.length === 0) {
                console.log('   ⚠️ No recent job postings found');
                return this.createEmptyAnalysis();
            }

            const analysis = {
                // HIRING VELOCITY SIGNALS
                hiringVelocity: {
                    totalActivePostings: recentJobs.filter(job => job.application_active === 1).length,
                    totalRecentPostings: recentJobs.length,
                    hiringVelocityScore: this.calculateHiringVelocity(recentJobs),
                    growthPhase: this.determineGrowthPhase(recentJobs)
                },

                // DEPARTMENT HIRING ANALYSIS
                departmentAnalysis: {
                    engineeringHiring: this.countDepartmentHiring(recentJobs, 'engineering'),
                    salesHiring: this.countDepartmentHiring(recentJobs, 'sales'),
                    marketingHiring: this.countDepartmentHiring(recentJobs, 'marketing'),
                    financeHiring: this.countDepartmentHiring(recentJobs, 'finance'),
                    operationsHiring: this.countDepartmentHiring(recentJobs, 'operations'),
                    executiveHiring: this.countExecutiveHiring(recentJobs)
                },

                // STRATEGIC PRIORITIES
                strategicPriorities: {
                    technologyFocus: this.analyzeTechnologyFocus(recentJobs),
                    goToMarketExpansion: this.analyzeGoToMarketExpansion(recentJobs),
                    operationalScaling: this.analyzeOperationalScaling(recentJobs),
                    internationalExpansion: this.analyzeInternationalExpansion(recentJobs)
                },

                // BUDGET & COMPENSATION INTELLIGENCE
                budgetIntelligence: {
                    averageSalary: this.calculateAverageSalary(recentJobs),
                    salaryRanges: this.analyzeSalaryRanges(recentJobs),
                    budgetAuthority: this.assessBudgetAuthority(recentJobs),
                    compensationCompetitiveness: this.assessCompensationCompetitiveness(recentJobs)
                },

                // CONTACT TIMING INTELLIGENCE
                contactTiming: {
                    optimalContactWindow: this.determineOptimalContactTiming(recentJobs),
                    urgencyLevel: this.assessContactUrgency(recentJobs),
                    decisionMakerAvailability: this.assessDecisionMakerAvailability(recentJobs),
                    engagementOpportunities: this.identifyEngagementOpportunities(recentJobs)
                },

                // COMPETITIVE INTELLIGENCE
                competitiveIntelligence: {
                    talentAcquisitionStrategy: this.analyzeTalentStrategy(recentJobs),
                    marketPositioning: this.analyzeMarketPositioning(recentJobs),
                    investmentAreas: this.identifyInvestmentAreas(recentJobs)
                }
            };

            console.log(`   ✅ Job posting analysis complete: ${analysis.hiringVelocity.totalActivePostings} active postings`);
            return analysis;

        } catch (error) {
            console.error(`   ❌ Job posting analysis failed: ${error.message}`);
            return this.createEmptyAnalysis();
        }
    }

    /**
     * 📋 GET RECENT JOB POSTINGS
     */
    async getRecentJobPostings(companyName, website) {
        const sixMonthsAgo = this.getDateMonthsAgo(6);
        
        const searchParams = {
            company_name: companyName,
            created_at_gte: sixMonthsAgo,
            application_active: true,
            limit: 100
        };

        const response = await this.callCoreSignalAPI('/job_base/search/filter', searchParams);
        return response?.jobs || [];
    }

    /**
     * 📊 HIRING VELOCITY ANALYSIS
     */
    calculateHiringVelocity(jobs) {
        const monthlyPostings = this.groupJobsByMonth(jobs);
        const avgMonthlyPostings = Object.values(monthlyPostings).reduce((sum, count) => sum + count, 0) / 6;
        
        if (avgMonthlyPostings >= 20) return 'Very High';
        if (avgMonthlyPostings >= 10) return 'High';
        if (avgMonthlyPostings >= 5) return 'Moderate';
        if (avgMonthlyPostings >= 1) return 'Low';
        return 'Minimal';
    }

    determineGrowthPhase(jobs) {
        const totalJobs = jobs.length;
        const executiveJobs = this.countExecutiveHiring(jobs);
        const techJobs = this.countDepartmentHiring(jobs, 'engineering');
        const salesJobs = this.countDepartmentHiring(jobs, 'sales');

        if (executiveJobs > 2) return 'Leadership Expansion';
        if (techJobs > 10) return 'Technology Scaling';
        if (salesJobs > 8) return 'Go-to-Market Expansion';
        if (totalJobs > 15) return 'Rapid Growth';
        if (totalJobs > 5) return 'Steady Growth';
        return 'Stable/Maintenance';
    }

    /**
     * 🏢 DEPARTMENT ANALYSIS
     */
    countDepartmentHiring(jobs, department) {
        const keywords = {
            'engineering': ['engineer', 'developer', 'software', 'technical', 'architect', 'devops'],
            'sales': ['sales', 'account', 'business development', 'revenue', 'customer success'],
            'marketing': ['marketing', 'brand', 'content', 'digital', 'growth', 'demand generation'],
            'finance': ['finance', 'accounting', 'controller', 'financial', 'treasury'],
            'operations': ['operations', 'supply chain', 'logistics', 'procurement', 'facilities']
        };

        const deptKeywords = keywords[department] || [];
        
        return jobs.filter(job => {
            const title = (job.title || '').toLowerCase();
            const description = (job.description || '').toLowerCase();
            
            return deptKeywords.some(keyword => 
                title.includes(keyword) || description.includes(keyword)
            );
        }).length;
    }

    countExecutiveHiring(jobs) {
        const executiveKeywords = ['ceo', 'cfo', 'cto', 'cmo', 'chief', 'president', 'vp', 'vice president', 'director'];
        
        return jobs.filter(job => {
            const title = (job.title || '').toLowerCase();
            return executiveKeywords.some(keyword => title.includes(keyword));
        }).length;
    }

    /**
     * 💰 BUDGET INTELLIGENCE
     */
    calculateAverageSalary(jobs) {
        const salariesWithValues = jobs
            .map(job => this.parseSalary(job.salary))
            .filter(salary => salary > 0);

        if (salariesWithValues.length === 0) return null;
        
        const avgSalary = salariesWithValues.reduce((sum, salary) => sum + salary, 0) / salariesWithValues.length;
        return Math.round(avgSalary);
    }

    assessBudgetAuthority(jobs) {
        const avgSalary = this.calculateAverageSalary(jobs);
        const executiveJobs = this.countExecutiveHiring(jobs);
        
        if (avgSalary > 200000 || executiveJobs > 1) {
            return 'High Budget Authority (Executive hiring + high salaries)';
        } else if (avgSalary > 100000 || jobs.length > 20) {
            return 'Moderate Budget Authority (Significant hiring activity)';
        } else if (jobs.length > 5) {
            return 'Standard Budget Authority (Regular hiring)';
        }
        return 'Limited Budget Authority (Minimal hiring)';
    }

    /**
     * ⏰ CONTACT TIMING INTELLIGENCE
     */
    determineOptimalContactTiming(jobs) {
        const recentJobs = jobs.filter(job => {
            const postDate = new Date(job.time_posted);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return postDate > thirtyDaysAgo;
        });

        const executiveHiring = this.countExecutiveHiring(recentJobs);
        const totalRecent = recentJobs.length;

        if (executiveHiring > 0) {
            return 'IMMEDIATE - Executive hiring indicates leadership expansion';
        } else if (totalRecent > 10) {
            return 'HIGH PRIORITY - Active hiring phase, decision makers engaged';
        } else if (totalRecent > 3) {
            return 'GOOD TIMING - Moderate hiring activity';
        } else {
            return 'STANDARD TIMING - Limited hiring activity';
        }
    }

    assessContactUrgency(jobs) {
        const techJobs = this.countDepartmentHiring(jobs, 'engineering');
        const salesJobs = this.countDepartmentHiring(jobs, 'sales');
        const executiveJobs = this.countExecutiveHiring(jobs);

        if (executiveJobs > 1 || techJobs > 15) return 'URGENT';
        if (salesJobs > 8 || techJobs > 8) return 'HIGH';
        if (jobs.length > 10) return 'MODERATE';
        return 'LOW';
    }

    /**
     * 🎯 STRATEGIC PRIORITY ANALYSIS
     */
    analyzeTechnologyFocus(jobs) {
        const techJobs = this.countDepartmentHiring(jobs, 'engineering');
        const totalJobs = jobs.length;
        
        if (totalJobs === 0) return 'Unknown';
        
        const techPercentage = (techJobs / totalJobs) * 100;
        
        if (techPercentage > 60) return 'High Technology Investment';
        if (techPercentage > 30) return 'Moderate Technology Focus';
        if (techPercentage > 10) return 'Standard Technology Hiring';
        return 'Limited Technology Focus';
    }

    analyzeGoToMarketExpansion(jobs) {
        const salesJobs = this.countDepartmentHiring(jobs, 'sales');
        const marketingJobs = this.countDepartmentHiring(jobs, 'marketing');
        const totalGTM = salesJobs + marketingJobs;
        
        if (totalGTM > 10) return 'Aggressive Go-to-Market Expansion';
        if (totalGTM > 5) return 'Active Go-to-Market Growth';
        if (totalGTM > 2) return 'Standard Go-to-Market Hiring';
        return 'Limited Go-to-Market Activity';
    }

    /**
     * 🔧 UTILITY METHODS
     */
    async callCoreSignalAPI(endpoint, params) {
        for (let attempt = 1; attempt <= this.config.MAX_RETRIES; attempt++) {
            try {
                const options = {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.config.CORESIGNAL_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                };

                const url = `${this.config.BASE_URL}${endpoint}`;
                const response = await this.makeHttpRequest(url, options, JSON.stringify(params));
                
                if (response.statusCode === 200) {
                    console.log(`   ✅ Job posting ${endpoint} successful`);
                    await new Promise(resolve => setTimeout(resolve, this.config.RATE_LIMIT_DELAY));
                    return JSON.parse(response.body);
                } else {
                    console.log(`   ❌ Job posting API error: ${response.statusCode}`);
                }

            } catch (error) {
                console.log(`   ❌ Job posting request error: ${error.message}`);
            }

            if (attempt < this.config.MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, this.config.RATE_LIMIT_DELAY * 2));
            }
        }

        return null;
    }

    makeHttpRequest(url, options, body = null) {
        return new Promise((resolve, reject) => {
            const req = https.request(url, options, (res) => {
                let responseBody = '';
                res.on('data', (chunk) => responseBody += chunk);
                res.on('end', () => resolve({ statusCode: res.statusCode, body: responseBody }));
            });
            req.on('error', reject);
            if (body) req.write(body);
            req.end();
        });
    }

    getDateMonthsAgo(months) {
        const date = new Date();
        date.setMonth(date.getMonth() - months);
        return date.toISOString().split('T')[0] + ' 00:00:01';
    }

    parseSalary(salaryString) {
        if (!salaryString) return 0;
        
        // Extract numbers from salary strings like "$100,000 - $150,000"
        const numbers = salaryString.match(/[\d,]+/g);
        if (numbers && numbers.length > 0) {
            const salary = parseInt(numbers[0].replace(/,/g, ''));
            return isNaN(salary) ? 0 : salary;
        }
        return 0;
    }

    groupJobsByMonth(jobs) {
        const monthlyGroups = {};
        jobs.forEach(job => {
            const month = job.created?.substring(0, 7) || 'unknown'; // YYYY-MM
            monthlyGroups[month] = (monthlyGroups[month] || 0) + 1;
        });
        return monthlyGroups;
    }

    createEmptyAnalysis() {
        return {
            hiringVelocity: null,
            departmentAnalysis: null,
            strategicPriorities: null,
            budgetIntelligence: null,
            contactTiming: null,
            competitiveIntelligence: null
        };
    }

    // Additional analysis methods
    analyzeOperationalScaling(jobs) {
        const opsJobs = this.countDepartmentHiring(jobs, 'operations');
        if (opsJobs > 5) return 'Active Operational Scaling';
        if (opsJobs > 2) return 'Moderate Operational Growth';
        return 'Standard Operations';
    }

    analyzeInternationalExpansion(jobs) {
        const internationalJobs = jobs.filter(job => {
            const location = (job.location || '').toLowerCase();
            return !location.includes('united states') && !location.includes('usa');
        });
        
        if (internationalJobs.length > 5) return 'Active International Expansion';
        if (internationalJobs.length > 2) return 'International Presence';
        return 'Domestic Focus';
    }

    analyzeSalaryRanges(jobs) {
        const salaries = jobs.map(job => this.parseSalary(job.salary)).filter(s => s > 0);
        if (salaries.length === 0) return null;
        
        salaries.sort((a, b) => a - b);
        return {
            min: salaries[0],
            max: salaries[salaries.length - 1],
            median: salaries[Math.floor(salaries.length / 2)]
        };
    }

    assessCompensationCompetitiveness(jobs) {
        const avgSalary = this.calculateAverageSalary(jobs);
        if (!avgSalary) return 'Unknown';
        
        // Industry benchmarks (simplified)
        if (avgSalary > 150000) return 'Highly Competitive';
        if (avgSalary > 100000) return 'Competitive';
        if (avgSalary > 75000) return 'Market Rate';
        return 'Below Market';
    }

    identifyEngagementOpportunities(jobs) {
        const opportunities = [];
        
        const techJobs = this.countDepartmentHiring(jobs, 'engineering');
        const salesJobs = this.countDepartmentHiring(jobs, 'sales');
        const executiveJobs = this.countExecutiveHiring(jobs);
        
        if (techJobs > 10) opportunities.push('Technology scaling solutions');
        if (salesJobs > 8) opportunities.push('Sales enablement and CRM solutions');
        if (executiveJobs > 1) opportunities.push('Executive onboarding and leadership solutions');
        if (jobs.length > 20) opportunities.push('HR and talent management solutions');
        
        return opportunities;
    }

    analyzeTalentStrategy(jobs) {
        const seniorJobs = jobs.filter(job => 
            (job.seniority || '').toLowerCase().includes('senior') ||
            (job.title || '').toLowerCase().includes('senior')
        ).length;
        
        const totalJobs = jobs.length;
        if (totalJobs === 0) return 'Unknown';
        
        const seniorPercentage = (seniorJobs / totalJobs) * 100;
        
        if (seniorPercentage > 60) return 'Senior Talent Focus';
        if (seniorPercentage > 30) return 'Mixed Seniority Strategy';
        return 'Entry/Mid-Level Focus';
    }

    analyzeMarketPositioning(jobs) {
        const avgSalary = this.calculateAverageSalary(jobs);
        const hiringVelocity = this.calculateHiringVelocity(jobs);
        
        if (avgSalary > 150000 && hiringVelocity === 'Very High') {
            return 'Market Leader (High pay + aggressive hiring)';
        } else if (hiringVelocity === 'High' || hiringVelocity === 'Very High') {
            return 'Growth Company (Active expansion)';
        } else if (avgSalary > 120000) {
            return 'Established Player (Competitive compensation)';
        }
        return 'Standard Market Position';
    }

    identifyInvestmentAreas(jobs) {
        const areas = [];
        
        if (this.countDepartmentHiring(jobs, 'engineering') > 10) areas.push('Technology Infrastructure');
        if (this.countDepartmentHiring(jobs, 'sales') > 8) areas.push('Revenue Growth');
        if (this.countDepartmentHiring(jobs, 'marketing') > 5) areas.push('Brand & Marketing');
        if (this.countDepartmentHiring(jobs, 'operations') > 5) areas.push('Operational Efficiency');
        if (this.countExecutiveHiring(jobs) > 1) areas.push('Leadership & Strategy');
        
        return areas;
    }

    assessDecisionMakerAvailability(jobs) {
        const executiveJobs = this.countExecutiveHiring(jobs);
        const totalJobs = jobs.length;
        
        if (executiveJobs > 1) return 'High (Executive hiring = engaged leadership)';
        if (totalJobs > 15) return 'Moderate (High activity = busy decision makers)';
        if (totalJobs > 5) return 'Good (Standard activity level)';
        return 'Unknown';
    }
}

module.exports = { JobPostingAnalysis };
