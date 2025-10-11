/**
 * CORESIGNAL JOBS SERVICE
 * 
 * Sales intent detection and hiring trend analysis using CoreSignal jobs data
 * Following 2025 best practices: Pure functions, type-safe, composable
 * 
 * CoreSignal Jobs Data provides:
 * - Active job postings by company
 * - Hiring pattern analysis for sales intent signals
 * - Competitive hiring trend comparison
 * - Growth signal identification
 */

import type { APIClients } from '../types/api-clients';

// ============================================================================
// TYPES
// ============================================================================

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  department?: string;
  location?: string;
  seniorityLevel?: string;
  postedDate: string;
  expiryDate?: string;
  description?: string;
  requirements?: string[];
  responsibilities?: string[];
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  isRemote: boolean;
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'internship';
}

export interface SalesIntentSignal {
  company: string;
  intentScore: number; // 0-100
  timeframe: string;
  
  hiringSignals: {
    totalJobs: number;
    salesRoles: number;
    engineeringRoles: number;
    marketingRoles: number;
    leadershipRoles: number;
    customerSuccessRoles: number;
  };
  
  growthIndicators: GrowthIndicator[];
  
  // Trend analysis
  hiringVelocity: number; // Jobs per week
  departmentExpansion: string[]; // Departments with most hiring
  seniorityDistribution: {
    cLevel: number;
    vpLevel: number;
    directorLevel: number;
    managerLevel: number;
    icLevel: number;
  };
  
  // Intent classification
  intentType: 'aggressive_growth' | 'steady_expansion' | 'maintenance' | 'contraction';
  confidence: number; // 0-100
  
  // Metadata
  lastUpdated: string;
  dataSource: 'coresignal_jobs';
}

export interface GrowthIndicator {
  type: 'expansion' | 'new_market' | 'product_launch' | 'leadership_hire' | 'scale_up';
  description: string;
  evidence: string[];
  confidence: number; // 0-100
}

export interface HiringTrend {
  company: string;
  timeframe: string;
  
  totalJobs: number;
  jobsByDepartment: Record<string, number>;
  jobsBySeniority: Record<string, number>;
  jobsByLocation: Record<string, number>;
  
  monthlyHiringRate: number;
  trendDirection: 'increasing' | 'stable' | 'decreasing';
  percentageChange: number; // vs previous period
  
  topRoles: string[];
  emergingRoles: string[];
}

export interface CompetitiveHiringAnalysis {
  companies: string[];
  timeframe: string;
  
  rankings: {
    company: string;
    totalJobs: number;
    hiringRate: number;
    rank: number;
  }[];
  
  marketLeaders: string[];
  emergingPlayers: string[];
  
  averageHiringRate: number;
  topDepartments: string[];
  topLocations: string[];
}

// ============================================================================
// JOBS DATA FUNCTIONS
// ============================================================================

/**
 * Get active job postings for a company
 * 
 * @example
 * const jobs = await getCompanyJobPostings('Salesforce', apis);
 * // Returns all active job postings
 */
export async function getCompanyJobPostings(
  company: string,
  apis: APIClients,
  options: {
    timeframe?: string;
    department?: string;
    location?: string;
  } = {}
): Promise<JobPosting[]> {
  console.log(`📋 [CoreSignal Jobs] Getting job postings for: ${company}`);
  
  if (!apis.coreSignal) {
    console.warn('   ⚠️ CoreSignal API not configured');
    return [];
  }
  
  try {
    const response = await apis.coreSignal.getJobPostings({
      company_name: company,
      timeframe: options.timeframe || 'last_30_days',
      department: options.department,
      location: options.location
    });
    
    if (!response || !response.jobs) {
      console.log('   ❌ No job postings found');
      return [];
    }
    
    const jobs = response.jobs.map((job: any) => transformJobPosting(job));
    
    console.log(`   ✅ Found ${jobs.length} active job postings`);
    
    return jobs;
  } catch (error) {
    console.error('   ❌ Job postings error:', error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
}

/**
 * Detect sales intent from job posting patterns
 * 
 * @example
 * const intent = await detectSalesIntent('Salesforce', 'last_30_days', apis);
 * // Returns sales intent score and growth indicators
 */
export async function detectSalesIntent(
  company: string,
  timeframe: string = 'last_30_days',
  apis: APIClients
): Promise<SalesIntentSignal> {
  console.log(`🎯 [Sales Intent] Analyzing for: ${company} (${timeframe})`);
  
  const jobs = await getCompanyJobPostings(company, apis, { timeframe });
  
  if (jobs.length === 0) {
    console.log('   ⚠️ No jobs found, returning minimal intent');
    return getMinimalIntentSignal(company, timeframe);
  }
  
  // Analyze hiring signals
  const hiringSignals = analyzeHiringSignals(jobs);
  
  // Identify growth indicators
  const growthIndicators = identifyGrowthIndicators(jobs, hiringSignals);
  
  // Calculate intent score
  const intentScore = calculateIntentScore(hiringSignals, growthIndicators);
  
  // Determine hiring velocity
  const hiringVelocity = calculateHiringVelocity(jobs, timeframe);
  
  // Analyze department expansion
  const departmentExpansion = identifyExpandingDepartments(jobs);
  
  // Analyze seniority distribution
  const seniorityDistribution = analyzeSeniorityDistribution(jobs);
  
  // Classify intent type
  const { intentType, confidence } = classifyIntentType(hiringSignals, growthIndicators, hiringVelocity);
  
  const signal: SalesIntentSignal = {
    company,
    intentScore,
    timeframe,
    hiringSignals,
    growthIndicators,
    hiringVelocity,
    departmentExpansion,
    seniorityDistribution,
    intentType,
    confidence,
    lastUpdated: new Date().toISOString(),
    dataSource: 'coresignal_jobs'
  };
  
  console.log(`   ✅ Intent Score: ${intentScore}/100 (${intentType})`);
  console.log(`   📊 ${hiringSignals.totalJobs} jobs, ${hiringSignals.salesRoles} sales roles, ${hiringSignals.leadershipRoles} leadership`);
  
  return signal;
}

/**
 * Get hiring trends for a company
 * 
 * @example
 * const trends = await getHiringTrends(['Salesforce', 'HubSpot'], 'last_quarter', apis);
 */
export async function getHiringTrends(
  companies: string[],
  timeframe: string,
  apis: APIClients
): Promise<HiringTrend[]> {
  console.log(`📈 [Hiring Trends] Analyzing ${companies.length} companies (${timeframe})`);
  
  const trends: HiringTrend[] = [];
  
  for (const company of companies) {
    const jobs = await getCompanyJobPostings(company, apis, { timeframe });
    
    if (jobs.length === 0) {
      continue;
    }
    
    const trend = analyzeHiringTrend(company, timeframe, jobs);
    trends.push(trend);
  }
  
  console.log(`   ✅ Analyzed trends for ${trends.length} companies`);
  
  return trends;
}

/**
 * Identify growth signals from job postings
 * 
 * @example
 * const signals = await identifyGrowthSignals('Salesforce', apis);
 */
export async function identifyGrowthSignals(
  company: string,
  apis: APIClients
): Promise<GrowthIndicator[]> {
  console.log(`📊 [Growth Signals] Identifying for: ${company}`);
  
  const jobs = await getCompanyJobPostings(company, apis, { timeframe: 'last_30_days' });
  
  if (jobs.length === 0) {
    console.log('   ⚠️ No jobs found');
    return [];
  }
  
  const hiringSignals = analyzeHiringSignals(jobs);
  const growthIndicators = identifyGrowthIndicators(jobs, hiringSignals);
  
  console.log(`   ✅ Identified ${growthIndicators.length} growth signals`);
  
  return growthIndicators;
}

/**
 * Compare hiring across multiple companies
 */
export async function compareCompanyHiring(
  companies: string[],
  timeframe: string,
  apis: APIClients
): Promise<CompetitiveHiringAnalysis> {
  console.log(`🏆 [Competitive Analysis] Comparing ${companies.length} companies`);
  
  const rankings: any[] = [];
  
  for (const company of companies) {
    const jobs = await getCompanyJobPostings(company, apis, { timeframe });
    const hiringRate = calculateHiringVelocity(jobs, timeframe);
    
    rankings.push({
      company,
      totalJobs: jobs.length,
      hiringRate,
      rank: 0 // Will be assigned after sorting
    });
  }
  
  // Sort by total jobs and assign ranks
  rankings.sort((a, b) => b.totalJobs - a.totalJobs);
  rankings.forEach((item, index) => {
    item.rank = index + 1;
  });
  
  // Identify market leaders (top 20%)
  const leaderCount = Math.ceil(rankings.length * 0.2);
  const marketLeaders = rankings.slice(0, leaderCount).map(r => r.company);
  
  // Identify emerging players (high hiring rate, not in top 3)
  const emergingPlayers = rankings
    .filter((r, i) => i >= 3 && r.hiringRate > (rankings[0]?.hiringRate || 0) * 0.5)
    .map(r => r.company);
  
  const averageHiringRate = rankings.reduce((sum, r) => sum + r.hiringRate, 0) / rankings.length;
  
  const analysis: CompetitiveHiringAnalysis = {
    companies,
    timeframe,
    rankings,
    marketLeaders,
    emergingPlayers,
    averageHiringRate,
    topDepartments: [], // Would need all jobs to calculate
    topLocations: []
  };
  
  console.log(`   ✅ Market Leader: ${marketLeaders[0] || 'None'}`);
  console.log(`   📊 Average Hiring Rate: ${averageHiringRate.toFixed(1)} jobs/week`);
  
  return analysis;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Transform job posting data
 */
function transformJobPosting(job: any): JobPosting {
  return {
    id: job.id || job.job_id || '',
    title: job.title || job.job_title || '',
    company: job.company || job.company_name || '',
    department: job.department || determineDepartmentFromTitle(job.title || ''),
    location: job.location || job.location_name || '',
    seniorityLevel: job.seniority_level || determineSeniorityFromTitle(job.title || ''),
    postedDate: job.posted_date || job.created_at || '',
    expiryDate: job.expiry_date || job.expires_at,
    description: job.description,
    requirements: job.requirements || [],
    responsibilities: job.responsibilities || [],
    salary: job.salary,
    isRemote: job.is_remote || job.remote || false,
    employmentType: job.employment_type || 'full-time'
  };
}

/**
 * Analyze hiring signals from job postings
 */
function analyzeHiringSignals(jobs: JobPosting[]): SalesIntentSignal['hiringSignals'] {
  const signals = {
    totalJobs: jobs.length,
    salesRoles: 0,
    engineeringRoles: 0,
    marketingRoles: 0,
    leadershipRoles: 0,
    customerSuccessRoles: 0
  };
  
  for (const job of jobs) {
    const title = job.title.toLowerCase();
    const dept = (job.department || '').toLowerCase();
    
    // Sales roles
    if (title.includes('sales') || dept.includes('sales') || title.includes('account executive') || title.includes('business development')) {
      signals.salesRoles++;
    }
    
    // Engineering roles
    if (title.includes('engineer') || title.includes('developer') || title.includes('architect') || dept.includes('engineering')) {
      signals.engineeringRoles++;
    }
    
    // Marketing roles
    if (title.includes('marketing') || dept.includes('marketing')) {
      signals.marketingRoles++;
    }
    
    // Leadership roles
    if (title.includes('chief') || title.includes('vp') || title.includes('vice president') || title.includes('director')) {
      signals.leadershipRoles++;
    }
    
    // Customer Success roles
    if (title.includes('customer success') || title.includes('customer support') || title.includes('account manager')) {
      signals.customerSuccessRoles++;
    }
  }
  
  return signals;
}

/**
 * Identify growth indicators from hiring patterns
 */
function identifyGrowthIndicators(jobs: JobPosting[], signals: any): GrowthIndicator[] {
  const indicators: GrowthIndicator[] = [];
  
  // Aggressive hiring signal
  if (signals.totalJobs > 50) {
    indicators.push({
      type: 'scale_up',
      description: `Aggressive hiring with ${signals.totalJobs} open positions`,
      evidence: [`${signals.totalJobs} active job postings`, `Hiring across multiple departments`],
      confidence: 90
    });
  }
  
  // Leadership expansion
  if (signals.leadershipRoles > 5) {
    indicators.push({
      type: 'expansion',
      description: `Significant leadership expansion with ${signals.leadershipRoles} leadership roles`,
      evidence: [`${signals.leadershipRoles} leadership positions open`, 'Building out management team'],
      confidence: 85
    });
  }
  
  // Sales team expansion (strong sales intent)
  if (signals.salesRoles > 10) {
    indicators.push({
      type: 'expansion',
      description: `Major sales team expansion with ${signals.salesRoles} sales roles`,
      evidence: [`${signals.salesRoles} sales positions`, 'Scaling go-to-market team'],
      confidence: 95
    });
  }
  
  // Engineering expansion (product development)
  if (signals.engineeringRoles > 15) {
    indicators.push({
      type: 'product_launch',
      description: `Significant engineering hiring suggesting new product development`,
      evidence: [`${signals.engineeringRoles} engineering roles`, 'Building engineering capacity'],
      confidence: 80
    });
  }
  
  // New market expansion
  const locations = new Set(jobs.map(j => j.location).filter(Boolean));
  if (locations.size > 5) {
    indicators.push({
      type: 'new_market',
      description: `Expanding into ${locations.size} geographic markets`,
      evidence: [`Hiring in ${locations.size} locations`, Array.from(locations).slice(0, 5).join(', ')],
      confidence: 75
    });
  }
  
  return indicators;
}

/**
 * Calculate sales intent score (0-100)
 */
function calculateIntentScore(signals: any, indicators: GrowthIndicator[]): number {
  let score = 0;
  
  // Base score from total jobs
  score += Math.min(30, signals.totalJobs * 0.5);
  
  // Sales roles bonus
  score += Math.min(25, signals.salesRoles * 2);
  
  // Leadership roles bonus
  score += Math.min(15, signals.leadershipRoles * 3);
  
  // Growth indicators bonus
  score += Math.min(20, indicators.length * 5);
  
  // Engineering roles bonus (product development)
  score += Math.min(10, signals.engineeringRoles * 0.5);
  
  return Math.min(100, Math.round(score));
}

/**
 * Calculate hiring velocity (jobs per week)
 */
function calculateHiringVelocity(jobs: JobPosting[], timeframe: string): number {
  const weeks = parseTimeframeToWeeks(timeframe);
  return weeks > 0 ? jobs.length / weeks : 0;
}

/**
 * Identify expanding departments
 */
function identifyExpandingDepartments(jobs: JobPosting[]): string[] {
  const deptCounts: Record<string, number> = {};
  
  for (const job of jobs) {
    const dept = job.department || 'Unknown';
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  }
  
  return Object.entries(deptCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([dept]) => dept);
}

/**
 * Analyze seniority distribution
 */
function analyzeSeniorityDistribution(jobs: JobPosting[]): SalesIntentSignal['seniorityDistribution'] {
  const distribution = {
    cLevel: 0,
    vpLevel: 0,
    directorLevel: 0,
    managerLevel: 0,
    icLevel: 0
  };
  
  for (const job of jobs) {
    const level = job.seniorityLevel || determineSeniorityFromTitle(job.title);
    
    if (level === 'C-Level') distribution.cLevel++;
    else if (level === 'VP-Level') distribution.vpLevel++;
    else if (level === 'Director-Level') distribution.directorLevel++;
    else if (level === 'Manager-Level') distribution.managerLevel++;
    else distribution.icLevel++;
  }
  
  return distribution;
}

/**
 * Classify intent type
 */
function classifyIntentType(
  signals: any,
  indicators: GrowthIndicator[],
  velocity: number
): { intentType: SalesIntentSignal['intentType']; confidence: number } {
  const score = calculateIntentScore(signals, indicators);
  
  if (score >= 75) {
    return { intentType: 'aggressive_growth', confidence: 90 };
  }
  if (score >= 50) {
    return { intentType: 'steady_expansion', confidence: 80 };
  }
  if (score >= 25) {
    return { intentType: 'maintenance', confidence: 70 };
  }
  return { intentType: 'contraction', confidence: 60 };
}

/**
 * Analyze hiring trend for a company
 */
function analyzeHiringTrend(company: string, timeframe: string, jobs: JobPosting[]): HiringTrend {
  const jobsByDepartment: Record<string, number> = {};
  const jobsBySeniority: Record<string, number> = {};
  const jobsByLocation: Record<string, number> = {};
  
  for (const job of jobs) {
    const dept = job.department || 'Unknown';
    const seniority = job.seniorityLevel || 'Unknown';
    const location = job.location || 'Unknown';
    
    jobsByDepartment[dept] = (jobsByDepartment[dept] || 0) + 1;
    jobsBySeniority[seniority] = (jobsBySeniority[seniority] || 0) + 1;
    jobsByLocation[location] = (jobsByLocation[location] || 0) + 1;
  }
  
  const monthlyHiringRate = jobs.length / (parseTimeframeToWeeks(timeframe) / 4.33);
  
  const topRoles = Object.entries(jobsByDepartment)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([role]) => role);
  
  return {
    company,
    timeframe,
    totalJobs: jobs.length,
    jobsByDepartment,
    jobsBySeniority,
    jobsByLocation,
    monthlyHiringRate,
    trendDirection: 'stable', // Would need historical data
    percentageChange: 0, // Would need historical data
    topRoles,
    emergingRoles: []
  };
}

/**
 * Helper: Determine department from title
 */
function determineDepartmentFromTitle(title: string): string {
  const normalized = title.toLowerCase();
  
  if (normalized.includes('sales') || normalized.includes('account executive')) return 'Sales';
  if (normalized.includes('engineer') || normalized.includes('developer')) return 'Engineering';
  if (normalized.includes('marketing')) return 'Marketing';
  if (normalized.includes('product')) return 'Product';
  if (normalized.includes('customer success') || normalized.includes('support')) return 'Customer Success';
  if (normalized.includes('finance') || normalized.includes('accounting')) return 'Finance';
  if (normalized.includes('hr') || normalized.includes('people')) return 'Human Resources';
  if (normalized.includes('operations')) return 'Operations';
  
  return 'Other';
}

/**
 * Helper: Determine seniority from title
 */
function determineSeniorityFromTitle(title: string): string {
  const normalized = title.toLowerCase();
  
  if (normalized.includes('chief') || normalized.includes('ceo') || normalized.includes('president')) return 'C-Level';
  if (normalized.includes('vp') || normalized.includes('vice president')) return 'VP-Level';
  if (normalized.includes('director') || normalized.includes('head of')) return 'Director-Level';
  if (normalized.includes('manager') || normalized.includes('lead')) return 'Manager-Level';
  
  return 'Individual Contributor';
}

/**
 * Helper: Parse timeframe to weeks
 */
function parseTimeframeToWeeks(timeframe: string): number {
  if (timeframe.includes('week')) return parseInt(timeframe) || 1;
  if (timeframe.includes('month')) return (parseInt(timeframe) || 1) * 4.33;
  if (timeframe.includes('quarter')) return (parseInt(timeframe) || 1) * 13;
  if (timeframe.includes('year')) return (parseInt(timeframe) || 1) * 52;
  
  // Default timeframes
  if (timeframe.includes('30')) return 4.33;
  if (timeframe.includes('60')) return 8.66;
  if (timeframe.includes('90')) return 13;
  
  return 4.33; // Default to 1 month
}

/**
 * Get minimal intent signal (when no data available)
 */
function getMinimalIntentSignal(company: string, timeframe: string): SalesIntentSignal {
  return {
    company,
    intentScore: 0,
    timeframe,
    hiringSignals: {
      totalJobs: 0,
      salesRoles: 0,
      engineeringRoles: 0,
      marketingRoles: 0,
      leadershipRoles: 0,
      customerSuccessRoles: 0
    },
    growthIndicators: [],
    hiringVelocity: 0,
    departmentExpansion: [],
    seniorityDistribution: {
      cLevel: 0,
      vpLevel: 0,
      directorLevel: 0,
      managerLevel: 0,
      icLevel: 0
    },
    intentType: 'contraction',
    confidence: 50,
    lastUpdated: new Date().toISOString(),
    dataSource: 'coresignal_jobs'
  };
}

