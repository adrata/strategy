/**
 * Smart Buyer Group Sizing System
 * 
 * Determines accurate buyer group size based on:
 * - Company size and tier
 * - Available employee data quality
 * - Deal size and complexity
 * - Data availability in Coresignal
 * 
 * Accepts 1-person buyer groups when appropriate (solopreneurs, very small companies, limited data)
 */

const { determineCompanySizeTier, getBuyerGroupSizeForTier } = require('./company-size-config');

class BuyerGroupSizing {
  constructor(dealSize, companyIntelligence, availableEmployees = []) {
    this.dealSize = dealSize;
    this.intelligence = companyIntelligence;
    this.availableEmployees = availableEmployees;
    this.companyTier = determineCompanySizeTier(
      companyIntelligence.revenue || 0,
      companyIntelligence.employeeCount || 0
    );
  }

  /**
   * Determine optimal buyer group size based on multiple factors
   * @returns {object} Size constraints with reasoning
   */
  determineOptimalSize() {
    const actualCompanySize = this.intelligence.employeeCount || 0;
    const availableCount = this.availableEmployees.length;
    const tierBasedSize = getBuyerGroupSizeForTier(this.companyTier, actualCompanySize);

    // Factor 1: Very small companies (1-5 employees) - can legitimately be 1 person
    if (actualCompanySize <= 1) {
      return {
        min: 1,
        max: 1,
        ideal: 1,
        reasoning: 'Solopreneur/1-person company - single decision maker appropriate',
        acceptSinglePerson: true
      };
    }

    if (actualCompanySize <= 3) {
      return {
        min: 1,
        max: Math.min(3, availableCount),
        ideal: Math.min(2, availableCount),
        reasoning: 'Very small company (2-3 employees) - minimal buyer group appropriate',
        acceptSinglePerson: true
      };
    }

    if (actualCompanySize <= 5) {
      return {
        min: 1,
        max: Math.min(4, availableCount),
        ideal: Math.min(3, availableCount),
        reasoning: 'Small company (4-5 employees) - small buyer group appropriate',
        acceptSinglePerson: true
      };
    }

    // Factor 2: Data availability - if we found very few employees, adjust expectations
    const dataAvailabilityRatio = availableCount / Math.max(actualCompanySize, 1);
    
    if (dataAvailabilityRatio < 0.1 && availableCount <= 3) {
      // Less than 10% of company found, and only 1-3 people available
      return {
        min: 1,
        max: availableCount,
        ideal: Math.min(availableCount, 2),
        reasoning: `Limited employee data available (${availableCount} found) - using available candidates`,
        acceptSinglePerson: true,
        dataLimited: true
      };
    }

    if (dataAvailabilityRatio < 0.2 && availableCount <= 5) {
      // Less than 20% of company found, limited candidates
      return {
        min: 1,
        max: Math.min(availableCount, tierBasedSize.max),
        ideal: Math.min(availableCount, Math.floor(tierBasedSize.ideal * 0.7)),
        reasoning: `Limited employee data (${availableCount} found, ${Math.round(dataAvailabilityRatio * 100)}% of company) - adjusted size`,
        acceptSinglePerson: true,
        dataLimited: true
      };
    }

    // Factor 3: Deal size complexity
    // Small deals (<$50K) can have smaller buyer groups
    if (this.dealSize < 50000) {
      return {
        min: 1,
        max: Math.min(tierBasedSize.max, availableCount),
        ideal: Math.min(Math.max(1, Math.floor(tierBasedSize.ideal * 0.6)), availableCount),
        reasoning: `Small deal size ($${this.dealSize.toLocaleString()}) - smaller buyer group appropriate`,
        acceptSinglePerson: true
      };
    }

    // Factor 4: Quality of available candidates
    const highQualityCount = this.availableEmployees.filter(emp => 
      (emp.overallScore || 0) > 60 && (emp.relevance || 0) > 0.4
    ).length;

    if (highQualityCount === 0 && availableCount > 0) {
      // No high-quality candidates, but we have some data
      return {
        min: 1,
        max: Math.min(3, availableCount),
        ideal: Math.min(2, availableCount),
        reasoning: 'Limited high-quality candidates - using best available',
        acceptSinglePerson: true,
        qualityLimited: true
      };
    }

    if (highQualityCount === 1 && availableCount <= 3) {
      // Only 1 high-quality candidate
      return {
        min: 1,
        max: Math.min(3, availableCount),
        ideal: 1,
        reasoning: 'Single high-quality candidate found - 1-person buyer group appropriate',
        acceptSinglePerson: true,
        qualityLimited: true
      };
    }

    // Factor 5: Standard tier-based sizing (when we have good data)
    // But still allow flexibility based on available data
    return {
      min: Math.max(1, Math.floor(tierBasedSize.min * 0.7)), // Allow 30% below minimum
      max: Math.min(tierBasedSize.max, availableCount),
      ideal: Math.min(tierBasedSize.ideal, Math.max(1, Math.floor(availableCount * 0.8))),
      reasoning: `Tier-based sizing (${this.companyTier}) with data availability adjustment`,
      acceptSinglePerson: tierBasedSize.min <= 2, // Accept single person if tier allows it
      dataLimited: dataAvailabilityRatio < 0.5
    };
  }

  /**
   * Validate if a buyer group size is acceptable
   * @param {number} actualSize - Actual buyer group size
   * @param {object} sizeConstraints - Size constraints from determineOptimalSize
   * @returns {object} Validation result
   */
  validateSize(actualSize, sizeConstraints) {
    const { min, max, ideal, acceptSinglePerson } = sizeConstraints;
    
    // Always accept if within min-max range
    if (actualSize >= min && actualSize <= max) {
      return {
        valid: true,
        score: actualSize === ideal ? 100 : Math.max(60, 100 - Math.abs(actualSize - ideal) * 5),
        reasoning: `Size ${actualSize} is within acceptable range (${min}-${max})`
      };
    }

    // Accept single person if explicitly allowed
    if (actualSize === 1 && acceptSinglePerson) {
      return {
        valid: true,
        score: 80,
        reasoning: 'Single person buyer group is acceptable for this company size/data availability'
      };
    }

    // Below minimum
    if (actualSize < min) {
      // Still accept if it's 1 person and company is very small
      if (actualSize === 1 && this.intelligence.employeeCount <= 5) {
        return {
          valid: true,
          score: 70,
          reasoning: 'Single person acceptable for very small company despite being below ideal minimum'
        };
      }
      return {
        valid: false,
        score: Math.max(0, 100 - (min - actualSize) * 20),
        reasoning: `Size ${actualSize} is below minimum ${min}`
      };
    }

    // Above maximum
    return {
      valid: false,
      score: Math.max(0, 100 - (actualSize - max) * 10),
      reasoning: `Size ${actualSize} exceeds maximum ${max}`
    };
  }

  /**
   * Get recommended action if buyer group size is suboptimal
   * @param {number} actualSize - Actual buyer group size
   * @param {object} sizeConstraints - Size constraints
   * @returns {object} Recommendation
   */
  getRecommendation(actualSize, sizeConstraints) {
    const validation = this.validateSize(actualSize, sizeConstraints);
    
    if (validation.valid && validation.score >= 80) {
      return {
        action: 'accept',
        message: 'Buyer group size is appropriate',
        priority: 'low'
      };
    }

    if (actualSize === 1 && sizeConstraints.acceptSinglePerson) {
      return {
        action: 'accept',
        message: 'Single person buyer group is acceptable for this scenario',
        priority: 'low'
      };
    }

    if (actualSize < sizeConstraints.min) {
      if (sizeConstraints.dataLimited) {
        return {
          action: 'accept_with_note',
          message: `Buyer group is small (${actualSize}) due to limited employee data. Consider expanding search if more coverage needed.`,
          priority: 'medium'
        };
      }
      return {
        action: 'warn',
        message: `Buyer group size (${actualSize}) is below ideal minimum (${sizeConstraints.min}). May need additional stakeholders.`,
        priority: 'high'
      };
    }

    if (actualSize > sizeConstraints.max) {
      return {
        action: 'warn',
        message: `Buyer group size (${actualSize}) exceeds maximum (${sizeConstraints.max}). Consider refining selection.`,
        priority: 'medium'
      };
    }

    return {
      action: 'accept',
      message: 'Buyer group size is acceptable',
      priority: 'low'
    };
  }
}

module.exports = { BuyerGroupSizing };

