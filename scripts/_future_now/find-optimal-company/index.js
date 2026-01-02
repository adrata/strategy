#!/usr/bin/env node

/**
 * Find Optimal Company - PULL Framework Implementation
 *
 * A system to identify the optimal companies to target using the PULL framework.
 *
 * PULL = Blocked Demand = Unavoidable Project meets Unworkable Options
 *
 * P - Project on their to-do list being prioritized NOW
 * U - Urgency - reason it's urgent/unavoidable now
 * L - List of options they're considering
 * L - Limitations of existing options
 *
 * Key Insight: Only ~5% of companies have PULL at any given time.
 * Focus on finding those 5% - they'll "rip your product out of your hands."
 *
 * Usage:
 *   node index.js --analyze-markets --product "Adrata Compliance Automation"
 *   node index.js --cluster-companies --industry "Computer Software" --limit 100
 *   node index.js --full-pipeline --config ./adrata-config.json
 *
 * @author Adrata
 * @version 1.0.0
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Import modules
const { PullSignalDetector } = require('./modules/PullSignalDetector');
const { IndustryAnalyzer } = require('./modules/IndustryAnalyzer');
const { CompanyClusteringEngine } = require('./modules/CompanyClusteringEngine');

class OptimalCompanyFinder {
  constructor(config = {}) {
    this.prisma = new PrismaClient();
    this.coresignalApiKey = process.env.CORESIGNAL_API_KEY;
    this.claudeApiKey = process.env.ANTHROPIC_API_KEY;

    // Product context - critical for PULL analysis
    this.productContext = config.productContext || {
      productName: 'Your Product',
      productCategory: 'compliance', // compliance, sales, hr, security, etc.
      dealSize: 100000,
      relevantRoles: ['VP', 'Director', 'Head of'],
      projectKeywords: [],
      urgencyDrivers: [],
      limitations: [],
      competitorTools: [],
      strongMarkets: [],
      industryPainPatterns: {}
    };

    // Configuration
    this.config = {
      model: config.model || 'claude-sonnet-4-5-20250514', // Cost-effective
      batchSize: config.batchSize || 10,
      enrichmentLevel: config.enrichmentLevel || 'standard',
      outputDir: config.outputDir || path.join(__dirname, 'output'),
      ...config
    };

    // Initialize modules
    this.pullDetector = new PullSignalDetector({
      productContext: this.productContext,
      model: this.config.model
    });

    this.industryAnalyzer = new IndustryAnalyzer({
      productContext: this.productContext,
      model: this.config.model
    });

    this.clusteringEngine = new CompanyClusteringEngine({
      productContext: this.productContext,
      model: this.config.model,
      batchSize: this.config.batchSize,
      enrichmentLevel: this.config.enrichmentLevel
    });

    // Results storage
    this.results = {
      marketAnalysis: null,
      companyDiscovery: null,
      clustering: null,
      recommendations: null
    };

    // Ensure output directory exists
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }
  }

  /**
   * Run the full pipeline:
   * 1. Analyze markets to find best industries
   * 2. Discover companies in top markets
   * 3. Cluster companies by PULL
   * 4. Generate recommendations
   */
  async runFullPipeline(options = {}) {
    console.log('\n' + '='.repeat(70));
    console.log('  FIND OPTIMAL COMPANY - PULL FRAMEWORK PIPELINE');
    console.log('='.repeat(70));
    console.log(`\n  Product: ${this.productContext.productName}`);
    console.log(`  Deal Size: $${this.productContext.dealSize.toLocaleString()}`);
    console.log(`  Category: ${this.productContext.productCategory}`);
    console.log('='.repeat(70) + '\n');

    try {
      // Step 1: Analyze markets
      console.log('\n STEP 1: MARKET ANALYSIS');
      console.log('-'.repeat(50));
      this.results.marketAnalysis = await this.analyzeMarkets(options.markets);

      // Step 2: Discover companies in top markets
      console.log('\n STEP 2: COMPANY DISCOVERY');
      console.log('-'.repeat(50));
      const topMarkets = this.results.marketAnalysis.slice(0, options.topMarketsCount || 3);
      this.results.companyDiscovery = await this.discoverCompanies(topMarkets, options);

      // Step 3: Cluster companies by PULL
      console.log('\n STEP 3: PULL CLUSTERING');
      console.log('-'.repeat(50));
      this.results.clustering = await this.clusterCompanies(
        this.results.companyDiscovery.companies,
        options
      );

      // Step 4: Generate recommendations
      console.log('\n STEP 4: RECOMMENDATIONS');
      console.log('-'.repeat(50));
      this.results.recommendations = this.generateRecommendations();

      // Save results
      await this.saveResults();

      // Print final summary
      this.printFinalSummary();

      return this.results;

    } catch (error) {
      console.error('\n Pipeline failed:', error.message);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * Step 1: Analyze markets for PULL concentration
   */
  async analyzeMarkets(customMarkets) {
    const markets = customMarkets ||
                    this.industryAnalyzer.getDefaultIndustries(this.productContext.productCategory);

    console.log(`  Analyzing ${markets.length} industries for PULL concentration...\n`);

    const analysis = await this.industryAnalyzer.analyzeIndustries(markets);

    // Print top markets
    console.log('\n  Top Markets by PULL Concentration:');
    analysis.slice(0, 5).forEach((market, i) => {
      console.log(`    ${i + 1}. ${market.market.name}`);
      console.log(`       PULL Score: ${market.scores.pullConcentration} | Est. PULL: ${market.details.pullConcentration.estimatedPullPercentage}%`);
      console.log(`       Recommendation: ${market.intelligence.recommendation}`);
    });

    return analysis;
  }

  /**
   * Step 2: Discover companies in target markets
   */
  async discoverCompanies(markets, options = {}) {
    const companies = [];
    const limit = options.companiesPerMarket || 50;

    for (const marketAnalysis of markets) {
      const market = marketAnalysis.market;
      console.log(`\n  Discovering companies in ${market.name}...`);

      const marketCompanies = await this.searchCompaniesInMarket(market, limit);
      console.log(`    Found ${marketCompanies.length} companies`);

      companies.push(...marketCompanies);
    }

    console.log(`\n  Total companies discovered: ${companies.length}`);

    return {
      companies,
      markets: markets.map(m => m.market.name),
      discoveredAt: new Date().toISOString()
    };
  }

  /**
   * Search for companies in a market using Coresignal
   */
  async searchCompaniesInMarket(market, limit = 50) {
    if (!this.coresignalApiKey) {
      console.log('    CORESIGNAL_API_KEY not set, returning empty');
      return [];
    }

    try {
      // Build search query
      const searchQuery = this.buildMarketSearchQuery(market, limit);

      const response = await fetch(
        `https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl?items_per_page=${limit}`,
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
        throw new Error(`Coresignal search failed: ${response.status}`);
      }

      const companyIds = await response.json();

      // Collect full profiles for top companies
      const companies = [];
      const collectLimit = Math.min(companyIds.length, limit);

      for (let i = 0; i < collectLimit; i++) {
        try {
          const companyData = await this.fetchCompanyProfile(companyIds[i]);
          if (companyData) {
            companies.push(companyData);
          }
          // Rate limiting
          if (i < collectLimit - 1) {
            await this.delay(500);
          }
        } catch (error) {
          console.error(`    Error fetching company ${companyIds[i]}: ${error.message}`);
        }
      }

      return companies;

    } catch (error) {
      console.error(`    Market search failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Build Coresignal search query for a market
   */
  buildMarketSearchQuery(market, limit) {
    const query = {
      query: {
        bool: {
          must: [
            // Industry filter
            {
              match: {
                industry: market.industry || market.name
              }
            },
            // B2B indicator
            {
              term: {
                company_is_b2b: 1
              }
            }
          ],
          should: [
            // Boost companies with high growth (urgency signal)
            {
              range: {
                employees_count_change_yearly_percentage: {
                  gte: 20,
                  boost: 2.0
                }
              }
            },
            // Boost companies with recent funding (urgency signal)
            {
              range: {
                last_funding_round_date: {
                  gte: 'now-180d',
                  boost: 1.5
                }
              }
            },
            // Boost companies with active hiring (project signal)
            {
              range: {
                active_job_postings_count: {
                  gte: 5,
                  boost: 1.3
                }
              }
            }
          ],
          filter: [
            // Location filter (USA focus)
            {
              term: {
                company_hq_country: 'United States'
              }
            },
            // Size filter (target market)
            {
              range: {
                employees_count: {
                  gte: 50,
                  lte: 5000
                }
              }
            }
          ]
        }
      },
      size: limit
    };

    return query;
  }

  /**
   * Fetch full company profile from Coresignal
   */
  async fetchCompanyProfile(companyId) {
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
        throw new Error(`Collect failed: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error(`    Profile fetch failed for ${companyId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Step 3: Cluster companies by PULL
   */
  async clusterCompanies(companies, options = {}) {
    return await this.clusteringEngine.clusterCompanies(companies, options);
  }

  /**
   * Step 4: Generate recommendations
   */
  generateRecommendations() {
    const clustering = this.results.clustering;
    const marketAnalysis = this.results.marketAnalysis;

    const recommendations = {
      immediateActions: [],
      nurtureCampaigns: [],
      marketFocus: [],
      nextSteps: []
    };

    // Immediate actions: PULL companies
    const pullCompanies = clustering.clusters.PULL;
    recommendations.immediateActions = pullCompanies.slice(0, 10).map(company => ({
      company: company.name,
      pullScore: company.pullScore,
      action: 'Immediate outreach',
      rationale: company.rationale,
      topSignals: company.topSignals
    }));

    // Nurture campaigns: Consideration companies
    const considerationCompanies = clustering.clusters.CONSIDERATION;
    recommendations.nurtureCampaigns = considerationCompanies.slice(0, 10).map(company => ({
      company: company.name,
      pullScore: company.pullScore,
      action: 'Add to nurture sequence',
      rationale: company.rationale,
      signalsToTrack: company.topSignals
    }));

    // Market focus recommendations
    recommendations.marketFocus = marketAnalysis.slice(0, 3).map(market => ({
      market: market.market.name,
      pullConcentration: market.details.pullConcentration.estimatedPullPercentage + '%',
      recommendation: market.intelligence.recommendation,
      entryStrategy: market.intelligence.entryStrategy
    }));

    // Next steps
    recommendations.nextSteps = [
      `Focus on ${pullCompanies.length} PULL companies - they're ready to buy now`,
      `Set up trigger-based monitoring for ${considerationCompanies.length} consideration companies`,
      `Prioritize ${marketAnalysis[0].market.name} market - highest PULL concentration`,
      'Track PULL signals weekly to catch companies entering buying mode'
    ];

    return recommendations;
  }

  /**
   * Save results to files
   */
  async saveResults() {
    const timestamp = new Date().toISOString().split('T')[0];
    const productSlug = this.productContext.productName.toLowerCase().replace(/\s+/g, '-');

    // Save full results
    const fullResultsPath = path.join(
      this.config.outputDir,
      `${productSlug}-pull-analysis-${timestamp}.json`
    );

    fs.writeFileSync(fullResultsPath, JSON.stringify({
      productContext: this.productContext,
      marketAnalysis: this.results.marketAnalysis,
      clustering: this.results.clustering?.exportResults(),
      recommendations: this.results.recommendations,
      generatedAt: new Date().toISOString()
    }, null, 2));

    console.log(`\n  Results saved to: ${fullResultsPath}`);

    // Save PULL companies CSV
    if (this.results.clustering?.clusters?.PULL?.length > 0) {
      const csvPath = path.join(
        this.config.outputDir,
        `${productSlug}-pull-companies-${timestamp}.csv`
      );

      const csv = this.generatePullCompaniesCSV(this.results.clustering.clusters.PULL);
      fs.writeFileSync(csvPath, csv);

      console.log(`  PULL companies CSV: ${csvPath}`);
    }
  }

  /**
   * Generate CSV of PULL companies
   */
  generatePullCompaniesCSV(pullCompanies) {
    const headers = [
      'Company Name',
      'Industry',
      'Employee Count',
      'PULL Score',
      'Classification',
      'Confidence',
      'Top Signal 1',
      'Top Signal 2',
      'Rationale',
      'Website',
      'LinkedIn URL'
    ];

    const rows = pullCompanies.map(company => [
      company.name,
      company.industry,
      company.employeeCount,
      company.pullScore,
      company.classification,
      company.confidence,
      company.topSignals[0]?.evidence || '',
      company.topSignals[1]?.evidence || '',
      company.rationale?.substring(0, 200) || '',
      company.website,
      company.linkedinUrl
    ]);

    return [headers, ...rows].map(row =>
      row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  }

  /**
   * Print final summary
   */
  printFinalSummary() {
    console.log('\n' + '='.repeat(70));
    console.log('  PULL FRAMEWORK ANALYSIS COMPLETE');
    console.log('='.repeat(70));

    const clustering = this.results.clustering;
    const recommendations = this.results.recommendations;

    console.log('\n  SUMMARY:');
    console.log(`    Total Companies Analyzed: ${clustering.totalCompanies}`);
    console.log(`    PULL Companies (Ready to Buy): ${clustering.statistics.pullCount} (${clustering.statistics.pullPercentage}%)`);
    console.log(`    Consideration (Nurture): ${clustering.statistics.considerationCount} (${clustering.statistics.considerationPercentage}%)`);
    console.log(`    Not In Market: ${clustering.statistics.notInMarketCount} (${clustering.statistics.notInMarketPercentage}%)`);

    console.log('\n  TOP RECOMMENDATIONS:');
    recommendations.nextSteps.forEach((step, i) => {
      console.log(`    ${i + 1}. ${step}`);
    });

    if (clustering.clusters.PULL.length > 0) {
      console.log('\n  TOP PULL COMPANIES (Immediate Action):');
      clustering.clusters.PULL.slice(0, 5).forEach((company, i) => {
        console.log(`    ${i + 1}. ${company.name} (Score: ${company.pullScore})`);
      });
    }

    console.log('\n' + '='.repeat(70) + '\n');
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log(`
Find Optimal Company - PULL Framework

Usage:
  node index.js --full-pipeline [options]
  node index.js --analyze-markets [options]
  node index.js --cluster-companies --companies <file> [options]

Options:
  --product <name>           Product name for context
  --category <category>      Product category (compliance, sales, hr, security)
  --deal-size <amount>       Average deal size in USD
  --config <file>            Load configuration from JSON file
  --limit <number>           Max companies to analyze per market
  --output <directory>       Output directory for results

Examples:
  node index.js --full-pipeline --product "Adrata" --category compliance --deal-size 100000
  node index.js --analyze-markets --category compliance
  node index.js --config ./adrata-config.json --full-pipeline
`);
    return;
  }

  // Parse arguments
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--product' && args[i + 1]) {
      options.productName = args[++i];
    } else if (args[i] === '--category' && args[i + 1]) {
      options.productCategory = args[++i];
    } else if (args[i] === '--deal-size' && args[i + 1]) {
      options.dealSize = parseInt(args[++i]);
    } else if (args[i] === '--config' && args[i + 1]) {
      const configPath = args[++i];
      const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      Object.assign(options, configData);
    } else if (args[i] === '--limit' && args[i + 1]) {
      options.companiesPerMarket = parseInt(args[++i]);
    } else if (args[i] === '--output' && args[i + 1]) {
      options.outputDir = args[++i];
    }
  }

  // Build product context
  const productContext = {
    productName: options.productName || 'Your Product',
    productCategory: options.productCategory || 'compliance',
    dealSize: options.dealSize || 100000,
    relevantRoles: options.relevantRoles || ['VP', 'Director', 'Head of'],
    projectKeywords: options.projectKeywords || [],
    urgencyDrivers: options.urgencyDrivers || [],
    limitations: options.limitations || [],
    competitorTools: options.competitorTools || [],
    strongMarkets: options.strongMarkets || [],
    industryPainPatterns: options.industryPainPatterns || {}
  };

  // Create finder instance
  const finder = new OptimalCompanyFinder({
    productContext,
    outputDir: options.outputDir
  });

  // Run based on command
  if (args.includes('--full-pipeline')) {
    await finder.runFullPipeline(options);
  } else if (args.includes('--analyze-markets')) {
    const results = await finder.analyzeMarkets();
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log('Unknown command. Use --help for usage.');
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { OptimalCompanyFinder };
