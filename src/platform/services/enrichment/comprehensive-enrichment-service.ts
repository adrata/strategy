/**
 * 🌟 COMPREHENSIVE COMPANY ENRICHMENT SERVICE
 * 
 * Enriches ALL companies across the entire database (accounts, leads, contacts)
 * with CoreSignal data, featuring strict accuracy validation to ensure data quality
 */

import { PrismaClient } from '@prisma/client';
import https from 'https';
import { AdvancedCompanyMatcher, CompanyMatchRequest } from '../company-matching/advanced-company-matcher';

export interface CoreSignalConfig {
  apiKey: string;
  baseUrl: string;
  useCache: boolean;
  cacheTTL: number; // hours
  strictAccuracy: boolean; // Only apply data if confidence is high
}

export interface CompanyEntity {
  id: string;
  type: 'account' | 'lead' | 'contact';
  name: string;
  website?: string;
  industry?: string;
  currentSize?: string;
  currentRevenue?: number;
  workspaceId: string;
}

export interface EnrichmentResult {
  entityId: string;
  entityType: 'account' | 'lead' | 'contact';
  success: boolean;
  dataApplied: boolean; // Whether data was actually applied (after accuracy checks)
  accuracyScore: number; // 0-1 confidence score
  data?: CoreSignalCompanyData;
  error?: string;
  creditsUsed: number;
  accuracyChecks: {
    nameMatch: boolean;
    websiteMatch: boolean;
    industryConsistent: boolean;
    sizeRealistic: boolean;
    revenueRealistic: boolean;
    overallConfidence: number;
  };
}

export interface CoreSignalCompanyData {
  // Core identifiers
  id?: number;
  company_name: string;
  industry?: string;
  naics_codes?: string[];
  sic_codes?: string[];
  founded_year?: string;
  
  // Size & Revenue (PRIMARY DATA WE WANT)
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
  
  // Growth & Change Metrics
  employees_count_change?: {
    current: number;
    change_monthly: number;
    change_monthly_percentage: number;
    change_quarterly: number;
    change_quarterly_percentage: number;
    change_yearly: number;
    change_yearly_percentage: number;
  };
  
  // Leadership & Hiring
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
  
  active_job_postings_count?: number;
  active_job_postings_count_change?: {
    current: number;
    change_monthly: number;
    change_monthly_percentage: number;
  };
  
  // Financial & Funding
  funding_rounds?: Array<{
    name: string;
    announced_date: string;
    amount_raised: number;
    amount_raised_currency: string;
  }>;
  
  acquisition_list_source_1?: Array<{
    acquiree_name: string;
    announced_date: string;
    price: string;
    currency: string;
  }>;
  
  // Reputation & Reviews
  employee_reviews_score_aggregated_change?: {
    current: number;
    change_monthly: number;
    change_quarterly: number;
    change_yearly: number;
  };
  
  product_reviews_score_change?: {
    current: number;
    change_monthly: number;
    change_quarterly: number;
    change_yearly: number;
  };
}

export class ComprehensiveEnrichmentService {
  private config: CoreSignalConfig;
  private prisma: PrismaClient;
  private cache: Map<string, any> = new Map();
  private companyMatcher: AdvancedCompanyMatcher;
  private creditsUsed: number = 0;
  private enrichmentStats = {
    totalProcessed: 0,
    successful: 0,
    dataApplied: 0,
    accuracyRejected: 0,
    errors: 0
  };

  constructor(config: CoreSignalConfig) {
    this['config'] = config;
    this['prisma'] = new PrismaClient();
    this['companyMatcher'] = new AdvancedCompanyMatcher(this.prisma, config.apiKey);
  }

  /**
   * 🌟 MAIN METHOD: Enrich all companies across the entire database
   */
  async enrichAllCompanies(options: {
    workspaceId?: string;
    maxEntities?: number;
    batchSize?: number;
    delayMs?: number;
    dryRun?: boolean;
  } = {}): Promise<{
    results: EnrichmentResult[];
    stats: typeof this.enrichmentStats;
    creditsUsed: number;
  }> {
    const {
      workspaceId,
      maxEntities = 1000,
      batchSize = 5,
      delayMs = 2000,
      dryRun = false
    } = options;

    console.log('🌟 COMPREHENSIVE COMPANY ENRICHMENT STARTING');
    console.log('============================================');
    console.log(`📊 Max entities: ${maxEntities}`);
    console.log(`📦 Batch size: ${batchSize}`);
    console.log(`⏱️ Delay: ${delayMs}ms`);
    console.log(`🧪 Dry run: ${dryRun}`);
    console.log(`🏢 Workspace filter: ${workspaceId || 'ALL'}`);
    console.log(`🎯 Strict accuracy: ${this.config.strictAccuracy}`);

    // Reset stats
    this['enrichmentStats'] = {
      totalProcessed: 0,
      successful: 0,
      dataApplied: 0,
      accuracyRejected: 0,
      errors: 0
    };

    // Get all companies from all tables
    const allCompanies = await this.getAllCompanies(workspaceId, maxEntities);
    console.log(`🔍 Found ${allCompanies.length} unique companies to enrich`);

    if (allCompanies['length'] === 0) {
      return { results: [], stats: this.enrichmentStats, creditsUsed: 0 };
    }

    // Process in batches
    const results: EnrichmentResult[] = [];
    
    for (let i = 0; i < allCompanies.length; i += batchSize) {
      const batch = allCompanies.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(allCompanies.length / batchSize);
      
      console.log(`\n📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} companies)`);
      
      const batchPromises = batch.map(company => 
        this.enrichSingleCompany(company, dryRun)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      for (const result of batchResults) {
        if (result['status'] === 'fulfilled') {
          results.push(result.value);
          this.updateStats(result.value);
        } else {
          console.error('❌ Batch error:', result.reason);
          this.enrichmentStats.errors++;
        }
      }
      
      // Progress update
      console.log(`📊 Progress: ${results.length}/${allCompanies.length} processed, ${this.enrichmentStats.dataApplied} enriched`);
      
      // Delay between batches
      if (i + batchSize < allCompanies.length) {
        console.log(`⏳ Waiting ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    // Final summary
    console.log('\n✅ ENRICHMENT COMPLETE!');
    console.log('=======================');
    console.log(`📊 Total processed: ${this.enrichmentStats.totalProcessed}`);
    console.log(`✅ Successful API calls: ${this.enrichmentStats.successful}`);
    console.log(`🎯 Data applied: ${this.enrichmentStats.dataApplied}`);
    console.log(`🚫 Accuracy rejected: ${this.enrichmentStats.accuracyRejected}`);
    console.log(`❌ Errors: ${this.enrichmentStats.errors}`);
    console.log(`💰 Credits used: ${this.creditsUsed}`);
    console.log(`📈 Success rate: ${((this.enrichmentStats.dataApplied / this.enrichmentStats.totalProcessed) * 100).toFixed(1)}%`);

    return {
      results,
      stats: this.enrichmentStats,
      creditsUsed: this.creditsUsed
    };
  }

  /**
   * Get all unique companies from accounts, leads, and contacts
   */
  private async getAllCompanies(workspaceId?: string, maxEntities?: number): Promise<CompanyEntity[]> {
    const whereClause = workspaceId ? { workspaceId } : {};
    const companies: Map<string, CompanyEntity> = new Map();

    // Get from Accounts
    const accounts = await this.prisma.accounts.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        website: true,
        industry: true,
        size: true,
        revenue: true,
        workspaceId: true
      },
      take: maxEntities
    });

    accounts.forEach(account => {
      if (account['name'] && account.name.trim()) {
        const key = this.normalizeCompanyName(account.name);
        if (!companies.has(key)) {
          companies.set(key, {
            id: account.id,
            type: 'account',
            name: account.name,
            website: account.website || undefined,
            industry: account.industry || undefined,
            currentSize: account.size || undefined,
            currentRevenue: account.revenue || undefined,
            workspaceId: account.workspaceId
          });
        }
      }
    });

    // Get from Leads
    const leads = await this.prisma.leads.findMany({
      where: whereClause,
      select: {
        id: true,
        company: true,
        website: true,
        industry: true,
        companySize: true,
        workspaceId: true
      },
      take: maxEntities
    });

    leads.forEach(lead => {
      if (lead['company'] && lead.company.trim()) {
        const key = this.normalizeCompanyName(lead.company);
        if (!companies.has(key)) {
          companies.set(key, {
            id: lead.id,
            type: 'lead',
            name: lead.company,
            website: lead.website || undefined,
            industry: lead.industry || undefined,
            currentSize: lead.companySize || undefined,
            workspaceId: lead.workspaceId
          });
        }
      }
    });

    // Get from Contacts (via their accounts)
    const contacts = await this.prisma.contacts.findMany({
      where: whereClause,
      include: {
        account: {
          select: {
            name: true,
            website: true,
            industry: true,
            size: true,
            revenue: true
          }
        }
      },
      take: maxEntities
    });

    contacts.forEach(contact => {
      if (contact.account?.name && contact.account.name.trim()) {
        const key = this.normalizeCompanyName(contact.account.name);
        if (!companies.has(key)) {
          companies.set(key, {
            id: contact.id,
            type: 'contact',
            name: contact.account.name,
            website: contact.account.website || undefined,
            industry: contact.account.industry || undefined,
            currentSize: contact.account.size || undefined,
            currentRevenue: contact.account.revenue || undefined,
            workspaceId: contact.workspaceId
          });
        }
      }
    });

    return Array.from(companies.values());
  }

  /**
   * Enrich a single company with strict accuracy validation
   */
  private async enrichSingleCompany(company: CompanyEntity, dryRun: boolean): Promise<EnrichmentResult> {
    console.log(`🔍 Enriching: ${company.name} (${company.type})`);

    const result: EnrichmentResult = {
      entityId: company.id,
      entityType: company.type,
      success: false,
      dataApplied: false,
      accuracyScore: 0,
      creditsUsed: 0,
      accuracyChecks: {
        nameMatch: false,
        websiteMatch: false,
        industryConsistent: false,
        sizeRealistic: false,
        revenueRealistic: false,
        overallConfidence: 0
      }
    };

    try {
      // ENHANCED: Use advanced company matcher first
      let enrichmentData: CoreSignalCompanyData | null = null;
      
      // Try advanced company matching for better accuracy
      const matchResult = await this.companyMatcher.enhanceExistingCompanyData(
        company.id,
        company.name,
        company.website
      );
      
      if (matchResult && matchResult.confidence >= 80) {
        console.log(`🎯 Advanced matcher found high-confidence match: ${matchResult.name} (${matchResult.confidence}%)`);
        
        // Use the matched company data for enrichment
        if (matchResult['source'] === 'coresignal') {
          // Already have CoreSignal data
          enrichmentData = matchResult.metadata as any;
          result.creditsUsed += 1;
        } else if (matchResult.domain) {
          // Use the matched domain for enrichment
          enrichmentData = await this.enrichByWebsite(matchResult.domain);
          if (enrichmentData) {
            result.creditsUsed += 2;
          }
        }
      }
      
      // Fallback to original logic
      if (!enrichmentData && company.website) {
        enrichmentData = await this.enrichByWebsite(company.website);
        if (enrichmentData) {
          result.creditsUsed += 2;
        }
      }
      
      // Final fallback to name search
      if (!enrichmentData) {
        enrichmentData = await this.enrichByName(company.name);
        if (enrichmentData) {
          result.creditsUsed += 4; // Search + collect
        }
      }

      if (!enrichmentData) {
        result['error'] = 'No enrichment data found';
        return result;
      }

      result['success'] = true;
      result['data'] = enrichmentData;

      // CRITICAL: Validate data accuracy before applying
      result['accuracyChecks'] = this.validateDataAccuracy(company, enrichmentData);
      result['accuracyScore'] = result.accuracyChecks.overallConfidence;

      // Only apply data if accuracy is high enough
      const minAccuracy = this.config.strictAccuracy ? 0.7 : 0.5;
      
      if (result.accuracyScore >= minAccuracy && !dryRun) {
        await this.applyEnrichmentData(company, enrichmentData);
        result['dataApplied'] = true;
        console.log(`✅ Applied enrichment data (accuracy: ${(result.accuracyScore * 100).toFixed(1)}%)`);
      } else if (result.accuracyScore < minAccuracy) {
        console.log(`🚫 Rejected due to low accuracy: ${(result.accuracyScore * 100).toFixed(1)}% < ${(minAccuracy * 100).toFixed(1)}%`);
      } else {
        console.log(`🧪 Dry run - would apply data (accuracy: ${(result.accuracyScore * 100).toFixed(1)}%)`);
      }

    } catch (error) {
      result['error'] = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Enrichment failed for ${company.name}:`, error);
    }

    return result;
  }

  /**
   * 🎯 STRICT ACCURACY VALIDATION
   * Ensures we only apply high-quality, accurate data
   */
  private validateDataAccuracy(company: CompanyEntity, data: CoreSignalCompanyData): EnrichmentResult['accuracyChecks'] {
    const checks = {
      nameMatch: false,
      websiteMatch: false,
      industryConsistent: false,
      sizeRealistic: false,
      revenueRealistic: false,
      overallConfidence: 0
    };

    // 1. Company name similarity check
    const nameSimilarity = this.calculateNameSimilarity(company.name, data.company_name);
    checks['nameMatch'] = nameSimilarity > 0.8;

    // 2. Website match (if available)
    if (company['website'] && data.company_name) {
      // Extract domain and check if it relates to company name
      const domain = this.extractDomain(company.website);
      const nameTokens = company.name.toLowerCase().split(/\s+/);
      checks['websiteMatch'] = nameTokens.some(token => 
        token.length > 3 && domain.includes(token)
      );
    } else {
      checks['websiteMatch'] = true; // Neutral if no website
    }

    // 3. Industry consistency check
    if (company['industry'] && data.industry) {
      const industryMatch = this.checkIndustryConsistency(company.industry, data.industry);
      checks['industryConsistent'] = industryMatch;
    } else {
      checks['industryConsistent'] = true; // Neutral if no existing industry
    }

    // 4. Size realism check
    if (data.employees_count) {
      checks['sizeRealistic'] = this.validateEmployeeCount(data.employees_count);
    } else {
      checks['sizeRealistic'] = true; // Neutral if no size data
    }

    // 5. Revenue realism check
    if (data.revenue_annual_range?.annual_revenue_range_from) {
      const revenue = data.revenue_annual_range.annual_revenue_range_from;
      const employees = data.employees_count || 100; // Assume 100 if unknown
      checks['revenueRealistic'] = this.validateRevenueToEmployee(revenue, employees);
    } else {
      checks['revenueRealistic'] = true; // Neutral if no revenue data
    }

    // Calculate overall confidence score
    const weights = {
      nameMatch: 0.4,        // Most important
      websiteMatch: 0.2,     // Very important if available
      industryConsistent: 0.2, // Important for context
      sizeRealistic: 0.1,    // Basic sanity check
      revenueRealistic: 0.1  // Basic sanity check
    };

    checks['overallConfidence'] = Object.entries(weights).reduce((score, [check, weight]) => {
      return score + (checks[check as keyof typeof checks] ? weight : 0);
    }, 0);

    return checks;
  }

  /**
   * Apply enrichment data to the appropriate database table
   */
  private async applyEnrichmentData(company: CompanyEntity, data: CoreSignalCompanyData): Promise<void> {
    const updateData: any = {};

    // Map CoreSignal data to our schema
    if (data['industry'] && data.industry !== company.industry) {
      updateData['industry'] = data.industry;
    }

    // Employee count and size
    if (data.employees_count) {
      const sizeRange = this.formatEmployeeCount(data.employees_count);
      if (company['type'] === 'account') {
        updateData['size'] = sizeRange;
      } else if (company['type'] === 'lead') {
        updateData['companySize'] = sizeRange;
      }
    }

    // Revenue data
    if (data.revenue_annual_range?.annual_revenue_range_from) {
      const revenue = data.revenue_annual_range.annual_revenue_range_from;
      const revenueTo = data.revenue_annual_range.annual_revenue_range_to;
      
      // Use average if we have a range, otherwise use the minimum
      const estimatedRevenue = revenueTo ? (revenue + revenueTo) / 2 : revenue;
      
      if (company['type'] === 'account') {
        updateData['revenue'] = estimatedRevenue;
      }
    }

    // Location data
    if (data['hq_country'] && company['type'] === 'account') {
      updateData['country'] = data.hq_country;
    }

    // Enhanced notes with enrichment metadata
    const enrichmentNotes = this.buildEnrichmentNotes(data);
    if (company['type'] === 'account') {
      updateData['notes'] = enrichmentNotes;
    }

    // Update timestamp
    updateData['updatedAt'] = new Date();

    // Apply to appropriate table
    if (Object.keys(updateData).length > 0) {
      switch (company.type) {
        case 'account':
          await this.prisma.accounts.update({
            where: { id: company.id },
            data: updateData
          });
          break;
        case 'lead':
          // Only update fields that exist in Lead schema
          const leadUpdateData: any = {};
          if (updateData.industry) leadUpdateData['industry'] = updateData.industry;
          if (updateData.companySize) leadUpdateData['companySize'] = updateData.companySize;
          if (updateData.updatedAt) leadUpdateData['updatedAt'] = updateData.updatedAt;
          
          if (Object.keys(leadUpdateData).length > 0) {
            await this.prisma.leads.update({
              where: { id: company.id },
              data: leadUpdateData
            });
          }
          break;
        case 'contact':
          // Update the associated account if it exists
          const contact = await this.prisma.contacts.findFirst({
            where: { id: company.id , deletedAt: null},
            include: { account: true }
          });
          
          if (contact?.account) {
            await this.prisma.accounts.update({
              where: { id: contact.account.id },
              data: updateData
            });
          }
          break;
      }
    }
  }

  // Utility methods for data validation and processing

  private calculateNameSimilarity(name1: string, name2: string): number {
    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    const n1 = normalize(name1);
    const n2 = normalize(name2);
    
    if (n1 === n2) return 1.0;
    
    // Check if one is contained in the other
    if (n1.includes(n2) || n2.includes(n1)) return 0.9;
    
    // Simple token overlap
    const tokens1 = name1.toLowerCase().split(/\s+/);
    const tokens2 = name2.toLowerCase().split(/\s+/);
    
    const overlap = tokens1.filter(token => 
      tokens2.some(t2 => t2.includes(token) || token.includes(t2))
    ).length;
    
    return overlap / Math.max(tokens1.length, tokens2.length);
  }

  private extractDomain(url: string): string {
    try {
      return url.toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0];
    } catch {
      return url.toLowerCase();
    }
  }

  private checkIndustryConsistency(industry1: string, industry2: string): boolean {
    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z]/g, '');
    const i1 = normalize(industry1);
    const i2 = normalize(industry2);
    
    // Direct match
    if (i1 === i2) return true;
    
    // Common industry mappings
    const industryMappings = {
      'technology': ['tech', 'software', 'it', 'computer'],
      'retail': ['store', 'merchandise', 'sales'],
      'healthcare': ['medical', 'health', 'hospital'],
      'finance': ['financial', 'bank', 'investment'],
      'manufacturing': ['industrial', 'factory', 'production']
    };
    
    for (const [category, keywords] of Object.entries(industryMappings)) {
      const matchesCategory1 = keywords.some(kw => i1.includes(kw)) || i1.includes(category);
      const matchesCategory2 = keywords.some(kw => i2.includes(kw)) || i2.includes(category);
      
      if (matchesCategory1 && matchesCategory2) return true;
    }
    
    return false;
  }

  private validateEmployeeCount(count: number): boolean {
    // Basic sanity checks
    return count > 0 && count < 10000000; // Between 1 and 10M employees
  }

  private validateRevenueToEmployee(revenue: number, employees: number): boolean {
    const revenuePerEmployee = revenue / employees;
    
    // Realistic range: $10K to $10M per employee annually
    return revenuePerEmployee >= 10000 && revenuePerEmployee <= 10000000;
  }

  private normalizeCompanyName(name: string): string {
    return name.toLowerCase()
      .replace(/\b(inc|corp|corporation|ltd|limited|llc|co|company)\b/g, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
  }

  private formatEmployeeCount(count: number): string {
    if (count <= 10) return '1-10 employees';
    if (count <= 50) return '11-50 employees';
    if (count <= 200) return '51-200 employees';
    if (count <= 500) return '201-500 employees';
    if (count <= 1000) return '501-1000 employees';
    if (count <= 5000) return '1001-5000 employees';
    return '5000+ employees';
  }

  private buildEnrichmentNotes(data: CoreSignalCompanyData): string {
    const notes: string[] = [];
    
    if (data.employees_count) {
      notes.push(`Employees: ${data.employees_count.toLocaleString()}`);
    }
    
    if (data.revenue_annual_range?.annual_revenue_range_from) {
      const from = data.revenue_annual_range.annual_revenue_range_from;
      const to = data.revenue_annual_range.annual_revenue_range_to;
      const currency = data.revenue_annual_range.annual_revenue_range_currency || 'USD';
      
      if (from && to) {
        notes.push(`Revenue: ${currency} ${from.toLocaleString()} - ${to.toLocaleString()}`);
      } else {
        notes.push(`Revenue: ${currency} ${from.toLocaleString()}+`);
      }
    }
    
    if (data.founded_year) {
      notes.push(`Founded: ${data.founded_year}`);
    }
    
    if (data.employees_count_change?.change_yearly_percentage) {
      const change = data.employees_count_change.change_yearly_percentage;
      notes.push(`Growth: ${change > 0 ? '+' : ''}${change.toFixed(1)}% YoY`);
    }
    
    if (data.active_job_postings_count) {
      notes.push(`Jobs: ${data.active_job_postings_count}`);
    }
    
    notes.push(`CoreSignal enriched: ${new Date().toISOString().split('T')[0]}`);
    
    return notes.join(' | ');
  }

  // API methods (similar to previous service)
  
  private async enrichByWebsite(websiteUrl: string): Promise<CoreSignalCompanyData | null> {
    const cacheKey = `website_${websiteUrl}`;
    
    if (this['config']['useCache'] && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const cleanUrl = this.cleanWebsiteUrl(websiteUrl);
      const encodedUrl = encodeURIComponent(cleanUrl);
      const url = `${this.config.baseUrl}/cdapi/v2/company_multi_source/enrich?website=${encodedUrl}`;
      
      const response = await this.makeApiRequest(url, 'GET');
      this.creditsUsed += 2;
      
      if (response && this.config.useCache) {
        this.cache.set(cacheKey, response);
      }
      
      return response;
    } catch (error) {
      console.warn(`⚠️ Website enrichment failed for ${websiteUrl}:`, error);
      return null;
    }
  }

  private async enrichByName(companyName: string): Promise<CoreSignalCompanyData | null> {
    try {
      const companyIds = await this.searchCompanies(companyName);
      
      if (companyIds['length'] === 0) {
        return null;
      }

      const companyId = companyIds[0];
      const url = `${this.config.baseUrl}/cdapi/v2/company_multi_source/collect/${companyId}`;
      const response = await this.makeApiRequest(url, 'GET');
      
      this.creditsUsed += 2;
      return response;
    } catch (error) {
      console.warn(`⚠️ Name-based enrichment failed for ${companyName}:`, error);
      return null;
    }
  }

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
      size: 5
    };

    try {
      const response = await this.makeApiRequest(url, 'POST', searchQuery);
      this.creditsUsed += 2;
      
      if (Array.isArray(response)) {
        return response.filter(id => typeof id === 'number');
      }
      
      return [];
    } catch (error) {
      console.error('❌ Company search failed:', error);
      return [];
    }
  }

  private cleanWebsiteUrl(url: string): string {
    return url.toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];
  }

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
          'User-Agent': 'Adrata-Comprehensive-Enrichment/1.0',
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

      req.on('error', reject);
      
      if (method === 'POST' && body) {
        req.write(JSON.stringify(body));
      }
      
      req.end();
    });
  }

  private updateStats(result: EnrichmentResult): void {
    this.enrichmentStats.totalProcessed++;
    
    if (result.success) {
      this.enrichmentStats.successful++;
    } else {
      this.enrichmentStats.errors++;
    }
    
    if (result.dataApplied) {
      this.enrichmentStats.dataApplied++;
    } else if (result['success'] && !result['dataApplied'] && result.accuracyScore < 0.7) {
      this.enrichmentStats.accuracyRejected++;
    }
  }

  /**
   * Get comprehensive statistics
   */
  getStats() {
    return {
      ...this.enrichmentStats,
      creditsUsed: this.creditsUsed,
      cacheSize: this.cache.size,
      accuracy: {
        successRate: this.enrichmentStats.totalProcessed > 0 
          ? (this.enrichmentStats.dataApplied / this.enrichmentStats.totalProcessed) 
          : 0,
        rejectionRate: this.enrichmentStats.totalProcessed > 0 
          ? (this.enrichmentStats.accuracyRejected / this.enrichmentStats.totalProcessed) 
          : 0
      }
    };
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
