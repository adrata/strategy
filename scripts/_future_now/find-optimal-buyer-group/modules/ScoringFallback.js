/**
 * Scoring Fallback Module
 * 
 * Provides rule-based scoring when AI is unavailable
 * Uses firmographic and growth signals for scoring
 */

class ScoringFallback {
  constructor(qualificationCriteria, scoringWeights) {
    this.criteria = qualificationCriteria;
    this.weights = scoringWeights;
  }

  /**
   * Score company using rule-based logic
   * @param {object} company - Company profile data
   * @returns {object} Scoring results
   */
  score(company) {
    let firmographicFit = 50;
    let growthSignals = 50;
    let technologyAdoption = 50;
    let adoptionMaturity = 50;
    
    // Firmographic fit scoring
    if (this.criteria.industries.includes(company.company_industry)) {
      firmographicFit += 30;
    }
    if (company.company_size_range === this.criteria.sizeRange) {
      firmographicFit += 20;
    }
    
    // Growth signals scoring
    if (company.company_employees_count_change_yearly_percentage > 20) {
      growthSignals += 30;
    }
    if (company.company_last_funding_round_date) {
      growthSignals += 20;
    }
    
    // Technology adoption scoring
    if (company.company_categories_and_keywords?.length > 0) {
      technologyAdoption += 30;
    }
    if (company.company_followers_count > 1000) {
      technologyAdoption += 20;
    }
    
    // Adoption maturity scoring
    const companyAge = new Date().getFullYear() - parseInt(company.company_founded_year);
    if (companyAge >= 2 && companyAge <= 10 && company.company_employees_count_change_yearly_percentage > 15) {
      adoptionMaturity = 80;
    } else if (companyAge <= 5 && company.company_employees_count_change_yearly_percentage > 10) {
      adoptionMaturity = 70;
    }
    
    const buyerReadinessScore = Math.round(
      firmographicFit * this.weights.firmographicFit +
      growthSignals * this.weights.growthSignals +
      technologyAdoption * this.weights.technologyAdoption +
      adoptionMaturity * this.weights.adoptionMaturity
    );
    
    return {
      firmographicFitScore: Math.min(100, firmographicFit),
      growthSignalsScore: Math.min(100, growthSignals),
      technologyAdoptionScore: Math.min(100, technologyAdoption),
      adoptionMaturityScore: Math.min(100, adoptionMaturity),
      buyerReadinessScore: Math.min(100, buyerReadinessScore),
      reasoning: `Rule-based scoring: ${company.company_industry} company with ${company.company_employees_count} employees`,
      adoptionMaturityProfile: adoptionMaturity >= 80 ? 'trailblazer' : adoptionMaturity >= 70 ? 'early_adopter' : 'pragmatist',
      keyStrengths: [
        `${company.company_employees_count_change_yearly_percentage}% growth rate`,
        company.company_last_funding_round_date ? 'Recent funding' : 'Established company'
      ],
      buyerReadinessIndicators: [
        company.company_employees_count_change_yearly_percentage > 15 ? 'High growth' : 'Stable growth',
        company.company_categories_and_keywords?.length > 0 ? 'Tech-focused' : 'Traditional'
      ]
    };
  }
}

module.exports = { ScoringFallback };

