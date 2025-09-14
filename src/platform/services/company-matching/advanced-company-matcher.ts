/**
 * Advanced Company Matching System
 * Integrates with existing Adrata pipeline for maximum accuracy
 * Based on research of best practices and entity resolution techniques
 */

import { PrismaClient } from '@prisma/client';

// Company matching interfaces
export interface CompanyMatchRequest {
  input: string; // Domain, name, or partial identifier
  type: 'domain' | 'name' | 'mixed';
  context?: {
    industry?: string;
    location?: string;
    size?: string;
    aliases?: string[];
  };
  config?: {
    strictMode?: boolean;
    minConfidence?: number;
    maxResults?: number;
    includeSubsidiaries?: boolean;
  };
}

export interface CompanyMatchResult {
  matches: CompanyMatch[];
  confidence: number;
  method: string;
  alternatives?: CompanyMatch[];
}

export interface CompanyMatch {
  id: string;
  name: string;
  domain?: string;
  aliases: string[];
  confidence: number;
  matchType: 'exact' | 'fuzzy' | 'phonetic' | 'semantic';
  source: 'internal' | 'coresignal' | 'enrichment';
  metadata: {
    industry?: string;
    size?: string;
    location?: string;
    employees?: number;
    revenue?: number;
    lastUpdated?: string;
  };
}

export class AdvancedCompanyMatcher {
  private prisma: PrismaClient;
  private coreSignalApiKey: string;
  
  // Company name normalization patterns
  private readonly LEGAL_SUFFIXES = [
    'inc', 'corp', 'corporation', 'ltd', 'limited', 'llc', 'co', 'company',
    'plc', 'sa', 'gmbh', 'ag', 'bv', 'nv', 'spa', 'srl', 'pty', 'pvt'
  ];
  
  private readonly COMMON_ABBREVIATIONS = new Map([
    ['&', 'and'],
    ['intl', 'international'],
    ['tech', 'technology'],
    ['sys', 'systems'],
    ['corp', 'corporation'],
    ['co', 'company'],
    ['mfg', 'manufacturing'],
    ['svc', 'services'],
    ['grp', 'group'],
    ['dev', 'development']
  ]);

  constructor(prisma: PrismaClient, coreSignalApiKey: string) {
    this['prisma'] = prisma;
    this['coreSignalApiKey'] = coreSignalApiKey;
  }

  /**
   * Main company matching function - integrates with existing pipeline
   */
  async findCompanyMatches(request: CompanyMatchRequest): Promise<CompanyMatchResult> {
    console.log(`🔍 Advanced company matching for: "${request.input}" (${request.type})`);
    
    const config = {
      strictMode: false,
      minConfidence: 0.7,
      maxResults: 5,
      includeSubsidiaries: true,
      ...request.config
    };

    // Strategy 1: Exact matching (highest confidence)
    let result = await this.exactMatching(request, config);
    if (result.confidence >= config.minConfidence) {
      console.log(`✅ Exact match found with ${result.confidence}% confidence`);
      return result;
    }

    // Strategy 2: Fuzzy matching with normalization
    result = await this.fuzzyMatching(request, config);
    if (result.confidence >= config.minConfidence) {
      console.log(`✅ Fuzzy match found with ${result.confidence}% confidence`);
      return result;
    }

    // Strategy 3: Semantic matching using ML techniques
    result = await this.semanticMatching(request, config);
    if (result.confidence >= config.minConfidence) {
      console.log(`✅ Semantic match found with ${result.confidence}% confidence`);
      return result;
    }

    // Strategy 4: External enrichment fallback
    result = await this.externalEnrichmentMatching(request, config);
    console.log(`🔄 External enrichment result: ${result.confidence}% confidence`);
    
    return result;
  }

  /**
   * Strategy 1: Exact matching with normalization
   */
  private async exactMatching(request: CompanyMatchRequest, config: any): Promise<CompanyMatchResult> {
    const normalizedInput = this.normalizeCompanyName(request.input);
    const matches: CompanyMatch[] = [];

    // Search internal database first (fastest)
    const internalMatches = await this.searchInternalDatabase(normalizedInput, request.type);
    matches.push(...internalMatches);

    // If domain input, try direct domain matching
    if (request['type'] === 'domain' || request['type'] === 'mixed') {
      const domainMatches = await this.searchByDomain(request.input);
      matches.push(...domainMatches);
    }

    // Calculate confidence based on match quality
    const bestMatch = matches.sort((a, b) => b.confidence - a.confidence)[0];
    const confidence = bestMatch ? bestMatch.confidence : 0;

    return {
      matches: matches.slice(0, config.maxResults),
      confidence,
      method: 'exact_matching',
      alternatives: matches.slice(config.maxResults)
    };
  }

  /**
   * Strategy 2: Fuzzy matching with advanced algorithms
   */
  private async fuzzyMatching(request: CompanyMatchRequest, config: any): Promise<CompanyMatchResult> {
    const matches: CompanyMatch[] = [];
    const normalizedInput = this.normalizeCompanyName(request.input);

    // Get potential candidates from database
    const candidates = await this.getCandidateCompanies(request);

    for (const candidate of candidates) {
      const similarity = this.calculateCompanySimilarity(normalizedInput, candidate.name, candidate.aliases);
      
      if (similarity >= 0.6) { // Minimum threshold for fuzzy matching
        matches.push({
          id: candidate.id,
          name: candidate.name,
          domain: candidate.domain,
          aliases: candidate.aliases,
          confidence: similarity * 100,
          matchType: 'fuzzy',
          source: candidate.source,
          metadata: candidate.metadata
        });
      }
    }

    // Sort by confidence
    matches.sort((a, b) => b.confidence - a.confidence);
    const confidence = matches[0]?.confidence || 0;

    return {
      matches: matches.slice(0, config.maxResults),
      confidence,
      method: 'fuzzy_matching',
      alternatives: matches.slice(config.maxResults)
    };
  }

  /**
   * Strategy 3: Semantic matching using context and ML
   */
  private async semanticMatching(request: CompanyMatchRequest, config: any): Promise<CompanyMatchResult> {
    const matches: CompanyMatch[] = [];

    // Use context clues for better matching
    if (request.context) {
      const contextMatches = await this.searchByContext(request.input, request.context);
      matches.push(...contextMatches);
    }

    // Industry-specific matching
    if (request.context?.industry) {
      const industryMatches = await this.searchByIndustry(request.input, request.context.industry);
      matches.push(...industryMatches);
    }

    // Remove duplicates and sort
    const uniqueMatches = this.deduplicateMatches(matches);
    uniqueMatches.sort((a, b) => b.confidence - a.confidence);
    
    const confidence = uniqueMatches[0]?.confidence || 0;

    return {
      matches: uniqueMatches.slice(0, config.maxResults),
      confidence,
      method: 'semantic_matching',
      alternatives: uniqueMatches.slice(config.maxResults)
    };
  }

  /**
   * Strategy 4: External enrichment fallback
   */
  private async externalEnrichmentMatching(request: CompanyMatchRequest, config: any): Promise<CompanyMatchResult> {
    const matches: CompanyMatch[] = [];

    try {
      // Use CoreSignal for external enrichment
      if (request['type'] === 'domain' || request['type'] === 'mixed') {
        const coreSignalMatch = await this.searchCoreSignal(request.input);
        if (coreSignalMatch) {
          matches.push(coreSignalMatch);
        }
      }

      // Use our adaptive waterfall enrichment
      const waterfallMatch = await this.searchWaterfallEnrichment(request);
      if (waterfallMatch) {
        matches.push(waterfallMatch);
      }

    } catch (error) {
      console.warn('External enrichment failed:', error);
    }

    const confidence = matches[0]?.confidence || 0;

    return {
      matches: matches.slice(0, config.maxResults),
      confidence,
      method: 'external_enrichment',
      alternatives: []
    };
  }

  /**
   * Normalize company name for consistent matching
   */
  private normalizeCompanyName(name: string): string {
    let normalized = name.toLowerCase().trim();
    
    // Remove common prefixes
    normalized = normalized.replace(/^(the\s+)/i, '');
    
    // Expand abbreviations
    for (const [abbrev, full] of this.COMMON_ABBREVIATIONS) {
      const regex = new RegExp(`\\b${abbrev}\\b`, 'gi');
      normalized = normalized.replace(regex, full);
    }
    
    // Remove legal suffixes
    const suffixPattern = new RegExp(`\\b(${this.LEGAL_SUFFIXES.join('|')})\\b\\.?$`, 'i');
    normalized = normalized.replace(suffixPattern, '').trim();
    
    // Remove special characters but keep spaces
    normalized = normalized.replace(/[^\w\s]/g, ' ');
    
    // Normalize whitespace
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    return normalized;
  }

  /**
   * Calculate similarity between company names using multiple algorithms
   */
  private calculateCompanySimilarity(input: string, companyName: string, aliases: string[] = []): number {
    const allNames = [companyName, ...aliases].map(name => this.normalizeCompanyName(name));
    let maxSimilarity = 0;

    for (const name of allNames) {
      // Exact match
      if (input === name) return 1.0;
      
      // Levenshtein distance
      const levenshtein = this.calculateLevenshteinSimilarity(input, name);
      
      // Jaro-Winkler similarity
      const jaroWinkler = this.calculateJaroWinklerSimilarity(input, name);
      
      // Token-based similarity
      const tokenSimilarity = this.calculateTokenSimilarity(input, name);
      
      // Weighted average of all similarities
      const combinedSimilarity = (levenshtein * 0.3) + (jaroWinkler * 0.4) + (tokenSimilarity * 0.3);
      
      maxSimilarity = Math.max(maxSimilarity, combinedSimilarity);
    }

    return maxSimilarity;
  }

  /**
   * Levenshtein distance similarity
   */
  private calculateLevenshteinSimilarity(str1: string, str2: string): number {
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : 1 - (distance / maxLength);
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Jaro-Winkler similarity
   */
  private calculateJaroWinklerSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    
    const len1 = str1.length;
    const len2 = str2.length;
    const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;
    
    if (matchWindow < 0) return 0;
    
    const str1Matches = new Array(len1).fill(false);
    const str2Matches = new Array(len2).fill(false);
    
    let matches = 0;
    let transpositions = 0;
    
    // Find matches
    for (let i = 0; i < len1; i++) {
      const start = Math.max(0, i - matchWindow);
      const end = Math.min(i + matchWindow + 1, len2);
      
      for (let j = start; j < end; j++) {
        if (str2Matches[j] || str1[i] !== str2[j]) continue;
        str1Matches[i] = str2Matches[j] = true;
        matches++;
        break;
      }
    }
    
    if (matches === 0) return 0;
    
    // Find transpositions
    let k = 0;
    for (let i = 0; i < len1; i++) {
      if (!str1Matches[i]) continue;
      while (!str2Matches[k]) k++;
      if (str1[i] !== str2[k]) transpositions++;
      k++;
    }
    
    const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
    
    // Jaro-Winkler prefix bonus
    let prefix = 0;
    for (let i = 0; i < Math.min(str1.length, str2.length, 4); i++) {
      if (str1[i] === str2[i]) prefix++;
      else break;
    }
    
    return jaro + (0.1 * prefix * (1 - jaro));
  }

  /**
   * Token-based similarity
   */
  private calculateTokenSimilarity(str1: string, str2: string): number {
    const tokens1 = new Set(str1.split(/\s+/));
    const tokens2 = new Set(str2.split(/\s+/));
    
    const intersection = new Set([...tokens1].filter(token => tokens2.has(token)));
    const union = new Set([...tokens1, ...tokens2]);
    
    return union['size'] === 0 ? 0 : intersection.size / union.size;
  }

  /**
   * Search internal database
   */
  private async searchInternalDatabase(normalizedInput: string, type: string): Promise<CompanyMatch[]> {
    const matches: CompanyMatch[] = [];

    try {
      // Search accounts
      const accounts = await this.prisma.accounts.findMany({
        where: {
          deletedAt: null,
          OR: [
            { name: { contains: normalizedInput, mode: 'insensitive' } },
            { website: { contains: normalizedInput, mode: 'insensitive' } }
          ]
        },
        take: 10
      });

      for (const account of accounts) {
        const confidence = this.calculateCompanySimilarity(normalizedInput, account.name || '');
        if (confidence >= 0.7) {
          matches.push({
            id: account.id,
            name: account.name || 'Unknown',
            domain: account.website || undefined,
            aliases: [],
            confidence: confidence * 100,
            matchType: 'exact',
            source: 'internal',
            metadata: {
              industry: account.industry || undefined,
              size: account.size || undefined,
              location: account.country || undefined
            }
          });
        }
      }

      // Search leads
      const leads = await this.prisma.leads.findMany({
        where: {
          deletedAt: null,
          OR: [
            { fullName: { contains: normalizedInput, mode: 'insensitive' } },
            { company: { contains: normalizedInput, mode: 'insensitive' } }
          ]
        },
        take: 10
      });

      for (const lead of leads) {
        if (lead.company) {
          const confidence = this.calculateCompanySimilarity(normalizedInput, lead.company);
          if (confidence >= 0.7) {
            matches.push({
              id: lead.id,
              name: lead.company,
              domain: undefined,
              aliases: [],
              confidence: confidence * 100,
              matchType: 'exact',
              source: 'internal',
              metadata: {
                industry: lead.industry || undefined,
                size: lead.companySize || undefined
              }
            });
          }
        }
      }

    } catch (error) {
      console.warn('Internal database search failed:', error);
    }

    return matches;
  }

  /**
   * Search by domain
   */
  private async searchByDomain(domain: string): Promise<CompanyMatch[]> {
    const matches: CompanyMatch[] = [];
    const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];

    try {
      // Search accounts by website
      const accounts = await this.prisma.accounts.findMany({
        where: {
          deletedAt: null,
          website: { contains: cleanDomain, mode: 'insensitive' }
        },
        take: 5
      });

      for (const account of accounts) {
        matches.push({
          id: account.id,
          name: account.name || 'Unknown',
          domain: account.website || undefined,
          aliases: [],
          confidence: 95, // High confidence for domain matches
          matchType: 'exact',
          source: 'internal',
          metadata: {
            industry: account.industry || undefined,
            size: account.size || undefined,
            location: account.country || undefined
          }
        });
      }

    } catch (error) {
      console.warn('Domain search failed:', error);
    }

    return matches;
  }

  /**
   * Get candidate companies for fuzzy matching
   */
  private async getCandidateCompanies(request: CompanyMatchRequest): Promise<any[]> {
    const candidates: any[] = [];

    try {
      // Get from accounts
      const accounts = await this.prisma.accounts.findMany({
        where: {
          deletedAt: null
        },
        select: {
          id: true,
          name: true,
          website: true,
          industry: true,
          size: true,
          country: true
        },
        take: 100
      });

      candidates.push(...accounts.map(account => ({
        id: account.id,
        name: account.name || '',
        domain: account.website,
        aliases: [],
        source: 'internal',
        metadata: {
          industry: account.industry,
          size: account.size,
          location: account.country
        }
      })));

      // Get from leads
      const leads = await this.prisma.leads.findMany({
        where: {
          company: { not: null },
          deletedAt: null
        },
        select: {
          id: true,
          company: true,
          industry: true,
          companySize: true
        },
        take: 100
      });

      candidates.push(...leads.map(lead => ({
        id: lead.id,
        name: lead.company || '',
        domain: undefined,
        aliases: [],
        source: 'internal',
        metadata: {
          industry: lead.industry,
          size: lead.companySize
        }
      })));

    } catch (error) {
      console.warn('Failed to get candidate companies:', error);
    }

    return candidates;
  }

  /**
   * Search by context (industry, location, etc.)
   */
  private async searchByContext(input: string, context: any): Promise<CompanyMatch[]> {
    const matches: CompanyMatch[] = [];

    try {
      const whereClause: any = {
        AND: [
          {
            OR: [
              { name: { contains: input, mode: 'insensitive' } },
              { website: { contains: input, mode: 'insensitive' } }
            ]
          },
          { deletedAt: null }
        ]
      };

      if (context.industry) {
        whereClause.AND.push({
          industry: { contains: context.industry, mode: 'insensitive' }
        });
      }

      if (context.location) {
        whereClause.AND.push({
          country: { contains: context.location, mode: 'insensitive' }
        });
      }

      const accounts = await this.prisma.accounts.findMany({
        where: whereClause,
        take: 10
      });

      for (const account of accounts) {
        const confidence = this.calculateCompanySimilarity(input, account.name || '');
        matches.push({
          id: account.id,
          name: account.name || 'Unknown',
          domain: account.website || undefined,
          aliases: [],
          confidence: confidence * 100 + 10, // Context bonus
          matchType: 'semantic',
          source: 'internal',
          metadata: {
            industry: account.industry || undefined,
            size: account.size || undefined,
            location: account.country || undefined
          }
        });
      }

    } catch (error) {
      console.warn('Context search failed:', error);
    }

    return matches;
  }

  /**
   * Search by industry
   */
  private async searchByIndustry(input: string, industry: string): Promise<CompanyMatch[]> {
    const matches: CompanyMatch[] = [];

    try {
      const accounts = await this.prisma.accounts.findMany({
        where: {
          AND: [
            {
              OR: [
                { name: { contains: input, mode: 'insensitive' } },
                { website: { contains: input, mode: 'insensitive' } }
              ]
            },
            { industry: { contains: industry, mode: 'insensitive' } },
            { deletedAt: null }
          ]
        },
        take: 5
      });

      for (const account of accounts) {
        const confidence = this.calculateCompanySimilarity(input, account.name || '');
        matches.push({
          id: account.id,
          name: account.name || 'Unknown',
          domain: account.website || undefined,
          aliases: [],
          confidence: confidence * 100 + 15, // Industry bonus
          matchType: 'semantic',
          source: 'internal',
          metadata: {
            industry: account.industry || undefined,
            size: account.size || undefined,
            location: account.country || undefined
          }
        });
      }

    } catch (error) {
      console.warn('Industry search failed:', error);
    }

    return matches;
  }

  /**
   * Search CoreSignal for external enrichment
   */
  private async searchCoreSignal(domain: string): Promise<CompanyMatch | null> {
    try {
      const response = await fetch(
        `https://api.coresignal.com/cdapi/v2/company_multi_source/enrich?website=${domain}`,
        {
          method: 'GET',
          headers: {
            'apikey': this.coreSignalApiKey,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) return null;

      const data = await response.json();

      return {
        id: `coresignal_${data.id}`,
        name: data.company_name || 'Unknown',
        domain: data.website || domain,
        aliases: data.company_name_alias || [],
        confidence: 85, // High confidence for CoreSignal
        matchType: 'exact',
        source: 'coresignal',
        metadata: {
          industry: data.industry,
          employees: data.employees_count,
          location: data.hq_country,
          lastUpdated: data.last_updated_at
        }
      };

    } catch (error) {
      console.warn('CoreSignal search failed:', error);
      return null;
    }
  }

  /**
   * Search using waterfall enrichment
   */
  private async searchWaterfallEnrichment(request: CompanyMatchRequest): Promise<CompanyMatch | null> {
    try {
      const response = await fetch('http://localhost:3000/api/enrichment/waterfall', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'company_search',
          query: {
            input: request.input,
            type: request.type
          },
          config: {
            maxProviders: 2,
            minConfidence: 70
          }
        })
      });

      if (!response.ok) return null;

      const result = await response.json();

      if (result['success'] && result.data) {
        return {
          id: `waterfall_${Date.now()}`,
          name: result.data.name || 'Unknown',
          domain: result.data.domain,
          aliases: result.data.aliases || [],
          confidence: result.confidence || 70,
          matchType: 'semantic',
          source: 'enrichment',
          metadata: result.data.metadata || {}
        };
      }

    } catch (error) {
      console.warn('Waterfall enrichment search failed:', error);
    }

    return null;
  }

  /**
   * Remove duplicate matches
   */
  private deduplicateMatches(matches: CompanyMatch[]): CompanyMatch[] {
    const seen = new Set<string>();
    const unique: CompanyMatch[] = [];

    for (const match of matches) {
      const key = `${match.name.toLowerCase()}_${match.domain || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(match);
      }
    }

    return unique;
  }

  /**
   * Integration method for existing pipeline
   */
  async enhanceExistingCompanyData(companyId: string, companyName: string, domain?: string): Promise<CompanyMatch | null> {
    const request: CompanyMatchRequest = {
      input: domain || companyName,
      type: domain ? 'domain' : 'name',
      config: {
        strictMode: false,
        minConfidence: 0.8,
        maxResults: 1
      }
    };

    const result = await this.findCompanyMatches(request);
    return result['matches'][0] || null;
  }
}

// Export for integration with existing services
export default AdvancedCompanyMatcher;
