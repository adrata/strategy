/**
 * Title Extraction Utility
 * 
 * Intelligently extracts the most accurate current title from work experience,
 * prioritizing company-matched roles over the most recent role.
 * 
 * Solves the issue where side roles (e.g., "Team 91 Lacross Coach") appear
 * before primary professional roles on LinkedIn.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface WorkExperience {
  company: string;
  companyId?: string;
  title: string;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
  location?: string;
  summary?: string;
}

export interface TitleExtractionInput {
  workHistory?: WorkExperience[];
  experience?: CoreSignalExperience[];
  active_experience_title?: string;
  job_title?: string;
}

export interface CoreSignalExperience {
  company_name?: string;
  company_id?: string;
  position_title?: string;
  title?: string;
  active_experience?: 0 | 1;
  date_from?: string;
  date_to?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
}

export interface TitleExtractionResult {
  title: string | null;
  source: 'company-matched' | 'current-role' | 'recent-role' | 'api-default' | 'manual' | 'input';
  confidence: number; // 0-100
  matchedCompany: string | null;
  isCurrent: boolean;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Normalize company name for matching
 * Removes common suffixes and normalizes case/punctuation
 */
export function normalizeCompanyName(name: string | null | undefined): string {
  if (!name) return '';
  return name.toLowerCase()
    .replace(/\s+(inc|llc|ltd|corp|corporation|company|co)\.?$/i, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Check if a role is a professional role (not a side role)
 */
export function isProfessionalRole(title: string | null | undefined): boolean {
  if (!title) return true; // Default to professional if unknown
  
  const titleLower = title.toLowerCase();
  const sideRoleKeywords = [
    'coach', 'volunteer', 'advisor', 'adviser', 'board member',
    'board of directors', 'consultant', 'freelance', 'contractor',
    'mentor', 'tutor', 'instructor', 'volunteer', 'advisory board'
  ];
  
  // Check if title contains side role keywords
  return !sideRoleKeywords.some(keyword => titleLower.includes(keyword));
}

/**
 * Calculate seniority score for a role title
 */
export function calculateSeniorityScore(title: string | null | undefined): number {
  if (!title) return 10;
  
  const titleLower = title.toLowerCase();
  
  // C-level
  if (titleLower.match(/\b(c|chief)\s+(executive|technology|financial|marketing|operating|product|revenue|information|security|data|people|human|legal)\s+(officer|president)\b/i)) {
    return 100;
  }
  
  // VP level
  if (titleLower.includes('vp') || titleLower.includes('vice president')) {
    return 80;
  }
  
  // Director
  if (titleLower.includes('director') || titleLower.includes('head of')) {
    return 60;
  }
  
  // Manager/Lead
  if (titleLower.includes('manager') || titleLower.includes('lead') || titleLower.includes('principal')) {
    return 40;
  }
  
  // Individual Contributor
  if (titleLower.includes('engineer') || titleLower.includes('developer') || 
      titleLower.includes('analyst') || titleLower.includes('specialist') ||
      titleLower.includes('designer') || titleLower.includes('architect')) {
    return 20;
  }
  
  return 10; // Other
}

/**
 * Convert CoreSignal experience to unified WorkExperience format
 */
function convertCoreSignalExperience(exp: CoreSignalExperience): WorkExperience {
  const title = exp.position_title || exp.title || '';
  const company = exp.company_name || '';
  
  // Determine if current
  const isCurrent = exp.active_experience === 1 || 
                    exp.is_current === true ||
                    !exp.end_date && !exp.date_to;
  
  return {
    company,
    companyId: exp.company_id,
    title,
    startDate: exp.start_date || exp.date_from,
    endDate: exp.end_date || exp.date_to,
    isCurrent,
  };
}

/**
 * Calculate role score for selection when multiple matches exist
 */
function calculateRoleScore(
  role: WorkExperience,
  leadCompanyId: string | null
): number {
  let score = 0;
  
  // Company ID match = 1000 points (strongest signal)
  if (leadCompanyId && role.companyId === leadCompanyId) {
    score += 1000;
  }
  
  // Professional role = 100 points
  if (isProfessionalRole(role.title)) {
    score += 100;
  }
  
  // Seniority score (0-100)
  score += calculateSeniorityScore(role.title);
  
  // Tenure bonus (earlier start = more established)
  if (role.startDate) {
    try {
      const startDate = new Date(role.startDate);
      const yearsAgo = (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      score += Math.min(yearsAgo * 10, 50); // Max 50 points for 5+ years
    } catch {
      // Invalid date, skip tenure bonus
    }
  }
  
  return score;
}

/**
 * Select the best role from multiple matching roles
 */
function selectBestRole(
  roles: WorkExperience[],
  leadCompany: string | null,
  leadCompanyId: string | null
): WorkExperience | null {
  if (roles.length === 0) return null;
  if (roles.length === 1) return roles[0];
  
  // If no company to match, return most recent current role
  if (!leadCompany && !leadCompanyId) {
    const currentRoles = roles.filter(r => r.isCurrent);
    if (currentRoles.length > 0) {
      return currentRoles.sort((a, b) => {
        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
        return dateB - dateA; // Most recent first
      })[0];
    }
    // No current roles, return most recent overall
    return roles.sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return dateB - dateA;
    })[0];
  }
  
  const normalizedLeadCompany = normalizeCompanyName(leadCompany);
  
  // Find all current roles at matching company
  const matchingRoles = roles.filter(role => {
    if (!role.isCurrent) return false;
    
    // Company ID match (strongest)
    if (leadCompanyId && role.companyId === leadCompanyId) return true;
    
    // Company name match
    if (leadCompany) {
      const normalizedRoleCompany = normalizeCompanyName(role.company);
      return normalizedRoleCompany === normalizedLeadCompany ||
             normalizedRoleCompany.includes(normalizedLeadCompany) ||
             normalizedLeadCompany.includes(normalizedRoleCompany);
    }
    
    return false;
  });
  
  if (matchingRoles.length === 0) {
    // No match, return most recent current role (any company)
    const currentRoles = roles.filter(r => r.isCurrent);
    if (currentRoles.length > 0) {
      return currentRoles.sort((a, b) => {
        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
        return dateB - dateA;
      })[0];
    }
    // No current roles, return most recent overall
    return roles.sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return dateB - dateA;
    })[0];
  }
  
  if (matchingRoles.length === 1) {
    return matchingRoles[0];
  }
  
  // Multiple matches - apply selection criteria
  const scoredRoles = matchingRoles.map(role => ({
    role,
    score: calculateRoleScore(role, leadCompanyId)
  }));
  
  scoredRoles.sort((a, b) => b.score - a.score);
  return scoredRoles[0].role;
}

/**
 * Extract the best current title from work experience
 * 
 * Priority:
 * 1. Manual entry (if provided and should be preserved)
 * 2. Company-matched current role
 * 3. Most recent current role (any company)
 * 4. Most recent role overall
 * 5. API default (active_experience_title or job_title)
 * 6. Input title
 */
export function extractBestCurrentTitle(
  input: TitleExtractionInput,
  leadCompany: string | null,
  leadCompanyId: string | null,
  manualTitle: string | null
): TitleExtractionResult {
  // If manual title exists and should be preserved, use it
  if (manualTitle) {
    return {
      title: manualTitle,
      source: 'manual',
      confidence: 100,
      matchedCompany: null,
      isCurrent: true
    };
  }
  
  // Convert work experience to unified format
  let workHistory: WorkExperience[] = [];
  
  if (input.workHistory && Array.isArray(input.workHistory)) {
    workHistory = input.workHistory;
  } else if (input.experience && Array.isArray(input.experience)) {
    workHistory = input.experience
      .map(convertCoreSignalExperience)
      .filter(exp => exp.title && exp.company); // Filter out invalid entries
  }
  
  // Filter to current roles only
  const currentRoles = workHistory.filter(role => role.isCurrent);
  
  // Try to find company-matched role
  if (leadCompany || leadCompanyId) {
    const matchedRole = selectBestRole(currentRoles, leadCompany, leadCompanyId);
    
    if (matchedRole) {
      const normalizedLeadCompany = normalizeCompanyName(leadCompany);
      const normalizedMatchedCompany = normalizeCompanyName(matchedRole.company);
      const isCompanyMatch = normalizedMatchedCompany === normalizedLeadCompany ||
                            normalizedMatchedCompany.includes(normalizedLeadCompany) ||
                            normalizedLeadCompany.includes(normalizedMatchedCompany) ||
                            (leadCompanyId && matchedRole.companyId === leadCompanyId);
      
      return {
        title: matchedRole.title,
        source: isCompanyMatch ? 'company-matched' : 'current-role',
        confidence: isCompanyMatch ? 95 : 80,
        matchedCompany: matchedRole.company,
        isCurrent: true
      };
    }
  }
  
  // Fallback to most recent current role (any company)
  if (currentRoles.length > 0) {
    const mostRecent = currentRoles.sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return dateB - dateA;
    })[0];
    
    return {
      title: mostRecent.title,
      source: 'current-role',
      confidence: 70,
      matchedCompany: mostRecent.company,
      isCurrent: true
    };
  }
  
  // Fallback to most recent role overall
  if (workHistory.length > 0) {
    const mostRecent = workHistory.sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return dateB - dateA;
    })[0];
    
    return {
      title: mostRecent.title,
      source: 'recent-role',
      confidence: 50,
      matchedCompany: mostRecent.company,
      isCurrent: mostRecent.isCurrent
    };
  }
  
  // Fallback to API defaults
  if (input.active_experience_title) {
    return {
      title: input.active_experience_title,
      source: 'api-default',
      confidence: 60,
      matchedCompany: null,
      isCurrent: true
    };
  }
  
  if (input.job_title) {
    return {
      title: input.job_title,
      source: 'api-default',
      confidence: 60,
      matchedCompany: null,
      isCurrent: true
    };
  }
  
  // No title found
  return {
    title: null,
    source: 'input',
    confidence: 0,
    matchedCompany: null,
    isCurrent: false
  };
}

