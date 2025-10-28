/**
 * Cross-Functional Coverage Module
 * 
 * Ensures stakeholder completeness across all relevant functions
 * Prevents tunnel vision by including IT, Security, Legal, Procurement
 */

class CrossFunctionalCoverage {
  constructor(dealSize) {
    this.dealSize = dealSize;
  }

  /**
   * Validate and enhance buyer group for cross-functional coverage
   * @param {Array} buyerGroup - Current buyer group
   * @param {Array} allEmployees - All available employees
   * @returns {object} Enhanced buyer group and coverage analysis
   */
  validate(buyerGroup, allEmployees) {
    console.log(`🔍 Validating cross-functional coverage for $${this.dealSize.toLocaleString()} deal...`);
    
    const requiredFunctions = this.getRequiredFunctions();
    const coverage = this.analyzeCoverage(buyerGroup, requiredFunctions);
    
    console.log('📊 Current coverage:', coverage);
    
    // Add missing critical stakeholders
    let enhanced = [...buyerGroup];
    
    // Add technical stakeholders for deals >$50K
    if (!coverage.technical && this.dealSize > 50000) {
      const itStakeholder = this.findBestMatch(allEmployees, requiredFunctions.technical);
      if (itStakeholder) {
        enhanced.push({
          ...itStakeholder,
          buyerGroupRole: 'stakeholder',
          roleConfidence: 75,
          roleReasoning: 'Added for technical coverage',
          addedForCoverage: true
        });
        console.log('✅ Added IT stakeholder:', itStakeholder.name);
      }
    }
    
    // Add risk stakeholders for deals >$150K
    if (!coverage.risk && this.dealSize > 150000) {
      const riskStakeholder = this.findBestMatch(allEmployees, requiredFunctions.risk);
      if (riskStakeholder) {
        enhanced.push({
          ...riskStakeholder,
          buyerGroupRole: 'stakeholder',
          roleConfidence: 80,
          roleReasoning: 'Added for risk management coverage',
          addedForCoverage: true
        });
        console.log('✅ Added risk stakeholder:', riskStakeholder.name);
      }
    }
    
    // Add financial stakeholders for deals >$100K
    if (!coverage.financial && this.dealSize > 100000) {
      const financeStakeholder = this.findBestMatch(allEmployees, requiredFunctions.financial);
      if (financeStakeholder) {
        enhanced.push({
          ...financeStakeholder,
          buyerGroupRole: 'stakeholder',
          roleConfidence: 70,
          roleReasoning: 'Added for financial coverage',
          addedForCoverage: true
        });
        console.log('✅ Added finance stakeholder:', financeStakeholder.name);
      }
    }
    
    const finalCoverage = this.analyzeCoverage(enhanced, requiredFunctions);
    
    console.log('📈 Final coverage:', finalCoverage);
    
    return { 
      enhanced, 
      coverage: finalCoverage,
      addedCount: enhanced.length - buyerGroup.length
    };
  }

  /**
   * Get required functions based on deal size
   * @returns {object} Required functions by category
   */
  getRequiredFunctions() {
    return {
      primary: ['Sales', 'Operations', 'Revenue'], // Always required
      technical: ['IT', 'Technology', 'Engineering'], // For deals >$50K
      risk: ['Security', 'Legal', 'Compliance'], // For deals >$150K
      financial: ['Finance', 'Procurement', 'FP&A'] // For deals >$100K
    };
  }

  /**
   * Analyze current coverage across functions
   * @param {Array} buyerGroup - Current buyer group
   * @param {object} requiredFunctions - Required functions
   * @returns {object} Coverage analysis
   */
  analyzeCoverage(buyerGroup, requiredFunctions) {
    const coverage = {
      primary: false,
      technical: false,
      risk: false,
      financial: false,
      details: {}
    };
    
    // Check primary functions (always required)
    coverage.primary = this.hasFunctionCoverage(buyerGroup, requiredFunctions.primary);
    coverage.details.primary = this.getFunctionDetails(buyerGroup, requiredFunctions.primary);
    
    // Check technical functions (deals >$50K)
    if (this.dealSize > 50000) {
      coverage.technical = this.hasFunctionCoverage(buyerGroup, requiredFunctions.technical);
      coverage.details.technical = this.getFunctionDetails(buyerGroup, requiredFunctions.technical);
    }
    
    // Check risk functions (deals >$150K)
    if (this.dealSize > 150000) {
      coverage.risk = this.hasFunctionCoverage(buyerGroup, requiredFunctions.risk);
      coverage.details.risk = this.getFunctionDetails(buyerGroup, requiredFunctions.risk);
    }
    
    // Check financial functions (deals >$100K)
    if (this.dealSize > 100000) {
      coverage.financial = this.hasFunctionCoverage(buyerGroup, requiredFunctions.financial);
      coverage.details.financial = this.getFunctionDetails(buyerGroup, requiredFunctions.financial);
    }
    
    return coverage;
  }

  /**
   * Check if buyer group has coverage for specific functions
   * @param {Array} buyerGroup - Current buyer group
   * @param {Array} functions - Functions to check
   * @returns {boolean} True if covered
   */
  hasFunctionCoverage(buyerGroup, functions) {
    return buyerGroup.some(member => {
      const dept = member.department?.toLowerCase() || '';
      return functions.some(func => dept.includes(func.toLowerCase()));
    });
  }

  /**
   * Get detailed function coverage information
   * @param {Array} buyerGroup - Current buyer group
   * @param {Array} functions - Functions to analyze
   * @returns {object} Detailed coverage info
   */
  getFunctionDetails(buyerGroup, functions) {
    const details = {
      covered: [],
      missing: [],
      representatives: []
    };
    
    functions.forEach(func => {
      const representative = buyerGroup.find(member => {
        const dept = member.department?.toLowerCase() || '';
        return dept.includes(func.toLowerCase());
      });
      
      if (representative) {
        details.covered.push(func);
        details.representatives.push({
          function: func,
          name: representative.name,
          title: representative.title,
          department: representative.department
        });
      } else {
        details.missing.push(func);
      }
    });
    
    return details;
  }

  /**
   * Find best match for specific functions
   * @param {Array} allEmployees - All available employees
   * @param {Array} functions - Functions to match
   * @returns {object|null} Best matching employee
   */
  findBestMatch(allEmployees, functions) {
    // Filter employees who match any of the required functions
    const candidates = allEmployees.filter(emp => {
      const dept = emp.department?.toLowerCase() || '';
      return functions.some(func => dept.includes(func.toLowerCase()));
    });
    
    if (candidates.length === 0) return null;
    
    // Sort by overall score descending
    candidates.sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));
    
    return candidates[0];
  }

  /**
   * Identify missing stakeholders by function
   * @param {Array} buyerGroup - Current buyer group
   * @param {Array} allEmployees - All available employees
   * @returns {Array} Missing stakeholder recommendations
   */
  identifyMissingStakeholders(buyerGroup, allEmployees) {
    const requiredFunctions = this.getRequiredFunctions();
    const missing = [];
    
    // Check each function category
    Object.entries(requiredFunctions).forEach(([category, functions]) => {
      const hasCoverage = this.hasFunctionCoverage(buyerGroup, functions);
      
      if (!hasCoverage) {
        const bestMatch = this.findBestMatch(allEmployees, functions);
        if (bestMatch) {
          missing.push({
            category,
            functions,
            recommended: bestMatch,
            reason: this.getMissingReason(category)
          });
        }
      }
    });
    
    return missing;
  }

  /**
   * Get reason for missing function coverage
   * @param {string} category - Function category
   * @returns {string} Reason for inclusion
   */
  getMissingReason(category) {
    const reasons = {
      primary: 'Core business functions always required',
      technical: 'Technical stakeholders needed for implementation',
      risk: 'Risk management critical for large deals',
      financial: 'Financial approval required for significant investments'
    };
    
    return reasons[category] || 'Important for comprehensive coverage';
  }

  /**
   * Generate cross-functional coverage report
   * @param {Array} buyerGroup - Final buyer group
   * @param {object} coverage - Coverage analysis
   * @returns {object} Coverage report
   */
  generateCoverageReport(buyerGroup, coverage) {
    const report = {
      summary: {
        totalMembers: buyerGroup.length,
        functionsCovered: Object.values(coverage.details).filter(d => d.covered.length > 0).length,
        coverageScore: this.calculateCoverageScore(coverage)
      },
      byFunction: {},
      recommendations: []
    };
    
    // Generate report for each function category
    Object.entries(coverage.details).forEach(([category, details]) => {
      report.byFunction[category] = {
        status: details.covered.length > 0 ? 'covered' : 'missing',
        covered: details.covered,
        missing: details.missing,
        representatives: details.representatives
      };
    });
    
    // Generate recommendations
    if (coverage.technical === false && this.dealSize > 50000) {
      report.recommendations.push('Consider adding IT stakeholder for technical implementation');
    }
    
    if (coverage.risk === false && this.dealSize > 150000) {
      report.recommendations.push('Consider adding Security/Legal stakeholder for risk management');
    }
    
    if (coverage.financial === false && this.dealSize > 100000) {
      report.recommendations.push('Consider adding Finance stakeholder for budget approval');
    }
    
    return report;
  }

  /**
   * Calculate overall coverage score
   * @param {object} coverage - Coverage analysis
   * @returns {number} Coverage score (0-100)
   */
  calculateCoverageScore(coverage) {
    const categories = ['primary', 'technical', 'risk', 'financial'];
    const weights = {
      primary: 0.4,    // Always required
      technical: 0.2,  // Important for implementation
      risk: 0.2,       // Critical for large deals
      financial: 0.2   // Important for approval
    };
    
    let score = 0;
    let totalWeight = 0;
    
    categories.forEach(category => {
      if (coverage[category] !== undefined) {
        score += (coverage[category] ? 100 : 0) * weights[category];
        totalWeight += weights[category];
      }
    });
    
    return totalWeight > 0 ? Math.round(score / totalWeight) : 0;
  }

  /**
   * Validate buyer group size after enhancements
   * @param {Array} enhanced - Enhanced buyer group
   * @param {object} buyerGroupSize - Size constraints
   * @returns {object} Size validation results
   */
  validateSize(enhanced, buyerGroupSize) {
    const { min, max, ideal } = buyerGroupSize;
    const currentSize = enhanced.length;
    
    return {
      currentSize,
      withinLimits: currentSize >= min && currentSize <= max,
      ideal: currentSize === ideal,
      recommendation: currentSize > max ? 
        'Consider removing lower-priority members' : 
        currentSize < min ? 
        'Consider adding more stakeholders' : 
        'Size is appropriate'
    };
  }
}

module.exports = { CrossFunctionalCoverage };
