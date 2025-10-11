/**
 * 🏛️ AUTHORITY ANALYZER
 * 
 * Analyzes decision-making authority and economic buyer qualification
 */

import { PersonProfile, SellerProfile } from './types';

export class AuthorityAnalyzer {

  /**
   * Calculate enterprise authority score based on budget and decision-making power
   */
  calculateAuthorityScore(profile: PersonProfile, sellerProfile: SellerProfile): {
    hasDecisionAuthority: boolean;
    score: number;
    rationale: string[];
  } {
    const hasDecisionAuthority = this.hasDecisionAuthority(profile.title);
    const authorityCheck = this.checkAuthorityForDealSize(profile.title, sellerProfile.dealSize);
    
    // FIXED: Hierarchy-based scoring (SVP > VP > Director)
    let score = this.calculateHierarchyScore(profile.title);
    const rationale = [`Authority level: ${hasDecisionAuthority ? 'High' : 'Medium'}`];
    if (authorityCheck) {
      rationale.push(`Sufficient authority for ${sellerProfile.dealSize} deals`);
    }
    
    // Budget authority indicators
    const titleLower = profile.title.toLowerCase();
    const budgetKeywords = ['budget', 'procurement', 'purchasing', 'finance'];
    if (budgetKeywords.some(keyword => titleLower.includes(keyword))) {
      score += 3;
      rationale.push('Budget authority indicators present');
    }

    return { 
      hasDecisionAuthority: authorityCheck, 
      score, 
      rationale 
    };
  }

  /**
   * FIXED: Calculate hierarchy-aware authority score (higher = more senior)
   */
  private calculateHierarchyScore(title: string): number {
    const titleLower = title.toLowerCase();
    
    // FIXED HIERARCHY SCORING (SVP > VP)
    const hierarchyScores = {
      // C-Level = 25+ points
      'ceo': 30, 'chief executive officer': 30,
      'cfo': 28, 'chief financial officer': 28, 
      'coo': 27, 'chief operating officer': 27,
      'cro': 26, 'chief revenue officer': 26,
      'cto': 25, 'chief technology officer': 25,
      
      // Executive VP = 22 points  
      'evp': 22, 'executive vice president': 22,
      
      // Senior VP = 20 points (FIXED: Higher than regular VP)
      'svp': 20, 'senior vice president': 20,
      
      // Vice President = 17 points
      'vp': 17, 'vice president': 17,
      
      // Director = 12-14 points
      'senior director': 14, 'director': 12,
      
      // Manager = 8-10 points
      'senior manager': 10, 'principal manager': 10, 'manager': 8,
      
      // Individual Contributor = 5 points
      'specialist': 5, 'senior specialist': 5, 'principal specialist': 5
    };
    
    // Find the highest matching score
    let maxScore = 5; // Default for unmatched titles
    Object.entries(hierarchyScores).forEach(([titlePattern, score]) => {
      if (titleLower.includes(titlePattern)) {
        maxScore = Math.max(maxScore, score);
      }
    });
    
    // Additional scoring for scope/function
    if (titleLower.includes('sales') || titleLower.includes('revenue') || titleLower.includes('commercial')) {
      maxScore += 3; // Sales function bonus
    }
    
    if (titleLower.includes('global')) {
      maxScore += 2; // Global scope bonus
    } else if (titleLower.includes('regional') || titleLower.includes('area')) {
      maxScore += 1; // Regional scope bonus
    }
    
    return maxScore;
  }

  /**
   * Check if profile qualifies as high-authority decision maker
   */
  isHighAuthorityDecisionMaker(profile: PersonProfile): boolean {
    const titleLower = profile.title.toLowerCase();
    
    // C-Level always qualifies
    if (['ceo', 'cfo', 'cro', 'chief'].some(title => titleLower.includes(title))) {
      return true;
    }
    
    // VP with clear budget authority
    if (titleLower.includes('vp') || titleLower.includes('vice president')) {
      const budgetKeywords = ['sales', 'revenue', 'business development', 'commercial'];
      return budgetKeywords.some(keyword => titleLower.includes(keyword));
    }
    
    return false;
  }

  /**
   * INTELLIGENT ECONOMIC BUYER VALIDATION
   * Determines if someone qualifies as an economic buyer based on authority, scope, and deal context
   */
  isEconomicBuyer(
    profile: PersonProfile, 
    sellerProfile: SellerProfile, 
    authorityScore: any
  ): boolean {
    const titleLower = profile.title.toLowerCase();
    const deptLower = profile.department.toLowerCase();
    
    // RULE 1: Must have formal decision authority
    if (!authorityScore.hasDecisionAuthority) {
      return false;
    }
    
    // RULE 2: Authority Matrix based on deal size
    const dealSizeAuthorityMatrix = this.getDealSizeAuthorityMatrix(sellerProfile.dealSize);
    const hasRequiredAuthority = this.hasRequiredAuthorityLevel(titleLower, dealSizeAuthorityMatrix);
    
    if (!hasRequiredAuthority) {
      // EXCEPTION: Director in Sales Ops with enhanced scope
      if (sellerProfile['dealSize'] === 'enterprise' && this.isQualifiedSalesOpsDirector(titleLower, deptLower)) {
        } else {
        return false;
      }
    }
    
    // RULE 3: Functional scope - must control budget/impact area
    const functionalScope: Record<string, string[]> = {
      revenue_technology: ['sales', 'revenue', 'business development', 'commercial', 'revenue operations'],
      analytics: ['analytics', 'data', 'business intelligence', 'operations'],
      security: ['security', 'information', 'technology', 'risk'],
      finance: ['finance', 'accounting', 'procurement', 'operations'],
      marketing: ['marketing', 'digital', 'brand', 'communications'],
      operations: ['operations', 'business', 'process', 'efficiency'],
      infrastructure: ['infrastructure', 'technology', 'systems', 'operations'],
      platform: ['platform', 'technology', 'engineering', 'operations'],
      hr: ['human resources', 'hr', 'people', 'talent'],
      legal: ['legal', 'compliance', 'contracts', 'risk'],
      custom: ['operations', 'business']
    };
    
    const relevantFunctions = functionalScope[sellerProfile.solutionCategory] || functionalScope.custom || ['operations', 'business'];
    const hasRelevantScope = relevantFunctions.some((func: string) => 
      titleLower.includes(func) || deptLower.includes(func)
    );
    
    // C-level with sales function takes precedence
    const isSalesExec = ['ceo', 'cfo', 'cro', 'chief revenue', 'chief executive', 'chief financial'].some(title => titleLower.includes(title));
    
    return hasRelevantScope || isSalesExec;
  }

  /**
   * Get deal size authority matrix based on enterprise research
   */
  private getDealSizeAuthorityMatrix(dealSize: string): string[] {
    const authorityMatrix = {
      // $50K and below - Manager+ can approve
      small: ['manager', 'senior manager', 'director', 'senior director', 'vp', 'vice president', 'svp', 'senior vice president', 'evp', 'executive vice president', 'ceo', 'cfo', 'cro'],
      
      // $50K-$100K - Director+ typically required  
      medium: ['director', 'senior director', 'vp', 'vice president', 'svp', 'senior vice president', 'evp', 'executive vice president', 'ceo', 'cfo', 'cro'],
      
      // $100K-$500K - VP+ typically required
      large: ['vp', 'vice president', 'svp', 'senior vice president', 'evp', 'ceo', 'cfo', 'cro'],
      
      // $250K+ - VP+ required (with Director exception for Sales Ops Global/Head roles)
      enterprise: ['vp', 'vice president', 'svp', 'senior vice president', 'evp', 'ceo', 'cfo', 'cro', 'chief revenue', 'chief executive', 'chief financial']
    };
    
    return (authorityMatrix as any)[dealSize] || authorityMatrix.medium;
  }

  /**
   * Check if Director qualifies for Sales Ops exception (Global/Head scope)
   */
  private isQualifiedSalesOpsDirector(titleLower: string, deptLower: string): boolean {
    const hasDirectorLevel = titleLower.includes('director');
    const hasSalesOpsFunction = 
      titleLower.includes('sales operations') || 
      titleLower.includes('revenue operations') || 
      titleLower.includes('commercial operations') ||
      deptLower.includes('sales operations') ||
      deptLower.includes('revenue operations');
    
    const hasEnhancedScope = 
      titleLower.includes('global') || 
      titleLower.includes('head of') || 
      titleLower.includes('chief') ||
      titleLower.includes('north america') ||
      titleLower.includes('enterprise');
    
    return hasDirectorLevel && hasSalesOpsFunction && hasEnhancedScope;
  }

  /**
   * Check if title meets required authority level
   */
  private hasRequiredAuthorityLevel(titleLower: string, requiredLevels: string[]): boolean {
    return requiredLevels.some(level => titleLower.includes(level));
  }

  /**
   * Simple authority check
   */
  private hasDecisionAuthority(title: string): boolean {
    const normalized = title.toLowerCase();
    return normalized.includes('vp') || normalized.includes('vice president') || 
           normalized.includes('director') || normalized.includes('chief') ||
           normalized.includes('head of');
  }

  /**
   * Check authority for deal size
   */
  private checkAuthorityForDealSize(title: string, dealSize: string): boolean {
    // For enterprise deals, need VP+ level
    if (dealSize === 'enterprise') {
      return this.hasDecisionAuthority(title);
    }
    return true;
  }

  /**
   * Determine if Director has decision authority based on deal size and scope
   */
  hasDirectorAuthority(titleLower: string, deptLower: string, sellerProfile: SellerProfile): boolean {
    // For enterprise deals ($250K+), Directors need enhanced scope
    if (sellerProfile['dealSize'] === 'enterprise') {
      return this.isQualifiedSalesOpsDirector(titleLower, deptLower);
    }
    
    // For smaller deals, Directors generally have authority
    return true;
  }
}
