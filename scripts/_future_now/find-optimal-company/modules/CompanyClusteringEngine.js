/**
 * Company Clustering Engine
 *
 * Takes a universe of companies and clusters them into:
 * - PULL (5%): Would be weird NOT to buy - active blocked demand
 * - CONSIDERATION (15%): Project exists, but urgency is moderate
 * - NOT_IN_MARKET (80%): No evidence of prioritized project now
 *
 * Uses the PULL framework to make classifications credible and defensible.
 *
 * Key principle: "Focus on the bullseye - people with PULL buy without convincing"
 */

const { PullSignalDetector } = require('./PullSignalDetector');

class CompanyClusteringEngine {
  constructor(config) {
    this.productContext = config.productContext;
    this.coresignalApiKey = process.env.CORESIGNAL_API_KEY;
    this.claudeApiKey = process.env.ANTHROPIC_API_KEY;

    // Initialize PULL detector
    this.pullDetector = new PullSignalDetector({
      productContext: this.productContext,
      model: config.model || 'claude-sonnet-4-5-20250514'
    });

    // Clustering configuration
    this.config = {
      batchSize: config.batchSize || 10,
      delayBetweenBatches: config.delayBetweenBatches || 2000,
      enrichmentLevel: config.enrichmentLevel || 'standard', // 'minimal', 'standard', 'comprehensive'
      useAI: config.useAI ?? true
    };

    // Results tracking
    this.results = {
      totalCompanies: 0,
      clusters: {
        PULL: [],
        CONSIDERATION: [],
        NOT_IN_MARKET: []
      },
      statistics: {
        pullPercentage: 0,
        considerationPercentage: 0,
        notInMarketPercentage: 0,
        avgPullScore: 0,
        avgConfidence: 0
      },
      creditsUsed: {
        coresignal: 0,
        claude: 0
      },
      errors: [],
      startTime: null,
      endTime: null
    };
  }

  /**
   * Cluster a universe of companies
   * @param {Array} companies - Array of companies to cluster (can be IDs or full objects)
   * @param {object} options - Clustering options
   * @returns {object} Clustering results
   */
  async clusterCompanies(companies, options = {}) {
    console.log(`\n Starting company clustering for ${companies.length} companies...`);
    console.log(` Product: ${this.productContext.productName}`);
    console.log(` Target PULL: ~5% | Consideration: ~15% | Not-In-Market: ~80%\n`);

    this.results.startTime = new Date().toISOString();
    this.results.totalCompanies = companies.length;

    const totalBatches = Math.ceil(companies.length / this.config.batchSize);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIdx = batchIndex * this.config.batchSize;
      const endIdx = Math.min(startIdx + this.config.batchSize, companies.length);
      const batch = companies.slice(startIdx, endIdx);

      console.log(`   Processing batch ${batchIndex + 1}/${totalBatches} (${batch.length} companies)`);

      await this.processBatch(batch, options);

      // Progress update
      const processed = endIdx;
      const pullCount = this.results.clusters.PULL.length;
      const considerationCount = this.results.clusters.CONSIDERATION.length;

      console.log(`     Progress: ${processed}/${companies.length} | PULL: ${pullCount} | Consideration: ${considerationCount}`);

      // Delay between batches
      if (batchIndex < totalBatches - 1) {
        await this.delay(this.config.delayBetweenBatches);
      }
    }

    // Calculate final statistics
    this.calculateStatistics();

    this.results.endTime = new Date().toISOString();

    console.log(`\n Clustering complete!`);
    this.printSummary();

    return this.results;
  }

  /**
   * Process a batch of companies
   */
  async processBatch(batch, options) {
    for (const company of batch) {
      try {
        // 1. Get or enrich company data
        const companyData = await this.getCompanyData(company, options);

        if (!companyData) {
          this.results.errors.push({
            company: company.name || company.company_name || company,
            error: 'Failed to get company data'
          });
          continue;
        }

        // 2. Get enrichment data (job postings, funding, etc.)
        const enrichmentData = await this.getEnrichmentData(companyData, options);

        // 3. Detect PULL signals
        const pullAnalysis = await this.pullDetector.detectPullSignals(
          companyData,
          enrichmentData
        );

        // 4. Add to appropriate cluster
        this.addToCluster(companyData, pullAnalysis);

        // Track credits
        if (enrichmentData._coresignalCredits) {
          this.results.creditsUsed.coresignal += enrichmentData._coresignalCredits;
        }

      } catch (error) {
        console.error(`     Error processing ${company.name || company}: ${error.message}`);
        this.results.errors.push({
          company: company.name || company.company_name || company,
          error: error.message
        });
      }
    }
  }

  /**
   * Get company data (from input or fetch from API)
   */
  async getCompanyData(company, options) {
    // If already a full company object, use it
    if (company.employees_count || company.company_name) {
      return company;
    }

    // If it's just an ID, we need to fetch
    if (typeof company === 'string' || typeof company === 'number') {
      return await this.fetchCompanyFromCoresignal(company);
    }

    // If it's a minimal object, enrich it
    if (company.id && !company.employees_count) {
      return await this.fetchCompanyFromCoresignal(company.id);
    }

    return company;
  }

  /**
   * Fetch company from Coresignal
   */
  async fetchCompanyFromCoresignal(companyId) {
    if (!this.coresignalApiKey) {
      throw new Error('CORESIGNAL_API_KEY not set');
    }

    try {
      const response = await fetch(
        `https://api.coresignal.com/cdapi/v2/company_multi_source/collect/${companyId}`,
        {
          method: 'GET',
          headers: {
            'apikey': this.coresignalApiKey.trim(),
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Coresignal API error: ${response.status}`);
      }

      this.results.creditsUsed.coresignal++;
      return await response.json();

    } catch (error) {
      console.error(`Failed to fetch company ${companyId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Get enrichment data for a company
   * Uses cost-effective signals: job postings, funding, tech stack
   */
  async getEnrichmentData(company, options) {
    const enrichmentData = {
      _coresignalCredits: 0
    };

    const level = this.config.enrichmentLevel;

    // Always include: funding data (free from company profile)
    enrichmentData.fundingData = {
      lastRoundDate: company.last_funding_round_date,
      lastRoundAmount: company.last_funding_round_amount_raised,
      totalFunding: company.company_total_funding_amount,
      fundingType: company.last_funding_round_type
    };

    // Standard: Add job posting analysis
    if (level === 'standard' || level === 'comprehensive') {
      enrichmentData.jobPostings = await this.getJobPostingSignals(company);
    }

    // Standard: Recent hires detection (from employee growth)
    enrichmentData.growthSignals = {
      employeeGrowth: company.employees_count_change_yearly_percentage,
      activeJobCount: company.active_job_postings_count || 0
    };

    // Comprehensive: Add tech stack analysis (if available)
    if (level === 'comprehensive') {
      enrichmentData.techStack = await this.getTechStackSignals(company);
    }

    return enrichmentData;
  }

  /**
   * Get job posting signals (cost-effective via preview API)
   */
  async getJobPostingSignals(company) {
    if (!this.coresignalApiKey || !company.linkedin_url) {
      return [];
    }

    try {
      // Use preview API for cost-effectiveness
      const searchQuery = {
        query: {
          bool: {
            must: [
              {
                match: {
                  'job_url': company.linkedin_url
                }
              }
            ]
          }
        }
      };

      const response = await fetch(
        'https://api.coresignal.com/cdapi/v2/job_multi_source/search/es_dsl/preview?items_per_page=10',
        {
          method: 'POST',
          headers: {
            'apikey': this.coresignalApiKey.trim(),
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(searchQuery)
        }
      );

      if (!response.ok) {
        return [];
      }

      const jobs = await response.json();
      return Array.isArray(jobs) ? jobs : [];

    } catch (error) {
      console.error(`Job posting fetch failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Get tech stack signals
   */
  async getTechStackSignals(company) {
    // For now, extract from company description
    const description = (company.description || '').toLowerCase();

    const techIndicators = {
      modern: ['aws', 'gcp', 'azure', 'kubernetes', 'docker', 'react', 'typescript'],
      legacy: ['on-premise', 'legacy', 'mainframe', 'cobol'],
      automation: ['automation', 'ai', 'machine learning', 'devops', 'cicd']
    };

    const detected = {
      modern: techIndicators.modern.filter(t => description.includes(t)),
      legacy: techIndicators.legacy.filter(t => description.includes(t)),
      automation: techIndicators.automation.filter(t => description.includes(t))
    };

    return {
      tools: [...detected.modern, ...detected.automation],
      maturityLevel: detected.modern.length > 2 ? 'high' :
                     detected.legacy.length > 0 ? 'low' : 'medium'
    };
  }

  /**
   * Add company to appropriate cluster based on PULL analysis
   */
  addToCluster(company, pullAnalysis) {
    const classification = pullAnalysis.classification.category;

    const clusteredCompany = {
      id: company.id,
      name: company.name || company.company_name,
      industry: company.industry,
      employeeCount: company.employees_count,
      website: company.website,
      linkedinUrl: company.linkedin_url,
      pullScore: pullAnalysis.pullScore,
      classification: classification,
      scores: pullAnalysis.scores,
      topSignals: this.getTopSignals(pullAnalysis.signals),
      rationale: pullAnalysis.rationale.summary,
      confidence: pullAnalysis.confidence,
      analyzedAt: pullAnalysis.analyzedAt
    };

    this.results.clusters[classification].push(clusteredCompany);
  }

  /**
   * Get top signals from PULL analysis
   */
  getTopSignals(signals) {
    const allSignals = [
      ...signals.project,
      ...signals.urgency,
      ...signals.list,
      ...signals.limitations
    ].sort((a, b) => b.strength - a.strength);

    return allSignals.slice(0, 3).map(s => ({
      type: s.type,
      signal: s.signal,
      strength: s.strength,
      evidence: s.evidence
    }));
  }

  /**
   * Calculate final statistics
   */
  calculateStatistics() {
    const total = this.results.totalCompanies;
    const pullCount = this.results.clusters.PULL.length;
    const considerationCount = this.results.clusters.CONSIDERATION.length;
    const notInMarketCount = this.results.clusters.NOT_IN_MARKET.length;

    this.results.statistics = {
      pullPercentage: total > 0 ? ((pullCount / total) * 100).toFixed(1) : 0,
      considerationPercentage: total > 0 ? ((considerationCount / total) * 100).toFixed(1) : 0,
      notInMarketPercentage: total > 0 ? ((notInMarketCount / total) * 100).toFixed(1) : 0,

      avgPullScore: this.calculateAvgScore(this.results.clusters.PULL),
      avgConfidence: this.calculateAvgConfidence(),

      pullCount,
      considerationCount,
      notInMarketCount
    };
  }

  /**
   * Calculate average PULL score for a cluster
   */
  calculateAvgScore(cluster) {
    if (cluster.length === 0) return 0;
    const sum = cluster.reduce((acc, c) => acc + c.pullScore, 0);
    return Math.round(sum / cluster.length);
  }

  /**
   * Calculate average confidence across all analyzed companies
   */
  calculateAvgConfidence() {
    const allCompanies = [
      ...this.results.clusters.PULL,
      ...this.results.clusters.CONSIDERATION,
      ...this.results.clusters.NOT_IN_MARKET
    ];

    if (allCompanies.length === 0) return 0;
    const sum = allCompanies.reduce((acc, c) => acc + c.confidence, 0);
    return Math.round(sum / allCompanies.length);
  }

  /**
   * Print summary of clustering results
   */
  printSummary() {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  COMPANY CLUSTERING RESULTS - PULL FRAMEWORK`);
    console.log(`${'='.repeat(60)}\n`);

    console.log(` Total Companies Analyzed: ${this.results.totalCompanies}`);
    console.log(` Average Confidence: ${this.results.statistics.avgConfidence}%\n`);

    console.log(` CLUSTERS:`);
    console.log(`   PULL (Would be weird NOT to buy):`);
    console.log(`     Count: ${this.results.statistics.pullCount} (${this.results.statistics.pullPercentage}%)`);
    console.log(`     Avg Score: ${this.results.statistics.avgPullScore}`);

    console.log(`\n   CONSIDERATION (Project exists, moderate urgency):`);
    console.log(`     Count: ${this.results.statistics.considerationCount} (${this.results.statistics.considerationPercentage}%)`);

    console.log(`\n   NOT IN MARKET (No prioritized project now):`);
    console.log(`     Count: ${this.results.statistics.notInMarketCount} (${this.results.statistics.notInMarketPercentage}%)`);

    console.log(`\n CREDITS USED:`);
    console.log(`   Coresignal: ${this.results.creditsUsed.coresignal}`);
    console.log(`   Claude AI: ${this.results.creditsUsed.claude}`);

    if (this.results.errors.length > 0) {
      console.log(`\n ERRORS: ${this.results.errors.length}`);
    }

    // Show top PULL companies
    if (this.results.clusters.PULL.length > 0) {
      console.log(`\n TOP PULL COMPANIES (Immediate Priority):`);
      this.results.clusters.PULL.slice(0, 5).forEach((company, i) => {
        console.log(`   ${i + 1}. ${company.name} (Score: ${company.pullScore})`);
        console.log(`      Rationale: ${company.rationale.substring(0, 100)}...`);
      });
    }

    console.log(`\n${'='.repeat(60)}\n`);
  }

  /**
   * Export results to JSON
   */
  exportResults() {
    return {
      summary: {
        productContext: this.productContext,
        totalCompanies: this.results.totalCompanies,
        statistics: this.results.statistics,
        creditsUsed: this.results.creditsUsed,
        startTime: this.results.startTime,
        endTime: this.results.endTime
      },
      clusters: {
        PULL: this.results.clusters.PULL,
        CONSIDERATION: this.results.clusters.CONSIDERATION,
        NOT_IN_MARKET: this.results.clusters.NOT_IN_MARKET
      },
      errors: this.results.errors
    };
  }

  /**
   * Get PULL companies for immediate action
   */
  getPullCompanies() {
    return this.results.clusters.PULL.sort((a, b) => b.pullScore - a.pullScore);
  }

  /**
   * Get consideration companies for nurture campaigns
   */
  getConsiderationCompanies() {
    return this.results.clusters.CONSIDERATION.sort((a, b) => b.pullScore - a.pullScore);
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { CompanyClusteringEngine };
