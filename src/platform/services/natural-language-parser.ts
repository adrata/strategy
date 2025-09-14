/**
 * 🧠 NATURAL LANGUAGE PARSER
 * 
 * Parses natural language requests to extract:
 * - Numerical limits ("first 10", "top 5", "limit to 20")
 * - Role specifications ("CFO", "executives", "decision makers")
 * - Company prioritization ("Fortune 500", "largest companies", "by revenue")
 * - Processing instructions ("enrich", "find", "export")
 */

export interface ParsedRequest {
  intent: 'csv_enrichment' | 'role_finder' | 'company_analysis' | 'general';
  limit?: number;
  roles?: string[];
  prioritization?: 'first' | 'last' | 'random' | 'largest' | 'smallest' | 'revenue' | 'employees';
  companies?: string[];
  outputFormat?: 'csv' | 'excel' | 'json';
  confidence: number;
  originalQuery: string;
}

export interface CompanyPrioritizationCriteria {
  method: 'first' | 'last' | 'random' | 'largest' | 'smallest' | 'revenue' | 'employees' | 'alphabetical';
  direction?: 'asc' | 'desc';
  filterCriteria?: {
    minEmployees?: number;
    maxEmployees?: number;
    industries?: string[];
    regions?: string[];
  };
}

export class NaturalLanguageParser {
  
  /**
   * Main parsing method - extracts intent and parameters from natural language
   */
  static parseRequest(query: string): ParsedRequest {
    const lowerQuery = query.toLowerCase().trim();
    
    const result: ParsedRequest = {
      intent: 'general',
      confidence: 0,
      originalQuery: query
    };

    // Extract numerical limits
    result['limit'] = this.extractNumericalLimit(lowerQuery);
    
    // Extract roles
    result['roles'] = this.extractRoles(lowerQuery);
    
    // Extract prioritization method
    result['prioritization'] = this.extractPrioritization(lowerQuery);
    
    // Extract companies if mentioned
    result['companies'] = this.extractCompanies(lowerQuery);
    
    // Extract output format
    result['outputFormat'] = this.extractOutputFormat(lowerQuery);
    
    // Determine intent
    result['intent'] = this.determineIntent(lowerQuery, result);
    
    // Calculate confidence
    result['confidence'] = this.calculateConfidence(lowerQuery, result);
    
    return result;
  }

  /**
   * Extract numerical limits from queries like:
   * - "first 10 companies"
   * - "top 5 executives" 
   * - "limit to 20"
   * - "only process 15"
   * - "first 10 alphabetically"
   * - "largest 20 companies"
   */
  private static extractNumericalLimit(query: string): number | undefined {
    const patterns = [
      // Standard limit patterns
      /(?:first|top|limit\s+to|only\s+process|just\s+the\s+first)\s+(\d+)/i,
      /(\d+)\s+(?:companies|executives|people|records|entries|rows)/i,
      /limit\s*[:=]\s*(\d+)/i,
      /max\s*[:=]?\s*(\d+)/i,
      /take\s+(\d+)/i,
      /get\s+(\d+)/i,
      // Context-aware patterns
      /(?:largest|biggest|smallest|top|bottom)\s+(\d+)/i,
      /(\d+)\s+(?:largest|biggest|smallest|best|worst)/i,
      // Alphabetical patterns
      /(?:first|last)\s+(\d+)\s+(?:alphabetically|in\s+alphabetical|by\s+name)/i,
      /(\d+)\s+(?:alphabetically|in\s+alphabetical\s+order)/i,
      // Revenue/size patterns
      /(?:top|bottom)\s+(\d+)\s+(?:by\s+revenue|by\s+size|by\s+employees)/i,
      /(\d+)\s+(?:highest|lowest)\s+(?:revenue|employees|headcount)/i
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match) {
        const num = parseInt(match[1]);
        if (num > 0 && num <= 10000) { // Reasonable limits
          return num;
        }
      }
    }

    return undefined;
  }

  /**
   * Extract roles from queries like:
   * - "find CFOs"
   * - "get executives"
   * - "decision makers"
   */
  private static extractRoles(query: string): string[] {
    const rolePatterns = {
      'CFO': /\b(?:cfo|chief financial officer|finance director|financial director)\b/i,
      'CEO': /\b(?:ceo|chief executive officer|president|managing director)\b/i,
      'CTO': /\b(?:cto|chief technology officer|tech director|technology director)\b/i,
      'CMO': /\b(?:cmo|chief marketing officer|marketing director)\b/i,
      'CHRO': /\b(?:chro|chief human resources officer|hr director|people director)\b/i,
      'VP Sales': /\b(?:vp sales|vice president sales|sales director|head of sales)\b/i,
      'VP Engineering': /\b(?:vp engineering|vice president engineering|engineering director|head of engineering)\b/i,
      'Director': /\b(?:director|head of|senior director)\b/i,
      'Manager': /\b(?:manager|senior manager|team lead)\b/i,
      'Executive': /\b(?:executive|c-level|c-suite|senior leadership)\b/i,
      'Decision Maker': /\b(?:decision maker|stakeholder|buyer|influencer)\b/i
    };

    const foundRoles: string[] = [];
    
    for (const [role, pattern] of Object.entries(rolePatterns)) {
      if (pattern.test(query)) {
        foundRoles.push(role);
      }
    }

    return foundRoles;
  }

  /**
   * Extract prioritization method from queries like:
   * - "first 10" (first)
   * - "largest companies" (largest)
   * - "by revenue" (revenue)
   * - "alphabetically" (alphabetical)
   * - "Fortune 500" (largest)
   */
  private static extractPrioritization(query: string): ParsedRequest['prioritization'] {
    // More specific patterns first (order matters!)
    const prioritizationPatterns = {
      // Alphabetical sorting
      'alphabetical': /\b(?:alphabetically|alphabetical\s+order|by\s+name|a-z|z-a)\b/i,
      
      // Size-based (most specific first)
      'largest': /\b(?:largest|biggest|major|enterprise|fortune\s+\d+|top\s+\d+\s+(?:by\s+size|companies)|biggest\s+companies)\b/i,
      'smallest': /\b(?:smallest|startup|small|emerging|tiny|micro)\b/i,
      
      // Financial metrics
      'revenue': /\b(?:revenue|sales|income|earnings|turnover|by\s+revenue|highest\s+revenue)\b/i,
      'employees': /\b(?:employees|headcount|workforce|staff\s+size|by\s+employees|most\s+employees)\b/i,
      
      // Position-based
      'last': /\b(?:last|bottom|end|final|worst|lowest)\b/i,
      'random': /\b(?:random|randomly|sample|shuffle|mixed)\b/i,
      
      // Default position (least specific)
      'first': /\b(?:first|top|beginning|start\s+with|initial)\b/i
    };

    // Check for contextual clues that override simple patterns
    if (/\b(?:fortune\s+500|s&p\s+500|largest\s+companies|enterprise\s+companies)\b/i.test(query)) {
      return 'largest';
    }
    
    if (/\b(?:startups|small\s+business|sme|small\s+companies)\b/i.test(query)) {
      return 'smallest';
    }
    
    if (/\b(?:a\s+to\s+z|z\s+to\s+a|sort\s+by\s+name)\b/i.test(query)) {
      return 'alphabetical';
    }

    // Apply patterns in order of specificity
    for (const [method, pattern] of Object.entries(prioritizationPatterns)) {
      if (pattern.test(query)) {
        return method as ParsedRequest['prioritization'];
      }
    }

    return 'first'; // Default to first
  }

  /**
   * Extract specific company names if mentioned
   */
  private static extractCompanies(query: string): string[] {
    const companyPatterns = [
      /\b(?:at|from|for)\s+([A-Z][a-zA-Z\s&]+(?:Inc|Corp|LLC|Ltd)?)\b/g,
      /\b(Apple|Microsoft|Google|Amazon|Meta|Tesla|Netflix|Salesforce|Adobe|Oracle)\b/gi
    ];

    const companies: string[] = [];
    
    for (const pattern of companyPatterns) {
      let match;
      while ((match = pattern.exec(query)) !== null) {
        companies.push(match[1].trim());
      }
    }

    return [...new Set(companies)]; // Remove duplicates
  }

  /**
   * Extract desired output format
   */
  private static extractOutputFormat(query: string): ParsedRequest['outputFormat'] {
    if (/\b(?:csv|comma.separated)\b/i.test(query)) return 'csv';
    if (/\b(?:excel|xlsx|spreadsheet)\b/i.test(query)) return 'excel';
    if (/\b(?:json|api)\b/i.test(query)) return 'json';
    
    return 'csv'; // Default
  }

  /**
   * Determine the primary intent of the request
   */
  private static determineIntent(query: string, parsed: Partial<ParsedRequest>): ParsedRequest['intent'] {
    if (/\b(?:csv|upload|enrich.*list|process.*file)\b/i.test(query)) {
      return 'csv_enrichment';
    }
    
    if (parsed['roles'] && parsed.roles.length > 0) {
      return 'role_finder';
    }
    
    if (/\b(?:analyze|company.*data|intelligence)\b/i.test(query)) {
      return 'company_analysis';
    }
    
    return 'general';
  }

  /**
   * Calculate confidence score based on how many elements we successfully parsed
   */
  private static calculateConfidence(query: string, parsed: ParsedRequest): number {
    let score = 0.3; // Base confidence
    
    if (parsed.limit) score += 0.3;
    if (parsed['roles'] && parsed.roles.length > 0) score += 0.2;
    if (parsed['prioritization'] && parsed.prioritization !== 'first') score += 0.1;
    if (parsed['companies'] && parsed.companies.length > 0) score += 0.1;
    
    // Boost confidence for clear action words
    if (/\b(?:find|get|enrich|process|analyze)\b/i.test(query)) score += 0.2;
    
    return Math.min(score, 1.0);
  }

  /**
   * Generate prioritization criteria for company sampling
   */
  static generatePrioritizationCriteria(
    method: ParsedRequest['prioritization'],
    limit?: number
  ): CompanyPrioritizationCriteria {
    const criteria: CompanyPrioritizationCriteria = {
      method: method || 'first'
    };

    switch (method) {
      case 'largest':
        criteria['method'] = 'employees';
        criteria['direction'] = 'desc';
        criteria['filterCriteria'] = { minEmployees: 1000 };
        break;
        
      case 'smallest':
        criteria['method'] = 'employees';
        criteria['direction'] = 'asc';
        criteria['filterCriteria'] = { maxEmployees: 500 };
        break;
        
      case 'revenue':
        criteria['method'] = 'revenue';
        criteria['direction'] = 'desc';
        break;
        
      case 'employees':
        criteria['method'] = 'employees';
        criteria['direction'] = 'desc';
        break;
        
      case 'random':
        criteria['method'] = 'random';
        break;
        
      case 'last':
        criteria['method'] = 'first';
        criteria['direction'] = 'desc';
        break;
        
      default:
        criteria['method'] = 'first';
        criteria['direction'] = 'asc';
    }

    return criteria;
  }

  /**
   * Apply prioritization to a list of companies
   */
  static prioritizeCompanies(
    companies: any[],
    criteria: CompanyPrioritizationCriteria,
    limit?: number
  ): any[] {
    let sortedCompanies = [...companies];

    switch (criteria.method) {
      case 'random':
        // Fisher-Yates shuffle
        for (let i = sortedCompanies.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [sortedCompanies[i], sortedCompanies[j]] = [sortedCompanies[j], sortedCompanies[i]];
        }
        break;
        
      case 'employees':
        sortedCompanies.sort((a, b) => {
          const aEmployees = this.extractEmployeeCount(a);
          const bEmployees = this.extractEmployeeCount(b);
          return criteria['direction'] === 'desc' ? bEmployees - aEmployees : aEmployees - bEmployees;
        });
        break;
        
      case 'alphabetical':
        sortedCompanies.sort((a, b) => {
          const aName = this.extractCompanyName(a);
          const bName = this.extractCompanyName(b);
          return criteria['direction'] === 'desc' ? bName.localeCompare(aName) : aName.localeCompare(bName);
        });
        break;
        
      case 'first':
      default:
        if (criteria['direction'] === 'desc') {
          sortedCompanies.reverse();
        }
        break;
    }

    // Apply filters if specified
    if (criteria.filterCriteria) {
      sortedCompanies = sortedCompanies.filter(company => {
        const employees = this.extractEmployeeCount(company);
        
        if (criteria.filterCriteria!.minEmployees && employees < criteria.filterCriteria!.minEmployees) {
          return false;
        }
        
        if (criteria.filterCriteria!.maxEmployees && employees > criteria.filterCriteria!.maxEmployees) {
          return false;
        }
        
        return true;
      });
    }

    // Apply limit
    if (limit && limit > 0) {
      sortedCompanies = sortedCompanies.slice(0, limit);
    }

    return sortedCompanies;
  }

  /**
   * Helper to extract employee count from company data
   */
  private static extractEmployeeCount(company: any): number {
    if (typeof company === 'object') {
      return company.employees || company.employeeCount || company.headcount || 0;
    }
    return 0;
  }

  /**
   * Helper to extract company name from company data
   */
  private static extractCompanyName(company: any): string {
    if (typeof company === 'string') return company;
    if (typeof company === 'object') {
      return company.name || company.companyName || company.company || '';
    }
    return '';
  }
}
