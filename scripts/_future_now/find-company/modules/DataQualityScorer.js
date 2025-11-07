/**
 * Data Quality Scorer Module
 * 
 * Calculates data quality scores for enriched companies
 * Evaluates completeness and accuracy of data
 */

class DataQualityScorer {
  /**
   * Calculate data quality score for a company
   * @param {object} company - Database company record
   * @param {object} profileData - Coresignal profile data
   * @returns {number} Quality score (0-100)
   */
  calculateScore(company, profileData) {
    let score = 0;
    let maxScore = 0;

    // Core fields (40 points)
    maxScore += 40;
    if (company.name) score += 10;
    if (company.website || profileData.website) score += 10;
    if (company.linkedinUrl || profileData.linkedin_url) score += 10;
    if (company.description || profileData.description) score += 10;

    // Coresignal data (40 points)
    maxScore += 40;
    if (profileData.description) score += 10;
    if (profileData.industry) score += 10;
    if (profileData.employee_count || profileData.size_range) score += 10;
    if (profileData.founded_year) score += 10;

    // Business data (20 points)
    maxScore += 20;
    if (profileData.revenue_annual) score += 10;
    if (profileData.stock_ticker || profileData.ownership_status) score += 10;

    return Math.round((score / maxScore) * 100);
  }
}

module.exports = { DataQualityScorer };

