#!/usr/bin/env node

/**
 * 🚦 RATE LIMITER
 * 
 * Advanced rate limiting for API calls with daily/monthly limits
 * Tracks usage and prevents quota exhaustion
 */

class RateLimiter {
    constructor(options = {}) {
        this.limits = options.limits || {};
        this.usage = {};
        this.windows = {};
        this.resetTimes = {};
        
        // Default limits (can be overridden)
        this.defaultLimits = {
            lusha: { daily: 2000, resetHour: 0 }, // Reset at midnight UTC
            zerobounce: { daily: 10000, resetHour: 0 },
            myemailverifier: { daily: 5000, resetHour: 0 },
            twilio: { daily: 1000, resetHour: 0 },
            prospeo: { daily: 2000, resetHour: 0 },
            pdl: { daily: 1000, resetHour: 0 },
            coresignal: { daily: 10000, resetHour: 0 },
            perplexity: { daily: 1000, resetHour: 0 }
        };
        
        this.initializeLimits();
    }

    /**
     * Initialize rate limits
     */
    initializeLimits() {
        for (const [api, limits] of Object.entries(this.defaultLimits)) {
            this.limits[api] = { ...limits, ...this.limits[api] };
            this.usage[api] = 0;
            this.windows[api] = this.getCurrentWindow(api);
            this.resetTimes[api] = this.getNextResetTime(api);
        }
    }

    /**
     * Get current time window for API
     */
    getCurrentWindow(api) {
        const now = new Date();
        const resetHour = this.limits[api].resetHour;
        
        // Create window key (YYYY-MM-DD)
        const window = new Date(now);
        if (now.getUTCHours() < resetHour) {
            window.setUTCDate(window.getUTCDate() - 1);
        }
        
        return window.toISOString().split('T')[0];
    }

    /**
     * Get next reset time for API
     */
    getNextResetTime(api) {
        const now = new Date();
        const resetHour = this.limits[api].resetHour;
        
        const resetTime = new Date(now);
        resetTime.setUTCHours(resetHour, 0, 0, 0);
        
        if (now.getUTCHours() >= resetHour) {
            resetTime.setUTCDate(resetTime.getUTCDate() + 1);
        }
        
        return resetTime;
    }

    /**
     * Check if API call is allowed
     */
    canMakeCall(api) {
        const currentWindow = this.getCurrentWindow(api);
        
        // Reset usage if window changed
        if (this.windows[api] !== currentWindow) {
            this.usage[api] = 0;
            this.windows[api] = currentWindow;
            this.resetTimes[api] = this.getNextResetTime(api);
        }
        
        const limit = this.limits[api].daily;
        return this.usage[api] < limit;
    }

    /**
     * Record API call
     */
    recordCall(api) {
        const currentWindow = this.getCurrentWindow(api);
        
        // Reset usage if window changed
        if (this.windows[api] !== currentWindow) {
            this.usage[api] = 0;
            this.windows[api] = currentWindow;
            this.resetTimes[api] = this.getNextResetTime(api);
        }
        
        this.usage[api]++;
    }

    /**
     * Get remaining calls for API
     */
    getRemainingCalls(api) {
        const limit = this.limits[api].daily;
        return Math.max(0, limit - this.usage[api]);
    }

    /**
     * Get usage percentage for API
     */
    getUsagePercentage(api) {
        const limit = this.limits[api].daily;
        return (this.usage[api] / limit * 100).toFixed(1);
    }

    /**
     * Get time until reset for API
     */
    getTimeUntilReset(api) {
        const now = new Date();
        const resetTime = this.resetTimes[api];
        const diff = resetTime - now;
        
        if (diff <= 0) {
            return 'Reset now';
        }
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m`;
    }

    /**
     * Get status for all APIs
     */
    getAllStatus() {
        const status = {};
        
        for (const api of Object.keys(this.limits)) {
            status[api] = {
                used: this.usage[api],
                limit: this.limits[api].daily,
                remaining: this.getRemainingCalls(api),
                percentage: this.getUsagePercentage(api),
                canMakeCall: this.canMakeCall(api),
                timeUntilReset: this.getTimeUntilReset(api)
            };
        }
        
        return status;
    }

    /**
     * Get APIs that are rate limited
     */
    getRateLimitedAPIs() {
        const rateLimited = [];
        
        for (const api of Object.keys(this.limits)) {
            if (!this.canMakeCall(api)) {
                rateLimited.push({
                    api,
                    used: this.usage[api],
                    limit: this.limits[api].daily,
                    timeUntilReset: this.getTimeUntilReset(api)
                });
            }
        }
        
        return rateLimited;
    }

    /**
     * Get APIs that are close to rate limit (80%+ usage)
     */
    getNearLimitAPIs() {
        const nearLimit = [];
        
        for (const api of Object.keys(this.limits)) {
            const percentage = parseFloat(this.getUsagePercentage(api));
            if (percentage >= 80 && percentage < 100) {
                nearLimit.push({
                    api,
                    used: this.usage[api],
                    limit: this.limits[api].daily,
                    percentage: `${percentage}%`,
                    remaining: this.getRemainingCalls(api)
                });
            }
        }
        
        return nearLimit;
    }

    /**
     * Wait for rate limit reset
     */
    async waitForReset(api) {
        const resetTime = this.resetTimes[api];
        const now = new Date();
        const waitTime = resetTime - now;
        
        if (waitTime > 0) {
            console.log(`   ⏳ Waiting ${this.getTimeUntilReset(api)} for ${api} rate limit reset...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }

    /**
     * Get recommended delay for API
     */
    getRecommendedDelay(api) {
        const percentage = parseFloat(this.getUsagePercentage(api));
        
        if (percentage >= 90) {
            return 5000; // 5 seconds
        } else if (percentage >= 80) {
            return 2000; // 2 seconds
        } else if (percentage >= 60) {
            return 1000; // 1 second
        } else {
            return 0; // No delay
        }
    }

    /**
     * Apply delay if needed
     */
    async applyDelay(api) {
        const delay = this.getRecommendedDelay(api);
        if (delay > 0) {
            console.log(`   ⏳ Applying ${delay}ms delay for ${api} (${this.getUsagePercentage(api)}% used)`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    /**
     * Check and handle rate limiting
     */
    async checkRateLimit(api) {
        if (!this.canMakeCall(api)) {
            const rateLimited = this.getRateLimitedAPIs();
            const apiInfo = rateLimited.find(r => r.api === api);
            
            if (apiInfo) {
                console.log(`   🚦 Rate limit exceeded for ${api}: ${apiInfo.used}/${apiInfo.limit} calls used`);
                console.log(`   ⏳ Reset in: ${apiInfo.timeUntilReset}`);
                
                // Wait for reset
                await this.waitForReset(api);
            }
        }
        
        // Apply delay if near limit
        await this.applyDelay(api);
    }

    /**
     * Make API call with rate limiting
     */
    async makeAPICall(api, callFunction) {
        await this.checkRateLimit(api);
        
        if (!this.canMakeCall(api)) {
            throw new Error(`Rate limit exceeded for ${api}`);
        }
        
        try {
            const result = await callFunction();
            this.recordCall(api);
            return result;
        } catch (error) {
            // Don't record failed calls
            throw error;
        }
    }

    /**
     * Get usage summary
     */
    getUsageSummary() {
        const status = this.getAllStatus();
        const totalUsed = Object.values(status).reduce((sum, s) => sum + s.used, 0);
        const totalLimit = Object.values(status).reduce((sum, s) => sum + s.limit, 0);
        const totalRemaining = Object.values(status).reduce((sum, s) => sum + s.remaining, 0);
        
        return {
            totalUsed,
            totalLimit,
            totalRemaining,
            totalPercentage: totalLimit > 0 ? (totalUsed / totalLimit * 100).toFixed(1) : 0,
            rateLimited: this.getRateLimitedAPIs().length,
            nearLimit: this.getNearLimitAPIs().length,
            apis: status
        };
    }

    /**
     * Print usage report
     */
    printUsageReport() {
        const summary = this.getUsageSummary();
        
        console.log('\n📊 API Usage Report');
        console.log('=====================================');
        console.log(`Total Usage: ${summary.totalUsed}/${summary.totalLimit} (${summary.totalPercentage}%)`);
        console.log(`Remaining: ${summary.totalRemaining} calls`);
        console.log(`Rate Limited: ${summary.rateLimited} APIs`);
        console.log(`Near Limit: ${summary.nearLimit} APIs`);
        
        if (summary.rateLimited > 0) {
            console.log('\n🚦 Rate Limited APIs:');
            this.getRateLimitedAPIs().forEach(api => {
                console.log(`   ${api.api}: ${api.used}/${api.limit} (Reset in: ${api.timeUntilReset})`);
            });
        }
        
        if (summary.nearLimit > 0) {
            console.log('\n⚠️ APIs Near Limit:');
            this.getNearLimitAPIs().forEach(api => {
                console.log(`   ${api.api}: ${api.used}/${api.limit} (${api.percentage})`);
            });
        }
        
        console.log('\n📋 All APIs:');
        Object.entries(summary.apis).forEach(([api, status]) => {
            const statusIcon = status.canMakeCall ? '✅' : '🚦';
            console.log(`   ${statusIcon} ${api}: ${status.used}/${status.limit} (${status.percentage}%) - ${status.remaining} remaining`);
        });
    }
}

module.exports = RateLimiter;
