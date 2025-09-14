/**
 * 🎯 ROLE DETECTION ENGINE
 * 
 * Sophisticated 5-tier role detection from proven pipeline
 * Prevents cross-contamination and ensures accurate role assignment
 */

export class RoleDetectionEngine {
  private cfoTiers: string[][];
  private croTiers: string[][];
  private revenueExclusions: string[];
  private financeExclusions: string[];

  constructor() {
    // CFO DETECTION (5-tier system from original pipeline)
    this['cfoTiers'] = [
      // Tier 1: C-Level Finance Leaders (Highest Priority)
      ['chief financial officer', 'cfo', 'c.f.o.', 'c.f.o', 'chief accounting officer', 'cao', 'chief finance officer', 'group cfo'],
      
      // Tier 2: Senior VP Finance (High Priority)
      ['vp finance', 'vice president finance', 'vp of finance', 'vp financial', 'senior vp finance', 'evp finance', 'finance director', 'director of finance', 'head of finance'],
      
      // Tier 3: Controller & Senior Finance (Medium Priority)
      ['controller', 'corporate controller', 'group controller', 'financial controller', 'senior finance manager', 'fp&a manager', 'fpa manager', 'director of accounting'],
      
      // Tier 4: Treasury & Finance Operations (Lower Priority)
      ['treasurer', 'corporate treasurer', 'treasury manager', 'finance operations manager', 'financial operations manager', 'accounting manager'],
      
      // Tier 5: General Finance (Lowest Priority)
      ['finance', 'financial', 'accounting', 'finance specialist', 'financial analyst']
    ];

    // CRO DETECTION (5-tier system from original pipeline)
    this['croTiers'] = [
      // Tier 1: C-Level Revenue Leaders (Highest Priority)
      ['chief revenue officer', 'cro', 'c.r.o.', 'chief sales officer', 'cso', 'c.s.o.', 'chief commercial officer', 'cco', 'chief business officer', 'cbo', 'chief growth officer', 'cgo'],
      
      // Tier 2: Senior VP Revenue/Sales (High Priority)
      ['vp revenue', 'vice president revenue', 'vp sales', 'vice president sales', 'vp commercial', 'senior vp sales', 'evp sales', 'vp business development'],
      
      // Tier 3: Director Level Sales (Medium Priority)
      ['sales director', 'revenue director', 'commercial director', 'business development director', 'head of sales', 'head of revenue', 'director of sales'],
      
      // Tier 4: Sales Management (Lower Priority)
      ['sales manager', 'revenue manager', 'commercial manager', 'business development manager', 'account director', 'senior sales manager'],
      
      // Tier 5: General Sales (Lowest Priority)
      ['sales', 'revenue', 'commercial', 'business development']
    ];

    // Exclusions to prevent cross-contamination
    this['revenueExclusions'] = ['finance', 'financial', 'cfo', 'accounting', 'controller', 'treasury'];
    this['financeExclusions'] = ['revenue', 'sales', 'commercial', 'business development', 'customer success', 'cro', 'cso'];
  }

  /**
   * 🎯 DETECT CFO WITH 5-TIER SYSTEM
   */
  detectCFO(title: string): { role: string; tier: number; confidence: number } | null {
    if (!title) return null;
    
    const titleLower = title.toLowerCase().trim();
    
    // Check for revenue role exclusions first
    const hasRevenueTerms = this.revenueExclusions.some(term => titleLower.includes(term));
    if (hasRevenueTerms) {
      return null; // This is likely a revenue role, not finance
    }

    // Check each tier (higher tiers = higher confidence)
    for (let tier = 0; tier < this.cfoTiers.length; tier++) {
      for (const pattern of this['cfoTiers'][tier]) {
        if (titleLower.includes(pattern)) {
          const confidence = this.calculateCFOConfidence(tier, pattern, titleLower);
          
          return {
            role: 'CFO',
            tier: tier + 1,
            confidence
          };
        }
      }
    }
    
    return null;
  }

  /**
   * 📈 DETECT CRO WITH 5-TIER SYSTEM
   */
  detectCRO(title: string): { role: string; tier: number; confidence: number } | null {
    if (!title) return null;
    
    const titleLower = title.toLowerCase().trim();
    
    // Check for finance role exclusions first
    const hasFinanceTerms = this.financeExclusions.some(term => titleLower.includes(term));
    if (hasFinanceTerms) {
      return null; // This is likely a finance role, not revenue
    }

    // Check each tier (higher tiers = higher confidence)
    for (let tier = 0; tier < this.croTiers.length; tier++) {
      for (const pattern of this['croTiers'][tier]) {
        if (titleLower.includes(pattern)) {
          const confidence = this.calculateCROConfidence(tier, pattern, titleLower);
          
          return {
            role: 'CRO',
            tier: tier + 1,
            confidence
          };
        }
      }
    }
    
    return null;
  }

  /**
   * 🎯 COMPREHENSIVE ROLE DETECTION
   */
  detectRole(title: string): { role: string; tier: number; confidence: number; reasoning: string } | null {
    if (!title) return null;
    
    const titleLower = title.toLowerCase().trim();
    
    // Try CFO detection first
    const cfoResult = this.detectCFO(title);
    if (cfoResult) {
      return {
        ...cfoResult,
        reasoning: `CFO detected (Tier ${cfoResult.tier}): Title "${title}" matches finance leadership pattern "${this['cfoTiers'][cfoResult.tier - 1].find(p => titleLower.includes(p))}"`
      };
    }
    
    // Try CRO detection
    const croResult = this.detectCRO(title);
    if (croResult) {
      return {
        ...croResult,
        reasoning: `CRO detected (Tier ${croResult.tier}): Title "${title}" matches revenue leadership pattern "${this['croTiers'][croResult.tier - 1].find(p => titleLower.includes(p))}"`
      };
    }
    
    // Other C-level roles
    if (titleLower.includes('chief executive officer') || titleLower.includes('ceo')) {
      return { role: 'CEO', tier: 1, confidence: 95, reasoning: `CEO detected: Title "${title}" indicates chief executive role` };
    }
    
    if (titleLower.includes('chief technology officer') || titleLower.includes('cto')) {
      return { role: 'CTO', tier: 1, confidence: 95, reasoning: `CTO detected: Title "${title}" indicates technology leadership` };
    }
    
    if (titleLower.includes('chief operating officer') || titleLower.includes('coo')) {
      return { role: 'COO', tier: 1, confidence: 95, reasoning: `COO detected: Title "${title}" indicates operations leadership` };
    }
    
    return null;
  }

  /**
   * 💰 CALCULATE CFO CONFIDENCE
   */
  private calculateCFOConfidence(tier: number, pattern: string, title: string): number {
    let confidence = 90 - (tier * 10); // Tier 1 = 90%, Tier 2 = 80%, etc.
    
    // Boost confidence for exact matches
    if (title === pattern) confidence += 5;
    
    // Boost confidence for "chief" titles
    if (pattern.includes('chief')) confidence += 5;
    
    // Reduce confidence for generic terms
    if (pattern === 'finance' || pattern === 'financial') confidence -= 10;
    
    return Math.max(Math.min(confidence, 95), 50);
  }

  /**
   * 📈 CALCULATE CRO CONFIDENCE
   */
  private calculateCROConfidence(tier: number, pattern: string, title: string): number {
    let confidence = 90 - (tier * 10); // Tier 1 = 90%, Tier 2 = 80%, etc.
    
    // Boost confidence for exact matches
    if (title === pattern) confidence += 5;
    
    // Boost confidence for "chief" titles
    if (pattern.includes('chief')) confidence += 5;
    
    // Reduce confidence for generic terms
    if (pattern === 'sales' || pattern === 'revenue') confidence -= 10;
    
    return Math.max(Math.min(confidence, 95), 50);
  }
}
