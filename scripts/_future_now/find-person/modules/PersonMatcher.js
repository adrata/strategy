/**
 * Person Matcher Module
 * 
 * Calculates confidence scores for person matching
 * Ensures we match the correct person from Coresignal data
 */

class PersonMatcher {
  /**
   * Calculate person match confidence
   * @param {object} person - Database person record
   * @param {object} coresignalProfile - Coresignal person profile
   * @returns {object} Match confidence with factors and reasoning
   */
  calculateMatchConfidence(person, coresignalProfile) {
    let score = 0;
    let factors = [];
    
    // Email match (50 points)
    if (person.email && coresignalProfile.email) {
      const emailMatch = person.email.toLowerCase().trim() === coresignalProfile.email.toLowerCase().trim();
      score += emailMatch ? 50 : 0;
      factors.push({ factor: 'email', score: emailMatch ? 50 : 0, weight: 0.5 });
    }
    
    // LinkedIn URL match (50 points)
    if (person.linkedinUrl && coresignalProfile.linkedin_url) {
      const linkedinMatch = this.normalizeLinkedInUrl(person.linkedinUrl) === 
                            this.normalizeLinkedInUrl(coresignalProfile.linkedin_url);
      score += linkedinMatch ? 50 : 0;
      factors.push({ factor: 'linkedin', score: linkedinMatch ? 50 : 0, weight: 0.5 });
    }
    
    // Name similarity bonus (up to 20 points)
    if (person.name && coresignalProfile.full_name) {
      const nameSimilarity = this.calculateNameSimilarity(person.name, coresignalProfile.full_name);
      score += nameSimilarity * 20;
      factors.push({ factor: 'name', score: nameSimilarity * 100, weight: 0.2 });
    }
    
    return { 
      confidence: Math.min(100, score), 
      factors, 
      reasoning: `Email: ${person.email === coresignalProfile.email ? 'Match' : 'No match'}, LinkedIn: ${person.linkedinUrl === coresignalProfile.linkedin_url ? 'Match' : 'No match'}` 
    };
  }

  /**
   * Calculate name similarity between two names
   * @param {string} name1 - First name
   * @param {string} name2 - Second name
   * @returns {number} Similarity score (0-1)
   */
  calculateNameSimilarity(name1, name2) {
    if (!name1 || !name2) return 0;
    
    const normalize = (name) => name.toLowerCase().replace(/[^a-z\s]/g, '').trim();
    const n1 = normalize(name1);
    const n2 = normalize(name2);
    
    if (n1 === n2) return 1;
    
    const words1 = n1.split(/\s+/);
    const words2 = n2.split(/\s+/);
    
    let matches = 0;
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1 === word2 && word1.length > 2) {
          matches++;
          break;
        }
      }
    }
    
    return matches / Math.max(words1.length, words2.length);
  }

  /**
   * Normalize LinkedIn URL for comparison
   * @param {string} url - LinkedIn URL
   * @returns {string} Normalized URL
   */
  normalizeLinkedInUrl(url) {
    if (!url) return '';
    
    let normalized = url.replace(/^https?:\/\/(www\.)?/, '');
    normalized = normalized.replace(/\/$/, '');
    normalized = normalized.toLowerCase();
    
    return normalized;
  }
}

module.exports = { PersonMatcher };

