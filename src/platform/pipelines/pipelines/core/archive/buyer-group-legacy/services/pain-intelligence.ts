/**
 * 🔥 PAIN INTELLIGENCE ENGINE
 * 
 * Analyzes professional signals to identify pain points and buying opportunities
 */

import { CoreSignalProfile, SellerProfile, PainIntelligence, Challenge, BuyingSignal, EngagementStrategy } from './types';

export class PainIntelligenceEngine {
  
  /**
   * Analyze solution-relevant pain signals for a single profile
   */
  async analyzePainSignals(profile: CoreSignalProfile, sellerProfile: SellerProfile, companyName: string): Promise<PainIntelligence> {
    const challenges: Challenge[] = [];
    const buyingSignals: BuyingSignal[] = [];
    let painScore = 0;
    let urgencyLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Only analyze pain signals relevant to what the seller's solution can actually solve
    const relevantFunctions = this.getRelevantFunctions(sellerProfile);
    const roleRelevance = this.calculateRoleRelevance(profile, sellerProfile);
    
    // Skip pain analysis if this profile isn't relevant to the solution
    if (roleRelevance < 0.3) {
      return {
        primaryChallenges: [],
        painScore: 0,
        urgencyLevel: 'low',
        buyingSignals: [],
        engagementStrategy: this.generateEngagementStrategy([], [], profile, sellerProfile),
        lastUpdated: new Date().toISOString()
      };
    }

    // 🔍 SIGNAL 1: Recent Job Changes (Only if role-relevant)
    if (profile['experience_recently_started'] && roleRelevance > 0.6) {
      const painDescription = this.getNewRolePainDescription(sellerProfile);
      challenges.push({
        category: 'operational',
        description: painDescription,
        confidence: 0.8,
        urgency: 8,
        evidence: ['Recently started current position'],
        suggestedSolution: this.getSolutionDescription(sellerProfile, 'new_role')
      });
      buyingSignals.push({
        type: 'technology_change',
        strength: 0.9,
        description: 'New role creates opportunity to evaluate and change existing tools',
        timeframe: '0-6 months',
        source: 'job_change_timing'
      });
      painScore += 25;
    }

    // 🔍 SIGNAL 2: Seniority vs Experience Gap (Under-equipped)
    const tenureMonths = profile.total_experience_duration_months || 0;
    const isManager = profile.active_experience_title?.toLowerCase().includes('manager') || 
                      profile.active_experience_title?.toLowerCase().includes('director') ||
                      profile.active_experience_title?.toLowerCase().includes('vp');
    
    if (isManager && tenureMonths < 36) { // Senior role but <3 years experience
      challenges.push({
        category: 'strategic',
        description: 'Rapid promotion likely creating capability gaps',
        confidence: 0.7,
        urgency: 7,
        evidence: ['Senior title with limited experience duration'],
        suggestedSolution: 'Position as accelerator for leadership effectiveness'
      });
      painScore += 20;
    }

    // 🔍 SIGNAL 3: Low Network/Influence (Isolation Signal)
    if (profile['connections_count'] && profile.connections_count < 500) {
      challenges.push({
        category: 'operational',
        description: 'Limited professional network may indicate need for better visibility/tools',
        confidence: 0.6,
        urgency: 5,
        evidence: [`Only ${profile.connections_count} professional connections`],
        suggestedSolution: 'Tools that enhance professional credibility and network effects'
      });
      painScore += 15;
    }

    // 🔍 SIGNAL 4: Company Growth/Scaling Challenges
    if (profile.active_experience_title?.toLowerCase().includes('growth') || 
        profile.active_experience_title?.toLowerCase().includes('scale') ||
        profile.active_experience_title?.toLowerCase().includes('expansion')) {
      challenges.push({
        category: 'strategic',
        description: 'Scaling organization creating operational complexity',
        confidence: 0.8,
        urgency: 8,
        evidence: ['Growth/scaling-focused role title'],
        suggestedSolution: 'Scalable solutions to handle increased complexity'
      });
      buyingSignals.push({
        type: 'growth',
        strength: 0.8,
        description: 'Company in scaling phase, likely evaluating tools for efficiency',
        timeframe: '3-12 months',
        source: 'role_analysis'
      });
      painScore += 30;
    }

    // 🔍 SIGNAL 5: Budget Authority Indicators (High-Stakes Decision Making)
    if (profile.is_decision_maker || 
        profile.active_experience_title?.toLowerCase().includes('vp') ||
        profile.active_experience_title?.toLowerCase().includes('director')) {
      
      buyingSignals.push({
        type: 'budget_increase',
        strength: 0.7,
        description: 'Decision-making authority suggests budget control',
        timeframe: 'Annual planning cycles',
        source: 'title_analysis'
      });
      
      // Decision makers have higher urgency on all challenges
      challenges.forEach(challenge => challenge.urgency += 2);
      painScore += 10;
    }

    // 🔍 SIGNAL 6: Solution-Specific Pain Points (Only relevant pain)
    const solutionSpecificPain = this.identifySolutionSpecificPain(profile, sellerProfile);
    if (solutionSpecificPain) {
      challenges.push(solutionSpecificPain);
      painScore += solutionSpecificPain.urgency * 4; // Weight solution-relevant pain higher
    }

    // 🔍 SIGNAL 7: Hiring Activity (Team Scaling)
    const isHiringRole = profile.active_experience_title?.toLowerCase().includes('lead') ||
                        profile.active_experience_title?.toLowerCase().includes('head') ||
                        profile.active_experience_title?.toLowerCase().includes('manager');
    
    if (isHiringRole) {
      buyingSignals.push({
        type: 'hiring',
        strength: 0.6,
        description: 'Leadership role suggests potential team expansion',
        timeframe: '1-6 months',
        source: 'role_inference'
      });
      painScore += 15;
    }

    // Calculate urgency level based on pain score
    if (painScore >= 80) urgencyLevel = 'critical';
    else if (painScore >= 60) urgencyLevel = 'high';
    else if (painScore >= 30) urgencyLevel = 'medium';

    // Generate engagement strategy
    const engagementStrategy = this.generateEngagementStrategy(challenges, buyingSignals, profile, sellerProfile);

    return {
      primaryChallenges: challenges.sort((a, b) => (b.urgency * b.confidence) - (a.urgency * a.confidence)).slice(0, 5),
      painScore,
      urgencyLevel,
      buyingSignals,
      engagementStrategy,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Generate personalized engagement strategy based on pain analysis
   */
  private generateEngagementStrategy(
    challenges: Challenge[],
    buyingSignals: BuyingSignal[],
    profile: CoreSignalProfile,
    sellerProfile: SellerProfile
  ): EngagementStrategy {
    
    const topChallenge = challenges[0];
    const strongestSignal = buyingSignals.sort((a, b) => b.strength - a.strength)[0];
    
    let approach: 'consultative' | 'technical' | 'financial' | 'executive' = 'consultative';
    let messagingAngle = 'Operational efficiency and growth enablement';
    let valueProposition = 'Accelerate your success with proven solutions';
    
    // Customize approach based on role and challenges
    if (profile.is_decision_maker) {
      approach = 'executive';
      messagingAngle = 'Strategic advantage and competitive differentiation';
      valueProposition = `Transform ${topChallenge?.category || 'operational'} challenges into competitive advantages`;
    } else if (topChallenge?.category === 'technical') {
      approach = 'technical';
      messagingAngle = 'Technical excellence and implementation success';
      valueProposition = 'Solve complex technical challenges with proven architecture';
    } else if (strongestSignal?.type === 'budget_increase') {
      approach = 'financial';
      messagingAngle = 'ROI optimization and cost management';
      valueProposition = 'Maximize budget impact with measurable returns';
    }

    const urgencyTriggers = challenges
      .filter(c => c.urgency >= 7)
      .map(c => c.description);

    const recommendedTiming = strongestSignal?.timeframe || '1-3 months';
    
    const collateral = this.selectCollateral(approach, topChallenge?.category, sellerProfile);

    return {
      approach,
      messagingAngle,
      valueProposition,
      urgencyTriggers,
      recommendedTiming,
      collateral
    };
  }

  /**
   * Select appropriate sales collateral based on approach and challenges
   */
  private selectCollateral(
    approach: string,
    challengeCategory?: string,
    sellerProfile?: SellerProfile
  ): string[] {
    
    const base = ['Product Demo', 'ROI Calculator'];
    
    if (approach === 'executive') {
      return [...base, 'Executive Brief', 'Industry Benchmarks', 'Competitive Analysis'];
    } else if (approach === 'technical') {
      return [...base, 'Technical Architecture', 'Implementation Guide', 'Security Whitepaper'];
    } else if (approach === 'financial') {
      return [...base, 'Business Case Template', 'Cost Comparison', 'TCO Analysis'];
    }
    
    return [...base, 'Use Case Studies', 'Customer Success Stories'];
  }

  /**
   * Calculate how relevant this profile's role is to the solution being sold
   */
  private calculateRoleRelevance(profile: CoreSignalProfile, sellerProfile: SellerProfile): number {
    const title = profile.active_experience_title?.toLowerCase() || '';
    const department = profile.active_experience_department?.toLowerCase() || '';
    
    let relevanceScore = 0;
    
    // Check if role matches solution's target functions
    if (sellerProfile['solutionCategory'] === 'revenue_technology') {
      if (title.includes('sales') || title.includes('revenue') || title.includes('business development')) relevanceScore += 0.9;
      if (title.includes('marketing') || title.includes('customer success')) relevanceScore += 0.6;
      if (title.includes('operations') && (title.includes('sales') || title.includes('revenue'))) relevanceScore += 0.8;
      if (department.includes('sales') || department.includes('revenue')) relevanceScore += 0.4;
    } else if (sellerProfile['solutionCategory'] === 'security') {
      if (title.includes('security') || title.includes('risk') || title.includes('compliance')) relevanceScore += 0.9;
      if (title.includes('it') || title.includes('technology') || title.includes('engineering')) relevanceScore += 0.7;
      if (title.includes('privacy') || title.includes('audit')) relevanceScore += 0.8;
    } else if (sellerProfile['solutionCategory'] === 'analytics') {
      if (title.includes('data') || title.includes('analytics') || title.includes('intelligence')) relevanceScore += 0.9;
      if (title.includes('business') && title.includes('analyst')) relevanceScore += 0.8;
      if (title.includes('operations') || title.includes('strategy')) relevanceScore += 0.6;
    }
    
    // Generic business roles have lower relevance unless specifically mentioned
    if (title.includes('finance') || title.includes('hr') || title.includes('legal')) {
      relevanceScore = Math.max(relevanceScore, 0.2); // Stakeholders, not primary users
    }
    
    return Math.min(relevanceScore, 1.0);
  }

  /**
   * Get functions that are relevant to this solution
   */
  private getRelevantFunctions(sellerProfile: SellerProfile): string[] {
    switch (sellerProfile.solutionCategory) {
      case 'revenue_technology':
        return ['sales', 'marketing', 'customer success', 'business development', 'revenue operations'];
      case 'security':
        return ['security', 'it', 'risk management', 'compliance', 'privacy'];
      case 'analytics':
        return ['data', 'analytics', 'business intelligence', 'operations', 'strategy'];
      case 'infrastructure':
        return ['it', 'engineering', 'devops', 'platform', 'architecture'];
      default:
        return ['operations', 'strategy', 'business'];
    }
  }

  /**
   * Generate solution-specific pain description for new roles
   */
  private getNewRolePainDescription(sellerProfile: SellerProfile): string {
    switch (sellerProfile.solutionCategory) {
      case 'revenue_technology':
        return 'New sales/revenue role - likely evaluating tools to accelerate performance and meet targets';
      case 'security':
        return 'New security role - likely assessing current vulnerabilities and security tool effectiveness';
      case 'analytics':
        return 'New data/analytics role - likely evaluating current data infrastructure and reporting capabilities';
      default:
        return 'New role transition - likely evaluating current tools and processes for efficiency gains';
    }
  }

  /**
   * Get solution-specific suggested response
   */
  private getSolutionDescription(sellerProfile: SellerProfile, context: string): string {
    const productName = sellerProfile.productName;
    const companyName = sellerProfile.sellerCompanyName;
    
    // Use primary pain points if available, otherwise fall back to category defaults
    if (sellerProfile['primaryPainPoints'] && sellerProfile.primaryPainPoints.length > 0) {
      const primaryPain = sellerProfile['primaryPainPoints'][0];
      return `${productName} by ${companyName} - solve ${primaryPain} with proven technology`;
    }
    
    switch (sellerProfile.solutionCategory) {
      case 'revenue_technology':
        return `${productName} by ${companyName} - accelerate sales performance and revenue insights`;
      case 'security':
        return `${productName} by ${companyName} - strengthen security posture with advanced threat protection`;
      case 'analytics':
        return `${productName} by ${companyName} - unlock data insights for better decision making`;
      case 'infrastructure':
        return `${productName} by ${companyName} - improve system reliability and performance`;
      case 'platform':
        return `${productName} by ${companyName} - enhance developer productivity and platform efficiency`;
      case 'operations':
        return `${productName} by ${companyName} - streamline operations and reduce costs`;
      case 'marketing':
        return `${productName} by ${companyName} - improve marketing effectiveness and lead generation`;
      case 'hr':
        return `${productName} by ${companyName} - enhance talent management and employee engagement`;
      case 'finance':
        return `${productName} by ${companyName} - improve financial reporting and compliance`;
      case 'legal':
        return `${productName} by ${companyName} - streamline legal processes and compliance management`;
      case 'custom':
        return `${productName} by ${companyName} - ${sellerProfile.customSolutionCategory || 'improve business efficiency'}`;
      default:
        return `${productName} by ${companyName} - streamline operations and drive efficiency`;
    }
  }

  /**
   * Identify pain points that are specifically solvable by the solution
   */
  private identifySolutionSpecificPain(profile: CoreSignalProfile, sellerProfile: SellerProfile): Challenge | null {
    const title = profile.active_experience_title?.toLowerCase() || '';
    const isRelevantRole = this.calculateRoleRelevance(profile, sellerProfile) > 0.6;
    
    if (!isRelevantRole) return null;

    // Only identify pain that the solution can actually solve
    switch (sellerProfile.solutionCategory) {
      case 'revenue_technology':
        if (title.includes('sales') || title.includes('revenue') || title.includes('business development')) {
          return {
            category: 'operational',
            description: 'Sales teams struggle with complex buyer group identification - missing key stakeholders leads to stalled deals',
            confidence: 0.9,
            urgency: 9,
            evidence: ['Sales/revenue role in complex B2B environment'],
            suggestedSolution: 'Buyer group intelligence to identify all decision makers and influencers upfront'
          };
        }
        if (title.includes('enablement') || title.includes('operations')) {
          return {
            category: 'strategic',
            description: 'Sales operations needs better visibility into buyer committee composition for effective sales coaching',
            confidence: 0.85,
            urgency: 8,
            evidence: ['Sales enablement/operations role'],
            suggestedSolution: 'Systematic buyer group mapping for sales process optimization'
          };
        }
        break;
        
      case 'security':
        if (title.includes('security') || title.includes('risk')) {
          return {
            category: 'technical',
            description: 'Increasing cyber threats and compliance requirements driving security infrastructure evaluation',
            confidence: 0.9,
            urgency: 9,
            evidence: ['Security role amid rising threat landscape'],
            suggestedSolution: 'Advanced threat protection and compliance automation'
          };
        }
        break;
        
      case 'analytics':
        if (title.includes('data') || title.includes('analytics')) {
          return {
            category: 'strategic',
            description: 'Data teams struggling with actionable insights - too much data, not enough intelligence',
            confidence: 0.85,
            urgency: 7,
            evidence: ['Data/analytics role in data-rich environment'],
            suggestedSolution: 'Advanced analytics platform for actionable business intelligence'
          };
        }
        break;
    }
    
    return null;
  }

  /**
   * Aggregate pain intelligence across multiple profiles
   */
  aggregatePainIntelligence(profiles: CoreSignalProfile[], weights?: Record<string, number>) {
    const profilesWithPain = profiles.filter(p => p.painIntelligence);
    
    if (profilesWithPain['length'] === 0) {
      return {
        overallPainScore: 0,
        urgencyDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
        topChallenges: [],
        keyBuyingSignals: [],
        recommendedApproach: 'consultative'
      };
    }

    // Calculate overall pain score (weighted by role importance)
    let totalWeightedPain = 0;
    let totalWeight = 0;
    
    const urgencyDistribution: Record<string, number> = {
      low: 0, medium: 0, high: 0, critical: 0
    };

    profilesWithPain.forEach(profile => {
      const painIntel = profile.painIntelligence;
      if (!painIntel) return;
      
      const weight = weights?.[profile.id] || 1.0;
      totalWeightedPain += painIntel.painScore * weight;
      totalWeight += weight;
      
      // Count urgency distribution
      const urgencyLevel = painIntel.urgencyLevel;
      if (urgencyLevel && urgencyDistribution[urgencyLevel] !== undefined) {
        urgencyDistribution[urgencyLevel]++;
      }
    });

    const overallPainScore = totalWeight > 0 ? Math.round(totalWeightedPain / totalWeight) : 0;

    // Aggregate top challenges (deduplicated and sorted by frequency + impact)
    const challengeMap = new Map<string, { challenge: Challenge; count: number; totalImpact: number }>();
    
    profilesWithPain.forEach(profile => {
      profile.painIntelligence?.primaryChallenges?.forEach(challenge => {
        const key = `${challenge.category}:${challenge.description}`;
        const existing = challengeMap.get(key);
        if (existing) {
          existing.count++;
          existing.totalImpact += challenge.urgency * challenge.confidence;
        } else {
          challengeMap.set(key, {
            challenge,
            count: 1,
            totalImpact: challenge.urgency * challenge.confidence
          });
        }
      });
    });

    const topChallenges = Array.from(challengeMap.values())
      .sort((a, b) => (b.count * b.totalImpact) - (a.count * a.totalImpact))
      .slice(0, 5)
      .map(item => item.challenge);

    // Aggregate buying signals (deduplicated and sorted by strength)
    const signalMap = new Map<string, { signal: BuyingSignal; count: number; totalStrength: number }>();
    
    profilesWithPain.forEach(profile => {
      profile.painIntelligence?.buyingSignals?.forEach(signal => {
        const key = `${signal.type}:${signal.description}`;
        const existing = signalMap.get(key);
        if (existing) {
          existing.count++;
          existing.totalStrength += signal.strength;
        } else {
          signalMap.set(key, {
            signal,
            count: 1,
            totalStrength: signal.strength
          });
        }
      });
    });

    const keyBuyingSignals = Array.from(signalMap.values())
      .sort((a, b) => (b.count * b.totalStrength) - (a.count * a.totalStrength))
      .slice(0, 5)
      .map(item => ({
        ...item.signal,
        strength: item.totalStrength / item.count // Average strength
      }));

    // Determine recommended approach based on overall pain profile
    let recommendedApproach = 'consultative';
    if (overallPainScore >= 80) recommendedApproach = 'executive';
    else if (topChallenges.some(c => c['category'] === 'technical')) recommendedApproach = 'technical';
    else if (keyBuyingSignals.some(s => s['type'] === 'budget_increase')) recommendedApproach = 'financial';

    return {
      overallPainScore,
      urgencyDistribution,
      topChallenges,
      keyBuyingSignals,
      recommendedApproach
    };
  }
}
