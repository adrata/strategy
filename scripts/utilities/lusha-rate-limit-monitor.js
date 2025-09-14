#!/usr/bin/env node

/**
 * 🔍 LUSHA API RATE LIMIT MONITOR
 * 
 * Monitors Lusha API usage and rate limits based on the official documentation:
 * - General Rate Limit: 25 requests per second per endpoint
 * - Credit Usage API: 5 requests per minute
 * - Daily limits vary by billing plan
 * 
 * Rate limit headers to monitor:
 * - x-rate-limit-daily: Total daily requests allowed
 * - x-daily-requests-left: Remaining daily requests
 * - x-daily-usage: Current daily usage
 * - x-rate-limit-hourly: Total hourly requests allowed
 * - x-hourly-requests-left: Remaining hourly requests
 * - x-hourly-usage: Current hourly usage
 * - x-rate-limit-minute: Total per-minute requests allowed
 * - x-minute-requests-left: Remaining minute requests
 * - x-minute-usage: Current minute usage
 */

require('dotenv').config();
// Use native fetch in Node.js 18+

class LushaRateLimitMonitor {
    constructor() {
        this.config = {
            LUSHA_API_KEY: process.env.LUSHA_API_KEY,
            BASE_URL: 'https://api.lusha.com',
            ENDPOINTS: {
                person: '/v2/person',
                company: '/v2/company',
                usage: '/account/usage',
                prospecting_contact_search: '/prospecting/contact/search',
                prospecting_company_search: '/prospecting/company/search'
            }
        };
        
        this.rateLimitInfo = {
            daily: {},
            hourly: {},
            minute: {},
            lastChecked: null
        };
    }

    /**
     * 🚀 MAIN EXECUTION
     */
    async run() {
        console.log('🔍 LUSHA API RATE LIMIT MONITOR');
        console.log('=' .repeat(50));
        console.log(`🔑 API Key: ${this.config.LUSHA_API_KEY ? 'Available' : 'Missing'}`);
        console.log('');

        if (!this.config.LUSHA_API_KEY) {
            console.error('❌ Missing Lusha API key. Please set LUSHA_API_KEY environment variable.');
            return false;
        }

        // Check account usage first
        await this.checkAccountUsage();
        
        // Test rate limits with a simple person lookup
        await this.testRateLimits();
        
        // Display current rate limit status
        this.displayRateLimitStatus();
        
        return true;
    }

    /**
     * 📊 CHECK ACCOUNT USAGE
     */
    async checkAccountUsage() {
        console.log('📊 Checking account usage...');
        
        try {
            const response = await fetch(`${this.config.BASE_URL}${this.config.ENDPOINTS.usage}`, {
                method: 'GET',
                headers: {
                    'api_key': this.config.LUSHA_API_KEY,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Account Usage Data:');
                console.log(JSON.stringify(data, null, 2));
                
                // Extract rate limit headers
                this.extractRateLimitHeaders(response);
            } else {
                console.log(`⚠️ Usage API error: ${response.status} - ${response.statusText}`);
                if (response.status === 429) {
                    console.log('🚨 Rate limit exceeded on usage endpoint!');
                    this.extractRateLimitHeaders(response);
                }
            }
        } catch (error) {
            console.log(`❌ Usage API error: ${error.message}`);
        }
        
        console.log('');
    }

    /**
     * 🧪 TEST RATE LIMITS
     */
    async testRateLimits() {
        console.log('🧪 Testing rate limits with person lookup...');
        
        try {
            // Test with a simple person lookup (should not consume credits if person not found)
            const params = new URLSearchParams({
                firstName: 'Test',
                lastName: 'User',
                companyName: 'NonExistentCompany123456'
            });

            const response = await fetch(`${this.config.BASE_URL}${this.config.ENDPOINTS.person}?${params}`, {
                method: 'GET',
                headers: {
                    'api_key': this.config.LUSHA_API_KEY,
                    'Content-Type': 'application/json'
                }
            });

            console.log(`📡 Response Status: ${response.status} - ${response.statusText}`);
            
            // Extract and display rate limit headers
            this.extractRateLimitHeaders(response);
            
            if (response.status === 429) {
                console.log('🚨 Rate limit exceeded!');
                const retryAfter = response.headers.get('Retry-After');
                if (retryAfter) {
                    console.log(`⏰ Retry after: ${retryAfter} seconds`);
                }
            }

        } catch (error) {
            console.log(`❌ Rate limit test error: ${error.message}`);
        }
        
        console.log('');
    }

    /**
     * 📋 EXTRACT RATE LIMIT HEADERS
     */
    extractRateLimitHeaders(response) {
        const headers = {
            // Daily limits
            dailyLimit: response.headers.get('x-rate-limit-daily'),
            dailyRemaining: response.headers.get('x-daily-requests-left'),
            dailyUsage: response.headers.get('x-daily-usage'),
            
            // Hourly limits
            hourlyLimit: response.headers.get('x-rate-limit-hourly'),
            hourlyRemaining: response.headers.get('x-hourly-requests-left'),
            hourlyUsage: response.headers.get('x-hourly-usage'),
            
            // Minute limits
            minuteLimit: response.headers.get('x-rate-limit-minute'),
            minuteRemaining: response.headers.get('x-minute-requests-left'),
            minuteUsage: response.headers.get('x-minute-usage'),
            
            // Additional headers
            retryAfter: response.headers.get('Retry-After'),
            resetDaily: response.headers.get('X-RateLimit-Reset-Daily'),
            remainingDaily: response.headers.get('X-RateLimit-Remaining-Daily')
        };

        // Store the latest rate limit info
        this.rateLimitInfo = {
            daily: {
                limit: headers.dailyLimit ? parseInt(headers.dailyLimit) : null,
                remaining: headers.dailyRemaining ? parseInt(headers.dailyRemaining) : null,
                usage: headers.dailyUsage ? parseInt(headers.dailyUsage) : null
            },
            hourly: {
                limit: headers.hourlyLimit ? parseInt(headers.hourlyLimit) : null,
                remaining: headers.hourlyRemaining ? parseInt(headers.hourlyRemaining) : null,
                usage: headers.hourlyUsage ? parseInt(headers.hourlyUsage) : null
            },
            minute: {
                limit: headers.minuteLimit ? parseInt(headers.minuteLimit) : null,
                remaining: headers.minuteRemaining ? parseInt(headers.minuteRemaining) : null,
                usage: headers.minuteUsage ? parseInt(headers.minuteUsage) : null
            },
            lastChecked: new Date().toISOString(),
            retryAfter: headers.retryAfter,
            resetDaily: headers.resetDaily,
            remainingDaily: headers.remainingDaily
        };

        return headers;
    }

    /**
     * 📊 DISPLAY RATE LIMIT STATUS
     */
    displayRateLimitStatus() {
        console.log('📊 CURRENT RATE LIMIT STATUS');
        console.log('=' .repeat(50));
        
        // Daily limits
        if (this.rateLimitInfo.daily.limit !== null) {
            const dailyUsagePercent = this.rateLimitInfo.daily.usage && this.rateLimitInfo.daily.limit 
                ? ((this.rateLimitInfo.daily.usage / this.rateLimitInfo.daily.limit) * 100).toFixed(1)
                : 'Unknown';
            
            console.log('📅 DAILY LIMITS:');
            console.log(`   Total Allowed: ${this.rateLimitInfo.daily.limit || 'Unknown'}`);
            console.log(`   Used Today: ${this.rateLimitInfo.daily.usage || 'Unknown'}`);
            console.log(`   Remaining: ${this.rateLimitInfo.daily.remaining || 'Unknown'}`);
            console.log(`   Usage: ${dailyUsagePercent}%`);
            
            // Warning if approaching limit
            if (this.rateLimitInfo.daily.remaining !== null && this.rateLimitInfo.daily.remaining < 100) {
                console.log('🚨 WARNING: Less than 100 daily requests remaining!');
            }
            console.log('');
        }

        // Hourly limits
        if (this.rateLimitInfo.hourly.limit !== null) {
            console.log('⏰ HOURLY LIMITS:');
            console.log(`   Total Allowed: ${this.rateLimitInfo.hourly.limit || 'Unknown'}`);
            console.log(`   Used This Hour: ${this.rateLimitInfo.hourly.usage || 'Unknown'}`);
            console.log(`   Remaining: ${this.rateLimitInfo.hourly.remaining || 'Unknown'}`);
            console.log('');
        }

        // Minute limits
        if (this.rateLimitInfo.minute.limit !== null) {
            console.log('⚡ MINUTE LIMITS:');
            console.log(`   Total Allowed: ${this.rateLimitInfo.minute.limit || 'Unknown'}`);
            console.log(`   Used This Minute: ${this.rateLimitInfo.minute.usage || 'Unknown'}`);
            console.log(`   Remaining: ${this.rateLimitInfo.minute.remaining || 'Unknown'}`);
            console.log('');
        }

        // Rate limit recommendations
        this.displayRecommendations();
        
        console.log(`🕐 Last Checked: ${this.rateLimitInfo.lastChecked}`);
    }

    /**
     * 💡 DISPLAY RECOMMENDATIONS
     */
    displayRecommendations() {
        console.log('💡 RECOMMENDATIONS:');
        
        // Based on Lusha documentation
        console.log('   • General Rate Limit: 25 requests/second per endpoint');
        console.log('   • Credit Usage API: 5 requests/minute');
        console.log('   • Daily limits vary by billing plan');
        console.log('   • Implement exponential backoff for 429 errors');
        console.log('   • Monitor x-daily-requests-left header');
        console.log('   • Use bulk endpoints when possible');
        
        // Current usage warnings
        if (this.rateLimitInfo.daily.remaining !== null) {
            if (this.rateLimitInfo.daily.remaining < 50) {
                console.log('   🚨 URGENT: Very low daily requests remaining!');
            } else if (this.rateLimitInfo.daily.remaining < 200) {
                console.log('   ⚠️ WARNING: Low daily requests remaining');
            }
        }
        
        console.log('');
    }

    /**
     * 📈 GET USAGE SUMMARY
     */
    getUsageSummary() {
        return {
            dailyUsagePercent: this.rateLimitInfo.daily.usage && this.rateLimitInfo.daily.limit 
                ? ((this.rateLimitInfo.daily.usage / this.rateLimitInfo.daily.limit) * 100)
                : null,
            dailyRemaining: this.rateLimitInfo.daily.remaining,
            hourlyRemaining: this.rateLimitInfo.hourly.remaining,
            minuteRemaining: this.rateLimitInfo.minute.remaining,
            isNearLimit: this.rateLimitInfo.daily.remaining !== null && this.rateLimitInfo.daily.remaining < 100,
            lastChecked: this.rateLimitInfo.lastChecked
        };
    }
}

// Export for use in other scripts
module.exports = LushaRateLimitMonitor;

// Run directly if called from command line
if (require.main === module) {
    const monitor = new LushaRateLimitMonitor();
    monitor.run().catch(console.error);
}
