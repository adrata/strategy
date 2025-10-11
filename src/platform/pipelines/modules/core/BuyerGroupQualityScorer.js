/**
 * BUYER GROUP QUALITY SCORER
 * 
 * Assesses the quality of a buyer group based on:
 * - Role composition (decision makers, champions, stakeholders, blockers)
 * - Contact accessibility (email coverage, LinkedIn activity)
 * - Stability (tenure, recent job changes)
 * - Influence scores
 * 
 * Higher quality = easier sales process, better close rates
 */

class BuyerGroupQualityScorer {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Score buyer group quality
   */
  async scoreBuyerGroup(buyerGroup, criteria = {}) {
    console.log(`🎯 [BUYER GROUP] Scoring buyer group quality`);

    if (!buyerGroup || !buyerGroup.members || buyerGroup.members.length === 0) {
      return {
        qualityScore: 0,
        quality: 'poor',
        composition: {},
        accessibility: {},
        stability: {},
        blockers: [],
        recommendations: ['No buyer group identified']
      };
    }

    const composition = this.analyzeComposition(buyerGroup);
    const accessibility = this.analyzeAccessibility(buyerGroup);
    const stability = this.analyzeStability(buyerGroup);
    const influence = this.analyzeInfluence(buyerGroup);

    const qualityScore = this.calculateQualityScore(composition, accessibility, stability, influence);
    const quality = this.classifyQuality(qualityScore);

    return {
      qualityScore, // 0-100
      quality, // excellent, good, fair, poor
      composition,
      accessibility,
      stability,
      influence,
      blockers: this.identifyBlockers(buyerGroup),
      recommendations: this.generateRecommendations(composition, accessibility, stability)
    };
  }

  /**
   * Analyze buyer group composition
   */
  analyzeComposition(buyerGroup) {
    const members = buyerGroup.members || [];

    const composition = {
      decisionMakers: members.filter(m => m.buyerGroupRole === 'decision_maker').length,
      champions: members.filter(m => m.buyerGroupRole === 'champion').length,
      stakeholders: members.filter(m => m.buyerGroupRole === 'stakeholder').length,
      blockers: members.filter(m => m.buyerGroupRole === 'blocker').length,
      introducers: members.filter(m => m.buyerGroupRole === 'introducer').length,
      total: members.length
    };

    // Ideal composition scores
    const compositionScore = this.scoreComposition(composition);

    return {
      ...composition,
      score: compositionScore,
      isIdeal: this.isIdealComposition(composition),
      issues: this.identifyCompositionIssues(composition)
    };
  }

  /**
   * Score composition quality
   */
  scoreComposition(composition) {
    let score = 0;

    // Decision makers (want 1-3)
    if (composition.decisionMakers === 0) {
      score += 0; // Critical issue
    } else if (composition.decisionMakers >= 1 && composition.decisionMakers <= 3) {
      score += 30; // Ideal
    } else {
      score += 15; // Too many (decision paralysis)
    }

    // Champions (want 2-4)
    if (composition.champions >= 2 && composition.champions <= 4) {
      score += 30; // Ideal
    } else if (composition.champions === 1) {
      score += 20; // Single point of failure
    } else if (composition.champions > 4) {
      score += 15; // Good but dispersed
    }

    // Stakeholders (want 2-5)
    if (composition.stakeholders >= 2 && composition.stakeholders <= 5) {
      score += 20; // Good
    } else if (composition.stakeholders < 2) {
      score += 10; // Limited buy-in
    } else {
      score += 15; // Many voices to manage
    }

    // Blockers (want 0-2)
    if (composition.blockers === 0) {
      score += 15; // Great - no blockers
    } else if (composition.blockers <= 2) {
      score += 10; // Manageable
    } else {
      score += 0; // Too many obstacles
    }

    // Introducers (bonus)
    if (composition.introducers > 0) {
      score += 5; // Nice to have
    }

    return Math.min(100, score);
  }

  /**
   * Check if composition is ideal
   */
  isIdealComposition(composition) {
    return (
      composition.decisionMakers >= 1 &&
      composition.decisionMakers <= 3 &&
      composition.champions >= 2 &&
      composition.champions <= 4 &&
      composition.blockers <= 2
    );
  }

  /**
   * Identify composition issues
   */
  identifyCompositionIssues(composition) {
    const issues = [];

    if (composition.decisionMakers === 0) {
      issues.push('No decision maker identified - cannot close deal');
    } else if (composition.decisionMakers > 3) {
      issues.push('Too many decision makers - risk of decision paralysis');
    }

    if (composition.champions === 0) {
      issues.push('No champion identified - low internal advocacy');
    } else if (composition.champions === 1) {
      issues.push('Single champion - single point of failure');
    }

    if (composition.blockers > 2) {
      issues.push(`${composition.blockers} blockers identified - high friction`);
    }

    if (composition.total < 4) {
      issues.push('Small buyer group - may be missing key stakeholders');
    }

    return issues;
  }

  /**
   * Analyze contact accessibility
   */
  analyzeAccessibility(buyerGroup) {
    const members = buyerGroup.members || [];
    
    const withEmail = members.filter(m => m.email && m.email.length > 0).length;
    const withPhone = members.filter(m => m.phone && m.phone.length > 0).length;
    const withLinkedIn = members.filter(m => m.linkedIn && m.linkedIn.length > 0).length;
    const linkedInActive = members.filter(m => m.linkedInActive === true).length;

    const emailCoverage = members.length > 0 ? withEmail / members.length : 0;
    const phoneCoverage = members.length > 0 ? withPhone / members.length : 0;
    const linkedInCoverage = members.length > 0 ? withLinkedIn / members.length : 0;
    const linkedInActivityRate = members.length > 0 ? linkedInActive / members.length : 0;

    // Calculate accessibility score
    const accessibilityScore = (
      (emailCoverage * 40) + // Email is most important
      (phoneCoverage * 25) +
      (linkedInCoverage * 20) +
      (linkedInActivityRate * 15)
    );

    return {
      emailCoverage,
      phoneCoverage,
      linkedInCoverage,
      linkedInActivityRate,
      score: accessibilityScore,
      quality: this.classifyAccessibility(accessibilityScore)
    };
  }

  /**
   * Classify accessibility quality
   */
  classifyAccessibility(score) {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }

  /**
   * Analyze buyer group stability
   */
  analyzeStability(buyerGroup) {
    const members = buyerGroup.members || [];

    const recentHires = members.filter(m => m.tenure && m.tenure < 6).length; // < 6 months
    const longTenure = members.filter(m => m.tenure && m.tenure > 24).length; // > 2 years
    const avgTenure = members.length > 0
      ? members.reduce((sum, m) => sum + (m.tenure || 12), 0) / members.length
      : 12;

    const recentChangeRate = members.length > 0 ? recentHires / members.length : 0;

    // Lower recent change rate = more stable
    const stabilityScore = (
      (1 - recentChangeRate) * 60 + // Fewer recent changes is better
      (Math.min(avgTenure / 36, 1) * 40) // Longer tenure is better (cap at 3 years)
    );

    return {
      recentHires,
      longTenure,
      avgTenure: Math.round(avgTenure),
      recentChangeRate,
      score: stabilityScore,
      quality: stabilityScore >= 70 ? 'stable' : stabilityScore >= 40 ? 'moderate' : 'unstable'
    };
  }

  /**
   * Analyze influence scores
   */
  analyzeInfluence(buyerGroup) {
    const members = buyerGroup.members || [];

    const avgInfluence = members.length > 0
      ? members.reduce((sum, m) => sum + (m.influenceScore || 50), 0) / members.length
      : 50;

    const highInfluence = members.filter(m => (m.influenceScore || 50) >= 70).length;

    return {
      avgInfluence: Math.round(avgInfluence),
      highInfluenceMembers: highInfluence,
      score: avgInfluence,
      quality: avgInfluence >= 70 ? 'high' : avgInfluence >= 50 ? 'moderate' : 'low'
    };
  }

  /**
   * Calculate overall quality score
   */
  calculateQualityScore(composition, accessibility, stability, influence) {
    return (
      (composition.score * 0.40) + // 40% weight
      (accessibility.score * 0.30) + // 30% weight
      (stability.score * 0.20) + // 20% weight
      (influence.score * 0.10) // 10% weight
    );
  }

  /**
   * Classify overall quality
   */
  classifyQuality(score) {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }

  /**
   * Identify blockers
   */
  identifyBlockers(buyerGroup) {
    const members = buyerGroup.members || [];
    const blockers = members.filter(m => m.buyerGroupRole === 'blocker');

    return blockers.map(blocker => ({
      name: blocker.name,
      title: blocker.title,
      reason: this.getBlockerReason(blocker),
      mitigation: this.getBlockerMitigation(blocker)
    }));
  }

  /**
   * Get blocker reason
   */
  getBlockerReason(blocker) {
    const titleLower = blocker.title.toLowerCase();

    if (titleLower.includes('procurement') || titleLower.includes('sourcing')) {
      return 'Procurement gatekeeper - controls vendor approval process';
    }
    if (titleLower.includes('security') || titleLower.includes('ciso')) {
      return 'Security gatekeeper - requires security/compliance approval';
    }
    if (titleLower.includes('legal') || titleLower.includes('counsel')) {
      return 'Legal gatekeeper - reviews contracts and terms';
    }
    if (titleLower.includes('privacy') || titleLower.includes('compliance')) {
      return 'Compliance gatekeeper - enforces regulatory requirements';
    }

    return 'Potential blocker based on role';
  }

  /**
   * Get blocker mitigation strategy
   */
  getBlockerMitigation(blocker) {
    const titleLower = blocker.title.toLowerCase();

    if (titleLower.includes('procurement')) {
      return 'Engage early, provide vendor questionnaire, highlight cost savings';
    }
    if (titleLower.includes('security')) {
      return 'Provide security documentation, SOC 2 report, schedule security review';
    }
    if (titleLower.includes('legal')) {
      return 'Use standard contract, minimize custom terms, provide redlines';
    }
    if (titleLower.includes('privacy')) {
      return 'Demonstrate GDPR/compliance, provide DPA, privacy documentation';
    }

    return 'Identify concerns early and address proactively';
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(composition, accessibility, stability) {
    const recommendations = [];

    // Composition recommendations
    if (composition.decisionMakers === 0) {
      recommendations.push('Critical: Identify the decision maker before proceeding');
    }
    if (composition.champions < 2) {
      recommendations.push('Find additional champion to reduce single point of failure');
    }
    if (composition.blockers > 2) {
      recommendations.push('Develop mitigation strategy for multiple blockers');
    }

    // Accessibility recommendations
    if (accessibility.emailCoverage < 0.7) {
      recommendations.push('Enrich contact data - low email coverage');
    }
    if (accessibility.linkedInActivityRate < 0.3) {
      recommendations.push('Consider alternative outreach channels - low LinkedIn activity');
    }

    // Stability recommendations
    if (stability.recentChangeRate > 0.5) {
      recommendations.push('Account instability - many recent hires, expect slower decision making');
    }

    if (recommendations.length === 0) {
      recommendations.push('Buyer group composition is strong - proceed with engagement');
    }

    return recommendations;
  }
}

module.exports = { BuyerGroupQualityScorer };

