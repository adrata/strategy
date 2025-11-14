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

      // Get all companies WITH all related data for rich intelligence
      // We'll filter for companies without strategy data in memory to avoid Prisma JSON path issues
      const allCompanies = await prisma.companies.findMany({
        where: {
          workspaceId,
          deletedAt: null
        },
        include: {
          // Include related people/contacts for comprehensive intelligence
          people: {
            where: { deletedAt: null },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              jobTitle: true,
              email: true,
              phone: true,
              linkedinUrl: true,
              lastAction: true,
              nextAction: true
            },
            take: 50 // Limit to top 50 people
          }
        },
        take: 50 // Process in batches
      });

      // Filter companies without strategy data
      const companies = allCompanies.filter(company => {
        const customFields = company.customFields as any;
        return !customFields || !customFields.strategyData;
      });

      result.companiesProcessed = companies.length;
      console.log(`📊 [AUTO STRATEGY] Found ${companies.length} companies without strategy data (out of ${allCompanies.length} total)`);

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
      console.log(`🔄 [AUTO STRATEGY] Generating rich intelligence for ${company.name} (${company.id})`);

      // Infer target industry from company data, avoiding Technology/SaaS default
      const inferredTargetIndustry = company.customFields?.targetIndustry || 
        (company.industry ? this.inferIndustryCategory(company.industry) : null) ||
        (company.sector ? this.inferIndustryCategory(company.sector) : null) ||
        (company.name ? this.inferIndustryFromName(company.name) : null) ||
        'Unknown';

      // Parse competitors array properly (handle both string and array formats)
      let competitors: string[] = [];
      if (Array.isArray(company.competitors)) {
        competitors = company.competitors;
      } else if (typeof company.competitors === 'string') {
        competitors = company.competitors.split(',').map(c => c.trim()).filter(c => c.length > 0);
      }

      // Extract all enrichment data from customFields
      const customFields = (company.customFields as any) || {};
      const coresignalData = customFields.coresignalData || customFields.coresignal || {};
      const perplexityData = customFields.perplexityData || {};
      const enrichedData = customFields.enrichedData || {};
      
      // Extract CoreSignal growth and change metrics
      const employeesCountChange = coresignalData.employees_count_change || 
                                   coresignalData.employeeCountChange ||
                                   company.employeeCountChange;
      const activeJobPostingsCount = coresignalData.active_job_postings_count || 
                                     coresignalData.activeJobPostingsCount ||
                                     company.activeJobPostings;
      const jobPostingsChange = coresignalData.active_job_postings_count_change ||
                                coresignalData.jobPostingsChange ||
                                company.jobPostingsChange;
      const executiveArrivals = coresignalData.key_executive_arrivals ||
                                coresignalData.keyExecutiveArrivals ||
                                company.executiveArrivals ||
                                [];
      const executiveDepartures = coresignalData.key_executive_departures ||
                                  coresignalData.keyExecutiveDepartures ||
                                  company.executiveDepartures ||
                                  [];
      const fundingRounds = coresignalData.funding_rounds ||
                           coresignalData.fundingRounds ||
                           company.fundingRounds ||
                           [];
      const acquisitions = coresignalData.acquisition_list_source_1 ||
                          coresignalData.acquisitions ||
                          [];
      const employeeReviewsScore = coresignalData.employee_reviews_score_aggregated_change?.current ||
                                  coresignalData.employeeReviewsScore?.current ||
                                  company.employeeReviewsScore?.current;
      const productReviewsScore = coresignalData.product_reviews_score_change?.current ||
                                 coresignalData.productReviewsScore?.current ||
                                 company.productReviewsScore?.current;

      // Extract technology and classification data
      const naicsCodes = company.naicsCodes || coresignalData.naics_codes || [];
      const sicCodes = company.sicCodes || coresignalData.sic_codes || [];
      const technologiesUsed = company.technologiesUsed || coresignalData.technologies_used || [];
      const techStack = company.techStack || coresignalData.tech_stack || [];

      // Format people data for strategy request
      const peopleData = (company.people || []).map((person: any) => ({
        id: person.id,
        firstName: person.firstName || '',
        lastName: person.lastName || '',
        title: person.jobTitle || '',
        email: person.email || null,
        phone: person.phone || null,
        linkedinUrl: person.linkedinUrl || null,
        lastAction: person.lastAction || null,
        nextAction: person.nextAction || null
      }));

      console.log(`📊 [AUTO STRATEGY] Company data summary:`, {
        name: company.name,
        industry: company.industry,
        targetIndustry: inferredTargetIndustry,
        size: this.parseCompanySize(company.size || company.employeeCount),
        revenue: company.revenue || 0,
        peopleCount: peopleData.length,
        competitorsCount: competitors.length,
        hasDescription: !!company.description,
        hasWebsite: !!company.website,
        globalRank: company.globalRank,
        hasCoreSignalData: !!coresignalData && Object.keys(coresignalData).length > 0,
        hasPerplexityData: !!perplexityData && Object.keys(perplexityData).length > 0,
        technologiesCount: technologiesUsed.length,
        naicsCodesCount: naicsCodes.length,
        fundingRoundsCount: fundingRounds.length,
        executiveChangesCount: (executiveArrivals.length + executiveDepartures.length),
        activeJobPostings: activeJobPostingsCount
      });

      // Prepare comprehensive strategy request with ALL available company data
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
        // Pass through ALL real company data for rich AI analysis
        website: company.website || undefined,
        headquarters: company.headquarters || company.hqLocation || company.hqFullAddress || undefined,
        foundedYear: company.foundedYear || undefined,
        isPublic: company.isPublic || undefined,
        sector: company.sector || undefined,
        description: company.description || undefined,
        linkedinFollowers: company.linkedinFollowers || undefined,
        globalRank: company.globalRank || undefined,
        competitors: competitors.length > 0 ? competitors : undefined,
        lastAction: company.lastAction || undefined,
        nextAction: company.nextAction || undefined,
        opportunityStage: company.opportunityStage || undefined,
        opportunityAmount: company.opportunityAmount ? Number(company.opportunityAmount) : undefined,
        // Include enriched data for comprehensive intelligence
        people: peopleData.length > 0 ? peopleData : undefined,
        // CoreSignal enrichment data for rich intelligence
        coresignalData: (coresignalData && Object.keys(coresignalData).length > 0) ? {
          employeesCount: coresignalData.employees_count || coresignalData.employeesCount || company.employeeCount,
          employeesCountChange: employeesCountChange ? {
            current: employeesCountChange.current || employeesCountChange.current || 0,
            changeMonthly: employeesCountChange.change_monthly || employeesCountChange.changeMonthly || 0,
            changeMonthlyPercentage: employeesCountChange.change_monthly_percentage || employeesCountChange.changeMonthlyPercentage || 0,
            changeQuarterly: employeesCountChange.change_quarterly || employeesCountChange.changeQuarterly || 0,
            changeQuarterlyPercentage: employeesCountChange.change_quarterly_percentage || employeesCountChange.changeQuarterlyPercentage || 0,
            changeYearly: employeesCountChange.change_yearly || employeesCountChange.changeYearly || 0,
            changeYearlyPercentage: employeesCountChange.change_yearly_percentage || employeesCountChange.changeYearlyPercentage || 0
          } : undefined,
          activeJobPostingsCount: activeJobPostingsCount,
          activeJobPostingsCountChange: jobPostingsChange ? {
            current: jobPostingsChange.current || 0,
            changeMonthly: jobPostingsChange.change_monthly || 0,
            changeMonthlyPercentage: jobPostingsChange.change_monthly_percentage || 0
          } : undefined,
          keyExecutiveArrivals: Array.isArray(executiveArrivals) ? executiveArrivals.map((arr: any) => ({
            memberFullName: arr.member_full_name || arr.memberFullName || arr.name || '',
            memberPositionTitle: arr.member_position_title || arr.memberPositionTitle || arr.title || '',
            arrivalDate: arr.arrival_date || arr.arrivalDate || arr.date || ''
          })) : undefined,
          keyExecutiveDepartures: Array.isArray(executiveDepartures) ? executiveDepartures.map((dep: any) => ({
            memberFullName: dep.member_full_name || dep.memberFullName || dep.name || '',
            memberPositionTitle: dep.member_position_title || dep.memberPositionTitle || dep.title || '',
            departureDate: dep.departure_date || dep.departureDate || dep.date || ''
          })) : undefined,
          fundingRounds: Array.isArray(fundingRounds) ? fundingRounds.map((fund: any) => ({
            name: fund.name || fund.round_name || '',
            announcedDate: fund.announced_date || fund.announcedDate || fund.date || '',
            amountRaised: fund.amount_raised || fund.amountRaised || 0,
            amountRaisedCurrency: fund.amount_raised_currency || fund.amountRaisedCurrency || 'USD'
          })) : undefined,
          acquisitions: Array.isArray(acquisitions) ? acquisitions.map((acq: any) => ({
            acquireeName: acq.acquiree_name || acq.acquireeName || acq.name || '',
            announcedDate: acq.announced_date || acq.announcedDate || acq.date || '',
            price: acq.price || '',
            currency: acq.currency || 'USD'
          })) : undefined,
          employeeReviewsScore: employeeReviewsScore,
          productReviewsScore: productReviewsScore,
          naicsCodes: naicsCodes.length > 0 ? naicsCodes : undefined,
          sicCodes: sicCodes.length > 0 ? sicCodes : undefined,
          technologiesUsed: technologiesUsed.length > 0 ? technologiesUsed : undefined,
          techStack: techStack.length > 0 ? techStack : undefined
        } : undefined,
        // Additional enrichment fields
        naicsCodes: naicsCodes.length > 0 ? naicsCodes : undefined,
        sicCodes: sicCodes.length > 0 ? sicCodes : undefined,
        technologiesUsed: technologiesUsed.length > 0 ? technologiesUsed : undefined,
        techStack: techStack.length > 0 ? techStack : undefined,
        activeJobPostings: activeJobPostingsCount,
        employeeCountChange: employeesCountChange ? {
          monthly: employeesCountChange.change_monthly || employeesCountChange.changeMonthly,
          quarterly: employeesCountChange.change_quarterly || employeesCountChange.changeQuarterly,
          yearly: employeesCountChange.change_yearly || employeesCountChange.changeYearly
        } : undefined,
        fundingRounds: fundingRounds.length > 0 ? fundingRounds.map((fund: any) => ({
          name: fund.name || fund.round_name || '',
          date: fund.announced_date || fund.announcedDate || fund.date || '',
          amount: fund.amount_raised || fund.amountRaised || 0,
          currency: fund.amount_raised_currency || fund.amountRaisedCurrency || 'USD'
        })) : undefined,
        executiveChanges: (executiveArrivals.length > 0 || executiveDepartures.length > 0) ? {
          arrivals: Array.isArray(executiveArrivals) ? executiveArrivals.map((arr: any) => ({
            name: arr.member_full_name || arr.memberFullName || arr.name || '',
            title: arr.member_position_title || arr.memberPositionTitle || arr.title || '',
            date: arr.arrival_date || arr.arrivalDate || arr.date || ''
          })) : undefined,
          departures: Array.isArray(executiveDepartures) ? executiveDepartures.map((dep: any) => ({
            name: dep.member_full_name || dep.memberFullName || dep.name || '',
            title: dep.member_position_title || dep.memberPositionTitle || dep.title || '',
            date: dep.departure_date || dep.departureDate || dep.date || ''
          })) : undefined
        } : undefined
      };

      console.log(`🤖 [AUTO STRATEGY] Calling Claude AI to generate comprehensive strategy...`);

      // Generate strategy using Claude AI with all rich data
      const strategyResponse = await companyStrategyService.generateCompanyStrategy(strategyRequest);
      
      if (!strategyResponse.success || !strategyResponse.data) {
        throw new Error(strategyResponse.error || 'Failed to generate strategy');
      }

      console.log(`✅ [AUTO STRATEGY] Strategy generated successfully:`, {
        archetype: strategyResponse.data.archetypeName,
        targetIndustry: strategyResponse.data.targetIndustry,
        hasSummary: !!strategyResponse.data.strategySummary,
        recommendationsCount: strategyResponse.data.strategicRecommendations?.length || 0
      });

      // Update company record with strategy data
      await prisma.companies.update({
        where: { id: company.id },
        data: {
          customFields: {
            ...(company.customFields as any || {}),
            strategyData: strategyResponse.data,
            lastStrategyUpdate: new Date().toISOString()
          }
        }
      });

      console.log(`💾 [AUTO STRATEGY] Strategy data saved to database for ${company.name}`);

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
