/**
 * 🧠 INFLUENCE CALCULATOR
 * 
 * Calculates comprehensive influence scoring for buyer group members
 */

import { PersonProfile, BuyerGroupRole, SellerProfile } from './types';

export class InfluenceCalculator {

  /**
   * Calculate overall importance score for a buyer group member (0-100)
   */
  calculateImportanceScore(
    member: BuyerGroupRole,
    roleType: keyof any,
    profiles: PersonProfile[],
    sellerProfile: SellerProfile
  ): number {
    let importance = 0;
    
    // Base importance by role type (for $250K-$1M enterprise deal)
    const roleBaseScores = {
      decision: 90,    // Critical for enterprise deals
      champion: 75,    // Essential for internal selling
      stakeholder: 50, // Important for influence
      blocker: 80,     // High risk if not managed
      introducer: 40   // Important for access
    };
    
    importance = (roleBaseScores as any)[roleType] || 50;
    
    // Adjust for ranking within role (lead gets +10)
    if (member.isLead) {
      importance += 10;
    } else if (member['rank'] && member.rank <= 2) {
      importance += 5; // Top 2 get bonus
    }
    
    // Adjust for confidence (high confidence = more important)
    importance += (member.confidence - 0.5) * 20; // -10 to +10 adjustment
    
    // Adjust for deal size criticality 
    if (sellerProfile['dealSize'] === 'enterprise' && roleType === 'decision') {
      importance += 5; // Decision makers more critical for enterprise
    }
    
    // Strategic weighting based on sales experience
    const profile = profiles.find(p => p['id'] === member.personId);
    if (profile) {
      importance += this.calculateExperienceBonus(profile);
    }
    
    // Cap at 100
    return Math.min(100, Math.max(0, importance));
  }

  /**
   * COMPREHENSIVE INFLUENCE SCORING
   * Uses all available data to identify truly influential stakeholders
   */
  calculateComprehensiveInfluence(
    profile: PersonProfile, 
    role: BuyerGroupRole, 
    roleType: string
  ): number {
    let influence = 0;
    
    // 1. NETWORK INFLUENCE (0-25 points)
    const connections = profile.connections || 0;
    influence += Math.min(10, (connections / 500) * 10);         // Max 10 points for connections
    influence += Math.min(10, (profile.influenceScore / 20) * 10); // Max 10 points for influence score
    influence += profile.isAboveTheLine ? 5 : 0;                 // 5 points for above-the-line
    
    // 2. ORGANIZATIONAL AUTHORITY (0-35 points)
    influence += this.calculateAuthorityInfluence(profile);
    
    // 3. ROLE-SPECIFIC WEIGHTING (0-20 points)
    influence += this.calculateRoleSpecificInfluence(profile, roleType);
    
    // 4. EXPERIENCE & TENURE (0-10 points)
    influence += this.calculateExperienceInfluence(profile);
    
    // 5. CONFIDENCE BOOST (0-10 points)
    influence += role.confidence * 10;
    
    return Math.round(influence);
  }

  /**
   * Calculate authority-based influence
   */
  private calculateAuthorityInfluence(profile: PersonProfile): number {
    let score = 0;
    
    // Seniority level scoring
    const seniorityScores = {
      'C-Level': 15,
      'VP': 12,
      'Director': 8,
      'Manager': 5,
      'IC': 2
    };
    
    score += seniorityScores[profile.seniorityLevel] || 0;
    
    // Management level indicators
    const titleLower = profile.title.toLowerCase();
    if (titleLower.includes('chief') || titleLower.includes('ceo')) score += 10;
    else if (titleLower.includes('senior vice president') || titleLower.includes('svp')) score += 8;
    else if (titleLower.includes('vice president') || titleLower.includes('vp')) score += 6;
    else if (titleLower.includes('senior director')) score += 4;
    else if (titleLower.includes('director')) score += 3;
    
    return Math.min(15, score);
  }

  /**
   * Calculate role-specific influence weighting
   */
  private calculateRoleSpecificInfluence(profile: PersonProfile, roleType: string): number {
    const titleLower = profile.title.toLowerCase();
    const deptLower = profile.department.toLowerCase();
    let score = 0;
    
    if (roleType === 'decision') {
      // Decision makers: Authority + Budget Control
      if (titleLower.includes('ceo') || titleLower.includes('cfo') || titleLower.includes('cro')) score += 20;
      else if (titleLower.includes('vp') && (deptLower.includes('sales') || deptLower.includes('revenue'))) score += 15;
      else if (titleLower.includes('director') && deptLower.includes('sales')) score += 10;
    }
    else if (roleType === 'champion') {
      // Champions: Implementation Power + User Advocacy
      if (titleLower.includes('manager') && deptLower.includes('sales')) score += 15;
      else if (titleLower.includes('operations') || titleLower.includes('enablement')) score += 12;
      else if (titleLower.includes('analyst') && deptLower.includes('sales')) score += 8;
    }
    else if (roleType === 'stakeholder') {
      // Stakeholders: Influence + Cross-functional Impact
      if (titleLower.includes('director')) score += 10;
      else if (titleLower.includes('senior') || titleLower.includes('lead')) score += 8;
      else if (titleLower.includes('principal') || titleLower.includes('architect')) score += 6;
    }
    
    return Math.min(20, score);
  }

  /**
   * Calculate experience-based influence
   */
  private calculateExperienceInfluence(profile: PersonProfile): number {
    let score = 0;
    
    // Tenure at current company
    const tenure = profile.currentExperience?.tenure || 0;
    if (tenure > 120) score += 5;      // 10+ years
    else if (tenure > 60) score += 3;  // 5+ years
    else if (tenure > 24) score += 2;  // 2+ years
    else if (tenure < 6) score -= 2;   // Less than 6 months (flight risk)
    
    // Overall influence score
    if (profile.influenceScore > 15) score += 3;
    else if (profile.influenceScore > 10) score += 2;
    else if (profile.influenceScore > 5) score += 1;
    
    return Math.min(10, score);
  }

  /**
   * Calculate experience bonus for importance scoring
   */
  private calculateExperienceBonus(profile: PersonProfile): number {
    const titleLower = profile.title.toLowerCase();
    let bonus = 0;
    
    // Direct sales experience (highest value)
    if (titleLower.includes('account executive') || 
        titleLower.includes('sales rep') || 
        titleLower.includes('territory manager')) {
      bonus += 3;
    }
    // Sales leadership (high value)
    else if (titleLower.includes('director sales') || 
             titleLower.includes('vp sales') || 
             titleLower.includes('head of sales')) {
      bonus += 2;
    }
    // Sales-adjacent roles (medium value)
    else if (titleLower.includes('customer success') || 
             titleLower.includes('business development')) {
      bonus += 1;
    }
    
    return bonus;
  }

  /**
   * Add strategic ranking and chief designation to roles
   */
  addRankingAndChiefs(
    roles: any, 
    profiles: PersonProfile[], 
    sellerProfile: SellerProfile
  ): any {
    const rankedRoles = { ...roles };
    
    // Process each role type with enhanced ranking
    Object.keys(rankedRoles).forEach(roleType => {
      const roleMembers = rankedRoles[roleType];
      
      if (roleMembers['length'] === 0) return;
      
      // Multi-dimensional ranking algorithm
      const sortedMembers = [...roleMembers].sort((a, b) => {
        const profileA = profiles.find(p => p['id'] === a.personId);
        const profileB = profiles.find(p => p['id'] === b.personId);
        
        if (!profileA || !profileB) {
          return b.score - a.score; // Fallback to basic score
        }
        
        // Calculate comprehensive influence score
        const influenceA = this.calculateComprehensiveInfluence(profileA, a, roleType);
        const influenceB = this.calculateComprehensiveInfluence(profileB, b, roleType);
        
        if (influenceA !== influenceB) return influenceB - influenceA;
        
        // Secondary sort by original score
        if (a.score !== b.score) return b.score - a.score;
        
        // Tertiary sort by confidence
        return b.confidence - a.confidence;
      });
      
      // Add ranking and importance scores
      sortedMembers.forEach((member, index) => {
        member['rank'] = index + 1;
        member['isLead'] = index === 0; // Lead person in this role (replaces "Chief")
        member['importanceScore'] = this.calculateImportanceScore(
          member, 
          roleType, 
          profiles, 
          sellerProfile
        );
      });
      
      // Update the roles array with ranked members
      rankedRoles[roleType] = sortedMembers;
    });
    
    return rankedRoles;
  }
}
