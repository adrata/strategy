/**
 * Cohesion Validator Module
 * 
 * Multi-factor cohesion analysis to prove buyer group will work together
 * Analyzes reporting proximity, department clustering, seniority balance, etc.
 */

class CohesionValidator {
  constructor() {
    this.weights = {
      reportingProximity: 0.30,    // Do they share executives?
      departmentClustering: 0.25,  // Adjacent departments?
      seniorityBalance: 0.20,     // Right mix of levels?
      geographicAlignment: 0.15,  // Same location?
      functionalInterdependence: 0.10 // Work together regularly?
    };
  }

  /**
   * Validate buyer group cohesion
   * @param {Array} buyerGroup - Buyer group members
   * @returns {object} Cohesion analysis results
   */
  validate(buyerGroup) {
    console.log(`🔗 Analyzing cohesion for ${buyerGroup.length} member buyer group...`);
    
    const factors = {
      reportingProximity: this.analyzeReporting(buyerGroup),
      departmentClustering: this.analyzeDepartments(buyerGroup),
      seniorityBalance: this.analyzeSeniority(buyerGroup),
      geographicAlignment: this.analyzeGeography(buyerGroup),
      functionalInterdependence: this.analyzeDependencies(buyerGroup)
    };
    
    const score = this.calculateWeightedScore(factors);
    const confidence = this.getConfidenceLevel(score);
    const reasoning = this.generateReasoning(factors, score);
    
    console.log(`📊 Cohesion score: ${score}% (${confidence})`);
    
    return {
      score,
      confidence,
      factors,
      reasoning,
      recommendations: this.generateRecommendations(factors, score)
    };
  }

  /**
   * Analyze reporting proximity (do they share executives?)
   * @param {Array} buyerGroup - Buyer group members
   * @returns {number} Reporting proximity score (0-100)
   */
  analyzeReporting(buyerGroup) {
    // Placeholder implementation - would analyze actual reporting chains
    // For now, simulate based on department adjacency and seniority
    
    let proximityScore = 0;
    
    // Group by likely reporting levels
    const cLevel = buyerGroup.filter(m => this.isCLevel(m.title));
    const vpLevel = buyerGroup.filter(m => this.isVPLevel(m.title));
    const directorLevel = buyerGroup.filter(m => this.isDirectorLevel(m.title));
    const managerLevel = buyerGroup.filter(m => this.isManagerLevel(m.title));
    
    // Higher score if we have clear hierarchy
    if (cLevel.length > 0 && vpLevel.length > 0) proximityScore += 30;
    if (vpLevel.length > 0 && directorLevel.length > 0) proximityScore += 25;
    if (directorLevel.length > 0 && managerLevel.length > 0) proximityScore += 20;
    
    // Bonus for having multiple levels (indicates collaboration)
    const levelCount = [cLevel, vpLevel, directorLevel, managerLevel].filter(level => level.length > 0).length;
    proximityScore += levelCount * 5;
    
    return Math.min(proximityScore, 100);
  }

  /**
   * Analyze department clustering (adjacent departments?)
   * @param {Array} buyerGroup - Buyer group members
   * @returns {number} Department clustering score (0-100)
   */
  analyzeDepartments(buyerGroup) {
    const departments = buyerGroup.map(m => m.department?.toLowerCase() || 'unknown');
    const departmentGroups = this.getDepartmentGroups();
    
    let clusteringScore = 0;
    let adjacentPairs = 0;
    
    // Check for adjacent department pairs
    for (let i = 0; i < departments.length; i++) {
      for (let j = i + 1; j < departments.length; j++) {
        if (this.areDepartmentsAdjacent(departments[i], departments[j], departmentGroups)) {
          adjacentPairs++;
        }
      }
    }
    
    // Calculate clustering score based on adjacent pairs
    const totalPossiblePairs = (departments.length * (departments.length - 1)) / 2;
    clusteringScore = totalPossiblePairs > 0 ? (adjacentPairs / totalPossiblePairs) * 100 : 50;
    
    return Math.round(clusteringScore);
  }

  /**
   * Analyze seniority balance (right mix of levels?)
   * @param {Array} buyerGroup - Buyer group members
   * @returns {number} Seniority balance score (0-100)
   */
  analyzeSeniority(buyerGroup) {
    const seniorityDistribution = {
      cLevel: buyerGroup.filter(m => this.isCLevel(m.title)).length,
      vpLevel: buyerGroup.filter(m => this.isVPLevel(m.title)).length,
      directorLevel: buyerGroup.filter(m => this.isDirectorLevel(m.title)).length,
      managerLevel: buyerGroup.filter(m => this.isManagerLevel(m.title)).length,
      individualContributor: buyerGroup.filter(m => this.isIndividualContributor(m.title)).length
    };
    
    let balanceScore = 0;
    
    // Ideal distribution for buyer groups
    const idealDistribution = {
      cLevel: 0.1,      // 10% C-level
      vpLevel: 0.2,     // 20% VP level
      directorLevel: 0.3, // 30% Director level
      managerLevel: 0.3,  // 30% Manager level
      individualContributor: 0.1 // 10% Individual contributors
    };
    
    const total = buyerGroup.length;
    
    // Calculate how close we are to ideal distribution
    Object.keys(idealDistribution).forEach(level => {
      const actual = seniorityDistribution[level] / total;
      const ideal = idealDistribution[level];
      const deviation = Math.abs(actual - ideal);
      balanceScore += (1 - deviation) * 20; // Each level contributes up to 20 points
    });
    
    return Math.min(Math.round(balanceScore), 100);
  }

  /**
   * Analyze geographic alignment (same location?)
   * @param {Array} buyerGroup - Buyer group members
   * @returns {number} Geographic alignment score (0-100)
   */
  analyzeGeography(buyerGroup) {
    // Placeholder implementation - would analyze actual location data
    // For now, assume good alignment for most cases
    
    // If we had location data, we would:
    // 1. Group by city/region
    // 2. Calculate percentage in same location
    // 3. Score based on geographic proximity
    
    // For now, return a reasonable default
    return 75;
  }

  /**
   * Analyze functional interdependence (work together regularly?)
   * @param {Array} buyerGroup - Buyer group members
   * @returns {number} Functional interdependence score (0-100)
   */
  analyzeDependencies(buyerGroup) {
    const departments = buyerGroup.map(m => m.department?.toLowerCase() || 'unknown');
    const interdependentPairs = [
      ['sales', 'operations'],
      ['sales', 'marketing'],
      ['product', 'engineering'],
      ['finance', 'operations'],
      ['hr', 'operations'],
      ['legal', 'compliance'],
      ['security', 'it']
    ];
    
    let interdependenceScore = 0;
    let interdependentCount = 0;
    
    // Check for interdependent department pairs
    interdependentPairs.forEach(([dept1, dept2]) => {
      const hasDept1 = departments.some(d => d.includes(dept1));
      const hasDept2 = departments.some(d => d.includes(dept2));
      
      if (hasDept1 && hasDept2) {
        interdependentCount++;
      }
    });
    
    // Score based on number of interdependent pairs
    interdependenceScore = (interdependentCount / interdependentPairs.length) * 100;
    
    return Math.round(interdependenceScore);
  }

  /**
   * Calculate weighted cohesion score
   * @param {object} factors - Individual factor scores
   * @returns {number} Weighted score (0-100)
   */
  calculateWeightedScore(factors) {
    let weightedSum = 0;
    let totalWeight = 0;
    
    Object.entries(this.weights).forEach(([factor, weight]) => {
      if (factors[factor] !== undefined) {
        weightedSum += factors[factor] * weight;
        totalWeight += weight;
      }
    });
    
    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  }

  /**
   * Get confidence level based on score
   * @param {number} score - Cohesion score
   * @returns {string} Confidence level
   */
  getConfidenceLevel(score) {
    if (score >= 80) return 'HIGH';
    if (score >= 65) return 'MEDIUM';
    if (score >= 50) return 'LOW';
    return 'VERY_LOW';
  }

  /**
   * Generate reasoning for cohesion score
   * @param {object} factors - Individual factor scores
   * @param {number} score - Overall score
   * @returns {string} Reasoning explanation
   */
  generateReasoning(factors, score) {
    const reasoning = [];
    
    if (factors.reportingProximity > 70) {
      reasoning.push('Strong reporting relationships');
    } else if (factors.reportingProximity < 40) {
      reasoning.push('Limited reporting proximity');
    }
    
    if (factors.departmentClustering > 70) {
      reasoning.push('Good department collaboration');
    } else if (factors.departmentClustering < 40) {
      reasoning.push('Departments may not collaborate regularly');
    }
    
    if (factors.seniorityBalance > 70) {
      reasoning.push('Well-balanced seniority levels');
    } else if (factors.seniorityBalance < 40) {
      reasoning.push('Seniority levels may be imbalanced');
    }
    
    if (factors.functionalInterdependence > 70) {
      reasoning.push('Strong functional interdependence');
    } else if (factors.functionalInterdependence < 40) {
      reasoning.push('Limited functional interdependence');
    }
    
    return reasoning.join('; ') || 'Standard buyer group composition';
  }

  /**
   * Generate recommendations for improving cohesion
   * @param {object} factors - Individual factor scores
   * @param {number} score - Overall score
   * @returns {Array} Recommendations
   */
  generateRecommendations(factors, score) {
    const recommendations = [];
    
    if (factors.reportingProximity < 50) {
      recommendations.push('Consider adding members who report to same executives');
    }
    
    if (factors.departmentClustering < 50) {
      recommendations.push('Consider adding members from adjacent departments');
    }
    
    if (factors.seniorityBalance < 50) {
      recommendations.push('Consider balancing seniority levels across the group');
    }
    
    if (factors.functionalInterdependence < 50) {
      recommendations.push('Consider adding members from interdependent functions');
    }
    
    if (score < 60) {
      recommendations.push('Overall cohesion could be improved with better stakeholder selection');
    }
    
    return recommendations;
  }

  // Helper methods for seniority analysis
  isCLevel(title) {
    const cLevelTitles = ['chief', 'president', 'ceo', 'cto', 'cfo', 'coo'];
    return cLevelTitles.some(t => title?.toLowerCase().includes(t));
  }

  isVPLevel(title) {
    const vpTitles = ['vp', 'vice president', 'svp', 'senior vice president'];
    return vpTitles.some(t => title?.toLowerCase().includes(t));
  }

  isDirectorLevel(title) {
    const directorTitles = ['director', 'senior director'];
    return directorTitles.some(t => title?.toLowerCase().includes(t));
  }

  isManagerLevel(title) {
    const managerTitles = ['manager', 'senior manager', 'sr manager', 'lead'];
    return managerTitles.some(t => title?.toLowerCase().includes(t));
  }

  isIndividualContributor(title) {
    const icTitles = ['analyst', 'specialist', 'coordinator', 'associate'];
    return icTitles.some(t => title?.toLowerCase().includes(t));
  }

  // Helper methods for department analysis
  getDepartmentGroups() {
    return {
      sales: ['sales', 'revenue', 'business development'],
      marketing: ['marketing', 'demand generation', 'growth'],
      product: ['product', 'product management'],
      engineering: ['engineering', 'development', 'software'],
      operations: ['operations', 'business operations'],
      finance: ['finance', 'accounting', 'fp&a'],
      hr: ['hr', 'human resources', 'people'],
      legal: ['legal', 'compliance', 'risk'],
      security: ['security', 'information security', 'cybersecurity'],
      it: ['it', 'information technology', 'technology']
    };
  }

  areDepartmentsAdjacent(dept1, dept2, departmentGroups) {
    // Check if departments are in the same group
    for (const [groupName, departments] of Object.entries(departmentGroups)) {
      if (departments.some(d => dept1.includes(d)) && 
          departments.some(d => dept2.includes(d))) {
        return true;
      }
    }
    
    // Check for known adjacent relationships
    const adjacentRelationships = [
      ['sales', 'marketing'],
      ['sales', 'operations'],
      ['product', 'engineering'],
      ['finance', 'operations'],
      ['hr', 'operations'],
      ['legal', 'compliance'],
      ['security', 'it']
    ];
    
    return adjacentRelationships.some(([adj1, adj2]) => 
      (dept1.includes(adj1) && dept2.includes(adj2)) ||
      (dept1.includes(adj2) && dept2.includes(adj1))
    );
  }
}

module.exports = { CohesionValidator };
