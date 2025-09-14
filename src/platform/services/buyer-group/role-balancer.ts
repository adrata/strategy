/**
 * ⚖️ ROLE BALANCER
 * 
 * Ensures realistic role distribution based on enterprise dynamics
 */

import { BuyerGroup, BuyerGroupRole, SellerProfile, PersonProfile } from './types';

export interface RoleBalanceResult {
  roles: BuyerGroup['roles'];
  metrics: {
    distributionScore: number;
    meetsTargets: boolean;
    gaps: string[];
    warnings: string[];
  };
  actions: {
    promoted: Array<{ personId: number; from: string; to: string; reason: string }>;
    demoted: Array<{ personId: number; from: string; to: string; reason: string }>;
  };
}

export class RoleBalancer {

  /**
   * Balance roles ensuring realistic distribution
   */
  balanceRoles(
    roles: BuyerGroup['roles'], 
    profiles: PersonProfile[],
    sellerProfile: SellerProfile
  ): RoleBalanceResult {
    const actions = { promoted: [], demoted: [] };
    const warnings: string[] = [];
    
    // Get realistic targets based on deal size and complexity
    const roleTargets = this.getRealisticRoleTargets(sellerProfile);
    
    // Apply decision maker caps with intelligent demotion
    this.applyDecisionMakerCaps(roles, roleTargets, actions, profiles);
    
    // Ensure minimum viable roles are met
    this.ensureMinimumViableRoles(roles, roleTargets, actions);
    
    // Check for warnings
    this.checkRoleWarnings(roles, roleTargets, warnings);
    
    // Calculate distribution score
    const distributionScore = this.calculateDistributionScore(roles, roleTargets);
    const gaps = this.identifyGaps(roles, roleTargets);
    
    return {
      roles,
      metrics: {
        distributionScore,
        meetsTargets: gaps['length'] === 0,
        gaps,
        warnings
      },
      actions: actions as any
    };
  }

  /**
   * Get realistic role targets based on enterprise deal context
   */
  private getRealisticRoleTargets(sellerProfile: SellerProfile): {
    decision: { min: number; max: number; ideal: number };
    champion: { min: number; max: number; ideal: number };
    stakeholder: { min: number; max: number; ideal: number };
    blocker: { min: number; max: number; ideal: number };
    introducer: { min: number; max: number; ideal: number };
  } {
    // RESEARCH-BASED TARGETS: Based on Gartner/CEB studies showing 5.4 avg buyer group
    const dealComplexity = {
      small: { decision: { min: 1, max: 2, ideal: 1 }, champion: { min: 1, max: 2, ideal: 1 } },
      medium: { decision: { min: 1, max: 2, ideal: 1 }, champion: { min: 1, max: 2, ideal: 2 } },
      large: { decision: { min: 1, max: 2, ideal: 1 }, champion: { min: 2, max: 3, ideal: 2 } },
      enterprise: { decision: { min: 1, max: 2, ideal: 1 }, champion: { min: 2, max: 3, ideal: 2 } }
    };

    const baseTargets = (dealComplexity as any)[sellerProfile.dealSize] || dealComplexity.medium;
    
    return {
      decision: baseTargets.decision,
      champion: baseTargets.champion,
      stakeholder: { min: 1, max: 3, ideal: 2 },
      blocker: { min: 1, max: 2, ideal: 1 },
      introducer: { min: 2, max: 3, ideal: 2 }
    };
  }

  /**
   * Apply decision maker caps with intelligent demotion logic
   */
  private applyDecisionMakerCaps(
    roles: BuyerGroup['roles'], 
    targets: any, 
    actions: any,
    profiles: PersonProfile[]
  ): void {
    if (roles.decision.length <= targets.decision.max) return;

    // Sort decision makers by priority
    roles.decision.sort((a, b) => {
      const aScore = this.calculateDecisionMakerPriority(a, profiles);
      const bScore = this.calculateDecisionMakerPriority(b, profiles);
      return bScore - aScore;
    });

    // Keep top decision makers, demote excess to champions
    const toKeep = roles.decision.slice(0, targets.decision.max);
    const toDemote = roles.decision.slice(targets.decision.max);

    toDemote.forEach(dm => {
      const demotedChampion: BuyerGroupRole = {
        ...dm,
        role: 'champion',
        score: dm.score * 0.9,
        rationale: [...dm.rationale, `Demoted from decision maker: exceeds realistic decision maker count for ${targets.decision.max} max`]
      };
      
      roles.champion.push(demotedChampion);
      actions.demoted.push({
        personId: dm.personId,
        from: 'decision',
        to: 'champion',
        reason: 'Exceeded maximum decision makers allowed'
      });
    });

    roles['decision'] = toKeep;
  }

  /**
   * Ensure minimum viable roles are met through intelligent promotion
   */
  private ensureMinimumViableRoles(roles: BuyerGroup['roles'], targets: any, actions: any): void {
    // Ensure at least 1 decision maker
    if (roles['decision']['length'] === 0 && roles.champion.length > 0) {
      const topChampion = roles.champion.sort((a, b) => b.score - a.score)[0];
      if (topChampion) {
        const promotedDecision: BuyerGroupRole = {
          ...topChampion,
          role: 'decision',
          rationale: [...topChampion.rationale, 'Promoted from champion: ensuring minimum 1 decision maker']
        };
        
        roles.decision.push(promotedDecision);
        roles['champion'] = roles.champion.filter(c => c.personId !== topChampion.personId);
        
        actions.promoted.push({
          personId: topChampion.personId,
          from: 'champion',
          to: 'decision',
          reason: 'No decision makers found - promoted highest scoring champion'
        });
      }
    }
  }

  /**
   * Calculate priority score for decision maker ranking
   */
  private calculateDecisionMakerPriority(role: BuyerGroupRole, profiles: PersonProfile[]): number {
    const profile = profiles.find(p => p['id'] === role.personId);
    if (!profile) return role.score;

    let multiplier = 1;
    const titleLower = profile.title.toLowerCase();
    
    if (titleLower.includes('svp') || titleLower.includes('senior vice president')) {
      multiplier = 1.3;
    } else if (titleLower.includes('vp') || titleLower.includes('vice president')) {
      multiplier = 1.2;
    } else if (titleLower.includes('director')) {
      multiplier = 1.1;
    }
    
    return role.score * multiplier;
  }

  /**
   * Calculate distribution score (0-100)
   */
  private calculateDistributionScore(roles: BuyerGroup['roles'], targets: any): number {
    let score = 100;
    
    // Check each role type against targets
    Object.keys(targets).forEach(roleType => {
      const actual = roles[roleType as keyof typeof roles]?.length || 0;
      const target = targets[roleType];
      
      if (actual < target.min) {
        score -= (target.min - actual) * 10; // -10 points per missing role
      } else if (actual > target.max) {
        score -= (actual - target.max) * 5;  // -5 points per excess role
      }
    });
    
    return Math.max(0, score);
  }

  /**
   * Identify gaps in role coverage
   */
  private identifyGaps(roles: BuyerGroup['roles'], targets: any): string[] {
    const gaps: string[] = [];
    
    Object.keys(targets).forEach(roleType => {
      const actual = roles[roleType as keyof typeof roles]?.length || 0;
      const target = targets[roleType];
      
      if (actual < target.min) {
        gaps.push(`${roleType}: have ${actual}, need minimum ${target.min}`);
      }
    });
    
    return gaps;
  }

  /**
   * Check for role distribution warnings
   */
  private checkRoleWarnings(roles: BuyerGroup['roles'], targets: any, warnings: string[]): void {
    // Too many decision makers
    if (roles.decision.length > 2) {
      warnings.push('High number of decision makers may slow decision process');
    }
    
    // No champions
    if (roles['champion']['length'] === 0) {
      warnings.push('No champions identified - may struggle with internal selling');
    }
    
    // Too many blockers
    if (roles.blocker.length > 2) {
      warnings.push('Multiple blockers identified - high risk scenario');
    }
    
    // No introducers
    if (roles['introducer']['length'] === 0) {
      warnings.push('No introducers identified - may have access challenges');
    }
    
    // Very large buyer group
    const totalMembers = Object.values(roles).flat().length;
    if (totalMembers > 15) {
      warnings.push('Very large buyer group - may be too complex to manage effectively');
    }
  }

  /**
   * Trim roles to a target maximum size while preserving role coverage
   */
  trimRolesToSize(
    roles: BuyerGroup['roles'],
    profiles: PersonProfile[],
    maxSize: number
  ): BuyerGroup['roles'] {
    const roleOrder: Array<keyof BuyerGroup['roles']> = ['decision', 'champion', 'stakeholder', 'blocker', 'introducer'];
    
    // Sort each role bucket by score desc
    for (const key of roleOrder) {
      roles[key] = roles[key].sort((a, b) => b.score - a.score);
    }
    
    const selected: BuyerGroup['roles'] = { decision: [], champion: [], stakeholder: [], blocker: [], introducer: [] };
    
    // Always include top decision maker and champion
    const pushIfAvailable = (key: keyof BuyerGroup['roles']) => { 
      if (roles[key][0]) selected[key].push(roles[key][0]); 
    };
    
    pushIfAvailable('decision');
    pushIfAvailable('champion');

    // Create pool of remaining members sorted by score
    const pool: BuyerGroupRole[] = [
      ...roles.decision.slice(1),
      ...roles.champion.slice(1),
      ...roles.stakeholder,
      ...roles.blocker,
      ...roles.introducer
    ].sort((a, b) => b.score - a.score);

    const already = new Set<number>([...selected.decision, ...selected.champion].map(r => r.personId));
    
    for (const r of pool) {
      if (already.has(r.personId)) continue;
      
      const bucket = r.role as keyof BuyerGroup['roles'];
      selected[bucket].push(r);
      already.add(r.personId);
      
      const total = Object.values(selected).flat().length;
      if (total >= maxSize) break;
    }

    return selected;
  }
}
