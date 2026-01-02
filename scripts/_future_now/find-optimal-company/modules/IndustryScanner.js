/**
 * Industry Scanner Module
 *
 * Scans companies within an industry using Coresignal and ranks them by PULL score.
 * Uses a 2-stage approach:
 * 1. Pre-screen all companies using profile data (free - no extra API calls)
 * 2. Deep OBP analysis on top candidates only (cost-controlled)
 *
 * Leverages existing buyer group scripts for champion detection.
 */

const fetch = require('node-fetch');

class IndustryScanner {
  constructor(config = {}) {
    this.coresignalApiKey = config.coresignalApiKey || process.env.CORESIGNAL_API_KEY;
    this.productContext = config.productContext || {};
    this.verbose = config.verbose !== false;

    // Default scanning limits
    this.defaults = {
      maxCompanies: 50,           // Max companies to scan from Coresignal
      deepAnalysisCount: 20,     // How many to run full OBP on
      batchSize: 10,             // Batch size for API calls
      batchDelayMs: 3000,        // Delay between batches
      minEmployees: 50,          // Minimum company size
      maxEmployees: 5000,        // Maximum company size
      preScreenThreshold: 40     // Minimum pre-screen score for deep analysis
    };

    // Industry presets for Coresignal
    this.industryPresets = {
      'B2B SaaS': ['Computer Software', 'Internet', 'Information Technology and Services'],
      'FinTech': ['Financial Services', 'Banking', 'Financial Technology'],
      'HealthTech': ['Hospital & Health Care', 'Medical Devices', 'Biotechnology'],
      'Cybersecurity': ['Computer & Network Security', 'Information Technology and Services'],
      'E-commerce': ['Retail', 'Internet', 'Consumer Goods'],
      'Marketing Tech': ['Marketing and Advertising', 'Internet'],
      'HR Tech': ['Human Resources', 'Staffing and Recruiting'],
      'Legal Tech': ['Law Practice', 'Legal Services']
    };
  }

  /**
   * Scan an industry for companies with PULL
   * @param {object} options - Scan options
   * @returns {object} Ranked results with PULL scores
   */
  async scanIndustry(options = {}) {
    const startTime = Date.now();
    const {
      industry,
      employeeRange = { min: this.defaults.minEmployees, max: this.defaults.maxEmployees },
      location,
      maxCompanies = this.defaults.maxCompanies,
      deepAnalysisCount = this.defaults.deepAnalysisCount,
      preScreenThreshold = this.defaults.preScreenThreshold,
      onProgress
    } = options;

    this.log(`\n${'═'.repeat(60)}`);
    this.log(`  INDUSTRY PULL SCANNER`);
    this.log(`${'═'.repeat(60)}`);
    this.log(`Industry: ${industry}`);
    this.log(`Employee range: ${employeeRange.min}-${employeeRange.max}`);
    this.log(`Location: ${location || 'Global'}`);
    this.log(`Max companies: ${maxCompanies}`);
    this.log(`Deep analysis count: ${deepAnalysisCount}`);

    const progress = {
      stage: 'discovery',
      totalCompanies: 0,
      scanned: 0,
      preScreened: 0,
      deepAnalyzed: 0,
      currentCompany: null
    };

    const emitProgress = () => {
      if (onProgress) onProgress({ ...progress });
    };

    try {
      // Stage 1: Company Discovery
      this.log('\n📍 Stage 1: Company Discovery');
      progress.stage = 'discovery';
      emitProgress();

      const companyIds = await this.discoverCompanies({
        industry,
        employeeRange,
        location,
        maxCompanies
      });

      progress.totalCompanies = companyIds.length;
      this.log(`   Found ${companyIds.length} companies matching criteria`);
      emitProgress();

      if (companyIds.length === 0) {
        return {
          success: true,
          totalScanned: 0,
          totalAnalyzed: 0,
          rankings: [],
          message: 'No companies found matching criteria',
          scanDuration: Date.now() - startTime
        };
      }

      // Stage 2: Profile Collection
      this.log('\n📦 Stage 2: Collecting Company Profiles');
      progress.stage = 'collection';
      emitProgress();

      const profiles = await this.collectProfiles(companyIds, (scanned) => {
        progress.scanned = scanned;
        emitProgress();
      });

      this.log(`   Collected ${profiles.length} profiles`);

      // Stage 3: Pre-Screening (free - using profile data only)
      this.log('\n🔍 Stage 3: Pre-Screening Companies');
      progress.stage = 'pre_screening';
      emitProgress();

      const preScreenedCompanies = this.preScreenCompanies(profiles);
      progress.preScreened = preScreenedCompanies.length;
      emitProgress();

      this.log(`   Pre-screened ${preScreenedCompanies.length} companies`);
      this.log(`   Top candidates: ${preScreenedCompanies.slice(0, 5).map(c => c.name).join(', ')}`);

      // Filter to top N for deep analysis
      const topCandidates = preScreenedCompanies
        .filter(c => c.preScreenScore >= preScreenThreshold)
        .slice(0, deepAnalysisCount);

      this.log(`   ${topCandidates.length} companies qualify for deep analysis (score >= ${preScreenThreshold})`);

      // Stage 4: Deep OBP Analysis
      this.log('\n🧠 Stage 4: Deep OBP Analysis');
      progress.stage = 'deep_analysis';
      emitProgress();

      const deepResults = await this.runDeepAnalysis(topCandidates, (analyzed, currentCompany) => {
        progress.deepAnalyzed = analyzed;
        progress.currentCompany = currentCompany;
        emitProgress();
      });

      // Stage 5: Compile Rankings
      this.log('\n📊 Stage 5: Compiling PULL Rankings');
      progress.stage = 'complete';

      const rankings = this.compileRankings(preScreenedCompanies, deepResults);

      const scanDuration = Date.now() - startTime;
      this.log(`\n✅ Scan complete in ${(scanDuration / 1000).toFixed(1)}s`);
      this.log(`   Total companies scanned: ${profiles.length}`);
      this.log(`   Deep analysis completed: ${deepResults.length}`);
      this.log(`   Top PULL score: ${rankings[0]?.pullScore || 0}/100`);

      emitProgress();

      return {
        success: true,
        totalScanned: profiles.length,
        totalAnalyzed: deepResults.length,
        rankings,
        costUsed: {
          coresignalCredits: 2 + profiles.length + (topCandidates.length * 2), // search + profiles + employees
          claudeTokens: topCandidates.length * 2000 // ~2000 tokens per analysis
        },
        scanDuration
      };

    } catch (error) {
      this.log(`\n❌ Scan failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        scanDuration: Date.now() - startTime
      };
    }
  }

  /**
   * Discover companies via Coresignal ES DSL search
   */
  async discoverCompanies({ industry, employeeRange, location, maxCompanies }) {
    if (!this.coresignalApiKey) {
      this.log('   [MOCK] No Coresignal API key - returning mock data');
      return this.getMockCompanyIds(maxCompanies);
    }

    // Build ES DSL query
    const query = this.buildESQuery({
      industry,
      employeeRange,
      location,
      maxCompanies
    });

    try {
      const response = await fetch(
        'https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl?items_per_page=' + maxCompanies,
        {
          method: 'POST',
          headers: {
            'apikey': this.coresignalApiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(query)
        }
      );

      if (!response.ok) {
        throw new Error(`Coresignal search failed: ${response.status}`);
      }

      const data = await response.json();

      // Handle different response formats
      if (Array.isArray(data)) {
        return data;
      } else if (data.hits?.hits) {
        return data.hits.hits.map(hit => hit._id || hit._source?.id);
      } else if (data.hits) {
        return data.hits;
      }

      return [];

    } catch (error) {
      this.log(`   Coresignal search error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Build Elasticsearch DSL query for Coresignal
   */
  buildESQuery({ industry, employeeRange, location, maxCompanies }) {
    // Map industry name to Coresignal industries
    const industries = this.industryPresets[industry] || [industry];

    const query = {
      query: {
        bool: {
          filter: [
            // Employee count range
            {
              range: {
                employees_count: {
                  gte: employeeRange.min,
                  lte: employeeRange.max
                }
              }
            }
          ],
          should: [
            // Industry matching - use should for flexibility
            ...industries.map(ind => ({
              match: { industry: ind }
            })),
            // Prefer companies with recent funding
            {
              range: {
                last_funding_round_date: {
                  gte: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 2 years
                }
              }
            },
            // Prefer growing companies
            {
              range: {
                employees_count_change_yearly_percentage: { gte: 10 }
              }
            }
          ],
          minimum_should_match: 1
        }
      },
      sort: [
        { employees_count_change_yearly_percentage: 'desc' },
        { _score: 'desc' }
      ],
      size: maxCompanies
    };

    // Add location filter if specified
    if (location) {
      query.query.bool.filter.push({
        term: { 'headquarter_country.exact': location }
      });
    }

    return query;
  }

  /**
   * Collect company profiles in batches
   */
  async collectProfiles(companyIds, onProgress) {
    if (!this.coresignalApiKey) {
      return this.getMockProfiles(companyIds.length);
    }

    const profiles = [];
    const batchSize = this.defaults.batchSize;
    const totalBatches = Math.ceil(companyIds.length / batchSize);

    for (let i = 0; i < totalBatches; i++) {
      const batch = companyIds.slice(i * batchSize, (i + 1) * batchSize);

      this.log(`   Batch ${i + 1}/${totalBatches}: Collecting ${batch.length} profiles`);

      const batchPromises = batch.map(id => this.collectSingleProfile(id));
      const batchResults = await Promise.all(batchPromises);

      profiles.push(...batchResults.filter(p => p !== null));

      if (onProgress) onProgress(profiles.length);

      // Rate limiting
      if (i < totalBatches - 1) {
        await this.delay(this.defaults.batchDelayMs);
      }
    }

    return profiles;
  }

  /**
   * Collect a single company profile
   */
  async collectSingleProfile(companyId) {
    try {
      const response = await fetch(
        `https://api.coresignal.com/cdapi/v2/company_multi_source/collect/${companyId}`,
        {
          headers: {
            'apikey': this.coresignalApiKey,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Collect failed: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      this.log(`   ⚠️ Failed to collect ${companyId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Pre-screen companies using profile data only (free tier)
   * Calculates a preliminary tension score without employee data
   */
  preScreenCompanies(profiles) {
    const scored = profiles.map(profile => {
      const score = this.calculatePreScreenScore(profile);
      return {
        ...profile,
        preScreenScore: score.total,
        preScreenFactors: score.factors
      };
    });

    // Sort by pre-screen score
    scored.sort((a, b) => b.preScreenScore - a.preScreenScore);

    return scored;
  }

  /**
   * Calculate pre-screen score from company profile
   * Based on signals we can detect without employee data
   */
  calculatePreScreenScore(profile) {
    let score = 50; // Base score
    const factors = [];

    // 1. GROWTH TENSION - Fast-growing companies have more urgency
    const growthRate = profile.employees_count_change_yearly_percentage || 0;
    if (growthRate >= 50) {
      score += 25;
      factors.push({ factor: 'hyper_growth', impact: 25, value: `${growthRate}% YoY` });
    } else if (growthRate >= 25) {
      score += 15;
      factors.push({ factor: 'high_growth', impact: 15, value: `${growthRate}% YoY` });
    } else if (growthRate >= 10) {
      score += 8;
      factors.push({ factor: 'moderate_growth', impact: 8, value: `${growthRate}% YoY` });
    } else if (growthRate < 0) {
      score -= 10;
      factors.push({ factor: 'negative_growth', impact: -10, value: `${growthRate}% YoY` });
    }

    // 2. RESOURCE TENSION - Recent funding creates deployment pressure
    const fundingDate = profile.last_funding_round_date;
    if (fundingDate) {
      const daysSinceFunding = Math.floor(
        (Date.now() - new Date(fundingDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceFunding <= 180) {
        score += 20;
        factors.push({ factor: 'recent_funding', impact: 20, value: `${daysSinceFunding} days ago` });
      } else if (daysSinceFunding <= 365) {
        score += 10;
        factors.push({ factor: 'funding_year', impact: 10, value: `${daysSinceFunding} days ago` });
      }
    }

    // 3. FUNDING STAGE PRESSURE
    const fundingStage = profile.last_funding_round_type?.toLowerCase() || '';
    if (fundingStage.includes('series c') || fundingStage.includes('series d')) {
      score += 15;
      factors.push({ factor: 'late_stage', impact: 15, value: fundingStage });
    } else if (fundingStage.includes('series b')) {
      score += 12;
      factors.push({ factor: 'series_b', impact: 12, value: fundingStage });
    } else if (fundingStage.includes('series a')) {
      score += 8;
      factors.push({ factor: 'series_a', impact: 8, value: fundingStage });
    }

    // 4. COMPANY SIZE SWEET SPOT - 100-500 often have scaling challenges
    const employees = profile.employees_count || 0;
    if (employees >= 100 && employees <= 500) {
      score += 10;
      factors.push({ factor: 'scaling_size', impact: 10, value: `${employees} employees` });
    } else if (employees >= 500 && employees <= 1000) {
      score += 5;
      factors.push({ factor: 'mid_market', impact: 5, value: `${employees} employees` });
    }

    // 5. HIRING ACTIVITY (via employee count change)
    if (growthRate > 30) {
      score += 5;
      factors.push({ factor: 'active_hiring', impact: 5, value: 'Rapid team growth' });
    }

    return {
      total: Math.min(100, Math.max(0, Math.round(score))),
      factors
    };
  }

  /**
   * Run deep OBP analysis on top candidates
   */
  async runDeepAnalysis(candidates, onProgress) {
    const results = [];

    for (let i = 0; i < candidates.length; i++) {
      const company = candidates[i];

      this.log(`   [${i + 1}/${candidates.length}] Analyzing ${company.name || company.company_name}...`);

      if (onProgress) onProgress(i + 1, company.name || company.company_name);

      try {
        // Fetch employees for this company
        const employees = await this.fetchCompanyEmployees(company.id);

        // Run OBP analysis
        const obpResult = await this.runOBPAnalysis({
          ...company,
          employees
        });

        results.push({
          company: company.name || company.company_name,
          domain: company.website || company.website_url,
          coresignalId: company.id,
          preScreenScore: company.preScreenScore,
          pullScore: obpResult.pullScore || company.preScreenScore,
          classification: obpResult.classification || this.classifyFromScore(company.preScreenScore),
          champion: obpResult.champion,
          tensions: obpResult.tensions,
          quickInsight: obpResult.executiveSummary?.split('\n')[0] || this.generateQuickInsight(company),
          analyzed: true
        });

      } catch (error) {
        this.log(`   ⚠️ Analysis failed for ${company.name}: ${error.message}`);

        // Still include in results with pre-screen data
        results.push({
          company: company.name || company.company_name,
          domain: company.website || company.website_url,
          coresignalId: company.id,
          preScreenScore: company.preScreenScore,
          pullScore: company.preScreenScore, // Fall back to pre-screen
          classification: this.classifyFromScore(company.preScreenScore),
          champion: null,
          tensions: null,
          quickInsight: this.generateQuickInsight(company),
          analyzed: false,
          error: error.message
        });
      }

      // Small delay between analyses
      if (i < candidates.length - 1) {
        await this.delay(1000);
      }
    }

    return results;
  }

  /**
   * Fetch employees for a company
   */
  async fetchCompanyEmployees(companyId) {
    if (!this.coresignalApiKey) {
      return this.getMockEmployees();
    }

    try {
      const response = await fetch(
        `https://api.coresignal.com/cdapi/v1/company/${companyId}/employees`,
        {
          method: 'POST',
          headers: {
            'apikey': this.coresignalApiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            filters: { current_employee: true },
            limit: 200
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Employee fetch failed: ${response.status}`);
      }

      const data = await response.json();
      return data.employees || data || [];

    } catch (error) {
      this.log(`   ⚠️ Could not fetch employees: ${error.message}`);
      return [];
    }
  }

  /**
   * Run OBP analysis on a company with employee data
   */
  async runOBPAnalysis(companyData) {
    try {
      // Dynamically import OBP modules
      const { OBPPipeline } = require('./OBPPipeline');

      const pipeline = new OBPPipeline({
        productContext: this.productContext,
        verbose: false
      });

      // Run analysis with full data
      return await pipeline.analyze(companyData);

    } catch (error) {
      // If OBP fails, return basic analysis
      return {
        success: false,
        pullScore: companyData.preScreenScore || 50,
        classification: this.classifyFromScore(companyData.preScreenScore || 50),
        error: error.message
      };
    }
  }

  /**
   * Compile final rankings
   */
  compileRankings(preScreenedCompanies, deepResults) {
    // Create a map of deep results
    const deepResultMap = new Map();
    for (const result of deepResults) {
      deepResultMap.set(result.company, result);
    }

    // Combine pre-screened with deep results
    const rankings = preScreenedCompanies.map((company, index) => {
      const deepResult = deepResultMap.get(company.name || company.company_name);

      if (deepResult) {
        return {
          rank: 0, // Will be set after sorting
          ...deepResult
        };
      }

      // Return pre-screen only data
      return {
        rank: 0,
        company: company.name || company.company_name,
        domain: company.website || company.website_url,
        coresignalId: company.id,
        pullScore: company.preScreenScore,
        classification: this.classifyFromScore(company.preScreenScore),
        champion: null,
        tensions: null,
        quickInsight: this.generateQuickInsight(company),
        analyzed: false,
        preScreenFactors: company.preScreenFactors
      };
    });

    // Sort by PULL score
    rankings.sort((a, b) => b.pullScore - a.pullScore);

    // Assign ranks
    rankings.forEach((r, i) => {
      r.rank = i + 1;
    });

    return rankings;
  }

  /**
   * Classify PULL level from score
   */
  classifyFromScore(score) {
    if (score >= 80) return { category: 'HIGH_PULL', description: 'Strong buying signals' };
    if (score >= 65) return { category: 'PULL', description: 'Active consideration likely' };
    if (score >= 50) return { category: 'HIGH_CONSIDERATION', description: 'Moderate interest potential' };
    if (score >= 35) return { category: 'CONSIDERATION', description: 'May be receptive' };
    return { category: 'LOW_PRIORITY', description: 'Not actively in market' };
  }

  /**
   * Generate quick insight from profile data
   */
  generateQuickInsight(company) {
    const insights = [];

    const growth = company.employees_count_change_yearly_percentage;
    if (growth >= 30) {
      insights.push(`Growing ${growth}% YoY`);
    }

    const funding = company.last_funding_round_type;
    const fundingDate = company.last_funding_round_date;
    if (funding && fundingDate) {
      const daysSince = Math.floor(
        (Date.now() - new Date(fundingDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSince <= 365) {
        insights.push(`${funding} ${daysSince < 180 ? 'recently' : 'this year'}`);
      }
    }

    const employees = company.employees_count;
    if (employees) {
      insights.push(`${employees} employees`);
    }

    return insights.join(' • ') || 'Profile data available';
  }

  // =============================================================================
  // Mock Data for Testing Without API Keys
  // =============================================================================

  getMockCompanyIds(count) {
    return Array.from({ length: count }, (_, i) => `mock-${i + 1}`);
  }

  getMockProfiles(count) {
    const mockCompanies = [
      { name: 'GrowthCo', growthRate: 45, funding: 'Series B', daysSinceFunding: 90, employees: 180 },
      { name: 'ScaleUp Inc', growthRate: 35, funding: 'Series A', daysSinceFunding: 200, employees: 95 },
      { name: 'TechVenture', growthRate: 60, funding: 'Series C', daysSinceFunding: 60, employees: 320 },
      { name: 'CloudFirst', growthRate: 25, funding: 'Series B', daysSinceFunding: 400, employees: 250 },
      { name: 'DataDriven', growthRate: 40, funding: 'Series B', daysSinceFunding: 150, employees: 200 },
      { name: 'SecureTech', growthRate: 55, funding: 'Series A', daysSinceFunding: 120, employees: 110 },
      { name: 'AIStartup', growthRate: 70, funding: 'Series A', daysSinceFunding: 45, employees: 75 },
      { name: 'FinanceApp', growthRate: 30, funding: 'Series C', daysSinceFunding: 180, employees: 450 },
      { name: 'HealthPlatform', growthRate: 28, funding: 'Series B', daysSinceFunding: 300, employees: 280 },
      { name: 'MarketingCloud', growthRate: 15, funding: 'Series A', daysSinceFunding: 500, employees: 140 }
    ];

    return mockCompanies.slice(0, count).map((mock, i) => ({
      id: `mock-${i + 1}`,
      name: mock.name,
      company_name: mock.name,
      employees_count: mock.employees,
      employees_count_change_yearly_percentage: mock.growthRate,
      last_funding_round_type: mock.funding,
      last_funding_round_date: new Date(Date.now() - mock.daysSinceFunding * 24 * 60 * 60 * 1000).toISOString(),
      industry: 'Computer Software',
      website: `https://${mock.name.toLowerCase().replace(/\s/g, '')}.com`
    }));
  }

  getMockEmployees() {
    return [
      { name: 'John Smith', title: 'VP of Engineering', start_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() },
      { name: 'Sarah Johnson', title: 'Head of Security', start_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() },
      { name: 'Michael Chen', title: 'Director of Compliance', start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() },
      { name: 'Emily Williams', title: 'CFO', start_date: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString() },
      { name: 'David Brown', title: 'CTO', start_date: new Date(Date.now() - 500 * 24 * 60 * 60 * 1000).toISOString() }
    ];
  }

  // =============================================================================
  // Utilities
  // =============================================================================

  log(message) {
    if (this.verbose) {
      console.log(message);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { IndustryScanner };
