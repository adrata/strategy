/**
 * 🏢 COMPANY ENRICHMENT SERVICE
 * 
 * Standalone service for enriching account/company data using CoreSignal API
 * Independent from buyer group pipeline - can be run separately
 */

import { PrismaClient } from '@prisma/client';
import https from 'https';

export interface CoreSignalConfig {
  apiKey: string;
  baseUrl: string;
  useCache: boolean;
  cacheTTL: number; // hours
}

export interface EnrichmentResult {
  accountId: string;
  success: boolean;
  data?: CompanyEnrichmentData;
  error?: string;
  creditsUsed: number;
}

export interface CompanyEnrichmentData {
  // Core company info
  company_name: string;
  industry: string;
  naics_codes?: string[];
  sic_codes?: string[];
  founded_year?: string;
  
  // Size & Revenue (what we're most interested in!)
  size_range?: string;
  employees_count?: number;
  revenue_annual_range?: {
    annual_revenue_range_from?: number;
    annual_revenue_range_to?: number;
    annual_revenue_range_currency?: string;
  };
  
  // Location
  hq_country?: string;
  hq_region?: string[];
  
  // Growth indicators
  employees_count_change?: {
    current: number;
    change_monthly: number;
    change_monthly_percentage: number;
    change_quarterly: number;
    change_quarterly_percentage: number;
    change_yearly: number;
    change_yearly_percentage: number;
  };
  
  // Leadership changes
  key_executive_departures?: Array<{
    member_full_name: string;
    member_position_title: string;
    departure_date: string;
  }>;
  
  key_executive_arrivals?: Array<{
    member_full_name: string;
    member_position_title: string;
    arrival_date: string;
  }>;
  
  // Hiring activity
  active_job_postings_count?: number;
  active_job_postings_count_change?: {
    current: number;
    change_monthly: number;
    change_monthly_percentage: number;
  };
  
  // Funding
  funding_rounds?: Array<{
    name: string;
    announced_date: string;
    amount_raised: number;
    amount_raised_currency: string;
  }>;
  
  // Reviews/ratings
  employee_reviews_score_aggregated_change?: {
    current: number;
    change_monthly: number;
    change_quarterly: number;
    change_yearly: number;
  };
}

export class CompanyEnrichmentService {
  private config: CoreSignalConfig;
  private prisma: PrismaClient;
  private cache: Map<string, any> = new Map();
  private creditsUsed: number = 0;

  constructor(config: CoreSignalConfig) {
    this['config'] = config;
    this['prisma'] = new PrismaClient();
  }

  /**
   * Enrich a single account by ID from our database
   */
  async enrichAccountById(accountId: string): Promise<EnrichmentResult> {
    try {
      // Get account from database
      const account = await this.prisma.accounts.findFirst({
        where: { id: accountId , deletedAt: null}
      });

      if (!account) {
        return {
          accountId,
          success: false,
          error: 'Account not found',
          creditsUsed: 0
        };
      }

      console.log(`🔍 Enriching account: ${account.name}`);
      
      // Try enriching by website first (most reliable)
      let enrichmentData: CompanyEnrichmentData | null = null;
      
      if (account.website) {
        enrichmentData = await this.enrichByWebsite(account.website);
      }
      
      // Fallback to name search if website fails
      if (!enrichmentData && account.name) {
        enrichmentData = await this.enrichByName(account.name);
      }

      if (!enrichmentData) {
        return {
          accountId,
          success: false,
          error: 'No enrichment data found',
          creditsUsed: this.creditsUsed
        };
      }

      // Update the account with enriched data
      await this.updateAccountWithEnrichment(accountId, enrichmentData);

      return {
        accountId,
        success: true,
        data: enrichmentData,
        creditsUsed: this.creditsUsed
      };

    } catch (error) {
      console.error(`❌ Failed to enrich account ${accountId}:`, error);
      return {
        accountId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        creditsUsed: this.creditsUsed
      };
    }
  }

  /**
   * Enrich multiple accounts in batch
   */
  async enrichAccountsBatch(
    accountIds: string[], 
    options: { 
      maxConcurrent?: number;
      delayMs?: number;
    } = {}
  ): Promise<EnrichmentResult[]> {
    const { maxConcurrent = 5, delayMs = 1000 } = options;
    const results: EnrichmentResult[] = [];
    
    console.log(`🚀 Starting batch enrichment of ${accountIds.length} accounts`);
    console.log(`   Max concurrent: ${maxConcurrent}, Delay: ${delayMs}ms`);
    
    // Process in batches to avoid rate limiting
    for (let i = 0; i < accountIds.length; i += maxConcurrent) {
      const batch = accountIds.slice(i, i + maxConcurrent);
      
      console.log(`📦 Processing batch ${Math.floor(i / maxConcurrent) + 1}/${Math.ceil(accountIds.length / maxConcurrent)} (${batch.length} accounts)`);
      
      const batchPromises = batch.map(accountId => this.enrichAccountById(accountId));
      const batchResults = await Promise.allSettled(batchPromises);
      
      for (const result of batchResults) {
        if (result['status'] === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error('❌ Batch enrichment error:', result.reason);
        }
      }
      
      // Delay between batches
      if (i + maxConcurrent < accountIds.length) {
        console.log(`⏳ Waiting ${delayMs}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    console.log(`✅ Batch enrichment complete: ${results.filter(r => r.success).length}/${results.length} successful`);
    console.log(`💰 Total credits used: ${this.creditsUsed}`);
    
    return results;
  }

  /**
   * Enrich all accounts for a specific workspace/user
   */
  async enrichAccountsForWorkspace(workspaceId: string, userId?: string): Promise<EnrichmentResult[]> {
    try {
      const whereClause: any = { workspaceId };
      if (userId) {
        whereClause['assignedUserId'] = userId;
      }

      const accounts = await this.prisma.accounts.findMany({
        where: whereClause,
        select: { id: true, name: true, website: true }
      });

      console.log(`🏢 Found ${accounts.length} accounts to enrich for workspace: ${workspaceId}`);
      
      if (accounts['length'] === 0) {
        return [];
      }

      const accountIds = accounts.map(a => a.id);
      return await this.enrichAccountsBatch(accountIds);

    } catch (error) {
      console.error('❌ Failed to enrich workspace accounts:', error);
      return [];
    }
  }

  /**
   * Enrich company by website URL (most reliable method)
   */
  private async enrichByWebsite(websiteUrl: string): Promise<CompanyEnrichmentData | null> {
    const cacheKey = `website_${websiteUrl}`;
    
    if (this['config']['useCache'] && this.cache.has(cacheKey)) {
      console.log(`💾 Cache hit for website: ${websiteUrl}`);
      return this.cache.get(cacheKey);
    }

    try {
      // Clean up website URL
      const cleanUrl = this.cleanWebsiteUrl(websiteUrl);
      const encodedUrl = encodeURIComponent(cleanUrl);
      const url = `${this.config.baseUrl}/cdapi/v2/company_multi_source/enrich?website=${encodedUrl}`;
      
      console.log(`🔍 Enriching by website: ${cleanUrl}`);
      const response = await this.makeApiRequest(url, 'GET');
      
      this.creditsUsed += 2; // Company enrichment costs 2 credits
      console.log(`💰 COMPANY ENRICH: +2 credits (Total: ${this.creditsUsed})`);
      
      if (response && this.config.useCache) {
        this.cache.set(cacheKey, response);
      }
      
      return response;
      
    } catch (error) {
      console.warn(`⚠️ Website enrichment failed for ${websiteUrl}:`, error);
      return null;
    }
  }

  /**
   * Enrich company by name search (fallback method)
   */
  private async enrichByName(companyName: string): Promise<CompanyEnrichmentData | null> {
    try {
      // First search for the company
      console.log(`🔍 Searching for company: ${companyName}`);
      const companyIds = await this.searchCompanies(companyName);
      
      if (companyIds['length'] === 0) {
        console.log(`❌ No companies found for: ${companyName}`);
        return null;
      }

      // Get the first (best match) company data
      const companyId = companyIds[0];
      console.log(`📊 Collecting data for company ID: ${companyId}`);
      
      const url = `${this.config.baseUrl}/cdapi/v2/company_multi_source/collect/${companyId}`;
      const response = await this.makeApiRequest(url, 'GET');
      
      this.creditsUsed += 2; // Company collection costs 2 credits
      console.log(`💰 COMPANY COLLECT: +2 credits (Total: ${this.creditsUsed})`);
      
      return response;
      
    } catch (error) {
      console.warn(`⚠️ Name-based enrichment failed for ${companyName}:`, error);
      return null;
    }
  }

  /**
   * Search for companies by name
   */
  private async searchCompanies(companyName: string): Promise<number[]> {
    const url = `${this.config.baseUrl}/cdapi/v2/company_multi_source/search/es_dsl`;
    
    const searchQuery = {
      query: {
        query_string: {
          query: `"${companyName}"`,
          default_field: "company_name",
          default_operator: "and"
        }
      },
      size: 10 // Limit to top 10 matches
    };

    try {
      const response = await this.makeApiRequest(url, 'POST', searchQuery);
      this.creditsUsed += 2; // Company search costs 2 credits
      console.log(`💰 COMPANY SEARCH: +2 credits (Total: ${this.creditsUsed})`);
      
      // Extract company IDs from response
      if (Array.isArray(response)) {
        return response.filter(id => typeof id === 'number');
      }
      
      return [];
      
    } catch (error) {
      console.error('❌ Company search failed:', error);
      return [];
    }
  }

  /**
   * Update account in database with enrichment data
   */
  private async updateAccountWithEnrichment(accountId: string, data: CompanyEnrichmentData): Promise<void> {
    try {
      const updateData: any = {};
      
      // Map CoreSignal data to our account schema
      if (data.industry) {
        updateData['industry'] = data.industry;
      }
      
      if (data.employees_count) {
        updateData['size'] = this.formatEmployeeCount(data.employees_count);
      } else if (data.size_range) {
        updateData['size'] = data.size_range;
      }
      
      // Revenue data (this is what we really want!)
      if (data.revenue_annual_range?.annual_revenue_range_from) {
        const revenueFrom = data.revenue_annual_range.annual_revenue_range_from;
        const revenueTo = data.revenue_annual_range.annual_revenue_range_to;
        const currency = data.revenue_annual_range.annual_revenue_range_currency || 'USD';
        
        // Use the average or lower bound for revenue
        const estimatedRevenue = revenueTo ? (revenueFrom + revenueTo) / 2 : revenueFrom;
        updateData['revenue'] = estimatedRevenue;
        
        console.log(`💰 Setting revenue: ${currency} ${estimatedRevenue.toLocaleString()} (range: ${revenueFrom.toLocaleString()} - ${revenueTo?.toLocaleString() || 'N/A'})`);
      }
      
      if (data.hq_country) {
        updateData['country'] = data.hq_country;
      }
      
      // Store enrichment metadata
      updateData['notes'] = this.buildEnrichmentNotes(data);
      updateData['updatedAt'] = new Date();
      
      await this.prisma.accounts.update({
        where: { id: accountId },
        data: updateData
      });
      
      console.log(`✅ Updated account ${accountId} with enrichment data`);
      
    } catch (error) {
      console.error(`❌ Failed to update account ${accountId}:`, error);
    }
  }

  /**
   * Format employee count into a readable size range
   */
  private formatEmployeeCount(count: number): string {
    if (count <= 10) return '1-10 employees';
    if (count <= 50) return '11-50 employees';
    if (count <= 200) return '51-200 employees';
    if (count <= 500) return '201-500 employees';
    if (count <= 1000) return '501-1000 employees';
    if (count <= 5000) return '1001-5000 employees';
    return '5000+ employees';
  }

  /**
   * Build enrichment notes with key metrics
   */
  private buildEnrichmentNotes(data: CompanyEnrichmentData): string {
    const notes: string[] = [];
    
    if (data.employees_count) {
      notes.push(`Employees: ${data.employees_count.toLocaleString()}`);
    }
    
    if (data.revenue_annual_range) {
      const from = data.revenue_annual_range.annual_revenue_range_from;
      const to = data.revenue_annual_range.annual_revenue_range_to;
      const currency = data.revenue_annual_range.annual_revenue_range_currency || 'USD';
      
      if (from && to) {
        notes.push(`Revenue: ${currency} ${from.toLocaleString()} - ${to.toLocaleString()}`);
      } else if (from) {
        notes.push(`Revenue: ${currency} ${from.toLocaleString()}+`);
      }
    }
    
    if (data.founded_year) {
      notes.push(`Founded: ${data.founded_year}`);
    }
    
    if (data.employees_count_change?.change_yearly_percentage) {
      const change = data.employees_count_change.change_yearly_percentage;
      const direction = change > 0 ? 'growth' : 'decline';
      notes.push(`Headcount ${direction}: ${Math.abs(change).toFixed(1)}% YoY`);
    }
    
    if (data.active_job_postings_count) {
      notes.push(`Active jobs: ${data.active_job_postings_count}`);
    }
    
    notes.push(`Enriched: ${new Date().toISOString().split('T')[0]}`);
    
    return notes.join(' | ');
  }

  /**
   * Clean and normalize website URL
   */
  private cleanWebsiteUrl(url: string): string {
    let cleaned = url.toLowerCase().trim();
    
    // Remove protocol if present
    cleaned = cleaned.replace(/^https?:\/\//, '');
    
    // Remove www if present
    cleaned = cleaned.replace(/^www\./, '');
    
    // Remove trailing slashes and paths
    cleaned = cleaned.split('/')[0];
    
    return cleaned;
  }

  /**
   * Make HTTP request to CoreSignal API
   */
  private async makeApiRequest(url: string, method: 'GET' | 'POST', body?: any): Promise<any> {
    // Use statically imported https module
    
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      
      const options = {
        method,
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Adrata-Enrichment-Service/1.0',
          'apikey': this.config.apiKey
        } as any
      };

      if (method === 'POST' && body) {
        options['headers']['Content-Type'] = 'application/json';
      }

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
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
        reject(error);
      });
      
      if (method === 'POST' && body) {
        req.write(JSON.stringify(body));
      }
      
      req.end();
    });
  }

  /**
   * Get enrichment statistics
   */
  getStats(): {
    creditsUsed: number;
    cacheSize: number;
    cacheKeys: string[];
  } {
    return {
      creditsUsed: this.creditsUsed,
      cacheSize: this.cache.size,
      cacheKeys: Array.from(this.cache.keys())
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Close database connection
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
