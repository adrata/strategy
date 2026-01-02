/**
 * Homeowner Scorer Module - "Thirsty Buyer" Algorithm
 * 
 * Scores homeowners 0-100 based on likelihood to buy premium gates
 * Higher scores = more likely to purchase
 * 
 * Scoring Factors:
 * - Lot Size (25 pts): Larger lots need gates for privacy/security
 * - Home Value (25 pts): Higher value = can afford premium gates
 * - Home Age (20 pts): Older homes less likely to have builder gates
 * - Recent Purchase (15 pts): New owners often upgrade
 * - Location Factors (10 pts): Corner lots, main roads = security need
 * - Phone Quality (5 pts): Verified mobile = easier to reach
 */

class HomeownerScorer {
  constructor(options = {}) {
    // Scoring weights (total = 100)
    this.weights = {
      lotSize: options.lotSizeWeight || 25,
      homeValue: options.homeValueWeight || 25,
      homeAge: options.homeAgeWeight || 20,
      recentPurchase: options.recentPurchaseWeight || 15,
      locationFactors: options.locationWeight || 10,
      phoneQuality: options.phoneWeight || 5
    };

    // Thresholds for Paradise Valley market
    this.thresholds = {
      // Lot size thresholds (sqft)
      lotSize: {
        excellent: 43560,  // 1+ acre
        good: 20000,       // ~0.5 acre
        fair: 10000        // ~0.25 acre
      },
      // Home value thresholds ($)
      homeValue: {
        excellent: 3000000,  // $3M+
        good: 1500000,       // $1.5M+
        fair: 750000         // $750K+
      },
      // Home age thresholds (years)
      homeAge: {
        excellent: 20,  // 20+ years old
        good: 10,       // 10-20 years
        fair: 5         // 5-10 years
      },
      // Recent purchase threshold (years)
      recentPurchase: 2  // Purchased within 2 years
    };

    this.scoredCount = 0;
    this.scoreDistribution = {
      high: 0,    // 75-100
      medium: 0,  // 50-74
      low: 0      // 0-49
    };
  }

  /**
   * Score a single homeowner
   * @param {Object} homeowner - Homeowner data from BatchData
   * @returns {Object} - Scored homeowner with breakdown
   */
  scoreHomeowner(homeowner) {
    const breakdown = {
      lotSizeScore: this.scoreLotSize(homeowner.lotSizeSqFt),
      homeValueScore: this.scoreHomeValue(homeowner.homeValue),
      homeAgeScore: this.scoreHomeAge(homeowner.yearBuilt),
      recentPurchaseScore: this.scoreRecentPurchase(homeowner.lastSaleDate),
      locationScore: this.scoreLocation(homeowner),
      phoneScore: this.scorePhoneQuality(homeowner)
    };

    const totalScore = Object.values(breakdown).reduce((sum, score) => sum + score, 0);
    
    // Track distribution
    this.scoredCount++;
    if (totalScore >= 75) this.scoreDistribution.high++;
    else if (totalScore >= 50) this.scoreDistribution.medium++;
    else this.scoreDistribution.low++;

    // Determine priority based on score
    let priority = 'LOW';
    if (totalScore >= 75) priority = 'HIGH';
    else if (totalScore >= 60) priority = 'MEDIUM';

    return {
      ...homeowner,
      thirstyBuyerScore: Math.round(totalScore),
      scoreBreakdown: breakdown,
      priority,
      scoredAt: new Date().toISOString()
    };
  }

  /**
   * Score lot size (0-25 points)
   * Larger lots = more reason for gates (privacy, security, livestock, etc.)
   */
  scoreLotSize(lotSizeSqFt) {
    if (!lotSizeSqFt) return 0;
    
    const { excellent, good, fair } = this.thresholds.lotSize;
    const maxPoints = this.weights.lotSize;

    if (lotSizeSqFt >= excellent) return maxPoints;           // 1+ acre = full points
    if (lotSizeSqFt >= good) return maxPoints * 0.7;          // 0.5+ acre = 70%
    if (lotSizeSqFt >= fair) return maxPoints * 0.4;          // 0.25+ acre = 40%
    return maxPoints * 0.2;                                    // Smaller = 20%
  }

  /**
   * Score home value (0-25 points)
   * Higher value = can afford premium gates, status-conscious
   */
  scoreHomeValue(homeValue) {
    if (!homeValue) return 0;

    const { excellent, good, fair } = this.thresholds.homeValue;
    const maxPoints = this.weights.homeValue;

    if (homeValue >= excellent) return maxPoints;              // $3M+ = full points
    if (homeValue >= good) return maxPoints * 0.7;             // $1.5M+ = 70%
    if (homeValue >= fair) return maxPoints * 0.4;             // $750K+ = 40%
    return maxPoints * 0.2;                                     // Lower = 20%
  }

  /**
   * Score home age (0-20 points)
   * Older homes less likely to have builder-installed gates
   */
  scoreHomeAge(yearBuilt) {
    if (!yearBuilt) return this.weights.homeAge * 0.5; // Unknown = 50%

    const currentYear = new Date().getFullYear();
    const homeAge = currentYear - yearBuilt;
    const { excellent, good, fair } = this.thresholds.homeAge;
    const maxPoints = this.weights.homeAge;

    if (homeAge >= excellent) return maxPoints;                // 20+ years = full points
    if (homeAge >= good) return maxPoints * 0.6;               // 10-20 years = 60%
    if (homeAge >= fair) return maxPoints * 0.3;               // 5-10 years = 30%
    return 0;                                                   // New builds likely have gates
  }

  /**
   * Score recent purchase (0-15 points)
   * New homeowners often renovate and upgrade
   */
  scoreRecentPurchase(lastSaleDate) {
    if (!lastSaleDate) return 0;

    const saleDate = new Date(lastSaleDate);
    const now = new Date();
    const yearsAgo = (now - saleDate) / (1000 * 60 * 60 * 24 * 365);
    const maxPoints = this.weights.recentPurchase;

    if (yearsAgo <= 1) return maxPoints;                       // Within 1 year = full points
    if (yearsAgo <= 2) return maxPoints * 0.7;                 // 1-2 years = 70%
    if (yearsAgo <= 3) return maxPoints * 0.4;                 // 2-3 years = 40%
    return 0;                                                   // 3+ years = no bonus
  }

  /**
   * Score location factors (0-10 points)
   * Corner lots, main roads, etc. increase security need
   */
  scoreLocation(homeowner) {
    const maxPoints = this.weights.locationFactors;
    let score = 0;

    // Check for indicators in address/property data
    const address = (homeowner.address || '').toLowerCase();
    
    // Corner lot indicators
    if (address.includes('corner') || homeowner.isCornerLot) {
      score += maxPoints * 0.5;
    }

    // Main road indicators (roads, boulevards, drives tend to have more traffic)
    const mainRoadIndicators = ['boulevard', 'blvd', 'highway', 'hwy', 'road', 'rd', 'drive', 'dr'];
    if (mainRoadIndicators.some(ind => address.includes(ind))) {
      score += maxPoints * 0.3;
    }

    // Paradise Valley specific - certain areas are more desirable
    const premiumAreas = ['camelback', 'mummy mountain', 'lincoln', 'tatum'];
    if (premiumAreas.some(area => address.includes(area))) {
      score += maxPoints * 0.2;
    }

    return Math.min(score, maxPoints);
  }

  /**
   * Score phone quality (0-5 points)
   * Mobile phones = easier to reach
   */
  scorePhoneQuality(homeowner) {
    const maxPoints = this.weights.phoneQuality;

    if (!homeowner.phone && (!homeowner.phones || homeowner.phones.length === 0)) {
      return 0;
    }

    // Check for mobile phone
    const phones = homeowner.phones || [];
    const hasMobile = phones.some(p => 
      ['mobile', 'cell', 'wireless'].includes((p.type || '').toLowerCase())
    );

    if (hasMobile) return maxPoints;                           // Mobile = full points
    if (homeowner.phone) return maxPoints * 0.6;               // Has phone = 60%
    return 0;
  }

  /**
   * Score multiple homeowners
   * @param {Array} homeowners - Array of homeowner data
   * @returns {Array} - Sorted array of scored homeowners (highest first)
   */
  scoreAll(homeowners) {
    console.log(`\n   Scoring ${homeowners.length} homeowners...`);
    
    const scored = homeowners.map(h => this.scoreHomeowner(h));
    
    // Sort by score descending
    scored.sort((a, b) => b.thirstyBuyerScore - a.thirstyBuyerScore);

    console.log(`   Scoring complete!`);
    console.log(`   - High priority (75+): ${this.scoreDistribution.high}`);
    console.log(`   - Medium priority (50-74): ${this.scoreDistribution.medium}`);
    console.log(`   - Low priority (<50): ${this.scoreDistribution.low}`);

    return scored;
  }

  /**
   * Filter homeowners by minimum score
   * @param {Array} scoredHomeowners - Scored homeowner array
   * @param {number} minScore - Minimum score threshold (default: 50)
   * @returns {Array} - Filtered array
   */
  filterByScore(scoredHomeowners, minScore = 50) {
    const filtered = scoredHomeowners.filter(h => h.thirstyBuyerScore >= minScore);
    console.log(`   Filtered to ${filtered.length} homeowners with score >= ${minScore}`);
    return filtered;
  }

  /**
   * Get top N homeowners
   * @param {Array} scoredHomeowners - Scored homeowner array
   * @param {number} count - Number to return
   * @returns {Array} - Top N homeowners
   */
  getTopN(scoredHomeowners, count = 100) {
    return scoredHomeowners.slice(0, count);
  }

  /**
   * Get scoring statistics
   * @returns {Object} - Statistics
   */
  getStats() {
    return {
      totalScored: this.scoredCount,
      distribution: this.scoreDistribution,
      highPercentage: this.scoredCount > 0 
        ? Math.round((this.scoreDistribution.high / this.scoredCount) * 100) 
        : 0
    };
  }

  /**
   * Generate score explanation for a homeowner
   * Useful for sales reps to understand why this is a good lead
   */
  explainScore(homeowner) {
    const breakdown = homeowner.scoreBreakdown;
    const explanations = [];

    if (breakdown.lotSizeScore >= this.weights.lotSize * 0.7) {
      explanations.push(`Large lot (${homeowner.lotSizeSqFt?.toLocaleString()} sqft) - ideal for gates`);
    }

    if (breakdown.homeValueScore >= this.weights.homeValue * 0.7) {
      explanations.push(`High-value home ($${homeowner.homeValue?.toLocaleString()}) - can afford premium`);
    }

    if (breakdown.homeAgeScore >= this.weights.homeAge * 0.6) {
      explanations.push(`Older home (built ${homeowner.yearBuilt}) - likely no existing gates`);
    }

    if (breakdown.recentPurchaseScore > 0) {
      explanations.push(`Recent purchase - new owners often upgrade`);
    }

    if (breakdown.locationScore > 0) {
      explanations.push(`Prime location - security-conscious area`);
    }

    return {
      score: homeowner.thirstyBuyerScore,
      priority: homeowner.priority,
      reasons: explanations
    };
  }
}

module.exports = { HomeownerScorer };

