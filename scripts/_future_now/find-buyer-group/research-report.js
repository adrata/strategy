/**
 * Research Report Module
 * 
 * Generates defensible justification for buyer group selections
 * Creates comprehensive report explaining every decision
 */

const { formatCurrency, formatPercentage, createUniqueId } = require('./utils');

class ResearchReport {
  constructor() {
    this.reportId = createUniqueId('report');
  }

  /**
   * Generate comprehensive research report
   * @param {object} context - Context data for report generation
   * @returns {object} Complete research report
   */
  generate(context) {
    console.log('📝 Generating comprehensive research report...');
    
    const {
      intelligence,
      previewEmployees,
      buyerGroup = [],
      coverage,
      cohesion,
      costs,
      dealSize,
      companyName,
      searchParameters
    } = context;
    
    const report = {
      id: this.reportId,
      generatedAt: new Date().toISOString(),
      executiveSummary: this.generateExecutiveSummary(context),
      researchMethodology: this.documentMethodology(context),
      companyIntelligence: this.documentCompanyIntelligence(intelligence),
      buyerGroupJustification: this.justifyEachMember(buyerGroup || []),
      crossFunctionalCoverage: this.documentCoverage(coverage),
      cohesionAnalysis: this.documentCohesion(cohesion),
      championAnalysis: this.documentChampions(buyerGroup || []),
      costEfficiency: this.documentCostSavings(costs, previewEmployees.length, buyerGroup),
      qualityMetrics: this.calculateQualityMetrics(buyerGroup || []),
      recommendations: this.generateRecommendations(context)
    };
    
    console.log('✅ Research report generated successfully');
    
    return report;
  }

  /**
   * Generate executive summary
   * @param {object} context - Context data
   * @returns {string} Executive summary
   */
  generateExecutiveSummary(context) {
    const { buyerGroup = [], companyName, dealSize, cohesion } = context;
    
    return `Identified ${buyerGroup.length}-person buyer group for ${companyName} ` +
           `($${dealSize.toLocaleString()} deal) with ${cohesion.score}% cohesion score. ` +
           `Group includes ${this.countRole(buyerGroup, 'decision')} decision maker(s), ` +
           `${this.countRole(buyerGroup, 'champion')} champion(s), and comprehensive ` +
           `cross-functional coverage. Research methodology validated ${buyerGroup.length} ` +
           `final members from ${context.previewEmployees.length} initial candidates.`;
  }

  /**
   * Document research methodology
   * @param {object} context - Context data
   * @returns {object} Methodology documentation
   */
  documentMethodology(context) {
    const { previewEmployees, searchParameters } = context;
    
    return {
      approach: 'Double-waterfall discovery with multi-dimensional scoring',
      stages: [
        {
          stage: 1,
          name: 'Company Intelligence',
          description: 'Database-first company research with Coresignal API fallback',
          result: 'Optimal search parameters calculated'
        },
        {
          stage: 2,
          name: 'Wide Preview Search',
          description: 'Cross-departmental employee discovery using Coresignal Preview API',
          result: `${previewEmployees.length} employees discovered across all functions`
        },
        {
          stage: 3,
          name: 'Smart Scoring',
          description: 'Multi-dimensional scoring: seniority, influence, champion potential, cross-functional ability',
          result: 'Top candidates identified before expensive collect API'
        },
        {
          stage: 4,
          name: 'Role Assignment',
          description: 'Deal-size-aware role assignment ensuring Decision Maker + Champion',
          result: 'Appropriate roles assigned based on deal size'
        },
        {
          stage: 5,
          name: 'Cross-Functional Validation',
          description: 'Stakeholder completeness validation across all relevant functions',
          result: 'Missing stakeholders added for comprehensive coverage'
        },
        {
          stage: 6,
          name: 'Full Profile Collection',
          description: 'Coresignal Collect API for final buyer group members only',
          result: 'Complete profiles for final buyer group'
        },
        {
          stage: 7,
          name: 'Cohesion Analysis',
          description: 'Multi-factor cohesion validation',
          result: `${context.cohesion.score}% cohesion score with detailed analysis`
        }
      ],
      searchParameters: searchParameters,
      dataSources: ['Coresignal API', 'Internal Database', 'AI Analysis'],
      confidenceLevel: this.calculateOverallConfidence(context)
    };
  }

  /**
   * Document company intelligence findings
   * @param {object} intelligence - Company intelligence data
   * @returns {object} Intelligence documentation
   */
  documentCompanyIntelligence(intelligence) {
    return {
      employeeCount: intelligence.employeeCount,
      revenue: intelligence.revenue,
      industry: intelligence.industry,
      growthRate: intelligence.growthRate,
      activeHiring: intelligence.activeHiring,
      fundingStage: intelligence.fundingStage,
      dataSource: intelligence.dataSource,
      lastUpdated: intelligence.lastUpdated,
      insights: [
        `Company size: ${this.getCompanySizeCategory(intelligence.employeeCount)}`,
        `Growth trajectory: ${intelligence.growthRate > 0 ? 'Growing' : 'Stable'}`,
        `Hiring activity: ${intelligence.activeHiring > 0 ? 'Active' : 'Limited'}`,
        `Funding status: ${intelligence.fundingStage}`
      ]
    };
  }

  /**
   * Justify each buyer group member selection
   * @param {Array} buyerGroup - Buyer group members
   * @returns {Array} Member justifications
   */
  justifyEachMember(buyerGroup) {
    return buyerGroup.map(member => ({
      name: member.name,
      title: member.title,
      department: member.department,
      role: member.buyerGroupRole,
      confidence: `${member.roleConfidence || 0}%`,
      detailedReasoning: member.roleReasoning || 'Standard stakeholder',
      keyInsights: [
        `Seniority score: ${member.scores?.seniority || 0}/10`,
        `Champion potential: ${member.scores?.championPotential || 0}/25`,
        `Influence score: ${member.scores?.influence || 0}/10`,
        `Network: ${member.connectionsCount || 0} connections`,
        `Relevance: ${Math.round((member.relevance || 0) * 100)}%`
      ],
      addedForCoverage: member.addedForCoverage || false,
      justification: this.generateDetailedJustification(member)
    }));
  }

  /**
   * Explain why a member was selected
   * @param {object} member - Member data
   * @returns {string} Selection explanation
   */
  explainSelection(member) {
    const reasons = [];
    
    if (member.scores?.seniority > 8) {
      reasons.push('Appropriate seniority for deal size');
    }
    
    if (member.scores?.championPotential > 15) {
      reasons.push('Strong internal advocacy potential');
    }
    
    if (member.scores?.influence > 7) {
      reasons.push('Significant organizational influence');
    }
    
    if (member.scores?.crossFunctional > 6) {
      reasons.push('Cross-functional collaboration ability');
    }
    
    if (member.addedForCoverage) {
      reasons.push('Added for cross-functional coverage');
    }
    
    if (member.buyerGroupRole === 'decision') {
      reasons.push('Appropriate decision-making authority');
    }
    
    if (member.buyerGroupRole === 'champion') {
      reasons.push('Ideal champion level (can advocate, operational focus)');
    }
    
    return reasons.join('; ') || 'General stakeholder value';
  }

  /**
   * Document cross-functional coverage
   * @param {object} coverage - Coverage analysis
   * @returns {object} Coverage documentation
   */
  documentCoverage(coverage) {
    return {
      summary: {
        primaryCovered: coverage.primary,
        technicalCovered: coverage.technical,
        riskCovered: coverage.risk,
        financialCovered: coverage.financial,
        overallScore: this.calculateCoverageScore(coverage)
      },
      byFunction: coverage.details,
      gaps: this.identifyCoverageGaps(coverage),
      recommendations: this.generateCoverageRecommendations(coverage)
    };
  }

  /**
   * Document cohesion analysis
   * @param {object} cohesion - Cohesion analysis
   * @returns {object} Cohesion documentation
   */
  documentCohesion(cohesion) {
    return {
      overallScore: cohesion.score,
      confidence: cohesion.confidence,
      factors: {
        reportingProximity: {
          score: cohesion.factors.reportingProximity,
          explanation: 'Executive reporting relationships'
        },
        departmentClustering: {
          score: cohesion.factors.departmentClustering,
          explanation: 'Department collaboration patterns'
        },
        seniorityBalance: {
          score: cohesion.factors.seniorityBalance,
          explanation: 'Appropriate seniority distribution'
        },
        geographicAlignment: {
          score: cohesion.factors.geographicAlignment,
          explanation: 'Location-based collaboration'
        },
        functionalInterdependence: {
          score: cohesion.factors.functionalInterdependence,
          explanation: 'Cross-functional work relationships'
        }
      },
      reasoning: cohesion.reasoning,
      recommendations: cohesion.recommendations
    };
  }

  /**
   * Document champion analysis
   * @param {Array} buyerGroup - Buyer group members
   * @returns {object} Champion analysis
   */
  documentChampions(buyerGroup) {
    const champions = buyerGroup.filter(m => m.buyerGroupRole === 'champion');
    
    return {
      count: champions.length,
      champions: champions.map(champion => ({
        name: champion.name,
        title: champion.title,
        department: champion.department,
        championScore: champion.scores?.championPotential || 0,
        advocacyPotential: this.assessAdvocacyPotential(champion),
        internalInfluence: this.assessInternalInfluence(champion),
        networkStrength: champion.connectionsCount || 0
      })),
      analysis: this.generateChampionAnalysis(champions)
    };
  }

  /**
   * Document cost efficiency
   * @param {object} costs - Cost data
   * @param {number} totalPreviews - Total previews searched
   * @param {Array} buyerGroup - Buyer group members
   * @returns {object} Cost efficiency documentation
   */
  documentCostSavings(costs, totalPreviews, buyerGroup = []) {
    const naiveCost = totalPreviews * 1; // $1 per collect
    const actualCost = costs.total || 0;
    const savings = naiveCost - actualCost;
    const savingsPercentage = naiveCost > 0 ? (savings / naiveCost) * 100 : 0;
    
    return {
      methodology: 'Double-waterfall approach (preview then collect)',
      costs: {
        preview: costs.preview || 0,
        collect: costs.collect || 0,
        total: actualCost
      },
      comparison: {
        naiveApproach: naiveCost,
        smartApproach: actualCost,
        savings: savings,
        savingsPercentage: Math.round(savingsPercentage)
      },
      efficiency: {
        previewToCollectRatio: totalPreviews > 0 ? Math.round((costs.collect || 0) / totalPreviews * 100) : 0,
        costPerFinalMember: buyerGroup.length > 0 ? Math.round(actualCost / buyerGroup.length * 100) / 100 : 0
      }
    };
  }

  /**
   * Calculate quality metrics
   * @param {Array} buyerGroup - Buyer group members
   * @returns {object} Quality metrics
   */
  calculateQualityMetrics(buyerGroup) {
    const avgConfidence = buyerGroup.reduce((sum, m) => sum + (m.roleConfidence || 0), 0) / buyerGroup.length;
    const avgInfluence = buyerGroup.reduce((sum, m) => sum + (m.scores?.influence || 0), 0) / buyerGroup.length;
    const avgRelevance = buyerGroup.reduce((sum, m) => sum + (m.relevance || 0), 0) / buyerGroup.length;
    
    return {
      averageConfidence: Math.round(avgConfidence),
      averageInfluence: Math.round(avgInfluence * 10) / 10,
      averageRelevance: Math.round(avgRelevance * 100),
      decisionMakerCount: this.countRole(buyerGroup, 'decision'),
      championCount: this.countRole(buyerGroup, 'champion'),
      stakeholderCount: this.countRole(buyerGroup, 'stakeholder'),
      blockerCount: this.countRole(buyerGroup, 'blocker'),
      introducerCount: this.countRole(buyerGroup, 'introducer'),
      qualityGrade: this.calculateQualityGrade(avgConfidence, avgInfluence, avgRelevance)
    };
  }

  /**
   * Generate recommendations
   * @param {object} context - Context data
   * @returns {Array} Recommendations
   */
  generateRecommendations(context) {
    const recommendations = [];
    const { cohesion, coverage, buyerGroup = [] } = context;
    
    if (cohesion.score < 70) {
      recommendations.push('Consider improving buyer group cohesion through better stakeholder selection');
    }
    
    if (!coverage.primary) {
      recommendations.push('Ensure primary business functions are represented');
    }
    
    if (this.countRole(buyerGroup, 'decision') === 0) {
      recommendations.push('Critical: Add appropriate decision maker for deal size');
    }
    
    if (this.countRole(buyerGroup, 'champion') === 0) {
      recommendations.push('Critical: Add internal champion for advocacy');
    }
    
    if (buyerGroup.length < 5) {
      recommendations.push('Consider adding more stakeholders for comprehensive coverage');
    }
    
    return recommendations;
  }

  // Helper methods
  countRole(buyerGroup, role) {
    return buyerGroup.filter(m => m.buyerGroupRole === role).length;
  }

  getCompanySizeCategory(employeeCount) {
    if (employeeCount <= 50) return 'Small';
    if (employeeCount <= 500) return 'Medium';
    if (employeeCount <= 5000) return 'Large';
    return 'Enterprise';
  }

  calculateCoverageScore(coverage) {
    const categories = ['primary', 'technical', 'risk', 'financial'];
    const covered = categories.filter(cat => coverage[cat]).length;
    return Math.round((covered / categories.length) * 100);
  }

  identifyCoverageGaps(coverage) {
    const gaps = [];
    if (!coverage.primary) gaps.push('Primary business functions');
    if (!coverage.technical) gaps.push('Technical implementation');
    if (!coverage.risk) gaps.push('Risk management');
    if (!coverage.financial) gaps.push('Financial approval');
    return gaps;
  }

  generateCoverageRecommendations(coverage) {
    const recommendations = [];
    if (!coverage.technical) recommendations.push('Add IT stakeholder for technical implementation');
    if (!coverage.risk) recommendations.push('Add Security/Legal stakeholder for risk management');
    if (!coverage.financial) recommendations.push('Add Finance stakeholder for budget approval');
    return recommendations;
  }

  assessAdvocacyPotential(champion) {
    const score = champion.scores?.championPotential || 0;
    if (score > 20) return 'High';
    if (score > 15) return 'Medium';
    return 'Low';
  }

  assessInternalInfluence(champion) {
    const connections = champion.connectionsCount || 0;
    if (connections > 500) return 'High';
    if (connections > 200) return 'Medium';
    return 'Low';
  }

  generateChampionAnalysis(champions) {
    if (champions.length === 0) {
      return 'No champions identified - consider adding internal advocates';
    }
    
    const avgScore = champions.reduce((sum, c) => sum + (c.scores?.championPotential || 0), 0) / champions.length;
    
    if (avgScore > 20) {
      return 'Strong champion potential with excellent advocacy capabilities';
    } else if (avgScore > 15) {
      return 'Good champion potential with solid advocacy capabilities';
    } else {
      return 'Moderate champion potential - consider additional advocates';
    }
  }

  calculateQualityGrade(avgConfidence, avgInfluence, avgRelevance) {
    const score = (avgConfidence + avgInfluence * 10 + avgRelevance * 100) / 3;
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    return 'D';
  }

  calculateOverallConfidence(context) {
    const { buyerGroup = [], cohesion } = context;
    const avgMemberConfidence = buyerGroup.reduce((sum, m) => sum + (m.roleConfidence || 0), 0) / buyerGroup.length;
    return Math.round((avgMemberConfidence + cohesion.score) / 2);
  }

  /**
   * Generate detailed justification for buyer group member
   * @param {object} member - Member data
   * @param {object} context - Additional context
   * @returns {string} Detailed justification
   */
  generateDetailedJustification(member, context = {}) {
    const { dealSize = 0, companyTier = 'S3', productCategory = 'sales' } = context;
    const titleLower = member.title?.toLowerCase() || '';
    const deptLower = member.department?.toLowerCase() || '';
    const role = member.buyerGroupRole;
    
    let justification = `**${member.name} (${member.title}) - ${role.replace('_', ' ').toUpperCase()}**\n\n`;
    
    // Role-specific justification
    switch (role) {
      case 'decision':
        justification += `**Budget Authority**: `;
        if (titleLower.includes('ceo') || titleLower.includes('president')) {
          justification += `Ultimate decision maker with complete budget control.\n`;
        } else if (titleLower.includes('cfo')) {
          justification += `Controls financial approvals and budget allocation for technology investments.\n`;
        } else if (titleLower.includes('cto')) {
          justification += `Owns technology strategy and budget for software/platform purchases.\n`;
        } else if (titleLower.includes('vp')) {
          justification += `VP-level executives at ${companyTier} companies typically control $${dealSize.toLocaleString()}+ purchases.\n`;
        } else if (titleLower.includes('director')) {
          justification += `Director-level has budget authority for deals of this size at ${companyTier} companies.\n`;
        }
        
        justification += `**Department Relevance**: `;
        if (deptLower.includes('marketing')) {
          justification += `Marketing leaders often own CRM and sales enablement tool budgets.\n`;
        } else if (deptLower.includes('sales')) {
          justification += `Sales leadership controls revenue-generating technology investments.\n`;
        } else if (deptLower.includes('it') || deptLower.includes('technology')) {
          justification += `IT/Technology leaders approve all software and platform purchases.\n`;
        }
        break;
        
      case 'champion':
        justification += `**Operational Leadership**: `;
        if (titleLower.includes('director')) {
          justification += `Director-level operational leaders drive adoption and change management.\n`;
        } else if (titleLower.includes('manager')) {
          justification += `Manager-level leaders implement solutions and influence team adoption.\n`;
        }
        
        justification += `**Advocacy Potential**: `;
        if (deptLower.includes('sales')) {
          justification += `Sales leaders are natural champions for revenue-generating tools.\n`;
        } else if (deptLower.includes('marketing')) {
          justification += `Marketing leaders champion tools that improve lead generation and conversion.\n`;
        }
        break;
        
      case 'blocker':
        justification += `**Gatekeeper Function**: `;
        if (deptLower.includes('legal')) {
          justification += `Legal department reviews contracts and compliance requirements.\n`;
        } else if (deptLower.includes('security')) {
          justification += `Security team evaluates data protection and access controls.\n`;
        } else if (deptLower.includes('procurement')) {
          justification += `Procurement controls vendor selection and contract negotiations.\n`;
        } else if (deptLower.includes('finance')) {
          justification += `Finance department manages budget approval and cost controls.\n`;
        }
        
        justification += `**Risk Management**: Important to engage early to understand requirements and address concerns.\n`;
        break;
        
      case 'introducer':
        justification += `**Relationship Building**: `;
        if (deptLower.includes('sales')) {
          justification += `Sales professionals have strong internal networks and relationship skills.\n`;
        } else if (deptLower.includes('customer success')) {
          justification += `Customer success teams understand user needs and adoption patterns.\n`;
        }
        
        justification += `**Network Influence**: `;
        if (member.connectionsCount > 200) {
          justification += `Strong network (${member.connectionsCount}+ connections) enables internal introductions.\n`;
        }
        break;
        
      case 'stakeholder':
        justification += `**Project Impact**: `;
        if (deptLower.includes('hr')) {
          justification += `HR stakeholders influence user adoption and change management.\n`;
        } else if (deptLower.includes('product')) {
          justification += `Product teams provide input on feature requirements and user experience.\n`;
        } else if (deptLower.includes('analytics')) {
          justification += `Analytics teams measure success metrics and ROI validation.\n`;
        }
        
        justification += `**Influence Potential**: `;
        if (member.scores?.influence > 6) {
          justification += `High influence score indicates cross-functional impact potential.\n`;
        }
        break;
    }
    
    // Add scoring details
    justification += `\n**Selection Criteria**:\n`;
    justification += `- Seniority Score: ${member.scores?.seniority || 0}/10\n`;
    justification += `- Influence Score: ${member.scores?.influence || 0}/10\n`;
    justification += `- Network Size: ${member.connectionsCount || 0} connections\n`;
    justification += `- Role Confidence: ${member.roleConfidence || 0}%\n`;
    
    return justification;
  }
}

module.exports = { ResearchReport };
