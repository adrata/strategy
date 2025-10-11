/**
 * 🎯 CANDIDATE RANKER
 * 
 * Ranks search candidates before collection to optimize for highest-value profiles
 */

import { SellerProfile } from './types';

export interface CandidateScore {
  id: string;
  roleRelevance: number;    // 1-10 based on title match to target roles
  authorityLevel: number;   // 1-10 based on hierarchy level
  companyMatch: number;     // 1-10 based on company verification strength
  tenureSignals: number;    // 1-10 based on employment stability
  networkSize?: number;     // Raw connection count if available
  totalScore: number;       // Weighted combination
  tier: 'decision' | 'champion' | 'stakeholder' | 'blocker' | 'introducer';
  searchSource: string;     // Which micro-query found this candidate
}

export interface SearchCandidate {
  id: string;
  title?: string;
  headline?: string;
  company?: string;
  department?: string;
  experience_duration?: number;
  connections_count?: number;
  description?: string;
  searchQuery: string; // Which query found this candidate
}

export class CandidateRanker {

  /**
   * 🚀 HYPEROPTIMAL: Rank candidates from micro-targeted searches
   */
  rankCandidates(
    searchResults: SearchCandidate[], 
    targetCompany: string,
    sellerProfile: SellerProfile
  ): CandidateScore[] {
    
    const scoredCandidates: CandidateScore[] = [];
    
    for (const candidate of searchResults) {
      const score = this.scoreSingleCandidate(candidate, targetCompany, sellerProfile);
      if (score.totalScore > 3.0) { // Minimum threshold for consideration
        scoredCandidates.push(score);
      }
    }
    
    // Sort by total score (highest first)
    return scoredCandidates.sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * Score individual candidate using search metadata
   */
  private scoreSingleCandidate(
    candidate: SearchCandidate, 
    targetCompany: string,
    sellerProfile: SellerProfile
  ): CandidateScore {
    
    const title = candidate.title || candidate.headline || '';
    const company = candidate.company || '';
    const description = candidate.description || '';
    
    // Calculate component scores
    const roleRelevance = this.calculateRoleRelevance(title, candidate.searchQuery, sellerProfile);
    const authorityLevel = this.calculateAuthorityLevel(title);
    const companyMatch = this.calculateCompanyMatch(company, targetCompany);
    const tenureSignals = this.calculateTenureSignals(candidate);
    
    // Determine tier based on search source
    const tier = this.determineTierFromSearchQuery(candidate.searchQuery);
    
    // Calculate weighted total score
    const totalScore = this.calculateWeightedScore(
      roleRelevance, authorityLevel, companyMatch, tenureSignals, tier
    );
    
    return {
      id: candidate.id,
      roleRelevance,
      authorityLevel,
      companyMatch,
      tenureSignals,
      networkSize: candidate.connections_count,
      totalScore,
      tier,
      searchSource: candidate.searchQuery
    };
  }

  /**
   * Calculate role relevance score (1-10)
   */
  private calculateRoleRelevance(title: string, searchQuery: string, sellerProfile: SellerProfile): number {
    const titleLower = title.toLowerCase();
    let score = 1;
    
    // High-value decision maker keywords
    const decisionKeywords = ['ceo', 'cfo', 'cro', 'chief', 'president', 'vp', 'vice president', 'svp'];
    const championKeywords = ['director', 'manager', 'principal', 'lead', 'head'];
    const operationsKeywords = ['sales operations', 'revenue operations', 'sales enablement'];
    const blockerKeywords = ['procurement', 'ciso', 'security', 'legal', 'compliance', 'finance'];
    
    // Score based on keyword matches
    if (decisionKeywords.some(kw => titleLower.includes(kw))) {
      score += 4;
    } else if (championKeywords.some(kw => titleLower.includes(kw))) {
      score += 3;
    }
    
    if (operationsKeywords.some(kw => titleLower.includes(kw))) {
      score += 2;
    }
    
    if (blockerKeywords.some(kw => titleLower.includes(kw))) {
      score += 2;
    }
    
    // Boost for sales function
    if (titleLower.includes('sales') || titleLower.includes('revenue')) {
      score += 1;
    }
    
    // Boost for exact match to seller profile priorities
    const allPriorities = [
      ...sellerProfile.rolePriorities.decision,
      ...sellerProfile.rolePriorities.champion,
      ...sellerProfile.rolePriorities.stakeholder,
      ...sellerProfile.rolePriorities.blocker,
      ...sellerProfile.rolePriorities.introducer
    ];
    
    for (const priority of allPriorities) {
      if (titleLower.includes(priority.toLowerCase())) {
        score += 1;
        break;
      }
    }
    
    return Math.min(score, 10);
  }

  /**
   * Calculate authority level score (1-10)
   */
  private calculateAuthorityLevel(title: string): number {
    const titleLower = title.toLowerCase();
    
    // C-Level (10)
    if (titleLower.includes('ceo') || titleLower.includes('cfo') || 
        titleLower.includes('cro') || titleLower.includes('chief')) {
      return 10;
    }
    
    // SVP (9)
    if (titleLower.includes('svp') || titleLower.includes('senior vice president')) {
      return 9;
    }
    
    // VP (8)
    if (titleLower.includes('vp') || titleLower.includes('vice president')) {
      return 8;
    }
    
    // Director (7)
    if (titleLower.includes('director')) {
      return 7;
    }
    
    // Manager/Head (6)
    if (titleLower.includes('manager') || titleLower.includes('head')) {
      return 6;
    }
    
    // Principal/Lead (5)
    if (titleLower.includes('principal') || titleLower.includes('lead')) {
      return 5;
    }
    
    // Senior (4)
    if (titleLower.includes('senior')) {
      return 4;
    }
    
    // Default (3)
    return 3;
  }

  /**
   * Calculate company match confidence (1-10)
   */
  private calculateCompanyMatch(candidateCompany: string, targetCompany: string): number {
    if (!candidateCompany) return 1;
    
    const candidateLower = candidateCompany.toLowerCase();
    const targetLower = targetCompany.toLowerCase();
    
    // Exact match
    if (candidateLower === targetLower) {
      return 10;
    }
    
    // Contains target company name
    if (candidateLower.includes(targetLower) || targetLower.includes(candidateLower)) {
      return 8;
    }
    
    // Common enterprise variations
    const targetWords = targetLower.split(' ');
    const candidateWords = candidateLower.split(' ');
    
    let matchCount = 0;
    for (const word of targetWords) {
      if (candidateWords.includes(word)) {
        matchCount++;
      }
    }
    
    const matchRatio = matchCount / targetWords.length;
    
    if (matchRatio >= 0.7) return 7;
    if (matchRatio >= 0.5) return 5;
    if (matchRatio >= 0.3) return 3;
    
    return 1;
  }

  /**
   * Calculate tenure signals (1-10)
   */
  private calculateTenureSignals(candidate: SearchCandidate): number {
    let score = 5; // Default
    
    // If we have experience duration
    if (candidate.experience_duration) {
      const yearsAtCompany = candidate.experience_duration / 365;
      
      if (yearsAtCompany >= 5) score = 9;      // Very stable
      else if (yearsAtCompany >= 3) score = 8; // Stable
      else if (yearsAtCompany >= 2) score = 7; // Moderately stable
      else if (yearsAtCompany >= 1) score = 6; // Acceptable
      else score = 3; // New/risky
    }
    
    return score;
  }

  /**
   * Determine tier from search query source
   */
  private determineTierFromSearchQuery(searchQuery: string): CandidateScore['tier'] {
    const queryLower = searchQuery.toLowerCase();
    
    if (queryLower.includes('ceo') || queryLower.includes('cfo') || 
        queryLower.includes('cro') || queryLower.includes('vp') || 
        queryLower.includes('chief')) {
      return 'decision';
    }
    
    if (queryLower.includes('director') || queryLower.includes('manager') || 
        queryLower.includes('principal')) {
      return 'champion';
    }
    
    if (queryLower.includes('procurement') || queryLower.includes('ciso') || 
        queryLower.includes('legal') || queryLower.includes('compliance')) {
      return 'blocker';
    }
    
    if (queryLower.includes('account executive') || queryLower.includes('channel') || 
        queryLower.includes('business development')) {
      return 'introducer';
    }
    
    return 'stakeholder';
  }

  /**
   * Calculate weighted total score
   */
  private calculateWeightedScore(
    roleRelevance: number, 
    authorityLevel: number, 
    companyMatch: number, 
    tenureSignals: number,
    tier: CandidateScore['tier']
  ): number {
    
    // Tier-specific weights
    const weights = {
      decision: { role: 0.3, authority: 0.4, company: 0.2, tenure: 0.1 },
      champion: { role: 0.4, authority: 0.3, company: 0.2, tenure: 0.1 },
      stakeholder: { role: 0.4, authority: 0.2, company: 0.3, tenure: 0.1 },
      blocker: { role: 0.5, authority: 0.3, company: 0.2, tenure: 0.0 },
      introducer: { role: 0.3, authority: 0.1, company: 0.4, tenure: 0.2 }
    };
    
    const weight = weights[tier];
    
    return (
      roleRelevance * weight.role +
      authorityLevel * weight.authority +
      companyMatch * weight.company +
      tenureSignals * weight.tenure
    );
  }

  /**
   * 🎯 Get top candidates by tier for progressive collection
   */
  getTieredCollectionTargets(rankedCandidates: CandidateScore[]): {
    decision: CandidateScore[];
    champion: CandidateScore[];
    stakeholder: CandidateScore[];
    blocker: CandidateScore[];
    introducer: CandidateScore[];
  } {
    
    const tiers = {
      decision: rankedCandidates.filter(c => c['tier'] === 'decision').slice(0, 6),
      champion: rankedCandidates.filter(c => c['tier'] === 'champion').slice(0, 8),
      stakeholder: rankedCandidates.filter(c => c['tier'] === 'stakeholder').slice(0, 8),
      blocker: rankedCandidates.filter(c => c['tier'] === 'blocker').slice(0, 6),
      introducer: rankedCandidates.filter(c => c['tier'] === 'introducer').slice(0, 7)
    };
    
    return tiers;
  }
}
