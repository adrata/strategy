/**
 * Company Matcher Module
 * 
 * Calculates confidence scores for company matching
 * Ensures we match the correct company from Coresignal data
 */

class CompanyMatcher {
  /**
   * Calculate company match confidence
   * @param {object} company - Database company record
   * @param {object} coresignalProfile - Coresignal company profile
   * @returns {object} Match confidence with factors and reasoning
   */
  calculateMatchConfidence(company, coresignalProfile) {
    let score = 0;
    let factors = [];
    
    // Website/Domain match (100 points) - EXACT match required for companies
    const companyDomain = this.extractDomain(company.website);
    const coresignalDomain = this.extractDomain(coresignalProfile.website);
    
    if (companyDomain && coresignalDomain) {
      const domainMatch = this.normalizeDomain(companyDomain) === this.normalizeDomain(coresignalDomain);
      score += domainMatch ? 100 : 0;
      factors.push({ factor: 'domain', score: domainMatch ? 100 : 0, weight: 1.0 });
    }
    
    // If no exact domain match, this is not the right company
    if (score === 0) {
      return { 
        confidence: 0, 
        factors, 
        reasoning: `No exact domain match: ${companyDomain} vs ${coresignalDomain}` 
      };
    }
    
    // Bonus points for additional matches (but domain is the key)
    if (company.linkedinUrl && coresignalProfile.linkedin_url) {
      const linkedinMatch = this.normalizeLinkedInUrl(company.linkedinUrl) === 
                            this.normalizeLinkedInUrl(coresignalProfile.linkedin_url);
      if (linkedinMatch) {
        score += 5; // Bonus for LinkedIn match
        factors.push({ factor: 'linkedin', score: 100, weight: 0.05 });
      }
    }
    
    return { 
      confidence: Math.min(100, score), 
      factors, 
      reasoning: `Exact domain match: ${companyDomain} = ${coresignalDomain}` 
    };
  }

  /**
   * Extract domain from website URL
   * @param {string} website - Website URL
   * @returns {string|null} Clean domain
   */
  extractDomain(website) {
    if (!website) return null;
    try {
      const url = new URL(website.startsWith('http') ? website : `https://${website}`);
      return url.hostname.replace('www.', '');
    } catch (error) {
      return null;
    }
  }

  /**
   * Normalize domain for comparison
   * @param {string} domain - Domain to normalize
   * @returns {string} Normalized domain
   */
  normalizeDomain(domain) {
    if (!domain) return '';
    
    // Remove protocol and www
    let normalized = domain.replace(/^https?:\/\/(www\.)?/, '');
    
    // Remove trailing slash
    normalized = normalized.replace(/\/$/, '');
    
    // Convert to lowercase
    normalized = normalized.toLowerCase();
    
    return normalized;
  }

  /**
   * Normalize LinkedIn URL for comparison
   * @param {string} url - LinkedIn URL to normalize
   * @returns {string} Normalized URL
   */
  normalizeLinkedInUrl(url) {
    if (!url) return '';
    
    // Remove protocol and www
    let normalized = url.replace(/^https?:\/\/(www\.)?/, '');
    
    // Remove trailing slash
    normalized = normalized.replace(/\/$/, '');
    
    // Convert to lowercase
    normalized = normalized.toLowerCase();
    
    return normalized;
  }
}

module.exports = { CompanyMatcher };

