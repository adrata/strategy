/**
 * Data Quality Scorer Module
 * 
 * Calculates data quality scores for enriched people
 * Evaluates completeness and accuracy of person data
 */

class DataQualityScorer {
  /**
   * Calculate data quality score for a person
   * @param {object} person - Database person record
   * @param {object} profileData - Coresignal profile data
   * @returns {number} Quality score (0-100)
   */
  calculateScore(person, profileData) {
    let score = 0;
    let maxScore = 0;

    // Core fields (40 points)
    maxScore += 40;
    if (person.name) score += 10;
    if (person.email || profileData.email) score += 10;
    if (person.linkedinUrl || profileData.linkedin_url) score += 10;
    if (person.title || profileData.title) score += 10;

    // Coresignal data (40 points)
    maxScore += 40;
    if (profileData.title) score += 10;
    if (profileData.location) score += 10;
    if (profileData.experience && profileData.experience.length > 0) score += 10;
    if (profileData.education && profileData.education.length > 0) score += 10;

    // Professional data (20 points)
    maxScore += 20;
    if (profileData.skills && profileData.skills.length > 0) score += 10;
    if (profileData.summary) score += 10;

    return Math.round((score / maxScore) * 100);
  }
}

module.exports = { DataQualityScorer };

