/**
 * RetryHandler - Centralized retry logic with exponential backoff
 * Handles transient failures for API calls with configurable retry strategies
 */

class RetryHandler {
    constructor(config = {}) {
        this.config = {
            maxRetries: config.maxRetries || 3,
            baseDelay: config.baseDelay || 1000, // 1 second
            maxDelay: config.maxDelay || 10000,  // 10 seconds
            backoffMultiplier: config.backoffMultiplier || 2,
            jitter: config.jitter !== false, // Add randomness to prevent thundering herd
            ...config
        };
    }

    /**
     * Execute a function with retry logic
     * @param {Function} fn - Function to execute
     * @param {Object} options - Retry options
     * @returns {Promise} Result of the function
     */
    async execute(fn, options = {}) {
        const {
            maxRetries = this.config.maxRetries,
            baseDelay = this.config.baseDelay,
            maxDelay = this.config.maxDelay,
            backoffMultiplier = this.config.backoffMultiplier,
            jitter = this.config.jitter,
            retryCondition = this.defaultRetryCondition,
            onRetry = null
        } = { ...this.config, ...options };

        let lastError;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const result = await fn();
                if (attempt > 0) {
                    console.log(`   ✅ Retry successful on attempt ${attempt + 1}`);
                }
                return result;
            } catch (error) {
                lastError = error;
                
                // Check if we should retry this error
                if (!retryCondition(error, attempt)) {
                    throw error;
                }
                
                // Don't retry on the last attempt
                if (attempt === maxRetries) {
                    break;
                }
                
                // Calculate delay with exponential backoff
                const delay = this.calculateDelay(attempt, baseDelay, maxDelay, backoffMultiplier, jitter);
                
                console.log(`   ⚠️ Attempt ${attempt + 1} failed: ${error.message}. Retrying in ${delay}ms...`);
                
                if (onRetry) {
                    onRetry(error, attempt, delay);
                }
                
                await this.sleep(delay);
            }
        }
        
        throw lastError;
    }

    /**
     * Calculate delay with exponential backoff and jitter
     */
    calculateDelay(attempt, baseDelay, maxDelay, backoffMultiplier, jitter) {
        let delay = baseDelay * Math.pow(backoffMultiplier, attempt);
        delay = Math.min(delay, maxDelay);
        
        if (jitter) {
            // Add up to 25% jitter to prevent thundering herd
            const jitterAmount = delay * 0.25 * Math.random();
            delay += jitterAmount;
        }
        
        return Math.floor(delay);
    }

    /**
     * Default retry condition - retry on network errors, timeouts, and 5xx errors
     */
    defaultRetryCondition(error, attempt) {
        // Don't retry on client errors (4xx) except for rate limits
        if (error.status >= 400 && error.status < 500) {
            return error.status === 429; // Only retry rate limits
        }
        
        // Retry on server errors (5xx)
        if (error.status >= 500) {
            return true;
        }
        
        // Retry on network errors
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
            return true;
        }
        
        // Retry on timeout errors
        if (error.name === 'AbortError' || error.message.includes('timeout')) {
            return true;
        }
        
        return false;
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Create a retry wrapper for fetch calls
     */
    createFetchWrapper(options = {}) {
        return async (url, fetchOptions = {}) => {
            return this.execute(async () => {
                const response = await fetch(url, fetchOptions);
                
                if (!response.ok) {
                    const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
                    error.status = response.status;
                    error.statusText = response.statusText;
                    throw error;
                }
                
                return response;
            }, options);
        };
    }

    /**
     * Create a retry wrapper for API calls that return JSON
     */
    createApiWrapper(options = {}) {
        return async (url, fetchOptions = {}) => {
            const response = await this.createFetchWrapper(options)(url, fetchOptions);
            return response.json();
        };
    }
}

module.exports = RetryHandler;
