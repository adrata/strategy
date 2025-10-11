#!/usr/bin/env node

/**
 * 🔍 API HEALTH CHECK
 * 
 * Comprehensive health check for all API integrations
 * Tests connectivity, authentication, and basic functionality
 */

const fetch = require('node-fetch');

class APIHealthChecker {
    constructor() {
        this.results = {};
        this.config = {
            CORESIGNAL_API_KEY: process.env.CORESIGNAL_API_KEY,
            PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
            ZEROBOUNCE_API_KEY: process.env.ZEROBOUNCE_API_KEY,
            MYEMAILVERIFIER_API_KEY: process.env.MYEMAILVERIFIER_API_KEY,
            TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
            TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
            LUSHA_API_KEY: process.env.LUSHA_API_KEY,
            PROSPEO_API_KEY: process.env.PROSPEO_API_KEY,
            PEOPLE_DATA_LABS_API_KEY: process.env.PEOPLE_DATA_LABS_API_KEY
        };
    }

    async checkAllAPIs() {
        console.log('🔍 API Health Check - Testing All Integrations');
        console.log('================================================');
        
        const checks = [
            { name: 'CoreSignal', method: this.checkCoreSignal.bind(this) },
            { name: 'Perplexity', method: this.checkPerplexity.bind(this) },
            { name: 'ZeroBounce', method: this.checkZeroBounce.bind(this) },
            { name: 'MyEmailVerifier', method: this.checkMyEmailVerifier.bind(this) },
            { name: 'Twilio', method: this.checkTwilio.bind(this) },
            { name: 'Lusha', method: this.checkLusha.bind(this) },
            { name: 'Prospeo', method: this.checkProspeo.bind(this) },
            { name: 'People Data Labs', method: this.checkPeopleDataLabs.bind(this) }
        ];

        for (const check of checks) {
            try {
                console.log(`\n🔍 Testing ${check.name}...`);
                const result = await check.method();
                this.results[check.name] = result;
                
                if (result.status === 'healthy') {
                    console.log(`   ✅ ${check.name}: ${result.message}`);
                } else if (result.status === 'warning') {
                    console.log(`   ⚠️ ${check.name}: ${result.message}`);
                } else {
                    console.log(`   ❌ ${check.name}: ${result.message}`);
                }
            } catch (error) {
                console.log(`   ❌ ${check.name}: Error - ${error.message}`);
                this.results[check.name] = {
                    status: 'error',
                    message: error.message,
                    error: error
                };
            }
        }

        this.printSummary();
        return this.results;
    }

    async checkCoreSignal() {
        if (!this.config.CORESIGNAL_API_KEY) {
            return { status: 'error', message: 'API key not configured' };
        }

        try {
            const response = await fetch('https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl', {
                method: 'POST',
                headers: {
                    'apikey': this.config.CORESIGNAL_API_KEY.trim(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: {
                        bool: {
                            must: [
                                { match: { "website": "microsoft.com" } }
                            ]
                        }
                    }
                }),
                timeout: 10000
            });

            if (response.ok) {
                const data = await response.json();
                return { 
                    status: 'healthy', 
                    message: `Connected successfully (${response.status})`,
                    credits: 'Available'
                };
            } else {
                return { 
                    status: 'error', 
                    message: `HTTP ${response.status}: ${response.statusText}` 
                };
            }
        } catch (error) {
            return { status: 'error', message: error.message };
        }
    }

    async checkPerplexity() {
        if (!this.config.PERPLEXITY_API_KEY) {
            return { status: 'error', message: 'API key not configured' };
        }

        try {
            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.PERPLEXITY_API_KEY.trim()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.1-sonar-small-128k-online',
                    messages: [
                        { role: 'user', content: 'Is this a test?' }
                    ],
                    max_tokens: 10
                }),
                timeout: 10000
            });

            if (response.ok) {
                return { 
                    status: 'healthy', 
                    message: `Connected successfully (${response.status})`,
                    model: 'llama-3.1-sonar-small-128k-online'
                };
            } else if (response.status === 400) {
                // 400 might be due to model or request format, but API is reachable
                return { 
                    status: 'warning', 
                    message: `API reachable but request format issue (${response.status})` 
                };
            } else {
                return { 
                    status: 'error', 
                    message: `HTTP ${response.status}: ${response.statusText}` 
                };
            }
        } catch (error) {
            return { status: 'error', message: error.message };
        }
    }

    async checkZeroBounce() {
        if (!this.config.ZEROBOUNCE_API_KEY) {
            return { status: 'error', message: 'API key not configured' };
        }

        try {
            const response = await fetch(`https://api.zerobounce.net/v2/validate?api_key=${this.config.ZEROBOUNCE_API_KEY}&email=test@example.com`, {
                timeout: 10000
            });

            if (response.ok) {
                const data = await response.json();
                return { 
                    status: 'healthy', 
                    message: `Connected successfully (${response.status})`,
                    credits: data.credits_remaining || 'Unknown'
                };
            } else {
                return { 
                    status: 'error', 
                    message: `HTTP ${response.status}: ${response.statusText}` 
                };
            }
        } catch (error) {
            return { status: 'error', message: error.message };
        }
    }

    async checkMyEmailVerifier() {
        if (!this.config.MYEMAILVERIFIER_API_KEY) {
            return { status: 'error', message: 'API key not configured' };
        }

        try {
            const response = await fetch(`https://client.myemailverifier.com/verifier/validate_single/test@example.com/${this.config.MYEMAILVERIFIER_API_KEY}`, {
                timeout: 10000
            });

            if (response.ok) {
                return { 
                    status: 'healthy', 
                    message: `Connected successfully (${response.status})`
                };
            } else if (response.status === 429) {
                return { 
                    status: 'warning', 
                    message: `Rate limited (${response.status}) - API working but quota exceeded` 
                };
            } else {
                return { 
                    status: 'error', 
                    message: `HTTP ${response.status}: ${response.statusText}` 
                };
            }
        } catch (error) {
            return { status: 'error', message: error.message };
        }
    }

    async checkTwilio() {
        if (!this.config.TWILIO_ACCOUNT_SID || !this.config.TWILIO_AUTH_TOKEN) {
            return { status: 'error', message: 'Account SID or Auth Token not configured' };
        }

        try {
            const auth = Buffer.from(`${this.config.TWILIO_ACCOUNT_SID}:${this.config.TWILIO_AUTH_TOKEN}`).toString('base64');
            const response = await fetch(`https://lookups.twilio.com/v1/PhoneNumbers/+15551234567`, {
                headers: {
                    'Authorization': `Basic ${auth}`
                },
                timeout: 10000
            });

            if (response.ok || response.status === 400 || response.status === 404) { 
                // 400/404 are expected for invalid numbers, but API is reachable
                return { 
                    status: 'healthy', 
                    message: `Connected successfully (${response.status})`,
                    account: this.config.TWILIO_ACCOUNT_SID
                };
            } else {
                return { 
                    status: 'error', 
                    message: `HTTP ${response.status}: ${response.statusText}` 
                };
            }
        } catch (error) {
            return { status: 'error', message: error.message };
        }
    }

    async checkLusha() {
        if (!this.config.LUSHA_API_KEY) {
            return { status: 'warning', message: 'API key not configured (optional)' };
        }

        try {
            const response = await fetch('https://api.lusha.com/v2/person', {
                method: 'POST',
                headers: {
                    'X-API-Key': this.config.LUSHA_API_KEY.trim(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    firstName: 'Test',
                    lastName: 'User',
                    companyName: 'Test Company'
                }),
                timeout: 10000
            });

            if (response.ok) {
                return { 
                    status: 'healthy', 
                    message: `Connected successfully (${response.status})`
                };
            } else if (response.status === 429) {
                return { 
                    status: 'warning', 
                    message: `Rate limited (${response.status}) - API working but quota exceeded` 
                };
            } else {
                return { 
                    status: 'error', 
                    message: `HTTP ${response.status}: ${response.statusText}` 
                };
            }
        } catch (error) {
            return { status: 'error', message: error.message };
        }
    }

    async checkProspeo() {
        if (!this.config.PROSPEO_API_KEY) {
            return { status: 'warning', message: 'API key not configured (optional)' };
        }

        try {
            const response = await fetch('https://api.prospeo.io/email-verifier', {
                method: 'POST',
                headers: {
                    'X-KEY': this.config.PROSPEO_API_KEY.trim(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: 'test@example.com'
                }),
                timeout: 10000
            });

            if (response.ok) {
                return { 
                    status: 'healthy', 
                    message: `Connected successfully (${response.status})`
                };
            } else {
                return { 
                    status: 'error', 
                    message: `HTTP ${response.status}: ${response.statusText}` 
                };
            }
        } catch (error) {
            return { status: 'error', message: error.message };
        }
    }

    async checkPeopleDataLabs() {
        if (!this.config.PEOPLE_DATA_LABS_API_KEY) {
            return { status: 'warning', message: 'API key not configured (optional)' };
        }

        try {
            const response = await fetch('https://api.peopledatalabs.com/v5/person/enrich', {
                method: 'POST',
                headers: {
                    'X-Api-Key': this.config.PEOPLE_DATA_LABS_API_KEY.trim(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: 'Test User',
                    company: 'Test Company'
                }),
                timeout: 10000
            });

            if (response.ok) {
                return { 
                    status: 'healthy', 
                    message: `Connected successfully (${response.status})`
                };
            } else if (response.status === 402) {
                return { 
                    status: 'warning', 
                    message: `Payment required (${response.status}) - API working but credits exhausted` 
                };
            } else if (response.status === 404) {
                return { 
                    status: 'warning', 
                    message: `Not found (${response.status}) - API working but no data found` 
                };
            } else {
                return { 
                    status: 'error', 
                    message: `HTTP ${response.status}: ${response.statusText}` 
                };
            }
        } catch (error) {
            return { status: 'error', message: error.message };
        }
    }

    printSummary() {
        console.log('\n📊 API Health Check Summary');
        console.log('============================');
        
        const healthy = Object.values(this.results).filter(r => r.status === 'healthy').length;
        const warnings = Object.values(this.results).filter(r => r.status === 'warning').length;
        const errors = Object.values(this.results).filter(r => r.status === 'error').length;
        
        console.log(`✅ Healthy: ${healthy}`);
        console.log(`⚠️ Warnings: ${warnings}`);
        console.log(`❌ Errors: ${errors}`);
        
        if (errors === 0) {
            console.log('\n🎉 All APIs are working! Pipeline is ready for production.');
        } else {
            console.log('\n⚠️ Some APIs have issues. Check the details above.');
        }
        
        // Required APIs check
        const requiredAPIs = ['CoreSignal', 'Perplexity', 'ZeroBounce', 'MyEmailVerifier', 'Twilio'];
        const requiredHealthy = requiredAPIs.every(api => 
            this.results[api] && this.results[api].status === 'healthy'
        );
        
        if (requiredHealthy) {
            console.log('✅ All required APIs are healthy');
        } else {
            console.log('❌ Some required APIs have issues - pipeline may not work properly');
        }
        
        // Optional APIs check
        const optionalAPIs = ['Lusha', 'Prospeo', 'People Data Labs'];
        const optionalWorking = optionalAPIs.filter(api => 
            this.results[api] && (this.results[api].status === 'healthy' || this.results[api].status === 'warning')
        ).length;
        
        console.log(`📈 Optional APIs working: ${optionalWorking}/${optionalAPIs.length}`);
    }

    getResults() {
        return this.results;
    }
}

// Run health check if called directly
if (require.main === module) {
    const checker = new APIHealthChecker();
    checker.checkAllAPIs()
        .then(results => {
            process.exit(0);
        })
        .catch(error => {
            console.error('Health check failed:', error);
            process.exit(1);
        });
}

module.exports = APIHealthChecker;
