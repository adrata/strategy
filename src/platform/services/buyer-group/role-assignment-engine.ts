/**
 * 🎯 ROLE ASSIGNMENT ENGINE
 * 
 * Core logic for assigning buyer group roles to profiles
 */

import { PersonProfile, BuyerGroupRole, SellerProfile, BuyerGroup } from './types';
import { AuthorityAnalyzer } from './authority-analyzer';
import { TitleMatcher } from './title-matcher';

export class RoleAssignmentEngine {
  private authorityAnalyzer: AuthorityAnalyzer;
  private titleMatcher: TitleMatcher;

  constructor() {
    this['authorityAnalyzer'] = new AuthorityAnalyzer();
    this['titleMatcher'] = new TitleMatcher();
  }

  /**
   * Assign roles to profiles based on seller profile priorities
   */
  assignRoles(profiles: PersonProfile[], sellerProfile: SellerProfile): BuyerGroup['roles'] {
    const roles: BuyerGroup['roles'] = {
      decision: [],
      champion: [],
      stakeholder: [],
      blocker: [],
      introducer: []
    };

    // FIRST PASS: Assign clear introducers and decision makers first
    for (const profile of profiles) {
      const roleAssignment = this.determineRole(profile, sellerProfile);
      
      if (roleAssignment && roles[roleAssignment.role]) {
        // PRIORITIZE INTRODUCERS - critical for access
        if (roleAssignment['role'] === 'introducer') {
          roles[roleAssignment.role].push(roleAssignment);
        }
        // CLEAR DECISION MAKERS (C-level, VP with budget authority)
        else if (roleAssignment['role'] === 'decision' && this.authorityAnalyzer.isHighAuthorityDecisionMaker(profile)) {
          roles[roleAssignment.role].push(roleAssignment);
        }
        // OTHERS - assign normally but will balance later
        else {
          roles[roleAssignment.role].push(roleAssignment);
        }
      }
    }

    return roles;
  }

  /**
   * Determine role for a single profile with MULTI-LAYERED ENTERPRISE ACCURACY
   */
  private determineRole(profile: PersonProfile, sellerProfile: SellerProfile): BuyerGroupRole | null {
    const titleLower = profile.title.toLowerCase();
    const deptLower = profile.department.toLowerCase();
    
    let role: BuyerGroupRole['role'];
    let score = profile.influenceScore;
    const scoreBreakdown: Record<string, number> = {};
    let confidence = 0.5;
    const rationale: string[] = [];

    // Enhanced scoring for adaptive intelligence
    const enhancedWeights = {
      decisionMakerBoost: sellerProfile['productCriticality'] === 'mission_critical' ? 7 : 5,
      salaryThreshold: sellerProfile['dealSize'] === 'enterprise' ? 200000 : 150000,
      securityWeight: sellerProfile['securityGateLevel'] === 'high' ? 3 : 2,
      procurementWeight: sellerProfile['procurementMaturity'] === 'mature' ? 3 : 2
    };

    // ADAPTIVE WEIGHTING: Prioritize relevant experience based on seller profile
    const experienceBoost = this.calculateSalesExperienceScore(profile, sellerProfile);
    if (experienceBoost > 0) {
      score += experienceBoost;
      scoreBreakdown['relevant_experience'] = experienceBoost;
      confidence += Math.min(0.1, experienceBoost * 0.02);
    }

    // LAYER 1: ENTERPRISE AUTHORITY ANALYSIS
    const authorityScore = this.authorityAnalyzer.calculateAuthorityScore(profile, sellerProfile);
    if (authorityScore.hasDecisionAuthority) {
      score += authorityScore.score;
      scoreBreakdown['decision_authority'] = authorityScore.score;
      confidence += 0.15;
      rationale.push(...authorityScore.rationale);
    }

    // LAYER 2: ORGANIZATIONAL INFLUENCE ANALYSIS 
    const influenceAnalysis = this.analyzeOrganizationalInfluence(profile);
    score += influenceAnalysis.score;
    scoreBreakdown['org_influence'] = influenceAnalysis.score;
    confidence += influenceAnalysis.confidenceBoost;
    rationale.push(...influenceAnalysis.rationale);

    // LAYER 3: ENHANCED TITLE PATTERN MATCHING
    const roleAssignment = this.assignRoleWithLogic(profile, sellerProfile, authorityScore, influenceAnalysis);
    
    if (roleAssignment) {
      role = roleAssignment.role;
      confidence = Math.max(confidence, roleAssignment.confidence);
      score += roleAssignment.scoreBoost;
      scoreBreakdown['role_assignment'] = roleAssignment.scoreBoost;
      rationale.push(...roleAssignment.rationale);
    } else {
      // LAYER 4: INTELLIGENT FALLBACK
      const intelligentFallback = this.intelligentRoleFallback(profile, sellerProfile, experienceBoost);
      role = intelligentFallback.role;
      confidence = intelligentFallback.confidence;
      rationale.push(...intelligentFallback.rationale);
    }

    // Adjust confidence based on profile quality
    if (profile.influenceScore > 15) { confidence += 0.1; scoreBreakdown['high_influence'] = 1; }
    if (profile.isAboveTheLine) { confidence += 0.1; scoreBreakdown['above_the_line'] = 1; }
    if (profile.connections > 500) { confidence += 0.05; scoreBreakdown['network_strength'] = 1; }

    rationale.push(`Influence score: ${profile.influenceScore}, Above the line: ${profile.isAboveTheLine}`);
    return {
      personId: profile.id,
      role,
      score,
      confidence: Math.min(confidence, 1.0),
      rationale,
      scoreBreakdown
    };
  }

  /**
   * Assign role with defensible enterprise logic
   */
  private assignRoleWithLogic(
    profile: PersonProfile, 
    sellerProfile: SellerProfile,
    authorityScore: any,
    influenceAnalysis: any
  ): {
    role: BuyerGroupRole['role'];
    confidence: number;
    scoreBoost: number;
    rationale: string[];
  } | null {
    const titleLower = profile.title.toLowerCase();

    // Decision Maker Logic
    if (this.titleMatcher.matchesPatterns(titleLower, sellerProfile.rolePriorities.decision)) {
      const isEconomicBuyer = this.authorityAnalyzer.isEconomicBuyer(profile, sellerProfile, authorityScore);
      
      if (isEconomicBuyer) {
        return {
          role: 'decision',
          confidence: Math.min(0.95, 0.8 + (authorityScore.hasDecisionAuthority ? 0.15 : 0)),
          scoreBoost: 6,
          rationale: [`DECISION MAKER: Title "${profile.title}" has economic buyer authority for deal size ${sellerProfile.dealSize}`]
        };
      } else {
        return {
          role: 'champion',
          confidence: 0.85,
          scoreBoost: 5,
          rationale: [`CHAMPION: Title "${profile.title}" matches decision patterns but lacks economic authority - demoted to champion`]
        };
      }
    }

    // Champion Logic
    if (this.titleMatcher.matchesPatterns(titleLower, sellerProfile.rolePriorities.champion)) {
      return {
        role: 'champion',
        confidence: Math.min(0.9, 0.75 + (influenceAnalysis.confidenceBoost)),
        scoreBoost: 4,
        rationale: [`CHAMPION: Title "${profile.title}" matches champion patterns`]
      };
    }

    // Other role assignments...
    const roleTypes = ['stakeholder', 'blocker', 'introducer'] as const;
    for (const roleType of roleTypes) {
      if (this.titleMatcher.matchesPatterns(titleLower, sellerProfile['rolePriorities'][roleType])) {
        return {
          role: roleType,
          confidence: 0.8,
          scoreBoost: roleType === 'blocker' ? 2 : 3,
          rationale: [`${roleType.toUpperCase()}: Title "${profile.title}" matches ${roleType} patterns`]
        };
      }
    }

    return null;
  }

  /**
   * Intelligent fallback logic - avoid blind "stakeholder" defaults
   */
  private intelligentRoleFallback(
    profile: PersonProfile, 
    sellerProfile: SellerProfile, 
    experienceBoost: number
  ): {
    role: BuyerGroupRole['role'];
    confidence: number;
    rationale: string[];
  } {
    // High relevant experience but no pattern match = likely Champion
    if (experienceBoost >= 3) {
      return {
        role: 'champion',
        confidence: 0.7,
        rationale: [`INTELLIGENT FALLBACK: High relevant experience (${experienceBoost}) suggests Champion role`]
      };
    }

    // Some relevant experience = likely Introducer
    if (experienceBoost >= 1) {
      return {
        role: 'introducer',
        confidence: 0.75,
        rationale: [`INTELLIGENT FALLBACK: Relevant experience (${experienceBoost}) suggests Introducer role`]
      };
    }

    // High influence score = likely Stakeholder with influence
    if (profile.influenceScore > 12 || profile.isAboveTheLine) {
      return {
        role: 'stakeholder',
        confidence: 0.65,
        rationale: [`INTELLIGENT FALLBACK: High influence score (${profile.influenceScore}) suggests influential Stakeholder`]
      };
    }

    // Final fallback
    return {
      role: 'stakeholder',
      confidence: 0.5,
      rationale: ["FALLBACK: Classified as Stakeholder - review needed"]
    };
  }

  /**
   * Calculate strategic experience boost based on seller profile priorities
   */
  private calculateSalesExperienceScore(profile: PersonProfile, sellerProfile?: SellerProfile): number {
    const titleLower = profile.title.toLowerCase();
    const deptLower = profile.department.toLowerCase();
    let boost = 0;

    if (!sellerProfile) {
      return this.getDefaultExperienceScore(titleLower, deptLower);
    }

    // Adaptive scoring based on seller profile's target departments and priorities
    const targetDepts = sellerProfile.targetDepartments || [];
    const mustHaveTitles = sellerProfile.mustHaveTitles || [];
    const adjacentFunctions = sellerProfile.adjacentFunctions || [];

    // TIER 1: Core target department experience
    const coreExperience = targetDepts.some(dept => 
      titleLower.includes(dept.toLowerCase()) || deptLower.includes(dept.toLowerCase())
    );
    if (coreExperience) boost += 3;

    // TIER 2: Must-have title keywords
    const hasRequiredKeywords = mustHaveTitles.some(keyword => 
      titleLower.includes(keyword.toLowerCase())
    );
    if (hasRequiredKeywords) boost += 2;

    // TIER 3: Adjacent function experience
    const adjacentExperience = adjacentFunctions.some(func => 
      titleLower.includes(func.toLowerCase()) || deptLower.includes(func.toLowerCase())
    );
    if (adjacentExperience) boost += 1;

    // TIER 4: Leadership/Management indicators
    const leadershipIndicators = ['director', 'vp', 'vice president', 'manager', 'head of', 'lead'];
    const hasLeadership = leadershipIndicators.some(indicator => titleLower.includes(indicator));
    if (hasLeadership) boost += 1;

    return Math.min(boost, 5);
  }

  /**
   * Default experience scoring for backward compatibility
   */
  private getDefaultExperienceScore(titleLower: string, deptLower: string): number {
    let boost = 0;

    const directSalesIndicators = [
      'account executive', 'sales representative', 'sales rep', 'territory manager',
      'business development', 'field sales', 'inside sales', 'enterprise sales',
      'regional sales', 'key account', 'major account', 'commercial sales'
    ];
    if (directSalesIndicators.some(indicator => titleLower.includes(indicator))) {
      boost += 3;
    }

    const salesLeadershipIndicators = [
      'director sales', 'vp sales', 'sales director', 'sales manager',
      'head of sales', 'chief revenue', 'cro'
    ];
    if (salesLeadershipIndicators.some(indicator => titleLower.includes(indicator))) {
      boost += 2;
    }

    const salesAdjacentIndicators = [
      'customer success', 'account management', 'business development',
      'channel', 'partnerships', 'revenue'
    ];
    if (salesAdjacentIndicators.some(indicator => titleLower.includes(indicator))) {
      boost += 1;
    }

    if (deptLower.includes('sales') || deptLower.includes('business development')) {
      boost += 1;
    }

    return Math.min(boost, 5);
  }

  /**
   * Analyze organizational influence beyond just title
   */
  private analyzeOrganizationalInfluence(profile: PersonProfile): {
    score: number;
    confidenceBoost: number;
    rationale: string[];
  } {
    let score = 0;
    let confidenceBoost = 0;
    const rationale: string[] = [];

    // Network influence (connections)
    if (profile.connections > 1000) {
      score += 3;
      confidenceBoost += 0.1;
      rationale.push('High network influence (1000+ connections)');
    } else if (profile.connections > 500) {
      score += 2;
      confidenceBoost += 0.05;
      rationale.push('Strong network influence (500+ connections)');
    }

    // Seniority and tenure indicators
    if (profile.isAboveTheLine) {
      score += 2;
      confidenceBoost += 0.05;
      rationale.push('Above-the-line seniority detected');
    }

    // Influence score validation
    if (profile.influenceScore > 15) {
      score += 2;
      confidenceBoost += 0.05;
      rationale.push('High influence score detected');
    }

    return { score, confidenceBoost, rationale };
  }
}
