#!/usr/bin/env node

/**
 * 🌍 LOCATION ANALYSIS MODULE
 * 
 * Location-based analysis:
 * 1. Executive timezone detection for contact timing
 * 2. Company HQ location vs executive location analysis
 * 3. Remote work likelihood assessment
 * 4. Office visit probability scoring
 * 5. Multi-timezone coordination insights
 * 
 * Integrates with Coresignal's location data
 */

const fetch = require('node-fetch');

class LocationAnalysis {
    constructor(config = {}) {
        this.config = {
            CORESIGNAL_API_KEY: config.CORESIGNAL_API_KEY || process.env.CORESIGNAL_API_KEY,
            PERPLEXITY_API_KEY: config.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY,
            ...config
        };

        this.locationCache = new Map();
        this.timezoneMap = this.initializeTimezoneMap();
    }

    /**
     * 🌍 COMPREHENSIVE LOCATION ANALYSIS
     * 
     * Analyzes executive and company locations for contact strategy
     */
    async analyzeLocationIntelligence(companyData) {
        console.log(`🌍 Analyzing location intelligence: ${companyData.name}`);

        const locationAnalysis = {
            company: companyData,
            
            // COMPANY LOCATION DATA
            companyHQ: null,
            companyTimezone: null,
            companyCountry: null,
            companyCity: null,
            
            // EXECUTIVE LOCATION DATA
            ceoLocation: null,
            ceoTimezone: null,
            cfoLocation: null,
            cfoTimezone: null,
            
            // LOCATION INTELLIGENCE
            executiveCoLocation: null,
            remoteWorkLikelihood: null,
            officeVisitProbability: null,
            optimalContactTimezone: null,
            
            // CONTACT STRATEGY
            contactTiming: null,
            meetingPreferences: null,
            travelRequirements: null,
            
            timestamp: new Date().toISOString()
        };

        try {
            // Step 1: Get company HQ location
            const companyLocation = await this.getCompanyHQLocation(companyData);
            locationAnalysis.companyHQ = companyLocation.headquarters;
            locationAnalysis.companyTimezone = companyLocation.timezone;
            locationAnalysis.companyCountry = companyLocation.country;
            locationAnalysis.companyCity = companyLocation.city;

            // Step 2: Get executive locations
            if (companyData.ceo) {
                const ceoLocation = await this.getExecutiveLocation(companyData.ceo, companyData);
                locationAnalysis.ceoLocation = ceoLocation.location;
                locationAnalysis.ceoTimezone = ceoLocation.timezone;
            }

            if (companyData.financeLeader) {
                const cfoLocation = await this.getExecutiveLocation(companyData.financeLeader, companyData);
                locationAnalysis.cfoLocation = cfoLocation.location;
                locationAnalysis.cfoTimezone = cfoLocation.timezone;
            }

            // Step 3: Analyze location patterns
            locationAnalysis.executiveCoLocation = this.analyzeExecutiveCoLocation(locationAnalysis);
            locationAnalysis.remoteWorkLikelihood = this.assessRemoteWorkLikelihood(locationAnalysis);
            locationAnalysis.officeVisitProbability = this.calculateOfficeVisitProbability(locationAnalysis);
            locationAnalysis.optimalContactTimezone = this.determineOptimalContactTimezone(locationAnalysis);

            // Step 4: Generate contact strategy
            locationAnalysis.contactTiming = this.generateContactTimingStrategy(locationAnalysis);
            locationAnalysis.meetingPreferences = this.determineMeetingPreferences(locationAnalysis);
            locationAnalysis.travelRequirements = this.assessTravelRequirements(locationAnalysis);

            return locationAnalysis;

        } catch (error) {
            console.error(`❌ Location analysis error for ${companyData.name}:`, error.message);
            return this.generateFallbackLocationAnalysis(companyData);
        }
    }

    /**
     * 🏢 GET COMPANY HQ LOCATION
     * 
     * Uses Coresignal and web research to determine accurate HQ location
     */
    async getCompanyHQLocation(companyData) {
        const cacheKey = `hq_${companyData.domain}`;
        if (this.locationCache.has(cacheKey)) {
            return this.locationCache.get(cacheKey);
        }

        // Try Coresignal first
        const coresignalLocation = await this.getCoresignalCompanyLocation(companyData.domain);
        if (coresignalLocation.success) {
            this.locationCache.set(cacheKey, coresignalLocation.data);
            return coresignalLocation.data;
        }

        // Fallback to web research
        const webLocation = await this.getWebResearchLocation(companyData);
        this.locationCache.set(cacheKey, webLocation);
        return webLocation;
    }

    /**
     * 🔍 CORESIGNAL COMPANY LOCATION LOOKUP
     */
    async getCoresignalCompanyLocation(domain) {
        if (!this.config.CORESIGNAL_API_KEY) {
            return { success: false, reason: 'No Coresignal API key' };
        }

        try {
            const response = await fetch(`https://api.coresignal.com/cdapi/v1/company/search/filter`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.CORESIGNAL_API_KEY}`
                },
                body: JSON.stringify({
                    website: domain,
                    limit: 1
                })
            });

            if (!response.ok) {
                return { success: false, reason: `Coresignal API error: ${response.status}` };
            }

            const data = await response.json();
            if (data.companies && data.companies.length > 0) {
                const company = data.companies[0];
                return {
                    success: true,
                    data: {
                        headquarters: company.hq_location || 'Unknown',
                        country: company.country || 'Unknown',
                        city: company.city || 'Unknown',
                        timezone: this.getTimezoneFromLocation(company.country, company.city),
                        source: 'Coresignal'
                    }
                };
            }

            return { success: false, reason: 'No company found' };

        } catch (error) {
            console.error('Coresignal location lookup error:', error.message);
            return { success: false, reason: error.message };
        }
    }

    /**
     * 👔 GET EXECUTIVE LOCATION
     * 
     * Determines where executives are likely located
     */
    async getExecutiveLocation(executive, companyData) {
        const cacheKey = `exec_${executive.name}_${companyData.domain}`;
        if (this.locationCache.has(cacheKey)) {
            return this.locationCache.get(cacheKey);
        }

        // Try Coresignal employee data
        const coresignalLocation = await this.getCoresignalExecutiveLocation(executive, companyData);
        if (coresignalLocation.success) {
            this.locationCache.set(cacheKey, coresignalLocation.data);
            return coresignalLocation.data;
        }

        // Fallback to LinkedIn/web research
        const webLocation = await this.getExecutiveWebLocation(executive, companyData);
        this.locationCache.set(cacheKey, webLocation);
        return webLocation;
    }

    /**
     * 🔍 CORESIGNAL EXECUTIVE LOCATION LOOKUP
     */
    async getCoresignalExecutiveLocation(executive, companyData) {
        if (!this.config.CORESIGNAL_API_KEY) {
            return { success: false, reason: 'No Coresignal API key' };
        }

        try {
            const response = await fetch(`https://api.coresignal.com/cdapi/v1/employee/search/filter`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.CORESIGNAL_API_KEY}`
                },
                body: JSON.stringify({
                    name: executive.name,
                    company_domain: companyData.domain,
                    limit: 1
                })
            });

            if (!response.ok) {
                return { success: false, reason: `Coresignal API error: ${response.status}` };
            }

            const data = await response.json();
            if (data.employees && data.employees.length > 0) {
                const employee = data.employees[0];
                return {
                    success: true,
                    data: {
                        location: employee.location || 'Unknown',
                        timezone: this.getTimezoneFromLocation(employee.country, employee.city),
                        source: 'Coresignal'
                    }
                };
            }

            return { success: false, reason: 'Executive not found' };

        } catch (error) {
            console.error('Coresignal executive lookup error:', error.message);
            return { success: false, reason: error.message };
        }
    }

    /**
     * 🌐 WEB RESEARCH LOCATION FALLBACK
     */
    async getWebResearchLocation(companyData) {
        if (!this.config.PERPLEXITY_API_KEY) {
            return this.generateLocationFallback(companyData);
        }

        try {
            const query = `What is the headquarters location, city, and country for ${companyData.name}? Include timezone information.`;
            
            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.PERPLEXITY_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'sonar-pro',
                    messages: [{ role: 'user', content: query }],
                    temperature: 0.1
                })
            });

            if (!response.ok) {
                return this.generateLocationFallback(companyData);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;
            
            return this.parseLocationFromText(content, companyData);

        } catch (error) {
            console.error('Web research location error:', error.message);
            return this.generateLocationFallback(companyData);
        }
    }

    /**
     * 🧠 LOCATION ANALYSIS METHODS
     */
    analyzeExecutiveCoLocation(locationAnalysis) {
        const companyLocation = locationAnalysis.companyCity;
        const ceoLocation = locationAnalysis.ceoLocation;
        const cfoLocation = locationAnalysis.cfoLocation;

        if (!companyLocation) return 'Unknown (No HQ data)';

        const ceoColocated = ceoLocation && this.locationsMatch(companyLocation, ceoLocation);
        const cfoColocated = cfoLocation && this.locationsMatch(companyLocation, cfoLocation);

        if (ceoColocated && cfoColocated) {
            return 'Both executives co-located with HQ';
        } else if (ceoColocated) {
            return 'CEO co-located with HQ, CFO remote';
        } else if (cfoColocated) {
            return 'CFO co-located with HQ, CEO remote';
        } else if (ceoLocation && cfoLocation) {
            return 'Both executives remote from HQ';
        } else {
            return 'Executive locations unknown';
        }
    }

    assessRemoteWorkLikelihood(locationAnalysis) {
        const coLocation = locationAnalysis.executiveCoLocation;
        const companyCountry = locationAnalysis.companyCountry;

        let likelihood = 50; // Base 50%

        // Co-location factors
        if (coLocation.includes('Both executives co-located')) {
            likelihood -= 30; // Less likely remote if both at HQ
        } else if (coLocation.includes('Both executives remote')) {
            likelihood += 40; // More likely remote culture
        } else if (coLocation.includes('remote')) {
            likelihood += 20; // Mixed signals
        }

        // Industry and geography factors
        if (companyCountry === 'United States') {
            likelihood += 15; // US has higher remote work adoption
        } else if (companyCountry === 'Germany' || companyCountry === 'Japan') {
            likelihood -= 10; // More traditional office cultures
        }

        // Ensure bounds
        likelihood = Math.max(0, Math.min(100, likelihood));

        if (likelihood >= 70) return 'High (70%+)';
        if (likelihood >= 50) return 'Moderate (50-70%)';
        if (likelihood >= 30) return 'Low (30-50%)';
        return 'Very Low (<30%)';
    }

    calculateOfficeVisitProbability(locationAnalysis) {
        const remoteWork = locationAnalysis.remoteWorkLikelihood;
        const coLocation = locationAnalysis.executiveCoLocation;

        let probability = 50; // Base 50%

        // Remote work impact
        if (remoteWork.includes('High')) {
            probability -= 30;
        } else if (remoteWork.includes('Low')) {
            probability += 25;
        }

        // Co-location impact
        if (coLocation.includes('Both executives co-located')) {
            probability += 35;
        } else if (coLocation.includes('Both executives remote')) {
            probability -= 25;
        }

        probability = Math.max(0, Math.min(100, probability));

        if (probability >= 80) return 'Very High (80%+) - Likely in office most days';
        if (probability >= 60) return 'High (60-80%) - Regular office presence';
        if (probability >= 40) return 'Moderate (40-60%) - Hybrid schedule likely';
        if (probability >= 20) return 'Low (20-40%) - Occasional office visits';
        return 'Very Low (<20%) - Primarily remote';
    }

    determineOptimalContactTimezone(locationAnalysis) {
        const timezones = [
            locationAnalysis.companyTimezone,
            locationAnalysis.ceoTimezone,
            locationAnalysis.cfoTimezone
        ].filter(tz => tz && tz !== 'Unknown');

        if (timezones.length === 0) return 'Unknown';

        // Find most common timezone
        const timezoneCount = {};
        timezones.forEach(tz => {
            timezoneCount[tz] = (timezoneCount[tz] || 0) + 1;
        });

        const primaryTimezone = Object.keys(timezoneCount).reduce((a, b) => 
            timezoneCount[a] > timezoneCount[b] ? a : b
        );

        return `${primaryTimezone} (Primary business timezone)`;
    }

    /**
     * 📞 CONTACT STRATEGY METHODS
     */
    generateContactTimingStrategy(locationAnalysis) {
        const timezone = locationAnalysis.optimalContactTimezone;
        const officeProb = locationAnalysis.officeVisitProbability;

        let strategy = '';

        if (timezone.includes('EST') || timezone.includes('PST')) {
            strategy += 'US business hours (9 AM - 5 PM local time). ';
        } else if (timezone.includes('GMT') || timezone.includes('CET')) {
            strategy += 'European business hours (9 AM - 5 PM local time). ';
        } else {
            strategy += 'Local business hours (9 AM - 5 PM). ';
        }

        if (officeProb.includes('Very High') || officeProb.includes('High')) {
            strategy += 'Best contacted during office hours - likely in-person availability.';
        } else if (officeProb.includes('Low') || officeProb.includes('Very Low')) {
            strategy += 'Flexible timing - remote work enables broader contact windows.';
        } else {
            strategy += 'Standard business hours recommended.';
        }

        return strategy;
    }

    determineMeetingPreferences(locationAnalysis) {
        const officeProb = locationAnalysis.officeVisitProbability;
        const coLocation = locationAnalysis.executiveCoLocation;

        if (officeProb.includes('Very High')) {
            return 'In-person meetings preferred - high office presence';
        } else if (officeProb.includes('High')) {
            return 'Hybrid approach - both in-person and virtual meetings viable';
        } else if (officeProb.includes('Low') || officeProb.includes('Very Low')) {
            return 'Virtual meetings preferred - primarily remote work culture';
        } else {
            return 'Standard meeting preferences - adapt to executive preference';
        }
    }

    /**
     * 🛠️ UTILITY METHODS
     */
    initializeTimezoneMap() {
        return {
            'United States': {
                'New York': 'EST',
                'Los Angeles': 'PST',
                'Chicago': 'CST',
                'Boston': 'EST',
                'San Francisco': 'PST',
                'Seattle': 'PST',
                'Austin': 'CST',
                'Atlanta': 'EST'
            },
            'United Kingdom': {
                'London': 'GMT'
            },
            'Germany': {
                'Berlin': 'CET',
                'Munich': 'CET'
            },
            'Canada': {
                'Toronto': 'EST',
                'Vancouver': 'PST'
            }
        };
    }

    getTimezoneFromLocation(country, city) {
        if (!country || !city) return 'Unknown';
        
        const countryMap = this.timezoneMap[country];
        if (!countryMap) return 'Unknown';
        
        return countryMap[city] || 'Unknown';
    }

    locationsMatch(location1, location2) {
        if (!location1 || !location2) return false;
        
        const clean1 = location1.toLowerCase().replace(/[,\s]/g, '');
        const clean2 = location2.toLowerCase().replace(/[,\s]/g, '');
        
        return clean1.includes(clean2) || clean2.includes(clean1);
    }

    parseLocationFromText(text, companyData) {
        // Simple parsing - would be enhanced with NLP
        const lines = text.split('\n');
        let headquarters = 'Unknown';
        let country = 'Unknown';
        let city = 'Unknown';
        
        for (const line of lines) {
            if (line.toLowerCase().includes('headquarters') || line.toLowerCase().includes('located')) {
                headquarters = line.trim();
                
                // Extract city and country
                if (line.includes(',')) {
                    const parts = line.split(',');
                    if (parts.length >= 2) {
                        city = parts[parts.length - 2].trim();
                        country = parts[parts.length - 1].trim();
                    }
                }
                break;
            }
        }
        
        return {
            headquarters,
            country,
            city,
            timezone: this.getTimezoneFromLocation(country, city),
            source: 'Web Research'
        };
    }

    generateLocationFallback(companyData) {
        return {
            headquarters: 'Unknown - Research Required',
            country: 'Unknown',
            city: 'Unknown',
            timezone: 'Unknown',
            source: 'Fallback'
        };
    }

    generateFallbackLocationAnalysis(companyData) {
        return {
            company: companyData,
            companyHQ: 'Unknown',
            companyTimezone: 'Unknown',
            companyCountry: 'Unknown',
            companyCity: 'Unknown',
            ceoLocation: 'Unknown',
            ceoTimezone: 'Unknown',
            cfoLocation: 'Unknown',
            cfoTimezone: 'Unknown',
            executiveCoLocation: 'Unknown',
            remoteWorkLikelihood: 'Unknown',
            officeVisitProbability: 'Unknown',
            optimalContactTimezone: 'Unknown',
            contactTiming: 'Standard business hours',
            meetingPreferences: 'Standard preferences',
            travelRequirements: 'Unknown',
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = { LocationAnalysis };
