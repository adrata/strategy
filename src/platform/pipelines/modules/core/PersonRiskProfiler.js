/**
 * PERSON RISK PROFILER
 * 
 * Classifies risk-taking propensity based on career decisions
 * 
 * Types:
 * - aggressive_risk_taker: Founders, early-stage startup moves
 * - calculated_risk_taker: Big tech → startup, innovation focus
 * - moderate_risk: Traditional path with some innovation
 * - risk_averse: Conservative career, slow adopter
 */

class PersonRiskProfiler {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Profile person's risk-taking propensity
   */
  async profileRisk(personData) {
    console.log(`⚖️ [RISK PROFILE] Profiling: ${personData.name}`);

    const careerRisk = this.analyzeCareerRisk(personData);
    const innovationRisk = this.analyzeInnovationRisk(personData);
    const overall = this.determineOverallProfile(careerRisk, innovationRisk);

    return {
      type: overall.type,
      confidence: overall.confidence,
      evidence: [...careerRisk.evidence, ...innovationRisk.evidence],
      decisionMakingStyle: this.inferDecisionStyle(overall.type, personData)
    };
  }

  /**
   * Analyze career risk-taking
   */
  analyzeCareerRisk(personData) {
    const evidence = [];
    let score = 50; // Neutral

    // Founder/co-founder
    if (personData.isFounder) {
      evidence.push('Founded own company (aggressive risk-taking)');
      score += 30;
    }

    // Big tech → startup
    const previousCompanies = personData.previousCompanies || [];
    const bigToSmall = previousCompanies.some((c, i) => {
      if (i === 0) return false;
      const prev = previousCompanies[i - 1];
      return prev.employeeCount > 10000 && c.employeeCount < 100;
    });

    if (bigToSmall) {
      evidence.push('Left big tech for startup (high risk tolerance)');
      score += 20;
    }

    // Startup experience
    const hasStartup = previousCompanies.some(c => c.employeeCount < 50);
    if (hasStartup && !bigToSmall) {
      evidence.push('Has startup experience (moderate risk tolerance)');
      score += 10;
    }

    // International moves
    const intlMoves = previousCompanies.filter((c, i) => {
      if (i === 0) return false;
      return previousCompanies[i - 1].country !== c.country;
    }).length;

    if (intlMoves > 0) {
      evidence.push(`${intlMoves} international move(s) (risk-taking)`);
      score += intlMoves * 5;
    }

    // Long tenure (risk-averse)
    if (personData.tenure > 60) {
      evidence.push('Long tenure at current company (lower risk tolerance)');
      score -= 15;
    }

    return { score, evidence };
  }

  /**
   * Analyze innovation risk
   */
  analyzeInnovationRisk(personData) {
    const evidence = [];
    let score = 50;

    // Early tech adoption
    if (personData.earlyTechAdopter) {
      evidence.push('Early technology adopter (risk-taking)');
      score += 15;
    }

    // Conference speaking (visibility risk)
    if (personData.conferenceSpeaker) {
      evidence.push('Conference speaker (comfortable with visibility)');
      score += 10;
    }

    // Blog/thought leadership
    if ((personData.publishedArticles || 0) > 3) {
      evidence.push('Published thought leadership (comfortable with public opinions)');
      score += 10;
    }

    // Patents/innovation
    if ((personData.patents || 0) > 0) {
      evidence.push(`${personData.patents} patent(s) (innovation focus)');
      score += 15;
    }

    return { score, evidence };
  }

  /**
   * Determine overall profile
   */
  determineOverallProfile(careerRisk, innovationRisk) {
    const avgScore = (careerRisk.score + innovationRisk.score) / 2;

    let type;
    if (avgScore >= 80) type = 'aggressive_risk_taker';
    else if (avgScore >= 65) type = 'calculated_risk_taker';
    else if (avgScore >= 45) type = 'moderate_risk';
    else type = 'risk_averse';

    const confidence = careerRisk.evidence.length + innovationRisk.evidence.length >= 3 ? 0.85 : 0.65;

    return { type, confidence };
  }

  /**
   * Infer decision-making style
   */
  inferDecisionStyle(riskType, personData) {
    const hasAnalytical = (personData.publishedArticles || 0) > 0 || (personData.patents || 0) > 0;

    if (riskType === 'aggressive_risk_taker') {
      return hasAnalytical ? 'analytical_innovator' : 'intuitive_visionary';
    }

    if (riskType === 'calculated_risk_taker') {
      return hasAnalytical ? 'data_driven_innovator' : 'pragmatic_innovator';
    }

    if (riskType === 'moderate_risk') {
      return 'balanced_pragmatist';
    }

    return 'conservative_follower';
  }
}

module.exports = { PersonRiskProfiler };

