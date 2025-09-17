/**
 * Semantic Role Mapper (2025)
 * 
 * Intelligent role understanding system that maps role variations to canonical forms.
 * Handles semantic equivalencies like "VP Sales" = "Head of Sales" = "Chief Sales Officer"
 * 
 * Key Features:
 * - Semantic role expansion and normalization
 * - Context-aware role matching
 * - Industry-specific role variations
 * - Seniority level detection
 * - Department classification
 */

export interface RoleDefinition {
  canonical: string;
  variations: string[];
  seniority: 'c-level' | 'vp' | 'director' | 'manager' | 'individual-contributor' | 'entry-level';
  department: 'executive' | 'sales' | 'marketing' | 'engineering' | 'product' | 'finance' | 'operations' | 'hr' | 'legal' | 'other';
  semanticKeywords: string[];
  excludeKeywords: string[];
  industrySpecific?: Record<string, string[]>; // Industry-specific variations
  contextualHints?: string[]; // Context clues that help identify this role
}

export interface RoleQuery {
  originalQuery: string;
  canonicalRole: string;
  expandedVariations: string[];
  searchTerms: string[];
  confidenceBoosts: string[]; // Terms that increase confidence when found
  excludeTerms: string[]; // Terms that should exclude results
  seniorityLevel: string;
  department: string;
}

export interface GeographicContext {
  location: string;
  normalizedLocation: string;
  searchVariations: string[];
  countryCode?: string;
  stateCode?: string;
  cityName?: string;
}

export class SemanticRoleMapper {
  
  private roleDefinitions: Map<string, RoleDefinition> = new Map();
  
  constructor() {
    this.initializeRoleDefinitions();
  }

  /**
   * Expand a role query into all semantic variations
   */
  expandRoleQuery(role: string, company?: string, geography?: string): RoleQuery {
    const normalizedRole = this.normalizeRole(role);
    const roleDefinition = this.findBestRoleMatch(normalizedRole);
    
    if (!roleDefinition) {
      // Fallback for unknown roles
      return {
        originalQuery: role,
        canonicalRole: normalizedRole,
        expandedVariations: [role, normalizedRole],
        searchTerms: [role],
        confidenceBoosts: [],
        excludeTerms: ['assistant', 'intern', 'coordinator'],
        seniorityLevel: 'unknown',
        department: 'other'
      };
    }

    // Build comprehensive search terms
    const searchTerms = [
      roleDefinition.canonical,
      ...roleDefinition.variations,
      ...this.generateSemanticVariations(roleDefinition),
      ...this.getIndustrySpecificVariations(roleDefinition, company)
    ];

    return {
      originalQuery: role,
      canonicalRole: roleDefinition.canonical,
      expandedVariations: roleDefinition.variations,
      searchTerms: [...new Set(searchTerms)],
      confidenceBoosts: roleDefinition.semanticKeywords,
      excludeTerms: roleDefinition.excludeKeywords,
      seniorityLevel: roleDefinition.seniority,
      department: roleDefinition.department
    };
  }

  /**
   * Parse natural language queries like "VP Sales at Nike" or "Ross Sylvester at Adrata in Phoenix"
   */
  parseNaturalQuery(query: string): {
    person?: string;
    role?: string;
    company?: string;
    location?: string;
    queryType: 'person-specific' | 'role-specific' | 'general';
  } {
    const normalized = query.toLowerCase().trim();
    
    // Pattern 1: "Person Name at Company in Location"
    const personAtCompanyPattern = /^([a-z\s\-'\.]+)\s+at\s+([a-z\s\-&\.]+?)(?:\s+in\s+([a-z\s,]+))?$/i;
    const personMatch = normalized.match(personAtCompanyPattern);
    
    if (personMatch) {
      return {
        person: this.cleanPersonName(personMatch[1]),
        company: this.cleanCompanyName(personMatch[2]),
        location: personMatch[3] ? this.cleanLocation(personMatch[3]) : undefined,
        queryType: 'person-specific'
      };
    }

    // Pattern 2: "Role at Company" or "Role at Company in Location"
    const roleAtCompanyPattern = /^(.+?)\s+at\s+([a-z\s\-&\.]+?)(?:\s+in\s+([a-z\s,]+))?$/i;
    const roleMatch = normalized.match(roleAtCompanyPattern);
    
    if (roleMatch) {
      const potentialRole = roleMatch[1].trim();
      
      // Check if first part looks like a role (not a person name)
      if (this.looksLikeRole(potentialRole)) {
        return {
          role: potentialRole,
          company: this.cleanCompanyName(roleMatch[2]),
          location: roleMatch[3] ? this.cleanLocation(roleMatch[3]) : undefined,
          queryType: 'role-specific'
        };
      }
    }

    // Pattern 3: "Find Role at Company"
    const findRolePattern = /^(?:find\s+)?(.+?)\s+at\s+([a-z\s\-&\.]+)$/i;
    const findMatch = normalized.match(findRolePattern);
    
    if (findMatch) {
      return {
        role: findMatch[1].replace(/^find\s+/i, '').trim(),
        company: this.cleanCompanyName(findMatch[2]),
        queryType: 'role-specific'
      };
    }

    // Fallback: treat as general query
    return {
      role: query,
      queryType: 'general'
    };
  }

  /**
   * Handle geographic context for location-aware searches
   */
  parseGeographicContext(location: string): GeographicContext {
    const normalized = location.toLowerCase().trim();
    
    // US State mappings
    const stateMap = {
      'arizona': 'AZ', 'phoenix': 'AZ',
      'california': 'CA', 'san francisco': 'CA', 'los angeles': 'CA',
      'new york': 'NY', 'nyc': 'NY', 'manhattan': 'NY',
      'texas': 'TX', 'austin': 'TX', 'dallas': 'TX', 'houston': 'TX',
      'washington': 'WA', 'seattle': 'WA',
      'illinois': 'IL', 'chicago': 'IL',
      'massachusetts': 'MA', 'boston': 'MA'
    };

    const stateCode = stateMap[normalized as keyof typeof stateMap];
    
    // Generate search variations
    const variations = [location];
    
    if (stateCode) {
      variations.push(stateCode);
      // Add major cities for states
      if (stateCode === 'AZ') variations.push('Phoenix', 'Scottsdale', 'Tempe');
      if (stateCode === 'CA') variations.push('San Francisco', 'Los Angeles', 'San Diego');
      if (stateCode === 'NY') variations.push('New York', 'NYC', 'Manhattan');
    }

    return {
      location,
      normalizedLocation: normalized,
      searchVariations: [...new Set(variations)],
      stateCode,
      cityName: this.extractCityName(normalized)
    };
  }

  /**
   * Initialize comprehensive role definitions
   */
  private initializeRoleDefinitions(): void {
    
    // C-Level Executives
    this.roleDefinitions.set('ceo', {
      canonical: 'Chief Executive Officer',
      variations: [
        'CEO', 'Chief Executive Officer', 'President & CEO', 'Founder & CEO', 
        'Managing Director', 'Executive Director', 'President', 'Founder'
      ],
      seniority: 'c-level',
      department: 'executive',
      semanticKeywords: ['chief executive', 'president', 'founder', 'managing director'],
      excludeKeywords: ['assistant', 'deputy', 'interim', 'acting'],
      contextualHints: ['leadership', 'executive team', 'board']
    });

    this.roleDefinitions.set('cfo', {
      canonical: 'Chief Financial Officer',
      variations: [
        'CFO', 'Chief Financial Officer', 'Finance Director', 'VP Finance',
        'Vice President Finance', 'Head of Finance', 'Financial Director'
      ],
      seniority: 'c-level',
      department: 'finance',
      semanticKeywords: ['chief financial', 'finance', 'financial', 'accounting'],
      excludeKeywords: ['assistant', 'analyst', 'coordinator'],
      contextualHints: ['budget', 'financial planning', 'accounting']
    });

    this.roleDefinitions.set('cto', {
      canonical: 'Chief Technology Officer',
      variations: [
        'CTO', 'Chief Technology Officer', 'VP Engineering', 'VP Technology',
        'Head of Engineering', 'Head of Technology', 'Technology Director'
      ],
      seniority: 'c-level',
      department: 'engineering',
      semanticKeywords: ['chief technology', 'technology', 'engineering', 'technical'],
      excludeKeywords: ['assistant', 'intern', 'junior'],
      contextualHints: ['software', 'platform', 'architecture']
    });

    // Sales Leadership
    this.roleDefinitions.set('vp-sales', {
      canonical: 'VP Sales',
      variations: [
        'VP Sales', 'VP of Sales', 'Vice President Sales', 'Vice President of Sales',
        'Head of Sales', 'Sales Director', 'Chief Sales Officer', 'CSO',
        'Sales VP', 'Director of Sales', 'Head of Revenue', 'Chief Revenue Officer'
      ],
      seniority: 'vp',
      department: 'sales',
      semanticKeywords: ['sales', 'revenue', 'business development', 'growth'],
      excludeKeywords: ['assistant', 'coordinator', 'intern', 'support'],
      contextualHints: ['quota', 'pipeline', 'deals', 'clients'],
      industrySpecific: {
        'saas': ['Head of Revenue', 'Chief Revenue Officer', 'VP Revenue'],
        'enterprise': ['VP Enterprise Sales', 'Head of Enterprise'],
        'startup': ['Head of Growth', 'VP Growth']
      }
    });

    this.roleDefinitions.set('sales-director', {
      canonical: 'Sales Director',
      variations: [
        'Sales Director', 'Director of Sales', 'Regional Sales Director',
        'Senior Sales Manager', 'Sales Manager', 'Account Director'
      ],
      seniority: 'director',
      department: 'sales',
      semanticKeywords: ['sales', 'accounts', 'territory', 'region'],
      excludeKeywords: ['assistant', 'coordinator', 'intern'],
      contextualHints: ['territory', 'accounts', 'team']
    });

    // Marketing Leadership
    this.roleDefinitions.set('vp-marketing', {
      canonical: 'VP Marketing',
      variations: [
        'VP Marketing', 'VP of Marketing', 'Vice President Marketing',
        'Head of Marketing', 'Marketing Director', 'Chief Marketing Officer', 'CMO'
      ],
      seniority: 'vp',
      department: 'marketing',
      semanticKeywords: ['marketing', 'brand', 'campaigns', 'growth'],
      excludeKeywords: ['assistant', 'coordinator', 'intern'],
      contextualHints: ['brand', 'campaigns', 'digital', 'content']
    });

    // Product Leadership
    this.roleDefinitions.set('vp-product', {
      canonical: 'VP Product',
      variations: [
        'VP Product', 'VP of Product', 'Vice President Product',
        'Head of Product', 'Product Director', 'Chief Product Officer', 'CPO'
      ],
      seniority: 'vp',
      department: 'product',
      semanticKeywords: ['product', 'roadmap', 'strategy', 'user experience'],
      excludeKeywords: ['assistant', 'coordinator', 'intern'],
      contextualHints: ['roadmap', 'features', 'user', 'strategy']
    });

    // Engineering Leadership
    this.roleDefinitions.set('vp-engineering', {
      canonical: 'VP Engineering',
      variations: [
        'VP Engineering', 'VP of Engineering', 'Vice President Engineering',
        'Head of Engineering', 'Engineering Director', 'Director of Engineering'
      ],
      seniority: 'vp',
      department: 'engineering',
      semanticKeywords: ['engineering', 'development', 'software', 'technical'],
      excludeKeywords: ['assistant', 'intern', 'junior'],
      contextualHints: ['development', 'software', 'platform', 'architecture']
    });

    // Operations Leadership
    this.roleDefinitions.set('vp-operations', {
      canonical: 'VP Operations',
      variations: [
        'VP Operations', 'VP of Operations', 'Vice President Operations',
        'Head of Operations', 'Operations Director', 'COO', 'Chief Operating Officer'
      ],
      seniority: 'vp',
      department: 'operations',
      semanticKeywords: ['operations', 'processes', 'efficiency', 'scaling'],
      excludeKeywords: ['assistant', 'coordinator', 'intern'],
      contextualHints: ['processes', 'efficiency', 'scaling', 'operations']
    });

    // HR Leadership
    this.roleDefinitions.set('vp-hr', {
      canonical: 'VP Human Resources',
      variations: [
        'VP HR', 'VP Human Resources', 'VP of HR', 'Vice President HR',
        'Head of HR', 'HR Director', 'CHRO', 'Chief Human Resources Officer',
        'VP People', 'Head of People'
      ],
      seniority: 'vp',
      department: 'hr',
      semanticKeywords: ['human resources', 'people', 'talent', 'culture'],
      excludeKeywords: ['assistant', 'coordinator', 'intern'],
      contextualHints: ['talent', 'culture', 'recruiting', 'people']
    });
  }

  /**
   * Normalize role string for matching
   */
  private normalizeRole(role: string): string {
    return role
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Find the best matching role definition
   */
  private findBestRoleMatch(normalizedRole: string): RoleDefinition | null {
    // Direct match first
    if (this.roleDefinitions.has(normalizedRole)) {
      return this.roleDefinitions.get(normalizedRole)!;
    }

    // Search through variations
    for (const [key, definition] of this.roleDefinitions) {
      const allVariations = [
        definition.canonical.toLowerCase(),
        ...definition.variations.map(v => v.toLowerCase()),
        ...definition.semanticKeywords
      ];

      if (allVariations.some(variation => 
        normalizedRole.includes(variation) || variation.includes(normalizedRole)
      )) {
        return definition;
      }
    }

    return null;
  }

  /**
   * Generate additional semantic variations
   */
  private generateSemanticVariations(roleDefinition: RoleDefinition): string[] {
    const variations: string[] = [];
    
    // Add abbreviated forms
    if (roleDefinition.canonical.includes('Vice President')) {
      variations.push(roleDefinition.canonical.replace('Vice President', 'VP'));
    }
    
    // Add "Head of" variations for VP roles
    if (roleDefinition['seniority'] === 'vp') {
      const department = roleDefinition.department;
      variations.push(`Head of ${department.charAt(0).toUpperCase() + department.slice(1)}`);
    }

    return variations;
  }

  /**
   * Get industry-specific role variations
   */
  private getIndustrySpecificVariations(roleDefinition: RoleDefinition, company?: string): string[] {
    if (!roleDefinition.industrySpecific || !company) {
      return [];
    }

    // Simple industry detection based on company name
    const companyLower = company.toLowerCase();
    let industry = 'general';
    
    if (companyLower.includes('software') || companyLower.includes('tech') || companyLower.includes('saas')) {
      industry = 'saas';
    } else if (companyLower.includes('enterprise')) {
      industry = 'enterprise';
    }

    return roleDefinition['industrySpecific'][industry] || [];
  }

  /**
   * Check if a string looks like a role rather than a person name
   */
  private looksLikeRole(text: string): boolean {
    const roleIndicators = [
      'vp', 'vice president', 'director', 'manager', 'head of', 'chief',
      'ceo', 'cfo', 'cto', 'cmo', 'coo', 'president', 'officer'
    ];
    
    const normalized = text.toLowerCase();
    return roleIndicators.some(indicator => normalized.includes(indicator));
  }

  /**
   * Clean person name from query
   */
  private cleanPersonName(name: string): string {
    return name.trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Clean company name from query
   */
  private cleanCompanyName(company: string): string {
    return company.trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Clean location from query
   */
  private cleanLocation(location: string): string {
    return location.trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Extract city name from location string
   */
  private extractCityName(location: string): string | undefined {
    // Simple city extraction - can be enhanced
    const cities = ['phoenix', 'san francisco', 'new york', 'chicago', 'austin', 'seattle', 'boston'];
    const found = cities.find(city => location.includes(city));
    return found ? found.charAt(0).toUpperCase() + found.slice(1) : undefined;
  }

  /**
   * Get all available role definitions
   */
  getAllRoleDefinitions(): Map<string, RoleDefinition> {
    return new Map(this.roleDefinitions);
  }

  /**
   * Add custom role definition
   */
  addRoleDefinition(key: string, definition: RoleDefinition): void {
    this.roleDefinitions.set(key, definition);
  }
}
