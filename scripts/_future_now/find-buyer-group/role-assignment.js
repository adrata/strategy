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
  constructor(dealSize, companyRevenue = 0, companyEmployees = 0, rolePriorities = null) {
    this.dealSize = dealSize;
    this.companyRevenue = companyRevenue;
    this.companyEmployees = companyEmployees;
    this.companyTier = determineCompanySizeTier(companyRevenue, companyEmployees);
    this.dealThresholds = getDealSizeThresholds(this.companyTier);
    this.rolePriorities = rolePriorities || {
      decision: 10,
      champion: 8,
      stakeholder: 6,
      blocker: 5,
      introducer: 4
    };
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

    // Special handling for very small companies (1-3 employees)
    if (this.companyEmployees <= 3) {
      return this.assignRolesForSmallCompany(employees);
    }

    // Sort by seniority first (C-level → VP → Director → Manager → Others)
    const sortedEmployees = [...employees].sort((a, b) => 
      this.getSeniorityScore(b.title) - this.getSeniorityScore(a.title)
    );

    // Get company size-based targets with actual company size and deal size
    const targets = getRoleDistributionTargets(
      this.companyTier, 
      employees.length, 
      this.companyEmployees,
      this.dealSize
    );

    const employeesWithRoles = [];
    let counts = { decision: 0, champion: 0, stakeholder: 0, blocker: 0, introducer: 0 };

    // Define confidence thresholds for role qualification (adjust based on priorities)
    const baseThresholds = {
      decision: 70,
      champion: 60,
      blocker: 50,
      introducer: 50,
      stakeholder: 40
    };
    
    // Adjust thresholds based on role priorities (higher priority = lower threshold requirement)
    const confidenceThresholds = {
      decision: Math.max(50, baseThresholds.decision - (this.rolePriorities.decision - 10) * 2),
      champion: Math.max(40, baseThresholds.champion - (this.rolePriorities.champion - 8) * 2),
      blocker: Math.max(30, baseThresholds.blocker - (this.rolePriorities.blocker - 5) * 2),
      introducer: Math.max(30, baseThresholds.introducer - (this.rolePriorities.introducer - 4) * 2),
      stakeholder: Math.max(20, baseThresholds.stakeholder - (this.rolePriorities.stakeholder - 6) * 2)
    };

    for (const emp of sortedEmployees) {
      let role = 'stakeholder'; // Default
      let confidence = 70;
      let reasoning = 'General stakeholder';
      const titleLower = emp.title?.toLowerCase() || '';
      const deptLower = emp.department?.toLowerCase() || '';

      // Decision Makers: C-level, VPs with budget authority (based on company tier)
      if (counts.decision < targets.decision && 
          this.isDecisionMaker(titleLower, this.dealSize, emp)) {
        const roleConfidence = Math.min((emp.scores?.seniority || 7) * 10, 100);
        if (roleConfidence >= confidenceThresholds.decision) {
          role = 'decision';
          confidence = roleConfidence;
          reasoning = this.generateDecisionMakerReasoning(emp, this.dealSize, this.companyTier);
          counts.decision++;
        }
      }
      
      // Champions: Operational leaders (Directors, VPs, Managers) - only if qualified
      if (role === 'stakeholder' && counts.champion < targets.champion && 
          (titleLower.includes('director') || titleLower.includes('head of') || 
           titleLower.includes('vp') || titleLower.includes('manager'))) {
        const roleConfidence = Math.min((emp.scores?.championPotential || 15) * 4, 100);
        if (roleConfidence >= confidenceThresholds.champion) {
          role = 'champion';
          confidence = roleConfidence;
          reasoning = this.generateChampionReasoning(emp, this.dealSize, this.companyTier);
          counts.champion++;
        }
      }
      
      // Blockers: Procurement, Legal, Security, Compliance - only if qualified
      if (role === 'stakeholder' && counts.blocker < targets.blocker && 
          this.isBlocker(deptLower, titleLower)) {
        const roleConfidence = 80; // Blockers are usually high confidence
        if (roleConfidence >= confidenceThresholds.blocker) {
          role = 'blocker';
          confidence = roleConfidence;
          reasoning = this.generateBlockerReasoning(emp, this.dealSize, this.companyTier);
          counts.blocker++;
        }
      }
      
      // Introducers: Customer-facing, Sales, Account Management - only if qualified
      if (role === 'stakeholder' && counts.introducer < targets.introducer && 
          (titleLower.includes('sales') || titleLower.includes('account') || 
           titleLower.includes('customer success') || titleLower.includes('business development') ||
           deptLower.includes('sales') || deptLower.includes('customer success'))) {
        const roleConfidence = Math.min((emp.scores?.influence || 7) * 10, 100);
        if (roleConfidence >= confidenceThresholds.introducer) {
          role = 'introducer';
          confidence = roleConfidence;
          reasoning = this.generateIntroducerReasoning(emp, this.dealSize, this.companyTier);
          counts.introducer++;
        }
      }
      
      // Stakeholders: Everyone else - only if meets minimum confidence
      if (role === 'stakeholder') {
        const roleConfidence = Math.min((emp.scores?.overallScore || 50) * 1.2, 100);
        if (roleConfidence >= confidenceThresholds.stakeholder) {
          confidence = roleConfidence;
          reasoning = this.generateStakeholderReasoning(emp, this.dealSize, this.companyTier);
          counts.stakeholder++;
        } else {
          // Skip this person - doesn't meet minimum confidence threshold
          continue;
        }
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
   * Assign roles for very small companies (1-3 employees)
   * @param {Array} employees - Array of employees
   * @returns {Array} Employees with assigned roles
   */
  assignRolesForSmallCompany(employees) {
    console.log(`🏢 Small company (${this.companyEmployees} employees) - adaptive role assignment`);
    
    const employeesWithRoles = [];
    
    // For 1-person companies: just assign decision maker role
    if (this.companyEmployees <= 1 && employees.length === 1) {
      const emp = employees[0];
      employeesWithRoles.push({
        ...emp,
        buyerGroupRole: 'decision',
        roleConfidence: 90,
        roleReasoning: 'Sole decision maker for 1-person company'
      });
      console.log(`✅ 1-person company: assigned ${emp.name} as decision maker`);
      return employeesWithRoles;
    }
    
    // For 2-3 person companies: prioritize CEO/Founder first, then by seniority
    const sortedEmployees = [...employees].sort((a, b) => {
      const aTitle = a.title?.toLowerCase() || '';
      const bTitle = b.title?.toLowerCase() || '';
      
      // CEO/Founder always first
      if (aTitle.includes('ceo') || aTitle.includes('founder')) return -1;
      if (bTitle.includes('ceo') || bTitle.includes('founder')) return 1;
      
      // Then by seniority score
      return this.getSeniorityScore(b.title) - this.getSeniorityScore(a.title);
    });
    
    let hasDecisionMaker = false;
    
    for (const emp of sortedEmployees) {
      const titleLower = emp.title?.toLowerCase() || '';
      let role = 'stakeholder';
      let confidence = 70;
      let reasoning = 'General stakeholder';
      
      // Assign first qualified person as decision maker
      if (!hasDecisionMaker && this.isDecisionMaker(titleLower, this.dealSize, emp)) {
        role = 'decision';
        confidence = Math.min((emp.scores?.seniority || 7) * 10, 100);
        reasoning = 'Primary decision maker for small company';
        hasDecisionMaker = true;
      }
      // Assign second person as champion if qualified
      else if (employeesWithRoles.length === 1 && 
               (titleLower.includes('director') || titleLower.includes('manager') || 
                titleLower.includes('vp') || titleLower.includes('head of'))) {
        role = 'champion';
        confidence = Math.min((emp.scores?.championPotential || 15) * 4, 100);
        reasoning = 'Operational champion for small company';
      }
      
      employeesWithRoles.push({
        ...emp,
        buyerGroupRole: role,
        roleConfidence: confidence,
        roleReasoning: reasoning
      });
    }
    
    console.log(`✅ Small company role assignment: ${employeesWithRoles.length} members assigned`);
    return employeesWithRoles;
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
   * @param {object} employee - Full employee object for product-fit validation
   * @returns {boolean} True if appropriate decision maker
   */
  isDecisionMaker(title, dealSize, employee = null) {
    const titleLower = title.toLowerCase();
    const thresholds = this.dealThresholds;
    
    // CEO/Founder are ALWAYS decision makers regardless of other criteria
    if (titleLower.includes('ceo') || titleLower.includes('founder') || 
        titleLower.includes('president') || titleLower.includes('owner')) {
      return true;
    }
    
    // Product-fit validation for other C-level executives
    if (employee) {
      const dept = employee.department?.toLowerCase() || '';
      const relevance = employee.relevance || 0;
      const departmentFit = employee.scores?.departmentFit || 0;
      
      // EXCLUDE Customer Success for sales software unless managing sales
      if (dept.includes('customer success') || dept.includes('customer service')) {
        if (!titleLower.includes('sales') && !titleLower.includes('revenue') && !titleLower.includes('business development')) {
          return false; // Exclude Customer Success unless managing sales
        }
      }
      
      // For other C-level executives, require minimum relevance and department fit
      if (titleLower.includes('cfo') || titleLower.includes('cto') || 
          titleLower.includes('coo') || titleLower.includes('chief')) {
        if (relevance < 0.3 || departmentFit < 5) {
          return false; // Relaxed criteria for C-level
        }
        return true;
      }
      
      // Require minimum relevance and department fit for non-C-level decision makers
      if (relevance < 0.4 || departmentFit < 7) {
        return false;
      }
    }
    
    // Other C-level executives (if they pass product-fit)
    if (titleLower.includes('cfo') || titleLower.includes('cto') || 
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
    
    // Handle case where only 1 person is acceptable and available
    if (min === 1 && employees.length === 1) {
      const best = employees[0];
      // Ensure they have a role (prefer decision maker if qualified)
      if (!best.buyerGroupRole) {
        if (this.isDecisionMaker(best.title, this.dealSize, best)) {
          best.buyerGroupRole = 'decision';
        } else {
          best.buyerGroupRole = 'champion'; // Fallback to champion
        }
      }
      return [best];
    }
    
    // Special handling for very small companies (1-3 employees)
    if (this.companyEmployees <= 3 && employees.length > 0) {
      // For 1-person companies, just return the best candidate
      if (this.companyEmployees <= 1 && employees.length === 1) {
        const best = employees[0];
        best.buyerGroupRole = 'decision'; // Ensure they're marked as decision maker
        return [best];
      }
      // For 2-3 person companies, return all with at least 1 decision maker
      if (employees.length <= 3) {
        const decisionMakers = employees.filter(e => e.buyerGroupRole === 'decision');
        if (decisionMakers.length === 0 && employees.length > 0) {
          // Promote best candidate to decision maker if none exists
          const best = employees.sort((a, b) => 
            (b.scores?.seniority || 0) - (a.scores?.seniority || 0)
          )[0];
          best.buyerGroupRole = 'decision';
        }
        return employees;
      }
    }
    
    // Handle case where we have limited candidates but min allows 1
    if (min === 1 && employees.length < ideal && employees.length >= 1) {
      // If we can't fill ideal, but have at least 1, return best candidates
      const sorted = employees.sort((a, b) => 
        (b.overallScore || 0) - (a.overallScore || 0)
      );
      
      // Ensure at least one decision maker if possible
      const decisionMakers = sorted.filter(e => e.buyerGroupRole === 'decision');
      if (decisionMakers.length === 0 && sorted.length > 0) {
        // Promote best candidate to decision maker
        sorted[0].buyerGroupRole = 'decision';
      }
      
      // Return up to available count, but at least 1
      return sorted.slice(0, Math.min(employees.length, max));
    }
    
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

    // Get company size-based targets with actual company size and deal size
    const targets = getRoleDistributionTargets(
      this.companyTier, 
      employees.length, 
      this.companyEmployees,
      this.dealSize
    );
    
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
    const relevance = emp.relevance || 0;
    const departmentFit = emp.scores?.departmentFit || 0;
    
    let reasoning = `Selected as Decision Maker for $${dealSize.toLocaleString()} deal: `;
    
    // Product-fit validation
    reasoning += `High product relevance (${Math.round(relevance * 100)}%) and department fit (${departmentFit}/10) for sales software. `;
    
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
    
    // Department relevance for sales software
    if (deptLower.includes('sales') || deptLower.includes('revenue')) {
      reasoning += `Sales/Revenue leadership directly uses and controls sales technology investments. `;
    } else if (deptLower.includes('marketing')) {
      reasoning += `Marketing leaders often own CRM and sales enablement tool budgets. `;
    } else if (deptLower.includes('it') || deptLower.includes('technology')) {
      reasoning += `IT/Technology leaders approve all software and platform purchases. `;
    } else if (deptLower.includes('finance')) {
      reasoning += `Finance department controls budget approval and vendor management. `;
    } else if (deptLower.includes('customer success')) {
      // Special case: Customer Success managing sales
      if (titleLower.includes('sales') || titleLower.includes('revenue')) {
        reasoning += `Customer Success leader managing sales functions has relevant budget authority. `;
      } else {
        reasoning += `Customer Success department typically not involved in sales software purchases. `;
      }
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
