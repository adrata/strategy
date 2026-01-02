/**
 * Industry Comparison Scanner
 *
 * Compares multiple industries to find the best one to target.
 * Uses real data from Coresignal + multiple scoring dimensions.
 *
 * Based on market selection research:
 * - TAM/SAM/SOM framework (market sizing)
 * - Porter's Five Forces (competitive intensity)
 * - PULL concentration (our unique signal)
 * - Deal velocity indicators
 * - Accessibility metrics
 *
 * Sources:
 * - https://www.kalungi.com/blog/how-to-define-and-go-to-market-for-saas
 * - https://www.t2d3.pro/learn/tam-sam-som-market-sizing-approach-b2b-saas
 * - https://www.entrymapper.io/post/select-right-target-market
 */

const { IndustryScanner } = require('./IndustryScanner');

class IndustryComparisonScanner {
  constructor(config = {}) {
    this.coresignalApiKey = config.coresignalApiKey || process.env.CORESIGNAL_API_KEY;
    this.claudeApiKey = config.claudeApiKey || process.env.ANTHROPIC_API_KEY;
    this.productContext = config.productContext || {};
    this.verbose = config.verbose !== false;

    // Scoring weights (sum to 100)
    this.scoringWeights = {
      pullConcentration: 30,    // % of companies with PULL - our unique signal
      marketSize: 20,           // TAM - number of potential customers
      growthRate: 15,           // Industry growth = more new companies with PULL
      competitiveIntensity: 10, // Low competition = attractive
      dealVelocity: 10,         // How fast deals close
      accessibility: 10,        // Ease of reaching decision makers
      regulatoryPressure: 5     // Regulations create urgency
    };

    // 3 Tiers of depth
    this.tiers = {
      pulse: {
        name: 'Quick Pulse',
        description: 'Fast directional signal - sample 10 companies per industry',
        companiesPerIndustry: 10,
        deepAnalysisCount: 0,    // Pre-screen only
        estimatedTime: '2-5 min',
        estimatedCredits: 12     // per industry
      },
      scan: {
        name: 'Industry Scan',
        description: 'Solid comparison - scan 50 companies, deep analyze top 10',
        companiesPerIndustry: 50,
        deepAnalysisCount: 10,
        estimatedTime: '10-15 min',
        estimatedCredits: 75     // per industry
      },
      deep: {
        name: 'Deep Market Study',
        description: 'Comprehensive analysis - scan 100+ companies, full PULL mapping',
        companiesPerIndustry: 100,
        deepAnalysisCount: 25,
        estimatedTime: '30-60 min',
        estimatedCredits: 175    // per industry
      }
    };

    // Industry metadata for additional scoring
    this.industryMetadata = {
      'FinTech': {
        regulated: true,
        avgDealCycle: 60,        // days
        buyerSophistication: 'high',
        linkedinActivity: 'high',
        typicalCompetitors: 5
      },
      'B2B SaaS': {
        regulated: false,
        avgDealCycle: 45,
        buyerSophistication: 'high',
        linkedinActivity: 'high',
        typicalCompetitors: 8
      },
      'HealthTech': {
        regulated: true,
        avgDealCycle: 90,
        buyerSophistication: 'medium',
        linkedinActivity: 'medium',
        typicalCompetitors: 4
      },
      'Cybersecurity': {
        regulated: true,
        avgDealCycle: 60,
        buyerSophistication: 'high',
        linkedinActivity: 'high',
        typicalCompetitors: 10
      },
      'E-commerce': {
        regulated: false,
        avgDealCycle: 30,
        buyerSophistication: 'medium',
        linkedinActivity: 'medium',
        typicalCompetitors: 12
      },
      'HR Tech': {
        regulated: false,
        avgDealCycle: 45,
        buyerSophistication: 'medium',
        linkedinActivity: 'high',
        typicalCompetitors: 8
      },
      'Marketing Tech': {
        regulated: false,
        avgDealCycle: 30,
        buyerSophistication: 'high',
        linkedinActivity: 'high',
        typicalCompetitors: 15
      },
      'Legal Tech': {
        regulated: true,
        avgDealCycle: 75,
        buyerSophistication: 'low',
        linkedinActivity: 'low',
        typicalCompetitors: 3
      }
    };
  }

  /**
   * Compare multiple industries and rank them
   * @param {object} options - Comparison options
   * @returns {object} Ranked industries with detailed scoring
   */
  async compareIndustries(options = {}) {
    const {
      industries,                           // Array of industry names to compare
      tier = 'scan',                         // 'pulse', 'scan', or 'deep'
      employeeRange = { min: 50, max: 1000 },
      location,
      onProgress
    } = options;

    const tierConfig = this.tiers[tier];
    if (!tierConfig) {
      throw new Error(`Invalid tier: ${tier}. Use 'pulse', 'scan', or 'deep'`);
    }

    const startTime = Date.now();

    this.log(`\n${'═'.repeat(70)}`);
    this.log(`  INDUSTRY COMPARISON SCANNER`);
    this.log(`${'═'.repeat(70)}`);
    this.log(`Mode: ${tierConfig.name}`);
    this.log(`Industries: ${industries.join(', ')}`);
    this.log(`Companies per industry: ${tierConfig.companiesPerIndustry}`);
    this.log(`Deep analysis count: ${tierConfig.deepAnalysisCount}`);
    this.log(`Estimated time: ${tierConfig.estimatedTime}`);
    this.log(`Estimated credits: ~${tierConfig.estimatedCredits * industries.length}`);

    const results = [];

    // Create scanner instance
    const scanner = new IndustryScanner({
      coresignalApiKey: this.coresignalApiKey,
      productContext: this.productContext,
      verbose: false
    });

    // Scan each industry
    for (let i = 0; i < industries.length; i++) {
      const industry = industries[i];

      this.log(`\n${'─'.repeat(50)}`);
      this.log(`📊 [${i + 1}/${industries.length}] Scanning: ${industry}`);

      if (onProgress) {
        onProgress({
          stage: 'scanning',
          currentIndustry: industry,
          industriesCompleted: i,
          totalIndustries: industries.length
        });
      }

      try {
        const scanResult = await scanner.scanIndustry({
          industry,
          employeeRange,
          location,
          maxCompanies: tierConfig.companiesPerIndustry,
          deepAnalysisCount: tierConfig.deepAnalysisCount
        });

        if (scanResult.success) {
          // Calculate comprehensive score
          const scoring = this.calculateIndustryScore(industry, scanResult);

          results.push({
            industry,
            scanResult,
            scoring,
            recommendation: this.generateRecommendation(scoring)
          });

          this.log(`   ✅ Complete - PULL Concentration: ${scoring.dimensions.pullConcentration.value}%`);
        } else {
          this.log(`   ❌ Scan failed: ${scanResult.error}`);
          results.push({
            industry,
            error: scanResult.error,
            scoring: null
          });
        }

      } catch (error) {
        this.log(`   ❌ Error: ${error.message}`);
        results.push({
          industry,
          error: error.message,
          scoring: null
        });
      }
    }

    // Rank industries by total score
    const rankedResults = results
      .filter(r => r.scoring)
      .sort((a, b) => b.scoring.totalScore - a.scoring.totalScore)
      .map((r, i) => ({ ...r, rank: i + 1 }));

    // Add failed industries at the end
    const failedResults = results
      .filter(r => !r.scoring)
      .map(r => ({ ...r, rank: null }));

    const allResults = [...rankedResults, ...failedResults];

    const duration = Date.now() - startTime;

    this.log(`\n${'═'.repeat(70)}`);
    this.log(`  COMPARISON COMPLETE`);
    this.log(`${'═'.repeat(70)}`);

    if (rankedResults.length > 0) {
      this.log(`\n🏆 RANKING:`);
      rankedResults.forEach(r => {
        this.log(`   ${r.rank}. ${r.industry} - Score: ${r.scoring.totalScore}/100 (${r.recommendation.action})`);
      });
    }

    return {
      success: true,
      tier: tierConfig.name,
      industriesCompared: industries.length,
      results: allResults,
      topRecommendation: rankedResults[0] || null,
      comparisonDuration: duration,
      estimatedCreditsUsed: tierConfig.estimatedCredits * industries.length
    };
  }

  /**
   * Calculate comprehensive industry score
   */
  calculateIndustryScore(industry, scanResult) {
    const dimensions = {};

    // 1. PULL CONCENTRATION (30%)
    // What % of companies have PULL (score 65+)?
    const pullCompanies = scanResult.rankings.filter(r => r.pullScore >= 65).length;
    const pullConcentration = Math.round((pullCompanies / scanResult.totalScanned) * 100);
    dimensions.pullConcentration = {
      value: pullConcentration,
      score: this.normalizeScore(pullConcentration, 0, 30), // 0-30% is the realistic range
      weight: this.scoringWeights.pullConcentration,
      interpretation: pullConcentration >= 20 ? 'Excellent' : pullConcentration >= 10 ? 'Good' : 'Low'
    };

    // 2. MARKET SIZE (20%)
    // Based on total companies found and estimated TAM
    const marketSizeScore = this.estimateMarketSize(industry, scanResult);
    dimensions.marketSize = {
      value: marketSizeScore.estimate,
      score: marketSizeScore.score,
      weight: this.scoringWeights.marketSize,
      interpretation: marketSizeScore.interpretation
    };

    // 3. GROWTH RATE (15%)
    // Average growth rate of companies in the industry
    const avgGrowth = this.calculateAverageGrowth(scanResult.rankings);
    dimensions.growthRate = {
      value: `${avgGrowth}%`,
      score: this.normalizeScore(avgGrowth, 0, 50),
      weight: this.scoringWeights.growthRate,
      interpretation: avgGrowth >= 30 ? 'High growth' : avgGrowth >= 15 ? 'Moderate' : 'Slow'
    };

    // 4. COMPETITIVE INTENSITY (10%)
    // Lower competition = higher score
    const metadata = this.industryMetadata[industry] || {};
    const competitors = metadata.typicalCompetitors || 5;
    const competitiveScore = Math.max(0, 100 - (competitors * 8)); // More competitors = lower score
    dimensions.competitiveIntensity = {
      value: `${competitors} competitors`,
      score: Math.round(competitiveScore * (this.scoringWeights.competitiveIntensity / 100)),
      weight: this.scoringWeights.competitiveIntensity,
      interpretation: competitors <= 3 ? 'Low competition' : competitors <= 7 ? 'Moderate' : 'Crowded'
    };

    // 5. DEAL VELOCITY (10%)
    // Shorter sales cycles = higher score
    const dealCycle = metadata.avgDealCycle || 45;
    const velocityScore = Math.max(0, 100 - dealCycle); // Faster = better
    dimensions.dealVelocity = {
      value: `${dealCycle} days avg`,
      score: Math.round(velocityScore * (this.scoringWeights.dealVelocity / 100)),
      weight: this.scoringWeights.dealVelocity,
      interpretation: dealCycle <= 30 ? 'Fast' : dealCycle <= 60 ? 'Moderate' : 'Slow'
    };

    // 6. ACCESSIBILITY (10%)
    // How easy to reach decision makers
    const linkedinActivity = metadata.linkedinActivity || 'medium';
    const accessScore = linkedinActivity === 'high' ? 90 : linkedinActivity === 'medium' ? 60 : 30;
    dimensions.accessibility = {
      value: linkedinActivity,
      score: Math.round(accessScore * (this.scoringWeights.accessibility / 100)),
      weight: this.scoringWeights.accessibility,
      interpretation: linkedinActivity === 'high' ? 'Easy to reach' : 'Harder to reach'
    };

    // 7. REGULATORY PRESSURE (5%)
    // Regulated industries have built-in urgency
    const regulated = metadata.regulated || false;
    dimensions.regulatoryPressure = {
      value: regulated ? 'Regulated' : 'Not regulated',
      score: regulated ? this.scoringWeights.regulatoryPressure : 2,
      weight: this.scoringWeights.regulatoryPressure,
      interpretation: regulated ? 'Built-in urgency' : 'No regulatory driver'
    };

    // Calculate total score
    const totalScore = Math.round(
      Object.values(dimensions).reduce((sum, d) => sum + d.score, 0)
    );

    // Calculate high-PULL companies
    const highPullCompanies = scanResult.rankings
      .filter(r => r.pullScore >= 80)
      .slice(0, 5)
      .map(r => ({
        company: r.company,
        pullScore: r.pullScore,
        champion: r.champion?.name || null
      }));

    return {
      totalScore,
      dimensions,
      highPullCompanies,
      companiesScanned: scanResult.totalScanned,
      companiesWithPull: pullCompanies
    };
  }

  /**
   * Estimate market size based on scan results
   */
  estimateMarketSize(industry, scanResult) {
    // If we found max companies, market is likely large
    const foundRatio = scanResult.totalScanned / 100; // Assume we searched for 100

    // Estimate based on industry
    const industryEstimates = {
      'B2B SaaS': 50000,
      'FinTech': 15000,
      'HealthTech': 20000,
      'Cybersecurity': 8000,
      'E-commerce': 100000,
      'HR Tech': 12000,
      'Marketing Tech': 25000,
      'Legal Tech': 5000
    };

    const estimate = industryEstimates[industry] || 10000;
    const score = Math.min(20, Math.round((estimate / 100000) * 20)); // Max 20 points

    return {
      estimate: `~${(estimate / 1000).toFixed(0)}K companies`,
      score,
      interpretation: estimate >= 30000 ? 'Large market' : estimate >= 10000 ? 'Medium market' : 'Niche market'
    };
  }

  /**
   * Calculate average growth rate from rankings
   */
  calculateAverageGrowth(rankings) {
    const growthRates = rankings
      .filter(r => r.preScreenFactors)
      .map(r => {
        const growthFactor = r.preScreenFactors?.find(f =>
          f.factor.includes('growth')
        );
        if (growthFactor?.value) {
          const match = growthFactor.value.match(/(\d+)/);
          return match ? parseInt(match[1]) : 0;
        }
        return 0;
      })
      .filter(g => g > 0);

    if (growthRates.length === 0) return 15; // Default assumption
    return Math.round(growthRates.reduce((a, b) => a + b, 0) / growthRates.length);
  }

  /**
   * Normalize a value to a 0-weight score
   */
  normalizeScore(value, min, max) {
    const normalized = Math.min(1, Math.max(0, (value - min) / (max - min)));
    return Math.round(normalized * this.scoringWeights.pullConcentration);
  }

  /**
   * Generate recommendation based on scoring
   */
  generateRecommendation(scoring) {
    const score = scoring.totalScore;
    const pullConc = scoring.dimensions.pullConcentration.value;

    let action, rationale, priority;

    if (score >= 75 && pullConc >= 15) {
      action = 'PRIORITIZE';
      priority = 1;
      rationale = `High PULL concentration (${pullConc}%) with strong market fundamentals. This is your best market.`;
    } else if (score >= 60 && pullConc >= 10) {
      action = 'FOCUS';
      priority = 2;
      rationale = `Good PULL signals with solid market characteristics. Worth significant investment.`;
    } else if (score >= 45 || pullConc >= 8) {
      action = 'TEST';
      priority = 3;
      rationale = `Moderate opportunity. Run a focused campaign to validate before scaling.`;
    } else {
      action = 'DEPRIORITIZE';
      priority = 4;
      rationale = `Low PULL concentration and/or challenging market dynamics. Focus elsewhere first.`;
    }

    // Add specific insights
    const insights = [];

    if (scoring.dimensions.pullConcentration.value >= 15) {
      insights.push(`${scoring.companiesWithPull} companies with active PULL signals`);
    }

    if (scoring.dimensions.growthRate.interpretation === 'High growth') {
      insights.push('Fast-growing industry means more companies entering PULL');
    }

    if (scoring.dimensions.competitiveIntensity.interpretation === 'Low competition') {
      insights.push('Low competition gives you room to establish position');
    }

    if (scoring.dimensions.dealVelocity.interpretation === 'Fast') {
      insights.push('Short sales cycles mean faster revenue');
    }

    return {
      action,
      priority,
      rationale,
      insights,
      topTargets: scoring.highPullCompanies
    };
  }

  /**
   * Get tier configuration
   */
  getTierConfig(tier) {
    return this.tiers[tier];
  }

  /**
   * Estimate cost for comparison
   */
  estimateCost(industries, tier) {
    const tierConfig = this.tiers[tier];
    if (!tierConfig) return null;

    const creditsPerIndustry = tierConfig.estimatedCredits;
    const totalCredits = creditsPerIndustry * industries.length;
    const estimatedCost = (totalCredits * 0.02).toFixed(2); // ~$0.02 per credit

    return {
      tier: tierConfig.name,
      industries: industries.length,
      creditsPerIndustry,
      totalCredits,
      estimatedCost: `$${estimatedCost}`,
      estimatedTime: tierConfig.estimatedTime
    };
  }

  log(message) {
    if (this.verbose) {
      console.log(message);
    }
  }
}

module.exports = { IndustryComparisonScanner };
