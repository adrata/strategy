#!/usr/bin/env node

/**
 * Find Optimal Buyer Group - AI-Powered Buyer Qualification Script
 * 
 * This script identifies the best companies to target using AI-powered
 * buyer qualification scoring, growth signals, and adoption maturity profiling.
 * 
 * Features:
 * - AI-powered Buyer Readiness Scoring
 * - Firmographic + Growth Signal filtering
 * - Adoption Maturity Profile detection
 * - Optional buying influences integration
 * - Progress tracking and resumability
 * - Modern ES2024+ JavaScript best practices
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class OptimalBuyerGroupFinder {
  constructor(options = {}) {
    this.prisma = new PrismaClient();
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.claudeApiKey = process.env.ANTHROPIC_API_KEY;
    this.workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1'; // Notary Everyday workspace
    
    // Search mode: 'criteria' or 'similar_to_company'
    this.searchMode = options.searchMode || 'criteria';
    
    // Buyer Qualification Criteria (not "ICP")
    this.qualificationCriteria = {
      industries: options.industries || [],
      sizeRange: options.sizeRange || '50-200 employees',
      locations: options.locations || [],
      keywords: options.keywords || [],
      minGrowthRate: options.minGrowthRate || 10,
      companyType: options.companyType || 'Privately Held',
      b2bOnly: options.b2bOnly ?? true
    };
    
    // For 'similar_to_company' mode
    this.referenceCompanyId = options.referenceCompanyId;
    
    // Buyer Readiness Scoring Weights (Updated for Phase 2)
    this.scoringWeights = {
      firmographicFit: options.weightFirmographic || 0.15,      // Reduced
      growthSignals: options.weightGrowth || 0.15,             // Reduced
      technologyAdoption: options.weightTechnology || 0.10,    // Reduced
      adoptionMaturity: options.weightAdoption || 0.10,        // Reduced
      buyerGroupQuality: options.weightBuyerGroup || 0.60      // NEW: Highest weight - real data!
    };
    
    // NEW: Phase 2 sampling configuration
    this.enableBuyerGroupSampling = options.enableBuyerGroupSampling ?? true;
    this.employeeSampleSize = options.employeeSampleSize || 25; // Per company
    this.sampleDepartments = options.sampleDepartments || [
      'Sales and Business Development',
      'Operations',
      'Product Management',
      'Marketing'
    ];
    
    // Results configuration
    this.maxResults = options.maxResults || 50;
    this.minReadinessScore = options.minReadinessScore || 70;
    this.useAI = options.useAI ?? true;
    
    // Optional: Find buying influences (decision-makers)
    this.findBuyingInfluences = options.findBuyingInfluences || false;
    this.buyingInfluenceRoles = options.buyingInfluenceRoles || ['CEO', 'CTO', 'VP'];
    
    // Processing settings
    this.batchSize = 10; // Collect companies in batches
    this.delayBetweenBatches = 3000; // 3 seconds delay
    this.delayBetweenRequests = 1000; // 1 second between individual requests
    this.progressFile = '_future_now/optimal-buyer-group-progress.json';
    
    this.results = {
      searchCriteria: this.qualificationCriteria,
      searchDate: new Date().toISOString(),
      totalCandidates: 0,
      qualifiedBuyers: 0,
      optimalBuyerGroups: [],
      creditsUsed: {
        search: 0,
        collect: 0,
        person_search: 0
      },
      errors: [],
      startTime: new Date().toISOString()
    };

    if (!this.apiKey) {
      console.error('❌ CORESIGNAL_API_KEY environment variable is required');
      process.exit(1);
    }

    if (this.searchMode === 'criteria' && this.qualificationCriteria.industries.length === 0) {
      console.error('❌ At least one industry must be specified for criteria search mode');
      process.exit(1);
    }
  }

  /**
   * Main execution method
   */
  async run() {
    try {
      console.log(`🎯 Starting Optimal Buyer Group Search`);
      console.log(`📊 Search Mode: ${this.searchMode}`);
      console.log(`🔍 Max Results: ${this.maxResults}`);
      console.log(`🤖 AI Scoring: ${this.useAI ? 'Enabled' : 'Disabled'}`);
      console.log(`👥 Find Buying Influences: ${this.findBuyingInfluences ? 'Yes' : 'No'}`);
      
      await this.loadProgress();
      
      // Step 1: Build Elasticsearch query
      const searchQuery = this.buildOptimalBuyerQuery();
      console.log(`🔍 Built search query with ${Object.keys(searchQuery.query.bool.must).length} must filters`);
      
      // Step 2: Search Coresignal for candidate companies
      const candidateIds = await this.searchCoresignalCompanies(searchQuery);
      console.log(`📊 Found ${candidateIds.length} candidate companies`);
      
      if (candidateIds.length === 0) {
        console.log('❌ No candidate companies found with current criteria');
        return;
      }
      
      // Step 3: Collect full profiles for top candidates
      const companies = await this.collectCompanyProfiles(candidateIds.slice(0, 100)); // Limit to top 100 for scoring
      console.log(`📋 Collected ${companies.length} company profiles`);
      
      // Step 4: AI scoring for buyer readiness (Phase 1)
      const scoredCompanies = await this.scoreBuyerReadiness(companies);
      console.log(`🎯 Scored ${scoredCompanies.length} companies (Phase 1)`);
      
      // Step 5: Phase 2 - Buyer Group Quality Sampling 🆕
      let finalCompanies = scoredCompanies;
      if (this.enableBuyerGroupSampling && this.claudeApiKey) {
        console.log(`🔍 Phase 2: Sampling buyer group quality for top companies...`);
        finalCompanies = await this.sampleBuyerGroupQuality(scoredCompanies);
        console.log(`📊 Phase 2 completed: Analyzed buyer group quality for ${finalCompanies.length} companies`);
      }
      
      // Step 6: Filter and rank by final buyer readiness score
      const qualifiedBuyers = finalCompanies
        .filter(company => company.buyerReadinessScore >= this.minReadinessScore)
        .sort((a, b) => b.buyerReadinessScore - a.buyerReadinessScore)
        .slice(0, this.maxResults);
      
      console.log(`✅ Found ${qualifiedBuyers.length} qualified buyers (score >= ${this.minReadinessScore})`);
      
      // Step 6: Optional - Find buying influences
      if (this.findBuyingInfluences && qualifiedBuyers.length > 0) {
        console.log(`👥 Finding buying influences for top companies...`);
        await this.findBuyingInfluencesForCompanies(qualifiedBuyers);
      }
      
      // Update results
      this.results.totalCandidates = candidateIds.length;
      this.results.qualifiedBuyers = qualifiedBuyers.length;
      this.results.optimalBuyerGroups = qualifiedBuyers;
      
      // Add Phase 2 metrics
      this.results.phase1_market_filtering = {
        candidateCompanies: candidateIds.length,
        creditsUsed: 1
      };
      
      this.results.phase2_buyer_group_sampling = {
        companiesSampled: finalCompanies.length,
        employeesAnalyzed: finalCompanies.reduce((sum, company) => 
          sum + (company.buyerGroupQuality?.employeesAnalyzed || 0), 0),
        creditsUsed: this.results.creditsUsed.preview_search || 0
      };
      
      // Save final progress
      await this.saveProgress();
      
      console.log(`✅ Optimal Buyer Group search completed successfully`);
      console.log(`📈 Results: ${qualifiedBuyers.length} optimal buyer groups found`);
      console.log(`💳 Credits Used: ${this.results.creditsUsed.search} search, ${this.results.creditsUsed.collect} collect`);
      
    } catch (error) {
      console.error('❌ Optimal Buyer Group search failed:', error.message);
      this.results.errors.push({
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack
      });
      throw error;
    } finally {
      await this.saveProgress();
      await this.prisma.$disconnect();
    }
  }

  /**
   * Build Elasticsearch query for optimal buyer search
   */
  buildOptimalBuyerQuery() {
    if (this.searchMode === 'similar_to_company') {
      return this.buildSimilarCompanyQuery();
    }
    
    return {
      "query": {
        "bool": {
          "must": [
            // Industry filter
            ...(this.qualificationCriteria.industries.length > 0 ? [
              { "terms": { "company_industry": this.qualificationCriteria.industries } }
            ] : []),
            
            // Size range filter
            ...(this.qualificationCriteria.sizeRange ? [
              { "match": { "company_size_range": this.qualificationCriteria.sizeRange } }
            ] : []),
            
            // Growth signal filter
            {
              "range": {
                "company_employees_count_change_yearly_percentage": {
                  "gte": this.qualificationCriteria.minGrowthRate
                }
              }
            },
            
            // B2B focus
            ...(this.qualificationCriteria.b2bOnly ? [
              { "term": { "company_is_b2b": 1 } }
            ] : [])
          ],
          
          "should": [
            // Boost for technology keywords
            ...(this.qualificationCriteria.keywords.length > 0 ? [
              { 
                "terms": { 
                  "company_categories_and_keywords": this.qualificationCriteria.keywords,
                  "boost": 2.0
                } 
              }
            ] : []),
            
            // Boost for recent activity (buyer readiness signal)
            {
              "range": {
                "company_last_updated_at": {
                  "gte": "now-90d",
                  "boost": 1.5
                }
              }
            },
            
            // Boost for funding activity (growth signal)
            {
              "exists": {
                "field": "company_last_funding_round_date",
                "boost": 1.3
              }
            }
          ],
          
          "filter": [
            // Location filter
            ...(this.qualificationCriteria.locations.length > 0 ? [
              { "terms": { "company_hq_country": this.qualificationCriteria.locations } }
            ] : [])
          ]
        }
      },
      "size": 100  // Get top 100 candidates for AI scoring
    };
  }

  /**
   * Build query for similar company search
   */
  buildSimilarCompanyQuery() {
    // This would need the reference company's data from database
    // For now, return a basic query structure
    return {
      "query": {
        "bool": {
          "must": [
            { "range": { "company_employees_count_change_yearly_percentage": { "gte": 5 } } },
            { "term": { "company_is_b2b": 1 } }
          ]
        }
      },
      "size": 100
    };
  }

  /**
   * Search Coresignal for candidate companies
   */
  async searchCoresignalCompanies(searchQuery) {
    try {
      const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl?items_per_page=100', {
        method: 'POST',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(searchQuery)
      });

      if (!searchResponse.ok) {
        throw new Error(`Coresignal search failed: ${searchResponse.status} ${searchResponse.statusText}`);
      }

      const searchData = await searchResponse.json();
      this.results.creditsUsed.search++;

      // Handle different response formats
      let companyIds = [];
      if (Array.isArray(searchData)) {
        companyIds = searchData;
      } else if (searchData.hits?.hits) {
        companyIds = searchData.hits.hits.map(hit => hit._id || hit._source?.id);
      } else if (searchData.hits) {
        companyIds = searchData.hits;
      }

      return companyIds;

    } catch (error) {
      console.error(`❌ Search failed:`, error.message);
      this.results.errors.push({
        timestamp: new Date().toISOString(),
        operation: 'search',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Collect full company profiles from Coresignal
   */
  async collectCompanyProfiles(companyIds) {
    const companies = [];
    const totalBatches = Math.ceil(companyIds.length / this.batchSize);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * this.batchSize;
      const endIndex = Math.min(startIndex + this.batchSize, companyIds.length);
      const batch = companyIds.slice(startIndex, endIndex);
      
      console.log(`📦 Collecting batch ${batchIndex + 1}/${totalBatches} (${batch.length} companies)`);
      
      const batchPromises = batch.map(async (companyId) => {
        try {
          const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/company_multi_source/collect/${companyId}`, {
            method: 'GET',
            headers: {
              'apikey': this.apiKey,
              'Accept': 'application/json'
            }
          });

          this.results.creditsUsed.collect++;

          if (!collectResponse.ok) {
            throw new Error(`Coresignal collect failed: ${collectResponse.status} ${collectResponse.statusText}`);
          }

          const profileData = await collectResponse.json();
          return profileData;

        } catch (error) {
          console.error(`❌ Failed to collect profile ${companyId}:`, error.message);
          return null;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      companies.push(...batchResults.filter(company => company !== null));
      
      // Delay between batches
      if (batchIndex < totalBatches - 1) {
        await this.delay(this.delayBetweenBatches);
      }
    }
    
    return companies;
  }

  /**
   * Score companies for buyer readiness using AI
   */
  async scoreBuyerReadiness(companies) {
    const scoredCompanies = [];
    
    for (const company of companies) {
      try {
        console.log(`🎯 Scoring: ${company.company_name}`);
        
        let scores;
        if (this.useAI && this.claudeApiKey) {
          scores = await this.scoreBuyerReadinessWithAI(company);
        } else {
          scores = this.scoreBuyerReadinessFallback(company);
        }
        
        const scoredCompany = {
          ...company,
          ...scores,
          processedAt: new Date().toISOString()
        };
        
        scoredCompanies.push(scoredCompany);
        
        // Delay between scoring requests
        await this.delay(this.delayBetweenRequests);
        
      } catch (error) {
        console.error(`❌ Failed to score ${company.company_name}:`, error.message);
        this.results.errors.push({
          timestamp: new Date().toISOString(),
          company: company.company_name,
          operation: 'scoring',
          error: error.message
        });
      }
    }
    
    return scoredCompanies;
  }

  /**
   * Score buyer readiness using Claude AI
   */
  async scoreBuyerReadinessWithAI(company) {
    try {
      const prompt = `Analyze this company as a qualified buyer for our Go-To-Buyer Platform:

Company Profile:
- Name: ${company.company_name}
- Industry: ${company.company_industry}
- Size: ${company.company_employees_count} employees (${company.company_size_range})
- Growth Rate: ${company.company_employees_count_change_yearly_percentage}%
- Founded: ${company.company_founded_year}
- Technology Keywords: ${company.company_categories_and_keywords?.join(', ') || 'None'}
- Recent Funding: ${company.company_last_funding_round_date || 'None'}
- Funding Amount: ${company.company_last_funding_round_amount_raised || 'N/A'}
- Revenue: ${company.company_annual_revenue_source_1 || 'Unknown'}
- Location: ${company.company_hq_city}, ${company.company_hq_state}, ${company.company_hq_country}

Buyer Qualification Criteria:
${JSON.stringify(this.qualificationCriteria, null, 2)}

Score this company (0-100) as a qualified buyer in these categories:

1. **Firmographic Fit**: How well do they match our qualification criteria?
2. **Growth Signals**: Are they growing, well-funded, and expanding?
3. **Technology Adoption**: Do they embrace new technology and innovation?
4. **Adoption Maturity**: What's their buyer maturity profile?

Return ONLY valid JSON:
{
  "firmographic_fit_score": <number 0-100>,
  "growth_signals_score": <number 0-100>,
  "technology_adoption_score": <number 0-100>,
  "adoption_maturity_score": <number 0-100>,
  "buyer_readiness_score": <number 0-100>,
  "reasoning": "<2-3 sentence explanation>",
  "adoption_maturity_profile": "trailblazer|early_adopter|pragmatist|conservative|traditionalist",
  "key_strengths": ["<strength 1>", "<strength 2>"],
  "buyer_readiness_indicators": ["<indicator 1>", "<indicator 2>"]
}`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.claudeApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 1500,
          temperature: 0.3,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.content[0].text;
      
      // Parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }
      
      const scores = JSON.parse(jsonMatch[0]);
      
      // Validate structure
      if (!scores.firmographic_fit_score || !scores.buyer_readiness_score) {
        throw new Error('Invalid JSON structure from Claude');
      }
      
      return {
        firmographicFitScore: scores.firmographic_fit_score,
        growthSignalsScore: scores.growth_signals_score,
        technologyAdoptionScore: scores.technology_adoption_score,
        adoptionMaturityScore: scores.adoption_maturity_score,
        buyerReadinessScore: scores.buyer_readiness_score,
        reasoning: scores.reasoning,
        adoptionMaturityProfile: scores.adoption_maturity_profile,
        keyStrengths: scores.key_strengths || [],
        buyerReadinessIndicators: scores.buyer_readiness_indicators || []
      };
      
    } catch (error) {
      console.error(`❌ Claude AI scoring failed for ${company.company_name}:`, error.message);
      console.log('🔄 Falling back to rule-based scoring');
      return this.scoreBuyerReadinessFallback(company);
    }
  }

  /**
   * Fallback scoring when AI is unavailable
   */
  scoreBuyerReadinessFallback(company) {
    // Simple rule-based scoring
    let firmographicFit = 50;
    let growthSignals = 50;
    let technologyAdoption = 50;
    let adoptionMaturity = 50;
    
    // Firmographic fit scoring
    if (this.qualificationCriteria.industries.includes(company.company_industry)) {
      firmographicFit += 30;
    }
    if (company.company_size_range === this.qualificationCriteria.sizeRange) {
      firmographicFit += 20;
    }
    
    // Growth signals scoring
    if (company.company_employees_count_change_yearly_percentage > 20) {
      growthSignals += 30;
    }
    if (company.company_last_funding_round_date) {
      growthSignals += 20;
    }
    
    // Technology adoption scoring
    if (company.company_categories_and_keywords?.length > 0) {
      technologyAdoption += 30;
    }
    if (company.company_followers_count > 1000) {
      technologyAdoption += 20;
    }
    
    // Adoption maturity scoring (based on company age and growth)
    const companyAge = new Date().getFullYear() - parseInt(company.company_founded_year);
    if (companyAge >= 2 && companyAge <= 10 && company.company_employees_count_change_yearly_percentage > 15) {
      adoptionMaturity = 80; // Trailblazer
    } else if (companyAge <= 5 && company.company_employees_count_change_yearly_percentage > 10) {
      adoptionMaturity = 70; // Early Adopter
    } else {
      adoptionMaturity = 50; // Pragmatist
    }
    
    const buyerReadinessScore = Math.round(
      firmographicFit * this.scoringWeights.firmographicFit +
      growthSignals * this.scoringWeights.growthSignals +
      technologyAdoption * this.scoringWeights.technologyAdoption +
      adoptionMaturity * this.scoringWeights.adoptionMaturity
    );
    
    return {
      firmographicFitScore: Math.min(100, firmographicFit),
      growthSignalsScore: Math.min(100, growthSignals),
      technologyAdoptionScore: Math.min(100, technologyAdoption),
      adoptionMaturityScore: Math.min(100, adoptionMaturity),
      buyerReadinessScore: Math.min(100, buyerReadinessScore),
      reasoning: `Rule-based scoring: ${company.company_industry} company with ${company.company_employees_count} employees`,
      adoptionMaturityProfile: adoptionMaturity >= 80 ? 'trailblazer' : adoptionMaturity >= 70 ? 'early_adopter' : 'pragmatist',
      keyStrengths: [
        `${company.company_employees_count_change_yearly_percentage}% growth rate`,
        company.company_last_funding_round_date ? 'Recent funding' : 'Established company'
      ],
      buyerReadinessIndicators: [
        company.company_employees_count_change_yearly_percentage > 15 ? 'High growth' : 'Stable growth',
        company.company_categories_and_keywords?.length > 0 ? 'Tech-focused' : 'Traditional'
      ]
    };
  }

  /**
   * Phase 2: Sample buyer group quality using Preview API
   */
  async sampleBuyerGroupQuality(companies) {
    const companiesWithBuyerGroupQuality = [];
    
    for (const company of companies) {
      try {
        console.log(`🔍 Sampling buyer group for ${company.company_name}...`);
        
        // Sample employees from target departments
        const previewEmployees = await this.sampleCompanyEmployees(company);
        
        if (previewEmployees.length === 0) {
          console.log(`⚠️ No employees found for ${company.company_name}, skipping buyer group analysis`);
          companiesWithBuyerGroupQuality.push(company);
          continue;
        }
        
        // Analyze buyer group quality with AI
        const buyerGroupQuality = await this.analyzeBuyerGroupQuality(company, previewEmployees);
        
        // Update company with buyer group quality scores
        const updatedCompany = {
          ...company,
          buyerGroupQuality,
          // Recalculate final score with buyer group quality
          buyerReadinessScore: this.calculateFinalScore(company, buyerGroupQuality)
        };
        
        companiesWithBuyerGroupQuality.push(updatedCompany);
        
        // Delay between companies
        await this.delay(this.delayBetweenRequests);
        
      } catch (error) {
        console.error(`❌ Failed to sample buyer group for ${company.company_name}:`, error.message);
        companiesWithBuyerGroupQuality.push(company);
      }
    }
    
    return companiesWithBuyerGroupQuality;
  }

  /**
   * Sample employees from company using Preview API
   */
  async sampleCompanyEmployees(company) {
    const allEmployees = [];
    
    for (const department of this.sampleDepartments) {
      try {
        const departmentEmployees = await this.searchEmployeesByDepartment(
          company.company_linkedin_url, 
          department
        );
        allEmployees.push(...departmentEmployees);
      } catch (error) {
        console.error(`❌ Failed to search ${department} for ${company.company_name}:`, error.message);
      }
    }
    
    // Remove duplicates and limit sample size
    const uniqueEmployees = this.removeDuplicateEmployees(allEmployees);
    return uniqueEmployees.slice(0, this.employeeSampleSize);
  }

  /**
   * Search employees by department using Preview API
   */
  async searchEmployeesByDepartment(companyLinkedInUrl, department) {
    const searchQuery = {
      "query": {
        "bool": {
          "must": [
            {
              "nested": {
                "path": "experience",
                "query": {
                  "bool": {
                    "must": [
                      {
                        "match": {
                          "experience.company_linkedin_url": companyLinkedInUrl
                        }
                      },
                      {
                        "term": {
                          "experience.active_experience": 1
                        }
                      },
                      {
                        "match": {
                          "experience.active_experience_department": department
                        }
                      }
                    ]
                  }
                }
              }
            }
          ]
        }
      }
    };

    const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl/preview?items_per_page=10', {
      method: 'POST',
      headers: {
        'apikey': this.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(searchQuery)
    });

    if (!searchResponse.ok) {
      throw new Error(`Preview search failed: ${searchResponse.status} ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    this.results.creditsUsed.preview_search = (this.results.creditsUsed.preview_search || 0) + 1;

    return Array.isArray(searchData) ? searchData : [];
  }

  /**
   * Remove duplicate employees based on ID
   */
  removeDuplicateEmployees(employees) {
    const seen = new Set();
    return employees.filter(employee => {
      if (seen.has(employee.id)) {
        return false;
      }
      seen.add(employee.id);
      return true;
    });
  }

  /**
   * Analyze buyer group quality using Claude AI
   */
  async analyzeBuyerGroupQuality(company, previewEmployees) {
    try {
      // Calculate department and management level breakdowns
      const departmentCounts = this.calculateDepartmentCounts(previewEmployees);
      const managementLevelCounts = this.calculateManagementLevelCounts(previewEmployees);
      
      const prompt = `Analyze this employee preview data to assess buyer group quality for a Go-To-Buyer Platform:

Company: ${company.company_name} (${company.company_industry})
Employee Sample (${previewEmployees.length} employees from target departments):

${previewEmployees.map(e => `
- ${e.full_name}: ${e.active_experience_title}
  Department: ${e.active_experience_department}
  Management Level: ${e.active_experience_management_level}
  Connections: ${e.connections_count} | Followers: ${e.followers_count}
  Headline: ${e.headline}
`).join('\n')}

Department Breakdown:
${Object.entries(departmentCounts).map(([dept, count]) => `- ${dept}: ${count}`).join('\n')}

Management Level Breakdown:
${Object.entries(managementLevelCounts).map(([level, count]) => `- ${level}: ${count}`).join('\n')}

Score this company's buyer group on:

1. **Pain Signals (0-100)**: Evidence of operational challenges, growth pains, need for solutions
   - Look for: rapid hiring, management gaps, "interim" roles, department imbalances
   
2. **Innovation Score (0-100)**: Forward-thinking, pioneering culture
   - Look for: modern titles (Growth, Revenue Ops, Data Science), high LinkedIn engagement
   
3. **Buyer Experience Score (0-100)**: Sophisticated, experienced buyers
   - Look for: senior leaders with modern titles, career progression indicators
   
4. **Buyer Group Structure Score (0-100)**: Ideal composition for enterprise sales
   - Look for: 2-3 VPs, 5-8 Directors, balanced departments, key roles present

5. **Overall Buyer Group Quality Score (0-100)**: Weighted average

Return ONLY valid JSON:
{
  "pain_signal_score": <0-100>,
  "pain_indicators": ["<specific indicator 1>", "<indicator 2>"],
  "innovation_score": <0-100>,
  "innovation_indicators": ["<specific indicator 1>", "<indicator 2>"],
  "buyer_experience_score": <0-100>,
  "experience_indicators": ["<specific indicator 1>", "<indicator 2>"],
  "buyer_group_structure_score": <0-100>,
  "structure_assessment": "<brief assessment>",
  "overall_buyer_group_quality": <0-100>,
  "key_strengths": ["<strength 1>", "<strength 2>"],
  "recommended_personas": ["VP Sales", "Director Revenue Ops"],
  "outreach_priority": "high|medium|low"
}`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.claudeApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 1500,
          temperature: 0.3,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.content[0].text;
      
      // Parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }
      
      const buyerGroupQuality = JSON.parse(jsonMatch[0]);
      
      // Validate structure
      if (!buyerGroupQuality.overall_buyer_group_quality) {
        throw new Error('Invalid JSON structure from Claude');
      }
      
      return buyerGroupQuality;
      
    } catch (error) {
      console.error(`❌ Claude AI buyer group analysis failed for ${company.company_name}:`, error.message);
      console.log('🔄 Falling back to rule-based buyer group analysis');
      return this.analyzeBuyerGroupQualityFallback(company, previewEmployees);
    }
  }

  /**
   * Fallback buyer group quality analysis when AI is unavailable
   */
  analyzeBuyerGroupQualityFallback(company, previewEmployees) {
    const departmentCounts = this.calculateDepartmentCounts(previewEmployees);
    const managementLevelCounts = this.calculateManagementLevelCounts(previewEmployees);
    
    // Simple rule-based scoring
    let painSignalScore = 50;
    let innovationScore = 50;
    let buyerExperienceScore = 50;
    let buyerGroupStructureScore = 50;
    
    // Pain signals: Look for management gaps
    const vpCount = managementLevelCounts['VP-Level'] || 0;
    const directorCount = managementLevelCounts['Director-Level'] || 0;
    if (vpCount === 0 && previewEmployees.length > 10) {
      painSignalScore += 20; // Missing leadership
    }
    
    // Innovation: High LinkedIn engagement
    const avgConnections = previewEmployees.reduce((sum, e) => sum + (e.connections_count || 0), 0) / previewEmployees.length;
    if (avgConnections > 1000) {
      innovationScore += 20;
    }
    
    // Buyer experience: Senior leaders present
    if (vpCount > 0 || directorCount > 2) {
      buyerExperienceScore += 20;
    }
    
    // Structure: Balanced departments
    const salesCount = departmentCounts['Sales and Business Development'] || 0;
    const opsCount = departmentCounts['Operations'] || 0;
    if (salesCount > 0 && opsCount > 0) {
      buyerGroupStructureScore += 20;
    }
    
    const overallQuality = Math.round(
      painSignalScore * 0.25 +
      innovationScore * 0.25 +
      buyerExperienceScore * 0.25 +
      buyerGroupStructureScore * 0.25
    );
    
    return {
      pain_signal_score: Math.min(100, painSignalScore),
      pain_indicators: vpCount === 0 ? ['Missing VP-level leadership'] : [],
      innovation_score: Math.min(100, innovationScore),
      innovation_indicators: avgConnections > 1000 ? ['High LinkedIn engagement'] : [],
      buyer_experience_score: Math.min(100, buyerExperienceScore),
      experience_indicators: vpCount > 0 ? ['Senior leadership present'] : [],
      buyer_group_structure_score: Math.min(100, buyerGroupStructureScore),
      structure_assessment: `VP: ${vpCount}, Directors: ${directorCount}, Sales: ${salesCount}, Ops: ${opsCount}`,
      overall_buyer_group_quality: overallQuality,
      key_strengths: ['Rule-based analysis'],
      recommended_personas: ['VP Sales', 'Director Operations'],
      outreach_priority: overallQuality > 70 ? 'high' : overallQuality > 50 ? 'medium' : 'low'
    };
  }

  /**
   * Calculate department counts from employee data
   */
  calculateDepartmentCounts(employees) {
    return employees.reduce((counts, employee) => {
      const dept = employee.active_experience_department || 'Unknown';
      counts[dept] = (counts[dept] || 0) + 1;
      return counts;
    }, {});
  }

  /**
   * Calculate management level counts from employee data
   */
  calculateManagementLevelCounts(employees) {
    return employees.reduce((counts, employee) => {
      const level = employee.active_experience_management_level || 'Unknown';
      counts[level] = (counts[level] || 0) + 1;
      return counts;
    }, {});
  }

  /**
   * Calculate final score with buyer group quality
   */
  calculateFinalScore(company, buyerGroupQuality) {
    const traditionalScore = 
      (company.firmographicFitScore || 50) * this.scoringWeights.firmographicFit +
      (company.growthSignalsScore || 50) * this.scoringWeights.growthSignals +
      (company.technologyAdoptionScore || 50) * this.scoringWeights.technologyAdoption +
      (company.adoptionMaturityScore || 50) * this.scoringWeights.adoptionMaturity;
    
    const buyerGroupScore = buyerGroupQuality.overall_buyer_group_quality * this.scoringWeights.buyerGroupQuality;
    
    return Math.round(traditionalScore + buyerGroupScore);
  }

  /**
   * Find buying influences for companies (optional)
   */
  async findBuyingInfluencesForCompanies(companies) {
    for (const company of companies.slice(0, 10)) { // Limit to top 10 for performance
      try {
        const companyLinkedInUrl = company.company_linkedin_url;
        if (!companyLinkedInUrl) {
          continue;
        }
        
        console.log(`👥 Finding buying influences for ${company.company_name}`);
        
        const influences = [];
        for (const role of this.buyingInfluenceRoles) {
          try {
            // Use similar logic to find_role.js
            const searchQuery = {
              "query": {
                "bool": {
                  "must": [
                    {
                      "nested": {
                        "path": "experience",
                        "query": {
                          "bool": {
                            "must": [
                              {
                                "match": {
                                  "experience.company_linkedin_url": companyLinkedInUrl
                                }
                              },
                              {
                                "term": {
                                  "experience.active_experience": 1
                                }
                              },
                              {
                                "match": {
                                  "experience.position_title": role
                                }
                              }
                            ]
                          }
                        }
                      }
                    }
                  ]
                }
              }
            };

            const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/person_multi_source/search/es_dsl?items_per_page=1', {
              method: 'POST',
              headers: {
                'apikey': this.apiKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify(searchQuery)
            });

            this.results.creditsUsed.person_search++;

            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              if (Array.isArray(searchData) && searchData.length > 0) {
                influences.push({
                  role,
                  personId: searchData[0],
                  found: true
                });
              }
            }
            
            await this.delay(this.delayBetweenRequests);
            
          } catch (error) {
            console.error(`❌ Failed to find ${role} for ${company.company_name}:`, error.message);
          }
        }
        
        company.buyingInfluences = influences;
        
      } catch (error) {
        console.error(`❌ Failed to find buying influences for ${company.company_name}:`, error.message);
      }
    }
  }

  /**
   * Load progress from file
   */
  async loadProgress() {
    try {
      const fs = require('fs');
      if (fs.existsSync(this.progressFile)) {
        const progressData = JSON.parse(fs.readFileSync(this.progressFile, 'utf8'));
        this.results = { ...this.results, ...progressData };
        console.log(`📂 Loaded progress: ${this.results.optimalBuyerGroups?.length || 0} buyer groups found`);
      }
    } catch (error) {
      console.log('📂 No existing progress file found, starting fresh');
    }
  }

  /**
   * Save progress to file
   */
  async saveProgress() {
    try {
      const fs = require('fs');
      const progressData = {
        ...this.results,
        lastSaved: new Date().toISOString()
      };
      
      fs.writeFileSync(this.progressFile, JSON.stringify(progressData, null, 2));
      console.log(`💾 Progress saved to ${this.progressFile}`);
    } catch (error) {
      console.error('❌ Failed to save progress:', error.message);
    }
  }

  /**
   * Utility method for delays
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get final results summary
   */
  getResults() {
    return {
      ...this.results,
      endTime: new Date().toISOString(),
      processingTime: new Date() - new Date(this.results.startTime)
    };
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node find_optimal_buyer_group.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --industries "Software,SaaS"     Industries to target');
    console.log('  --size "50-200 employees"        Company size range');
    console.log('  --location "United States"      Target locations');
    console.log('  --minGrowth 15                   Minimum growth rate (%)');
    console.log('  --maxResults 50                  Maximum results to return');
    console.log('  --minScore 70                    Minimum buyer readiness score');
    console.log('  --find-buying-influences         Find decision-makers');
    console.log('  --roles "CEO,CTO,VP"             Roles to search for');
    console.log('');
    console.log('Examples:');
    console.log('  node find_optimal_buyer_group.js --industries "Software,SaaS" --size "50-200 employees"');
    console.log('  node find_optimal_buyer_group.js --industries "FinTech" --find-buying-influences');
    process.exit(1);
  }
  
  // Parse command line arguments
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];
    
    if (key && value) {
      switch (key) {
        case 'industries':
          options.industries = value.split(',');
          break;
        case 'size':
          options.sizeRange = value;
          break;
        case 'location':
          options.locations = value.split(',');
          break;
        case 'minGrowth':
          options.minGrowthRate = parseInt(value);
          break;
        case 'maxResults':
          options.maxResults = parseInt(value);
          break;
        case 'minScore':
          options.minReadinessScore = parseInt(value);
          break;
        case 'find-buying-influences':
          options.findBuyingInfluences = true;
          i--; // Don't skip next argument
          break;
        case 'roles':
          options.buyingInfluenceRoles = value.split(',');
          break;
      }
    }
  }
  
  const finder = new OptimalBuyerGroupFinder(options);
  
  finder.run()
    .then(() => {
      const results = finder.getResults();
      console.log('\n📊 Final Results:');
      console.log(`✅ Optimal Buyer Groups: ${results.optimalBuyerGroups.length}`);
      console.log(`📈 Total Candidates: ${results.totalCandidates}`);
      console.log(`🎯 Qualified Buyers: ${results.qualifiedBuyers}`);
      console.log(`💳 Credits Used: ${results.creditsUsed.search} search, ${results.creditsUsed.collect} collect`);
      console.log(`⏱️ Processing Time: ${Math.round(results.processingTime / 1000)}s`);
      
      if (results.optimalBuyerGroups.length > 0) {
        console.log('\n🏆 Top 5 Optimal Buyer Groups:');
        results.optimalBuyerGroups.slice(0, 5).forEach((company, index) => {
          console.log(`${index + 1}. ${company.company_name} (${company.buyerReadinessScore}% readiness)`);
          console.log(`   ${company.adoptionMaturityProfile} | ${company.company_industry} | ${company.company_employees_count} employees`);
        });
      }
    })
    .catch(error => {
      console.error('❌ Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = OptimalBuyerGroupFinder;
