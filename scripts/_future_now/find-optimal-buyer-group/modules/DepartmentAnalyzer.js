/**
 * Department Analyzer Module
 * 
 * Analyzes employee department and management level distributions
 * Provides breakdowns for buyer group quality assessment
 */

class DepartmentAnalyzer {
  /**
   * Calculate department counts from employee data
   * @param {Array} employees - Array of employees
   * @returns {object} Department count breakdown
   */
  calculateDepartmentCounts(employees) {
    return employees.reduce((counts, employee) => {
      const dept = employee.active_experience_department || 'Unknown';
      counts[dept] = (counts[dept] || 0) + 1;
      return counts;
    }, {});
  }

  /**
   * Calculate management level counts from employee data
   * @param {Array} employees - Array of employees
   * @returns {object} Management level count breakdown
   */
  calculateManagementLevelCounts(employees) {
    return employees.reduce((counts, employee) => {
      const level = employee.active_experience_management_level || 'Unknown';
      counts[level] = (counts[level] || 0) + 1;
      return counts;
    }, {});
  }

  /**
   * Calculate final score with buyer group quality
   * @param {object} company - Company with traditional scores
   * @param {object} buyerGroupQuality - Buyer group quality data
   * @param {object} scoringWeights - Scoring weights
   * @returns {number} Final buyer readiness score
   */
  calculateFinalScore(company, buyerGroupQuality, scoringWeights) {
    const traditionalScore = 
      (company.firmographicFitScore || 50) * scoringWeights.firmographicFit +
      (company.growthSignalsScore || 50) * scoringWeights.growthSignals +
      (company.technologyAdoptionScore || 50) * scoringWeights.technologyAdoption +
      (company.adoptionMaturityScore || 50) * scoringWeights.adoptionMaturity;
    
    const buyerGroupScore = buyerGroupQuality.overall_buyer_group_quality * scoringWeights.buyerGroupQuality;
    
    return Math.round(traditionalScore + buyerGroupScore);
  }
}

module.exports = { DepartmentAnalyzer };

