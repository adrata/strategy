#!/usr/bin/env node

/**
 * 📦 DATA CACHE MODULE
 * 
 * Simple in-memory cache with TTL support for pipeline data
 * Reduces API costs by caching results for 30 days
 */

class DataCache {
    constructor(config = {}) {
        this.config = {
            CACHE_TTL_DAYS: config.CACHE_TTL_DAYS || 30,
            USE_FILE_CACHE: config.USE_FILE_CACHE || false,
            MAX_CACHE_SIZE: config.MAX_CACHE_SIZE || 1000,
            ...config
        };
        
        this.cache = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            size: 0
        };
    }

    /**
     * Get cached data by service and identifier
     */
    async get(service, identifier) {
        const key = `${service}:${identifier}`;
        const cached = this.cache.get(key);
        
        if (!cached) {
            this.stats.misses++;
            return null;
        }
        
        // Check if expired
        if (Date.now() > cached.expires) {
            this.cache.delete(key);
            this.stats.misses++;
            this.stats.size--;
            return null;
        }
        
        this.stats.hits++;
        return cached.data;
    }

    /**
     * Set cached data with TTL
     */
    async set(service, identifier, data, ttlHours = 24) {
        const key = `${service}:${identifier}`;
        const expires = Date.now() + (ttlHours * 60 * 60 * 1000);
        
        // Check cache size limit
        if (this.cache.size >= this.config.MAX_CACHE_SIZE) {
            this.evictOldest();
        }
        
        this.cache.set(key, {
            data: data,
            expires: expires,
            created: Date.now()
        });
        
        this.stats.sets++;
        this.stats.size = this.cache.size;
    }

    /**
     * Delete cached data
     */
    async delete(service, identifier) {
        const key = `${service}:${identifier}`;
        const deleted = this.cache.delete(key);
        
        if (deleted) {
            this.stats.deletes++;
            this.stats.size = this.cache.size;
        }
        
        return deleted;
    }

    /**
     * Clear all cached data
     */
    async clear() {
        this.cache.clear();
        this.stats.size = 0;
    }

    /**
     * Evict oldest entries when cache is full
     */
    evictOldest() {
        let oldestKey = null;
        let oldestTime = Date.now();
        
        for (const [key, value] of this.cache.entries()) {
            if (value.created < oldestTime) {
                oldestTime = value.created;
                oldestKey = key;
            }
        }
        
        if (oldestKey) {
            this.cache.delete(oldestKey);
            this.stats.size = this.cache.size;
        }
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const hitRate = this.stats.hits + this.stats.misses > 0 
            ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(1)
            : 0;
            
        return {
            ...this.stats,
            hitRate: `${hitRate}%`,
            maxSize: this.config.MAX_CACHE_SIZE
        };
    }

    /**
     * Clean up expired entries
     */
    cleanup() {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [key, value] of this.cache.entries()) {
            if (now > value.expires) {
                this.cache.delete(key);
                cleaned++;
            }
        }
        
        this.stats.size = this.cache.size;
        return cleaned;
    }

    /**
     * Check if company data exists in cache
     */
    async hasCompanyData(website) {
        const key = `company:${website}`;
        const cached = this.cache.get(key);
        
        if (!cached) {
            return { hasCachedData: false };
        }
        
        // Check if expired
        if (Date.now() > cached.expires) {
            this.cache.delete(key);
            this.stats.size--;
            return { hasCachedData: false };
        }
        
        return { 
            hasCachedData: true,
            data: cached.data,
            expires: cached.expires
        };
    }

    /**
     * Get company data from cache
     */
    async getCompanyData(website) {
        const result = await this.hasCompanyData(website);
        return result.hasCachedData ? result.data : null;
    }

    /**
     * Set company data in cache
     */
    async setCompanyData(website, data, ttlHours = 24) {
        const key = `company:${website}`;
        await this.set('company', website, data, ttlHours);
    }
}

module.exports = DataCache;
