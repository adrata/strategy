/**
 * OPTIMAL BUYER FINDER SERVICE
 * 
 * AI-powered buyer qualification service that identifies the best companies to target
 * using two-phase analysis: market filtering + buyer group quality sampling
 */

import { prisma } from '@/platform/database/prisma-client';
import type {
  OptimalBuyerOptions,
  OptimalBuyerResult,
  OptimalCompany,
  CompanyInfo
} from '../types';

export class OptimalBuyerFinder {
  private coresignalApiKey: string;
  private anthropicApiKey: string;
  private delayBetweenRequests = 1000;
  private delayBetweenBatches = 3000;
  private batchSize = 10;

  // Buyer Readiness Scoring Weights
  private scoringWeights = {
    firmographicFit: 0.15,
    growthSignals: 0.15,
    technologyAdoption: 0.10,
    adoptionMaturity: 0.10,
    buyerGroupQuality: 0.60 // Highest weight - real data!
  };

  // Phase 2 sampling configuration
  private employeeSampleSize = 25;
  private sampleDepartments = [
    'Sales and Business Development',
    'Operations',
    'Product Management',
    'Marketing'
  ];

  constructor() {
    this.coresignalApiKey = process.env.CORESIGNAL_API_KEY || '';
    this.anthropicApiKey = process.env.ANTHROPIC_API_KEY || '';

    if (!this.coresignalApiKey) {
      throw new Error('CORESIGNAL_API_KEY environment variable is required');
    }
  }

  /**
   * Find optimal buyer companies using two-phase analysis
   */
  async findOptimalBuyers(options: OptimalBuyerOptions): Promise<OptimalBuyerResult> {
    const startTime = Date.now();
    const {
      industries,
      sizeRange = '50-200 employees',
      locations = [],
      minGrowthRate = 10,
      maxResults = 50,
      minReadinessScore = 70,
      enableBuyerGroupSampling = true,
      employeeSampleSize = 25,
      sampleDepartments = this.sampleDepartments,
      workspaceId
    } = options;

    console.log(`🎯 [OPTIMAL BUYER FINDER] Starting search for industries: ${industries.join(', ')}`);
    console.log(`   Size Range: ${sizeRange}`);
    console.log(`   Max Results: ${maxResults}`);
    console.log(`   Min Score: ${minReadinessScore}`);
    console.log(`   Phase 2 Sampling: ${enableBuyerGroupSampling ? 'Enabled' : 'Disabled'}`);

    try {
      // Phase 1: Market filtering with firmographic + growth signals
      console.log(`🔍 Phase 1: Market filtering...`);
      const candidateCompanies = await this.searchCandidateCompanies({
        industries,
        sizeRange,
        locations,
        minGrowthRate,
        maxResults: 100 // Get more candidates for Phase 2
      });

      console.log(`📊 Found ${candidateCompanies.length} candidate companies`);

      if (candidateCompanies.length === 0) {
        return {
          success: true,
          companies: [],
          processingTime: Date.now() - startTime,
          creditsUsed: { search: 0, preview: 0 }
        };
      }

      // Phase 2: Buyer group quality sampling (if enabled)
      let finalCompanies = candidateCompanies;
      if (enableBuyerGroupSampling && this.anthropicApiKey) {
        console.log(`🔍 Phase 2: Sampling buyer group quality...`);
        finalCompanies = await this.sampleBuyerGroupQuality(
          candidateCompanies,
          employeeSampleSize,
          sampleDepartments
        );
        console.log(`📊 Phase 2 completed: Analyzed ${finalCompanies.length} companies`);
      }

      // Filter and rank by final buyer readiness score
      const qualifiedBuyers = finalCompanies
        .filter(company => company.readinessScore >= minReadinessScore)
        .sort((a, b) => b.readinessScore - a.ranking)
        .slice(0, maxResults);

      console.log(`✅ Found ${qualifiedBuyers.length} qualified buyers (score >= ${minReadinessScore})`);

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        companies: qualifiedBuyers,
        processingTime,
        creditsUsed: {
          search: candidateCompanies.length,
          preview: finalCompanies.reduce((sum, c) => sum + (c.buyerGroupQuality?.employeesAnalyzed || 0), 0)
        }
      };

    } catch (error: any) {
      console.error(`❌ [OPTIMAL BUYER FINDER] Search failed:`, error.message);
      throw error;
    }
  }

  /**
   * Phase 1: Search for candidate companies using Coresignal
   */
  private async searchCandidateCompanies(criteria: {
    industries: string[];
    sizeRange: string;
    locations: string[];
    minGrowthRate: number;
    maxResults: number;
  }): Promise<OptimalCompany[]> {
    const searchQuery = this.buildOptimalBuyerQuery(criteria);
    
    const response = await fetch('https://api.coresignal.com/cdapi/v1/linkedin/company/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.coresignalApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: searchQuery,
        size: criteria.maxResults
      })
    });

    if (!response.ok) {
      throw new Error(`Company search failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const companies = data.data || [];

    // Convert to OptimalCompany format
    return companies.map((company: any, index: number) => ({
      company: {
        name: company.name,
        website: company.website,
        industry: company.industry,
        size: company.employee_count?.toString(),
        coresignalId: company.id
      },
      readinessScore: 0, // Will be calculated in Phase 2
      painSignalScore: 0,
      innovationScore: 0,
      buyerExperienceScore: 0,
      buyerGroupStructureScore: 0,
      ranking: index + 1
    }));
  }

  /**
   * Build Elasticsearch query for optimal buyer search
   */
  private buildOptimalBuyerQuery(criteria: {
    industries: string[];
    sizeRange: string;
    locations: string[];
    minGrowthRate: number;
  }): any {
    const must: any[] = [];

    // Industry filter
    if (criteria.industries.length > 0) {
      must.push({
        terms: {
          'industry.keyword': criteria.industries
        }
      });
    }

    // Size range filter
    if (criteria.sizeRange) {
      const sizeFilter = this.parseSizeRange(criteria.sizeRange);
      if (sizeFilter) {
        must.push({
          range: {
            employee_count: sizeFilter
          }
        });
      }
    }

    // Location filter
    if (criteria.locations.length > 0) {
      must.push({
        terms: {
          'location.keyword': criteria.locations
        }
      });
    }

    // Growth rate filter (if available)
    if (criteria.minGrowthRate > 0) {
      must.push({
        range: {
          growth_rate: {
            gte: criteria.minGrowthRate
          }
        }
      });
    }

    // B2B companies only
    must.push({
      bool: {
        must_not: {
          terms: {
            'industry.keyword': ['Consumer Goods', 'Retail', 'Food & Beverage']
          }
        }
      }
    });

    return {
      bool: {
        must,
        filter: [
          { exists: { field: 'name' } },
          { exists: { field: 'website' } },
          { range: { employee_count: { gte: 10 } } } // Minimum viable size
        ]
      }
    };
  }

  /**
   * Parse size range string into Elasticsearch range
   */
  private parseSizeRange(sizeRange: string): any {
    const range = sizeRange.toLowerCase();
    
    if (range.includes('50-200')) {
      return { gte: 50, lte: 200 };
    } else if (range.includes('200-500')) {
      return { gte: 200, lte: 500 };
    } else if (range.includes('500-1000')) {
      return { gte: 500, lte: 1000 };
    } else if (range.includes('1000+')) {
      return { gte: 1000 };
    } else if (range.includes('enterprise')) {
      return { gte: 1000 };
    } else if (range.includes('mid-market')) {
      return { gte: 200, lte: 1000 };
    } else if (range.includes('smb')) {
      return { gte: 10, lte: 200 };
    }
    
    return null;
  }

  /**
   * Phase 2: Sample buyer group quality for top companies
   */
  private async sampleBuyerGroupQuality(
    companies: OptimalCompany[],
    sampleSize: number,
    departments: string[]
  ): Promise<OptimalCompany[]> {
    const enrichedCompanies: OptimalCompany[] = [];

    for (const company of companies) {
      try {
        console.log(`   🔍 Sampling buyer group for ${company.company.name}...`);
        
        // Sample employees from target departments
        const sampledEmployees = await this.sampleEmployees(
          company.company,
          sampleSize,
          departments
        );

        // Analyze buyer group quality with AI
        const buyerGroupQuality = await this.analyzeBuyerGroupQuality(
          company.company,
          sampledEmployees
        );

        // Calculate final readiness score
        const finalScore = this.calculateFinalReadinessScore(
          company,
          buyerGroupQuality
        );

        enrichedCompanies.push({
          ...company,
          readinessScore: finalScore,
          painSignalScore: buyerGroupQuality.painSignalScore,
          innovationScore: buyerGroupQuality.innovationScore,
          buyerExperienceScore: buyerGroupQuality.buyerExperienceScore,
          buyerGroupStructureScore: buyerGroupQuality.buyerGroupStructureScore,
          buyerGroupQuality
        });

        await this.delay(this.delayBetweenRequests);

      } catch (error: any) {
        console.warn(`   ⚠️ Failed to sample ${company.company.name}: ${error.message}`);
        enrichedCompanies.push(company); // Keep original company
      }
    }

    return enrichedCompanies;
  }

  /**
   * Sample employees from target departments
   */
  private async sampleEmployees(
    company: CompanyInfo,
    sampleSize: number,
    departments: string[]
  ): Promise<any[]> {
    const allEmployees: any[] = [];

    for (const department of departments) {
      try {
        const response = await fetch('https://api.coresignal.com/cdapi/v1/linkedin/employee/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.coresignalApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            company_name: company.name,
            department: department,
            page_size: Math.ceil(sampleSize / departments.length),
            page: 1
          })
        });

        if (response.ok) {
          const data = await response.json();
          allEmployees.push(...(data.data || []));
        }

        await this.delay(500); // Rate limiting

      } catch (error) {
        console.warn(`     ⚠️ Failed to sample ${department}: ${error}`);
      }
    }

    // Remove duplicates and limit to sample size
    const uniqueEmployees = this.removeDuplicates(allEmployees);
    return uniqueEmployees.slice(0, sampleSize);
  }

  /**
   * Analyze buyer group quality using AI
   */
  private async analyzeBuyerGroupQuality(
    company: CompanyInfo,
    employees: any[]
  ): Promise<any> {
    if (!this.anthropicApiKey || employees.length === 0) {
      return {
        painSignalScore: 50,
        innovationScore: 50,
        buyerExperienceScore: 50,
        buyerGroupStructureScore: 50,
        employeesAnalyzed: employees.length
      };
    }

    try {
      const prompt = this.buildBuyerGroupAnalysisPrompt(company, employees);
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.anthropicApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          temperature: 0.1,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`AI analysis failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.content[0].text;
      
      // Parse AI response
      const analysis = JSON.parse(content);
      return {
        ...analysis,
        employeesAnalyzed: employees.length
      };
      
    } catch (error) {
      console.warn('AI analysis failed, using fallback scores:', error);
      return {
        painSignalScore: 50,
        innovationScore: 50,
        buyerExperienceScore: 50,
        buyerGroupStructureScore: 50,
        employeesAnalyzed: employees.length
      };
    }
  }

  /**
   * Build AI prompt for buyer group quality analysis
   */
  private buildBuyerGroupAnalysisPrompt(company: CompanyInfo, employees: any[]): string {
    const employeeData = employees.map(emp => ({
      name: emp.name,
      title: emp.job_title,
      department: emp.department,
      seniority: emp.seniority_level
    }));

    return `Analyze this buyer group for B2B sales potential. Rate each dimension 0-100:

Company: ${company.name} (${company.industry})
Employees Sampled: ${employees.length}

Employee Data:
${JSON.stringify(employeeData, null, 2)}

Rate these dimensions (0-100):

1. PAIN SIGNAL SCORE: Evidence of operational challenges, growth pains, need for solutions
   - Look for: Rapid growth, new roles, operational titles, scaling indicators

2. INNOVATION SCORE: Forward-thinking culture, modern titles, tech adoption
   - Look for: Tech roles, modern titles, innovation indicators

3. BUYER EXPERIENCE SCORE: Sophisticated, experienced buyers with modern roles
   - Look for: Senior titles, B2B experience, decision-making roles

4. BUYER GROUP STRUCTURE SCORE: Ideal composition for enterprise sales
   - Look for: 2-3 VPs, 5-8 Directors, balanced department representation

Return ONLY this JSON:
{
  "painSignalScore": 0-100,
  "innovationScore": 0-100,
  "buyerExperienceScore": 0-100,
  "buyerGroupStructureScore": 0-100,
  "reasoning": "brief explanation"
}`;
  }

  /**
   * Calculate final readiness score combining all factors
   */
  private calculateFinalReadinessScore(
    company: OptimalCompany,
    buyerGroupQuality: any
  ): number {
    const weights = this.scoringWeights;
    
    // Basic firmographic fit (placeholder - would be calculated from company data)
    const firmographicFit = 75;
    
    // Growth signals (placeholder - would be calculated from company data)
    const growthSignals = 70;
    
    // Technology adoption (placeholder - would be calculated from company data)
    const technologyAdoption = 65;
    
    // Adoption maturity (placeholder - would be calculated from company data)
    const adoptionMaturity = 60;
    
    // Buyer group quality (real data from Phase 2)
    const buyerGroupQualityScore = (
      buyerGroupQuality.painSignalScore +
      buyerGroupQuality.innovationScore +
      buyerGroupQuality.buyerExperienceScore +
      buyerGroupQuality.buyerGroupStructureScore
    ) / 4;
    
    // Calculate weighted score
    const finalScore = 
      (firmographicFit * weights.firmographicFit) +
      (growthSignals * weights.growthSignals) +
      (technologyAdoption * weights.technologyAdoption) +
      (adoptionMaturity * weights.adoptionMaturity) +
      (buyerGroupQualityScore * weights.buyerGroupQuality);
    
    return Math.round(Math.min(finalScore, 100));
  }

  /**
   * Remove duplicate employees
   */
  private removeDuplicates(employees: any[]): any[] {
    const seen = new Set();
    return employees.filter(emp => {
      const key = emp.id || emp.linkedin_url || emp.email;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

