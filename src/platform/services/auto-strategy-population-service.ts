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
      // Prepare strategy request with company data
      const strategyRequest: CompanyStrategyRequest = {
        companyId: company.id,
        companyName: company.name,
        companyIndustry: company.industry || 'Unknown',
        targetIndustry: company.customFields?.targetIndustry || 'Technology/SaaS',
        companySize: company.size || 0,
        companyRevenue: company.revenue || 0,
        companyAge: company.foundedAt ? 
          Math.floor((Date.now() - new Date(company.foundedAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0,
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

  private determineGrowthStage(company: any): 'startup' | 'growth' | 'mature' | 'declining' {
    const age = company.foundedAt ? 
      Math.floor((Date.now() - new Date(company.foundedAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0;
    const size = company.size || 0;
    const revenue = company.revenue || 0;

    if (age < 3 && size < 50) return 'startup';
    if (age < 10 && size < 500) return 'growth';
    if (age >= 10 && size >= 500) return 'mature';
    return 'declining';
  }

  private determineMarketPosition(company: any): 'leader' | 'challenger' | 'follower' | 'niche' {
    const size = company.size || 0;
    const revenue = company.revenue || 0;
    const globalRank = company.globalRank || 999999;

    if (globalRank <= 1000) return 'leader';
    if (size > 1000 || revenue > 100000000) return 'challenger';
    if (size > 100) return 'follower';
    return 'niche';
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
