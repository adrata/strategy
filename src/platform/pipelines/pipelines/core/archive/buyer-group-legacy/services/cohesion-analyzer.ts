/**
 * COHESION ANALYZER
 * 
 * Analyzes buyer group cohesion and connectivity for enterprise sales
 */

import { PersonProfile, SellerProfile } from './types';

export interface CohesionAnalysis {
  cohesionScore: number;
  cohesionLevel: string;
  primaryBusinessUnit: string;
  departmentClusters: string[];
  networkStrength: number;
  recommendations: string[];
}

export class CohesionAnalyzer {

  /**
   * DUAL-LAYER ENTERPRISE BUYER GROUP COHESION ANALYSIS
   * LAYER 1: Subsidiary cohesion (Dell Technologies, Dell EMC, etc.)
   * LAYER 2: Functional diversity (Sales, IT, Finance, etc.)
   */
  analyzeBuyerGroupCohesion(profiles: PersonProfile[], sellerProfile: SellerProfile): CohesionAnalysis {
    // LAYER 1: SUBSIDIARY COHESION ANALYSIS
    const subsidiaryGroups = this.groupBySubsidiary(profiles);
    const subsidiaryCohesion = this.calculateSubsidiaryCohesion(subsidiaryGroups);
    
    // LAYER 2: FUNCTIONAL DIVERSITY ANALYSIS
    const departmentGroups = this.groupByDepartment(profiles);
    const departmentDiversity = this.calculateDepartmentDiversity(departmentGroups);
    
    // LAYER 3: NETWORK INFLUENCE ANALYSIS
    const networkInfluence = this.analyzeNetworkInfluence(profiles);
    // LAYER 4: ORGANIZATIONAL AUTHORITY
    const authorityAlignment = this.calculateAuthorityAlignment(profiles);
    // LAYER 5: STRATEGIC BUSINESS UNIT FOCUS
    const businessUnitFocus = this.analyzeBusinessUnitFocus(profiles, sellerProfile);
    // ENTERPRISE COHESION SCORING - Dual-layer weighted approach
    const cohesionScore = Math.round(
      subsidiaryCohesion.score * 0.30 +           // Subsidiary alignment (critical for enterprise)
      departmentDiversity.score * 0.25 +          // Functional coverage (critical for completeness)
      businessUnitFocus.score * 0.20 +            // Business alignment (important for relevance)
      authorityAlignment.score * 0.15 +           // Authority alignment (important for decisions)
      networkInfluence.averageScore * 0.10        // Network influence (valuable for reach)
    );
    
    // COHESION LEVEL CLASSIFICATION
    let cohesionLevel = 'Unknown';
    if (cohesionScore >= 85) cohesionLevel = 'Excellent';
    else if (cohesionScore >= 70) cohesionLevel = 'Very Good';
    else if (cohesionScore >= 55) cohesionLevel = 'Good';
    else if (cohesionScore >= 40) cohesionLevel = 'Fair';
    else cohesionLevel = 'Poor';
    
    // INTELLIGENT RECOMMENDATIONS
    const recommendations = this.generateCohesionRecommendations(
      subsidiaryCohesion, 
      departmentDiversity, 
      authorityAlignment, 
      networkInfluence, 
      businessUnitFocus,
      sellerProfile
    );
    
    return {
      cohesionScore,
      cohesionLevel,
      primaryBusinessUnit: subsidiaryCohesion.primarySubsidiary,
      departmentClusters: departmentDiversity.functionalCoverage,
      networkStrength: networkInfluence.averageScore,
      recommendations
    };
  }

  /**
   * Group profiles by company/subsidiary for enterprise organizations
   */
  private groupBySubsidiary(profiles: PersonProfile[]): Map<string, PersonProfile[]> {
    const groups = new Map<string, PersonProfile[]>();
    
    profiles.forEach(profile => {
      const company = this.normalizeCompanyName(profile.company || 'Unknown');
      if (!groups.has(company)) {
        groups.set(company, []);
      }
      groups.get(company)?.push(profile);
    });
    
    return groups;
  }

  /**
   * Calculate subsidiary cohesion score (enterprise-focused)
   */
  private calculateSubsidiaryCohesion(subsidiaryGroups: Map<string, PersonProfile[]>): {
    score: number;
    primarySubsidiary: string;
  } {
    const totalProfiles = Array.from(subsidiaryGroups.values()).reduce((sum, group) => sum + group.length, 0);
    
    // Calculate distribution
    const distribution = Array.from(subsidiaryGroups.entries())
      .map(([subsidiary, profiles]) => ({
        subsidiary,
        count: profiles.length,
        percentage: Math.round((profiles.length / totalProfiles) * 100)
      }))
      .sort((a, b) => b.count - a.count);
    
    const primarySubsidiary = distribution[0]?.subsidiary || 'Unknown';
    const primaryPercentage = distribution[0]?.percentage || 0;
    
    let score = 0;
    if (primaryPercentage >= 80) score = 95;      // Excellent: Single subsidiary
    else if (primaryPercentage >= 60) score = 85; // Very Good: Primary subsidiary dominates
    else if (primaryPercentage >= 40) score = 70; // Good: Clear primary subsidiary
    else if (primaryPercentage >= 25) score = 50; // Fair: Some concentration
    else score = 25;                              // Poor: Too scattered
    
    return { score, primarySubsidiary };
  }

  /**
   * Group profiles by department for functional analysis
   */
  private groupByDepartment(profiles: PersonProfile[]): Map<string, PersonProfile[]> {
    const groups = new Map<string, PersonProfile[]>();
    
    profiles.forEach(profile => {
      const dept = this.normalizeDepartmentName(profile.department || 'Unknown');
      if (!groups.has(dept)) {
        groups.set(dept, []);
      }
      groups.get(dept)?.push(profile);
    });
    
    return groups;
  }

  /**
   * Calculate department diversity score (functional cross-representation)
   */
  private calculateDepartmentDiversity(departmentGroups: Map<string, PersonProfile[]>): {
    score: number;
    functionalCoverage: string[];
  } {
    const departments = Array.from(departmentGroups.keys());
    
    // Key functions that should be represented in enterprise buyer groups
    const keyFunctions = ['Sales & Revenue', 'Operations', 'Technology', 'Finance', 'Marketing'];
    const coveredFunctions = departments.filter(dept => keyFunctions.includes(dept));
    
    // Score based on functional coverage
    const coveragePercentage = (coveredFunctions.length / keyFunctions.length) * 100;
    
    // Balance diversity with focus
    const departmentCount = departments.length;
    let balanceScore = 100;
    if (departmentCount > 6) balanceScore = 70;      // Too scattered
    else if (departmentCount > 4) balanceScore = 85; // Good diversity
    else if (departmentCount >= 2) balanceScore = 95; // Ideal diversity
    else balanceScore = 60;                           // Too narrow
    
    const score = (coveragePercentage * 0.6) + (balanceScore * 0.4);
    
    return {
      score: Math.round(score),
      functionalCoverage: coveredFunctions
    };
  }

  /**
   * Analyze network influence using profile data
   */
  private analyzeNetworkInfluence(profiles: PersonProfile[]): {
    averageScore: number;
    topInfluencers: string[];
  } {
    if (profiles['length'] === 0) {
      return { averageScore: 0, topInfluencers: [] };
    }

    const influenceScores = profiles.map(profile => {
      const connections = profile.connections || 0;
      
      // Normalize influence score (0-100)
      let score = 0;
      score += Math.min(30, (connections / 500) * 30);        // Max 30 points for connections
      score += Math.min(40, (profile.influenceScore / 20) * 40); // Max 40 points based on influence score
      score += profile.isAboveTheLine ? 30 : 0;               // 30 points for above-the-line
      
      return {
        name: profile.name,
        score: Math.round(score)
      };
    });
    
    const averageScore = influenceScores.length > 0 
      ? influenceScores.reduce((sum, item) => sum + item.score, 0) / influenceScores.length
      : 0;
    
    const topInfluencers = influenceScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.name);
    
    return {
      averageScore: Math.round(averageScore),
      topInfluencers
    };
  }

  /**
   * Calculate authority alignment using profile data
   */
  private calculateAuthorityAlignment(profiles: PersonProfile[]): { score: number } {
    if (profiles['length'] === 0) {
      return { score: 0 };
    }

    const authorityScores = profiles.map(profile => {
      let score = 0;
      
      // Seniority level scoring
      const seniorityScores = {
        'C-Level': 40,
        'VP': 30,
        'Director': 20,
        'Manager': 10,
        'IC': 5
      };
      score += seniorityScores[profile.seniorityLevel] || 0;
      
      // Above the line bonus
      if (profile.isAboveTheLine) score += 20;
      
      // Influence score bonus
      if (profile.influenceScore > 15) score += 20;
      else if (profile.influenceScore > 10) score += 10;
      
      return score;
    });
    
    const averageAuthority = authorityScores.length > 0 
      ? authorityScores.reduce((sum, score) => sum + score, 0) / authorityScores.length
      : 0;
    
    return { score: Math.min(100, averageAuthority) };
  }

  /**
   * Analyze business unit focus
   */
  private analyzeBusinessUnitFocus(profiles: PersonProfile[], sellerProfile: SellerProfile): {
    score: number;
    primaryUnit: string;
  } {
    const targetDepartments = sellerProfile.targetDepartments || ['sales', 'revenue operations'];
    
    const relevantProfiles = profiles.filter(profile => {
      const dept = profile.department.toLowerCase();
      return targetDepartments.some(target => dept.includes(target.toLowerCase()));
    });
    
    const focusPercentage = (relevantProfiles.length / profiles.length) * 100;
    const primaryUnit = targetDepartments[0] || 'Sales';
    
    return {
      score: Math.round(focusPercentage),
      primaryUnit
    };
  }

  /**
   * Generate intelligent recommendations
   */
  private generateCohesionRecommendations(
    subsidiaryCohesion: any,
    departmentDiversity: any, 
    authorityAlignment: any,
    networkInfluence: any,
    businessUnitFocus: any,
    sellerProfile: SellerProfile
  ): string[] {
    const recommendations: string[] = [];
    
    if (subsidiaryCohesion.score < 60) {
      recommendations.push(`⚠️ Low subsidiary cohesion (${subsidiaryCohesion.score}/100) - consider focusing on ${subsidiaryCohesion.primarySubsidiary} employees`);
    }
    
    if (departmentDiversity.score < 50) {
      const missing = ['Sales & Revenue', 'Operations', 'Technology', 'Finance', 'Marketing']
        .filter(func => !departmentDiversity.functionalCoverage.includes(func));
      recommendations.push(`⚠️ Limited functional coverage - missing: ${missing.join(', ')}`);
    }
    
    if (authorityAlignment.score < 50) {
      recommendations.push(`⚠️ Low authority alignment (${authorityAlignment.score}/100) - need more senior stakeholders`);
    }
    
    if (networkInfluence.averageScore < 40) {
      recommendations.push(`⚠️ Weak network influence (${networkInfluence.averageScore}/100) - may lack organizational reach`);
    }
    
    if (businessUnitFocus.score < 40) {
      recommendations.push(`⚠️ Poor business alignment - need more ${sellerProfile.targetDepartments?.join('/')} focused roles`);
    }
    
    return recommendations;
  }

  /**
   * Normalize company names for consistent subsidiary grouping
   */
  private normalizeCompanyName(company: string): string {
    let normalized = company.toLowerCase().trim();
    
    // Dell-specific subsidiary normalization
    if (normalized.includes('dell')) {
      if (normalized.includes('technologies')) return 'Dell Technologies';
      if (normalized.includes('emc')) return 'Dell EMC';
      if (normalized.includes('boomi')) return 'Dell Boomi';
      if (normalized.includes('secureworks')) return 'Dell SecureWorks';
      if (normalized.includes('services')) return 'Dell Services';
      return 'Dell Technologies';
    }
    
    // General enterprise subsidiary patterns
    if (normalized.includes('microsoft')) {
      if (normalized.includes('azure')) return 'Microsoft Azure';
      if (normalized.includes('office')) return 'Microsoft 365';
      return 'Microsoft Corporation';
    }
    
    if (normalized.includes('amazon')) {
      if (normalized.includes('aws')) return 'Amazon Web Services';
      return 'Amazon';
    }
    
    return company;
  }

  /**
   * Normalize department names for consistent grouping
   */
  private normalizeDepartmentName(department: string): string {
    const normalized = department.toLowerCase().trim();
    
    // Sales function consolidation
    if (normalized.includes('sales') || normalized.includes('revenue') || normalized.includes('commercial')) {
      return 'Sales & Revenue';
    }
    
    // Operations consolidation
    if (normalized.includes('operations') || normalized.includes('ops')) {
      return 'Operations';
    }
    
    // IT/Technology consolidation
    if (normalized.includes('technology') || normalized.includes('information') || normalized.includes('engineering')) {
      return 'Technology';
    }
    
    // Marketing consolidation
    if (normalized.includes('marketing') || normalized.includes('brand') || normalized.includes('communications')) {
      return 'Marketing';
    }
    
    // Finance consolidation
    if (normalized.includes('finance') || normalized.includes('accounting') || normalized.includes('financial')) {
      return 'Finance';
    }
    
    return department;
  }
}
