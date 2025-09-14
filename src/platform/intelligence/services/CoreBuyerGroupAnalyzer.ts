/**
 * 🎯 CORE BUYER GROUP ANALYZER
 * 
 * Simple, fast, reliable buyer group analysis
 * Uses existing seller product portfolio data to map buyer roles
 */

import { IntelligenceContext } from './ContextLoader';

export interface BuyerGroupRole {
  role: string;
  importance: 'primary' | 'influencer' | 'user' | 'blocker';
  reasoning: string;
}

export interface CoreBuyerGroup {
  companyName: string;
  productContext: string;
  roles: BuyerGroupRole[];
  primaryContact: string;
  strategy: string;
  confidence: number; // 0-100
  analysisTime: number; // milliseconds
}

export class CoreBuyerGroupAnalyzer {
  
  /**
   * 🎯 MAIN ENTRY POINT - Analyze buyer group for target company
   */
  static async analyzeBuyerGroup(
    companyName: string,
    context: IntelligenceContext
  ): Promise<CoreBuyerGroup> {
    
    const startTime = Date.now();
    
    console.log(`🎯 [BUYER GROUP] Analyzing buyer group for ${companyName}`);
    
    // Step 1: Get primary product context
    const primaryProduct = this.getPrimaryProduct(context);
    if (!primaryProduct) {
      throw new Error('No product portfolio found - unable to analyze buyer group');
    }
    
    // Step 2: Map buyer committee roles to importance levels
    const roles = this.mapBuyerRoles(primaryProduct.buyingCommitteeRoles, primaryProduct.productName);
    
    // Step 3: Determine primary contact and strategy
    const primaryContact = this.determinePrimaryContact(roles);
    const strategy = this.generateStrategy(roles, primaryProduct, companyName);
    
    // Step 4: Calculate confidence based on data quality
    const confidence = this.calculateConfidence(context, roles);
    
    const analysisTime = Date.now() - startTime;
    
    const buyerGroup: CoreBuyerGroup = {
      companyName,
      productContext: `${primaryProduct.productName} (${primaryProduct.productCategory})`,
      roles,
      primaryContact,
      strategy,
      confidence,
      analysisTime
    };
    
    console.log(`✅ [BUYER GROUP] Analysis complete for ${companyName} - ${roles.length} roles identified, confidence: ${confidence}%`);
    
    return buyerGroup;
  }
  
  /**
   * 🛍️ Get primary product from seller's portfolio
   */
  private static getPrimaryProduct(context: IntelligenceContext) {
    const products = context.seller.productPortfolio;
    
    if (products['length'] === 0) return null;
    
    // Use first product for now (could be enhanced to pick best match)
    return products[0];
  }
  
  /**
   * 👥 Map buyer committee roles to structured roles with importance
   */
  private static mapBuyerRoles(buyingCommitteeRoles: string[], productName: string): BuyerGroupRole[] {
    const roleMapping = {
      // Primary decision makers
      'CEO': { importance: 'primary' as const, reasoning: 'Final decision authority' },
      'CTO': { importance: 'primary' as const, reasoning: 'Technical decision maker' },
      'CFO': { importance: 'primary' as const, reasoning: 'Budget approval authority' },
      'CRO': { importance: 'primary' as const, reasoning: 'Revenue impact decision maker' },
      
      // Key influencers
      'VP Engineering': { importance: 'influencer' as const, reasoning: 'Technical evaluation and implementation' },
      'VP Sales': { importance: 'influencer' as const, reasoning: 'End user requirements and adoption' },
      'VP Finance': { importance: 'influencer' as const, reasoning: 'Budget planning and ROI analysis' },
      'VP Marketing': { importance: 'influencer' as const, reasoning: 'Customer impact and messaging' },
      
      // Users and implementers
      'Director Engineering': { importance: 'user' as const, reasoning: 'Day-to-day implementation' },
      'Director Sales': { importance: 'user' as const, reasoning: 'Primary end user' },
      'Director Finance': { importance: 'user' as const, reasoning: 'Financial reporting and analysis' },
      
      // Potential blockers
      'CISO': { importance: 'blocker' as const, reasoning: 'Security and compliance concerns' },
      'Legal': { importance: 'blocker' as const, reasoning: 'Contract and compliance review' },
      'Procurement': { importance: 'blocker' as const, reasoning: 'Vendor evaluation process' }
    };
    
    return buyingCommitteeRoles.map(role => {
      const mapping = roleMapping[role as keyof typeof roleMapping];
      
      return {
        role,
        importance: mapping?.importance || 'influencer',
        reasoning: mapping?.reasoning || `Key stakeholder for ${productName} implementation`
      };
    }).sort((a, b) => {
      // Sort by importance: primary > influencer > user > blocker
      const importanceOrder = { primary: 1, influencer: 2, user: 3, blocker: 4 };
      return importanceOrder[a.importance] - importanceOrder[b.importance];
    });
  }
  
  /**
   * 🎯 Determine primary contact to start with
   */
  private static determinePrimaryContact(roles: BuyerGroupRole[]): string {
    // Find first primary role, fallback to first influencer
    const primary = roles.find(r => r['importance'] === 'primary');
    const influencer = roles.find(r => r['importance'] === 'influencer');
    
    return primary?.role || influencer?.role || roles[0]?.role || 'Decision Maker';
  }
  
  /**
   * 🚀 Generate engagement strategy
   */
  private static generateStrategy(
    roles: BuyerGroupRole[], 
    product: any, 
    companyName: string
  ): string {
    const primary = roles.find(r => r['importance'] === 'primary');
    const influencers = roles.filter(r => r['importance'] === 'influencer');
    const blockers = roles.filter(r => r['importance'] === 'blocker');
    
    let strategy = `For ${product.productName} at ${companyName}: `;
    
    if (primary) {
      strategy += `Start with ${primary.role} (${primary.reasoning.toLowerCase()}). `;
    }
    
    if (influencers.length > 0) {
      strategy += `Engage ${influencers.map(i => i.role).join(' and ')} for technical validation. `;
    }
    
    if (blockers.length > 0) {
      strategy += `Address ${blockers.map(b => b.role).join(' and ')} concerns early to avoid delays.`;
    }
    
    return strategy.trim();
  }
  
  /**
   * 📊 Calculate confidence score based on data quality
   */
  private static calculateConfidence(context: IntelligenceContext, roles: BuyerGroupRole[]): number {
    let confidence = 0;
    
    // Base confidence from seller context
    if (context.seller.hasUserProfile) confidence += 30;
    if (context.seller.hasProductPortfolio) confidence += 40;
    
    // Confidence from buyer role data quality
    if (roles.length >= 3) confidence += 20; // Good role coverage
    if (roles.some(r => r['importance'] === 'primary')) confidence += 10; // Has primary decision maker
    
    return Math.min(confidence, 100);
  }
  
  /**
   * 🔍 Simple company industry lookup (can be enhanced later)
   */
  static async getCompanyIndustry(companyName: string): Promise<string> {
    // Simple mapping for common companies (can be enhanced with external APIs)
    const industryMapping: Record<string, string> = {
      'dell': 'Technology',
      'microsoft': 'Technology',
      'apple': 'Technology',
      'google': 'Technology',
      'amazon': 'Technology',
      'salesforce': 'Software',
      'oracle': 'Software',
      'sap': 'Software',
      'ibm': 'Technology',
      'cisco': 'Technology',
      'vmware': 'Software',
      'adobe': 'Software',
      'netflix': 'Media',
      'uber': 'Transportation',
      'airbnb': 'Hospitality',
      'tesla': 'Automotive',
      'ford': 'Automotive',
      'gm': 'Automotive',
      'walmart': 'Retail',
      'target': 'Retail',
      'starbucks': 'Food & Beverage',
      'mcdonald': 'Food & Beverage'
    };
    
    const key = companyName.toLowerCase().replace(/[^a-z]/g, '');
    return industryMapping[key] || 'Business Services';
  }
}
