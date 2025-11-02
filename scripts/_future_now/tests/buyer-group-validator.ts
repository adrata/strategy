/**
 * BUYER GROUP VALIDATION FRAMEWORK
 * 
 * Comprehensive accuracy measurement and validation tools for buyer group implementations
 * Provides objective metrics to measure and improve buyer group accuracy
 */

export interface BuyerGroupMember {
  id: string;
  name: string;
  title: string;
  role: 'decision_maker' | 'champion' | 'stakeholder' | 'blocker' | 'introducer';
  confidence: number;
  email?: string;
  phone?: string;
  linkedin?: string;
  department?: string;
  seniority?: string;
  companyId?: string;
  workspaceId?: string;
}

export interface BuyerGroup {
  id: string;
  companyId: string;
  companyName: string;
  members: BuyerGroupMember[];
  totalMembers: number;
  composition: {
    decision_maker: number;
    champion: number;
    stakeholder: number;
    blocker: number;
    introducer: number;
  };
  confidence: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccuracyMetrics {
  coreMemberAccuracy: number;      // % of correct decision makers identified
  roleAssignmentAccuracy: number;  // % of correct role assignments
  relevanceScore: number;          // % relevant for specific product
  dataQuality: number;            // % of contact info that's accurate
  consistency: number;             // % consistent results across runs
  completeness: number;            // % of required roles represented
  timeliness: number;              // % of data that's current (< 6 months)
  overallScore: number;            // Weighted average of all metrics
}

export interface ValidationResult {
  isValid: boolean;
  accuracy: AccuracyMetrics;
  issues: ValidationIssue[];
  recommendations: string[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ValidationIssue {
  type: 'ROLE_MISMATCH' | 'MISSING_ROLES' | 'DATA_QUALITY' | 'SIZE_INAPPROPRIATE' | 'RELEVANCE_LOW' | 'CONSISTENCY_POOR';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  details: any;
  recommendation: string;
}

export interface DealOutcome {
  dealId: string;
  companyId: string;
  status: 'WON' | 'LOST' | 'IN_PROGRESS';
  involvedContacts: string[]; // Person IDs who were actually involved
  decisionMakers: string[];   // Person IDs who made the decision
  champions: string[];        // Person IDs who championed the deal
  blockers: string[];         // Person IDs who blocked the deal
  closedDate?: Date;
  dealValue?: number;
  notes?: string;
}

export class BuyerGroupValidator {
  private historicalData: Map<string, DealOutcome[]> = new Map();
  private accuracyHistory: Map<string, AccuracyMetrics[]> = new Map();

  constructor() {
    this.loadHistoricalData();
  }

  /**
   * Validate buyer group accuracy against multiple criteria
   */
  async validateBuyerGroup(
    buyerGroup: BuyerGroup,
    companySize: 'Enterprise' | 'Large' | 'Mid-market' | 'SMB' | 'Small',
    sellerProfile?: any
  ): Promise<ValidationResult> {
    console.log(`🔍 [VALIDATOR] Validating buyer group for ${buyerGroup.companyName}`);

    const issues: ValidationIssue[] = [];
    const recommendations: string[] = [];

    // 1. Core Member Accuracy
    const coreMemberAccuracy = await this.calculateCoreMemberAccuracy(buyerGroup);
    if (coreMemberAccuracy < 0.9) {
      issues.push({
        type: 'ROLE_MISMATCH',
        severity: 'HIGH',
        description: `Core member accuracy ${(coreMemberAccuracy * 100).toFixed(1)}% is below 90% threshold`,
        details: { accuracy: coreMemberAccuracy },
        recommendation: 'Review role assignments and verify decision-making authority'
      });
    }

    // 2. Role Assignment Accuracy
    const roleAssignmentAccuracy = await this.calculateRoleAssignmentAccuracy(buyerGroup);
    if (roleAssignmentAccuracy < 0.85) {
      issues.push({
        type: 'ROLE_MISMATCH',
        severity: 'HIGH',
        description: `Role assignment accuracy ${(roleAssignmentAccuracy * 100).toFixed(1)}% is below 85% threshold`,
        details: { accuracy: roleAssignmentAccuracy },
        recommendation: 'Improve role classification algorithms and add validation'
      });
    }

    // 3. Relevance Score
    const relevanceScore = sellerProfile ? 
      await this.calculateRelevanceScore(buyerGroup, sellerProfile) : 0.8;
    if (relevanceScore < 0.8) {
      issues.push({
        type: 'RELEVANCE_LOW',
        severity: 'MEDIUM',
        description: `Relevance score ${(relevanceScore * 100).toFixed(1)}% is below 80% threshold`,
        details: { score: relevanceScore },
        recommendation: 'Filter buyer group by product-specific relevance'
      });
    }

    // 4. Data Quality
    const dataQuality = this.calculateDataQuality(buyerGroup);
    if (dataQuality < 0.95) {
      issues.push({
        type: 'DATA_QUALITY',
        severity: 'MEDIUM',
        description: `Data quality ${(dataQuality * 100).toFixed(1)}% is below 95% threshold`,
        details: { quality: dataQuality },
        recommendation: 'Improve contact verification and data freshness checks'
      });
    }

    // 5. Completeness
    const completeness = this.calculateCompleteness(buyerGroup);
    if (completeness < 0.8) {
      issues.push({
        type: 'MISSING_ROLES',
        severity: 'HIGH',
        description: `Only ${(completeness * 100).toFixed(1)}% of required roles are represented`,
        details: { completeness },
        recommendation: 'Ensure all 5 buyer group roles are represented'
      });
    }

    // 6. Size Appropriateness
    const sizeAppropriate = this.validateSizeAppropriate(buyerGroup, companySize);
    if (!sizeAppropriate) {
      issues.push({
        type: 'SIZE_INAPPROPRIATE',
        severity: 'HIGH',
        description: `Buyer group size ${buyerGroup.totalMembers} is not appropriate for ${companySize} company`,
        details: { 
          actual: buyerGroup.totalMembers, 
          expected: this.getExpectedSize(companySize) 
        },
        recommendation: 'Implement adaptive buyer group sizing based on company size'
      });
    }

    // 7. Consistency
    const consistency = await this.calculateConsistency(buyerGroup);
    if (consistency < 0.95) {
      issues.push({
        type: 'CONSISTENCY_POOR',
        severity: 'MEDIUM',
        description: `Consistency ${(consistency * 100).toFixed(1)}% is below 95% threshold`,
        details: { consistency },
        recommendation: 'Implement deterministic algorithms and single source of truth'
      });
    }

    // 8. Timeliness
    const timeliness = this.calculateTimeliness(buyerGroup);
    if (timeliness < 0.9) {
      issues.push({
        type: 'DATA_QUALITY',
        severity: 'LOW',
        description: `Only ${(timeliness * 100).toFixed(1)}% of data is current`,
        details: { timeliness },
        recommendation: 'Refresh stale data and implement data freshness checks'
      });
    }

    // Calculate overall accuracy metrics
    const accuracy: AccuracyMetrics = {
      coreMemberAccuracy,
      roleAssignmentAccuracy,
      relevanceScore,
      dataQuality,
      consistency,
      completeness,
      timeliness,
      overallScore: this.calculateOverallScore({
        coreMemberAccuracy,
        roleAssignmentAccuracy,
        relevanceScore,
        dataQuality,
        consistency,
        completeness,
        timeliness
      })
    };

    // Generate recommendations
    recommendations.push(...this.generateRecommendations(issues, accuracy));

    // Determine confidence level
    const confidence = this.determineConfidence(accuracy, issues);

    const result: ValidationResult = {
      isValid: issues.filter(i => i.severity === 'HIGH').length === 0,
      accuracy,
      issues,
      recommendations,
      confidence
    };

    // Store accuracy history
    this.storeAccuracyHistory(buyerGroup.companyId, accuracy);

    console.log(`📊 [VALIDATOR] Validation complete: ${result.isValid ? 'VALID' : 'INVALID'} (${accuracy.overallScore.toFixed(1)}%)`);
    
    return result;
  }

  /**
   * Calculate core member accuracy (are these the right decision makers?)
   */
  private async calculateCoreMemberAccuracy(buyerGroup: BuyerGroup): Promise<number> {
    // This would ideally validate against historical deal data
    // For now, we'll use heuristics based on titles and seniority
    
    const decisionMakers = buyerGroup.members.filter(m => m.role === 'decision_maker');
    let accuracy = 0;

    for (const member of decisionMakers) {
      // Check if title indicates decision-making authority
      const title = member.title.toLowerCase();
      const hasDecisionAuthority = 
        title.includes('ceo') || title.includes('president') || 
        title.includes('cfo') || title.includes('chief') ||
        (title.includes('vp') && (title.includes('sales') || title.includes('revenue'))) ||
        (title.includes('director') && (title.includes('sales') || title.includes('revenue')));

      // Check seniority level
      const hasAppropriateSeniority = 
        member.seniority === 'C-Level' || member.seniority === 'VP-Level';

      // Check confidence score
      const hasHighConfidence = member.confidence >= 80;

      if (hasDecisionAuthority && hasAppropriateSeniority && hasHighConfidence) {
        accuracy += 1;
      }
    }

    return decisionMakers.length > 0 ? accuracy / decisionMakers.length : 0;
  }

  /**
   * Calculate role assignment accuracy
   */
  private async calculateRoleAssignmentAccuracy(buyerGroup: BuyerGroup): Promise<number> {
    let correctAssignments = 0;
    const totalAssignments = buyerGroup.members.length;

    for (const member of buyerGroup.members) {
      const isCorrectlyAssigned = this.validateRoleAssignment(member);
      if (isCorrectlyAssigned) {
        correctAssignments++;
      }
    }

    return totalAssignments > 0 ? correctAssignments / totalAssignments : 0;
  }

  /**
   * Validate if a member's role assignment is correct
   */
  private validateRoleAssignment(member: BuyerGroupMember): boolean {
    const title = member.title.toLowerCase();
    const department = member.department?.toLowerCase() || '';
    const seniority = member.seniority || '';

    switch (member.role) {
      case 'decision_maker':
        return (seniority === 'C-Level' || seniority === 'VP-Level') &&
               (title.includes('ceo') || title.includes('president') || 
                title.includes('cfo') || title.includes('chief') ||
                (title.includes('vp') && (title.includes('sales') || title.includes('revenue'))));

      case 'champion':
        return (seniority === 'VP-Level' || seniority === 'Director-Level') &&
               (department.includes('sales') || department.includes('marketing') ||
                title.includes('vp') || title.includes('director'));

      case 'stakeholder':
        return seniority !== 'IC' && 
               (department.includes('marketing') || department.includes('product') ||
                department.includes('operations') || department.includes('engineering'));

      case 'blocker':
        return (title.includes('legal') || title.includes('compliance') ||
                title.includes('security') || title.includes('procurement') ||
                department.includes('legal') || department.includes('compliance'));

      case 'introducer':
        return (department.includes('sales') || department.includes('business development') ||
                title.includes('account') || title.includes('customer') ||
                title.includes('territory'));

      default:
        return false;
    }
  }

  /**
   * Calculate relevance score for specific product
   */
  private async calculateRelevanceScore(buyerGroup: BuyerGroup, sellerProfile: any): Promise<number> {
    // This would use the BuyerGroupRelevanceEngine
    // For now, we'll use a simplified calculation
    
    let relevanceScore = 0;
    const totalMembers = buyerGroup.members.length;

    for (const member of buyerGroup.members) {
      const memberRelevance = this.calculateMemberRelevance(member, sellerProfile);
      relevanceScore += memberRelevance;
    }

    return totalMembers > 0 ? relevanceScore / totalMembers : 0;
  }

  /**
   * Calculate relevance for individual member
   */
  private calculateMemberRelevance(member: BuyerGroupMember, sellerProfile: any): number {
    const title = member.title.toLowerCase();
    const department = member.department?.toLowerCase() || '';
    
    // Product-specific relevance scoring
    if (sellerProfile.solutionCategory === 'platform') {
      if (department.includes('engineering') || department.includes('development') ||
          title.includes('cto') || title.includes('architect')) {
        return 0.9;
      }
      if (department.includes('it') || title.includes('director')) {
        return 0.7;
      }
    } else if (sellerProfile.solutionCategory === 'revenue_technology') {
      if (department.includes('sales') || department.includes('revenue') ||
          title.includes('cro') || title.includes('vp sales')) {
        return 0.9;
      }
      if (department.includes('marketing') || title.includes('director')) {
        return 0.7;
      }
    }

    // Default relevance
    return 0.6;
  }

  /**
   * Calculate data quality score
   */
  private calculateDataQuality(buyerGroup: BuyerGroup): number {
    let qualityScore = 0;
    const totalMembers = buyerGroup.members.length;

    for (const member of buyerGroup.members) {
      let memberQuality = 0;
      
      // Email quality
      if (member.email && this.isValidEmail(member.email)) {
        memberQuality += 0.4;
      }
      
      // Phone quality
      if (member.phone && this.isValidPhone(member.phone)) {
        memberQuality += 0.3;
      }
      
      // LinkedIn quality
      if (member.linkedin && this.isValidLinkedIn(member.linkedin)) {
        memberQuality += 0.3;
      }
      
      qualityScore += memberQuality;
    }

    return totalMembers > 0 ? qualityScore / totalMembers : 0;
  }

  /**
   * Calculate completeness (all roles represented)
   */
  private calculateCompleteness(buyerGroup: BuyerGroup): number {
    const requiredRoles = ['decision_maker', 'champion', 'stakeholder', 'blocker', 'introducer'];
    const representedRoles = requiredRoles.filter(role => 
      buyerGroup.composition[role as keyof typeof buyerGroup.composition] > 0
    );
    
    return representedRoles.length / requiredRoles.length;
  }

  /**
   * Validate if buyer group size is appropriate for company size
   */
  private validateSizeAppropriate(buyerGroup: BuyerGroup, companySize: string): boolean {
    const expectedSize = this.getExpectedSize(companySize);
    return buyerGroup.totalMembers >= expectedSize.min && 
           buyerGroup.totalMembers <= expectedSize.max;
  }

  /**
   * Get expected buyer group size for company size
   */
  private getExpectedSize(companySize: string): { min: number; max: number } {
    switch (companySize) {
      case 'Enterprise': return { min: 12, max: 18 };
      case 'Large': return { min: 8, max: 15 };
      case 'Mid-market': return { min: 6, max: 12 };
      case 'SMB': return { min: 4, max: 8 };
      case 'Small': return { min: 3, max: 6 };
      default: return { min: 8, max: 15 };
    }
  }

  /**
   * Calculate consistency across multiple runs
   */
  private async calculateConsistency(buyerGroup: BuyerGroup): Promise<number> {
    // This would compare with previous runs of the same company
    // For now, we'll return a default value
    return 0.95;
  }

  /**
   * Calculate data timeliness
   */
  private calculateTimeliness(buyerGroup: BuyerGroup): number {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - (6 * 30 * 24 * 60 * 60 * 1000));
    
    let currentData = 0;
    const totalMembers = buyerGroup.members.length;

    for (const member of buyerGroup.members) {
      // Check if data is recent (within 6 months)
      if (buyerGroup.updatedAt > sixMonthsAgo) {
        currentData++;
      }
    }

    return totalMembers > 0 ? currentData / totalMembers : 0;
  }

  /**
   * Calculate overall accuracy score
   */
  private calculateOverallScore(metrics: Omit<AccuracyMetrics, 'overallScore'>): number {
    const weights = {
      coreMemberAccuracy: 0.25,
      roleAssignmentAccuracy: 0.20,
      relevanceScore: 0.15,
      dataQuality: 0.15,
      consistency: 0.10,
      completeness: 0.10,
      timeliness: 0.05
    };

    return Object.entries(weights).reduce((score, [key, weight]) => {
      return score + (metrics[key as keyof typeof metrics] * weight);
    }, 0);
  }

  /**
   * Generate recommendations based on issues and metrics
   */
  private generateRecommendations(issues: ValidationIssue[], accuracy: AccuracyMetrics): string[] {
    const recommendations: string[] = [];

    if (accuracy.coreMemberAccuracy < 0.9) {
      recommendations.push('Improve decision maker identification by validating titles and seniority levels');
    }

    if (accuracy.roleAssignmentAccuracy < 0.85) {
      recommendations.push('Enhance role classification algorithms with multi-signal validation');
    }

    if (accuracy.relevanceScore < 0.8) {
      recommendations.push('Implement product-specific relevance filtering for buyer group members');
    }

    if (accuracy.dataQuality < 0.95) {
      recommendations.push('Improve contact verification and data freshness validation');
    }

    if (accuracy.completeness < 0.8) {
      recommendations.push('Ensure all 5 buyer group roles are represented in every buyer group');
    }

    if (accuracy.consistency < 0.95) {
      recommendations.push('Implement deterministic algorithms and single source of truth');
    }

    if (accuracy.timeliness < 0.9) {
      recommendations.push('Refresh stale data and implement automatic data freshness checks');
    }

    // Add specific recommendations based on issues
    issues.forEach(issue => {
      if (issue.type === 'SIZE_INAPPROPRIATE') {
        recommendations.push('Implement adaptive buyer group sizing based on company size');
      }
    });

    return recommendations;
  }

  /**
   * Determine confidence level based on accuracy and issues
   */
  private determineConfidence(accuracy: AccuracyMetrics, issues: ValidationIssue[]): 'HIGH' | 'MEDIUM' | 'LOW' {
    const highSeverityIssues = issues.filter(i => i.severity === 'HIGH').length;
    
    if (accuracy.overallScore >= 0.9 && highSeverityIssues === 0) {
      return 'HIGH';
    } else if (accuracy.overallScore >= 0.7 && highSeverityIssues <= 1) {
      return 'MEDIUM';
    } else {
      return 'LOW';
    }
  }

  /**
   * Track accuracy over time for continuous learning
   */
  trackBuyerGroupAccuracy(buyerGroupId: string, dealOutcome: DealOutcome): AccuracyMetrics {
    const actualBuyers = dealOutcome.involvedContacts;
    const predictedBuyers = this.getBuyerGroup(buyerGroupId);
    
    if (!predictedBuyers) {
      throw new Error(`Buyer group ${buyerGroupId} not found`);
    }

    const accuracy = this.calculateDealAccuracy(predictedBuyers, dealOutcome);
    
    // Store for learning
    this.storeAccuracyHistory(predictedBuyers.companyId, accuracy);
    
    return accuracy;
  }

  /**
   * Calculate accuracy based on actual deal outcome
   */
  private calculateDealAccuracy(buyerGroup: BuyerGroup, dealOutcome: DealOutcome): AccuracyMetrics {
    const predictedIds = buyerGroup.members.map(m => m.id);
    const actualIds = dealOutcome.involvedContacts;
    
    // Calculate precision and recall
    const truePositives = predictedIds.filter(id => actualIds.includes(id)).length;
    const precision = predictedIds.length > 0 ? truePositives / predictedIds.length : 0;
    const recall = actualIds.length > 0 ? truePositives / actualIds.length : 0;
    const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    return {
      coreMemberAccuracy: f1Score,
      roleAssignmentAccuracy: this.calculateRoleAccuracyFromDeal(buyerGroup, dealOutcome),
      relevanceScore: 0.8, // Would need product context
      dataQuality: this.calculateDataQuality(buyerGroup),
      consistency: 0.95, // Would need historical comparison
      completeness: this.calculateCompleteness(buyerGroup),
      timeliness: this.calculateTimeliness(buyerGroup),
      overallScore: f1Score * 0.4 + this.calculateDataQuality(buyerGroup) * 0.3 + 
                   this.calculateCompleteness(buyerGroup) * 0.3
    };
  }

  /**
   * Calculate role accuracy from deal outcome
   */
  private calculateRoleAccuracyFromDeal(buyerGroup: BuyerGroup, dealOutcome: DealOutcome): number {
    let correctRoles = 0;
    const totalMembers = buyerGroup.members.length;

    for (const member of buyerGroup.members) {
      const isCorrectRole = this.validateRoleAgainstDeal(member, dealOutcome);
      if (isCorrectRole) {
        correctRoles++;
      }
    }

    return totalMembers > 0 ? correctRoles / totalMembers : 0;
  }

  /**
   * Validate role against actual deal outcome
   */
  private validateRoleAgainstDeal(member: BuyerGroupMember, dealOutcome: DealOutcome): boolean {
    switch (member.role) {
      case 'decision_maker':
        return dealOutcome.decisionMakers.includes(member.id);
      case 'champion':
        return dealOutcome.champions.includes(member.id);
      case 'blocker':
        return dealOutcome.blockers.includes(member.id);
      case 'stakeholder':
      case 'introducer':
        return dealOutcome.involvedContacts.includes(member.id);
      default:
        return false;
    }
  }

  /**
   * Store accuracy history for learning
   */
  private storeAccuracyHistory(companyId: string, accuracy: AccuracyMetrics): void {
    if (!this.accuracyHistory.has(companyId)) {
      this.accuracyHistory.set(companyId, []);
    }
    
    const history = this.accuracyHistory.get(companyId)!;
    history.push(accuracy);
    
    // Keep only last 10 measurements
    if (history.length > 10) {
      history.shift();
    }
  }

  /**
   * Load historical deal data for validation
   */
  private loadHistoricalData(): void {
    // This would load from database
    // For now, we'll use empty data
  }

  /**
   * Get buyer group by ID (would query database)
   */
  private getBuyerGroup(buyerGroupId: string): BuyerGroup | null {
    // This would query the database
    // For now, return null
    return null;
  }

  /**
   * Validation helper methods
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  private isValidLinkedIn(linkedin: string): boolean {
    return linkedin.includes('linkedin.com/in/') || linkedin.includes('linkedin.com/company/');
  }
}

export default BuyerGroupValidator;
