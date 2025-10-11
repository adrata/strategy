/**
 * TimeoutHandler - Centralized timeout handling using AbortController
 * Provides proper timeout implementation for fetch calls
 */

class TimeoutHandler {
    constructor(config = {}) {
        this.config = {
            defaultTimeout: config.defaultTimeout || 30000, // 30 seconds
            ...config
        };
    }

    /**
     * Create a fetch call with timeout
     * @param {string} url - URL to fetch
     * @param {Object} options - Fetch options
     * @param {number} timeout - Timeout in milliseconds
     * @returns {Promise} Fetch response
     */
    async fetchWithTimeout(url, options = {}, timeout = this.config.defaultTimeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                const timeoutError = new Error(`Request timeout after ${timeout}ms`);
                timeoutError.name = 'TimeoutError';
                timeoutError.code = 'TIMEOUT';
                throw timeoutError;
            }
            
            throw error;
        }
    }

    /**
     * Create a timeout wrapper for any async function
     * @param {Function} fn - Function to wrap
     * @param {number} timeout - Timeout in milliseconds
     * @returns {Promise} Function result
     */
    async withTimeout(fn, timeout = this.config.defaultTimeout) {
        return new Promise(async (resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Operation timeout after ${timeout}ms`));
            }, timeout);

            try {
                const result = await fn();
                clearTimeout(timeoutId);
                resolve(result);
            } catch (error) {
                clearTimeout(timeoutId);
                reject(error);
            }
        });
    }

    /**
     * Create a fetch wrapper with configurable timeout
     * @param {number} timeout - Timeout in milliseconds
     * @returns {Function} Fetch wrapper function
     */
    createFetchWrapper(timeout = this.config.defaultTimeout) {
        return (url, options = {}) => {
            return this.fetchWithTimeout(url, options, timeout);
        };
    }

    /**
     * Create an API wrapper that returns JSON with timeout
     * @param {number} timeout - Timeout in milliseconds
     * @returns {Function} API wrapper function
     */
    createApiWrapper(timeout = this.config.defaultTimeout) {
        return async (url, options = {}) => {
            const response = await this.fetchWithTimeout(url, options, timeout);
            return response.json();
        };
    }

    /**
     * Get timeout configuration for different API types
     */
    getApiTimeout(apiType) {
        const timeouts = {
            coresignal: 20000,    // 20 seconds - optimized (most calls complete in 5-10s)
            lusha: 15000,        // 15 seconds - person lookups are fast
            perplexity: 30000,   // 30 seconds - AI calls usually faster
            zerobounce: 10000,   // 10 seconds - email validation is quick
            myemailverifier: 10000, // 10 seconds - email validation is quick
            prospeo: 15000,      // 15 seconds - optimized
            peopledatalabs: 20000, // 20 seconds - person enrichment
            twilio: 10000,       // 10 seconds - phone lookup is fast
            default: this.config.defaultTimeout
        };

        return timeouts[apiType] || timeouts.default;
    }
}

module.exports = TimeoutHandler;
