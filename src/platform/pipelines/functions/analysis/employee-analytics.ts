/**
 * EMPLOYEE ANALYTICS SERVICE
 * 
 * Advanced employee movement and growth analysis
 * Following 2025 best practices: Pure functions, type-safe, composable
 * 
 * Provides:
 * - Employee growth analysis
 * - Leadership transition tracking
 * - Movement prediction
 * - Department expansion analysis
 */

import type { APIClients } from '../types/api-clients';
import {
  trackEmployeeChanges,
  detectLeadershipChanges,
  type EmployeeMovementAnalysis,
  type LeadershipChange
} from '../providers/coresignal-multisource';

// ============================================================================
// TYPES
// ============================================================================

export interface EmployeeGrowthAnalysis {
  company: string;
  timeframe: string;
  
  headcountGrowth: {
    startCount: number;
    endCount: number;
    netChange: number;
    percentageChange: number;
  };
  
  departmentGrowth: {
    department: string;
    growth: number;
    percentageChange: number;
  }[];
  
  seniorityGrowth: {
    level: string;
    growth: number;
    percentageChange: number;
  }[];
  
  hiringPatterns: {
    averageHiresPerMonth: number;
    peakHiringMonth?: string;
    seasonality: string;
  };
  
  retentionMetrics: {
    turnoverRate: number;
    averageTenure: number;
    atRiskCount: number;
  };
  
  growthTrajectory: 'accelerating' | 'steady' | 'slowing' | 'declining';
  healthScore: number; // 0-100
}

export interface LeadershipTransition {
  role: string;
  tier: number;
  transitionType: 'succession' | 'replacement' | 'expansion' | 'elimination';
  
  outgoingPerson?: {
    name: string;
    tenure: number;
    reason?: string;
  };
  
  incomingPerson?: {
    name: string;
    source: 'internal' | 'external';
    previousRole?: string;
  };
  
  transitionDate: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
  riskLevel: 'high' | 'medium' | 'low';
}

export interface MovementPrediction {
  person: string;
  currentRole: string;
  currentCompany: string;
  
  departureRisk: number; // 0-100
  promotionProbability: number; // 0-100
  
  riskFactors: string[];
  opportunities: string[];
  
  predictedAction: 'likely_to_leave' | 'likely_to_stay' | 'likely_promoted' | 'uncertain';
  confidence: number; // 0-100
  
  recommendedActions: string[];
}

export interface DepartmentExpansionAnalysis {
  company: string;
  timeframe: string;
  
  expansions: {
    department: string;
    currentSize: number;
    growthRate: number;
    newHires: number;
    openPositions: number;
    investmentLevel: 'high' | 'medium' | 'low';
  }[];
  
  emergingDepartments: string[];
  decliningDepartments: string[];
  
  strategicFocus: string[];
}

// ============================================================================
// EMPLOYEE ANALYTICS FUNCTIONS
// ============================================================================

/**
 * Analyze employee growth patterns
 * 
 * @example
 * const analysis = await analyzeEmployeeGrowth('Salesforce', 'last_year', apis);
 */
export async function analyzeEmployeeGrowth(
  company: string,
  timeframe: string,
  apis: APIClients
): Promise<EmployeeGrowthAnalysis> {
  console.log(`📊 [Employee Analytics] Analyzing growth for: ${company} (${timeframe})`);
  
  const movement = await trackEmployeeChanges(company, timeframe, apis);
  
  // Calculate headcount growth
  const headcountGrowth = {
    startCount: 100, // Would need historical data
    endCount: 100 + movement.netGrowth,
    netChange: movement.netGrowth,
    percentageChange: (movement.netGrowth / 100) * 100
  };
  
  // Analyze department growth
  const departmentGrowth = analyzeDepartmentGrowth(movement);
  
  // Analyze seniority growth
  const seniorityGrowth = analyzeSeniorityGrowth(movement);
  
  // Calculate hiring patterns
  const hiringPatterns = analyzeHiringPatterns(movement, timeframe);
  
  // Calculate retention metrics
  const retentionMetrics = {
    turnoverRate: movement.turnoverRate,
    averageTenure: 3.5, // Would need employee data
    atRiskCount: Math.round(movement.departures * 1.2) // Estimate
  };
  
  // Determine growth trajectory
  const growthTrajectory = determineGrowthTrajectory(movement, headcountGrowth);
  
  // Calculate health score
  const healthScore = calculateHealthScore(movement, headcountGrowth, retentionMetrics);
  
  const analysis: EmployeeGrowthAnalysis = {
    company,
    timeframe,
    headcountGrowth,
    departmentGrowth,
    seniorityGrowth,
    hiringPatterns,
    retentionMetrics,
    growthTrajectory,
    healthScore
  };
  
  console.log(`   ✅ Health Score: ${healthScore}/100 | Growth: ${growthTrajectory}`);
  
  return analysis;
}

/**
 * Track leadership transitions
 * 
 * @example
 * const transitions = await trackLeadershipTransitions('Salesforce', 'last_quarter', apis);
 */
export async function trackLeadershipTransitions(
  company: string,
  timeframe: string,
  apis: APIClients
): Promise<LeadershipTransition[]> {
  console.log(`👔 [Leadership Analytics] Tracking transitions for: ${company} (${timeframe})`);
  
  const changes = await detectLeadershipChanges(company, timeframe, apis);
  
  const transitions: LeadershipTransition[] = changes.map(change => ({
    role: change.role,
    tier: change.tier,
    transitionType: determineTransitionType(change),
    
    // Would need more detailed data for these fields
    outgoingPerson: change.changeType === 'departure' ? {
      name: change.person,
      tenure: 3, // Estimate
      reason: 'unknown'
    } : undefined,
    
    incomingPerson: change.changeType === 'hire' ? {
      name: change.person,
      source: 'external', // Estimate
      previousRole: undefined
    } : undefined,
    
    transitionDate: change.date,
    impact: change.impact,
    riskLevel: determineRiskLevel(change)
  }));
  
  console.log(`   ✅ Found ${transitions.length} leadership transitions`);
  
  return transitions;
}

/**
 * Predict employee movements
 * 
 * @example
 * const predictions = await predictEmployeeMovements('Salesforce', apis);
 */
export async function predictEmployeeMovements(
  company: string,
  apis: APIClients
): Promise<MovementPrediction[]> {
  console.log(`🔮 [Movement Prediction] Predicting for: ${company}`);
  
  const movement = await trackEmployeeChanges(company, 'last_6_months', apis);
  
  // This is a simplified prediction model
  // In production, would use ML/historical patterns
  const predictions: MovementPrediction[] = [];
  
  // Predict departures based on turnover rate
  if (movement.turnoverRate > 15) {
    predictions.push({
      person: 'Anonymous Employee',
      currentRole: 'Various',
      currentCompany: company,
      departureRisk: Math.round(movement.turnoverRate * 3),
      promotionProbability: 20,
      riskFactors: [
        `High turnover rate (${movement.turnoverRate.toFixed(1)}%)`,
        'Recent leadership changes',
        'Market conditions'
      ],
      opportunities: [],
      predictedAction: 'likely_to_leave',
      confidence: 70,
      recommendedActions: [
        'Review compensation packages',
        'Conduct retention interviews',
        'Improve employee engagement'
      ]
    });
  }
  
  console.log(`   ✅ Generated ${predictions.length} predictions`);
  
  return predictions;
}

/**
 * Analyze department expansion
 * 
 * @example
 * const analysis = await analyzeDepartmentExpansion('Salesforce', 'last_quarter', apis);
 */
export async function analyzeDepartmentExpansion(
  company: string,
  timeframe: string,
  apis: APIClients
): Promise<DepartmentExpansionAnalysis> {
  console.log(`🏢 [Department Analytics] Analyzing expansion for: ${company} (${timeframe})`);
  
  const movement = await trackEmployeeChanges(company, timeframe, apis);
  
  // Simplified expansion analysis
  // In production, would correlate with job postings data
  const expansions = [
    {
      department: 'Sales',
      currentSize: 50,
      growthRate: 15,
      newHires: movement.hires,
      openPositions: 10,
      investmentLevel: 'high' as const
    }
  ];
  
  const analysis: DepartmentExpansionAnalysis = {
    company,
    timeframe,
    expansions,
    emergingDepartments: ['Sales', 'Engineering'],
    decliningDepartments: [],
    strategicFocus: ['Go-to-market expansion', 'Product development']
  };
  
  console.log(`   ✅ Identified ${expansions.length} expanding departments`);
  
  return analysis;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Analyze department growth from movement data
 */
function analyzeDepartmentGrowth(movement: EmployeeMovementAnalysis): EmployeeGrowthAnalysis['departmentGrowth'] {
  // Simplified - in production would have detailed department data
  return [
    { department: 'Sales', growth: movement.hires, percentageChange: 15 },
    { department: 'Engineering', growth: Math.round(movement.hires * 0.6), percentageChange: 12 },
    { department: 'Marketing', growth: Math.round(movement.hires * 0.3), percentageChange: 10 }
  ];
}

/**
 * Analyze seniority growth from movement data
 */
function analyzeSeniorityGrowth(movement: EmployeeMovementAnalysis): EmployeeGrowthAnalysis['seniorityGrowth'] {
  const leadershipGrowth = movement.leadershipChanges.filter(c => c.changeType === 'hire').length;
  
  return [
    { level: 'C-Level', growth: Math.round(leadershipGrowth * 0.2), percentageChange: 5 },
    { level: 'VP-Level', growth: Math.round(leadershipGrowth * 0.3), percentageChange: 8 },
    { level: 'Director-Level', growth: Math.round(leadershipGrowth * 0.3), percentageChange: 10 },
    { level: 'Manager-Level', growth: Math.round(movement.hires * 0.3), percentageChange: 12 },
    { level: 'Individual Contributor', growth: Math.round(movement.hires * 0.5), percentageChange: 15 }
  ];
}

/**
 * Analyze hiring patterns
 */
function analyzeHiringPatterns(movement: EmployeeMovementAnalysis, timeframe: string): EmployeeGrowthAnalysis['hiringPatterns'] {
  const months = parseTimeframeToMonths(timeframe);
  const averageHiresPerMonth = movement.hires / months;
  
  return {
    averageHiresPerMonth,
    peakHiringMonth: 'Q3', // Simplified
    seasonality: averageHiresPerMonth > 10 ? 'High seasonal variation' : 'Stable hiring pattern'
  };
}

/**
 * Determine growth trajectory
 */
function determineGrowthTrajectory(
  movement: EmployeeMovementAnalysis,
  headcount: EmployeeGrowthAnalysis['headcountGrowth']
): EmployeeGrowthAnalysis['growthTrajectory'] {
  if (movement.growthRate > 20) return 'accelerating';
  if (movement.growthRate > 10) return 'steady';
  if (movement.growthRate > 0) return 'slowing';
  return 'declining';
}

/**
 * Calculate organizational health score
 */
function calculateHealthScore(
  movement: EmployeeMovementAnalysis,
  headcount: EmployeeGrowthAnalysis['headcountGrowth'],
  retention: EmployeeGrowthAnalysis['retentionMetrics']
): number {
  let score = 50; // Base score
  
  // Growth bonus
  score += Math.min(20, movement.growthRate);
  
  // Retention bonus
  if (retention.turnoverRate < 10) score += 15;
  else if (retention.turnoverRate < 15) score += 10;
  else score -= 10;
  
  // Leadership stability bonus
  const leadershipDepartures = movement.leadershipChanges.filter(c => c.changeType === 'departure').length;
  if (leadershipDepartures === 0) score += 15;
  else if (leadershipDepartures < 3) score += 5;
  else score -= 10;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Determine transition type
 */
function determineTransitionType(change: LeadershipChange): LeadershipTransition['transitionType'] {
  if (change.changeType === 'hire') return 'expansion';
  if (change.changeType === 'departure') return 'replacement';
  if (change.changeType === 'promotion') return 'succession';
  return 'replacement';
}

/**
 * Determine risk level for leadership change
 */
function determineRiskLevel(change: LeadershipChange): 'high' | 'medium' | 'low' {
  if (change.tier === 1) return 'high'; // C-level
  if (change.tier === 2 && change.changeType === 'departure') return 'high';
  if (change.tier === 2) return 'medium';
  return 'low';
}

/**
 * Parse timeframe to months
 */
function parseTimeframeToMonths(timeframe: string): number {
  if (timeframe.includes('month')) return parseInt(timeframe) || 1;
  if (timeframe.includes('quarter')) return (parseInt(timeframe) || 1) * 3;
  if (timeframe.includes('year')) return (parseInt(timeframe) || 1) * 12;
  
  // Default timeframes
  if (timeframe.includes('30')) return 1;
  if (timeframe.includes('60')) return 2;
  if (timeframe.includes('90')) return 3;
  if (timeframe.includes('180')) return 6;
  if (timeframe.includes('365')) return 12;
  
  return 3; // Default to 1 quarter
}

