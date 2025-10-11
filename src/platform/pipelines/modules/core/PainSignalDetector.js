/**
 * PAIN SIGNAL DETECTOR
 * 
 * Detects pain indicators from company and buyer group analysis
 * 
 * Pain Types:
 * - hiring_spike: Rapid hiring indicates growing pains
 * - executive_turnover: New leadership indicates change appetite
 * - dept_restructure: Reorganization indicates process pain
 * - glassdoor_negative: Employee complaints indicate internal issues
 * - competitive_pressure: Market share loss indicates urgency
 * - compliance_deadline: Regulatory pressure indicates must-solve
 * - manual_processes: Manual work mentions indicate automation opportunity
 * - tool_sprawl: Too many tools indicate consolidation need
 */

class PainSignalDetector {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Detect all pain signals for a company
   */
  async detectPainSignals(companyData, buyerGroup = null, additionalData = {}) {
    console.log(`💥 [PAIN] Detecting pain signals for: ${companyData.name}`);

    const painIndicators = [];

    // Hiring spike detection
    const hiringPain = await this.detectHiringSpike(companyData);
    if (hiringPain) painIndicators.push(hiringPain);

    // Executive turnover
    const turnoverPain = await this.detectExecutiveTurnover(companyData, buyerGroup);
    if (turnoverPain) painIndicators.push(turnoverPain);

    // Department restructuring
    const restructurePain = await this.detectRestructuring(companyData, additionalData);
    if (restructurePain) painIndicators.push(restructurePain);

    // Glassdoor sentiment
    const glassdoorPain = await this.detectGlassdoorIssues(companyData);
    if (glassdoorPain) painIndicators.push(glassdoorPain);

    // Competitive pressure
    const competitivePain = await this.detectCompetitivePressure(companyData);
    if (competitivePain) painIndicators.push(competitivePain);

    // Compliance deadlines
    const compliancePain = await this.detectCompliancePressure(companyData);
    if (compliancePain) painIndicators.push(compliancePain);

    // Manual process indicators
    const manualPain = await this.detectManualProcesses(companyData, buyerGroup);
    if (manualPain) painIndicators.push(manualPain);

    // Tool sprawl
    const toolPain = await this.detectToolSprawl(companyData);
    if (toolPain) painIndicators.push(toolPain);

    // Calculate overall pain score
    const painScore = this.calculatePainScore(painIndicators);

    return {
      painIndicators,
      painScore, // 0-100
      painLevel: this.classifyPainLevel(painScore),
      urgencyScore: this.calculateUrgency(painIndicators)
    };
  }

  /**
   * Detect hiring spike (growing pains)
   */
  async detectHiringSpike(companyData) {
    const recentHires = companyData.recentHires || 0;
    const employeeCount = companyData.employeeCount || 100;
    const hiringRate = recentHires / employeeCount;

    // Hiring > 10% of workforce in last quarter = growing pains
    if (hiringRate > 0.10) {
      return {
        type: 'hiring_spike',
        severity: hiringRate > 0.20 ? 'high' : 'medium',
        evidence: `Hired ${recentHires} people (${(hiringRate * 100).toFixed(1)}% of workforce) in recent quarter`,
        score: Math.min(30, hiringRate * 200), // Up to 30 points
        implications: [
          'Onboarding challenges',
          'Process scaling needs',
          'Tool/infrastructure strain',
          'Training bottlenecks'
        ]
      };
    }

    return null;
  }

  /**
   * Detect executive turnover
   */
  async detectExecutiveTurnover(companyData, buyerGroup) {
    const recentExecutiveChanges = [];

    // Check buyer group for recent hires
    if (buyerGroup && buyerGroup.members) {
      buyerGroup.members.forEach(member => {
        if (member.tenure && member.tenure < 6 && member.level === 'executive') {
          recentExecutiveChanges.push({
            name: member.name,
            title: member.title,
            tenure: member.tenure
          });
        }
      });
    }

    // Check company data
    if (companyData.recentExecutiveHires) {
      recentExecutiveChanges.push(...companyData.recentExecutiveHires);
    }

    if (recentExecutiveChanges.length > 0) {
      return {
        type: 'executive_turnover',
        severity: recentExecutiveChanges.length >= 3 ? 'high' : 'medium',
        evidence: `${recentExecutiveChanges.length} new executive(s) in last 6 months: ${recentExecutiveChanges.map(e => e.title).join(', ')}`,
        score: Math.min(25, recentExecutiveChanges.length * 10),
        implications: [
          'New leadership wants to make changes',
          'Higher appetite for new solutions',
          'Fresh perspective on problems',
          'Budget reallocation likely'
        ]
      };
    }

    return null;
  }

  /**
   * Detect department restructuring
   */
  async detectRestructuring(companyData, additionalData) {
    const restructureSignals = [];

    if (companyData.recentReorg) {
      restructureSignals.push('Company announced reorganization');
    }

    if (additionalData.linkedInPosts) {
      const reorgMentions = additionalData.linkedInPosts.filter(post =>
        post.content.toLowerCase().includes('restructur') ||
        post.content.toLowerCase().includes('reorganiz') ||
        post.content.toLowerCase().includes('new team structure')
      );
      if (reorgMentions.length > 0) {
        restructureSignals.push(`${reorgMentions.length} LinkedIn posts mention restructuring`);
      }
    }

    if (restructureSignals.length > 0) {
      return {
        type: 'dept_restructure',
        severity: 'high',
        evidence: restructureSignals.join('; '),
        score: 20,
        implications: [
          'Process changes underway',
          'Efficiency focus',
          'Tool/workflow reevaluation',
          'Budget for new solutions'
        ]
      };
    }

    return null;
  }

  /**
   * Detect Glassdoor sentiment issues
   */
  async detectGlassdoorIssues(companyData) {
    if (!companyData.glassdoorRating) return null;

    const rating = companyData.glassdoorRating;
    const reviewCount = companyData.glassdoorReviewCount || 0;

    // Low rating with enough reviews = internal issues
    if (rating < 3.0 && reviewCount > 20) {
      const commonComplaints = companyData.glassdoorCommonComplaints || [];

      return {
        type: 'glassdoor_negative',
        severity: rating < 2.5 ? 'high' : 'medium',
        evidence: `Glassdoor rating ${rating}/5.0 with ${reviewCount} reviews. Common complaints: ${commonComplaints.join(', ')}`,
        score: (3.0 - rating) * 10, // Up to 20 points
        implications: [
          'Employee morale issues',
          'Internal process problems',
          'Tool/system frustrations',
          'Retention challenges'
        ]
      };
    }

    return null;
  }

  /**
   * Detect competitive pressure
   */
  async detectCompetitivePressure(companyData) {
    const pressureSignals = [];

    if (companyData.marketShareDeclining) {
      pressureSignals.push('Declining market share');
    }

    if (companyData.newCompetitorsEntering) {
      pressureSignals.push('New competitors entering market');
    }

    if (companyData.pricingPressure) {
      pressureSignals.push('Pricing pressure from competitors');
    }

    if (pressureSignals.length > 0) {
      return {
        type: 'competitive_pressure',
        severity: 'high',
        evidence: pressureSignals.join('; '),
        score: 25,
        implications: [
          'Urgency to improve efficiency',
          'Need to differentiate',
          'Cost optimization focus',
          'Innovation imperative'
        ]
      };
    }

    return null;
  }

  /**
   * Detect compliance/regulatory pressure
   */
  async detectCompliancePressure(companyData) {
    const complianceSignals = [];

    if (companyData.upcomingComplianceDeadlines) {
      complianceSignals.push(`Compliance deadlines: ${companyData.upcomingComplianceDeadlines.join(', ')}`);
    }

    if (companyData.recentAuditFindings) {
      complianceSignals.push('Recent audit findings requiring remediation');
    }

    if (companyData.regulatoryChanges) {
      complianceSignals.push('New regulatory requirements');
    }

    if (complianceSignals.length > 0) {
      return {
        type: 'compliance_deadline',
        severity: 'high',
        evidence: complianceSignals.join('; '),
        score: 30,
        implications: [
          'Must-solve problem (deadline-driven)',
          'Budget allocated for compliance',
          'Executive attention secured',
          'High purchase urgency'
        ]
      };
    }

    return null;
  }

  /**
   * Detect manual process indicators
   */
  async detectManualProcesses(companyData, buyerGroup) {
    const manualSignals = [];

    // Check LinkedIn posts from buyer group
    if (buyerGroup && buyerGroup.members) {
      buyerGroup.members.forEach(member => {
        if (member.linkedInPosts) {
          const manualMentions = member.linkedInPosts.filter(post =>
            post.content.toLowerCase().includes('manual') ||
            post.content.toLowerCase().includes('automat') ||
            post.content.toLowerCase().includes('spreadsheet') ||
            post.content.toLowerCase().includes('too much time')
          );
          if (manualMentions.length > 0) {
            manualSignals.push(`${member.name} posted about manual processes`);
          }
        }
      });
    }

    // Check company data
    if (companyData.manualProcessIndicators) {
      manualSignals.push(...companyData.manualProcessIndicators);
    }

    if (manualSignals.length > 0) {
      return {
        type: 'manual_processes',
        severity: manualSignals.length >= 3 ? 'high' : 'medium',
        evidence: manualSignals.join('; '),
        score: Math.min(25, manualSignals.length * 8),
        implications: [
          'Automation opportunity',
          'Efficiency pain point',
          'Team frustrated with current process',
          'Clear ROI for solution'
        ]
      };
    }

    return null;
  }

  /**
   * Detect tool sprawl
   */
  async detectToolSprawl(companyData) {
    const toolCount = companyData.toolsUsed?.length || 0;

    // More than 15 different tools = potential consolidation opportunity
    if (toolCount > 15) {
      return {
        type: 'tool_sprawl',
        severity: toolCount > 25 ? 'high' : 'medium',
        evidence: `Using ${toolCount} different tools/platforms`,
        score: Math.min(20, (toolCount - 15) * 2),
        implications: [
          'Integration challenges',
          'Data silos',
          'User training overhead',
          'License cost bloat',
          'Consolidation opportunity'
        ]
      };
    }

    return null;
  }

  /**
   * Calculate overall pain score
   */
  calculatePainScore(painIndicators) {
    const totalScore = painIndicators.reduce((sum, pain) => sum + pain.score, 0);
    return Math.min(100, totalScore);
  }

  /**
   * Classify pain level
   */
  classifyPainLevel(painScore) {
    if (painScore >= 70) return 'critical';
    if (painScore >= 50) return 'high';
    if (painScore >= 30) return 'medium';
    if (painScore >= 10) return 'low';
    return 'minimal';
  }

  /**
   * Calculate urgency score
   */
  calculateUrgency(painIndicators) {
    // Certain pain types are more urgent
    const urgentTypes = ['compliance_deadline', 'competitive_pressure', 'executive_turnover'];
    const hasUrgentPain = painIndicators.some(p => urgentTypes.includes(p.type));

    if (hasUrgentPain) return 0.9;
    if (painIndicators.length >= 4) return 0.8;
    if (painIndicators.length >= 3) return 0.7;
    if (painIndicators.length >= 2) return 0.6;
    return 0.5;
  }
}

module.exports = { PainSignalDetector };

