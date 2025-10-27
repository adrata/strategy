/**
 * Company Size-Based Role Distribution Configuration
 * 
 * Optimized buyer group composition based on company revenue/employee tiers
 * Following enterprise sales research and industry best practices
 */

// Company Size Tiers based on Revenue/Employees
const COMPANY_SIZE_TIERS = {
  // Small (S1-S7): $0 - $10M
  S1: { revenue: [0, 100000], employees: [1, 5], name: 'Micro/Solopreneur' },
  S2: { revenue: [100000, 250000], employees: [5, 10], name: 'Very Small Business' },
  S3: { revenue: [250000, 500000], employees: [10, 25], name: 'Small Business' },
  S4: { revenue: [500000, 1000000], employees: [25, 50], name: 'Growing Small' },
  S5: { revenue: [1000000, 2500000], employees: [50, 100], name: 'Established Small' },
  S6: { revenue: [2500000, 5000000], employees: [100, 200], name: 'Large Small' },
  S7: { revenue: [5000000, 10000000], employees: [200, 500], name: 'Upper Small' },
  
  // Medium (M1-M7): $10M - $100M
  M1: { revenue: [10000000, 15000000], employees: [500, 750], name: 'Lower Mid-Market' },
  M2: { revenue: [15000000, 25000000], employees: [750, 1000], name: 'Mid-Market Entry' },
  M3: { revenue: [25000000, 40000000], employees: [1000, 1500], name: 'Core Mid-Market' },
  M4: { revenue: [40000000, 60000000], employees: [1500, 2500], name: 'Upper Mid-Market' },
  M5: { revenue: [60000000, 75000000], employees: [2500, 3500], name: 'Advanced Mid-Market' },
  M6: { revenue: [75000000, 85000000], employees: [3500, 5000], name: 'Large Mid-Market' },
  M7: { revenue: [85000000, 100000000], employees: [5000, 7500], name: 'Pre-Enterprise' },
  
  // Large (L1-L7): $100M+
  L1: { revenue: [100000000, 250000000], employees: [7500, 10000], name: 'Lower Enterprise' },
  L2: { revenue: [250000000, 500000000], employees: [10000, 15000], name: 'Enterprise' },
  L3: { revenue: [500000000, 1000000000], employees: [15000, 25000], name: 'Large Enterprise' },
  L4: { revenue: [1000000000, 5000000000], employees: [25000, 50000], name: 'Major Enterprise' },
  L5: { revenue: [5000000000, 10000000000], employees: [50000, 100000], name: 'Fortune 1000' },
  L6: { revenue: [10000000000, 50000000000], employees: [100000, 250000], name: 'Fortune 500' },
  L7: { revenue: [50000000000, Infinity], employees: [250000, Infinity], name: 'Fortune 100+' }
};

// Role Distribution Targets by Company Size Tier
const ROLE_DISTRIBUTION_BY_TIER = {
  // Small Companies (S1-S7): Lean, focused buyer groups
  S1: { decision: { min: 1, max: 1, ideal: 1 }, champion: { min: 1, max: 2, ideal: 1 }, stakeholder: { min: 0, max: 2, ideal: 1 }, blocker: { min: 0, max: 1, ideal: 0 }, introducer: { min: 0, max: 1, ideal: 0 } },
  S2: { decision: { min: 1, max: 1, ideal: 1 }, champion: { min: 1, max: 2, ideal: 1 }, stakeholder: { min: 0, max: 2, ideal: 1 }, blocker: { min: 0, max: 1, ideal: 0 }, introducer: { min: 0, max: 1, ideal: 0 } },
  S3: { decision: { min: 1, max: 2, ideal: 1 }, champion: { min: 1, max: 2, ideal: 2 }, stakeholder: { min: 1, max: 3, ideal: 2 }, blocker: { min: 0, max: 1, ideal: 0 }, introducer: { min: 0, max: 1, ideal: 1 } },
  S4: { decision: { min: 1, max: 2, ideal: 1 }, champion: { min: 1, max: 3, ideal: 2 }, stakeholder: { min: 1, max: 3, ideal: 2 }, blocker: { min: 0, max: 1, ideal: 0 }, introducer: { min: 0, max: 1, ideal: 1 } },
  S5: { decision: { min: 1, max: 2, ideal: 2 }, champion: { min: 2, max: 3, ideal: 2 }, stakeholder: { min: 1, max: 4, ideal: 3 }, blocker: { min: 0, max: 1, ideal: 0 }, introducer: { min: 0, max: 2, ideal: 1 } },
  S6: { decision: { min: 1, max: 2, ideal: 2 }, champion: { min: 2, max: 4, ideal: 3 }, stakeholder: { min: 2, max: 4, ideal: 3 }, blocker: { min: 0, max: 1, ideal: 0 }, introducer: { min: 0, max: 2, ideal: 1 } },
  S7: { decision: { min: 1, max: 3, ideal: 2 }, champion: { min: 2, max: 4, ideal: 3 }, stakeholder: { min: 2, max: 5, ideal: 3 }, blocker: { min: 0, max: 1, ideal: 0 }, introducer: { min: 0, max: 2, ideal: 1 } },
  
  // Medium Companies (M1-M7): Balanced buyer groups
  M1: { decision: { min: 1, max: 3, ideal: 2 }, champion: { min: 2, max: 4, ideal: 3 }, stakeholder: { min: 2, max: 5, ideal: 3 }, blocker: { min: 0, max: 1, ideal: 0 }, introducer: { min: 0, max: 2, ideal: 1 } },
  M2: { decision: { min: 1, max: 3, ideal: 2 }, champion: { min: 2, max: 4, ideal: 3 }, stakeholder: { min: 2, max: 5, ideal: 4 }, blocker: { min: 0, max: 1, ideal: 0 }, introducer: { min: 0, max: 2, ideal: 1 } },
  M3: { decision: { min: 1, max: 3, ideal: 2 }, champion: { min: 2, max: 5, ideal: 3 }, stakeholder: { min: 2, max: 5, ideal: 4 }, blocker: { min: 0, max: 1, ideal: 0 }, introducer: { min: 0, max: 2, ideal: 1 } },
  M4: { decision: { min: 1, max: 3, ideal: 2 }, champion: { min: 2, max: 5, ideal: 3 }, stakeholder: { min: 3, max: 6, ideal: 4 }, blocker: { min: 0, max: 1, ideal: 0 }, introducer: { min: 0, max: 2, ideal: 1 } },
  M5: { decision: { min: 1, max: 3, ideal: 2 }, champion: { min: 2, max: 5, ideal: 3 }, stakeholder: { min: 3, max: 6, ideal: 4 }, blocker: { min: 0, max: 1, ideal: 0 }, introducer: { min: 0, max: 2, ideal: 1 } },
  M6: { decision: { min: 1, max: 3, ideal: 2 }, champion: { min: 2, max: 5, ideal: 3 }, stakeholder: { min: 3, max: 6, ideal: 4 }, blocker: { min: 0, max: 1, ideal: 0 }, introducer: { min: 0, max: 2, ideal: 1 } },
  M7: { decision: { min: 1, max: 3, ideal: 2 }, champion: { min: 2, max: 5, ideal: 3 }, stakeholder: { min: 3, max: 6, ideal: 4 }, blocker: { min: 0, max: 1, ideal: 0 }, introducer: { min: 0, max: 2, ideal: 1 } },
  
  // Large Companies (L1-L7): Complex buyer groups
  L1: { decision: { min: 1, max: 3, ideal: 2 }, champion: { min: 2, max: 5, ideal: 3 }, stakeholder: { min: 3, max: 6, ideal: 4 }, blocker: { min: 0, max: 1, ideal: 0 }, introducer: { min: 0, max: 2, ideal: 1 } },
  L2: { decision: { min: 1, max: 3, ideal: 2 }, champion: { min: 2, max: 5, ideal: 3 }, stakeholder: { min: 3, max: 6, ideal: 4 }, blocker: { min: 0, max: 1, ideal: 0 }, introducer: { min: 0, max: 2, ideal: 1 } },
  L3: { decision: { min: 1, max: 3, ideal: 2 }, champion: { min: 2, max: 5, ideal: 3 }, stakeholder: { min: 3, max: 6, ideal: 4 }, blocker: { min: 0, max: 1, ideal: 0 }, introducer: { min: 0, max: 2, ideal: 1 } },
  L4: { decision: { min: 1, max: 3, ideal: 2 }, champion: { min: 2, max: 5, ideal: 3 }, stakeholder: { min: 3, max: 6, ideal: 4 }, blocker: { min: 0, max: 1, ideal: 0 }, introducer: { min: 0, max: 2, ideal: 1 } },
  L5: { decision: { min: 1, max: 3, ideal: 2 }, champion: { min: 2, max: 5, ideal: 3 }, stakeholder: { min: 3, max: 6, ideal: 4 }, blocker: { min: 0, max: 1, ideal: 0 }, introducer: { min: 0, max: 2, ideal: 1 } },
  L6: { decision: { min: 1, max: 3, ideal: 2 }, champion: { min: 2, max: 5, ideal: 3 }, stakeholder: { min: 3, max: 6, ideal: 4 }, blocker: { min: 0, max: 1, ideal: 0 }, introducer: { min: 0, max: 2, ideal: 1 } },
  L7: { decision: { min: 1, max: 3, ideal: 2 }, champion: { min: 2, max: 5, ideal: 3 }, stakeholder: { min: 3, max: 6, ideal: 4 }, blocker: { min: 0, max: 1, ideal: 0 }, introducer: { min: 0, max: 2, ideal: 1 } }
};

/**
 * Determine company size tier based on revenue or employee count
 * @param {number} revenue - Company revenue in USD
 * @param {number} employees - Company employee count
 * @returns {string} Company size tier (S1-S7, M1-M7, L1-L7)
 */
function determineCompanySizeTier(revenue = 0, employees = 0) {
  // Use revenue as primary indicator, fallback to employees
  const primaryMetric = revenue > 0 ? revenue : employees;
  const metricType = revenue > 0 ? 'revenue' : 'employees';
  
  for (const [tier, config] of Object.entries(COMPANY_SIZE_TIERS)) {
    const [min, max] = config[metricType];
    if (primaryMetric >= min && primaryMetric < max) {
      return tier;
    }
  }
  
  // Default to S3 if we can't determine
  return 'S3';
}

/**
 * Get role distribution targets for a specific company size tier
 * @param {string} tier - Company size tier
 * @param {number} totalEmployees - Total employees found
 * @returns {object} Role distribution targets
 */
function getRoleDistributionTargets(tier, totalEmployees = 0) {
  const baseTargets = ROLE_DISTRIBUTION_BY_TIER[tier] || ROLE_DISTRIBUTION_BY_TIER['S3'];
  
  // Calculate percentage-based targets that scale with employee count
  const targets = {
    decision: Math.min(baseTargets.decision.max, 
                      Math.max(baseTargets.decision.min, 
                      Math.floor(totalEmployees * 0.15))), // 15%
    champion: Math.min(baseTargets.champion.max, 
                      Math.max(baseTargets.champion.min, 
                      Math.floor(totalEmployees * 0.25))), // 25%
    stakeholder: Math.min(baseTargets.stakeholder.max, 
                         Math.max(baseTargets.stakeholder.min, 
                         Math.floor(totalEmployees * 0.30))), // 30%
    blocker: Math.min(baseTargets.blocker.max, 
                     Math.max(baseTargets.blocker.min, 
                     Math.floor(totalEmployees * 0.10))), // 10%
    introducer: Math.min(baseTargets.introducer.max, 
                        Math.max(baseTargets.introducer.min, 
                        Math.floor(totalEmployees * 0.20))) // 20%
  };
  
  return targets;
}

/**
 * Get deal size thresholds for decision maker seniority
 * @param {string} tier - Company size tier
 * @returns {object} Deal size thresholds
 */
function getDealSizeThresholds(tier) {
  const thresholds = {
    // Small companies: Lower thresholds
    S1: { vp: 10000, director: 5000, manager: 1000 },
    S2: { vp: 25000, director: 10000, manager: 2500 },
    S3: { vp: 50000, director: 25000, manager: 5000 },
    S4: { vp: 75000, director: 50000, manager: 10000 },
    S5: { vp: 100000, director: 75000, manager: 15000 },
    S6: { vp: 150000, director: 100000, manager: 25000 },
    S7: { vp: 200000, director: 150000, manager: 50000 },
    
    // Medium companies: Higher thresholds
    M1: { vp: 250000, director: 200000, manager: 75000 },
    M2: { vp: 300000, director: 250000, manager: 100000 },
    M3: { vp: 400000, director: 300000, manager: 150000 },
    M4: { vp: 500000, director: 400000, manager: 200000 },
    M5: { vp: 600000, director: 500000, manager: 250000 },
    M6: { vp: 750000, director: 600000, manager: 300000 },
    M7: { vp: 1000000, director: 750000, manager: 400000 },
    
    // Large companies: Enterprise thresholds
    L1: { vp: 1000000, director: 750000, manager: 500000 },
    L2: { vp: 1500000, director: 1000000, manager: 750000 },
    L3: { vp: 2000000, director: 1500000, manager: 1000000 },
    L4: { vp: 3000000, director: 2000000, manager: 1500000 },
    L5: { vp: 5000000, director: 3000000, manager: 2000000 },
    L6: { vp: 7500000, director: 5000000, manager: 3000000 },
    L7: { vp: 10000000, director: 7500000, manager: 5000000 }
  };
  
  return thresholds[tier] || thresholds['S3'];
}

/**
 * Get optimal buyer group size for company tier
 * @param {string} tier - Company size tier
 * @returns {object} Buyer group size constraints
 */
function getBuyerGroupSizeForTier(tier) {
  const sizes = {
    // Small companies: Lean decision-making
    S1: { min: 3, max: 5, ideal: 4 },
    S2: { min: 3, max: 5, ideal: 4 },
    S3: { min: 4, max: 6, ideal: 5 },
    
    // Growing small companies: Emerging hierarchy
    S4: { min: 5, max: 7, ideal: 6 },
    S5: { min: 5, max: 8, ideal: 6 },
    S6: { min: 6, max: 8, ideal: 7 },
    S7: { min: 6, max: 9, ideal: 8 },
    
    // Mid-market: Departmental stakeholders
    M1: { min: 7, max: 10, ideal: 8 },
    M2: { min: 7, max: 10, ideal: 8 },
    M3: { min: 8, max: 11, ideal: 9 },
    M4: { min: 8, max: 12, ideal: 10 },
    
    // Upper mid-market: Cross-functional
    M5: { min: 9, max: 12, ideal: 10 },
    M6: { min: 9, max: 13, ideal: 11 },
    M7: { min: 10, max: 13, ideal: 11 },
    
    // Enterprise: Complex approval chains
    L1: { min: 10, max: 14, ideal: 12 },
    L2: { min: 11, max: 15, ideal: 13 },
    L3: { min: 12, max: 16, ideal: 14 },
    L4: { min: 13, max: 17, ideal: 15 },
    
    // Fortune 500+: Extensive stakeholder matrix
    L5: { min: 14, max: 18, ideal: 16 },
    L6: { min: 15, max: 19, ideal: 17 },
    L7: { min: 16, max: 20, ideal: 18 }
  };
  
  return sizes[tier] || sizes['S3'];
}

module.exports = {
  COMPANY_SIZE_TIERS,
  ROLE_DISTRIBUTION_BY_TIER,
  determineCompanySizeTier,
  getRoleDistributionTargets,
  getDealSizeThresholds,
  getBuyerGroupSizeForTier
};
