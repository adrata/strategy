/**
 * CAREER TRAJECTORY ANALYZER
 * 
 * Analyzes career momentum and trajectory:
 * - rising_star: Fast promotions, upward trajectory
 * - stable: Consistent career, steady growth
 * - declining: Lateral moves or demotions
 */

class CareerTrajectoryAnalyzer {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Analyze career trajectory
   */
  async analyzeTrajectory(personData) {
    console.log(`📈 [CAREER TRAJECTORY] Analyzing: ${personData.name}`);

    const promotionVelocity = this.calculatePromotionVelocity(personData);
    const trend = this.determineTrend(personData);
    const jobChangeLikelihood = this.assessJobChangeLikelihood(personData);

    return {
      trend, // rising_star, stable, declining
      promotionVelocity, // very_fast, fast, moderate, slow
      tenure: {
        company: personData.tenure || 0,
        industry: personData.industryExperience || 0
      },
      previousCompanies: personData.previousCompanies?.map(c => c.name) || [],
      jobChangeLikelihood, // high, moderate, low
      trajectory Score: this.calculateTrajectoryScore(trend, promotionVelocity)
    };
  }

  /**
   * Calculate promotion velocity
   */
  calculatePromotionVelocity(personData) {
    const experience = personData.previousCompanies || [];
    if (experience.length < 2) return 'unknown';

    const promotions = experience.filter((exp, i) => {
      if (i === 0) return false;
      return this.isPromotion(experience[i - 1].title, exp.title);
    }).length;

    const yearsOfExperience = personData.industryExperience || 10;
    const promotionRate = promotions / (yearsOfExperience / 2); // Promotions per 2 years

    if (promotionRate >= 1) return 'very_fast'; // Promoted every ~2 years
    if (promotionRate >= 0.6) return 'fast'; // Every ~3 years
    if (promotionRate >= 0.4) return 'moderate'; // Every ~5 years
    return 'slow'; // Less frequent
  }

  /**
   * Check if title change is a promotion
   */
  isPromotion(oldTitle, newTitle) {
    const levels = ['intern', 'associate', 'analyst', 'manager', 'senior manager', 
                    'director', 'senior director', 'vp', 'svp', 'evp', 'c-level'];
    
    const oldLevel = this.titleToLevel(oldTitle);
    const newLevel = this.titleToLevel(newTitle);

    return newLevel > oldLevel;
  }

  /**
   * Convert title to level
   */
  titleToLevel(title) {
    const t = title.toLowerCase();
    if (/\bc[efotor]o\b|chief/.test(t)) return 10;
    if (/\bevp\b|executive vice president/.test(t)) return 9;
    if (/\bsvp\b|senior vice president/.test(t)) return 8;
    if (/\bvp\b|vice president/.test(t)) return 7;
    if (/senior director/.test(t)) return 6;
    if (/\bdirector\b/.test(t)) return 5;
    if (/senior manager/.test(t)) return 4;
    if (/\bmanager\b/.test(t)) return 3;
    if (/senior|sr\./.test(t)) return 2;
    return 1;
  }

  /**
   * Determine overall trend
   */
  determineTrend(personData) {
    const velocity = this.calculatePromotionVelocity(personData);
    const tenure = personData.tenure || 0;

    // Recently promoted + short tenure = rising star
    if (velocity === 'very_fast' || velocity === 'fast') {
      return 'rising_star';
    }

    // Long tenure + slow promotions = stable
    if (tenure > 36 && (velocity === 'moderate' || velocity === 'slow')) {
      return 'stable';
    }

    // Lateral moves = stable or declining
    if (velocity === 'slow') {
      return 'stable';
    }

    return 'stable';
  }

  /**
   * Assess job change likelihood
   */
  assessJobChangeLikelihood(personData) {
    const tenure = personData.tenure || 0;
    const avgTenure = personData.avgTenure || 36; // months

    // Just joined = low likelihood
    if (tenure < 12) return 'low';

    // Above average tenure = moderate to high likelihood
    if (tenure > avgTenure * 1.5) return 'moderate';
    if (tenure > avgTenure * 2) return 'high';

    return 'low';
  }

  /**
   * Calculate trajectory score
   */
  calculateTrajectoryScore(trend, velocity) {
    let score = 50; // Base

    if (trend === 'rising_star') score += 30;
    else if (trend === 'stable') score += 15;

    if (velocity === 'very_fast') score += 20;
    else if (velocity === 'fast') score += 15;
    else if (velocity === 'moderate') score += 10;

    return Math.min(100, score);
  }
}

module.exports = { CareerTrajectoryAnalyzer };

