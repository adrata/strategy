/**
 * BUYER GROUP IDENTIFIER (REFACTORED)
 * 
 * Main orchestrator for buyer group identification using modular components
 */

import { PersonProfile, BuyerGroup, SellerProfile } from './types';
import { RoleAssignmentEngine } from './role-assignment-engine';
import { CohesionAnalyzer } from './cohesion-analyzer';
import { RoleBalancer } from './role-balancer';
import { InfluenceCalculator } from './influence-calculator';

export class BuyerGroupIdentifier {
  private roleAssignmentEngine: RoleAssignmentEngine;
  private cohesionAnalyzer: CohesionAnalyzer;
  private roleBalancer: RoleBalancer;
  private influenceCalculator: InfluenceCalculator;

  constructor() {
    this['roleAssignmentEngine'] = new RoleAssignmentEngine();
    this['cohesionAnalyzer'] = new CohesionAnalyzer();
    this['roleBalancer'] = new RoleBalancer();
    this['influenceCalculator'] = new InfluenceCalculator();
  }

  /**
   * Identify buyer group from analyzed profiles
   * ENHANCED: Modular approach with cohesion analysis and strategic connectivity validation
   */
  async identifyBuyerGroup(
    profiles: PersonProfile[], 
    companyName: string, 
    sellerProfile: SellerProfile,
    options?: { maxBuyerGroupSize?: number; targetBuyerGroupRange?: { min: number; max: number } }
  ): Promise<BuyerGroup> {
    // STEP 1: Assign initial roles
    let roles = this.roleAssignmentEngine.assignRoles(profiles, sellerProfile);
    
    // STEP 2: Analyze buyer group cohesion
    const cohesionAnalysis = this.cohesionAnalyzer.analyzeBuyerGroupCohesion(profiles, sellerProfile);
    
    // STEP 3: Filter for cohesive buyer group if needed
    if (cohesionAnalysis.cohesionScore < 60) {
      roles = this.enforceBusinessUnitCohesion(roles, profiles, cohesionAnalysis);
    }
    
    // STEP 4: Balance roles and apply size constraints
    const currentSize = Object.values(roles).flat().length;
    const range = options?.targetBuyerGroupRange ?? { min: 8, max: options?.maxBuyerGroupSize ?? 12 };
    
    if (currentSize > range.max) {
      roles = this.roleBalancer.trimRolesToSize(roles, profiles, range.max);
    }
    
    // STEP 5: Apply role balancing
    const distributionResult = this.roleBalancer.balanceRoles(roles, profiles, sellerProfile);
    roles = distributionResult.roles;
    
    // Log distribution results
    this.logDistributionResults(distributionResult);

    // STEP 6: Add strategic ranking and chief designation
    roles = this.influenceCalculator.addRankingAndChiefs(roles, profiles, sellerProfile);
    
    // STEP 7: Generate supporting analytics
    const dynamics = this.analyzeDynamics(profiles, roles);
    const decisionFlow = this.mapDecisionFlow(profiles, roles);
    const flightRisk = this.analyzeFlightRisk(profiles);
    const opportunitySignals = this.detectOpportunitySignals(profiles, companyName, sellerProfile);
    
    const totalMembers = Object.values(roles).flat().length;
    return {
      id: `${companyName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
      companyName,
      totalMembers,
      roles,
      dynamics,
      decisionFlow,
      flightRisk,
      opportunitySignals,
      cohesion: {
        score: cohesionAnalysis.cohesionScore,
        level: cohesionAnalysis.cohesionLevel,
        overallScore: cohesionAnalysis.cohesionScore,
        departmentAlignment: 0.8,
        signal: `${cLevelCount} C-level executive(s) identified in buyer group`,
        strength: Math.min(cLevelCount * 0.3, 1.0),
        source: 'seniority_analysis',
        confidence: 0.9
      }
    };
  }

  private detectOpportunitySignals(profiles: PersonProfile[], companyName: string, sellerProfile: SellerProfile): any[] {
    const signals: any[] = [];
    
    const alignedProfiles = profiles.filter(p => 
      sellerProfile.mustHaveTitles.some(title =>
        p.title.toLowerCase().includes(title) || 
        p.department.toLowerCase().includes(title)
      )
    );
    
    if (alignedProfiles.length > 0) {
      signals.push({
        signal: `${alignedProfiles.length} team members with strong product alignment identified`,
        strength: Math.min(alignedProfiles.length * 0.2, 0.9),
        source: 'role_alignment',
        confidence: 0.85
      });
    }
    
    const totalProfiles = profiles.length;
    if (totalProfiles > 20) {
      signals.push({
        signal: 'Large organization with complex buyer group - enterprise opportunity',
        strength: 0.7,
        source: 'company_scale',
        confidence: 0.7
      });
    }
    
    return signals;
  }

  validateBuyerGroup(buyerGroup: BuyerGroup): { isValid: boolean; warnings: string[]; recommendations: string[]; } {
    const warnings: string[] = [];
    const recommendations: string[] = [];

    if (buyerGroup.roles['decision']['length'] === 0) {
      warnings.push('No clear decision makers identified');
      recommendations.push('Expand search to include C-level and VP roles');
    }

    if (buyerGroup.roles['champion']['length'] === 0) {
      warnings.push('No champions identified');
      recommendations.push('Look for departmental leads and project managers');
    }

    const totalMembers = Object.values(buyerGroup.roles).flat().length;
    if (totalMembers < 3) {
      warnings.push('Buyer group may be too small for enterprise sales');
      recommendations.push('Consider expanding search criteria');
    }

    return { isValid: warnings['length'] === 0, warnings, recommendations };
  }

  assessRoleCoverage(
    buyerGroup: BuyerGroup,
    minTargets: { decision?: number; champion?: number; stakeholder?: number; blocker?: number; introducer?: number }
  ): { meetsTargets: boolean; gaps: string[] } {
    const gaps: string[] = [];
    const roles = buyerGroup.roles;

    const targets: Array<keyof typeof roles> = ['decision', 'champion', 'stakeholder', 'blocker', 'introducer'];
    for (const key of targets) {
      const t = (minTargets as Record<string, number | undefined>)[key];
      if (typeof t === 'number' && t > 0) {
        const have = roles[key]?.length || 0;
        if (have < t) gaps.push(`${key}: have ${have}, need ${t}`);
      }
    }
    
    return {
      meetsTargets: gaps['length'] === 0,
      gaps
    };
  }
}