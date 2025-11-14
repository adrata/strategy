/**
 * Auto Strategy Population Service
 * Automatically generates and populates strategy data for companies
 */

import { prisma } from '@/lib/prisma';
import { companyStrategyService, CompanyStrategyRequest } from './company-strategy-service';

export interface AutoPopulationResult {
  success: boolean;
  companiesProcessed: number;
  strategiesGenerated: number;
  errors: string[];
}

export class AutoStrategyPopulationService {
  async populateStrategiesForAllCompanies(workspaceId: string): Promise<AutoPopulationResult> {
    const result: AutoPopulationResult = {
      success: true,
      companiesProcessed: 0,
      strategiesGenerated: 0,
      errors: []
    };

    try {
      console.log(`🔄 [AUTO STRATEGY] Starting strategy population for workspace ${workspaceId}`);

      // Get all companies without strategy data
      const companies = await prisma.companies.findMany({
        where: {
          workspaceId,
          deletedAt: null,
          OR: [
            { customFields: null },
            { customFields: { path: ['strategyData'], equals: undefined } }
          ]
        },
        take: 50 // Process in batches
      });

      result.companiesProcessed = companies.length;
      console.log(`📊 [AUTO STRATEGY] Found ${companies.length} companies without strategy data`);

      for (const company of companies) {
        try {
          await this.populateStrategyForCompany(company);
          result.strategiesGenerated++;
          console.log(`✅ [AUTO STRATEGY] Generated strategy for ${company.name}`);
        } catch (error) {
          const errorMsg = `Failed to generate strategy for ${company.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.error(`❌ [AUTO STRATEGY] ${errorMsg}`);
        }
      }

      console.log(`✅ [AUTO STRATEGY] Completed. Generated ${result.strategiesGenerated} strategies`);
      return result;

    } catch (error) {
      console.error('❌ [AUTO STRATEGY] Error in batch processing:', error);
      result.success = false;
      result.errors.push(`Batch processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  async populateStrategyForCompany(company: any): Promise<void> {
    try {
      // Infer target industry from company data, avoiding Technology/SaaS default
      const inferredTargetIndustry = company.customFields?.targetIndustry || 
        (company.industry ? this.inferIndustryCategory(company.industry) : null) ||
        (company.sector ? this.inferIndustryCategory(company.sector) : null) ||
        (company.name ? this.inferIndustryFromName(company.name) : null) ||
        'Unknown';

      // Prepare strategy request with company data
      const strategyRequest: CompanyStrategyRequest = {
        companyId: company.id,
        companyName: company.name,
        companyIndustry: company.industry || 'Unknown',
        targetIndustry: inferredTargetIndustry,
        companySize: this.parseCompanySize(company.size || company.employeeCount),
        companyRevenue: company.revenue || 0,
        companyAge: company.foundedYear ? 
          new Date().getFullYear() - company.foundedYear : null,
        growthStage: this.determineGrowthStage(company),
        marketPosition: this.determineMarketPosition(company),
        // Pass through all real company data
        website: company.website,
        headquarters: company.headquarters,
        foundedYear: company.foundedYear,
        isPublic: company.isPublic,
        sector: company.sector,
        description: company.description,
        linkedinFollowers: company.linkedinFollowers,
        globalRank: company.globalRank,
        competitors: company.competitors ? company.competitors.split(',').map(c => c.trim()) : [],
        lastAction: company.lastAction,
        nextAction: company.nextAction,
        opportunityStage: company.opportunityStage,
        opportunityAmount: company.opportunityAmount
      };

      // Generate strategy
      const strategyResponse = await companyStrategyService.generateCompanyStrategy(strategyRequest);
      
      if (!strategyResponse.success || !strategyResponse.data) {
        throw new Error(strategyResponse.error || 'Failed to generate strategy');
      }

      // Update company record with strategy data
      await prisma.companies.update({
        where: { id: company.id },
        data: {
          customFields: {
            ...company.customFields,
            strategyData: strategyResponse.data,
            lastStrategyUpdate: new Date().toISOString()
          }
        }
      });

    } catch (error) {
      console.error(`❌ [AUTO STRATEGY] Error generating strategy for ${company.name}:`, error);
      throw error;
    }
  }

  /**
   * Parse company size from string or number
   */
  private parseCompanySize(size: any): number {
    if (typeof size === 'number') return size;
    if (!size) return 0;
    
    const sizeStr = String(size).toLowerCase();
    const match = sizeStr.match(/(\d{1,3}(?:,\d{3})*)/);
    if (match) {
      return parseInt(match[1].replace(/,/g, ''), 10);
    }
    const rangeMatch = sizeStr.match(/(\d+)\s*-\s*(\d+)/);
    if (rangeMatch) {
      return parseInt(rangeMatch[2], 10);
    }
    if (sizeStr.includes('10000+') || sizeStr.includes('enterprise')) return 10000;
    if (sizeStr.includes('5000+') || sizeStr.includes('large-enterprise')) return 5000;
    if (sizeStr.includes('1000+') || sizeStr.includes('large')) return 1000;
    if (sizeStr.includes('500+') || sizeStr.includes('medium-enterprise')) return 500;
    if (sizeStr.includes('200+') || sizeStr.includes('medium')) return 200;
    if (sizeStr.includes('50+') || sizeStr.includes('small')) return 50;
    return 0;
  }

  private determineGrowthStage(company: any): 'startup' | 'growth' | 'mature' | 'declining' {
    const age = company.foundedYear ? 
      new Date().getFullYear() - company.foundedYear : null;
    const size = this.parseCompanySize(company.size || company.employeeCount);
    const revenue = company.revenue || 0;

    // For large companies, default to mature if age is unknown
    if (size >= 1000 && revenue > 100000000) {
      if (age === null || age === 0) return 'mature';
      if (age >= 10) return 'mature';
      return 'growth';
    }

    // For medium companies
    if (size >= 500) {
      if (age === null || age === 0) return 'mature';
      if (age >= 10) return 'mature';
      return 'growth';
    }

    // For smaller companies, use age if available
    if (age === null || age === 0) {
      if (size < 50) return 'startup';
      if (size < 500) return 'growth';
      return 'mature';
    }

    // Standard logic with age data
    if (age < 3 && size < 50) return 'startup';
    if (age < 10 && size < 500) return 'growth';
    if (age >= 10 && size >= 500) return 'mature';
    
    // Only return declining for old companies with small size (indicating contraction)
    if (age > 20 && size < 100 && revenue < 1000000) return 'declining';
    
    // Default to mature for established companies
    return 'mature';
  }

  private determineMarketPosition(company: any): 'leader' | 'challenger' | 'follower' | 'niche' {
    const size = this.parseCompanySize(company.size || company.employeeCount);
    const revenue = company.revenue || 0;
    const globalRank = company.globalRank || 999999;

    // Global leaders based on rank
    if (globalRank <= 1000) return 'leader';
    
    // Large companies with significant revenue are challengers or leaders
    if (size >= 10000 || revenue >= 1000000000) return 'leader'; // $1B+ revenue = leader
    if (size >= 1000 || revenue >= 100000000) return 'challenger'; // $100M+ revenue = challenger
    
    // Medium companies
    if (size >= 500) return 'challenger';
    if (size >= 100) return 'follower';
    
    // Small companies
    return 'niche';
  }

  /**
   * Infer industry category from industry string
   * Does NOT default to Technology/SaaS
   */
  private inferIndustryCategory(industry: string): string | null {
    if (!industry) return null;
    
    const industryLower = industry.toLowerCase();
    
    // Utility/Energy sector - check FIRST before technology
    if (industryLower.includes('utility') || 
        industryLower.includes('energy') || 
        industryLower.includes('power') || 
        industryLower.includes('electric') ||
        industryLower.includes('utilities') ||
        industryLower.includes('electrical')) {
      return 'Utilities/Energy';
    }
    
    // Healthcare
    if (industryLower.includes('healthcare') || 
        industryLower.includes('health') || 
        industryLower.includes('hospital') || 
        industryLower.includes('medical')) {
      return 'Healthcare';
    }
    
    // Financial Services
    if (industryLower.includes('bank') || 
        industryLower.includes('financial') || 
        industryLower.includes('insurance') || 
        industryLower.includes('finance')) {
      return 'Financial Services';
    }
    
    // Technology/SaaS - only if explicitly technology-related
    if (industryLower.includes('software') || 
        industryLower.includes('saas') ||
        industryLower.includes('it services') ||
        industryLower.includes('information technology')) {
      // Only return Technology/SaaS if it's clearly tech-related
      // Don't match generic "technology" as it could be in company names
      if (industryLower.includes('software') || 
          industryLower.includes('saas') ||
          industryLower.includes('it services') ||
          industryLower.includes('information technology')) {
        return 'Technology/SaaS';
      }
    }
    
    // Manufacturing
    if (industryLower.includes('manufacturing') || 
        industryLower.includes('manufacturer')) {
      return 'Manufacturing';
    }
    
    // Retail
    if (industryLower.includes('retail') || 
        industryLower.includes('e-commerce') || 
        industryLower.includes('ecommerce')) {
      return 'Retail/E-commerce';
    }
    
    // Real Estate
    if (industryLower.includes('real estate') || 
        industryLower.includes('title') || 
        industryLower.includes('property')) {
      return 'Real Estate';
    }
    
    // Education
    if (industryLower.includes('education') || 
        industryLower.includes('school') || 
        industryLower.includes('university')) {
      return 'Education';
    }
    
    // Government
    if (industryLower.includes('government') || 
        industryLower.includes('public sector')) {
      return 'Government/Public Sector';
    }
    
    // Professional Services
    if (industryLower.includes('consulting') || 
        industryLower.includes('professional services') || 
        industryLower.includes('legal') ||
        industryLower.includes('law')) {
      return 'Professional Services';
    }
    
    // Non-Profit
    if (industryLower.includes('non-profit') || 
        industryLower.includes('nonprofit') || 
        industryLower.includes('non profit')) {
      return 'Non-Profit';
    }
    
    // If no match, return null (don't default to Technology/SaaS)
    return null;
  }

  /**
   * Infer industry from company name when industry field is missing
   * Helps identify utilities/energy companies like "Minnesota Power"
   */
  private inferIndustryFromName(companyName: string): string | null {
    if (!companyName) return null;
    
    const nameLower = companyName.toLowerCase();
    
    // Utility/Energy keywords in company name
    if (nameLower.includes('power') || 
        nameLower.includes('energy') || 
        nameLower.includes('electric') ||
        nameLower.includes('utility') ||
        nameLower.includes('utilities') ||
        nameLower.includes('energy') ||
        nameLower.includes('gas') ||
        nameLower.includes('water') ||
        nameLower.includes('steam')) {
      return 'Utilities/Energy';
    }
    
    // Healthcare keywords
    if (nameLower.includes('health') || 
        nameLower.includes('hospital') || 
        nameLower.includes('medical') ||
        nameLower.includes('clinic')) {
      return 'Healthcare';
    }
    
    // Financial keywords
    if (nameLower.includes('bank') || 
        nameLower.includes('financial') || 
        nameLower.includes('insurance') ||
        nameLower.includes('credit union')) {
      return 'Financial Services';
    }
    
    // Don't infer Technology/SaaS from name alone - too risky
    // Return null if no clear match
    return null;
  }

  async populateStrategiesForNewCompany(companyId: string): Promise<boolean> {
    try {
      const company = await prisma.companies.findFirst({
        where: { id: companyId, deletedAt: null }
      });

      if (!company) {
        console.error(`❌ [AUTO STRATEGY] Company ${companyId} not found`);
        return false;
      }

      await this.populateStrategyForCompany(company);
      console.log(`✅ [AUTO STRATEGY] Generated strategy for new company ${company.name}`);
      return true;

    } catch (error) {
      console.error(`❌ [AUTO STRATEGY] Error generating strategy for new company ${companyId}:`, error);
      return false;
    }
  }
}

export const autoStrategyPopulationService = new AutoStrategyPopulationService();
