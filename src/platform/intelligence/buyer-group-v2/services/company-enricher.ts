/**
 * COMPANY ENRICHER SERVICE
 * 
 * Enriches company data using Coresignal API with multiple search strategies
 * and confidence-based matching
 */

import { prisma } from '@/platform/database/prisma-client';
import type {
  CompanyEnrichmentOptions,
  CompanyEnrichmentResult,
  EnrichedCompanyData
} from '../types';

export class CompanyEnricher {
  private coresignalApiKey: string;
  private delayBetweenRequests = 1000;
  private delayBetweenBatches = 3000;
  private batchSize = 5;

  constructor() {
    this.coresignalApiKey = process.env.CORESIGNAL_API_KEY || '';

    if (!this.coresignalApiKey) {
      throw new Error('CORESIGNAL_API_KEY environment variable is required');
    }
  }

  /**
   * Enrich a single company using multiple search strategies
   */
  async enrichCompany(options: CompanyEnrichmentOptions): Promise<CompanyEnrichmentResult> {
    const { companyId, companyName, website, workspaceId } = options;

    console.log(`🔍 [COMPANY ENRICHER] Enriching company: ${companyName || companyId}`);

    try {
      // Get company from database if ID provided
      let company = null;
      if (companyId && workspaceId) {
        company = await prisma.companies.findFirst({
          where: {
            id: companyId,
            workspaceId,
            deletedAt: null
          }
        });
      }

      const searchName = company?.name || companyName;
      const searchWebsite = company?.website || website;

      if (!searchName && !searchWebsite) {
        throw new Error('Company name or website is required for enrichment');
      }

      // Try multiple search strategies
      const enrichmentData = await this.searchWithMultipleStrategies(searchName, searchWebsite);

      if (!enrichmentData) {
        return {
          success: false,
          message: 'No enrichment data found using any search strategy',
          creditsUsed: { search: 3, collect: 0 }
        };
      }

      // Update company in database if company ID provided
      if (companyId && workspaceId) {
        await this.updateCompanyInDatabase(companyId, enrichmentData);
      }

      return {
        success: true,
        enrichedData: enrichmentData,
        creditsUsed: { search: 3, collect: 0 }
      };

    } catch (error: any) {
      console.error(`❌ [COMPANY ENRICHER] Failed to enrich company:`, error.message);
      return {
        success: false,
        message: error.message,
        creditsUsed: { search: 3, collect: 0 }
      };
    }
  }

  /**
   * Enrich multiple companies in batches
   */
  async enrichCompaniesBatch(options: {
    workspaceId: string;
    companyIds?: string[];
    maxCompanies?: number;
    skipEnriched?: boolean;
  }): Promise<{
    success: boolean;
    processed: number;
    enriched: number;
    failed: number;
    creditsUsed: { search: number; collect: number };
  }> {
    const { workspaceId, companyIds, maxCompanies = 50, skipEnriched = true } = options;

    console.log(`🚀 [COMPANY ENRICHER] Starting batch enrichment for workspace: ${workspaceId}`);

    try {
      // Get companies to process
      const companies = await this.getCompaniesToEnrich(workspaceId, companyIds, maxCompanies, skipEnriched);
      
      console.log(`📊 Found ${companies.length} companies to enrich`);

      if (companies.length === 0) {
        return {
          success: true,
          processed: 0,
          enriched: 0,
          failed: 0,
          creditsUsed: { search: 0, collect: 0 }
        };
      }

      let processed = 0;
      let enriched = 0;
      let failed = 0;
      let totalCreditsUsed = { search: 0, collect: 0 };

      // Process in batches
      const totalBatches = Math.ceil(companies.length / this.batchSize);
      
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startIndex = batchIndex * this.batchSize;
        const endIndex = Math.min(startIndex + this.batchSize, companies.length);
        const batch = companies.slice(startIndex, endIndex);
        
        console.log(`📦 Processing batch ${batchIndex + 1}/${totalBatches} (${batch.length} companies)`);
        
        for (const company of batch) {
          try {
            const result = await this.enrichCompany({
              companyId: company.id,
              companyName: company.name,
              website: company.website,
              workspaceId
            });
            
            processed++;
            if (result.success) {
              enriched++;
            } else {
              failed++;
            }
            
            totalCreditsUsed.search += result.creditsUsed.search;
            totalCreditsUsed.collect += result.creditsUsed.collect;
            
            await this.delay(this.delayBetweenRequests);
            
          } catch (error: any) {
            console.warn(`⚠️ Failed to enrich ${company.name}: ${error.message}`);
            failed++;
          }
        }
        
        if (batchIndex < totalBatches - 1) {
          await this.delay(this.delayBetweenBatches);
        }
      }

      console.log(`✅ Batch enrichment completed: ${enriched} enriched, ${failed} failed`);

      return {
        success: true,
        processed,
        enriched,
        failed,
        creditsUsed: totalCreditsUsed
      };

    } catch (error: any) {
      console.error(`❌ [COMPANY ENRICHER] Batch enrichment failed:`, error.message);
      throw error;
    }
  }

  /**
   * Search using multiple strategies for best match
   */
  private async searchWithMultipleStrategies(companyName?: string, website?: string): Promise<EnrichedCompanyData | null> {
    const strategies = [];

    // Strategy 1: Website exact match (highest confidence)
    if (website) {
      strategies.push({
        name: 'website.exact',
        searchTerm: website,
        confidence: 0.95
      });
    }

    // Strategy 2: Website domain only
    if (website) {
      const domain = this.extractDomain(website);
      if (domain && domain !== website) {
        strategies.push({
          name: 'website.domain_only',
          searchTerm: domain,
          confidence: 0.85
        });
      }
    }

    // Strategy 3: Company name search
    if (companyName) {
      strategies.push({
        name: 'company_name',
        searchTerm: companyName,
        confidence: 0.70
      });
    }

    // Try each strategy in order of confidence
    for (const strategy of strategies) {
      try {
        console.log(`   🔍 Trying strategy: ${strategy.name} with "${strategy.searchTerm}"`);
        
        const result = await this.searchCompany(strategy.searchTerm, strategy.name);
        
        if (result && this.isGoodMatch(result, companyName, website)) {
          console.log(`   ✅ Found good match with ${strategy.name} strategy`);
          return this.formatEnrichedData(result);
        }
        
        await this.delay(500); // Rate limiting
        
      } catch (error: any) {
        console.warn(`   ⚠️ Strategy ${strategy.name} failed: ${error.message}`);
      }
    }

    return null;
  }

  /**
   * Search for company using Coresignal API
   */
  private async searchCompany(searchTerm: string, searchType: string): Promise<any> {
    const searchUrl = 'https://api.coresignal.com/cdapi/v1/linkedin/company/search';
    
    let searchBody: any = {
      search_term: searchTerm,
      page_size: 1,
      page: 1
    };

    // Add search type specific parameters
    if (searchType === 'website.exact') {
      searchBody.website = searchTerm;
    } else if (searchType === 'website.domain_only') {
      searchBody.website = searchTerm;
    } else if (searchType === 'company_name') {
      searchBody.company_name = searchTerm;
    }

    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.coresignalApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchBody)
    });

    if (!response.ok) {
      throw new Error(`Company search failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data?.[0] || null;
  }

  /**
   * Check if search result is a good match
   */
  private isGoodMatch(result: any, companyName?: string, website?: string): boolean {
    if (!result) return false;

    // Check name similarity if company name provided
    if (companyName) {
      const nameSimilarity = this.calculateSimilarity(
        result.name?.toLowerCase() || '',
        companyName.toLowerCase()
      );
      if (nameSimilarity < 0.7) return false;
    }

    // Check website match if website provided
    if (website) {
      const resultWebsite = result.website?.toLowerCase() || '';
      const searchWebsite = website.toLowerCase();
      
      if (resultWebsite !== searchWebsite && 
          !resultWebsite.includes(this.extractDomain(searchWebsite))) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate string similarity (simple implementation)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    }
  }

  /**
   * Format enriched data for storage
   */
  private formatEnrichedData(data: any): EnrichedCompanyData {
    return {
      coresignalId: data.id,
      name: data.name,
      website: data.website,
      industry: data.industry,
      size: data.employee_count?.toString(),
      location: data.location,
      description: data.description,
      foundedYear: data.founded_year,
      revenue: data.revenue,
      linkedinUrl: data.linkedin_url,
      twitterUrl: data.twitter_url,
      facebookUrl: data.facebook_url,
      instagramUrl: data.instagram_url,
      youtubeUrl: data.youtube_url,
      tiktokUrl: data.tiktok_url,
      technologies: data.technologies || [],
      specialties: data.specialties || [],
      headquarters: data.headquarters,
      offices: data.offices || [],
      socialMedia: data.social_media || {},
      customFields: {
        coresignalId: data.id,
        lastEnrichedAt: new Date().toISOString(),
        enrichmentSource: 'coresignal'
      }
    };
  }

  /**
   * Update company in database with enriched data
   */
  private async updateCompanyInDatabase(companyId: string, enrichedData: EnrichedCompanyData): Promise<void> {
    await prisma.companies.update({
      where: { id: companyId },
      data: {
        name: enrichedData.name || undefined,
        website: enrichedData.website || undefined,
        industry: enrichedData.industry || undefined,
        size: enrichedData.size || undefined,
        location: enrichedData.location || undefined,
        description: enrichedData.description || undefined,
        foundedYear: enrichedData.foundedYear || undefined,
        revenue: enrichedData.revenue || undefined,
        linkedinUrl: enrichedData.linkedinUrl || undefined,
        twitterUrl: enrichedData.twitterUrl || undefined,
        facebookUrl: enrichedData.facebookUrl || undefined,
        instagramUrl: enrichedData.instagramUrl || undefined,
        youtubeUrl: enrichedData.youtubeUrl || undefined,
        tiktokUrl: enrichedData.tiktokUrl || undefined,
        technologies: enrichedData.technologies || [],
        specialties: enrichedData.specialties || [],
        headquarters: enrichedData.headquarters || undefined,
        offices: enrichedData.offices || [],
        socialMedia: enrichedData.socialMedia || {},
        customFields: enrichedData.customFields || {}
      }
    });
  }

  /**
   * Get companies that need enrichment
   */
  private async getCompaniesToEnrich(
    workspaceId: string,
    companyIds?: string[],
    maxCompanies?: number,
    skipEnriched?: boolean
  ): Promise<any[]> {
    const where: any = {
      workspaceId,
      deletedAt: null
    };

    // Filter by specific company IDs if provided
    if (companyIds && companyIds.length > 0) {
      where.id = { in: companyIds };
    }

    // Skip already enriched companies if requested
    if (skipEnriched) {
      where.OR = [
        { customFields: { path: ['coresignalId'], equals: null } },
        { customFields: { path: ['coresignalId'], equals: undefined } },
        { customFields: { path: ['coresignalId'], equals: '' } }
      ];
    }

    return await prisma.companies.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: maxCompanies
    });
  }

  /**
   * Check if company is already enriched
   */
  private isCompanyEnriched(company: any): boolean {
    const customFields = company.customFields as any;
    return !!(customFields?.coresignalId);
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
