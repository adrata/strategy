/**
 * PERSON INTELLIGENCE ENGINE
 * 
 * Orchestrates all person analysis modules to provide comprehensive
 * intelligence on a specific individual
 * 
 * Coordinates:
 * - Innovation profiling
 * - Pain awareness analysis
 * - Buying authority assessment
 * - Influence network mapping
 * - Career trajectory analysis
 * - Risk profiling
 */

const { PersonInnovationProfiler } = require('./PersonInnovationProfiler');
const { PersonPainAnalyzer } = require('./PersonPainAnalyzer');
const { BuyingAuthorityAnalyzer } = require('./BuyingAuthorityAnalyzer');
const { InfluenceNetworkMapper } = require('./InfluenceNetworkMapper');
const { CareerTrajectoryAnalyzer } = require('./CareerTrajectoryAnalyzer');
const { PersonRiskProfiler } = require('./PersonRiskProfiler');

class PersonIntelligenceEngine {
  constructor(config = {}) {
    this.config = config;
    this.innovationProfiler = new PersonInnovationProfiler(config);
    this.painAnalyzer = new PersonPainAnalyzer(config);
    this.buyingAuthorityAnalyzer = new BuyingAuthorityAnalyzer(config);
    this.influenceNetworkMapper = new InfluenceNetworkMapper(config);
    this.careerTrajectoryAnalyzer = new CareerTrajectoryAnalyzer(config);
    this.riskProfiler = new PersonRiskProfiler(config);
  }

  /**
   * Comprehensive person intelligence analysis
   */
  async analyzePerson(personData, options = {}) {
    console.log(`\n🔍 [PERSON INTELLIGENCE] Deep analysis: ${personData.name}`);
    console.log(`   Title: ${personData.title}`);
    console.log(`   Company: ${personData.company}`);

    const startTime = Date.now();

    const {
      includeInnovationProfile = true,
      includePainAwareness = true,
      includeBuyingAuthority = true,
      includeInfluenceNetwork = true,
      includeCareerTrajectory = true,
      includeRiskProfile = true,
      companyData = {},
      buyerGroup = null
    } = options;

    // Run all analyses in parallel for speed
    const analyses = await Promise.all([
      includeInnovationProfile ? this.innovationProfiler.profilePerson(personData) : null,
      includePainAwareness ? this.painAnalyzer.analyzePain(personData) : null,
      includeBuyingAuthority ? this.buyingAuthorityAnalyzer.analyzeBuyingAuthority(personData, companyData) : null,
      includeInfluenceNetwork ? this.influenceNetworkMapper.mapNetwork(personData, buyerGroup) : null,
      includeCareerTrajectory ? this.careerTrajectoryAnalyzer.analyzeTrajectory(personData) : null,
      includeRiskProfile ? this.riskProfiler.profileRisk(personData) : null
    ]);

    const [
      innovationProfile,
      painAwareness,
      buyingAuthority,
      influenceNetwork,
      careerTrajectory,
      riskProfile
    ] = analyses;

    // Calculate overall person score
    const personScore = this.calculatePersonScore(analyses);

    const executionTime = Date.now() - startTime;

    console.log(`✅ [PERSON INTELLIGENCE] Analysis complete (${executionTime}ms)`);
    console.log(`   Innovation: ${innovationProfile?.segment || 'N/A'}`);
    console.log(`   Buying Role: ${buyingAuthority?.role || 'N/A'}`);
    console.log(`   Overall Score: ${personScore}/100`);

    return {
      person: {
        name: personData.name,
        title: personData.title,
        company: personData.company,
        email: personData.email,
        phone: personData.phone,
        linkedIn: personData.linkedIn
      },
      
      // Core analysis results
      innovationProfile,
      painAwareness,
      buyingAuthority,
      influenceNetwork,
      careerTrajectory,
      riskProfile,

      // Overall metrics
      personScore, // 0-100
      personQuality: this.classifyPersonQuality(personScore),
      
      // Actionable insights
      engagementStrategy: this.generateEngagementStrategy(analyses),
      keyInsights: this.extractKeyInsights(analyses),
      recommendations: this.generateRecommendations(analyses),

      // Metadata
      executionTime,
      analysesPerformed: {
        innovationProfile: includeInnovationProfile,
        painAwareness: includePainAwareness,
        buyingAuthority: includeBuyingAuthority,
        influenceNetwork: includeInfluenceNetwork,
        careerTrajectory: includeCareerTrajectory,
        riskProfile: includeRiskProfile
      }
    };
  }

  /**
   * Calculate overall person score
   */
  calculatePersonScore(analyses) {
    const [innovation, pain, authority, network, trajectory, risk] = analyses;

    let score = 0;
    let components = 0;

    if (innovation) {
      score += innovation.score * 0.2; // 20% weight
      components++;
    }

    if (pain && pain.totalPainScore) {
      score += Math.min(100, pain.totalPainScore) * 0.2; // 20% weight
      components++;
    }

    if (authority) {
      const authorityScore = authority.influenceScore * 100;
      score += authorityScore * 0.25; // 25% weight
      components++;
    }

    if (network) {
      score += network.networkScore * 0.15; // 15% weight
      components++;
    }

    if (trajectory) {
      score += trajectory.trajectoryScore * 0.1; // 10% weight
      components++;
    }

    if (risk) {
      // Higher risk = higher score (more likely to adopt new solutions)
      const riskScore = risk.type === 'aggressive_risk_taker' ? 90 :
                       risk.type === 'calculated_risk_taker' ? 75 :
                       risk.type === 'moderate_risk' ? 50 : 30;
      score += riskScore * 0.1; // 10% weight
      components++;
    }

    return components > 0 ? Math.round(score / components) : 0;
  }

  /**
   * Classify person quality
   */
  classifyPersonQuality(score) {
    if (score >= 80) return 'ideal'; // Perfect target
    if (score >= 65) return 'strong'; // Great target
    if (score >= 50) return 'good'; // Solid target
    if (score >= 35) return 'moderate'; // Worth pursuing
    return 'weak'; // Deprioritize
  }

  /**
   * Generate engagement strategy
   */
  generateEngagementStrategy(analyses) {
    const [innovation, pain, authority] = analyses;

    const strategy = {
      approach: 'consultative', // Default
      messaging: [],
      channels: [],
      timeline: 'standard'
    };

    // Innovation-based approach
    if (innovation) {
      if (innovation.segment === 'innovators') {
        strategy.approach = 'visionary';
        strategy.messaging.push('Lead with cutting-edge capabilities and innovation');
        strategy.messaging.push('Emphasize thought leadership and early adopter benefits');
        strategy.timeline = 'fast'; // Quick decision makers
      } else if (innovation.segment === 'early_adopters') {
        strategy.approach = 'thought_leadership';
        strategy.messaging.push('Share case studies and proven results');
        strategy.messaging.push('Highlight industry recognition');
      } else if (innovation.segment === 'laggards') {
        strategy.approach = 'risk_mitigation';
        strategy.messaging.push('Emphasize ROI and risk mitigation');
        strategy.messaging.push('Provide extensive proof points');
        strategy.timeline = 'slow'; // Slow decision makers
      }
    }

    // Pain-based urgency
    if (pain && pain.urgency > 0.7) {
      strategy.messaging.push('Emphasize quick wins and urgency');
      strategy.timeline = 'accelerated';
    }

    // Authority-based channels
    if (authority) {
      if (authority.role === 'decision_maker') {
        strategy.channels.push('Direct outreach', 'Executive briefing');
      } else if (authority.role === 'champion') {
        strategy.channels.push('Product demo', 'POC/pilot program');
      } else if (authority.role === 'introducer') {
        strategy.channels.push('Referral request', 'Warm introduction');
      }
    }

    return strategy;
  }

  /**
   * Extract key insights
   */
  extractKeyInsights(analyses) {
    const [innovation, pain, authority, network, trajectory, risk] = analyses;
    const insights = [];

    if (innovation && innovation.segment === 'innovators') {
      insights.push('🚀 INNOVATOR - First to adopt new technology, high influence potential');
    }

    if (pain && pain.urgency > 0.7) {
      insights.push(`💥 HIGH URGENCY - ${pain.activePains.length} active pain point(s) detected`);
    }

    if (authority && authority.role === 'decision_maker') {
      insights.push(`✅ DECISION MAKER - Estimated signing authority: $${(authority.estimatedSigningLimit / 1000).toFixed(0)}K`);
    }

    if (network && network.directReports > 50) {
      insights.push(`👥 LARGE TEAM - Manages ${network.directReports}+ people, high organizational influence`);
    }

    if (trajectory && trajectory.trend === 'rising_star') {
      insights.push('📈 RISING STAR - Fast career progression, ambitious');
    }

    if (risk && risk.type === 'aggressive_risk_taker') {
      insights.push('⚡ RISK TAKER - Comfortable with new solutions, fast decision making');
    }

    return insights;
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(analyses) {
    const [innovation, pain, authority, network] = analyses;
    const recommendations = [];

    // Innovation recommendations
    if (innovation) {
      if (innovation.segment === 'innovators' || innovation.segment === 'early_adopters') {
        recommendations.push('Lead with innovation and thought leadership');
        recommendations.push('Invite to beta program or early access');
      } else if (innovation.segment === 'laggards') {
        recommendations.push('Focus on ROI and risk mitigation');
        recommendations.push('Provide extensive social proof and case studies');
      }
    }

    // Pain recommendations
    if (pain && pain.activePains.length > 0) {
      const topPain = pain.activePains[0];
      recommendations.push(`Address ${topPain.pain.replace(/_/g, ' ')} in initial outreach`);
    }

    // Authority recommendations
    if (authority) {
      if (authority.role === 'decision_maker') {
        recommendations.push('Prioritize for direct C-level engagement');
      } else if (authority.role === 'champion') {
        recommendations.push('Build champion relationship, enable them to sell internally');
      } else if (authority.role === 'blocker') {
        recommendations.push('Engage early to understand concerns and mitigate');
      }
    }

    // Network recommendations
    if (network && network.externalInfluence.conferenceSpeaker) {
      recommendations.push('Consider for speaking engagement or customer spotlight');
    }

    return recommendations;
  }
}

module.exports = { PersonIntelligenceEngine };

