/**
 * Industry Analyzer Module
 *
 * Identifies the best industries/verticals to target based on PULL concentration.
 * Uses the principle: Focus on industries where the most companies have PULL.
 *
 * Key insight from the PULL framework:
 * "The whole point of a startup is to find repeatable PULL"
 *
 * This module helps find industries where PULL is:
 * 1. More concentrated (higher % of companies with PULL)
 * 2. More identifiable (clearer signals)
 * 3. More defensible (competitive advantage in serving)
 */

class IndustryAnalyzer {
  constructor(config) {
    this.productContext = config.productContext;
    this.claudeApiKey = process.env.ANTHROPIC_API_KEY;
    this.model = config.model || 'claude-sonnet-4-5-20250514';

    // Default market evaluation criteria
    this.evaluationCriteria = {
      pullConcentration: 0.30,    // How many companies have PULL?
      marketSize: 0.25,           // Total addressable market
      signalClarity: 0.20,        // How clear are PULL signals?
      competitiveAdvantage: 0.15, // Can we serve this market better?
      accessCost: 0.10            // Cost to reach these companies
    };
  }

  /**
   * Analyze industries and rank by PULL concentration
   * @param {Array} industries - Array of industry definitions
   * @param {object} options - Analysis options
   * @returns {Array} Ranked industries with PULL analysis
   */
  async analyzeIndustries(industries, options = {}) {
    console.log(`\n Analyzing ${industries.length} industries for PULL concentration...`);

    const analyzedIndustries = [];

    for (const industry of industries) {
      console.log(`   Analyzing: ${industry.name}...`);

      const analysis = await this.analyzeIndustry(industry, options);
      analyzedIndustries.push(analysis);
    }

    // Sort by weighted score
    analyzedIndustries.sort((a, b) => b.weightedScore - a.weightedScore);

    // Add rank
    analyzedIndustries.forEach((industry, index) => {
      industry.rank = index + 1;
    });

    console.log(` Industry analysis complete. Top industry: ${analyzedIndustries[0]?.industry?.name}`);

    return analyzedIndustries;
  }

  /**
   * Analyze a single industry for PULL indicators
   * @param {object} industry - Industry definition
   * @param {object} options - Analysis options
   * @returns {object} Industry analysis
   */
  async analyzeIndustry(industry, options = {}) {
    const productContext = this.productContext;

    // 1. Calculate PULL concentration score
    const pullConcentration = this.calculatePullConcentration(industry, productContext);

    // 2. Estimate industry size
    const industrySize = this.estimateIndustrySize(industry, productContext);

    // 3. Assess signal clarity
    const signalClarity = this.assessSignalClarity(industry, productContext);

    // 4. Evaluate competitive advantage
    const competitiveAdvantage = this.evaluateCompetitiveAdvantage(industry, productContext);

    // 5. Estimate access cost
    const accessCost = this.estimateAccessCost(industry, productContext);

    // 6. Calculate weighted score
    const weightedScore = Math.round(
      pullConcentration.score * this.evaluationCriteria.pullConcentration +
      industrySize.score * this.evaluationCriteria.marketSize +
      signalClarity.score * this.evaluationCriteria.signalClarity +
      competitiveAdvantage.score * this.evaluationCriteria.competitiveAdvantage +
      accessCost.score * this.evaluationCriteria.accessCost
    );

    // 7. Generate industry intelligence
    const intelligence = this.generateIndustryIntelligence(industry, {
      pullConcentration,
      industrySize,
      signalClarity,
      competitiveAdvantage,
      accessCost
    });

    return {
      industry,
      weightedScore,
      scores: {
        pullConcentration: pullConcentration.score,
        industrySize: industrySize.score,
        signalClarity: signalClarity.score,
        competitiveAdvantage: competitiveAdvantage.score,
        accessCost: accessCost.score
      },
      details: {
        pullConcentration,
        industrySize,
        signalClarity,
        competitiveAdvantage,
        accessCost
      },
      intelligence,
      analyzedAt: new Date().toISOString()
    };
  }

  /**
   * Calculate PULL concentration for an industry
   * Key question: What % of companies in this industry have PULL right now?
   */
  calculatePullConcentration(industry, productContext) {
    let score = 50; // Base score
    const factors = [];

    // Industry-specific PULL patterns
    const pullPatterns = {
      // High PULL concentration markets for compliance/security
      'Computer Software': {
        baseScore: 75,
        reason: 'SaaS companies need SOC 2 for enterprise customers',
        pullDrivers: ['enterprise sales', 'customer requirements', 'competitive pressure']
      },
      'Information Technology': {
        baseScore: 70,
        reason: 'IT companies face constant security/compliance demands',
        pullDrivers: ['security requirements', 'regulatory compliance']
      },
      'Financial Services': {
        baseScore: 85,
        reason: 'Heavily regulated, compliance is non-negotiable',
        pullDrivers: ['regulatory requirements', 'audit pressure', 'customer trust']
      },
      'FinTech': {
        baseScore: 90,
        reason: 'Must have compliance to operate and serve enterprises',
        pullDrivers: ['regulatory requirements', 'enterprise customers', 'funding requirements']
      },
      'Healthcare': {
        baseScore: 80,
        reason: 'HIPAA and healthcare regulations create constant compliance demand',
        pullDrivers: ['HIPAA compliance', 'patient data protection', 'regulatory audits']
      },
      'Insurance': {
        baseScore: 75,
        reason: 'Insurance industry has strict data and security requirements',
        pullDrivers: ['regulatory compliance', 'data security', 'customer trust']
      }
    };

    // Check if industry matches any high-PULL pattern
    for (const [pattern, config] of Object.entries(pullPatterns)) {
      if (industry.name.toLowerCase().includes(pattern.toLowerCase()) ||
          industry.industry?.toLowerCase().includes(pattern.toLowerCase())) {
        score = config.baseScore;
        factors.push({
          factor: 'industry_pattern',
          impact: config.baseScore - 50,
          reason: config.reason,
          pullDrivers: config.pullDrivers
        });
        break;
      }
    }

    // Adjust for industry characteristics
    if (industry.characteristics) {
      // B2B vs B2C
      if (industry.characteristics.b2b) {
        score += 10;
        factors.push({
          factor: 'b2b_industry',
          impact: 10,
          reason: 'B2B companies have enterprise customer requirements'
        });
      }

      // High growth industries have more companies with urgency
      if (industry.characteristics.highGrowth) {
        score += 15;
        factors.push({
          factor: 'high_growth_industry',
          impact: 15,
          reason: 'Fast-growing industries have more companies scaling rapidly'
        });
      }

      // Regulated industries have built-in urgency
      if (industry.characteristics.regulated) {
        score += 20;
        factors.push({
          factor: 'regulated_industry',
          impact: 20,
          reason: 'Regulatory requirements create constant PULL'
        });
      }

      // Competitive industries drive adoption
      if (industry.characteristics.competitive) {
        score += 5;
        factors.push({
          factor: 'competitive_industry',
          impact: 5,
          reason: 'Competitive pressure drives tool adoption'
        });
      }
    }

    // Estimate percentage of companies with PULL
    const estimatedPullPercentage = this.estimatePullPercentage(score);

    return {
      score: Math.min(100, Math.round(score)),
      estimatedPullPercentage,
      factors,
      summary: `~${estimatedPullPercentage}% of companies in ${industry.name} likely have PULL right now`
    };
  }

  /**
   * Estimate the % of companies with PULL based on score
   */
  estimatePullPercentage(score) {
    // PULL is rare - even in the best markets, only ~5-15% have PULL
    // Score 90+ = 10-15% have PULL
    // Score 70-90 = 5-10% have PULL
    // Score 50-70 = 2-5% have PULL
    // Score <50 = <2% have PULL

    if (score >= 90) return Math.round(10 + (score - 90));
    if (score >= 70) return Math.round(5 + (score - 70) * 0.25);
    if (score >= 50) return Math.round(2 + (score - 50) * 0.15);
    return Math.max(1, Math.round(score * 0.02));
  }

  /**
   * Estimate industry size
   */
  estimateIndustrySize(industry, productContext) {
    let score = 50;
    const factors = [];

    // Use provided industry size if available
    if (industry.estimatedCompanies) {
      if (industry.estimatedCompanies > 50000) {
        score = 90;
        factors.push({ factor: 'large_industry', impact: 40, reason: 'Very large total addressable market' });
      } else if (industry.estimatedCompanies > 10000) {
        score = 75;
        factors.push({ factor: 'medium_industry', impact: 25, reason: 'Good industry size' });
      } else if (industry.estimatedCompanies > 1000) {
        score = 60;
        factors.push({ factor: 'small_industry', impact: 10, reason: 'Smaller but focused industry' });
      }
    }

    // Growth rate of the industry
    if (industry.growthRate) {
      if (industry.growthRate > 20) {
        score += 15;
        factors.push({ factor: 'high_growth', impact: 15, reason: 'Industry growing rapidly' });
      } else if (industry.growthRate > 10) {
        score += 10;
        factors.push({ factor: 'moderate_growth', impact: 10, reason: 'Healthy industry growth' });
      }
    }

    return {
      score: Math.min(100, score),
      estimatedCompanies: industry.estimatedCompanies || 'Unknown',
      factors,
      summary: `Industry size: ${industry.estimatedCompanies || 'Unknown'} companies`
    };
  }

  /**
   * Assess signal clarity - how easy is it to identify PULL?
   */
  assessSignalClarity(industry, productContext) {
    let score = 50;
    const factors = [];
    const signals = [];

    // Industries with clear hiring signals
    if (industry.hiringSignalStrength === 'high') {
      score += 20;
      signals.push('Job postings clearly indicate need');
      factors.push({ factor: 'clear_hiring_signals', impact: 20, reason: 'Can identify need through job postings' });
    }

    // Industries with funding transparency
    if (industry.fundingTransparency === 'high') {
      score += 15;
      signals.push('Funding rounds are publicly announced');
      factors.push({ factor: 'funding_visibility', impact: 15, reason: 'Easy to identify post-funding urgency' });
    }

    // Industries with clear regulatory triggers
    if (industry.characteristics?.regulated) {
      score += 20;
      signals.push('Regulatory requirements create clear triggers');
      factors.push({ factor: 'regulatory_triggers', impact: 20, reason: 'Compliance deadlines are predictable' });
    }

    // Tech-forward industries have more data
    if (industry.characteristics?.techForward) {
      score += 10;
      signals.push('Companies actively share on LinkedIn, use modern tech');
      factors.push({ factor: 'data_availability', impact: 10, reason: 'More data available for analysis' });
    }

    return {
      score: Math.min(100, score),
      signals,
      factors,
      summary: signals.length > 0 ? `Clear signals: ${signals.join(', ')}` : 'Signal clarity is moderate'
    };
  }

  /**
   * Evaluate competitive advantage in serving this industry
   */
  evaluateCompetitiveAdvantage(industry, productContext) {
    let score = 50;
    const factors = [];
    const advantages = [];

    // Check for product-industry fit signals
    if (productContext.strongMarkets?.includes(industry.name)) {
      score += 30;
      advantages.push('Product designed for this industry');
      factors.push({ factor: 'product_fit', impact: 30, reason: 'Strong product-industry alignment' });
    }

    // Industry-specific features
    if (productContext.industryFeatures?.[industry.name]) {
      score += 20;
      advantages.push('Industry-specific features available');
      factors.push({ factor: 'industry_features', impact: 20, reason: 'Specialized capabilities for this industry' });
    }

    // Existing customer base in this industry
    if (productContext.existingCustomers?.[industry.name]) {
      score += 25;
      advantages.push('Existing customer references');
      factors.push({ factor: 'customer_references', impact: 25, reason: 'Can leverage social proof' });
    }

    // Competitive density (less competition = advantage)
    if (industry.competitiveIntensity === 'low') {
      score += 15;
      advantages.push('Limited competition');
      factors.push({ factor: 'low_competition', impact: 15, reason: 'Less competitive industry' });
    }

    return {
      score: Math.min(100, score),
      advantages,
      factors,
      summary: advantages.length > 0 ? `Advantages: ${advantages.join(', ')}` : 'Neutral competitive position'
    };
  }

  /**
   * Estimate cost to access this industry
   */
  estimateAccessCost(industry, productContext) {
    let score = 70; // Default to moderate cost (inverted - higher score = lower cost)
    const factors = [];

    // Digital-native industries are easier to reach
    if (industry.characteristics?.techForward) {
      score += 15;
      factors.push({ factor: 'digital_native', impact: 15, reason: 'Easy to reach via digital channels' });
    }

    // Concentrated industries are easier to target
    if (industry.concentration === 'high') {
      score += 10;
      factors.push({ factor: 'concentrated', impact: 10, reason: 'Companies clustered in few locations/communities' });
    }

    // Active on professional networks
    if (industry.linkedinActivity === 'high') {
      score += 10;
      factors.push({ factor: 'linkedin_active', impact: 10, reason: 'Decision makers active on LinkedIn' });
    }

    // Enterprise industries have longer sales cycles (higher cost)
    if (industry.dealSize === 'enterprise') {
      score -= 20;
      factors.push({ factor: 'enterprise_sales', impact: -20, reason: 'Longer, more complex sales cycles' });
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      factors,
      summary: score >= 70 ? 'Low access cost' : score >= 50 ? 'Moderate access cost' : 'High access cost'
    };
  }

  /**
   * Generate actionable industry intelligence
   */
  generateIndustryIntelligence(industry, scores) {
    const intelligence = {
      recommendation: '',
      pullSignalsToTrack: [],
      entryStrategy: '',
      keyMetrics: [],
      risks: []
    };

    // Generate recommendation based on weighted score
    const pullScore = scores.pullConcentration.score;
    const marketScore = scores.marketSize.score;

    if (pullScore >= 80 && marketScore >= 60) {
      intelligence.recommendation = 'PRIORITIZE: High PULL concentration with good market size';
    } else if (pullScore >= 70) {
      intelligence.recommendation = 'FOCUS: Strong PULL signals, worth significant investment';
    } else if (pullScore >= 50 && marketScore >= 70) {
      intelligence.recommendation = 'OPPORTUNISTIC: Large market with moderate PULL - test and learn';
    } else {
      intelligence.recommendation = 'DEPRIORITIZE: Low PULL concentration - not worth focus now';
    }

    // Pull signals to track
    if (scores.pullConcentration.factors) {
      for (const factor of scores.pullConcentration.factors) {
        if (factor.pullDrivers) {
          intelligence.pullSignalsToTrack.push(...factor.pullDrivers);
        }
      }
    }

    // Entry strategy based on signal clarity and access cost
    if (scores.signalClarity.score >= 70 && scores.accessCost.score >= 70) {
      intelligence.entryStrategy = 'Signal-based outbound: Target companies showing clear PULL signals';
    } else if (scores.signalClarity.score >= 70) {
      intelligence.entryStrategy = 'Content + outbound: Build awareness while targeting high-signal accounts';
    } else {
      intelligence.entryStrategy = 'Inbound focus: Build presence in this market, let PULL find you';
    }

    // Key metrics to track
    intelligence.keyMetrics = [
      'PULL classification rate (% of companies with PULL)',
      'Conversion rate from PULL companies',
      'Average deal size in this market',
      'Sales cycle length'
    ];

    // Risks
    if (scores.competitiveAdvantage.score < 50) {
      intelligence.risks.push('Limited competitive differentiation in this market');
    }
    if (scores.accessCost.score < 50) {
      intelligence.risks.push('High cost to acquire customers in this market');
    }
    if (pullScore < 50) {
      intelligence.risks.push('Low PULL concentration may require patience');
    }

    return intelligence;
  }

  /**
   * Use AI to enhance market analysis
   */
  async enhancedMarketAnalysis(market) {
    if (!this.claudeApiKey) {
      return null;
    }

    const prompt = `Analyze this market for companies with PULL (blocked demand) for ${this.productContext.productName}.

MARKET: ${market.name}
INDUSTRY: ${market.industry || market.name}

PRODUCT CONTEXT:
${JSON.stringify(this.productContext, null, 2)}

Questions to answer:
1. What % of companies in this market likely have PULL right now?
2. What are the top 3 signals that indicate PULL in this market?
3. What creates URGENCY for companies in this market?
4. What LIMITATIONS do companies in this market face with current solutions?
5. How easy is it to identify companies with PULL in this market?

Return JSON:
{
  "estimatedPullPercentage": 0-100,
  "topPullSignals": ["signal1", "signal2", "signal3"],
  "urgencyDrivers": ["driver1", "driver2"],
  "commonLimitations": ["limitation1", "limitation2"],
  "signalClarityScore": 0-100,
  "marketRecommendation": "PRIORITIZE|FOCUS|OPPORTUNISTIC|DEPRIORITIZE",
  "reasoning": "2-3 sentence explanation"
}`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.claudeApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1000,
          temperature: 0.2,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.content[0].text;

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON in response');
      }

      return JSON.parse(jsonMatch[0]);

    } catch (error) {
      console.error(`AI market analysis failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Get default industries for a product category
   */
  getDefaultIndustries(productCategory) {
    const industriesByCategory = {
      compliance: [
        {
          name: 'Computer Software / SaaS',
          industry: 'Computer Software',
          characteristics: { b2b: true, highGrowth: true, techForward: true },
          hiringSignalStrength: 'high',
          fundingTransparency: 'high',
          linkedinActivity: 'high',
          estimatedCompanies: 50000
        },
        {
          name: 'FinTech',
          industry: 'Financial Technology',
          characteristics: { b2b: true, regulated: true, highGrowth: true, techForward: true },
          hiringSignalStrength: 'high',
          fundingTransparency: 'high',
          linkedinActivity: 'high',
          estimatedCompanies: 15000
        },
        {
          name: 'Financial Services',
          industry: 'Financial Services',
          characteristics: { b2b: true, regulated: true },
          hiringSignalStrength: 'medium',
          fundingTransparency: 'medium',
          linkedinActivity: 'medium',
          estimatedCompanies: 30000
        },
        {
          name: 'Healthcare / HealthTech',
          industry: 'Healthcare',
          characteristics: { b2b: true, regulated: true, highGrowth: true },
          hiringSignalStrength: 'high',
          fundingTransparency: 'high',
          linkedinActivity: 'high',
          estimatedCompanies: 20000
        },
        {
          name: 'Information Technology',
          industry: 'Information Technology and Services',
          characteristics: { b2b: true, techForward: true },
          hiringSignalStrength: 'high',
          fundingTransparency: 'high',
          linkedinActivity: 'high',
          estimatedCompanies: 100000
        },
        {
          name: 'Professional Services',
          industry: 'Professional Services',
          characteristics: { b2b: true },
          hiringSignalStrength: 'medium',
          fundingTransparency: 'low',
          linkedinActivity: 'high',
          estimatedCompanies: 75000
        }
      ],
      sales: [
        {
          name: 'Computer Software / SaaS',
          industry: 'Computer Software',
          characteristics: { b2b: true, highGrowth: true, techForward: true, competitive: true },
          hiringSignalStrength: 'high',
          fundingTransparency: 'high',
          linkedinActivity: 'high',
          estimatedCompanies: 50000
        },
        {
          name: 'Business Services',
          industry: 'Business Services',
          characteristics: { b2b: true },
          hiringSignalStrength: 'medium',
          fundingTransparency: 'medium',
          linkedinActivity: 'high',
          estimatedCompanies: 100000
        },
        {
          name: 'Marketing & Advertising',
          industry: 'Marketing and Advertising',
          characteristics: { b2b: true, techForward: true },
          hiringSignalStrength: 'high',
          fundingTransparency: 'high',
          linkedinActivity: 'high',
          estimatedCompanies: 40000
        }
      ]
    };

    return industriesByCategory[productCategory] || industriesByCategory.compliance;
  }
}

module.exports = { IndustryAnalyzer };
