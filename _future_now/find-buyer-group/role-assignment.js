/**
 * Role Assignment Module
 * 
 * Assigns buyer group roles appropriate for deal size and company size tier
 * Uses lowercase enum values: decision, champion, stakeholder, blocker, introducer
 */

const { 
  determineCompanySizeTier, 
  getRoleDistributionTargets, 
  getDealSizeThresholds 
} = require('./company-size-config');

class RoleAssignment {
  constructor(dealSize, companyRevenue = 0, companyEmployees = 0) {
    this.dealSize = dealSize;
    this.companyRevenue = companyRevenue;
    this.companyEmployees = companyEmployees;
    this.companyTier = determineCompanySizeTier(companyRevenue, companyEmployees);
    this.dealThresholds = getDealSizeThresholds(this.companyTier);
  }

  /**
   * Calculate seniority score for sorting
   * @param {string} title - Employee title
   * @returns {number} Seniority score (10 = CEO, 3 = Entry level)
   */
  getSeniorityScore(title) {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('ceo') || titleLower.includes('president')) return 10;
    if (titleLower.includes('cfo') || titleLower.includes('cto') || titleLower.includes('coo')) return 9;
    if (titleLower.includes('vp') || titleLower.includes('vice president')) return 8;
    if (titleLower.includes('director')) return 7;
    if (titleLower.includes('head of') || titleLower.includes('chief')) return 6;
    if (titleLower.includes('manager')) return 5;
    if (titleLower.includes('lead') || titleLower.includes('senior')) return 4;
    return 3;
  }

  /**
   * Assign roles to all employees with proper distribution
   * @param {Array} employees - Array of scored employees
   * @returns {Array} Employees with assigned roles
   */
  assignRoles(employees) {
    console.log(`🎭 Assigning roles for $${this.dealSize.toLocaleString()} deal (${this.companyTier} tier)...`);
    
    if (employees.length === 0) return [];

    // Sort by seniority first (C-level → VP → Director → Manager → Others)
    const sortedEmployees = [...employees].sort((a, b) => 
      this.getSeniorityScore(b.title) - this.getSeniorityScore(a.title)
    );

    // Get company size-based targets
    const targets = getRoleDistributionTargets(this.companyTier, employees.length);

    const employeesWithRoles = [];
    let counts = { decision: 0, champion: 0, stakeholder: 0, blocker: 0, introducer: 0 };

    for (const emp of sortedEmployees) {
      let role = 'stakeholder'; // Default
      let confidence = 70;
      let reasoning = 'General stakeholder';
      const titleLower = emp.title?.toLowerCase() || '';
      const deptLower = emp.department?.toLowerCase() || '';

      // Decision Makers: C-level, VPs with budget authority (based on company tier)
      if (counts.decision < targets.decision && 
          this.isDecisionMaker(titleLower, this.dealSize)) {
        role = 'decision';
        confidence = Math.min((emp.scores?.seniority || 7) * 10, 100);
        reasoning = this.generateDecisionMakerReasoning(emp, this.dealSize, this.companyTier);
        counts.decision++;
      }
      // Champions: Operational leaders (Directors, VPs, Managers)
      else if (counts.champion < targets.champion && 
               (titleLower.includes('director') || titleLower.includes('head of') || 
                titleLower.includes('vp') || titleLower.includes('manager'))) {
        role = 'champion';
        confidence = Math.min((emp.scores?.championPotential || 15) * 4, 100);
        reasoning = this.generateChampionReasoning(emp, this.dealSize, this.companyTier);
        counts.champion++;
      }
      // Blockers: Procurement, Legal, Security, Compliance
      else if (counts.blocker < targets.blocker && 
               this.isBlocker(deptLower, titleLower)) {
        role = 'blocker';
        confidence = 80;
        reasoning = this.generateBlockerReasoning(emp, this.dealSize, this.companyTier);
        counts.blocker++;
      }
      // Introducers: Customer-facing, Sales, Account Management
      else if (counts.introducer < targets.introducer && 
               (titleLower.includes('sales') || titleLower.includes('account') || 
                titleLower.includes('customer success') || titleLower.includes('business development') ||
                deptLower.includes('sales') || deptLower.includes('customer success'))) {
        role = 'introducer';
        confidence = Math.min((emp.scores?.influence || 7) * 10, 100);
        reasoning = this.generateIntroducerReasoning(emp, this.dealSize, this.companyTier);
        counts.introducer++;
      }
      // Stakeholders: Fill remaining up to target
      else if (counts.stakeholder < targets.stakeholder) {
        role = 'stakeholder';
        confidence = Math.min(emp.scores?.overallScore || 60, 100);
        reasoning = this.generateStakeholderReasoning(emp, this.dealSize, this.companyTier);
        counts.stakeholder++;
      }

      employeesWithRoles.push({
        ...emp,
        buyerGroupRole: role,
        roleConfidence: confidence,
        roleReasoning: reasoning
      });
    }

    console.log(`✅ Role assignment complete. Distribution: ${counts.decision} Decision Makers, ${counts.champion} Champions, ${counts.stakeholder} Stakeholders, ${counts.blocker} Blockers, ${counts.introducer} Introducers`);

    // Ensure required roles are present
    return this.ensureRequiredRoles(employeesWithRoles);
  }

  /**
   * Assign role to individual employee
   * @param {object} employee - Employee data
   * @returns {object} Role assignment with confidence
   */
  assignRole(employee) {
    const title = employee.title?.toLowerCase() || '';
    const dept = employee.department?.toLowerCase() || '';
    const scores = employee.scores || {};
    
    // Decision Maker (matches deal size)
    if (this.isDecisionMaker(title, this.dealSize)) {
      return {
        role: 'decision',
        confidence: Math.min(scores.seniority * 10, 100),
        reasoning: `Appropriate seniority for $${this.dealSize.toLocaleString()} deal`
      };
    }
    
    // Champion (operational leader who can advocate)
    if (scores.championPotential > 15) {
      return {
        role: 'champion',
        confidence: Math.min(scores.championPotential * 4, 100),
        reasoning: `Strong internal advocacy potential (${scores.championPotential}/25)`
      };
    }
    
    // Blocker (can kill deal)
    if (this.isBlocker(dept, title)) {
      return {
        role: 'blocker',
        confidence: 80,
        reasoning: `Potential deal blocker in ${dept} department`
      };
    }
    
    // Introducer (has relationships)
    if (this.isIntroducer(title, dept, scores)) {
      return {
        role: 'introducer',
        confidence: Math.min(scores.influence * 10, 100),
        reasoning: `Strong network influence (${scores.influence}/10)`
      };
    }
    
    // Default stakeholder
    return {
      role: 'stakeholder',
      confidence: Math.min(scores.overallScore || 60, 100),
      reasoning: `General stakeholder with ${scores.overallScore || 60}% relevance`
    };
  }

  /**
   * Check if employee is appropriate decision maker for deal size and company tier
   * @param {string} title - Employee title
   * @param {number} dealSize - Deal size in USD
   * @returns {boolean} True if appropriate decision maker
   */
  isDecisionMaker(title, dealSize) {
    const titleLower = title.toLowerCase();
    const thresholds = this.dealThresholds;
    
    // C-level executives are always decision makers
    if (titleLower.includes('ceo') || titleLower.includes('president') || 
        titleLower.includes('cfo') || titleLower.includes('cto') || 
        titleLower.includes('coo') || titleLower.includes('chief')) {
      return true;
    }
    
    // VPs with budget authority based on company tier
    if (titleLower.includes('vp') || titleLower.includes('vice president')) {
      return dealSize >= thresholds.vp;
    }
    
    // Directors for medium deals based on company tier
    if (titleLower.includes('director')) {
      return dealSize >= thresholds.director;
    }
    
    // Managers for smaller deals based on company tier
    if (titleLower.includes('manager')) {
      return dealSize >= thresholds.manager;
    }
    
    return false;
  }

  /**
   * Check if employee is potential champion
   * @param {string} title - Employee title
   * @param {string} dept - Employee department
   * @param {object} scores - Employee scores
   * @returns {boolean} True if potential champion
   */
  isChampion(title, dept, scores) {
    // Right level (Director/Senior Manager - can advocate but doesn't sign)
    const rightLevel = (title.includes('director') && !title.includes('senior director')) ||
                       title.includes('senior manager') ||
                       title.includes('sr manager');
    
    // Relevant department for advocacy
    const relevantDept = dept.includes('sales') || 
                        dept.includes('revenue') || 
                        dept.includes('operations') ||
                        dept.includes('product');
    
    // Strong champion potential score
    const strongPotential = scores.championPotential > 15;
    
    return rightLevel && (relevantDept || strongPotential);
  }

  /**
   * Check if employee is potential blocker
   * @param {string} dept - Employee department
   * @param {string} title - Employee title
   * @returns {boolean} True if potential blocker
   */
  isBlocker(dept, title) {
    // Departments that can block deals
    const blockerDepts = ['security', 'legal', 'compliance', 'procurement', 'finance'];
    
    // Titles that indicate gatekeeping
    const blockerTitles = ['security', 'legal', 'compliance', 'procurement', 'vendor'];
    
    return blockerDepts.some(d => dept.includes(d)) || 
           blockerTitles.some(t => title.includes(t));
  }

  /**
   * Check if employee is potential introducer
   * @param {string} title - Employee title
   * @param {string} dept - Employee department
   * @param {object} scores - Employee scores
   * @returns {boolean} True if potential introducer
   */
  isIntroducer(title, dept, scores) {
    // Customer-facing roles
    const customerFacing = title.includes('customer') || 
                          title.includes('account') ||
                          title.includes('relationship') ||
                          dept.includes('customer success');
    
    // Strong network influence
    const strongNetwork = scores.influence > 7;
    
    // Sales or business development background
    const salesBackground = dept.includes('sales') || 
                          dept.includes('business development') ||
                          title.includes('sales') ||
                          title.includes('business development');
    
    return (customerFacing || salesBackground) && strongNetwork;
  }

  /**
   * Ensure required roles are present in buyer group
   * @param {Array} employees - Employees with roles
   * @returns {Array} Enhanced employees with required roles
   */
  ensureRequiredRoles(employees) {
    const enhanced = [...employees];
    
    // CRITICAL: Always have Decision Maker + Champion
    const hasDecisionMaker = enhanced.some(m => m.buyerGroupRole === 'decision');
    const hasChampion = enhanced.some(m => m.buyerGroupRole === 'champion');
    
    if (!hasDecisionMaker) {
      console.log('⚠️ No decision maker found, promoting best candidate...');
      const bestCandidate = this.findBestDecisionMaker(enhanced);
      if (bestCandidate) {
        bestCandidate.buyerGroupRole = 'decision';
        bestCandidate.roleConfidence = Math.min(bestCandidate.scores.seniority * 10, 100);
        bestCandidate.roleReasoning = 'Promoted to decision maker (no better candidate found)';
      }
    }
    
    if (!hasChampion) {
      console.log('⚠️ No champion found, promoting best candidate...');
      const bestCandidate = this.findBestChampion(enhanced);
      if (bestCandidate) {
        bestCandidate.buyerGroupRole = 'champion';
        bestCandidate.roleConfidence = Math.min(bestCandidate.scores.championPotential * 4, 100);
        bestCandidate.roleReasoning = 'Promoted to champion (no better candidate found)';
      }
    }
    
    return enhanced;
  }

  /**
   * Find best decision maker candidate
   * @param {Array} employees - Employees with roles
   * @returns {object|null} Best decision maker candidate
   */
  findBestDecisionMaker(employees) {
    // Sort by seniority score descending
    const candidates = employees
      .filter(emp => emp.buyerGroupRole !== 'decision') // Exclude existing decision makers
      .sort((a, b) => b.scores.seniority - a.scores.seniority);
    
    return candidates[0] || null;
  }

  /**
   * Find best champion candidate
   * @param {Array} employees - Employees with roles
   * @returns {object|null} Best champion candidate
   */
  findBestChampion(employees) {
    // Sort by champion potential descending
    const candidates = employees
      .filter(emp => emp.buyerGroupRole !== 'champion') // Exclude existing champions
      .sort((a, b) => b.scores.championPotential - a.scores.championPotential);
    
    return candidates[0] || null;
  }

  /**
   * Get role distribution
   * @param {Array} employees - Employees with roles
   * @returns {object} Role distribution counts
   */
  getRoleDistribution(employees) {
    const distribution = {
      decision: 0,
      champion: 0,
      stakeholder: 0,
      blocker: 0,
      introducer: 0
    };
    
    employees.forEach(emp => {
      if (distribution.hasOwnProperty(emp.buyerGroupRole)) {
        distribution[emp.buyerGroupRole]++;
      }
    });
    
    return distribution;
  }

  /**
   * Select optimal buyer group from scored employees
   * @param {Array} employees - Employees with roles
   * @param {object} buyerGroupSize - Size constraints
   * @returns {Array} Optimal buyer group
   */
  selectOptimalBuyerGroup(employees, buyerGroupSize) {
    const { min, max, ideal } = buyerGroupSize;
    
    // Group by role
    const byRole = {
      decision: employees.filter(e => e.buyerGroupRole === 'decision'),
      champion: employees.filter(e => e.buyerGroupRole === 'champion'),
      blocker: employees.filter(e => e.buyerGroupRole === 'blocker'),
      introducer: employees.filter(e => e.buyerGroupRole === 'introducer'),
      stakeholder: employees.filter(e => e.buyerGroupRole === 'stakeholder')
    };

    // Sort each role by confidence/score
    Object.keys(byRole).forEach(role => {
      byRole[role].sort((a, b) => (b.roleConfidence || 0) - (a.roleConfidence || 0));
    });

    const selected = [];

    // Get company size-based targets
    const targets = getRoleDistributionTargets(this.companyTier, employees.length);
    
    // Add decision makers (based on company tier)
    selected.push(...byRole.decision.slice(0, Math.min(targets.decision, byRole.decision.length)));

    // Add champions (based on company tier)
    selected.push(...byRole.champion.slice(0, Math.min(targets.champion, byRole.champion.length)));

    // Add blockers (important to identify)
    selected.push(...byRole.blocker.slice(0, Math.min(targets.blocker, byRole.blocker.length)));

    // Add introducers
    selected.push(...byRole.introducer.slice(0, Math.min(targets.introducer, byRole.introducer.length)));

    // Fill remaining slots with stakeholders up to ideal size
    const remaining = ideal - selected.length;
    if (remaining > 0) {
      selected.push(...byRole.stakeholder.slice(0, remaining));
    }

    // Ensure we meet minimum size
    if (selected.length < min) {
      const additional = employees
        .filter(e => !selected.includes(e))
        .sort((a, b) => (b.scores?.overallScore || 0) - (a.scores?.overallScore || 0))
        .slice(0, min - selected.length);
      selected.push(...additional);
    }

    // Limit to maximum size
    return selected.slice(0, max);
  }

  /**
   * Validate buyer group composition
   * @param {Array} buyerGroup - Selected buyer group
   * @returns {object} Validation results
   */
  validateBuyerGroup(buyerGroup) {
    const distribution = this.getRoleDistribution(buyerGroup);
    const issues = [];
    
    // Check for required roles
    if (distribution.decision === 0) {
      issues.push('Missing decision maker');
    }
    
    if (distribution.champion === 0) {
      issues.push('Missing champion');
    }
    
    // Check for too many decision makers
    if (distribution.decision > 2) {
      issues.push('Too many decision makers');
    }
    
    // Check for balance
    if (distribution.stakeholder === 0) {
      issues.push('No stakeholders included');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      distribution,
      recommendation: issues.length === 0 ? 'Buyer group is well-balanced' : 'Consider adjustments'
    };
  }

  /**
   * Generate detailed reasoning for decision maker selection
   * @param {object} emp - Employee data
   * @param {number} dealSize - Deal size
   * @param {string} companyTier - Company tier
   * @returns {string} Detailed reasoning
   */
  generateDecisionMakerReasoning(emp, dealSize, companyTier) {
    const titleLower = emp.title?.toLowerCase() || '';
    const deptLower = emp.department?.toLowerCase() || '';
    
    let reasoning = `Selected as Decision Maker for $${dealSize.toLocaleString()} deal: `;
    
    // Budget authority reasoning
    if (titleLower.includes('ceo') || titleLower.includes('president')) {
      reasoning += `CEO/President has ultimate budget authority for all company purchases. `;
    } else if (titleLower.includes('cfo')) {
      reasoning += `CFO controls financial approvals and budget allocation for technology investments. `;
    } else if (titleLower.includes('cto')) {
      reasoning += `CTO owns technology strategy and budget for software/platform purchases. `;
    } else if (titleLower.includes('vp') || titleLower.includes('vice president')) {
      reasoning += `VP-level executives at ${companyTier} companies typically control $${this.dealThresholds.vp.toLocaleString()}+ purchases. `;
    } else if (titleLower.includes('director')) {
      reasoning += `Director-level at ${companyTier} companies has budget authority for $${this.dealThresholds.director.toLocaleString()}+ deals. `;
    }
    
    // Department relevance
    if (deptLower.includes('marketing')) {
      reasoning += `Marketing leaders often own CRM and sales enablement tool budgets. `;
    } else if (deptLower.includes('sales')) {
      reasoning += `Sales leadership controls revenue-generating technology investments. `;
    } else if (deptLower.includes('it') || deptLower.includes('technology')) {
      reasoning += `IT/Technology leaders approve all software and platform purchases. `;
    } else if (deptLower.includes('finance')) {
      reasoning += `Finance department controls budget approval and vendor management. `;
    }
    
    // Influence indicators
    if (emp.connectionsCount > 500) {
      reasoning += `High network influence (${emp.connectionsCount}+ connections) indicates cross-functional reach. `;
    }
    
    return reasoning.trim();
  }

  /**
   * Generate detailed reasoning for champion selection
   * @param {object} emp - Employee data
   * @param {number} dealSize - Deal size
   * @param {string} companyTier - Company tier
   * @returns {string} Detailed reasoning
   */
  generateChampionReasoning(emp, dealSize, companyTier) {
    const titleLower = emp.title?.toLowerCase() || '';
    const deptLower = emp.department?.toLowerCase() || '';
    
    let reasoning = `Selected as Champion for advocacy and implementation: `;
    
    // Operational role reasoning
    if (titleLower.includes('director')) {
      reasoning += `Director-level operational leaders drive adoption and change management. `;
    } else if (titleLower.includes('manager')) {
      reasoning += `Manager-level leaders implement solutions and influence team adoption. `;
    } else if (titleLower.includes('head of')) {
      reasoning += `Head of department roles have both strategic and operational influence. `;
    }
    
    // Department alignment
    if (deptLower.includes('sales')) {
      reasoning += `Sales leaders are natural champions for revenue-generating tools. `;
    } else if (deptLower.includes('marketing')) {
      reasoning += `Marketing leaders champion tools that improve lead generation and conversion. `;
    } else if (deptLower.includes('operations')) {
      reasoning += `Operations leaders drive efficiency improvements and process optimization. `;
    }
    
    // Champion potential indicators
    if (emp.scores?.championPotential > 15) {
      reasoning += `High champion potential based on role and department alignment. `;
    }
    
    return reasoning.trim();
  }

  /**
   * Generate detailed reasoning for blocker identification
   * @param {object} emp - Employee data
   * @param {number} dealSize - Deal size
   * @param {string} companyTier - Company tier
   * @returns {string} Detailed reasoning
   */
  generateBlockerReasoning(emp, dealSize, companyTier) {
    const titleLower = emp.title?.toLowerCase() || '';
    const deptLower = emp.department?.toLowerCase() || '';
    
    let reasoning = `Identified as potential Blocker due to gatekeeper function: `;
    
    // Risk management roles
    if (deptLower.includes('legal') || titleLower.includes('legal')) {
      reasoning += `Legal department reviews contracts and compliance requirements. `;
    } else if (deptLower.includes('security') || titleLower.includes('security')) {
      reasoning += `Security team evaluates data protection and access controls. `;
    } else if (deptLower.includes('procurement') || titleLower.includes('procurement')) {
      reasoning += `Procurement controls vendor selection and contract negotiations. `;
    } else if (deptLower.includes('finance') || titleLower.includes('finance')) {
      reasoning += `Finance department manages budget approval and cost controls. `;
    } else if (deptLower.includes('compliance')) {
      reasoning += `Compliance team ensures regulatory adherence and risk mitigation. `;
    }
    
    // Risk assessment
    reasoning += `Important to engage early to understand requirements and address concerns. `;
    
    return reasoning.trim();
  }

  /**
   * Generate detailed reasoning for introducer selection
   * @param {object} emp - Employee data
   * @param {number} dealSize - Deal size
   * @param {string} companyTier - Company tier
   * @returns {string} Detailed reasoning
   */
  generateIntroducerReasoning(emp, dealSize, companyTier) {
    const titleLower = emp.title?.toLowerCase() || '';
    const deptLower = emp.department?.toLowerCase() || '';
    
    let reasoning = `Selected as Introducer for relationship building: `;
    
    // Customer-facing roles
    if (deptLower.includes('sales') || titleLower.includes('sales')) {
      reasoning += `Sales professionals have strong internal networks and relationship skills. `;
    } else if (deptLower.includes('customer success') || titleLower.includes('customer success')) {
      reasoning += `Customer success teams understand user needs and adoption patterns. `;
    } else if (titleLower.includes('account')) {
      reasoning += `Account managers facilitate introductions and stakeholder connections. `;
    } else if (titleLower.includes('business development')) {
      reasoning += `Business development professionals excel at relationship building. `;
    }
    
    // Network influence
    if (emp.connectionsCount > 200) {
      reasoning += `Strong network (${emp.connectionsCount}+ connections) enables internal introductions. `;
    }
    
    reasoning += `Can facilitate connections between sales team and internal stakeholders. `;
    
    return reasoning.trim();
  }

  /**
   * Generate detailed reasoning for stakeholder selection
   * @param {object} emp - Employee data
   * @param {number} dealSize - Deal size
   * @param {string} companyTier - Company tier
   * @returns {string} Detailed reasoning
   */
  generateStakeholderReasoning(emp, dealSize, companyTier) {
    const titleLower = emp.title?.toLowerCase() || '';
    const deptLower = emp.department?.toLowerCase() || '';
    
    let reasoning = `Selected as Stakeholder for project influence: `;
    
    // Adjacent function reasoning
    if (deptLower.includes('hr') || deptLower.includes('human resources')) {
      reasoning += `HR stakeholders influence user adoption and change management. `;
    } else if (deptLower.includes('product')) {
      reasoning += `Product teams provide input on feature requirements and user experience. `;
    } else if (deptLower.includes('analytics') || deptLower.includes('data')) {
      reasoning += `Analytics teams measure success metrics and ROI validation. `;
    } else if (deptLower.includes('customer service') || deptLower.includes('support')) {
      reasoning += `Customer service teams provide user feedback and support requirements. `;
    }
    
    // Influence indicators
    if (emp.scores?.influence > 6) {
      reasoning += `High influence score indicates cross-functional impact potential. `;
    }
    
    reasoning += `Will be affected by implementation and can provide valuable input. `;
    
    return reasoning.trim();
  }
}

module.exports = { RoleAssignment };
