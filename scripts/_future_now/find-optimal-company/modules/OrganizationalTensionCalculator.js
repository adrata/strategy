/**
 * Organizational Tension Calculator
 *
 * Calculates structural tensions within an organization based on:
 * 1. Department ratios vs. healthy benchmarks
 * 2. Leadership changes and tenure patterns
 * 3. Growth rate mismatches between departments
 * 4. Resource constraints (funding stage, headcount)
 * 5. Reporting line implications
 *
 * These tensions predict organizational behavior - like physics predicts motion from forces.
 */

const path = require('path');
const config = require('../obp-config.json');

class OrganizationalTensionCalculator {
  constructor(options = {}) {
    this.config = options.config || config;
    this.productContext = options.productContext || {
      targetDepartments: ['security', 'compliance'],
      productName: 'Compliance Automation'
    };
  }

  /**
   * Calculate all organizational tensions for a company
   * @param {object} orgData - Company data with employees array
   * @returns {object} Tension analysis with scores and implications
   */
  async calculateTensions(orgData) {
    console.log(`\n   Calculating organizational tensions for ${orgData.name || orgData.company_name}...`);

    // Classify employees by department
    const departments = this.classifyEmployeesByDepartment(orgData.employees || []);

    // Calculate each type of tension
    const ratioTension = this.calculateRatioTension(orgData, departments);
    const leadershipTension = this.calculateLeadershipTension(orgData, departments);
    const growthTension = this.calculateGrowthTension(orgData, departments);
    const resourceTension = this.calculateResourceTension(orgData);
    const reportingTension = this.calculateReportingTension(orgData, departments);

    // Calculate composite tension score
    const weights = this.config.pullScoreWeights;
    const compositeTension = Math.round(
      ratioTension.score * weights.ratio_tension +
      leadershipTension.score * weights.leadership_tension +
      growthTension.score * weights.growth_tension +
      resourceTension.score * weights.resource_tension +
      reportingTension.score * weights.reporting_tension
    );

    // Determine classification
    const classification = this.classifyTension(compositeTension);

    return {
      company: orgData.name || orgData.company_name,
      compositeTension,
      classification,

      tensions: {
        ratio: ratioTension,
        leadership: leadershipTension,
        growth: growthTension,
        resource: resourceTension,
        reporting: reportingTension
      },

      departments,

      topTensions: this.getTopTensions({
        ratio: ratioTension,
        leadership: leadershipTension,
        growth: growthTension,
        resource: resourceTension,
        reporting: reportingTension
      }),

      analyzedAt: new Date().toISOString()
    };
  }

  /**
   * Classify employees by department based on title keywords
   */
  classifyEmployeesByDepartment(employees) {
    const departments = {
      security: [],
      compliance: [],
      engineering: [],
      product: [],
      sales: [],
      marketing: [],
      finance: [],
      hr: [],
      executive: [],
      other: []
    };

    const departmentKeywords = this.config.departmentKeywords;

    for (const employee of employees) {
      const title = (employee.title || '').toLowerCase();
      let classified = false;

      // Check for executive titles first
      if (/^(ceo|cto|cfo|coo|ciso|cpo|cro|chief|president|founder)/i.test(title)) {
        departments.executive.push(employee);
        classified = true;
      }

      // Check each department's keywords
      for (const [dept, keywords] of Object.entries(departmentKeywords)) {
        if (keywords.some(kw => title.includes(kw))) {
          departments[dept].push(employee);
          classified = true;
          break;
        }
      }

      if (!classified) {
        departments.other.push(employee);
      }
    }

    // Calculate department sizes
    const sizes = {};
    for (const [dept, members] of Object.entries(departments)) {
      sizes[dept] = members.length;
    }

    return {
      members: departments,
      sizes,
      total: employees.length
    };
  }

  /**
   * Calculate ratio tension - are departments appropriately sized?
   */
  calculateRatioTension(orgData, departments) {
    const result = {
      score: 0,
      ratios: {},
      deviations: [],
      implication: null
    };

    const totalEmployees = orgData.employees_count || departments.total || 1;
    const industry = (orgData.industry || '').toLowerCase();

    // Security to company ratio
    const securityCount = departments.sizes.security || 0;
    const securityRatio = securityCount / totalEmployees;
    const securityBenchmark = this.config.ratios.security_to_company;

    // Apply industry adjustment
    let adjustedHealthyMin = securityBenchmark.healthy.min;
    let adjustedHealthyMax = securityBenchmark.healthy.max;

    for (const [ind, multiplier] of Object.entries(securityBenchmark.industryAdjustments || {})) {
      if (industry.includes(ind)) {
        adjustedHealthyMin *= multiplier;
        adjustedHealthyMax *= multiplier;
        break;
      }
    }

    result.ratios.security_to_company = {
      actual: securityRatio,
      actualLabel: `1:${Math.round(1 / securityRatio) || 'N/A'}`,
      healthy: { min: adjustedHealthyMin, max: adjustedHealthyMax },
      healthyLabel: `1:${Math.round(1 / adjustedHealthyMax)} to 1:${Math.round(1 / adjustedHealthyMin)}`
    };

    // Calculate deviation score for security ratio
    if (securityRatio < securityBenchmark.critical.max) {
      result.score = 90;
      result.deviations.push({
        type: 'critical_understaffed',
        department: 'security',
        severity: 'critical',
        evidence: `Security ratio ${result.ratios.security_to_company.actualLabel} is critically below healthy ${result.ratios.security_to_company.healthyLabel}`
      });
    } else if (securityRatio < securityBenchmark.concerning.min) {
      result.score = 70;
      result.deviations.push({
        type: 'concerning_understaffed',
        department: 'security',
        severity: 'concerning',
        evidence: `Security ratio ${result.ratios.security_to_company.actualLabel} is below healthy ${result.ratios.security_to_company.healthyLabel}`
      });
    } else if (securityRatio < adjustedHealthyMin) {
      result.score = 50;
      result.deviations.push({
        type: 'slightly_understaffed',
        department: 'security',
        severity: 'moderate',
        evidence: `Security ratio slightly below industry benchmark`
      });
    }

    // Security to engineering ratio
    const engineeringCount = departments.sizes.engineering || 1;
    const secEngRatio = securityCount / engineeringCount;
    const secEngBenchmark = this.config.ratios.security_to_engineering;

    result.ratios.security_to_engineering = {
      actual: secEngRatio,
      actualLabel: `1:${Math.round(1 / secEngRatio) || 'N/A'}`,
      healthy: secEngBenchmark.healthy,
      healthyLabel: `1:${Math.round(1 / secEngBenchmark.healthy.max)} to 1:${Math.round(1 / secEngBenchmark.healthy.min)}`
    };

    if (secEngRatio < secEngBenchmark.critical.max) {
      result.score = Math.max(result.score, 85);
      result.deviations.push({
        type: 'critical_sec_eng_ratio',
        department: 'security',
        severity: 'critical',
        evidence: `Security:Engineering ratio ${result.ratios.security_to_engineering.actualLabel} - security cannot keep up with engineering output`
      });
    }

    // Generate implication
    if (result.score >= 70) {
      result.implication = 'Security team is drowning - needs force multipliers (automation tools) to be effective';
    } else if (result.score >= 50) {
      result.implication = 'Security team is stretched - efficiency gains would help';
    } else {
      result.implication = 'Security team appears adequately staffed';
    }

    console.log(`   Ratio tension: ${result.score}/100`);
    return result;
  }

  /**
   * Calculate leadership tension - new leaders in prove-yourself window
   */
  calculateLeadershipTension(orgData, departments) {
    const result = {
      score: 0,
      newLeaders: [],
      champions: [],
      implication: null
    };

    const now = new Date();
    const leadershipTitles = this.config.titlePatterns.security_leadership
      .concat(this.config.titlePatterns.compliance_leadership);

    const matureCompanies = [
      ...this.config.matureCompanies.tier1_gold_standard,
      ...this.config.matureCompanies.tier2_strong_programs,
      ...this.config.matureCompanies.tier3_established
    ];

    // Find new leaders in target departments
    const allEmployees = orgData.employees || [];

    for (const employee of allEmployees) {
      const title = (employee.title || '').toLowerCase();

      // Check if this is a leadership role in security/compliance
      const isLeader = leadershipTitles.some(lt =>
        title.includes(lt.toLowerCase())
      );

      if (!isLeader) continue;

      // Calculate tenure
      const startDate = new Date(employee.start_date || employee.employment_start_date || now);
      const tenureDays = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));

      // Check if they're in the action window
      const windowConfig = this.config.leadershipPatterns.actionWindow;
      const inActionWindow = tenureDays >= windowConfig.start && tenureDays <= windowConfig.end;
      const inHoneymoon = tenureDays < this.config.leadershipPatterns.honeymoonWindow;

      // Check previous company background
      const careerHistory = employee.employment_history || [];
      const previousCompany = careerHistory[0]?.company_name || null;
      const previousTitle = careerHistory[0]?.title || null;

      const cameFromMatureCompany = previousCompany && matureCompanies.some(mc =>
        previousCompany.toLowerCase().includes(mc)
      );

      const cameFromCompliancePlatformUser = previousCompany && this.config.matureCompanies.compliancePlatformUsers.some(cp =>
        previousCompany.toLowerCase().includes(cp)
      );

      const leader = {
        name: employee.name || `${employee.first_name} ${employee.last_name}`,
        title: employee.title,
        tenureDays,
        startDate: startDate.toISOString(),
        inActionWindow,
        inHoneymoon,
        previousCompany,
        previousTitle,
        cameFromMatureCompany,
        cameFromCompliancePlatformUser,
        windowRemaining: Math.max(0, windowConfig.end - tenureDays),
        signals: []
      };

      // Score this leader
      let leaderScore = 0;

      if (tenureDays <= windowConfig.end) {
        result.newLeaders.push(leader);

        // Tenure scoring
        if (inHoneymoon) {
          leaderScore += 20;
          leader.signals.push({
            type: 'honeymoon_phase',
            score: 20,
            evidence: `${tenureDays} days in - still in honeymoon phase, building relationships`
          });
        } else if (inActionWindow) {
          leaderScore += 40;
          leader.signals.push({
            type: 'action_window',
            score: 40,
            evidence: `${tenureDays} days in - prime action window, ${leader.windowRemaining} days remaining to prove value`
          });
        }

        // Previous company scoring
        if (cameFromMatureCompany) {
          leaderScore += 35;
          leader.signals.push({
            type: 'mature_company_background',
            score: 35,
            evidence: `Previously at ${previousCompany} - knows what "good" looks like`
          });
        }

        if (cameFromCompliancePlatformUser) {
          leaderScore += 25;
          leader.signals.push({
            type: 'used_compliance_platform',
            score: 25,
            evidence: `Previous company likely used compliance automation - will expect same`
          });
        }

        leader.score = leaderScore;

        // Check if this is a potential champion
        if (leaderScore >= 40) {
          result.champions.push(leader);
        }
      }
    }

    // Calculate overall leadership tension score
    if (result.champions.length > 0) {
      // Use highest scoring champion
      result.champions.sort((a, b) => b.score - a.score);
      result.score = Math.min(100, result.champions[0].score);

      const topChampion = result.champions[0];
      result.implication = `${topChampion.name} (${topChampion.title}) is in prove-myself window ` +
        `with ${topChampion.windowRemaining} days remaining. ` +
        (topChampion.cameFromMatureCompany
          ? `Came from ${topChampion.previousCompany} - experiencing "ratio shock" and knows the right solution.`
          : `New to role - looking for quick wins.`);
    } else if (result.newLeaders.length > 0) {
      result.score = 30;
      result.implication = 'New leaders present but no strong champion signals detected';
    } else {
      result.score = 0;
      result.implication = 'No new security/compliance leadership detected';
    }

    console.log(`   Leadership tension: ${result.score}/100 (${result.champions.length} champions)`);
    return result;
  }

  /**
   * Calculate growth tension - is department growth keeping pace with company?
   */
  calculateGrowthTension(orgData, departments) {
    const result = {
      score: 0,
      companyGrowth: null,
      departmentGrowth: {},
      mismatches: [],
      implication: null
    };

    // Get company growth rate
    const companyGrowth = orgData.employees_count_change_yearly_percentage ||
                          orgData.employee_growth_rate || 0;
    result.companyGrowth = companyGrowth;

    // We often don't have department-specific growth, so we infer from:
    // 1. Current ratio deviation (if understaffed, growth likely lagged)
    // 2. Hiring patterns (job postings by department)

    const thresholds = this.config.growthTensionThresholds;

    // Check for hypergrowth mismatch
    if (companyGrowth >= thresholds.hypergrowth_mismatch.company_growth_min) {
      // Assume security growth is at most 50% of company growth (common pattern)
      const estimatedSecurityGrowth = companyGrowth * 0.4;

      if (estimatedSecurityGrowth <= thresholds.hypergrowth_mismatch.department_growth_max) {
        result.score = thresholds.hypergrowth_mismatch.tension_score;
        result.mismatches.push({
          type: 'hypergrowth_mismatch',
          companyGrowth,
          estimatedDeptGrowth: estimatedSecurityGrowth,
          gap: companyGrowth - estimatedSecurityGrowth
        });
        result.implication = thresholds.hypergrowth_mismatch.implication;
      }
    } else if (companyGrowth >= thresholds.significant_mismatch.company_growth_min) {
      result.score = thresholds.significant_mismatch.tension_score;
      result.implication = thresholds.significant_mismatch.implication;
    } else if (companyGrowth >= thresholds.moderate_mismatch.company_growth_min) {
      result.score = thresholds.moderate_mismatch.tension_score;
      result.implication = thresholds.moderate_mismatch.implication;
    } else {
      result.implication = 'Company growth is moderate - department scaling pressure is low';
    }

    console.log(`   Growth tension: ${result.score}/100 (company growth: ${companyGrowth}%)`);
    return result;
  }

  /**
   * Calculate resource tension - funding stage and headcount constraints
   */
  calculateResourceTension(orgData) {
    const result = {
      score: 0,
      fundingStage: null,
      fundingPressure: null,
      postFundingPhase: null,
      implication: null
    };

    // Determine funding stage
    const fundingRound = (orgData.last_funding_round_type || '').toLowerCase();
    let stage = 'unknown';

    if (fundingRound.includes('seed')) stage = 'seed';
    else if (fundingRound.includes('series a') || fundingRound === 'a') stage = 'series_a';
    else if (fundingRound.includes('series b') || fundingRound === 'b') stage = 'series_b';
    else if (fundingRound.includes('series c') || fundingRound === 'c') stage = 'series_c';
    else if (fundingRound.includes('series d') || fundingRound.includes('series e') ||
             fundingRound.includes('series f')) stage = 'series_d_plus';
    else if (fundingRound.includes('ipo') || fundingRound.includes('public')) stage = 'public';

    result.fundingStage = stage;

    const stagePressure = this.config.fundingPressure[stage];
    if (stagePressure) {
      result.fundingPressure = stagePressure;

      // Calculate score based on professionalization need
      if (stagePressure.professionalization === 'required') {
        result.score = 70;
      } else if (stagePressure.professionalization === 'expected' ||
                 stagePressure.professionalization === 'mature') {
        result.score = 60;
      } else if (stagePressure.professionalization === 'emerging') {
        result.score = 40;
      }
    }

    // Calculate post-funding phase
    if (orgData.last_funding_round_date) {
      const fundingDate = new Date(orgData.last_funding_round_date);
      const daysSinceFunding = Math.floor((new Date() - fundingDate) / (1000 * 60 * 60 * 24));

      if (daysSinceFunding <= 90) {
        result.postFundingPhase = this.config.postFundingTimeline['0-90_days'];
        // Boost score if in deployment phase
        result.score = Math.max(result.score, 50);
      } else if (daysSinceFunding <= 180) {
        result.postFundingPhase = this.config.postFundingTimeline['90-180_days'];
        // Peak buying window
        result.score = Math.max(result.score, 75);
      } else if (daysSinceFunding <= 365) {
        result.postFundingPhase = this.config.postFundingTimeline['180-365_days'];
        result.score = Math.max(result.score, 60);
      } else {
        result.postFundingPhase = this.config.postFundingTimeline['365+_days'];
      }
    }

    // Generate implication
    if (result.score >= 70) {
      result.implication = `${stage.replace('_', ' ')} company in deployment phase - ` +
        `investor pressure to professionalize operations and show traction`;
    } else if (result.score >= 50) {
      result.implication = `${stage.replace('_', ' ')} company - professionalization expected, ` +
        `compliance becoming important for next funding round`;
    } else {
      result.implication = 'Early stage - compliance likely not urgent yet';
    }

    console.log(`   Resource tension: ${result.score}/100 (${stage})`);
    return result;
  }

  /**
   * Calculate reporting tension - what does the reporting line imply?
   */
  calculateReportingTension(orgData, departments) {
    const result = {
      score: 0,
      reportingLines: [],
      decisionDynamics: null,
      implication: null
    };

    // Find security/compliance leaders and their reporting lines
    const leaders = departments.members.security
      .concat(departments.members.compliance)
      .filter(e => {
        const title = (e.title || '').toLowerCase();
        return /vp|director|head|chief|ciso/i.test(title);
      });

    if (leaders.length === 0) {
      result.implication = 'No clear security/compliance leadership - decisions likely fragmented';
      return result;
    }

    // For each leader, try to infer reporting line
    for (const leader of leaders) {
      // In real implementation, this would come from org chart data
      // For now, we'll infer from title patterns and company context
      let reportsTo = 'unknown';

      // Small companies often have security report to CTO
      const companySize = orgData.employees_count || 0;
      if (companySize < 100) {
        reportsTo = 'CTO';
      } else if (companySize < 500) {
        // Mid-size often has CISO/security report to CTO or CEO
        reportsTo = leader.title?.toLowerCase().includes('ciso') ? 'CEO' : 'CTO';
      } else {
        // Larger companies may have security report to various
        reportsTo = 'CEO'; // Default assumption for large company CISO
      }

      const reportingImplication = this.config.reportingLineImplications[reportsTo];

      result.reportingLines.push({
        leader: leader.name || leader.title,
        reportsTo,
        mandate: reportingImplication?.mandate,
        budget: reportingImplication?.budget,
        speed: reportingImplication?.speed,
        framingAdvice: reportingImplication?.framingAdvice,
        objectionLikely: reportingImplication?.objectionLikely
      });
    }

    // Score based on decision dynamics
    const primaryReporting = result.reportingLines[0];
    if (primaryReporting) {
      if (primaryReporting.budget === 'strict') {
        result.score = 60; // Higher tension - harder to get approval
        result.decisionDynamics = 'cost_justification_required';
      } else if (primaryReporting.budget === 'flexible') {
        result.score = 40; // Lower tension - easier path
        result.decisionDynamics = 'strategic_alignment_required';
      } else {
        result.score = 50;
        result.decisionDynamics = 'moderate_approval_path';
      }

      result.implication = `Security reports to ${primaryReporting.reportsTo} - ` +
        `${primaryReporting.framingAdvice}. ` +
        `Likely objection: "${primaryReporting.objectionLikely}"`;
    }

    console.log(`   Reporting tension: ${result.score}/100`);
    return result;
  }

  /**
   * Classify overall tension level
   */
  classifyTension(compositeTension) {
    const classifications = this.config.pullClassification;

    if (compositeTension >= classifications.PULL.min_score) {
      return {
        category: 'PULL',
        description: classifications.PULL.description,
        score: compositeTension
      };
    } else if (compositeTension >= classifications.HIGH_CONSIDERATION.min_score) {
      return {
        category: 'HIGH_CONSIDERATION',
        description: classifications.HIGH_CONSIDERATION.description,
        score: compositeTension
      };
    } else if (compositeTension >= classifications.CONSIDERATION.min_score) {
      return {
        category: 'CONSIDERATION',
        description: classifications.CONSIDERATION.description,
        score: compositeTension
      };
    } else {
      return {
        category: 'NOT_IN_MARKET',
        description: classifications.NOT_IN_MARKET.description,
        score: compositeTension
      };
    }
  }

  /**
   * Get top tensions sorted by score
   */
  getTopTensions(tensions) {
    return Object.entries(tensions)
      .map(([name, data]) => ({
        name,
        score: data.score,
        implication: data.implication
      }))
      .sort((a, b) => b.score - a.score)
      .filter(t => t.score > 0);
  }
}

module.exports = { OrganizationalTensionCalculator };
