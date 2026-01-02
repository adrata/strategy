/**
 * Behavioral Physics Engine
 *
 * Models predictable organizational behaviors based on structural tensions.
 * Like physics predicts motion from forces, this predicts buying behavior from tensions.
 *
 * Key behavioral patterns:
 * 1. New Leader Syndrome - 90-day action window, momentum from previous company
 * 2. Ratio Shock - When someone from a well-resourced company joins an under-resourced one
 * 3. Budget Cycle Dynamics - Q4 flush, Q1 new initiatives
 * 4. Principal-Agent Tensions - Different stakeholders, different incentives
 * 5. Anchoring Effects - New leaders anchor on their previous company's approach
 */

const config = require('../obp-config.json');

class BehavioralPhysicsEngine {
  constructor(options = {}) {
    this.config = options.config || config;
    this.productContext = options.productContext || {};
  }

  /**
   * Predict organizational behavior based on tensions
   * @param {object} tensionAnalysis - Output from OrganizationalTensionCalculator
   * @returns {object} Behavioral predictions
   */
  async predictBehavior(tensionAnalysis) {
    console.log(`\n   Modeling behavioral physics for ${tensionAnalysis.company}...`);

    const predictions = {
      buyingProbability: 0,
      actionWindow: null,
      champion: null,
      decisionPath: null,
      behavioralPatterns: [],
      pitchFraming: null,
      objectionPredictions: [],
      timingRecommendation: null
    };

    // 1. Analyze champion dynamics
    predictions.champion = this.analyzeChampionDynamics(tensionAnalysis);

    // 2. Calculate buying probability
    predictions.buyingProbability = this.calculateBuyingProbability(tensionAnalysis, predictions.champion);

    // 3. Determine action window
    predictions.actionWindow = this.determineActionWindow(tensionAnalysis, predictions.champion);

    // 4. Model decision path
    predictions.decisionPath = this.modelDecisionPath(tensionAnalysis);

    // 5. Identify behavioral patterns
    predictions.behavioralPatterns = this.identifyBehavioralPatterns(tensionAnalysis, predictions.champion);

    // 6. Generate pitch framing
    predictions.pitchFraming = this.generatePitchFraming(tensionAnalysis, predictions);

    // 7. Predict objections
    predictions.objectionPredictions = this.predictObjections(tensionAnalysis, predictions);

    // 8. Timing recommendation
    predictions.timingRecommendation = this.generateTimingRecommendation(tensionAnalysis, predictions);

    return predictions;
  }

  /**
   * Analyze champion dynamics - who is most likely to drive a purchase?
   */
  analyzeChampionDynamics(tensionAnalysis) {
    const leadershipTension = tensionAnalysis.tensions.leadership;

    if (!leadershipTension.champions || leadershipTension.champions.length === 0) {
      return {
        identified: false,
        reason: 'No new security/compliance leadership detected',
        recommendation: 'Target company generally, or identify emerging leader'
      };
    }

    // Get top champion
    const topChampion = leadershipTension.champions[0];

    // Analyze their specific dynamics
    const dynamics = {
      identified: true,
      name: topChampion.name,
      title: topChampion.title,
      tenureDays: topChampion.tenureDays,
      windowRemaining: topChampion.windowRemaining,
      previousCompany: topChampion.previousCompany,
      previousTitle: topChampion.previousTitle,

      // Behavioral predictions
      urgencyLevel: this.calculateUrgencyLevel(topChampion),
      knowledgeLevel: this.assessKnowledgeLevel(topChampion),
      internalInfluence: this.assessInternalInfluence(topChampion, tensionAnalysis),

      // Action predictions
      likelyActions: [],
      communicationStyle: null,
      decisionCriteria: []
    };

    // Predict likely actions based on tenure
    if (topChampion.inActionWindow) {
      dynamics.likelyActions.push({
        action: 'Evaluating tool purchases to demonstrate quick wins',
        probability: 0.8
      });
      dynamics.likelyActions.push({
        action: 'Building business case for automation',
        probability: 0.7
      });
    }

    if (topChampion.cameFromMatureCompany) {
      dynamics.likelyActions.push({
        action: 'Comparing current state to previous company standards',
        probability: 0.9
      });
      dynamics.likelyActions.push({
        action: 'Advocating for tools they used before',
        probability: 0.6
      });

      // They'll know specific tools
      dynamics.decisionCriteria.push('Comparison to tools used at ' + topChampion.previousCompany);
    }

    // Communication style based on background
    dynamics.communicationStyle = topChampion.cameFromMatureCompany
      ? 'data_driven_benchmark_oriented'
      : 'problem_solution_oriented';

    // Decision criteria
    dynamics.decisionCriteria.push('Speed to value (90-day window)');
    dynamics.decisionCriteria.push('Ease of implementation');
    dynamics.decisionCriteria.push('Credibility with leadership');

    return dynamics;
  }

  /**
   * Calculate urgency level based on champion signals
   */
  calculateUrgencyLevel(champion) {
    let urgency = 0;

    // Tenure-based urgency
    if (champion.tenureDays < 30) {
      urgency += 30; // Still learning, building relationships
    } else if (champion.tenureDays < 60) {
      urgency += 60; // Peak action zone
    } else if (champion.tenureDays < 90) {
      urgency += 50; // Still in window but time pressure building
    } else {
      urgency += 20; // Past prime window
    }

    // Background-based urgency
    if (champion.cameFromMatureCompany) {
      urgency += 25; // Experiencing "ratio shock"
    }

    // Normalize to 0-100
    return Math.min(100, urgency);
  }

  /**
   * Assess knowledge level about solutions
   */
  assessKnowledgeLevel(champion) {
    if (champion.cameFromCompliancePlatformUser) {
      return {
        level: 'expert',
        score: 90,
        implication: 'Knows exactly what solution looks like - will have specific expectations'
      };
    }

    if (champion.cameFromMatureCompany) {
      return {
        level: 'informed',
        score: 70,
        implication: 'Understands the problem and general solutions - open to learning specifics'
      };
    }

    return {
      level: 'learning',
      score: 40,
      implication: 'May need education on solutions - opportunity to position as trusted advisor'
    };
  }

  /**
   * Assess internal influence of champion
   */
  assessInternalInfluence(champion, tensionAnalysis) {
    let influence = 50; // Base influence for security/compliance leader

    // Title-based influence
    if (/ciso|chief/i.test(champion.title)) {
      influence += 30;
    } else if (/vp|vice president/i.test(champion.title)) {
      influence += 20;
    } else if (/director/i.test(champion.title)) {
      influence += 10;
    }

    // Tenure paradox - new but senior = transformational mandate
    if (champion.tenureDays < 90 && /ciso|vp|director/i.test(champion.title)) {
      influence += 15; // New senior hire = mandate to change things
    }

    // Background influence
    if (champion.cameFromMatureCompany) {
      influence += 10; // Carries authority from reputable background
    }

    return {
      score: Math.min(100, influence),
      canChampionAlone: influence >= 70,
      needsSponsorship: influence < 70,
      recommendedApproach: influence >= 70
        ? 'Champion can likely drive decision - focus on arming them with data'
        : 'Champion needs executive sponsor - help them build the business case'
    };
  }

  /**
   * Calculate overall buying probability
   */
  calculateBuyingProbability(tensionAnalysis, champion) {
    let probability = 0;

    // Base probability from composite tension
    probability += tensionAnalysis.compositeTension * 0.5 / 100;

    // Champion contribution
    if (champion.identified) {
      probability += 0.2;

      // Action window bonus
      if (champion.windowRemaining > 0 && champion.windowRemaining < 60) {
        probability += 0.15;
      }

      // Knowledge level bonus
      if (champion.knowledgeLevel?.level === 'expert') {
        probability += 0.1;
      }
    }

    // Fiscal calendar adjustment
    const quarter = Math.floor((new Date().getMonth()) / 3) + 1;
    const quarterPattern = this.config.fiscalCalendarPatterns[`q${quarter}`];
    if (quarterPattern) {
      probability *= (1 + quarterPattern.buyingLikelihood - 0.5);
    }

    return Math.min(0.95, Math.max(0.05, probability));
  }

  /**
   * Determine action window
   */
  determineActionWindow(tensionAnalysis, champion) {
    const windows = [];

    // Champion's prove-yourself window
    if (champion.identified && champion.windowRemaining > 0) {
      windows.push({
        type: 'champion_window',
        daysRemaining: champion.windowRemaining,
        urgency: champion.windowRemaining < 30 ? 'critical' : 'high',
        description: `${champion.name}'s 90-day window closes in ${champion.windowRemaining} days`
      });
    }

    // Post-funding window
    const resourceTension = tensionAnalysis.tensions.resource;
    if (resourceTension.postFundingPhase?.phase === 'deployment') {
      windows.push({
        type: 'post_funding',
        phase: 'deployment',
        urgency: 'high',
        description: 'Post-funding deployment phase - capital available, pressure to show progress'
      });
    }

    // Fiscal calendar window
    const quarter = Math.floor((new Date().getMonth()) / 3) + 1;
    const quarterPattern = this.config.fiscalCalendarPatterns[`q${quarter}`];
    if (quarterPattern && quarterPattern.buyingLikelihood >= 0.6) {
      windows.push({
        type: 'fiscal_calendar',
        quarter: `Q${quarter}`,
        pattern: quarterPattern.pattern,
        urgency: 'moderate',
        description: quarterPattern.framing
      });
    }

    // Sort by urgency
    const urgencyOrder = { critical: 0, high: 1, moderate: 2, low: 3 };
    windows.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

    return {
      windows,
      primaryWindow: windows[0] || null,
      optimalTiming: windows.length > 0
        ? `Act within ${Math.min(...windows.filter(w => w.daysRemaining).map(w => w.daysRemaining)) || 30} days`
        : 'No urgent window - standard timing'
    };
  }

  /**
   * Model the decision path
   */
  modelDecisionPath(tensionAnalysis) {
    const reportingTension = tensionAnalysis.tensions.reporting;
    const primaryReporting = reportingTension.reportingLines?.[0];

    if (!primaryReporting) {
      return {
        path: 'unknown',
        stakeholders: [],
        recommendation: 'Map the org structure to understand decision path'
      };
    }

    const path = {
      champion: primaryReporting.leader,
      reportsTo: primaryReporting.reportsTo,
      mandate: primaryReporting.mandate,
      budgetAuthority: primaryReporting.budget,
      approvalSpeed: primaryReporting.speed,
      stakeholders: [],
      decisionCriteria: []
    };

    // Model stakeholders based on reporting line
    path.stakeholders.push({
      role: 'Champion',
      person: primaryReporting.leader,
      need: 'Quick win to prove value',
      objection: 'Implementation complexity, time to value'
    });

    path.stakeholders.push({
      role: 'Budget Authority',
      person: primaryReporting.reportsTo,
      need: this.getStakeholderNeed(primaryReporting.reportsTo),
      objection: primaryReporting.objectionLikely
    });

    // Add decision criteria based on mandate
    if (primaryReporting.mandate === 'cost_compliance') {
      path.decisionCriteria = ['ROI / payback period', 'Cost vs. hiring', 'Audit readiness'];
    } else if (primaryReporting.mandate === 'technical') {
      path.decisionCriteria = ['Integration quality', 'Engineering productivity', 'Technical excellence'];
    } else if (primaryReporting.mandate === 'strategic') {
      path.decisionCriteria = ['Business impact', 'Competitive advantage', 'Speed'];
    }

    return path;
  }

  /**
   * Get stakeholder need based on role
   */
  getStakeholderNeed(role) {
    const needs = {
      'CEO': 'Strategic progress, board confidence',
      'CTO': 'Technical excellence, team productivity',
      'CFO': 'Cost control, ROI, audit readiness',
      'COO': 'Operational efficiency, process improvement',
      'General Counsel': 'Risk mitigation, compliance assurance'
    };
    return needs[role] || 'Value delivery';
  }

  /**
   * Identify behavioral patterns in play
   */
  identifyBehavioralPatterns(tensionAnalysis, champion) {
    const patterns = [];
    const principles = this.config.behavioralPrinciples;

    // Anchoring - if champion from mature company
    if (champion.identified && champion.previousCompany) {
      patterns.push({
        principle: 'anchoring',
        description: principles.anchoring.description,
        application: `${champion.name} will anchor on ${champion.previousCompany}'s approach`,
        tactic: `Reference how ${champion.previousCompany} or similar companies handle this`
      });
    }

    // Loss aversion - if high tension
    if (tensionAnalysis.compositeTension >= 60) {
      patterns.push({
        principle: 'loss_aversion',
        description: principles.loss_aversion.description,
        application: 'Frame around what they lose by not acting, not just what they gain',
        tactic: 'Quantify the cost of inaction: "Every month without SOC 2 is X enterprise deals at risk"'
      });
    }

    // Scarcity - if action window closing
    if (champion.identified && champion.windowRemaining && champion.windowRemaining < 60) {
      patterns.push({
        principle: 'scarcity',
        description: principles.scarcity.description,
        application: `Only ${champion.windowRemaining} days left in ${champion.name}'s action window`,
        tactic: 'Emphasize the closing window: "To show results before your 90-day mark..."'
      });
    }

    // Authority - if champion has relevant background
    if (champion.identified && champion.knowledgeLevel?.level === 'expert') {
      patterns.push({
        principle: 'authority',
        description: principles.authority.description,
        application: `${champion.name}'s experience at ${champion.previousCompany} gives them internal authority`,
        tactic: 'Position champion as the expert: "As someone who\'s done this before, you know..."'
      });
    }

    // Social proof - competitors likely have compliance
    patterns.push({
      principle: 'social_proof',
      description: principles.social_proof.description,
      application: 'Reference what competitors and similar companies do',
      tactic: 'Use peer pressure: "Most Series B companies in your space have SOC 2 by now"'
    });

    return patterns;
  }

  /**
   * Generate pitch framing based on decision dynamics
   */
  generatePitchFraming(tensionAnalysis, predictions) {
    const reportingTension = tensionAnalysis.tensions.reporting;
    const primaryReporting = reportingTension.reportingLines?.[0];

    const framing = {
      primary: null,
      secondary: [],
      avoid: [],
      openingAngle: null
    };

    // Primary framing based on reporting line
    if (primaryReporting) {
      framing.primary = {
        audience: primaryReporting.reportsTo,
        message: primaryReporting.framingAdvice,
        format: this.getFramingFormat(primaryReporting.mandate)
      };
    }

    // Champion-specific framing
    if (predictions.champion.identified) {
      framing.secondary.push({
        audience: predictions.champion.name,
        message: `Quick win for your first 90 days - show security progress without adding headcount`,
        format: 'time_to_value'
      });

      if (predictions.champion.previousCompany) {
        framing.secondary.push({
          audience: predictions.champion.name,
          message: `Bring ${predictions.champion.previousCompany}-level security operations here`,
          format: 'benchmark'
        });
      }
    }

    // What to avoid
    framing.avoid = [
      'Digital transformation (too long)',
      'Best-in-class security (not CFO language)',
      'Compliance as a checkbox (diminishes value)',
      'Long implementation timelines'
    ];

    // Opening angle
    if (predictions.champion.identified) {
      framing.openingAngle = predictions.champion.cameFromMatureCompany
        ? `"Coming from ${predictions.champion.previousCompany}, you've seen what good looks like. How are you finding the gap here?"`
        : `"As the new ${predictions.champion.title}, what's your biggest priority in the first 90 days?"`;
    }

    return framing;
  }

  /**
   * Get framing format based on mandate
   */
  getFramingFormat(mandate) {
    const formats = {
      'cost_compliance': 'ROI_calculation',
      'technical': 'integration_demo',
      'strategic': 'business_case',
      'operational': 'process_improvement',
      'risk_legal': 'risk_reduction'
    };
    return formats[mandate] || 'value_proposition';
  }

  /**
   * Predict objections based on decision dynamics
   */
  predictObjections(tensionAnalysis, predictions) {
    const objections = [];
    const reportingTension = tensionAnalysis.tensions.reporting;
    const primaryReporting = reportingTension.reportingLines?.[0];

    // Budget authority objection
    if (primaryReporting?.objectionLikely) {
      objections.push({
        source: primaryReporting.reportsTo,
        objection: primaryReporting.objectionLikely,
        response: this.generateObjectionResponse(primaryReporting.reportsTo, primaryReporting.objectionLikely)
      });
    }

    // Common objections based on tension profile
    if (tensionAnalysis.tensions.ratio.score < 50) {
      objections.push({
        source: 'Internal',
        objection: 'We\'re doing fine with our current approach',
        response: 'Quantify the hidden cost of manual processes and scaling risk'
      });
    }

    if (!predictions.champion.identified) {
      objections.push({
        source: 'Organizational',
        objection: 'Who would own this?',
        response: 'Help them identify the natural owner or offer to connect with similar companies'
      });
    }

    // Build vs. buy objection (common in tech companies)
    objections.push({
      source: 'Technical',
      objection: 'Can\'t we build this ourselves?',
      response: 'Calculate eng time cost vs. tool cost. "Your engineers cost $200/hr - is compliance their best use?"'
    });

    return objections;
  }

  /**
   * Generate objection response
   */
  generateObjectionResponse(stakeholder, objection) {
    const responses = {
      'CEO': {
        default: 'Frame as competitive advantage and board-level metric'
      },
      'CFO': {
        'What\'s the payback period?': '3-6 months through reduced manual work (X FTE hours saved)',
        'Can we defer this?': 'Calculate cost of delay: each month without SOC 2 = Y enterprise deals at risk',
        default: 'ROI calculation with hard numbers and timeline'
      },
      'CTO': {
        'Can we build this ourselves?': 'Engineering time calculation - your team\'s time is better spent on product',
        'Does it integrate well?': 'Reference specific integrations relevant to their stack',
        default: 'Technical demo with integration focus'
      }
    };

    return responses[stakeholder]?.[objection] ||
           responses[stakeholder]?.default ||
           'Address with specific value proposition';
  }

  /**
   * Generate timing recommendation
   */
  generateTimingRecommendation(tensionAnalysis, predictions) {
    const recommendation = {
      urgency: 'standard',
      daysToAct: 30,
      rationale: [],
      bestApproach: null
    };

    // Check action windows
    if (predictions.actionWindow.primaryWindow) {
      const window = predictions.actionWindow.primaryWindow;

      if (window.urgency === 'critical') {
        recommendation.urgency = 'critical';
        recommendation.daysToAct = Math.min(14, window.daysRemaining || 14);
        recommendation.rationale.push(`${window.description} - act immediately`);
      } else if (window.urgency === 'high') {
        recommendation.urgency = 'high';
        recommendation.daysToAct = Math.min(30, window.daysRemaining || 30);
        recommendation.rationale.push(window.description);
      }
    }

    // Buying probability influences approach
    if (predictions.buyingProbability >= 0.6) {
      recommendation.bestApproach = 'direct_outreach';
      recommendation.rationale.push('High buying probability - direct approach warranted');
    } else if (predictions.buyingProbability >= 0.4) {
      recommendation.bestApproach = 'warm_introduction';
      recommendation.rationale.push('Moderate probability - warm intro preferred');
    } else {
      recommendation.bestApproach = 'nurture';
      recommendation.rationale.push('Lower probability - nurture and monitor for trigger events');
    }

    return recommendation;
  }
}

module.exports = { BehavioralPhysicsEngine };
