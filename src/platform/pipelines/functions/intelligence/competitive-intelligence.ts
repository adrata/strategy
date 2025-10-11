/**
 * COMPETITIVE INTELLIGENCE SERVICE
 * 
 * Market analysis and competitive insights
 * Following 2025 best practices: Pure functions, type-safe, composable
 * 
 * Provides:
 * - Multi-company competitive analysis
 * - Market trend tracking
 * - Growth leader identification
 * - Competitive landscape mapping
 */

import type { APIClients } from '../types/api-clients';
import {
  getHiringTrends,
  compareCompanyHiring,
  type HiringTrend,
  type CompetitiveHiringAnalysis
} from '../providers/coresignal-jobs';
import {
  trackEmployeeChanges,
  type EmployeeMovementAnalysis
} from '../providers/coresignal-multisource';

// ============================================================================
// TYPES
// ============================================================================

export interface CompetitiveAnalysis {
  companies: string[];
  timeframe: string;
  
  rankings: {
    company: string;
    overallScore: number;
    rank: number;
    metrics: {
      hiringRate: number;
      growthRate: number;
      employeeCount: number;
      leadershipStability: number;
    };
  }[];
  
  marketLeaders: string[];
  emergingPlayers: string[];
  decliningCompanies: string[];
  
  insights: string[];
  generatedAt: string;
}

export interface MarketTrend {
  industry: string;
  timeframe: string;
  
  overallGrowth: number;
  averageHiringRate: number;
  topRoles: string[];
  emergingRoles: string[];
  
  departmentTrends: {
    department: string;
    growth: number;
    demand: 'high' | 'medium' | 'low';
  }[];
  
  locationTrends: {
    location: string;
    growth: number;
    popularity: number;
  }[];
  
  insights: string[];
}

export interface CompetitiveLandscape {
  focusCompany: string;
  competitors: string[];
  timeframe: string;
  
  positioning: {
    company: string;
    marketPosition: 'leader' | 'challenger' | 'follower' | 'niche';
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  }[];
  
  marketDynamics: {
    competitiveIntensity: 'high' | 'medium' | 'low';
    marketGrowth: number;
    consolidationRisk: 'high' | 'medium' | 'low';
  };
  
  strategicRecommendations: string[];
}

// ============================================================================
// COMPETITIVE INTELLIGENCE FUNCTIONS
// ============================================================================

/**
 * Compare multiple companies for competitive analysis
 * 
 * @example
 * const analysis = await compareCompanies(['Salesforce', 'HubSpot', 'Pipedrive'], 'last_quarter', apis);
 */
export async function compareCompanies(
  companies: string[],
  timeframe: string,
  apis: APIClients
): Promise<CompetitiveAnalysis> {
  console.log(`🏆 [Competitive Analysis] Comparing ${companies.length} companies (${timeframe})`);
  
  // Get hiring trends for all companies
  const hiringAnalysis = await compareCompanyHiring(companies, timeframe, apis);
  
  // Get employee movement for all companies
  const movementPromises = companies.map(company => 
    trackEmployeeChanges(company, timeframe, apis)
  );
  const movements = await Promise.all(movementPromises);
  
  // Calculate rankings
  const rankings = companies.map((company, index) => {
    const hiring = hiringAnalysis.rankings.find(r => r.company === company);
    const movement = movements[index];
    
    const metrics = {
      hiringRate: hiring?.hiringRate || 0,
      growthRate: movement.growthRate,
      employeeCount: movement.hires + movement.departures, // Estimate
      leadershipStability: calculateLeadershipStability(movement)
    };
    
    const overallScore = calculateOverallScore(metrics);
    
    return {
      company,
      overallScore,
      rank: 0, // Will be assigned after sorting
      metrics
    };
  });
  
  // Sort by overall score and assign ranks
  rankings.sort((a, b) => b.overallScore - a.overallScore);
  rankings.forEach((item, index) => {
    item.rank = index + 1;
  });
  
  // Identify market segments
  const marketLeaders = rankings.slice(0, Math.ceil(companies.length * 0.2)).map(r => r.company);
  const emergingPlayers = rankings.filter((r, i) => 
    i >= Math.ceil(companies.length * 0.2) && r.metrics.growthRate > 15
  ).map(r => r.company);
  const decliningCompanies = rankings.filter(r => r.metrics.growthRate < 0).map(r => r.company);
  
  // Generate insights
  const insights = generateCompetitiveInsights(rankings, movements);
  
  const analysis: CompetitiveAnalysis = {
    companies,
    timeframe,
    rankings,
    marketLeaders,
    emergingPlayers,
    decliningCompanies,
    insights,
    generatedAt: new Date().toISOString()
  };
  
  console.log(`   ✅ Market Leader: ${marketLeaders[0] || 'None'}`);
  console.log(`   📊 Emerging Players: ${emergingPlayers.length}`);
  
  return analysis;
}

/**
 * Track market trends across an industry
 * 
 * @example
 * const trends = await trackMarketTrends('SaaS', 'last_quarter', ['Salesforce', 'HubSpot'], apis);
 */
export async function trackMarketTrends(
  industry: string,
  timeframe: string,
  sampleCompanies: string[],
  apis: APIClients
): Promise<MarketTrend> {
  console.log(`📈 [Market Trends] Analyzing ${industry} industry (${timeframe})`);
  
  // Get hiring trends for sample companies
  const hiringTrends = await getHiringTrends(sampleCompanies, timeframe, apis);
  
  // Aggregate trends
  const totalJobs = hiringTrends.reduce((sum, t) => sum + t.totalJobs, 0);
  const averageHiringRate = hiringTrends.reduce((sum, t) => sum + t.monthlyHiringRate, 0) / hiringTrends.length;
  
  // Identify top roles
  const allRoles: Record<string, number> = {};
  hiringTrends.forEach(trend => {
    Object.entries(trend.jobsByDepartment).forEach(([dept, count]) => {
      allRoles[dept] = (allRoles[dept] || 0) + count;
    });
  });
  
  const topRoles = Object.entries(allRoles)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([role]) => role);
  
  // Calculate overall growth
  const overallGrowth = hiringTrends.reduce((sum, t) => sum + t.percentageChange, 0) / hiringTrends.length;
  
  // Department trends
  const departmentTrends = Object.entries(allRoles)
    .map(([department, count]) => ({
      department,
      growth: (count / totalJobs) * 100,
      demand: count > totalJobs * 0.2 ? 'high' as const : 
              count > totalJobs * 0.1 ? 'medium' as const : 'low' as const
    }))
    .sort((a, b) => b.growth - a.growth)
    .slice(0, 10);
  
  // Generate insights
  const insights = generateMarketInsights(industry, hiringTrends, departmentTrends);
  
  const trend: MarketTrend = {
    industry,
    timeframe,
    overallGrowth,
    averageHiringRate,
    topRoles,
    emergingRoles: topRoles.slice(0, 3),
    departmentTrends,
    locationTrends: [], // Would need location data
    insights
  };
  
  console.log(`   ✅ Overall Growth: ${overallGrowth.toFixed(1)}%`);
  console.log(`   📊 Top Role: ${topRoles[0] || 'Unknown'}`);
  
  return trend;
}

/**
 * Identify market leaders in a competitive landscape
 * 
 * @example
 * const leaders = await identifyMarketLeaders(['Salesforce', 'HubSpot', 'Pipedrive'], 'last_year', apis);
 */
export async function identifyMarketLeaders(
  companies: string[],
  timeframe: string,
  apis: APIClients
): Promise<string[]> {
  console.log(`👑 [Market Leaders] Identifying leaders among ${companies.length} companies`);
  
  const analysis = await compareCompanies(companies, timeframe, apis);
  
  console.log(`   ✅ Identified ${analysis.marketLeaders.length} market leaders`);
  
  return analysis.marketLeaders;
}

/**
 * Get complete competitive landscape analysis
 * 
 * @example
 * const landscape = await getCompetitiveLandscape('Salesforce', ['HubSpot', 'Pipedrive'], 'last_quarter', apis);
 */
export async function getCompetitiveLandscape(
  focusCompany: string,
  competitors: string[],
  timeframe: string,
  apis: APIClients
): Promise<CompetitiveLandscape> {
  console.log(`🗺️ [Competitive Landscape] Analyzing landscape for: ${focusCompany}`);
  
  const allCompanies = [focusCompany, ...competitors];
  
  // Get competitive analysis
  const analysis = await compareCompanies(allCompanies, timeframe, apis);
  
  // Build positioning for each company
  const positioning = allCompanies.map(company => {
    const ranking = analysis.rankings.find(r => r.company === company);
    const rank = ranking?.rank || allCompanies.length;
    
    return {
      company,
      marketPosition: determineMarketPosition(rank, allCompanies.length),
      strengths: generateStrengths(ranking),
      weaknesses: generateWeaknesses(ranking),
      opportunities: generateOpportunities(ranking, analysis),
      threats: generateThreats(ranking, analysis)
    };
  });
  
  // Assess market dynamics
  const marketDynamics = {
    competitiveIntensity: assessCompetitiveIntensity(analysis),
    marketGrowth: analysis.rankings.reduce((sum, r) => sum + r.metrics.growthRate, 0) / analysis.rankings.length,
    consolidationRisk: assessConsolidationRisk(analysis)
  };
  
  // Generate strategic recommendations
  const strategicRecommendations = generateStrategicRecommendations(focusCompany, positioning, marketDynamics);
  
  const landscape: CompetitiveLandscape = {
    focusCompany,
    competitors,
    timeframe,
    positioning,
    marketDynamics,
    strategicRecommendations
  };
  
  console.log(`   ✅ ${focusCompany} position: ${positioning[0]?.marketPosition || 'Unknown'}`);
  
  return landscape;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate leadership stability score
 */
function calculateLeadershipStability(movement: EmployeeMovementAnalysis): number {
  const leadershipDepartures = movement.leadershipChanges.filter(c => c.changeType === 'departure').length;
  const totalLeadership = movement.leadershipChanges.length || 1;
  
  return Math.max(0, 100 - (leadershipDepartures / totalLeadership) * 100);
}

/**
 * Calculate overall competitive score
 */
function calculateOverallScore(metrics: any): number {
  return (
    metrics.hiringRate * 0.3 +
    metrics.growthRate * 0.4 +
    metrics.leadershipStability * 0.3
  );
}

/**
 * Generate competitive insights
 */
function generateCompetitiveInsights(rankings: any[], movements: EmployeeMovementAnalysis[]): string[] {
  const insights: string[] = [];
  
  const leader = rankings[0];
  if (leader) {
    insights.push(`${leader.company} leads the market with a score of ${leader.overallScore.toFixed(1)}`);
  }
  
  const highGrowth = rankings.filter(r => r.metrics.growthRate > 20);
  if (highGrowth.length > 0) {
    insights.push(`${highGrowth.length} companies showing aggressive growth (>20%)`);
  }
  
  const unstable = rankings.filter(r => r.metrics.leadershipStability < 70);
  if (unstable.length > 0) {
    insights.push(`${unstable.length} companies experiencing leadership instability`);
  }
  
  return insights;
}

/**
 * Generate market insights
 */
function generateMarketInsights(industry: string, trends: HiringTrend[], deptTrends: any[]): string[] {
  const insights: string[] = [];
  
  const totalJobs = trends.reduce((sum, t) => sum + t.totalJobs, 0);
  insights.push(`${industry} market has ${totalJobs} active job postings`);
  
  if (deptTrends.length > 0) {
    insights.push(`${deptTrends[0].department} is the fastest growing department`);
  }
  
  const avgGrowth = trends.reduce((sum, t) => sum + t.percentageChange, 0) / trends.length;
  if (avgGrowth > 15) {
    insights.push('Market showing strong growth signals');
  } else if (avgGrowth < 5) {
    insights.push('Market growth slowing down');
  }
  
  return insights;
}

/**
 * Determine market position
 */
function determineMarketPosition(rank: number, totalCompanies: number): 'leader' | 'challenger' | 'follower' | 'niche' {
  const percentile = rank / totalCompanies;
  
  if (percentile <= 0.2) return 'leader';
  if (percentile <= 0.4) return 'challenger';
  if (percentile <= 0.7) return 'follower';
  return 'niche';
}

/**
 * Generate company strengths
 */
function generateStrengths(ranking: any): string[] {
  const strengths: string[] = [];
  
  if (ranking.metrics.hiringRate > 10) {
    strengths.push('Strong hiring momentum');
  }
  if (ranking.metrics.growthRate > 15) {
    strengths.push('Rapid growth trajectory');
  }
  if (ranking.metrics.leadershipStability > 80) {
    strengths.push('Stable leadership team');
  }
  
  return strengths.length > 0 ? strengths : ['Maintaining market presence'];
}

/**
 * Generate company weaknesses
 */
function generateWeaknesses(ranking: any): string[] {
  const weaknesses: string[] = [];
  
  if (ranking.metrics.hiringRate < 5) {
    weaknesses.push('Limited hiring activity');
  }
  if (ranking.metrics.growthRate < 5) {
    weaknesses.push('Slow growth rate');
  }
  if (ranking.metrics.leadershipStability < 70) {
    weaknesses.push('Leadership instability');
  }
  
  return weaknesses.length > 0 ? weaknesses : ['No significant weaknesses identified'];
}

/**
 * Generate opportunities
 */
function generateOpportunities(ranking: any, analysis: CompetitiveAnalysis): string[] {
  return [
    'Market expansion in growing segments',
    'Strategic hiring in key departments',
    'Leadership development and retention'
  ];
}

/**
 * Generate threats
 */
function generateThreats(ranking: any, analysis: CompetitiveAnalysis): string[] {
  return [
    'Competitive pressure from market leaders',
    'Talent acquisition challenges',
    'Market consolidation risks'
  ];
}

/**
 * Assess competitive intensity
 */
function assessCompetitiveIntensity(analysis: CompetitiveAnalysis): 'high' | 'medium' | 'low' {
  const avgScore = analysis.rankings.reduce((sum, r) => sum + r.overallScore, 0) / analysis.rankings.length;
  const scoreVariance = analysis.rankings.reduce((sum, r) => sum + Math.abs(r.overallScore - avgScore), 0) / analysis.rankings.length;
  
  if (scoreVariance < 10) return 'high'; // Very competitive, scores close together
  if (scoreVariance < 20) return 'medium';
  return 'low'; // Clear leaders, less competitive
}

/**
 * Assess consolidation risk
 */
function assessConsolidationRisk(analysis: CompetitiveAnalysis): 'high' | 'medium' | 'low' {
  const decliningCount = analysis.decliningCompanies.length;
  const totalCount = analysis.companies.length;
  
  if (decliningCount / totalCount > 0.3) return 'high';
  if (decliningCount / totalCount > 0.15) return 'medium';
  return 'low';
}

/**
 * Generate strategic recommendations
 */
function generateStrategicRecommendations(
  focusCompany: string,
  positioning: any[],
  dynamics: any
): string[] {
  const recommendations: string[] = [];
  
  const focusPosition = positioning.find(p => p.company === focusCompany);
  
  if (focusPosition?.marketPosition === 'leader') {
    recommendations.push('Maintain market leadership through continued innovation');
    recommendations.push('Invest in talent retention and development');
  } else if (focusPosition?.marketPosition === 'challenger') {
    recommendations.push('Accelerate growth to challenge market leaders');
    recommendations.push('Focus on differentiation and niche strengths');
  } else {
    recommendations.push('Identify and capitalize on market gaps');
    recommendations.push('Build strategic partnerships for growth');
  }
  
  if (dynamics.competitiveIntensity === 'high') {
    recommendations.push('Differentiate through unique value propositions');
  }
  
  if (dynamics.consolidationRisk === 'high') {
    recommendations.push('Consider strategic M&A opportunities');
  }
  
  return recommendations;
}

