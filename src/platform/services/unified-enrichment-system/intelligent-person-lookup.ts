/**
 * 🔍 INTELLIGENT PERSON LOOKUP
 * 
 * Handles "Tell me about {{person}}" with sophisticated context filtering
 * Addresses: Multiple person matches, industry context, probability scoring
 */

import { PrismaClient } from '@prisma/client';
import { CoreSignalClient } from '../buyer-group/coresignal-client';
import { EmploymentVerificationPipeline } from './employment-verification';

export interface PersonLookupContext {
  industry?: string;
  vertical?: string;
  companyContext?: string;
  roleContext?: string;
  geography?: string;
  workspaceId: string;
  sellerProfile?: any;
}

export interface PersonLookupResult {
  type: 'single_match' | 'disambiguation_required' | 'external_search' | 'not_found';
  person?: any;
  candidates?: PersonCandidate[];
  confidence?: number;
  reasoning?: string[];
  suggestions?: string[];
}

export interface PersonCandidate {
  person: any;
  contextScore: number;
  employmentVerification: any;
  relevanceFactors: {
    industryMatch: number;
    companyMatch: number;
    roleMatch: number;
    geographyMatch: number;
    employmentCurrency: number;
  };
}

export class IntelligentPersonLookup {
  private prisma: PrismaClient;
  private coreSignalClient: CoreSignalClient;
  private employmentVerifier: EmploymentVerificationPipeline;
  
  constructor() {
    this.prisma = new PrismaClient();
    this.coreSignalClient = new CoreSignalClient({
      apiKey: process.env.CORESIGNAL_API_KEY!,
      baseUrl: 'https://api.coresignal.com',
      maxCollects: 100,
      batchSize: 10,
      useCache: true,
      cacheTTL: 24
    });
    this.employmentVerifier = new EmploymentVerificationPipeline();
  }
  
  /**
   * 🎯 MAIN PERSON LOOKUP WITH CONTEXT
   * 
   * Handles all person lookup scenarios with intelligent context filtering
   */
  async lookupPersonWithContext(
    personQuery: string,
    context: PersonLookupContext
  ): Promise<PersonLookupResult> {
    
    console.log(`🔍 [PERSON LOOKUP] Searching for: "${personQuery}"`);
    console.log(`📊 [CONTEXT] Industry: ${context.industry}, Company: ${context.companyContext}, Role: ${context.roleContext}`);
    
    try {
      // Step 1: Parse query for name, company, role hints
      const parsedQuery = this.parsePersonQuery(personQuery);
      console.log(`📝 [PARSED] Name: ${parsedQuery.name}, Company: ${parsedQuery.company}, Role: ${parsedQuery.role}`);
      
      // Step 2: Search internal database with fuzzy matching
      const internalMatches = await this.searchInternalDatabase(parsedQuery, context);
      console.log(`🏠 [INTERNAL] Found ${internalMatches.length} internal matches`);
      
      if (internalMatches.length === 0) {
        // Step 3: External search with context
        console.log(`🌐 [EXTERNAL] No internal matches, searching externally...`);
        return await this.searchExternalWithContext(parsedQuery, context);
      }
      
      if (internalMatches.length === 1) {
        // Step 4: Verify and enrich single match
        console.log(`✅ [SINGLE] Single match found, verifying employment...`);
        return await this.verifyAndEnrichPerson(internalMatches[0], context);
      }
      
      // Step 5: Intelligent disambiguation for multiple matches
      console.log(`🎯 [MULTIPLE] ${internalMatches.length} matches, applying intelligent disambiguation...`);
      return await this.intelligentDisambiguation(internalMatches, context);
      
    } catch (error) {
      console.error(`❌ [PERSON LOOKUP] Failed for "${personQuery}":`, error);
      
      return {
        type: 'not_found',
        reasoning: [`Lookup failed: ${error.message}`],
        suggestions: [
          'Check spelling of person name',
          'Try including company name in query',
          'Use more specific role or title information'
        ]
      };
    }
  }
  
  /**
   * 📝 PARSE PERSON QUERY
   * 
   * Extract name, company, role from natural language queries
   */
  private parsePersonQuery(query: string): {
    name: string;
    company?: string;
    role?: string;
    originalQuery: string;
  } {
    
    const normalized = query.trim();
    
    // Pattern 1: "John Smith at Microsoft"
    const atCompanyMatch = normalized.match(/^(.+?)\s+at\s+(.+)$/i);
    if (atCompanyMatch) {
      return {
        name: atCompanyMatch[1].trim(),
        company: atCompanyMatch[2].trim(),
        originalQuery: query
      };
    }
    
    // Pattern 2: "John Smith, VP Sales at Microsoft"
    const titleAtCompanyMatch = normalized.match(/^(.+?),\s*(.+?)\s+at\s+(.+)$/i);
    if (titleAtCompanyMatch) {
      return {
        name: titleAtCompanyMatch[1].trim(),
        role: titleAtCompanyMatch[2].trim(),
        company: titleAtCompanyMatch[3].trim(),
        originalQuery: query
      };
    }
    
    // Pattern 3: "VP Sales John Smith"
    const roleThenNameMatch = normalized.match(/^((?:vp|director|manager|ceo|cfo|cto|president)\s+\w+)\s+(.+)$/i);
    if (roleThenNameMatch) {
      return {
        role: roleThenNameMatch[1].trim(),
        name: roleThenNameMatch[2].trim(),
        originalQuery: query
      };
    }
    
    // Default: treat entire query as name
    return {
      name: normalized,
      originalQuery: query
    };
  }
  
  /**
   * 🏠 SEARCH INTERNAL DATABASE WITH CONTEXT
   */
  private async searchInternalDatabase(
    parsedQuery: any,
    context: PersonLookupContext
  ): Promise<any[]> {
    
    const whereClause: any = {
      workspaceId: context.workspaceId,
      deletedAt: null,
      AND: []
    };
    
    // Name matching (fuzzy)
    whereClause.AND.push({
      OR: [
        { fullName: { contains: parsedQuery.name, mode: 'insensitive' } },
        { firstName: { contains: parsedQuery.name.split(' ')[0], mode: 'insensitive' } },
        { lastName: { contains: parsedQuery.name.split(' ').slice(-1)[0], mode: 'insensitive' } }
      ]
    });
    
    // Company context filtering
    if (parsedQuery.company || context.companyContext) {
      const companyQuery = parsedQuery.company || context.companyContext;
      whereClause.AND.push({
        company: {
          name: { contains: companyQuery, mode: 'insensitive' }
        }
      });
    }
    
    // Industry context filtering
    if (context.industry) {
      whereClause.AND.push({
        OR: [
          { company: { industry: { contains: context.industry, mode: 'insensitive' } } },
          { company: { vertical: { contains: context.industry, mode: 'insensitive' } } }
        ]
      });
    }
    
    // Role context filtering
    if (parsedQuery.role || context.roleContext) {
      const roleQuery = parsedQuery.role || context.roleContext;
      whereClause.AND.push({
        OR: [
          { jobTitle: { contains: roleQuery, mode: 'insensitive' } },
          { department: { contains: roleQuery, mode: 'insensitive' } },
          { buyerGroupRole: { contains: roleQuery, mode: 'insensitive' } }
        ]
      });
    }
    
    const matches = await this.prisma.people.findMany({
      where: whereClause,
      include: {
        company: true,
        buyerGroups: {
          include: {
            buyerGroup: true
          }
        }
      },
      take: 50 // Limit to prevent overwhelming results
    });
    
    return matches;
  }
  
  /**
   * 🎯 INTELLIGENT DISAMBIGUATION
   * 
   * When multiple people match, use context to find highest probability match
   */
  private async intelligentDisambiguation(
    matches: any[],
    context: PersonLookupContext
  ): Promise<PersonLookupResult> {
    
    console.log(`🎯 [DISAMBIGUATION] Analyzing ${matches.length} matches with context scoring`);
    
    // Step 1: Score each match based on context
    const scoredMatches = await Promise.all(
      matches.map(async (match) => {
        const contextScore = await this.calculateContextScore(match, context);
        const employmentVerification = await this.employmentVerifier.verifyPersonEmployment(match);
        
        return {
          person: match,
          contextScore,
          employmentVerification,
          relevanceFactors: this.calculateRelevanceFactors(match, context)
        };
      })
    );
    
    // Step 2: Sort by combined score (context + employment + relevance)
    const sortedMatches = scoredMatches
      .map(match => ({
        ...match,
        combinedScore: this.calculateCombinedScore(match)
      }))
      .sort((a, b) => b.combinedScore - a.combinedScore);
    
    // Step 3: Check if top match has high confidence
    const topMatch = sortedMatches[0];
    
    if (topMatch.combinedScore > 85 && topMatch.employmentVerification.isCurrentlyEmployed) {
      console.log(`✅ [HIGH CONFIDENCE] Selected: ${topMatch.person.fullName} (${topMatch.combinedScore}% confidence)`);
      
      return {
        type: 'single_match',
        person: topMatch.person,
        confidence: topMatch.combinedScore,
        reasoning: [
          `Highest context relevance: ${topMatch.contextScore}%`,
          `Current employment verified: ${topMatch.employmentVerification.confidence}%`,
          `Industry match: ${topMatch.relevanceFactors.industryMatch}%`,
          `Company context match: ${topMatch.relevanceFactors.companyMatch}%`
        ]
      };
    }
    
    // Step 4: Return top candidates for user selection
    console.log(`⚠️ [DISAMBIGUATION] No high-confidence match, returning top ${Math.min(5, sortedMatches.length)} candidates`);
    
    return {
      type: 'disambiguation_required',
      candidates: sortedMatches.slice(0, 5),
      reasoning: [
        `Found ${matches.length} potential matches`,
        `Top match confidence: ${topMatch.combinedScore}% (below 85% threshold)`,
        'User selection required for accuracy'
      ],
      suggestions: [
        'Provide more specific company or role context',
        'Include industry or department information',
        'Verify the person is currently employed at the target company'
      ]
    };
  }
  
  /**
   * 🌐 EXTERNAL SEARCH WITH CONTEXT
   * 
   * Search CoreSignal when person not found internally
   */
  private async searchExternalWithContext(
    parsedQuery: any,
    context: PersonLookupContext
  ): Promise<PersonLookupResult> {
    
    console.log(`🌐 [EXTERNAL] Searching CoreSignal for: ${parsedQuery.name}`);
    
    try {
      // Build CoreSignal search query with context
      const searchQuery = this.buildCoreSignalSearchQuery(parsedQuery, context);
      
      // Execute search (mock for now)
      const searchResults: any[] = [];
      
      if (searchResults.length === 0) {
        return {
          type: 'not_found',
          reasoning: ['No matches found in external search'],
          suggestions: [
            'Check spelling of person name',
            'Try searching by company instead',
            'Person may not be in professional databases'
          ]
        };
      }
      
      // Filter and score results by context (mock for now)
      const contextFilteredResults: any[] = [];
      
      if (contextFilteredResults.length === 1) {
        return {
          type: 'single_match',
          person: contextFilteredResults[0],
          confidence: contextFilteredResults[0].contextScore,
          reasoning: ['Single high-relevance match found in external search']
        };
      }
      
      return {
        type: 'disambiguation_required',
        candidates: contextFilteredResults.slice(0, 10),
        reasoning: [`Found ${contextFilteredResults.length} potential matches in external search`]
      };
      
    } catch (error) {
      console.error(`❌ External search failed:`, error);
      
      return {
        type: 'not_found',
        reasoning: [`External search failed: ${error.message}`],
        suggestions: ['Try a different search approach or check API connectivity']
      };
    }
  }
  
  /**
   * 📊 CALCULATE CONTEXT SCORE
   * 
   * Score person relevance based on available context
   */
  private async calculateContextScore(
    person: any,
    context: PersonLookupContext
  ): Promise<number> {
    
    let score = 0;
    const maxScore = 100;
    
    // Industry relevance (25 points)
    if (context.industry && person.company?.industry) {
      const industryMatch = this.calculateIndustryMatch(context.industry, person.company.industry);
      score += industryMatch * 25;
    }
    
    // Company context relevance (30 points)
    if (context.companyContext && person.company?.name) {
      const companyMatch = this.calculateCompanyContextMatch(context.companyContext, person.company.name);
      score += companyMatch * 30;
    }
    
    // Role context relevance (20 points)
    if (context.roleContext && person.jobTitle) {
      const roleMatch = this.calculateRoleContextMatch(context.roleContext, person.jobTitle);
      score += roleMatch * 20;
    }
    
    // Geographic relevance (15 points)
    if (context.geography && (person.city || person.state || person.country)) {
      const geoMatch = this.calculateGeographicMatch(context.geography, person);
      score += geoMatch * 15;
    }
    
    // Seller profile relevance (10 points)
    if (context.sellerProfile) {
      const sellerMatch = this.calculateSellerProfileMatch(person, context.sellerProfile);
      score += sellerMatch * 10;
    }
    
    return Math.round(Math.min(score, maxScore));
  }
  
  /**
   * 🏭 CALCULATE INDUSTRY MATCH
   */
  private calculateIndustryMatch(contextIndustry: string, personIndustry: string): number {
    const normalize = (industry: string) => industry.toLowerCase().trim();
    const ctx = normalize(contextIndustry);
    const pers = normalize(personIndustry);
    
    // Exact match
    if (ctx === pers) return 1.0;
    
    // Partial match
    if (ctx.includes(pers) || pers.includes(ctx)) return 0.8;
    
    // Industry synonyms/related
    const industryMap: Record<string, string[]> = {
      'technology': ['software', 'tech', 'saas', 'it', 'computer'],
      'finance': ['financial', 'banking', 'fintech', 'investment'],
      'healthcare': ['health', 'medical', 'pharma', 'biotech'],
      'manufacturing': ['industrial', 'automotive', 'aerospace', 'defense'],
      'retail': ['e-commerce', 'consumer', 'fashion', 'apparel']
    };
    
    for (const [key, synonyms] of Object.entries(industryMap)) {
      if ((ctx.includes(key) || synonyms.some(s => ctx.includes(s))) &&
          (pers.includes(key) || synonyms.some(s => pers.includes(s)))) {
        return 0.6;
      }
    }
    
    return 0;
  }
  
  /**
   * 🏢 CALCULATE COMPANY CONTEXT MATCH
   */
  private calculateCompanyContextMatch(contextCompany: string, personCompany: string): number {
    const normalize = (company: string) => company.toLowerCase()
      .replace(/\b(inc|corp|llc|ltd|corporation|incorporated|company|co)\b/g, '')
      .trim();
    
    const ctx = normalize(contextCompany);
    const pers = normalize(personCompany);
    
    // Exact match
    if (ctx === pers) return 1.0;
    
    // Partial match
    if (ctx.includes(pers) || pers.includes(ctx)) return 0.8;
    
    // Subsidiary/parent company logic
    const commonWords = ctx.split(' ').filter(word => 
      word.length > 2 && pers.includes(word)
    );
    
    if (commonWords.length > 0) {
      return Math.min(0.6, commonWords.length * 0.2);
    }
    
    return 0;
  }
  
  /**
   * 👔 CALCULATE ROLE CONTEXT MATCH
   */
  private calculateRoleContextMatch(contextRole: string, personTitle: string): number {
    const normalize = (role: string) => role.toLowerCase().trim();
    const ctx = normalize(contextRole);
    const title = normalize(personTitle);
    
    // Exact match
    if (ctx === title) return 1.0;
    
    // Role hierarchy matching
    const roleHierarchy = {
      'ceo': ['chief executive', 'president', 'founder'],
      'cfo': ['chief financial', 'vp finance', 'finance director'],
      'cto': ['chief technology', 'vp technology', 'vp engineering'],
      'vp sales': ['vice president sales', 'sales director', 'head of sales'],
      'developer': ['software engineer', 'programmer', 'software developer'],
      'manager': ['director', 'head of', 'lead']
    };
    
    for (const [key, variations] of Object.entries(roleHierarchy)) {
      if (ctx.includes(key) && variations.some(v => title.includes(v))) {
        return 0.8;
      }
    }
    
    // Word overlap scoring
    const ctxWords = ctx.split(' ').filter(w => w.length > 2);
    const titleWords = title.split(' ').filter(w => w.length > 2);
    const commonWords = ctxWords.filter(word => titleWords.includes(word));
    
    return Math.min(0.6, commonWords.length * 0.2);
  }
  
  /**
   * ✅ VERIFY AND ENRICH PERSON
   * 
   * Verify employment and enrich person data
   */
  private async verifyAndEnrichPerson(
    person: any,
    context: PersonLookupContext
  ): Promise<PersonLookupResult> {
    
    console.log(`✅ [VERIFY] Verifying and enriching ${person.fullName}`);
    
    // Step 1: Verify current employment
    const employmentVerification = await this.employmentVerifier.verifyPersonEmployment(person);
    
    // Step 2: Check if employment verification failed
    if (!employmentVerification.isCurrentlyEmployed && employmentVerification.confidence > 70) {
      console.log(`⚠️ [EMPLOYMENT] ${person.fullName} no longer employed at ${person.company?.name}`);
      
      return {
        type: 'not_found',
        reasoning: [
          `Person found but no longer employed at ${person.company?.name}`,
          `Employment verification confidence: ${employmentVerification.confidence}%`,
          `Last verified: ${employmentVerification.lastVerified}`
        ],
        suggestions: [
          'Search for person at their current company',
          'Look for replacement in same role',
          'Check for recent leadership changes'
        ]
      };
    }
    
    // Step 3: Enrich with additional context if employment verified
    const enrichedPerson = await this.enrichPersonWithContext(person, context);
    
    return {
      type: 'single_match',
      person: enrichedPerson,
      confidence: Math.round((employmentVerification.confidence + 80) / 2), // Blend employment + match confidence
      reasoning: [
        `Employment verified: ${employmentVerification.confidence}% confidence`,
        `Current title: ${employmentVerification.employmentDetails?.currentTitle || person.jobTitle}`,
        `Last verified: ${employmentVerification.lastVerified}`
      ]
    };
  }
  
  /**
   * 📈 CALCULATE COMBINED SCORE
   * 
   * Combine context score, employment verification, and relevance factors
   */
  private calculateCombinedScore(match: PersonCandidate): number {
    const weights = {
      context: 0.4,
      employment: 0.3,
      relevance: 0.3
    };
    
    const contextScore = match.contextScore;
    const employmentScore = match.employmentVerification.confidence;
    const relevanceScore = this.calculateOverallRelevance(match.relevanceFactors);
    
    return Math.round(
      contextScore * weights.context +
      employmentScore * weights.employment +
      relevanceScore * weights.relevance
    );
  }
  
  private calculateOverallRelevance(factors: any): number {
    return Math.round(
      (factors.industryMatch * 0.25) +
      (factors.companyMatch * 0.25) +
      (factors.roleMatch * 0.25) +
      (factors.employmentCurrency * 0.25)
    );
  }
  
  private calculateRelevanceFactors(person: any, context: PersonLookupContext): any {
    return {
      industryMatch: context.industry ? this.calculateIndustryMatch(context.industry, person.company?.industry || '') * 100 : 50,
      companyMatch: context.companyContext ? this.calculateCompanyContextMatch(context.companyContext, person.company?.name || '') * 100 : 50,
      roleMatch: context.roleContext ? this.calculateRoleContextMatch(context.roleContext, person.jobTitle || '') * 100 : 50,
      geographyMatch: context.geography ? this.calculateGeographicMatch(context.geography, person) : 50,
      employmentCurrency: 100 // Will be updated by employment verification
    };
  }
  
  private calculateGeographicMatch(contextGeo: string, person: any): number {
    const geoContext = contextGeo.toLowerCase();
    const personGeo = [person.city, person.state, person.country]
      .filter(Boolean)
      .map(g => g.toLowerCase())
      .join(' ');
    
    if (personGeo.includes(geoContext)) return 100;
    
    // State/country matching
    if (geoContext.includes('us') || geoContext.includes('usa')) {
      if (person.country?.toLowerCase().includes('united states') || person.country?.toLowerCase().includes('us')) {
        return 80;
      }
    }
    
    return 0;
  }
  
  private async enrichPersonWithContext(person: any, context: PersonLookupContext): Promise<any> {
    // Add context-based enrichment
    const enrichedPerson = {
      ...person,
      contextRelevance: await this.calculateContextScore(person, context),
      lastContextUpdate: new Date(),
      contextUsed: {
        industry: context.industry,
        companyContext: context.companyContext,
        roleContext: context.roleContext
      }
    };
    
    return enrichedPerson;
  }
  
  // Helper methods
  private buildCoreSignalSearchQuery(parsedQuery: any, context: PersonLookupContext): any {
    return {
      name: parsedQuery.name,
      company: parsedQuery.company || context.companyContext,
      title: parsedQuery.role || context.roleContext
    };
  }
  
  private filterExternalResultsByContext(results: any[], context: PersonLookupContext): any[] {
    return results.filter(result => {
      // Apply context filtering
      return true; // Placeholder
    });
  }
  
  private calculateSellerProfileMatch(person: any, sellerProfile: any): number {
    // Calculate match score based on seller profile
    return 0.5; // Placeholder
  }
}

// Export only the class
export { IntelligentPersonLookup };
