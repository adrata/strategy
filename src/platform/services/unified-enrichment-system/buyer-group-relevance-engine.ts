/**
 * 🎯 BUYER GROUP RELEVANCE ENGINE
 * 
 * Validates buyer group relevance for specific product-company-person combinations
 * Addresses: "They are not really part of the buyer group for that specific product"
 */

import { SellerProfile, PersonProfile, CompanyProfile, BuyerGroupRelevanceResult, ProductFitResult, CompanyFitResult, AuthorityFitResult } from './types';

export class BuyerGroupRelevanceEngine {
  
  /**
   * 🎯 MAIN RELEVANCE VALIDATION
   * 
   * Validate if person is truly relevant for buyer group for specific product
   */
  async validateBuyerGroupRelevance(
    person: PersonProfile,
    buyerGroupRole: string,
    sellerProfile: SellerProfile,
    company: CompanyProfile
  ): Promise<BuyerGroupRelevanceResult> {
    
    console.log(`🎯 [RELEVANCE] Validating ${person.name} as ${buyerGroupRole} for ${sellerProfile.productName} at ${company.name}`);
    
    try {
      // Step 1: Product-specific role validation
      const productFit = await this.validateProductSpecificRole(person, sellerProfile);
      
      // Step 2: Company context validation
      const companyFit = await this.validateCompanyContext(person, company, sellerProfile);
      
      // Step 3: Authority/influence validation for the specific role
      const authorityFit = await this.validateAuthorityLevel(person, buyerGroupRole, sellerProfile);
      
      // Step 4: Calculate overall relevance score
      const relevanceScore = this.calculateRelevanceScore(productFit, companyFit, authorityFit);
      
      const result: BuyerGroupRelevanceResult = {
        isRelevant: relevanceScore > 70,
        relevanceScore,
        productFit,
        companyFit,
        authorityFit,
        reasoning: this.generateRelevanceReasoning(productFit, companyFit, authorityFit),
        recommendations: this.generateRelevanceRecommendations(relevanceScore, sellerProfile, buyerGroupRole)
      };
      
      console.log(`📊 [RELEVANCE] ${person.name}: ${relevanceScore}% relevance (${result.isRelevant ? 'RELEVANT' : 'NOT RELEVANT'})`);
      
      return result;
      
    } catch (error) {
      console.error(`❌ [RELEVANCE] Validation failed for ${person.name}:`, error);
      
      return {
        isRelevant: false,
        relevanceScore: 0,
        productFit: { directUser: false, influencer: false, budgetAuthority: false, technicalStakeholder: false, score: 0 },
        companyFit: { sizeAppropriate: false, industryMatch: false, maturityLevel: false, score: 0 },
        authorityFit: { hasDecisionAuthority: false, hasInfluence: false, hasBudgetControl: false, hasVetopower: false, score: 0 },
        reasoning: [`Validation failed: ${error.message}`],
        recommendations: ['Manual review required due to validation error']
      };
    }
  }
  
  /**
   * 🛍️ VALIDATE PRODUCT-SPECIFIC ROLE
   * 
   * Check if person's role is relevant for the specific product being sold
   */
  private async validateProductSpecificRole(
    person: PersonProfile,
    sellerProfile: SellerProfile
  ): Promise<ProductFitResult> {
    
    const fit: ProductFitResult = {
      directUser: false,
      influencer: false,
      budgetAuthority: false,
      technicalStakeholder: false,
      score: 0
    };
    
    const title = person.title.toLowerCase();
    const department = person.department.toLowerCase();
    
    // Technology/Platform Products (MuleSoft, Salesforce, etc.)
    if (sellerProfile.solutionCategory === 'platform' || 
        sellerProfile.solutionCategory === 'infrastructure') {
      
      // Direct users: developers, architects, technical leads
      if (title.includes('developer') || title.includes('architect') || 
          title.includes('engineer') || title.includes('technical lead') ||
          department.includes('engineering') || department.includes('development')) {
        fit.directUser = true;
        fit.score += 40;
      }
      
      // Technical stakeholders: CTO, VP Engineering, Tech Directors
      if (title.includes('cto') || 
          (title.includes('vp') && (title.includes('tech') || title.includes('engineering'))) ||
          (title.includes('director') && (title.includes('tech') || title.includes('engineering')))) {
        fit.technicalStakeholder = true;
        fit.score += 35;
      }
      
      // Influencers: IT managers, systems architects
      if (title.includes('it manager') || title.includes('systems') || 
          title.includes('platform') || title.includes('infrastructure')) {
        fit.influencer = true;
        fit.score += 25;
      }
      
      // Budget authority: CFO, VP Finance, Procurement (for enterprise deals)
      if (sellerProfile.dealSize === 'enterprise' || sellerProfile.dealSize === 'large') {
        if (title.includes('cfo') || title.includes('finance') || 
            title.includes('procurement') || title.includes('budget')) {
          fit.budgetAuthority = true;
          fit.score += 30;
        }
      }
    }
    
    // Operations/Engineering Services (TOP Engineering Plus)
    else if (sellerProfile.solutionCategory === 'operations') {
      
      // Direct stakeholders: Operations, Manufacturing, Quality, Engineering
      if (department.includes('operations') || department.includes('manufacturing') ||
          department.includes('quality') || department.includes('engineering') ||
          department.includes('production')) {
        fit.directUser = true;
        fit.score += 45;
      }
      
      // Decision makers: COO, VP Operations, Plant Managers, Engineering Directors
      if (title.includes('coo') || 
          (title.includes('vp') && title.includes('operations')) ||
          title.includes('plant manager') || title.includes('operations director') ||
          (title.includes('director') && title.includes('engineering'))) {
        fit.budgetAuthority = true;
        fit.score += 40;
      }
      
      // Technical stakeholders: Engineering managers, Quality directors
      if ((title.includes('manager') && title.includes('engineering')) ||
          (title.includes('director') && title.includes('quality')) ||
          title.includes('technical manager')) {
        fit.technicalStakeholder = true;
        fit.score += 30;
      }
      
      // Influencers: Project managers, process improvement, lean/six sigma
      if (title.includes('project manager') || title.includes('process') ||
          title.includes('lean') || title.includes('six sigma') ||
          title.includes('continuous improvement')) {
        fit.influencer = true;
        fit.score += 25;
      }
    }
    
    // Revenue Technology (Sales tools, CRM, etc.)
    else if (sellerProfile.solutionCategory === 'revenue_technology') {
      
      // Direct users: Sales reps, sales managers, revenue operations
      if (department.includes('sales') || department.includes('revenue') ||
          title.includes('sales') || title.includes('revenue')) {
        fit.directUser = true;
        fit.score += 40;
      }
      
      // Decision makers: CRO, VP Sales, Sales Directors
      if (title.includes('cro') || 
          (title.includes('vp') && title.includes('sales')) ||
          title.includes('sales director') || title.includes('revenue director')) {
        fit.budgetAuthority = true;
        fit.score += 35;
      }
      
      // Technical stakeholders: Revenue operations, sales operations
      if (title.includes('revenue operations') || title.includes('sales operations') ||
          title.includes('salesforce admin') || title.includes('crm admin')) {
        fit.technicalStakeholder = true;
        fit.score += 30;
      }
    }
    
    // Security Products
    else if (sellerProfile.solutionCategory === 'security') {
      
      // Direct users: Security analysts, CISO staff, IT security
      if (title.includes('security') || title.includes('cyber') ||
          department.includes('security') || department.includes('risk')) {
        fit.directUser = true;
        fit.score += 40;
      }
      
      // Decision makers: CISO, VP Security, Risk Directors
      if (title.includes('ciso') || title.includes('chief security') ||
          (title.includes('vp') && title.includes('security')) ||
          (title.includes('director') && title.includes('security'))) {
        fit.budgetAuthority = true;
        fit.score += 35;
      }
      
      // Technical stakeholders: IT directors, compliance managers
      if ((title.includes('director') && title.includes('it')) ||
          title.includes('compliance') || title.includes('audit')) {
        fit.technicalStakeholder = true;
        fit.score += 25;
      }
    }
    
    return fit;
  }
  
  /**
   * 🏢 VALIDATE COMPANY CONTEXT
   * 
   * Check if company is appropriate for the product/solution
   */
  private async validateCompanyContext(
    person: PersonProfile,
    company: CompanyProfile,
    sellerProfile: SellerProfile
  ): Promise<CompanyFitResult> {
    
    const fit: CompanyFitResult = {
      sizeAppropriate: false,
      industryMatch: false,
      maturityLevel: false,
      score: 0
    };
    
    // Company size appropriateness
    const companySize = company.size || '';
    if (this.isCompanySizeAppropriate(companySize, sellerProfile)) {
      fit.sizeAppropriate = true;
      fit.score += 35;
    }
    
    // Industry match
    const companyIndustry = company.industry || '';
    if (this.isIndustryMatch(companyIndustry, sellerProfile)) {
      fit.industryMatch = true;
      fit.score += 40;
    }
    
    // Company maturity level (for technology adoption, buying process, etc.)
    if (this.isMaturityLevelAppropriate(company, sellerProfile)) {
      fit.maturityLevel = true;
      fit.score += 25;
    }
    
    return fit;
  }
  
  /**
   * 👑 VALIDATE AUTHORITY LEVEL
   * 
   * Check if person has appropriate authority for their assigned buyer group role
   */
  private async validateAuthorityLevel(
    person: PersonProfile,
    buyerGroupRole: string,
    sellerProfile: SellerProfile
  ): Promise<AuthorityFitResult> {
    
    const fit: AuthorityFitResult = {
      hasDecisionAuthority: false,
      hasInfluence: false,
      hasBudgetControl: false,
      hasVetopower: false,
      score: 0
    };
    
    const title = person.title.toLowerCase();
    const seniorityLevel = person.seniorityLevel;
    
    // Decision maker validation
    if (buyerGroupRole === 'decision') {
      // Must have actual decision authority
      if (seniorityLevel === 'C-Level' || seniorityLevel === 'VP') {
        fit.hasDecisionAuthority = true;
        fit.score += 40;
      }
      
      // Budget control indicators
      if (title.includes('cfo') || title.includes('budget') || 
          title.includes('finance') || title.includes('procurement')) {
        fit.hasBudgetControl = true;
        fit.score += 30;
      }
    }
    
    // Champion validation
    else if (buyerGroupRole === 'champion') {
      // Must have influence but not necessarily budget authority
      if (seniorityLevel === 'Director' || seniorityLevel === 'Manager' || seniorityLevel === 'VP') {
        fit.hasInfluence = true;
        fit.score += 35;
      }
      
      // Should be in relevant department
      if (this.isInRelevantDepartment(person, sellerProfile)) {
        fit.score += 25;
      }
    }
    
    // Stakeholder validation
    else if (buyerGroupRole === 'stakeholder') {
      // Should have some influence
      if (seniorityLevel !== 'IC') {
        fit.hasInfluence = true;
        fit.score += 30;
      }
    }
    
    // Blocker validation
    else if (buyerGroupRole === 'blocker') {
      // Must have veto power
      if (title.includes('legal') || title.includes('compliance') || 
          title.includes('risk') || title.includes('security') ||
          title.includes('procurement')) {
        fit.hasVetopower = true;
        fit.score += 40;
      }
    }
    
    return fit;
  }
  
  /**
   * 📊 HELPER METHODS
   */
  
  private isCompanySizeAppropriate(companySize: string, sellerProfile: SellerProfile): boolean {
    const size = companySize.toLowerCase();
    
    // Enterprise products need larger companies
    if (sellerProfile.targetMarket === 'enterprise') {
      return size.includes('1000+') || size.includes('large') || 
             size.includes('enterprise') || size.includes('10000+');
    }
    
    // Mid-market products
    if (sellerProfile.targetMarket === 'mid_market') {
      return size.includes('100-') || size.includes('500-') || 
             size.includes('medium') || size.includes('mid');
    }
    
    // SMB products
    if (sellerProfile.targetMarket === 'smb') {
      return size.includes('1-') || size.includes('small') || 
             size.includes('startup');
    }
    
    return true; // 'all' target market
  }
  
  private isIndustryMatch(companyIndustry: string, sellerProfile: SellerProfile): boolean {
    const industry = companyIndustry.toLowerCase();
    
    // Check if industry aligns with product focus
    switch (sellerProfile.solutionCategory) {
      case 'operations':
        return industry.includes('manufacturing') || industry.includes('industrial') ||
               industry.includes('automotive') || industry.includes('aerospace') ||
               industry.includes('construction') || industry.includes('engineering');
      
      case 'revenue_technology':
        return industry.includes('technology') || industry.includes('software') ||
               industry.includes('saas') || industry.includes('services');
      
      case 'security':
        return industry.includes('financial') || industry.includes('healthcare') ||
               industry.includes('government') || industry.includes('technology');
      
      case 'platform':
      case 'infrastructure':
        return industry.includes('technology') || industry.includes('software') ||
               industry.includes('it') || industry.includes('telecom');
      
      default:
        return true; // Generic products work across industries
    }
  }
  
  private isMaturityLevelAppropriate(company: CompanyProfile, sellerProfile: SellerProfile): boolean {
    // For now, assume all companies are appropriate
    // Could be enhanced with funding stage, age, technology adoption indicators
    return true;
  }
  
  private isInRelevantDepartment(person: PersonProfile, sellerProfile: SellerProfile): boolean {
    const department = person.department.toLowerCase();
    const targetDepartments = sellerProfile.targetDepartments || [];
    
    return targetDepartments.some(targetDept => 
      department.includes(targetDept.toLowerCase())
    );
  }
  
  private calculateRelevanceScore(
    productFit: ProductFitResult,
    companyFit: CompanyFitResult,
    authorityFit: AuthorityFitResult
  ): number {
    
    const weights = {
      product: 0.5,  // Product fit is most important
      authority: 0.3, // Authority for role is critical
      company: 0.2   // Company context is supporting
    };
    
    return Math.round(
      productFit.score * weights.product +
      authorityFit.score * weights.authority +
      companyFit.score * weights.company
    );
  }
  
  private generateRelevanceReasoning(
    productFit: ProductFitResult,
    companyFit: CompanyFitResult,
    authorityFit: AuthorityFitResult
  ): string[] {
    
    const reasoning: string[] = [];
    
    // Product fit reasoning
    if (productFit.directUser) {
      reasoning.push('Person is a direct user of this type of solution');
    }
    if (productFit.technicalStakeholder) {
      reasoning.push('Person has technical decision-making authority');
    }
    if (productFit.budgetAuthority) {
      reasoning.push('Person has budget approval authority');
    }
    if (productFit.score < 30) {
      reasoning.push('Low product fit - person may not be directly involved with this solution');
    }
    
    // Authority fit reasoning
    if (authorityFit.hasDecisionAuthority) {
      reasoning.push('Person has appropriate decision-making authority');
    }
    if (authorityFit.hasInfluence) {
      reasoning.push('Person has organizational influence');
    }
    if (authorityFit.score < 30) {
      reasoning.push('Person may lack sufficient authority for assigned buyer group role');
    }
    
    // Company fit reasoning
    if (companyFit.industryMatch) {
      reasoning.push('Company industry aligns with product focus');
    }
    if (companyFit.sizeAppropriate) {
      reasoning.push('Company size appropriate for product target market');
    }
    if (companyFit.score < 30) {
      reasoning.push('Company may not be ideal fit for this product');
    }
    
    return reasoning;
  }
  
  private generateRelevanceRecommendations(
    relevanceScore: number,
    sellerProfile: SellerProfile,
    buyerGroupRole: string
  ): string[] {
    
    const recommendations: string[] = [];
    
    if (relevanceScore < 50) {
      recommendations.push('Consider removing this person from the buyer group');
      recommendations.push('Look for more relevant stakeholders in target departments');
    } else if (relevanceScore < 70) {
      recommendations.push('Person has moderate relevance - validate role manually');
      recommendations.push('Consider adjusting buyer group role assignment');
    } else {
      recommendations.push('Person is highly relevant for this buyer group');
      if (buyerGroupRole === 'decision' && relevanceScore > 85) {
        recommendations.push('High-priority contact - strong decision-making authority');
      }
    }
    
    // Product-specific recommendations
    if (sellerProfile.solutionCategory === 'platform') {
      recommendations.push('Focus on technical implementation and integration benefits');
    } else if (sellerProfile.solutionCategory === 'operations') {
      recommendations.push('Emphasize operational efficiency and cost savings');
    } else if (sellerProfile.solutionCategory === 'revenue_technology') {
      recommendations.push('Highlight revenue impact and sales productivity gains');
    }
    
    return recommendations;
  }
  
  /**
   * 📊 BATCH RELEVANCE VALIDATION
   * 
   * Validate relevance for multiple people in parallel
   */
  async batchValidateRelevance(
    people: Array<{
      person: PersonProfile;
      buyerGroupRole: string;
    }>,
    sellerProfile: SellerProfile,
    company: CompanyProfile
  ): Promise<Map<number, BuyerGroupRelevanceResult>> {
    
    console.log(`📊 [BATCH RELEVANCE] Validating ${people.length} people for buyer group relevance...`);
    
    const results = new Map<number, BuyerGroupRelevanceResult>();
    
    // Parallel validation
    const validationPromises = people.map(({ person, buyerGroupRole }) =>
      this.validateBuyerGroupRelevance(person, buyerGroupRole, sellerProfile, company)
    );
    
    const validationResults = await Promise.allSettled(validationPromises);
    
    // Collect results
    validationResults.forEach((result, index) => {
      const person = people[index].person;
      if (result.status === 'fulfilled') {
        results.set(person.id, result.value);
      } else {
        console.error(`❌ Relevance validation failed for ${person.name}:`, result.reason);
        results.set(person.id, {
          isRelevant: false,
          relevanceScore: 0,
          productFit: { directUser: false, influencer: false, budgetAuthority: false, technicalStakeholder: false, score: 0 },
          companyFit: { sizeAppropriate: false, industryMatch: false, maturityLevel: false, score: 0 },
          authorityFit: { hasDecisionAuthority: false, hasInfluence: false, hasBudgetControl: false, hasVetopower: false, score: 0 },
          reasoning: [`Validation failed: ${result.reason}`],
          recommendations: ['Manual review required']
        });
      }
    });
    
    const relevantCount = Array.from(results.values()).filter(r => r.isRelevant).length;
    console.log(`✅ [BATCH RELEVANCE] ${relevantCount}/${people.length} people are relevant for buyer group`);
    
    return results;
  }
}

// Export only the class
export { BuyerGroupRelevanceEngine };
