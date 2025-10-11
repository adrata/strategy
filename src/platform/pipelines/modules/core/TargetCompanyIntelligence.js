/**
 * TARGET COMPANY INTELLIGENCE
 * 
 * People-centric company scoring system that combines:
 * - Firmographics (30% weight)
 * - Innovation Adoption (25% weight)
 * - Pain Signals (25% weight)
 * - Buyer Group Quality (20% weight)
 * 
 * Replaces traditional "ICP scoring" with a more sophisticated,
 * people-based approach to identifying target companies.
 */

const { InnovationAdoptionAnalyzer } = require('./InnovationAdoptionAnalyzer');
const { PainSignalDetector } = require('./PainSignalDetector');
const { BuyerGroupQualityScorer } = require('./BuyerGroupQualityScorer');

class TargetCompanyIntelligence {
  constructor(config = {}) {
    this.config = config;
    this.innovationAnalyzer = new InnovationAdoptionAnalyzer(config);
    this.painDetector = new PainSignalDetector(config);
    this.buyerGroupScorer = new BuyerGroupQualityScorer(config);
  }

  /**
   * Calculate Target Company Intelligence score
   */
  async calculateScore(companyData, buyerGroup = null, criteria = {}) {
    console.log(`\n🎯 [TARGET INTELLIGENCE] Analyzing: ${companyData.name}`);

    const startTime = Date.now();

    // Run all analyses in parallel
    const [firmographics, innovation, pain, buyerGroupQuality] = await Promise.all([
      this.scoreFirmographics(companyData, criteria.firmographics),
      this.innovationAnalyzer.analyzeCompany(companyData, buyerGroup),
      this.painDetector.detectPainSignals(companyData, buyerGroup, criteria.additionalData),
      buyerGroup ? this.buyerGroupScorer.scoreBuyerGroup(buyerGroup, criteria.buyerGroupQuality) : null
    ]);

    // Calculate weighted overall score
    const companyFitScore = this.calculateOverallScore(
      firmographics,
      innovation,
      pain,
      buyerGroupQuality
    );

    const executionTime = Date.now() - startTime;

    console.log(`✅ [TARGET INTELLIGENCE] Score: ${companyFitScore}/100 (${executionTime}ms)`);

    return {
      companyName: companyData.name,
      companyFitScore, // Overall score (0-100)
      scoreBreakdown: {
        firmographics: firmographics.score,
        innovationAdoption: innovation.score,
        painSignals: pain.painScore,
        buyerGroupQuality: buyerGroupQuality?.qualityScore || 0
      },
      weights: {
        firmographics: 30,
        innovationAdoption: 25,
        painSignals: 25,
        buyerGroupQuality: 20
      },
      innovationProfile: innovation,
      painAnalysis: pain,
      buyerGroupAnalysis: buyerGroupQuality,
      firmographicDetails: firmographics,
      fitLevel: this.classifyFit(companyFitScore),
      recommendations: this.generateRecommendations(companyFitScore, innovation, pain, buyerGroupQuality),
      executionTime
    };
  }

  /**
   * Score firmographics (traditional criteria)
   */
  async scoreFirmographics(companyData, firmographicCriteria = {}) {
    console.log(`  📊 Scoring firmographics...`);

    let score = 0;
    const matchDetails = [];

    // Industry match
    if (firmographicCriteria.industry && companyData.industry) {
      const industryMatch = firmographicCriteria.industry.some(ind =>
        companyData.industry.toLowerCase().includes(ind.toLowerCase())
      );
      if (industryMatch) {
        score += 25;
        matchDetails.push(`Industry match: ${companyData.industry}`);
      }
    } else {
      score += 15; // Neutral if no criteria
    }

    // Employee range match
    if (firmographicCriteria.employeeRange && companyData.employeeCount) {
      const { min = 0, max = Infinity } = firmographicCriteria.employeeRange;
      if (companyData.employeeCount >= min && companyData.employeeCount <= max) {
        score += 25;
        matchDetails.push(`Employee count in range: ${companyData.employeeCount}`);
      } else if (companyData.employeeCount >= min * 0.8 && companyData.employeeCount <= max * 1.2) {
        score += 15; // Close to range
        matchDetails.push(`Employee count near range: ${companyData.employeeCount}`);
      }
    } else {
      score += 15; // Neutral
    }

    // Revenue range match
    if (firmographicCriteria.revenue && companyData.revenue) {
      const { min = 0, max = Infinity } = firmographicCriteria.revenue;
      if (companyData.revenue >= min && companyData.revenue <= max) {
        score += 25;
        matchDetails.push(`Revenue in range: $${(companyData.revenue / 1000000).toFixed(1)}M`);
      } else if (companyData.revenue >= min * 0.8 && companyData.revenue <= max * 1.2) {
        score += 15; // Close
        matchDetails.push(`Revenue near range: $${(companyData.revenue / 1000000).toFixed(1)}M`);
      }
    } else {
      score += 15; // Neutral
    }

    // Location match
    if (firmographicCriteria.location && companyData.headquarters) {
      const locationMatch = firmographicCriteria.location.some(loc =>
        companyData.headquarters.toLowerCase().includes(loc.toLowerCase())
      );
      if (locationMatch) {
        score += 15;
        matchDetails.push(`Location match: ${companyData.headquarters}`);
      }
    } else {
      score += 10; // Neutral
    }

    // Technology stack match
    if (firmographicCriteria.technologies && companyData.technologies) {
      const techMatches = firmographicCriteria.technologies.filter(tech =>
        companyData.technologies.some(ct => 
          ct.toLowerCase().includes(tech.toLowerCase())
        )
      );
      if (techMatches.length > 0) {
        score += Math.min(10, techMatches.length * 3);
        matchDetails.push(`Technology matches: ${techMatches.join(', ')}`);
      }
    }

    return {
      score: Math.min(100, score),
      matchDetails,
      criteria: firmographicCriteria
    };
  }

  /**
   * Calculate overall score with weights
   */
  calculateOverallScore(firmographics, innovation, pain, buyerGroupQuality) {
    const weights = {
      firmographics: 0.30,
      innovation: 0.25,
      pain: 0.25,
      buyerGroup: 0.20
    };

    const score = (
      (firmographics.score * weights.firmographics) +
      (innovation.score * weights.innovation) +
      (pain.painScore * weights.pain) +
      ((buyerGroupQuality?.qualityScore || 0) * weights.buyerGroup)
    );

    return Math.round(score);
  }

  /**
   * Classify fit level
   */
  classifyFit(score) {
    if (score >= 85) return 'ideal'; // Tier 1 target
    if (score >= 70) return 'strong'; // Tier 2 target
    if (score >= 55) return 'moderate'; // Tier 3 target
    if (score >= 40) return 'weak'; // Tier 4 target
    return 'poor'; // Not a fit
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(overallScore, innovation, pain, buyerGroupQuality) {
    const recommendations = [];

    // Overall priority
    const fitLevel = this.classifyFit(overallScore);
    if (fitLevel === 'ideal') {
      recommendations.push('🎯 TIER 1 TARGET - Prioritize for immediate outreach');
    } else if (fitLevel === 'strong') {
      recommendations.push('✅ TIER 2 TARGET - Strong fit, add to pipeline');
    } else if (fitLevel === 'moderate') {
      recommendations.push('⚠️ TIER 3 TARGET - Moderate fit, consider for nurture campaign');
    } else {
      recommendations.push('❌ Not a strong fit - deprioritize or skip');
    }

    // Innovation-based recommendations
    if (innovation.segment === 'innovators') {
      recommendations.push('🚀 Innovator profile - Lead with cutting-edge capabilities, expect fast adoption');
    } else if (innovation.segment === 'early_adopters') {
      recommendations.push('⚡ Early adopter - Highlight proven results and thought leadership');
    } else if (innovation.segment === 'laggards') {
      recommendations.push('🐌 Laggard profile - Expect longer sales cycle, focus on ROI and risk mitigation');
    }

    // Pain-based recommendations
    if (pain.painLevel === 'critical' || pain.painLevel === 'high') {
      recommendations.push(`💥 HIGH PAIN (${pain.painLevel}) - Emphasize urgency and quick wins`);
      
      // Specific pain types
      const painTypes = pain.painIndicators.map(p => p.type);
      if (painTypes.includes('compliance_deadline')) {
        recommendations.push('⏰ Compliance deadline - Time-sensitive, accelerate sales cycle');
      }
      if (painTypes.includes('executive_turnover')) {
        recommendations.push('👔 New leadership - Strike while change appetite is high');
      }
      if (painTypes.includes('hiring_spike')) {
        recommendations.push('📈 Growing pains - Position as scaling solution');
      }
    }

    // Buyer group recommendations
    if (buyerGroupQuality) {
      if (buyerGroupQuality.quality === 'excellent' || buyerGroupQuality.quality === 'good') {
        recommendations.push(`✨ Strong buyer group (${buyerGroupQuality.quality}) - Clear path to close`);
      } else if (buyerGroupQuality.quality === 'poor') {
        recommendations.push('⚠️ Weak buyer group - May need additional discovery');
      }

      // Composition issues
      if (buyerGroupQuality.composition.decisionMakers === 0) {
        recommendations.push('🚨 No decision maker identified - Critical gap before proceeding');
      }
      if (buyerGroupQuality.blockers.length > 2) {
        recommendations.push(`⛔ ${buyerGroupQuality.blockers.length} blockers - Develop mitigation plan early`);
      }
    }

    return recommendations;
  }

  /**
   * Batch score multiple companies
   */
  async batchCalculateScores(companies, criteria = {}) {
    console.log(`\n🎯 [TARGET INTELLIGENCE] Batch scoring ${companies.length} companies...`);

    const results = await Promise.all(
      companies.map(async (company) => {
        try {
          return await this.calculateScore(company.data, company.buyerGroup, criteria);
        } catch (error) {
          console.error(`❌ Error scoring ${company.data.name}:`, error.message);
          return {
            companyName: company.data.name,
            companyFitScore: 0,
            error: error.message
          };
        }
      })
    );

    // Sort by score (descending)
    results.sort((a, b) => b.companyFitScore - a.companyFitScore);

    console.log(`✅ Batch scoring complete. Top score: ${results[0]?.companyFitScore || 0}`);

    return results;
  }
}

module.exports = { TargetCompanyIntelligence };

