/**
 * Smart Scoring Module
 * 
 * Multi-dimensional scoring of preview results to identify best candidates
 * before expensive collect API calls
 */

const { calculateOverallConfidence } = require('./utils');

class SmartScoring {
  constructor(companyIntelligence, dealSize, productCategory = 'sales', customFiltering = null) {
    this.intelligence = companyIntelligence;
    this.dealSize = dealSize;
    this.productCategory = productCategory;
    this.customFiltering = customFiltering;
  }

  /**
   * Score all employees with multi-dimensional analysis
   * @param {Array} previewEmployees - Array of employee previews
   * @returns {Array} Array of scored employees
   */
  scoreEmployees(previewEmployees) {
    console.log(`🎯 Scoring ${previewEmployees.length} employees...`);
    
    const scoredEmployees = previewEmployees.map(emp => {
      const scores = this.calculateAllScores(emp);
      const overallScore = calculateOverallConfidence(scores);
      const relevance = this.calculateRelevance(emp);
      
      return {
        ...emp,
        scores,
        overallScore,
        relevance,
        isHighValue: overallScore > 70 && relevance > 0.5
      };
    });
    
    // Sort by overall score descending
    scoredEmployees.sort((a, b) => b.overallScore - a.overallScore);
    
    console.log(`📊 Scoring complete. High-value candidates: ${scoredEmployees.filter(e => e.isHighValue).length}`);
    
    return scoredEmployees;
  }

  /**
   * Calculate all scoring dimensions
   * @param {object} employee - Employee preview data
   * @returns {object} All scores
   */
  calculateAllScores(employee) {
    return {
      seniority: this.scoreSeniority(employee),
      departmentFit: this.scoreDepartmentFit(employee),
      influence: this.scoreInfluence(employee),
      championPotential: this.scoreChampionPotential(employee),
      crossFunctional: this.scoreCrossFunctional(employee),
      geoAlignment: this.scoreGeography(employee)
    };
  }

  /**
   * Check if employee is C-level executive
   * @param {string} title - Employee title
   * @returns {boolean} True if C-level executive
   */
  isCLevelExecutive(title) {
    const titleLower = (title || '').toLowerCase();
    return titleLower.includes('ceo') ||
           titleLower.includes('founder') ||
           titleLower.includes('president') ||
           titleLower.includes('chief executive') ||
           titleLower.includes('managing director') ||
           titleLower.includes('owner');
  }

  /**
   * Score seniority appropriateness for deal size
   * @param {object} employee - Employee data
   * @returns {number} Seniority score (0-10)
   */
  scoreSeniority(employee) {
    const title = employee.title?.toLowerCase() || '';
    const mgmtLevel = employee.managementLevel?.toLowerCase() || '';
    
    // C-level executives always get max score for any deal size
    if (this.isCLevelExecutive(employee.title)) {
      return 10;
    }
    
    // Score based on deal size appropriateness
    if (this.dealSize < 150000) {
      // $75K-$150K deals: VP/Senior Director level
      if (title.includes('vp') || title.includes('vice president')) return 10;
      if (title.includes('senior director')) return 9;
      if (title.includes('director')) return 8;
      if (title.includes('manager')) return 6;
      if (title.includes('lead')) return 5;
    } else if (this.dealSize < 500000) {
      // $150K-$500K deals: SVP/VP level
      if (title.includes('svp') || title.includes('senior vice president')) return 10;
      if (title.includes('vp') || title.includes('vice president')) return 9;
      if (title.includes('senior director')) return 8;
      if (title.includes('director')) return 7;
    } else {
      // $500K+ deals: C-level
      if (title.includes('chief') || title.includes('president') || title.includes('ceo')) return 10;
      if (title.includes('svp') || title.includes('senior vice president')) return 9;
      if (title.includes('vp') || title.includes('vice president')) return 8;
    }
    
    // Default scoring based on management level
    if (mgmtLevel.includes('c-level') || mgmtLevel.includes('executive')) return 8;
    if (mgmtLevel.includes('senior management')) return 7;
    if (mgmtLevel.includes('middle management')) return 6;
    if (mgmtLevel.includes('first-line management')) return 5;
    
    return 3; // Default for unknown
  }

  /**
   * Score department fit for product category
   * @param {object} employee - Employee data
   * @returns {number} Department fit score (0-10)
   */
  scoreDepartmentFit(employee) {
    const dept = employee.department?.toLowerCase() || '';
    const title = employee.title?.toLowerCase() || '';
    
    // Use custom filtering if provided
    if (this.customFiltering && this.customFiltering.departments) {
      const primary = this.customFiltering.departments.primary || [];
      const secondary = this.customFiltering.departments.secondary || [];
      
      // Check primary departments
      if (primary.some(d => dept.includes(d.toLowerCase()) || title.includes(d.toLowerCase()))) {
        return 10;
      }
      
      // Check secondary departments
      if (secondary.some(d => dept.includes(d.toLowerCase()) || title.includes(d.toLowerCase()))) {
        return 8;
      }
      
      // Check primary titles
      if (this.customFiltering.titles?.primary) {
        const primaryTitles = this.customFiltering.titles.primary || [];
        if (primaryTitles.some(t => title.includes(t.toLowerCase()))) {
          return 9;
        }
      }
      
      // Check secondary titles
      if (this.customFiltering.titles?.secondary) {
        const secondaryTitles = this.customFiltering.titles.secondary || [];
        if (secondaryTitles.some(t => title.includes(t.toLowerCase()))) {
          return 7;
        }
      }
      
      return 4; // Default for custom filtering
    }
    
    // Product-specific relevance (for Sales software)
    if (this.productCategory === 'sales') {
      // Primary relevance - direct users and decision makers
      const primaryDepts = ['sales', 'revenue', 'operations', 'business development', 'sales enablement', 'revenue operations'];
      const primaryTitles = ['sales', 'revenue', 'business development', 'account executive', 'cro', 'chief revenue officer'];
      
      if (primaryDepts.some(d => dept.includes(d))) return 10;
      if (primaryTitles.some(t => title.includes(t))) return 9;
      
      // Secondary relevance - influencers and adjacent functions
      const secondaryDepts = ['marketing', 'product']; // Only if sales enablement related
      if (secondaryDepts.some(d => dept.includes(d))) {
        // Check if it's sales enablement related
        if (title.includes('sales enablement') || title.includes('revenue') || title.includes('growth')) {
          return 8;
        }
        return 6; // General marketing/product
      }
      
      // Technical relevance for sales tools
      const techDepts = ['it', 'technology', 'engineering'];
      if (techDepts.some(d => dept.includes(d))) return 6;
      
      // EXCLUDE Customer Success unless managing sales
      if (dept.includes('customer success') || dept.includes('customer service')) {
        // Special case: Customer Success managing sales
        if (title.includes('sales') || title.includes('revenue') || title.includes('business development')) {
          return 7; // Include if managing sales
        }
        return 2; // Exclude otherwise
      }
    }
    
    // General scoring for other products
    const highRelevanceDepts = ['operations', 'strategy', 'product'];
    const mediumRelevanceDepts = ['finance', 'hr', 'legal'];
    
    if (highRelevanceDepts.some(d => dept.includes(d))) return 8;
    if (mediumRelevanceDepts.some(d => dept.includes(d))) return 5;
    
    return 4; // Default
  }

  /**
   * Score organizational influence
   * @param {object} employee - Employee data
   * @returns {number} Influence score (0-10)
   */
  scoreInfluence(employee) {
    let score = 0;
    
    // C-level executives get max influence score
    if (this.isCLevelExecutive(employee.title)) {
      return 10;
    }
    
    // Network size
    const connections = employee.connectionsCount || 0;
    if (connections > 1000) score += 4;
    else if (connections > 500) score += 3;
    else if (connections > 200) score += 2;
    else if (connections > 50) score += 1;
    
    // Followers
    const followers = employee.followersCount || 0;
    if (followers > 5000) score += 3;
    else if (followers > 1000) score += 2;
    else if (followers > 100) score += 1;
    
    // Management level
    const mgmtLevel = employee.managementLevel?.toLowerCase() || '';
    if (mgmtLevel.includes('c-level')) score += 3;
    else if (mgmtLevel.includes('senior management')) score += 2;
    else if (mgmtLevel.includes('middle management')) score += 1;
    
    return Math.min(score, 10);
  }

  /**
   * Score champion potential (internal advocate)
   * @param {object} employee - Employee data
   * @returns {number} Champion potential score (0-25)
   */
  scoreChampionPotential(employee) {
    const title = employee.title?.toLowerCase() || '';
    const dept = employee.department?.toLowerCase() || '';
    let score = 0;
    
    // Right level (Director/Senior Manager - can advocate but doesn't sign)
    if (title.includes('director') && !title.includes('senior director')) score += 10;
    if (title.includes('senior manager') || title.includes('sr manager')) score += 8;
    if (title.includes('manager') && !title.includes('senior')) score += 6;
    
    // Relevant department for advocacy
    if (dept.includes('sales') || dept.includes('revenue') || dept.includes('operations')) score += 8;
    if (dept.includes('product') || dept.includes('marketing')) score += 6;
    
    // Network influence for internal advocacy
    const connections = employee.connectionsCount || 0;
    if (connections > 500) score += 5;
    if (connections > 200) score += 3;
    
    // Followers indicate thought leadership
    const followers = employee.followersCount || 0;
    if (followers > 1000) score += 2;
    if (followers > 100) score += 1;
    
    return Math.min(score, 25);
  }

  /**
   * Score cross-functional collaboration ability
   * @param {object} employee - Employee data
   * @returns {number} Cross-functional score (0-10)
   */
  scoreCrossFunctional(employee) {
    const dept = employee.department?.toLowerCase() || '';
    const title = employee.title?.toLowerCase() || '';
    let score = 0;
    
    // Departments that typically collaborate across functions
    const collaborativeDepts = ['operations', 'strategy', 'product', 'sales'];
    if (collaborativeDepts.some(d => dept.includes(d))) score += 4;
    
    // Titles that indicate cross-functional work
    const collaborativeTitles = ['director', 'manager', 'lead', 'coordinator'];
    if (collaborativeTitles.some(t => title.includes(t))) score += 3;
    
    // Management level indicates broader scope
    const mgmtLevel = employee.managementLevel?.toLowerCase() || '';
    if (mgmtLevel.includes('senior management')) score += 2;
    if (mgmtLevel.includes('middle management')) score += 1;
    
    // Network size indicates relationship building
    const connections = employee.connectionsCount || 0;
    if (connections > 500) score += 1;
    
    return Math.min(score, 10);
  }

  /**
   * Score geographic alignment (placeholder for future implementation)
   * @param {object} employee - Employee data
   * @returns {number} Geographic score (0-10)
   */
  scoreGeography(employee) {
    // Placeholder - would analyze location data if available
    // For now, assume all employees are aligned
    return 8;
  }

  /**
   * Calculate product relevance
   * @param {object} employee - Employee data
   * @returns {number} Relevance score (0-1)
   */
  calculateRelevance(employee) {
    const dept = employee.department?.toLowerCase() || '';
    const title = employee.title?.toLowerCase() || '';
    
    // C-level executives always get high relevance
    if (this.isCLevelExecutive(employee.title)) {
      return 0.9; // High relevance for any C-level executive
    }
    
    let relevance = 0;
    
    // Use custom filtering if provided
    if (this.customFiltering && this.customFiltering.departments) {
      const primary = this.customFiltering.departments.primary || [];
      const secondary = this.customFiltering.departments.secondary || [];
      
      if (primary.some(d => dept.includes(d.toLowerCase()) || title.includes(d.toLowerCase()))) {
        relevance += 0.5;
      }
      if (secondary.some(d => dept.includes(d.toLowerCase()) || title.includes(d.toLowerCase()))) {
        relevance += 0.3;
      }
      
      if (this.customFiltering.titles?.primary) {
        const primaryTitles = this.customFiltering.titles.primary || [];
        if (primaryTitles.some(t => title.includes(t.toLowerCase()))) {
          relevance += 0.4;
        }
      }
      
      return Math.min(relevance, 1.0);
    }
    
    // Product-specific relevance calculation
    if (this.productCategory === 'sales') {
      // Primary relevance (direct users and decision makers)
      const primaryDepts = ['sales', 'revenue', 'operations', 'business development', 'sales enablement', 'revenue operations'];
      const primaryTitles = ['sales', 'revenue', 'business development', 'account', 'cro', 'chief revenue officer'];
      
      if (primaryDepts.some(d => dept.includes(d))) relevance += 0.5;
      if (primaryTitles.some(t => title.includes(t))) relevance += 0.4;
      
      // Secondary relevance (influencers) - more restrictive
      const secondaryDepts = ['marketing', 'product']; // Removed customer success
      const secondaryTitles = ['marketing', 'product', 'strategy'];
      
      if (secondaryDepts.some(d => dept.includes(d))) {
        // Only if sales enablement related
        if (title.includes('sales enablement') || title.includes('revenue') || title.includes('growth')) {
          relevance += 0.3;
        } else {
          relevance += 0.1; // General marketing/product
        }
      }
      if (secondaryTitles.some(t => title.includes(t))) relevance += 0.1;
      
      // EXCLUDE Customer Success unless managing sales
      if (dept.includes('customer success') || dept.includes('customer service')) {
        if (title.includes('sales') || title.includes('revenue') || title.includes('business development')) {
          relevance += 0.3; // Include if managing sales
        } else {
          relevance = 0.1; // Exclude otherwise
        }
      }
    } else {
      // General relevance for other products
      const primaryDepts = ['operations', 'strategy', 'product'];
      const primaryTitles = ['operations', 'strategy', 'product', 'director', 'manager'];
      
      if (primaryDepts.some(d => dept.includes(d))) relevance += 0.4;
      if (primaryTitles.some(t => title.includes(t))) relevance += 0.3;
      
      const secondaryDepts = ['marketing', 'finance', 'it'];
      const secondaryTitles = ['marketing', 'finance', 'it', 'technology'];
      
      if (secondaryDepts.some(d => dept.includes(d))) relevance += 0.2;
      if (secondaryTitles.some(t => title.includes(t))) relevance += 0.1;
    }
    
    return Math.min(relevance, 1.0);
  }

  /**
   * Filter employees by minimum scores
   * @param {Array} scoredEmployees - Array of scored employees
   * @param {object} thresholds - Minimum score thresholds
   * @returns {Array} Filtered employees
   */
  filterByThresholds(scoredEmployees, thresholds = {}) {
    const {
      minOverallScore = 50,
      minRelevance = 0.3,
      minInfluence = 5,
      minChampionPotential = 10
    } = thresholds;
    
    return scoredEmployees.filter(emp => 
      emp.overallScore >= minOverallScore &&
      emp.relevance >= minRelevance &&
      emp.scores.influence >= minInfluence &&
      emp.scores.championPotential >= minChampionPotential
    );
  }

  /**
   * Get top candidates by category
   * @param {Array} scoredEmployees - Array of scored employees
   * @param {number} limit - Maximum number per category
   * @returns {object} Top candidates by category
   */
  getTopCandidates(scoredEmployees, limit = 5) {
    const categories = {
      decisionMakers: [],
      champions: [],
      influencers: [],
      crossFunctional: []
    };
    
    // Sort by specific scores
    const bySeniority = [...scoredEmployees].sort((a, b) => b.scores.seniority - a.scores.seniority);
    const byChampion = [...scoredEmployees].sort((a, b) => b.scores.championPotential - a.scores.championPotential);
    const byInfluence = [...scoredEmployees].sort((a, b) => b.scores.influence - a.scores.influence);
    const byCrossFunctional = [...scoredEmployees].sort((a, b) => b.scores.crossFunctional - a.scores.crossFunctional);
    
    categories.decisionMakers = bySeniority.slice(0, limit);
    categories.champions = byChampion.slice(0, limit);
    categories.influencers = byInfluence.slice(0, limit);
    categories.crossFunctional = byCrossFunctional.slice(0, limit);
    
    return categories;
  }

  /**
   * Generate scoring summary
   * @param {Array} scoredEmployees - Array of scored employees
   * @returns {object} Scoring summary
   */
  generateScoringSummary(scoredEmployees) {
    const total = scoredEmployees.length;
    const highValue = scoredEmployees.filter(e => e.isHighValue).length;
    const avgOverallScore = scoredEmployees.reduce((sum, e) => sum + e.overallScore, 0) / total;
    
    const scoreDistribution = {
      excellent: scoredEmployees.filter(e => e.overallScore >= 80).length,
      good: scoredEmployees.filter(e => e.overallScore >= 60 && e.overallScore < 80).length,
      fair: scoredEmployees.filter(e => e.overallScore >= 40 && e.overallScore < 60).length,
      poor: scoredEmployees.filter(e => e.overallScore < 40).length
    };
    
    return {
      total,
      highValue,
      avgOverallScore: Math.round(avgOverallScore),
      scoreDistribution,
      recommendation: highValue > 10 ? 'Proceed with collection' : 'Consider expanding search'
    };
  }
}

module.exports = { SmartScoring };
