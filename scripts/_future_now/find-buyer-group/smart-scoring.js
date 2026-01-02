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
   * Detect sales org segment from title (Hunter vs Farmer detection)
   * Added from Snowflake buyer group audit - critical for sales org targeting
   * 
   * Sales Org Segments:
   * - Commercial = HUNTERS (acquisition, new business) ✅
   * - SMB = HUNTERS (high-volume new business) ✅
   * - Enterprise = MIXED (some acquisition, some expansion) ⚠️
   * - Majors/Strategic = FARMERS (single account, expansion only) ❌
   * - Global = FARMERS (named accounts, expansion) ❌
   * 
   * @param {string} title - Employee title
   * @returns {object} Segment info with type, priority, and score adjustment
   */
  detectSalesSegment(title) {
    const titleLower = (title || '').toLowerCase();
    
    // FARMERS - Expansion focused, penalize heavily
    if (titleLower.includes('strategic account') || titleLower.includes('strategic ae')) {
      return { segment: 'majors', type: 'farmer', priority: 'low', scoreAdjust: -30 };
    }
    if (titleLower.includes('global account') || titleLower.includes('global ae')) {
      return { segment: 'global', type: 'farmer', priority: 'low', scoreAdjust: -30 };
    }
    if (titleLower.includes('major account') || titleLower.includes('majors')) {
      return { segment: 'majors', type: 'farmer', priority: 'low', scoreAdjust: -25 };
    }
    if (titleLower.includes('named account')) {
      return { segment: 'named', type: 'farmer', priority: 'low', scoreAdjust: -25 };
    }
    if (titleLower.includes('key account') && !titleLower.includes('commercial')) {
      return { segment: 'key', type: 'farmer', priority: 'low', scoreAdjust: -20 };
    }
    if (titleLower.includes('expansion') && !titleLower.includes('commercial')) {
      return { segment: 'expansion', type: 'farmer', priority: 'low', scoreAdjust: -20 };
    }
    
    // HUNTERS - Acquisition focused, boost
    if (titleLower.includes('commercial')) {
      return { segment: 'commercial', type: 'hunter', priority: 'high', scoreAdjust: 20 };
    }
    if (titleLower.includes('smb') || titleLower.includes('small business')) {
      return { segment: 'smb', type: 'hunter', priority: 'high', scoreAdjust: 15 };
    }
    if (titleLower.includes('acquisition')) {
      return { segment: 'acquisition', type: 'hunter', priority: 'high', scoreAdjust: 15 };
    }
    if (titleLower.includes('new business')) {
      return { segment: 'new_business', type: 'hunter', priority: 'high', scoreAdjust: 15 };
    }
    
    // MIXED - Enterprise segment, neutral
    if (titleLower.includes('enterprise account') || titleLower.includes('enterprise ae')) {
      return { segment: 'enterprise', type: 'mixed', priority: 'medium', scoreAdjust: -5 };
    }
    
    // UNKNOWN - Generic AE or sales role
    if (titleLower.includes('account executive') || titleLower.includes(' ae ') || titleLower.endsWith(' ae')) {
      return { segment: 'unknown', type: 'unknown', priority: 'medium', scoreAdjust: 0 };
    }
    
    // Not a sales segment role (leadership, etc.)
    return { segment: 'none', type: 'leadership', priority: 'high', scoreAdjust: 0 };
  }

  /**
   * Score employee based on sales segment (hunter vs farmer)
   * @param {object} employee - Employee data
   * @returns {number} Segment score adjustment (-30 to +20)
   */
  scoreSalesSegment(employee) {
    if (this.productCategory !== 'sales') {
      return 0; // Only apply to sales product category
    }
    
    const segment = this.detectSalesSegment(employee.title);
    return segment.scoreAdjust;
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
    // Get segment info for logging
    const segmentInfo = this.detectSalesSegment(employee.title);
    
    return {
      seniority: this.scoreSeniority(employee),
      departmentFit: this.scoreDepartmentFit(employee),
      influence: this.scoreInfluence(employee),
      championPotential: this.scoreChampionPotential(employee),
      crossFunctional: this.scoreCrossFunctional(employee),
      geoAlignment: this.scoreGeography(employee),
      // NEW: Sales segment scoring (hunter vs farmer detection)
      // Added from Snowflake audit - penalizes farmers, boosts hunters
      salesSegment: this.scoreSalesSegment(employee),
      // Store segment info for role assignment
      _segmentInfo: segmentInfo
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
    
    // Check if this is an education-specific product
    const isEducation = this.productCategory === 'custom' && this.customFiltering;
    
    // C-level executives always get max score for any deal size
    if (this.isCLevelExecutive(employee.title)) {
      return 10;
    }
    
    // Education-specific seniority scoring
    if (isEducation) {
      // Education hierarchy: Provost > VP > Dean > Director
      // $500K+ deals: Provost/VP level
      if (this.dealSize >= 500000) {
        if (title.includes('provost') && !title.includes('assistant') && !title.includes('associate')) return 10;
        if (title.includes('vice provost')) return 9;
        if (title.includes('vp') || title.includes('vice president')) return 9;
        if (title.includes('svp') || title.includes('senior vice president')) return 10;
        if (title.includes('executive dean') || title.includes('dean of')) return 8;
        if (title.includes('director')) return 7;
      }
      // $200K-$500K deals: VP/Dean level
      else if (this.dealSize >= 200000) {
        if (title.includes('provost') || title.includes('vice provost')) return 10;
        if (title.includes('vp') || title.includes('vice president')) return 9;
        if (title.includes('svp') || title.includes('senior vice president')) return 10;
        if (title.includes('executive dean') || title.includes('dean of')) return 8;
        if (title.includes('senior director')) return 7;
        if (title.includes('director')) return 6;
      }
      // $100K-$200K deals: Dean/Director level
      else if (this.dealSize >= 100000) {
        if (title.includes('provost') || title.includes('vice provost')) return 10;
        if (title.includes('vp') || title.includes('vice president')) return 9;
        if (title.includes('executive dean') || title.includes('dean of')) return 8;
        if (title.includes('senior director')) return 7;
        if (title.includes('director')) return 7;
        if (title.includes('manager')) return 5;
      }
      // <$100K deals: Director/Manager level
      else {
        if (title.includes('provost') || title.includes('vice provost')) return 10;
        if (title.includes('vp') || title.includes('vice president')) return 9;
        if (title.includes('dean')) return 8;
        if (title.includes('senior director')) return 8;
        if (title.includes('director')) return 7;
        if (title.includes('manager')) return 6;
      }
    }
    // Standard B2B scoring
    else {
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
    
    // Check if this is an education-specific product
    const isEducation = this.productCategory === 'custom' && this.customFiltering;
    
    // Retention keyword boost (highest priority - indicates direct relevance)
    if (isEducation) {
      if (title.includes('retention') || dept.includes('retention')) {
        // Boost for retention-specific roles/departments
        let baseScore = 10;
        // Additional boost for CRO or Director of Retention
        if (title.includes('chief retention officer') || title.includes('cro') || 
            title.includes('director retention')) {
          return 10; // Max score
        }
        return baseScore;
      }
    }
    
    // Use custom filtering if provided
    if (this.customFiltering && this.customFiltering.departments) {
      const primary = this.customFiltering.departments.primary || [];
      const secondary = this.customFiltering.departments.secondary || [];
      
      // Prioritize Financial Aid (financial barriers are #1 dropout reason)
      if (isEducation && (dept.includes('financial aid') || title.includes('financial aid'))) {
        return 10;
      }
      
      // Prioritize Counseling Services (mental health critical for retention)
      if (isEducation && (dept.includes('counseling') || title.includes('counseling'))) {
        return 10;
      }
      
      // Better recognition of Enrollment Management (manages retention strategy)
      if (isEducation && (dept.includes('enrollment management') || title.includes('enrollment management'))) {
        return 10;
      }
      
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
    
    // Product-specific relevance (for Sales software) - ACQUISITION FOCUSED
    if (this.productCategory === 'sales') {
      // EXCLUSIONS FIRST - these roles are NOT relevant for sales acquisition
      // Account Management = existing customer focus (expansion/retention)
      // Product roles = build products, don't buy sales tools
      // Customer Success = existing customer focus
      if (dept.includes('account management') || 
          dept.includes('customer success') || 
          dept.includes('customer service') ||
          dept.includes('product management') ||
          dept.includes('product') ||
          dept.includes('engineering')) {
        return 2; // Low score - not relevant for acquisition
      }
      
      if (title.includes('account manager') ||
          title.includes('customer success') ||
          title.includes('product manager') ||
          title.includes('product owner') ||
          title.includes('engineer') ||
          title.includes('developer')) {
        return 2; // Low score - not relevant for acquisition
      }
      
      // Primary relevance - direct users and decision makers for sales tools
      const primaryDepts = ['sales', 'revenue', 'business development', 'sales enablement', 'revenue operations', 'sales operations'];
      const primaryTitles = ['sales', 'revenue', 'business development', 'cro', 'chief revenue officer', 'sdr', 'bdr', 'revops'];
      
      if (primaryDepts.some(d => dept.includes(d))) return 10;
      if (primaryTitles.some(t => title.includes(t))) return 9;
      
      // Secondary relevance - marketing only if growth/demand gen focused
      if (dept.includes('marketing')) {
        if (title.includes('growth') || title.includes('demand gen') || title.includes('revenue')) {
          return 8;
        }
        return 5; // General marketing
      }
      
      // Operations can be relevant for sales ops
      if (dept.includes('operations') && !dept.includes('product operations')) {
        return 7;
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
    
    // Check if this is an education-specific product
    const isEducation = this.productCategory === 'custom' && this.customFiltering;
    
    // Retention-specific role scoring (highest priority)
    if (isEducation) {
      // CRO and dedicated retention roles get highest scores (use systems daily, advocate strongly)
      if (title.includes('chief retention officer') || title.includes('cro')) score += 15;
      if (title.includes('director retention') || title.includes('director student success')) score += 12;
      if (title.includes('retention') && title.includes('director')) score += 10;
      
      // Education-specific champion roles (Deans, Directors of Student Success)
      if (title.includes('dean of student success') || title.includes('dean of student services')) score += 11;
      if (title.includes('director student success') || title.includes('director student engagement')) score += 10;
      if (title.includes('director academic advising') || title.includes('director first-year experience')) score += 9;
      
      // Titles with "retention" keyword get boost
      if (title.includes('retention')) score += 5;
      if (title.includes('student success')) score += 4;
    }
    
    // Right level (Director/Senior Manager - can advocate but doesn't sign)
    // Directors use systems daily, so they get higher scores than managers
    if (title.includes('director') && !title.includes('senior director')) {
      score += isEducation ? 8 : 10; // Slightly lower for education (already scored above)
    }
    if (title.includes('senior director')) score += 7;
    if (title.includes('senior manager') || title.includes('sr manager')) score += 6;
    if (title.includes('manager') && !title.includes('senior')) score += 4;
    
    // Relevant department for advocacy
    if (isEducation) {
      // Education-specific departments
      if (dept.includes('retention') || dept.includes('student success')) score += 8;
      if (dept.includes('student affairs') || dept.includes('academic affairs')) score += 7;
      if (dept.includes('enrollment management') || dept.includes('academic advising')) score += 6;
      if (dept.includes('financial aid') || dept.includes('counseling services')) score += 5;
    } else {
      // Standard B2B departments for SALES SOFTWARE - ACQUISITION FOCUSED
      // EXCLUDED: Product roles - they build products, they don't buy sales tools
      // EXCLUDED: Account Management - existing customer focus
      if (dept.includes('account management') || 
          dept.includes('customer success') ||
          dept.includes('product')) {
        score += 0; // No champion score for excluded roles
      } else if (dept.includes('sales') || dept.includes('revenue') || dept.includes('business development')) {
        score += 8;
      } else if (dept.includes('operations') || dept.includes('marketing')) {
        score += 5;
      }
    }
    
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
    
    // Product-specific relevance calculation - ACQUISITION FOCUSED
    if (this.productCategory === 'sales') {
      // EXCLUSIONS FIRST - these roles are NOT relevant for sales acquisition
      // Account Management = existing customer focus (expansion/retention)
      // Product roles = build products, don't buy sales tools
      // Customer Success = existing customer focus
      if (dept.includes('account management') || 
          dept.includes('customer success') || 
          dept.includes('customer service') ||
          dept.includes('product management') ||
          dept.includes('product') ||
          dept.includes('engineering')) {
        return 0.1; // Very low relevance
      }
      
      if (title.includes('account manager') ||
          title.includes('customer success') ||
          title.includes('product manager') ||
          title.includes('product owner') ||
          title.includes('engineer') ||
          title.includes('developer')) {
        return 0.1; // Very low relevance
      }
      
      // Primary relevance (direct users and decision makers for sales tools)
      const primaryDepts = ['sales', 'revenue', 'business development', 'sales enablement', 'revenue operations', 'sales operations'];
      const primaryTitles = ['sales', 'revenue', 'business development', 'cro', 'chief revenue officer', 'sdr', 'bdr', 'revops'];
      
      if (primaryDepts.some(d => dept.includes(d))) relevance += 0.5;
      if (primaryTitles.some(t => title.includes(t))) relevance += 0.4;
      
      // Marketing only if growth/demand gen focused
      if (dept.includes('marketing')) {
        if (title.includes('growth') || title.includes('demand gen') || title.includes('revenue')) {
          relevance += 0.3;
        } else {
          relevance += 0.1; // General marketing
        }
      }
      
      // Operations relevance (for sales ops)
      if (dept.includes('operations') && !dept.includes('product operations')) {
        relevance += 0.2;
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
