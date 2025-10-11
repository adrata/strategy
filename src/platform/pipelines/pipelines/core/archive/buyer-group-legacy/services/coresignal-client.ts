/**
 * 🔗 CORESIGNAL API CLIENT
 * 
 * Modular CoreSignal API integration with robust error handling and caching
 */

import * as https from 'https';
import { CoreSignalProfile } from './types';

export interface CoreSignalConfig {
  apiKey: string;
  baseUrl: string;
  maxCollects: number;
  batchSize: number;
  useCache: boolean;
  cacheTTL: number; // hours
}

export class CoreSignalClient {
  private cache: Map<string, any> = new Map();
  private config: CoreSignalConfig;
  private creditsUsed: { search: number; collect: number } = { search: 0, collect: 0 };

  constructor(config: CoreSignalConfig) {
    this['config'] = config;
  }

  /**
   * Get credit usage tracking
   */
  getCreditUsage(): { search: number; collect: number; total: number } {
    return {
      search: this.creditsUsed.search,
      collect: this.creditsUsed.collect,
      total: this.creditsUsed.search + this.creditsUsed.collect
    };
  }

  /**
   * Reset credit tracking
   */
  resetCreditTracking(): void {
    this['creditsUsed'] = { search: 0, collect: 0 };
  }

  /**
   * Search for candidate employee IDs using Elasticsearch DSL
   */
  async searchCandidates(query: any, itemsPerPage: number = 100): Promise<string[]> {
    const cacheKey = `search_${JSON.stringify(query)}_${itemsPerPage}`;
    if (this['config']['useCache'] && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const url = `${this.config.baseUrl}/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=${itemsPerPage}`;
    try {
      const response = await this.makeApiRequest(url, 'POST', query);
      const ids = this.extractIdsFromSearchResponse(response);
      
      if (this.config.useCache) {
        this.cache.set(cacheKey, ids);
      }
      
      return ids;
    } catch (error) {
      console.error("Search failed:", error);
      return [];
    }
  }

  /**
   * Collect detailed profile by ID
   */
  async collectProfile(id: string): Promise<any> {
    const cacheKey = `profile_${id}`;
    if (this['config']['useCache'] && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const url = `${this.config.baseUrl}/cdapi/v2/employee_multi_source/collect/${id}`;
    try {
      const profile = await this.makeApiRequest(url, 'GET');
      
      if (this.config.useCache) {
        this.cache.set(cacheKey, profile);
      }
      
      return profile;
    } catch (error) {
      console.error("Profile collection failed:", error);
      return null;
    }
  }

  /**
   * Get historical headcount data for a company
   */
  async getHistoricalHeadcount(companyId: string): Promise<any[]> {
    const url = `${this.config.baseUrl}/v2/historical_headcount/collect/${companyId}`;
    try {
      const response = await this.makeApiRequest(url, 'GET');
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error("Historical headcount failed for company:", error);
      return [];
    }
  }

  /**
   * Extract employee IDs from various CoreSignal response formats
   */
  private extractIdsFromSearchResponse(response: any): string[] {
    if (response && response['data'] && Array.isArray(response.data)) {
      return response.data.map((item: any) => item.id).filter(Boolean);
    } else if (response && Array.isArray(response)) {
      return response.map((item: any) => item.id).filter(Boolean);
    } else {
      return [];
    }
  }

  /**
   * Make HTTP request to CoreSignal API
   */
  private async makeApiRequest(url: string, method: string, body?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const https = require('https');
      const urlObj = new URL(url);
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: method,
        headers: {
          'User-Agent': 'Adrata-BuyerGroup/1.0'
        }
      };

      if (this.config.apiKey) {
        if (this.config.apiKey.startsWith('Bearer ')) {
          options['headers']['Authorization'] = this.config.apiKey;
        } else {
          options['headers']['apikey'] = this.config.apiKey;
        }
      }

      if (method === 'POST' && body) {
        options['headers']['Content-Type'] = 'application/json';
      }

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', async () => {
          if (res['statusCode'] && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(new Error(`Invalid JSON response: ${data}`));
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Network error: ${error.message}`));
      });

      if (method === 'POST' && body) {
        req.write(JSON.stringify(body));
      }
      
      req.end();
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}