/**
 * Intelligence Triangulation Service
 * 
 * This service triangulates comprehensive prospect intelligence from:
 * - Role (CTO, CMO, CFO, VP Sales, etc.)
 * - Tenure (how long in role/company)
 * - Industry (tech, healthcare, finance, etc.)
 * - Company (size, stage, culture)
 * - College/Education background
 * - Location/Geography
 * - Company technology stack
 * - Recent company news/events
 * 
 * The goal: Know prospects better than anyone by triangulating
 * their wants, needs, goals, and decision-making patterns.
 */

export interface RoleBasedIntelligence {
  // Role-specific priorities and concerns
  priorities: string[];
  painPoints: string[];
  wants: string[];
  needs: string[];
  goals: string[];
  
  // Decision-making patterns
  decisionFactors: string[];
  budgetAuthority: string;
  influenceLevel: string;
  decisionTimeline: string;
  
  // Communication and leadership style
  communicationStyle: string;
  decisionMakingStyle: string;
  riskTolerance: string;
  innovationAdoption: string;
  leadershipStyle: string;
}

export interface IndustryIntelligence {
  // Industry-specific challenges and opportunities
  industryChallenges: string[];
  industryTrends: string[];
  regulatoryConcerns: string[];
  competitivePressures: string[];
  
  // Industry-specific decision patterns
  typicalDecisionTimeline: string;
  commonEvaluationCriteria: string[];
  budgetCycles: string[];
}

export interface CompanyIntelligence {
  // Company-specific context
  companyStage: string; // startup, growth, mature, enterprise
  companyCulture: string[];
  recentEvents: string[];
  strategicInitiatives: string[];
  
  // Company-specific decision patterns
  approvalProcess: string;
  typicalBudgetRange: string;
  decisionMakers: string[];
}

export interface EducationIntelligence {
  // Education-based insights
  almaMater: string;
  degreeType: string;
  graduationYear: string;
  networkConnections: string[];
  typicalCareerPath: string[];
}

export class IntelligenceTriangulationService {
  
  // Role-based intelligence patterns (2025 data)
  private static roleIntelligence: Record<string, RoleBasedIntelligence> = {
    'CTO': {
      priorities: ['Security', 'Scalability', 'Innovation', 'Cost Optimization', 'Team Productivity'],
      painPoints: ['Legacy System Integration', 'Security Vulnerabilities', 'Technical Debt', 'Talent Shortage', 'Budget Constraints'],
      wants: ['Modern Tech Stack', 'Automated Security', 'Cloud-Native Solutions', 'AI/ML Capabilities', 'Developer Experience'],
      needs: ['Robust Security', 'Scalable Architecture', 'Reliable Infrastructure', 'Team Efficiency', 'Cost Control'],
      goals: ['Digital Transformation', 'Security Excellence', 'Innovation Leadership', 'Operational Efficiency', 'Team Growth'],
      decisionFactors: ['Technical Merit', 'Security Posture', 'Scalability', 'Vendor Reputation', 'Implementation Complexity'],
      budgetAuthority: '$500K-$5M',
      influenceLevel: 'High',
      decisionTimeline: '3-6 months',
      communicationStyle: 'Technical',
      decisionMakingStyle: 'Data-Driven',
      riskTolerance: 'Medium',
      innovationAdoption: 'Early',
      leadershipStyle: 'Collaborative'
    },
    
    'CMO': {
      priorities: ['Growth', 'Brand Awareness', 'Customer Acquisition', 'Marketing ROI', 'Digital Transformation'],
      painPoints: ['Lead Quality', 'Attribution', 'Budget Efficiency', 'Team Coordination', 'Competitive Pressure'],
      wants: ['Predictable Growth', 'Better Attribution', 'Automated Campaigns', 'Customer Insights', 'Brand Recognition'],
      needs: ['Lead Generation', 'Marketing Analytics', 'Campaign Automation', 'Customer Data', 'Team Alignment'],
      goals: ['Revenue Growth', 'Market Leadership', 'Customer Acquisition', 'Brand Building', 'Team Excellence'],
      decisionFactors: ['ROI Potential', 'Ease of Use', 'Integration Capability', 'Vendor Support', 'Scalability'],
      budgetAuthority: '$100K-$2M',
      influenceLevel: 'High',
      decisionTimeline: '1-3 months',
      communicationStyle: 'Results-Focused',
      decisionMakingStyle: 'ROI-Driven',
      riskTolerance: 'High',
      innovationAdoption: 'Early',
      leadershipStyle: 'Results-Oriented'
    },
    
    'CFO': {
      priorities: ['Cost Control', 'Financial Planning', 'Compliance', 'Risk Management', 'Profitability'],
      painPoints: ['Budget Overruns', 'Financial Reporting', 'Compliance Issues', 'Cash Flow', 'Cost Visibility'],
      wants: ['Cost Savings', 'Financial Visibility', 'Automated Reporting', 'Risk Mitigation', 'Profit Growth'],
      needs: ['Financial Control', 'Compliance Tools', 'Reporting Automation', 'Cost Management', 'Risk Assessment'],
      goals: ['Cost Optimization', 'Financial Excellence', 'Compliance', 'Profitability', 'Strategic Planning'],
      decisionFactors: ['Cost-Benefit Analysis', 'ROI', 'Compliance', 'Risk Assessment', 'Vendor Stability'],
      budgetAuthority: '$50K-$1M',
      influenceLevel: 'High',
      decisionTimeline: '2-4 months',
      communicationStyle: 'Analytical',
      decisionMakingStyle: 'Risk-Averse',
      riskTolerance: 'Low',
      innovationAdoption: 'Late',
      leadershipStyle: 'Conservative'
    },
    
    'VP Sales': {
      priorities: ['Revenue Growth', 'Team Performance', 'Pipeline Management', 'Customer Success', 'Sales Efficiency'],
      painPoints: ['Pipeline Visibility', 'Forecasting Accuracy', 'Team Productivity', 'Customer Churn', 'Competitive Pressure'],
      wants: ['Predictable Revenue', 'Sales Automation', 'Better Forecasting', 'Team Success', 'Customer Retention'],
      needs: ['CRM Optimization', 'Sales Analytics', 'Pipeline Management', 'Team Training', 'Customer Insights'],
      goals: ['Revenue Targets', 'Team Excellence', 'Customer Success', 'Market Expansion', 'Sales Innovation'],
      decisionFactors: ['Revenue Impact', 'Ease of Use', 'Team Adoption', 'Customer Satisfaction', 'Competitive Advantage'],
      budgetAuthority: '$25K-$500K',
      influenceLevel: 'High',
      decisionTimeline: '1-2 months',
      communicationStyle: 'Direct',
      decisionMakingStyle: 'Results-Focused',
      riskTolerance: 'Medium',
      innovationAdoption: 'Medium',
      leadershipStyle: 'Motivational'
    },
    
    'Director of Engineering': {
      priorities: ['Code Quality', 'Team Productivity', 'Delivery Speed', 'Technical Excellence', 'Innovation'],
      painPoints: ['Technical Debt', 'Delivery Delays', 'Code Quality', 'Team Coordination', 'Resource Constraints'],
      wants: ['Faster Delivery', 'Better Code Quality', 'Team Efficiency', 'Technical Innovation', 'Process Improvement'],
      needs: ['Development Tools', 'Quality Assurance', 'Team Collaboration', 'Performance Monitoring', 'Technical Training'],
      goals: ['Technical Excellence', 'Team Growth', 'Delivery Excellence', 'Innovation', 'Process Optimization'],
      decisionFactors: ['Technical Merit', 'Team Impact', 'Implementation Speed', 'Learning Curve', 'Long-term Value'],
      budgetAuthority: '$10K-$200K',
      influenceLevel: 'Medium',
      decisionTimeline: '2-3 months',
      communicationStyle: 'Technical',
      decisionMakingStyle: 'Collaborative',
      riskTolerance: 'Medium',
      innovationAdoption: 'Early',
      leadershipStyle: 'Mentoring'
    }
  };

  // Industry-specific intelligence patterns
  private static industryIntelligence: Record<string, IndustryIntelligence> = {
    'Technology': {
      industryChallenges: ['Rapid Innovation', 'Talent Competition', 'Security Threats', 'Market Saturation'],
      industryTrends: ['AI/ML Adoption', 'Cloud Migration', 'Remote Work', 'Cybersecurity'],
      regulatoryConcerns: ['Data Privacy', 'Cybersecurity', 'AI Ethics', 'International Compliance'],
      competitivePressures: ['Innovation Speed', 'Talent Acquisition', 'Market Share', 'Customer Acquisition'],
      typicalDecisionTimeline: '1-3 months',
      commonEvaluationCriteria: ['Innovation', 'Scalability', 'Security', 'Integration', 'Vendor Stability'],
      budgetCycles: ['Quarterly', 'Annual']
    },
    
    'Healthcare': {
      industryChallenges: ['Regulatory Compliance', 'Data Security', 'Cost Pressure', 'Interoperability'],
      industryTrends: ['Digital Health', 'Telemedicine', 'AI Diagnostics', 'Patient Experience'],
      regulatoryConcerns: ['HIPAA', 'FDA Approval', 'Data Privacy', 'Quality Standards'],
      competitivePressures: ['Patient Outcomes', 'Cost Efficiency', 'Regulatory Compliance', 'Innovation'],
      typicalDecisionTimeline: '6-12 months',
      commonEvaluationCriteria: ['Compliance', 'Security', 'Patient Safety', 'ROI', 'Vendor Reputation'],
      budgetCycles: ['Annual', 'Multi-year']
    },
    
    'Financial Services': {
      industryChallenges: ['Regulatory Compliance', 'Cybersecurity', 'Digital Transformation', 'Customer Trust'],
      industryTrends: ['Fintech Integration', 'AI/ML', 'Blockchain', 'Digital Banking'],
      regulatoryConcerns: ['SOX', 'PCI DSS', 'GDPR', 'Anti-Money Laundering'],
      competitivePressures: ['Digital Innovation', 'Customer Experience', 'Cost Efficiency', 'Regulatory Compliance'],
      typicalDecisionTimeline: '3-6 months',
      commonEvaluationCriteria: ['Security', 'Compliance', 'Reliability', 'Scalability', 'Vendor Stability'],
      budgetCycles: ['Annual', 'Quarterly']
    },
    
    'Manufacturing': {
      industryChallenges: ['Supply Chain', 'Automation', 'Quality Control', 'Cost Management'],
      industryTrends: ['Industry 4.0', 'IoT', 'Predictive Maintenance', 'Sustainability'],
      regulatoryConcerns: ['Safety Standards', 'Environmental', 'Quality Control', 'Labor Regulations'],
      competitivePressures: ['Cost Efficiency', 'Quality', 'Delivery Speed', 'Innovation'],
      typicalDecisionTimeline: '3-9 months',
      commonEvaluationCriteria: ['ROI', 'Reliability', 'Integration', 'Support', 'Scalability'],
      budgetCycles: ['Annual', 'Capital Budget']
    }
  };

  // Company stage intelligence
  private static companyStageIntelligence: Record<string, CompanyIntelligence> = {
    'startup': {
      companyStage: 'startup',
      companyCulture: ['Fast-paced', 'Innovative', 'Resource-constrained', 'Growth-focused'],
      recentEvents: ['Funding rounds', 'Product launches', 'Team expansion', 'Market entry'],
      strategicInitiatives: ['Product-Market Fit', 'Growth', 'Funding', 'Talent Acquisition'],
      approvalProcess: 'Fast',
      typicalBudgetRange: '$10K-$100K',
      decisionMakers: ['CEO', 'CTO', 'Founders']
    },
    
    'growth': {
      companyStage: 'growth',
      companyCulture: ['Scaling', 'Process-oriented', 'Customer-focused', 'Performance-driven'],
      recentEvents: ['Series funding', 'Market expansion', 'Team scaling', 'Product development'],
      strategicInitiatives: ['Scale', 'Market Expansion', 'Process Optimization', 'Team Building'],
      approvalProcess: 'Moderate',
      typicalBudgetRange: '$50K-$500K',
      decisionMakers: ['VP Level', 'Directors', 'C-Level']
    },
    
    'mature': {
      companyStage: 'mature',
      companyCulture: ['Established', 'Process-driven', 'Risk-averse', 'Efficiency-focused'],
      recentEvents: ['Market consolidation', 'Process optimization', 'Cost management', 'Innovation initiatives'],
      strategicInitiatives: ['Efficiency', 'Innovation', 'Cost Optimization', 'Digital Transformation'],
      approvalProcess: 'Formal',
      typicalBudgetRange: '$100K-$2M',
      decisionMakers: ['C-Level', 'Board', 'Committee']
    },
    
    'enterprise': {
      companyStage: 'enterprise',
      companyCulture: ['Complex', 'Hierarchical', 'Compliance-focused', 'Risk-managed'],
      recentEvents: ['M&A activity', 'Regulatory changes', 'Digital transformation', 'Global expansion'],
      strategicInitiatives: ['Digital Transformation', 'Compliance', 'Global Expansion', 'Innovation'],
      approvalProcess: 'Complex',
      typicalBudgetRange: '$500K-$10M',
      decisionMakers: ['C-Level', 'Board', 'Multiple Committees']
    }
  };

  /**
   * Triangulate comprehensive intelligence for a prospect
   */
  static async triangulateIntelligence(prospect: {
    role?: string;
    industry?: string;
    companySize?: string;
    companyStage?: string;
    tenure?: number;
    education?: string;
    location?: string;
    companyName?: string;
  }): Promise<{
    wants: string[];
    needs: string[];
    painPoints: string[];
    personalGoals: string[];
    professionalGoals: string[];
    rolePriorities: any;
    decisionFactors: string[];
    budgetAuthority: string;
    influenceLevel: string;
    decisionTimeline: string;
    communicationStyle: string;
    decisionMakingStyle: string;
    riskTolerance: string;
    innovationAdoption: string;
    leadershipStyle: string;
    engagementLevel: string;
    preferredChannels: string[];
    contentPreferences: string[];
    keyInfluencers: string[];
    currentSolutions: string[];
    evaluationCriteria: string[];
    budgetRange: string;
    urgencyLevel: string;
    businessImpact: string;
    intelligenceScore: number;
    confidenceLevel: number;
  }> {
    
    // Get role-based intelligence
    const role = prospect.role || 'Unknown';
    const roleIntel = this['roleIntelligence'][role] || this['roleIntelligence']['Director of Engineering'];
    
    // Get industry intelligence
    const industry = prospect.industry || 'Technology';
    const industryIntel = this['industryIntelligence'][industry] || this['industryIntelligence']['Technology'];
    
    // Get company intelligence
    const companyStage = prospect.companyStage || 'growth';
    const companyIntel = this['companyStageIntelligence'][companyStage] || this['companyStageIntelligence']['growth'];
    
    // Triangulate based on tenure
    const tenureAdjustments = this.getTenureAdjustments(prospect.tenure || 2);
    
    // Triangulate based on education
    const educationAdjustments = this.getEducationAdjustments(prospect.education);
    
    // Combine all intelligence
    const intelligence = {
      wants: [...roleIntel.wants, ...tenureAdjustments.wants],
      needs: [...roleIntel.needs, ...industryIntel.industryChallenges],
      painPoints: [...roleIntel.painPoints, ...industryIntel.industryChallenges],
      personalGoals: [...roleIntel.goals, ...tenureAdjustments.personalGoals],
      professionalGoals: [...roleIntel.goals, ...industryIntel.industryTrends],
      rolePriorities: {
        role: roleIntel.priorities,
        industry: industryIntel.industryTrends,
        company: companyIntel.strategicInitiatives
      },
      decisionFactors: [...roleIntel.decisionFactors, ...industryIntel.commonEvaluationCriteria],
      budgetAuthority: roleIntel.budgetAuthority,
      influenceLevel: roleIntel.influenceLevel,
      decisionTimeline: this.adjustTimelineByCompany(roleIntel.decisionTimeline, companyIntel.approvalProcess),
      communicationStyle: roleIntel.communicationStyle,
      decisionMakingStyle: roleIntel.decisionMakingStyle,
      riskTolerance: this.adjustRiskTolerance(roleIntel.riskTolerance, companyStage),
      innovationAdoption: roleIntel.innovationAdoption,
      leadershipStyle: roleIntel.leadershipStyle,
      engagementLevel: this.calculateEngagementLevel(prospect),
      preferredChannels: this.getPreferredChannels(role, industry),
      contentPreferences: this.getContentPreferences(role, industry),
      keyInfluencers: this.getKeyInfluencers(role, industry),
      currentSolutions: this.getCurrentSolutions(industry, companyStage),
      evaluationCriteria: [...roleIntel.decisionFactors, ...industryIntel.commonEvaluationCriteria],
      budgetRange: companyIntel.typicalBudgetRange,
      urgencyLevel: this.calculateUrgencyLevel(prospect),
      businessImpact: this.calculateBusinessImpact(role, industry),
      intelligenceScore: this.calculateIntelligenceScore(prospect),
      confidenceLevel: this.calculateConfidenceLevel(prospect)
    };
    
    return intelligence;
  }

  private static getTenureAdjustments(tenure: number) {
    if (tenure < 1) {
      return {
        wants: ['Quick Wins', 'Team Integration', 'Process Understanding'],
        personalGoals: ['Prove Value', 'Build Relationships', 'Learn Systems']
      };
    } else if (tenure < 3) {
      return {
        wants: ['Process Improvement', 'Team Development', 'Innovation'],
        personalGoals: ['Career Growth', 'Impact', 'Recognition']
      };
    } else {
      return {
        wants: ['Strategic Impact', 'Legacy Building', 'Mentoring'],
        personalGoals: ['Leadership', 'Strategic Vision', 'Team Success']
      };
    }
  }

  private static getEducationAdjustments(education?: string) {
    if (!education) return { communicationStyle: 'Professional' };
    
    // Adjust based on education background
    if (education.includes('MBA') || education.includes('Business')) {
      return { communicationStyle: 'Business-Focused', decisionMakingStyle: 'ROI-Driven' };
    } else if (education.includes('Engineering') || education.includes('Computer Science')) {
      return { communicationStyle: 'Technical', decisionMakingStyle: 'Data-Driven' };
    } else if (education.includes('Liberal Arts') || education.includes('Humanities')) {
      return { communicationStyle: 'Collaborative', decisionMakingStyle: 'Consensus-Based' };
    }
    
    return { communicationStyle: 'Professional' };
  }

  private static adjustTimelineByCompany(roleTimeline: string, companyProcess: string): string {
    if (companyProcess === 'Fast') return '1-2 months';
    if (companyProcess === 'Complex') return '6-12 months';
    return roleTimeline;
  }

  private static adjustRiskTolerance(roleRisk: string, companyStage: string): string {
    if (companyStage === 'startup') return 'High';
    if (companyStage === 'enterprise') return 'Low';
    return roleRisk;
  }

  private static calculateEngagementLevel(prospect: any): string {
    // Calculate based on available data points
    let score = 0;
    if (prospect.role) score += 1;
    if (prospect.industry) score += 1;
    if (prospect.companySize) score += 1;
    if (prospect.tenure) score += 1;
    
    if (score >= 4) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  private static getPreferredChannels(role: string, industry: string): string[] {
    const baseChannels = ['Email', 'LinkedIn'];
    
    if (role === 'CTO' || role === 'Director of Engineering') {
      return [...baseChannels, 'Technical Forums', 'GitHub'];
    } else if (role === 'CMO') {
      return [...baseChannels, 'Social Media', 'Industry Events'];
    } else if (role === 'CFO') {
      return [...baseChannels, 'Industry Reports', 'Webinars'];
    }
    
    return baseChannels;
  }

  private static getContentPreferences(role: string, industry: string): string[] {
    const baseContent = ['Industry News', 'Case Studies'];
    
    if (role === 'CTO') {
      return [...baseContent, 'Technical Whitepapers', 'Security Reports', 'Innovation Trends'];
    } else if (role === 'CMO') {
      return [...baseContent, 'Marketing Analytics', 'Growth Strategies', 'Customer Insights'];
    } else if (role === 'CFO') {
      return [...baseContent, 'Financial Reports', 'ROI Analysis', 'Compliance Updates'];
    }
    
    return baseContent;
  }

  private static getKeyInfluencers(role: string, industry: string): string[] {
    const baseInfluencers = ['Industry Peers', 'Thought Leaders'];
    
    if (role === 'CTO') {
      return [...baseInfluencers, 'Security Experts', 'Technology Leaders', 'Vendor Partners'];
    } else if (role === 'CMO') {
      return [...baseInfluencers, 'Marketing Gurus', 'Sales Leaders', 'Customer Success'];
    }
    
    return baseInfluencers;
  }

  private static getCurrentSolutions(industry: string, companyStage: string): string[] {
    const baseSolutions = ['Legacy Systems', 'Manual Processes'];
    
    if (industry === 'Technology') {
      return [...baseSolutions, 'Cloud Platforms', 'Development Tools', 'Security Solutions'];
    } else if (industry === 'Healthcare') {
      return [...baseSolutions, 'EMR Systems', 'Compliance Tools', 'Patient Management'];
    }
    
    return baseSolutions;
  }

  private static calculateUrgencyLevel(prospect: any): string {
    // Calculate based on company stage and role
    if (prospect['companyStage'] === 'startup') return 'High';
    if (prospect['role'] === 'CTO' && prospect['industry'] === 'Technology') return 'High';
    return 'Medium';
  }

  private static calculateBusinessImpact(role: string, industry: string): string {
    if (role === 'CTO') return 'Operational Efficiency and Security';
    if (role === 'CMO') return 'Revenue Growth and Customer Acquisition';
    if (role === 'CFO') return 'Cost Control and Financial Performance';
    return 'Business Performance';
  }

  private static calculateIntelligenceScore(prospect: any): number {
    let score = 0;
    if (prospect.role) score += 20;
    if (prospect.industry) score += 20;
    if (prospect.companySize) score += 15;
    if (prospect.tenure) score += 15;
    if (prospect.education) score += 10;
    if (prospect.location) score += 10;
    if (prospect.companyName) score += 10;
    
    return Math.min(score, 100);
  }

  private static calculateConfidenceLevel(prospect: any): number {
    // Calculate confidence based on data completeness and quality
    let confidence = 0;
    if (prospect['role'] && this['roleIntelligence'][prospect.role]) confidence += 30;
    if (prospect['industry'] && this['industryIntelligence'][prospect.industry]) confidence += 25;
    if (prospect['companyStage'] && this['companyStageIntelligence'][prospect.companyStage]) confidence += 20;
    if (prospect['tenure'] && prospect.tenure > 0) confidence += 15;
    if (prospect.education) confidence += 10;
    
    return Math.min(confidence, 100);
  }
}
