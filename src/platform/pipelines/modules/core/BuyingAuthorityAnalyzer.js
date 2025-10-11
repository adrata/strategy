/**
 * BUYING AUTHORITY ANALYZER
 * 
 * Determines a person's role in the buying process:
 * - decision_maker: Has budget authority and final approval
 * - champion: Internal advocate who promotes solution
 * - stakeholder: Influences decision but lacks final authority
 * - blocker: Can prevent or delay purchase
 * - introducer: Can facilitate access to decision makers
 */

class BuyingAuthorityAnalyzer {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Analyze buying authority
   */
  async analyzeBuyingAuthority(personData, companyData = {}) {
    console.log(`🎯 [BUYING AUTHORITY] Analyzing: ${personData.name}`);

    const role = this.determineBuyingRole(personData);
    const budgetControl = this.assessBudgetControl(personData, companyData);
    const signingLimit = this.estimateSigningLimit(personData, companyData);
    const influenceScore = this.calculateInfluenceScore(personData);

    return {
      role, // decision_maker, champion, stakeholder, blocker, introducer
      budgetControl, // very_high, high, moderate, low, none
      estimatedSigningLimit: signingLimit,
      influenceScore, // 0-1
      buyingCommitteeInfluence: influenceScore,
      rationale: this.explainRationale(role, personData)
    };
  }

  /**
   * Determine buying role
   */
  determineBuyingRole(personData) {
    const title = personData.title.toLowerCase();
    const dept = (personData.department || '').toLowerCase();

    // DECISION MAKERS - Budget authority
    if (this.isDecisionMaker(title, dept)) {
      return 'decision_maker';
    }

    // BLOCKERS - Control approval gates
    if (this.isBlocker(title, dept)) {
      return 'blocker';
    }

    // CHAMPIONS - Direct operational impact
    if (this.isChampion(title, dept)) {
      return 'champion';
    }

    // INTRODUCERS - Customer-facing, well-connected
    if (this.isIntroducer(title, dept)) {
      return 'introducer';
    }

    // STAKEHOLDERS - Everyone else
    return 'stakeholder';
  }

  /**
   * Check if decision maker
   */
  isDecisionMaker(title, dept) {
    const decisionMakerPatterns = [
      // C-Level
      /\bceo\b|\bchief executive\b|\bpresident\b|\bowner\b|\bfounder\b/,
      /\bcfo\b|\bchief financial\b|\bcontroller\b/,
      /\bcoo\b|\bchief operating\b/,
      /\bcto\b|\bchief technology\b|\bchief information\b/,
      /\bcro\b|\bchief revenue\b/,
      // VPs with budget
      /\bvp\b.*\b(operations|finance|engineering|product|sales|revenue)\b/,
      /\bvice president\b/,
      // Directors with P&L
      /\bdirector\b.*\b(operations|finance)\b/
    ];

    return decisionMakerPatterns.some(pattern => pattern.test(title));
  }

  /**
   * Check if blocker
   */
  isBlocker(title, dept) {
    const blockerPatterns = [
      /\bprocurement\b|\bsourcing\b/,
      /\bsecurity\b|\bciso\b|\bchief security/,
      /\blegal\b|\bcounsel\b|\bgeneral counsel/,
      /\bprivacy\b|\bcompliance\b|\bdata protection/,
      /\brisk\b.*\b(officer|director|manager)\b/
    ];

    return blockerPatterns.some(pattern => pattern.test(title));
  }

  /**
   * Check if champion
   */
  isChampion(title, dept) {
    const championPatterns = [
      /\bdirector\b.*\b(operations|product|engineering|sales|marketing)\b/,
      /\bhead of\b/,
      /\bmanager\b.*\b(operations|product|engineering)\b/,
      /\bsenior\b.*\b(manager|lead)\b/
    ];

    // Champions typically have direct operational impact
    const operationalDepts = ['operations', 'product', 'engineering', 'sales'];
    const isOperational = operationalDepts.some(d => dept.includes(d));

    return championPatterns.some(pattern => pattern.test(title)) && isOperational;
  }

  /**
   * Check if introducer
   */
  isIntroducer(title, dept) {
    const introducerPatterns = [
      /\baccount\b.*\b(executive|manager)\b/,
      /\bcustomer success\b/,
      /\bsales\b.*\b(executive|engineer|rep)\b/,
      /\bpartner\b.*\b(manager|director)\b/,
      /\bbusiness development\b/
    ];

    return introducerPatterns.some(pattern => pattern.test(title));
  }

  /**
   * Assess budget control
   */
  assessBudgetControl(personData, companyData) {
    const title = personData.title.toLowerCase();
    const companySize = companyData.employeeCount || 500;

    // C-Level at any company
    if (/\bc[efotor]o\b|chief/.test(title)) {
      return companySize > 1000 ? 'very_high' : 'high';
    }

    // VPs
    if (/\bvp\b|\bvice president\b/.test(title)) {
      return companySize > 500 ? 'high' : 'moderate';
    }

    // Directors
    if (/\bdirector\b/.test(title)) {
      return 'moderate';
    }

    // Managers
    if (/\bmanager\b|\bhead of\b/.test(title)) {
      return 'low';
    }

    return 'none';
  }

  /**
   * Estimate signing limit
   */
  estimateSigningLimit(personData, companyData) {
    const title = personData.title.toLowerCase();
    const companySize = companyData.employeeCount || 500;
    const companyRevenue = companyData.revenue || 10000000;

    // Base multiplier by company size
    let multiplier = 1;
    if (companyRevenue > 1000000000) multiplier = 5; // $1B+
    else if (companyRevenue > 100000000) multiplier = 3; // $100M+
    else if (companyRevenue > 10000000) multiplier = 2; // $10M+

    // Base limits by title
    if (/\bceo\b|\bchief executive\b|\bpresident\b/.test(title)) {
      return 1000000 * multiplier; // Up to $5M for large companies
    }

    if (/\bcfo\b|\bchief financial\b/.test(title)) {
      return 500000 * multiplier; // Up to $2.5M
    }

    if (/\bc[otr]o\b|chief/.test(title)) {
      return 300000 * multiplier; // Up to $1.5M
    }

    if (/\bvp\b|\bvice president\b/.test(title)) {
      return 250000 * multiplier; // Up to $1.25M
    }

    if (/\bdirector\b/.test(title)) {
      return 100000 * multiplier; // Up to $500K
    }

    if (/\bmanager\b/.test(title)) {
      return 50000 * multiplier; // Up to $250K
    }

    return 25000; // Individual contributor
  }

  /**
   * Calculate influence score
   */
  calculateInfluenceScore(personData) {
    let score = 0.5; // Base

    // Seniority
    const title = personData.title.toLowerCase();
    if (/\bc[efotor]o\b|chief/.test(title)) score += 0.3;
    else if (/\bvp\b|\bvice president\b/.test(title)) score += 0.2;
    else if (/\bdirector\b/.test(title)) score += 0.1;

    // Team size (direct reports)
    const reports = personData.directReports || 0;
    if (reports > 50) score += 0.15;
    else if (reports > 20) score += 0.10;
    else if (reports > 10) score += 0.05;

    // Tenure (more tenure = more influence)
    const tenure = personData.tenure || 12;
    if (tenure > 36) score += 0.05; // 3+ years

    return Math.min(1.0, score);
  }

  /**
   * Explain rationale
   */
  explainRationale(role, personData) {
    const title = personData.title;

    const rationales = {
      decision_maker: `${title} has budget authority and final approval power`,
      champion: `${title} has direct operational impact and benefits from solution`,
      stakeholder: `${title} influences decision but lacks final authority`,
      blocker: `${title} controls approval gates (procurement, security, legal, compliance)`,
      introducer: `${title} has relationships and can facilitate access to decision makers`
    };

    return rationales[role] || `${title} plays a role in buying process`;
  }
}

module.exports = { BuyingAuthorityAnalyzer };

