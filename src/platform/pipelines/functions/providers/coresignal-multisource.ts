/**
 * CORESIGNAL MULTI-SOURCE SERVICE
 * 
 * Enhanced CoreSignal integration using multi-source employee data
 * Following 2025 best practices: Pure functions, type-safe, composable
 * 
 * CoreSignal Multi-Source provides:
 * - Comprehensive employee profiles from multiple sources
 * - Historical employee movement tracking
 * - Leadership change detection
 * - Multi-source data verification
 */

import type { APIClients } from '../types/api-clients';

// ============================================================================
// TYPES
// ============================================================================

export interface MultiSourceEmployeeProfile {
  id: string;
  name: string;
  title: string;
  company: string;
  
  // Multi-source verification
  sources: string[]; // ['linkedin', 'company_website', 'job_boards']
  verificationScore: number; // 0-100
  lastUpdated: string;
  
  // Contact information
  email?: string;
  phone?: string;
  linkedIn?: string;
  
  // Location
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  
  // Career details
  department?: string;
  seniorityLevel?: string;
  yearsAtCompany?: number;
  totalExperience?: number;
  
  // Historical data
  roleChanges: RoleChange[];
  companyChanges: CompanyChange[];
  
  // Metadata
  dataQuality: number; // 0-100
  enrichmentLevel: 'basic' | 'standard' | 'comprehensive';
}

export interface RoleChange {
  fromTitle: string;
  toTitle: string;
  company: string;
  changeDate: string;
  type: 'promotion' | 'lateral' | 'demotion' | 'role_change';
  impactLevel: 'high' | 'medium' | 'low';
}

export interface CompanyChange {
  fromCompany: string;
  toCompany: string;
  fromTitle: string;
  toTitle: string;
  changeDate: string;
  reason?: string; // 'career_growth' | 'acquisition' | 'layoff' | 'unknown'
}

export interface EmployeeMovementAnalysis {
  company: string;
  timeframe: string;
  hires: number;
  departures: number;
  promotions: number;
  roleChanges: number;
  netGrowth: number;
  turnoverRate: number;
  growthRate: number;
  leadershipChanges: LeadershipChange[];
}

export interface LeadershipChange {
  role: string;
  tier: number; // 1=C-level, 2=VP, 3=Director
  changeType: 'hire' | 'departure' | 'promotion' | 'demotion';
  person: string;
  date: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
}

export interface HistoricalEmployeeData {
  employees: MultiSourceEmployeeProfile[];
  snapshotDate: string;
  totalCount: number;
  changes: EmployeeChange[];
}

export interface EmployeeChange {
  type: 'hire' | 'departure' | 'promotion' | 'role_change';
  employee: string;
  fromRole?: string;
  toRole?: string;
  date: string;
  tier?: number;
  impact: 'high' | 'medium' | 'low';
}

// CoreSignal API Response Interfaces
export interface CoreSignalAPIEmployee {
  id?: string;
  member_id?: string;
  name?: string;
  full_name?: string;
  title?: string;
  job_title?: string;
  company?: string;
  company_name?: string;
  sources?: string[];
  last_updated?: string;
  years_at_company?: number;
  company_history?: Array<{
    company?: string;
    from_company?: string;
    to_company?: string;
    start_date?: string;
    end_date?: string;
  }>;
  role_history?: Array<{
    title?: string;
    company?: string;
    start_date?: string;
    end_date?: string;
  }>;
  location?: string;
  industry?: string;
  seniority_level?: string;
  department?: string;
  team_size?: number;
  reporting_to?: string;
  direct_reports?: number;
  skills?: string[];
  education?: Array<{
    school?: string;
    degree?: string;
    field?: string;
    graduation_year?: number;
  }>;
  certifications?: string[];
  languages?: string[];
  linkedin_url?: string;
  email?: string;
  phone?: string;
  profile_picture?: string;
  summary?: string;
  headline?: string;
  experience_years?: number;
  is_current?: boolean;
  start_date?: string;
  end_date?: string;
}

export interface CoreSignalAPIChanges {
  changes?: Array<{
    type?: string;
    employee_name?: string;
    old_role?: string;
    new_role?: string;
    date?: string;
    company?: string;
  }>;
}

export interface CoreSignalAPIHistory {
  history?: Array<{
    title?: string;
    company?: string;
    start_date?: string;
    end_date?: string;
  }>;
}

// ============================================================================
// MULTI-SOURCE EMPLOYEE FUNCTIONS
// ============================================================================

/**
 * Get comprehensive multi-source employee profiles
 * 
 * @example
 * const profiles = await getMultiSourceEmployeeProfiles('Salesforce', apis);
 * // Returns employees with data from LinkedIn, company website, job boards, etc.
 */
export async function getMultiSourceEmployeeProfiles(
  company: string,
  apis: APIClients,
  options: {
    includeHistorical?: boolean;
    enrichmentLevel?: 'basic' | 'standard' | 'comprehensive';
  } = {}
): Promise<MultiSourceEmployeeProfile[]> {
  console.log(`🔍 [CoreSignal Multi-Source] Getting employee profiles for: ${company}`);
  
  if (!apis.coreSignal) {
    console.warn('   ⚠️ CoreSignal API not configured');
    return [];
  }
  
  try {
    // Use CoreSignal's multi-source employee API
    const response = await apis.coreSignal.searchEmployees({
      company_name: company,
      multi_source: true,
      include_historical: options.includeHistorical || false,
      enrichment_level: options.enrichmentLevel || 'standard'
    });
    
    if (!response || !response.employees) {
      console.log('   ❌ No employees found');
      return [];
    }
    
    const profiles = response.employees.map((emp: CoreSignalAPIEmployee) => transformToMultiSourceProfile(emp));
    
    console.log(`   ✅ Found ${profiles.length} employees with multi-source verification`);
    
    return profiles;
  } catch (error) {
    console.error('   ❌ Multi-source employee error:', error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
}

/**
 * Track employee changes over time
 * 
 * @example
 * const changes = await trackEmployeeChanges('Salesforce', 'last_6_months', apis);
 * // Returns hires, departures, promotions, role changes
 */
export async function trackEmployeeChanges(
  company: string,
  timeframe: string,
  apis: APIClients
): Promise<EmployeeMovementAnalysis> {
  console.log(`📊 [CoreSignal] Tracking employee changes for: ${company} (${timeframe})`);
  
  if (!apis.coreSignal) {
    console.warn('   ⚠️ CoreSignal API not configured');
    return getEmptyMovementAnalysis(company, timeframe);
  }
  
  try {
    const response = await apis.coreSignal.getEmployeeChanges({
      company_name: company,
      timeframe: timeframe
    });
    
    if (!response || !response.changes) {
      console.log('   ❌ No employee changes found');
      return getEmptyMovementAnalysis(company, timeframe);
    }
    
    const analysis = analyzeEmployeeMovement(company, timeframe, response.changes);
    
    console.log(`   ✅ Found ${analysis.hires} hires, ${analysis.departures} departures, ${analysis.promotions} promotions`);
    
    return analysis;
  } catch (error) {
    console.error('   ❌ Employee tracking error:', error instanceof Error ? error.message : 'Unknown error');
    return getEmptyMovementAnalysis(company, timeframe);
  }
}

/**
 * Get employee work history from multi-source data
 */
export async function getEmployeeWorkHistory(
  employeeName: string,
  apis: APIClients
): Promise<RoleChange[]> {
  console.log(`📜 [CoreSignal] Getting work history for: ${employeeName}`);
  
  if (!apis.coreSignal) {
    console.warn('   ⚠️ CoreSignal API not configured');
    return [];
  }
  
  try {
    const response = await apis.coreSignal.getEmployeeHistory({
      name: employeeName,
      include_role_changes: true
    });
    
    if (!response || !response.history) {
      console.log('   ❌ No work history found');
      return [];
    }
    
    const roleChanges = response.history.map((item: CoreSignalAPIHistory['history'][0]) => ({
      fromTitle: item.from_title || '',
      toTitle: item.to_title || '',
      company: item.company || '',
      changeDate: item.change_date || '',
      type: determineChangeType(item.from_title, item.to_title),
      impactLevel: determineImpactLevel(item.from_title, item.to_title)
    }));
    
    console.log(`   ✅ Found ${roleChanges.length} role changes`);
    
    return roleChanges;
  } catch (error) {
    console.error('   ❌ Work history error:', error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
}

/**
 * Detect leadership changes (C-level, VP-level)
 * 
 * @example
 * const changes = await detectLeadershipChanges('Salesforce', 'last_quarter', apis);
 * // Returns C-level and VP-level hires, departures, promotions
 */
export async function detectLeadershipChanges(
  company: string,
  timeframe: string,
  apis: APIClients
): Promise<LeadershipChange[]> {
  console.log(`👔 [CoreSignal] Detecting leadership changes for: ${company} (${timeframe})`);
  
  const allChanges = await trackEmployeeChanges(company, timeframe, apis);
  
  // Filter for leadership-level changes only
  const leadershipChanges = allChanges.leadershipChanges;
  
  console.log(`   ✅ Found ${leadershipChanges.length} leadership changes`);
  
  return leadershipChanges;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Transform CoreSignal employee data to multi-source profile
 */
function transformToMultiSourceProfile(employee: CoreSignalAPIEmployee): MultiSourceEmployeeProfile {
  return {
    id: employee.id || employee.member_id || '',
    name: employee.name || employee.full_name || '',
    title: employee.title || employee.job_title || '',
    company: employee.company || employee.company_name || '',
    
    sources: employee.sources || ['coresignal'],
    verificationScore: calculateVerificationScore(employee.sources || []),
    lastUpdated: employee.last_updated || new Date().toISOString(),
    
    email: employee.email,
    phone: employee.phone,
    linkedIn: employee.linkedin_url || employee.url,
    
    location: employee.location,
    city: employee.city,
    state: employee.state,
    country: employee.country,
    
    department: employee.department,
    seniorityLevel: determineSeniorityLevel(employee.title),
    yearsAtCompany: employee.years_at_company,
    totalExperience: employee.total_experience,
    
    roleChanges: parseRoleChanges(employee.role_history || []),
    companyChanges: parseCompanyChanges(employee.company_history || []),
    
    dataQuality: calculateMultiSourceDataQuality(employee),
    enrichmentLevel: employee.enrichment_level || 'standard'
  };
}

/**
 * Calculate verification score based on number of sources
 */
function calculateVerificationScore(sources: string[]): number {
  const baseScore = 40;
  const sourceBonus = sources.length * 15; // +15 per source
  return Math.min(100, baseScore + sourceBonus);
}

/**
 * Determine seniority level from title
 */
function determineSeniorityLevel(title: string): string {
  const normalized = title.toLowerCase();
  
  if (normalized.includes('chief') || normalized.includes('ceo') || normalized.includes('president')) {
    return 'C-Level';
  }
  if (normalized.includes('vp') || normalized.includes('vice president')) {
    return 'VP-Level';
  }
  if (normalized.includes('director') || normalized.includes('head of')) {
    return 'Director-Level';
  }
  if (normalized.includes('manager') || normalized.includes('lead')) {
    return 'Manager-Level';
  }
  return 'Individual Contributor';
}

/**
 * Parse role changes from history
 */
function parseRoleChanges(history: CoreSignalAPIHistory['history']): RoleChange[] {
  return history.map(item => ({
    fromTitle: item.from_title || '',
    toTitle: item.to_title || '',
    company: item.company || '',
    changeDate: item.date || '',
    type: determineChangeType(item.from_title, item.to_title),
    impactLevel: determineImpactLevel(item.from_title, item.to_title)
  }));
}

/**
 * Parse company changes from history
 */
function parseCompanyChanges(history: CoreSignalAPIEmployee['company_history']): CompanyChange[] {
  return history.map(item => ({
    fromCompany: item.from_company || '',
    toCompany: item.to_company || '',
    fromTitle: item.from_title || '',
    toTitle: item.to_title || '',
    changeDate: item.date || '',
    reason: item.reason
  }));
}

/**
 * Determine change type (promotion, lateral, etc.)
 */
function determineChangeType(fromTitle: string, toTitle: string): 'promotion' | 'lateral' | 'demotion' | 'role_change' {
  const fromLevel = determineSeniorityLevel(fromTitle);
  const toLevel = determineSeniorityLevel(toTitle);
  
  const levels = ['Individual Contributor', 'Manager-Level', 'Director-Level', 'VP-Level', 'C-Level'];
  const fromIndex = levels.indexOf(fromLevel);
  const toIndex = levels.indexOf(toLevel);
  
  if (toIndex > fromIndex) return 'promotion';
  if (toIndex < fromIndex) return 'demotion';
  if (fromTitle !== toTitle) return 'role_change';
  return 'lateral';
}

/**
 * Determine impact level of role change
 */
function determineImpactLevel(fromTitle: string, toTitle: string): 'high' | 'medium' | 'low' {
  const fromLevel = determineSeniorityLevel(fromTitle);
  const toLevel = determineSeniorityLevel(toTitle);
  
  if (fromLevel === 'C-Level' || toLevel === 'C-Level') return 'high';
  if (fromLevel === 'VP-Level' || toLevel === 'VP-Level') return 'high';
  if (fromLevel === 'Director-Level' || toLevel === 'Director-Level') return 'medium';
  return 'low';
}

/**
 * Analyze employee movement
 */
function analyzeEmployeeMovement(
  company: string,
  timeframe: string,
  changes: CoreSignalAPIChanges['changes']
): EmployeeMovementAnalysis {
  const hires = changes.filter(c => c.type === 'hire').length;
  const departures = changes.filter(c => c.type === 'departure').length;
  const promotions = changes.filter(c => c.type === 'promotion').length;
  const roleChanges = changes.filter(c => c.type === 'role_change').length;
  
  const netGrowth = hires - departures;
  const totalEmployees = changes.length || 1; // Avoid division by zero
  const turnoverRate = (departures / totalEmployees) * 100;
  const growthRate = (netGrowth / totalEmployees) * 100;
  
  const leadershipChanges: LeadershipChange[] = changes
    .filter(c => {
      const level = determineSeniorityLevel(c.to_title || c.from_title || '');
      return level === 'C-Level' || level === 'VP-Level';
    })
    .map(c => ({
      role: c.to_title || c.from_title || '',
      tier: determineSeniorityLevel(c.to_title || c.from_title || '') === 'C-Level' ? 1 : 2,
      changeType: c.type,
      person: c.name || '',
      date: c.date || '',
      impact: determineImpactLevel(c.from_title || '', c.to_title || '') as 'critical' | 'high' | 'medium' | 'low'
    }));
  
  return {
    company,
    timeframe,
    hires,
    departures,
    promotions,
    roleChanges,
    netGrowth,
    turnoverRate,
    growthRate,
    leadershipChanges
  };
}

/**
 * Calculate data quality for multi-source profile
 */
function calculateMultiSourceDataQuality(data: CoreSignalAPIEmployee): number {
  let score = 0;
  let maxScore = 0;
  
  // Multi-source verification (30 points)
  maxScore += 30;
  if (data.sources && data.sources.length > 0) {
    score += Math.min(30, data.sources.length * 10);
  }
  
  // Basic info (20 points)
  maxScore += 20;
  if (data.name) score += 10;
  if (data.title) score += 5;
  if (data.company) score += 5;
  
  // Contact info (20 points)
  maxScore += 20;
  if (data.email) score += 10;
  if (data.phone) score += 5;
  if (data.linkedin_url) score += 5;
  
  // Historical data (20 points)
  maxScore += 20;
  if (data.role_history && data.role_history.length > 0) score += 10;
  if (data.company_history && data.company_history.length > 0) score += 10;
  
  // Location (10 points)
  maxScore += 10;
  if (data.location) score += 5;
  if (data.country) score += 5;
  
  return Math.round((score / maxScore) * 100);
}

/**
 * Get empty movement analysis (fallback)
 */
function getEmptyMovementAnalysis(company: string, timeframe: string): EmployeeMovementAnalysis {
  return {
    company,
    timeframe,
    hires: 0,
    departures: 0,
    promotions: 0,
    roleChanges: 0,
    netGrowth: 0,
    turnoverRate: 0,
    growthRate: 0,
    leadershipChanges: []
  };
}

