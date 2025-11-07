/**
 * Role Match Scorer Module
 * 
 * Calculates confidence scores for role matches
 * Evaluates match quality based on hierarchy level and data completeness
 */

class RoleMatchScorer {
  /**
   * Calculate role match confidence
   * @param {object} person - Coresignal person data
   * @param {string} matchedRole - Role that was matched
   * @param {string} matchLevel - Match level (primary/secondary/tertiary)
   * @returns {object} Match confidence with factors and reasoning
   */
  calculateConfidence(person, matchedRole, matchLevel) {
    let score = 0;
    const factors = [];
    
    // Base score by match level
    if (matchLevel === 'primary') {
      score += 90;
      factors.push('Primary role match (+90)');
    } else if (matchLevel === 'secondary') {
      score += 75;
      factors.push('Secondary role match (+75)');
    } else if (matchLevel === 'tertiary') {
      score += 60;
      factors.push('Tertiary role match (+60)');
    }
    
    // Bonus factors
    if (person.experience?.some(exp => exp.active_experience === 1)) {
      score += 10;
      factors.push('Active experience (+10)');
    }
    
    if (person.linkedin_url) {
      score += 5;
      factors.push('LinkedIn URL present (+5)');
    }
    
    if (person.primary_professional_email || person.professional_emails_collection?.length > 0) {
      score += 5;
      factors.push('Professional email present (+5)');
    }
    
    // Cap at 100
    score = Math.min(score, 100);
    
    return {
      confidence: score,
      factors,
      reasoning: `Match confidence: ${score}% based on ${factors.join(', ')}`
    };
  }
}

module.exports = { RoleMatchScorer };

