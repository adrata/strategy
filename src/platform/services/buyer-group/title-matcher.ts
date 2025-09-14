/**
 * 🎯 TITLE MATCHER
 * 
 * Ultra-flexible title pattern matching system for buyer group identification
 */

export class TitleMatcher {

  /**
   * ULTRA-FLEXIBLE TITLE MATCHING SYSTEM
   * Handles ALL enterprise title variations: "VP", "Sales VP", "VP Sales", "Vice President, Sales", etc.
   */
  matchesPatterns(titleLower: string, patterns: string[]): boolean {
    // Normalize the input title through comprehensive cleaning
    const cleanTitle = this.normalizeTitle(titleLower);
    
    for (const pattern of patterns) {
      const cleanPattern = this.normalizeTitle(pattern.toLowerCase());
      
      // Method 1: Direct normalized match
      if (cleanTitle.includes(cleanPattern)) {
        return true;
      }
      
      // Method 2: Tokenized semantic matching
      if (this.semanticTitleMatch(cleanTitle, cleanPattern)) {
        return true;
      }
      
      // Method 3: Positional authority matching (VP/Director + Function)
      if (this.positionalAuthorityMatch(cleanTitle, cleanPattern)) {
        return true;
      }
      
      // Method 4: Departmental role matching
      if (this.departmentalRoleMatch(cleanTitle, cleanPattern)) {
        return true;
      }
      
      // Method 5: Enhanced VP pattern expansion
      if (this.expandVPPatterns(cleanPattern).some(expandedPattern => 
        cleanTitle.includes(expandedPattern) || 
        this.fuzzyTitleMatch(cleanTitle, expandedPattern)
      )) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Comprehensive title normalization for maximum matching flexibility
   */
  private normalizeTitle(title: string): string {
    let normalized = title.toLowerCase().trim();
    
    // Remove punctuation and normalize spacing
    normalized = normalized.replace(/[,.\-()]/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Standardize abbreviations to full forms for consistent matching
    const abbreviationMap = {
      // Executive levels
      'vp': 'vice president',
      'svp': 'senior vice president',
      'evp': 'executive vice president',
      'avp': 'assistant vice president',
      'sr': 'senior',
      'jr': 'junior',
      
      // Common business terms
      'mgr': 'manager',
      'dir': 'director',
      'mgmt': 'management',
      'ops': 'operations',
      'dev': 'development',
      'acct': 'account',
      'rep': 'representative',
      'exec': 'executive',
      
      // Sales specific
      'biz dev': 'business development',
      'bizdev': 'business development',
      'cust': 'customer',
      'rev': 'revenue',
      'comm': 'commercial'
    };
    
    // Apply abbreviation expansion
    for (const [abbr, full] of Object.entries(abbreviationMap)) {
      const regex = new RegExp("\\b${abbr}\\b", 'g');""
      normalized = normalized.replace(regex, full);
    }
    
    return normalized;
  }

  /**
   * Semantic matching based on key role concepts
   */
  private semanticTitleMatch(title: string, pattern: string): boolean {
    const titleTokens = new Set(title.split(/\s+/).filter(t => t.length > 2));
    const patternTokens = pattern.split(/\s+/).filter(t => t.length > 2);
    
    // All pattern tokens must have semantic matches in title
    return patternTokens.every(patternToken => {
      return Array.from(titleTokens).some(titleToken => {
        // Exact match
        if (titleToken === patternToken) return true;
        
        // Semantic equivalence
        const semanticMatches: Record<string, string[]> = {
          'sales': ['selling', 'revenue', 'commercial'],
          'director': ['head', 'lead', 'chief'],
          'manager': ['supervisor', 'coordinator'],
          'operations': ['ops', 'operational'],
          'business': ['commercial', 'enterprise'],
          'development': ['dev', 'growth'],
          'vice': ['deputy', 'assistant'],
          'president': ['head', 'chief']
        };
        
        const patternSynonyms = semanticMatches[patternToken] || [];
        const titleSynonyms = semanticMatches[titleToken] || [];
        
        return patternSynonyms.includes(titleToken) || titleSynonyms.includes(patternToken);
      });
    });
  }

  /**
   * Authority-based matching: Level (VP/Director) + Function (Sales/Ops)
   */
  private positionalAuthorityMatch(title: string, pattern: string): boolean {
    const authorityLevels = ['vice president', 'senior vice president', 'executive vice president', 
                            'director', 'senior director', 'manager', 'senior manager'];
    const businessFunctions = ['sales', 'business development', 'revenue', 'commercial', 
                              'operations', 'customer success', 'account management'];
    
    const titleLevel = authorityLevels.find(level => title.includes(level));
    const titleFunction = businessFunctions.find(func => title.includes(func));
    
    const patternLevel = authorityLevels.find(level => pattern.includes(level));
    const patternFunction = businessFunctions.find(func => pattern.includes(func));
    
    // Both level and function must match (or be semantically equivalent)
    return titleLevel === patternLevel && titleFunction === patternFunction;
  }

  /**
   * Department-specific role matching for complex organizational structures
   */
  private departmentalRoleMatch(title: string, pattern: string): boolean {
    // Extract department indicators
    const deptIndicators = ['in', 'of', 'for', '-'];
    
    // Check if titles have similar departmental context
    for (const indicator of deptIndicators) {
      if (title.includes(indicator) && pattern.includes(indicator)) {
        const titleParts = title.split(indicator);
        const patternParts = pattern.split(indicator);
        
        // Compare pre and post department indicator parts
        if (titleParts['length'] === 2 && patternParts['length'] === 2) {
          const titleRole = (titleParts[0] || '').trim();
          const titleDept = (titleParts[1] || '').trim();
          const patternRole = (patternParts[0] || '').trim();
          const patternDept = (patternParts[1] || '').trim();
          
          // Role and department should have semantic overlap
          return this.semanticTitleMatch(titleRole, patternRole) && 
                 this.semanticTitleMatch(titleDept, patternDept);
        }
      }
    }
    
    return false;
  }

  /**
   * VP PATTERN EXPANSION
   * Expands VP patterns to catch all variations
   */
  private expandVPPatterns(pattern: string): string[] {
    const vpVariations = [];
    
    // If pattern contains 'vp sales' or similar
    if (pattern.includes('vp ')) {
      const baseTerm = pattern.replace('vp ', '');
      vpVariations.push(
        `vp ${baseTerm}`,
        `vice president ${baseTerm}`,
        `vice president of ${baseTerm}`,
        `vp of ${baseTerm}`,
        `v.p. ${baseTerm}`,
        `v.p. of ${baseTerm}`,
        `vice-president ${baseTerm}`,
        `vice-president of ${baseTerm}`
      );
    }

    // If pattern contains 'vice president'
    if (pattern.includes('vice president')) {
      const baseTerm = pattern.replace('vice president ', '').replace('vice president of ', '');
      vpVariations.push(
        `vp ${baseTerm}`,
        `vice president ${baseTerm}`,
        `vice president of ${baseTerm}`,
        `vp of ${baseTerm}`,
        `v.p. ${baseTerm}`,
        `vice-president ${baseTerm}`
      );
    }

    // If pattern is just a role like 'sales director'
    if (!pattern.includes('vp') && !pattern.includes('vice president')) {
      vpVariations.push(pattern); // Keep original
      if (pattern.includes('director')) {
        const baseTerm = pattern.replace('director', '').trim();
        vpVariations.push(`vp ${baseTerm}`, `vice president ${baseTerm}`, `vp of ${baseTerm}`);
      }
    }

    return vpVariations;
  }
}